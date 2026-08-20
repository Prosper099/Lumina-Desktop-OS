import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../context/OSContext';
import { 
  Mic, 
  Sparkles, 
  X, 
  Volume2, 
  Maximize2, 
  HelpCircle, 
  Layers, 
  Radio, 
  AudioLines,
  Minimize2,
  ScreenShare,
  Move
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { captureDesktopDOM } from '../utils/screenCapture';

export const ScreenVisionHUD: React.FC = () => {
  const { 
    isScreenVisionActive, 
    setIsScreenVisionActive, 
    screenVisionThumbnail, 
    setScreenVisionThumbnail,
    windows, 
    activeWindowId,
    openWindow,
    addNotification
  } = useOS();

  // Expanded popover open/closed state (default is collapsed as a small bubble)
  const [isOpen, setIsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastAdvice, setLastAdvice] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Active app title
  const activeWin = windows.find(w => w.id === activeWindowId);
  const activeAppTitle = activeWin ? activeWin.title : 'Desktop Workspace';
  const openAppTitles = windows.map(w => w.title);

  // Audio helper
  const playAudio = (base64Data: string, text: string) => {
    try {
      if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch (_) {}
      }
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx({ sampleRate: 24000 });
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }

      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = audioCtxRef.current.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = audioCtxRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtxRef.current.destination);
      currentSourceRef.current = source;

      setIsSpeaking(true);
      source.onended = () => {
        setIsSpeaking(false);
      };
      source.start(0);
    } catch (err) {
      console.warn("HUD audio play error, falling back to speech synthesis:", err);
      fallbackSpeak(text);
    }
  };

  const fallbackSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (_) {}
  };

  // Capture screen and query Lumina AI
  const askLuminaVision = async (promptText = "Look at my screen and active app. What should I do next?") => {
    setIsThinking(true);
    setIsListening(false);

    try {
      const screenshot = await captureDesktopDOM('lumina-desktop-workstage');
      if (screenshot) {
        setScreenVisionThumbnail(screenshot);
      }

      const response = await fetch('/api/gemini/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          image: screenshot,
          screenContext: {
            activeApp: activeAppTitle,
            openApps: openAppTitles
          },
          voice: 'Zephyr'
        })
      });

      const data = await response.json();
      const reply = data.reply || "I see your screen. You can continue interacting with your open application.";
      setLastAdvice(reply);
      setIsThinking(false);

      if (data.audio) {
        playAudio(data.audio, reply);
      } else {
        fallbackSpeak(reply);
      }
    } catch (err) {
      console.error("Screen Vision query error:", err);
      setIsThinking(false);
      const fallback = `I'm observing ${activeAppTitle}. You can click anywhere to interact or ask me for instructions.`;
      setLastAdvice(fallback);
      fallbackSpeak(fallback);
    }
  };

  // Start Mic Voice Input
  const startSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      askLuminaVision("What should I do right now on this screen?");
      return;
    }

    try {
      if (isSpeaking) {
        if (currentSourceRef.current) try { currentSourceRef.current.stop(); } catch (_) {}
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (e: any) => {
        const spoken = e.results?.[0]?.[0]?.transcript;
        if (spoken) {
          askLuminaVision(spoken);
        }
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch {
      setIsListening(false);
      askLuminaVision("What should I do next?");
    }
  };

  // Automatically collapse popover if clicking outside
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#lumina-ai-screen-bubble-root')) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('mousedown', handleGlobalClick);
      return () => window.removeEventListener('mousedown', handleGlobalClick);
    }
  }, [isOpen]);

  if (!isScreenVisionActive) return null;

  return (
    <div 
      id="lumina-ai-screen-bubble-root"
      className="fixed z-[9990] pointer-events-auto select-none top-14 right-4 sm:right-6"
    >
      <motion.div
        drag
        dragMomentum={false}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="relative flex flex-col items-end"
      >
        {/* Floating Mini AI Bubble */}
        <div className="relative group">
          {/* Pulsating Halo Rings when Speaking or Listening */}
          <div 
            className={`absolute -inset-1.5 rounded-full transition-all duration-300 pointer-events-none ${
              isSpeaking 
                ? 'bg-pink-500/40 animate-ping' 
                : isListening 
                  ? 'bg-emerald-500/40 animate-ping' 
                  : isThinking 
                    ? 'bg-indigo-500/30 animate-pulse' 
                    : 'bg-purple-500/20 group-hover:bg-purple-500/40'
            }`} 
          />

          {/* Master Circular Orb Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`relative w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center cursor-pointer shadow-[0_4px_25px_rgba(0,0,0,0.6)] border transition-all duration-200 backdrop-blur-xl ${
              isSpeaking
                ? 'bg-gradient-to-tr from-pink-600 to-purple-600 border-pink-400/80 shadow-[0_0_20px_rgba(236,72,153,0.5)]'
                : isListening
                  ? 'bg-gradient-to-tr from-teal-600 to-emerald-500 border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                  : isThinking
                    ? 'bg-gradient-to-tr from-indigo-700 to-purple-700 border-indigo-400/80 animate-pulse'
                    : 'bg-gradient-to-tr from-slate-950 via-purple-950 to-indigo-950 border-purple-500/50 hover:border-purple-400 hover:scale-105'
            }`}
            title={isOpen ? "Minimize AI Bubble" : "Click to interact with Lumina Screen Vision"}
          >
            {/* Inner Graphic */}
            {isThinking ? (
              <Sparkles className="w-5 h-5 text-indigo-200 animate-spin" />
            ) : isSpeaking ? (
              <AudioLines className="w-5 h-5 text-white animate-pulse" />
            ) : isListening ? (
              <Mic className="w-5 h-5 text-white animate-bounce" />
            ) : (
              <div className="relative flex items-center justify-center">
                <ScreenShare className="w-5 h-5 text-purple-200 group-hover:text-white transition" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
              </div>
            )}
          </button>

          {/* Mini Status Pill Badge attached to bubble */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-slate-950/90 border border-purple-500/40 text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-full text-emerald-400 whitespace-nowrap shadow pointer-events-none flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SCREEN AI
          </div>
        </div>

        {/* Compact Expandable Popover Flyout */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="mt-3 w-80 sm:w-88 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-purple-500/40 shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden text-slate-100 flex flex-col font-sans"
            >
              {/* Header Bar */}
              <div className="px-3.5 py-2.5 bg-slate-900/80 border-b border-white/5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center">
                    <ScreenShare className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold font-mono text-white flex items-center gap-1.5">
                      Lumina Screen Vision
                    </div>
                    <div className="text-[9px] text-purple-300/80 font-mono truncate max-w-[150px]">
                      Watching: <span className="text-white font-medium">{activeAppTitle}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Window Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={`p-1 rounded-lg transition cursor-pointer ${
                      showPreview ? 'bg-purple-600/30 text-purple-300' : 'hover:bg-white/10 text-slate-400 hover:text-white'
                    }`}
                    title={showPreview ? "Hide Preview" : "Show Screen Frame Preview"}
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      openWindow('voice');
                    }}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                    title="Open Full Voice Assistant"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setIsScreenVisionActive(false);
                      setIsOpen(false);
                      addNotification('Screen Share Ended', 'Lumina AI screen vision is now stopped.', 'info');
                    }}
                    className="p-1 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition cursor-pointer"
                    title="Stop Screen Share"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Main Body */}
              <div className="p-3 space-y-2.5 text-xs">
                {/* Optional Screen Thumbnail Preview */}
                {showPreview && screenVisionThumbnail && (
                  <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video bg-black/60 shadow-inner group">
                    <img 
                      src={screenVisionThumbnail} 
                      alt="Screen Frame" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[8px] font-mono text-purple-200 bg-slate-950/80 px-1.5 py-0.5 rounded border border-white/10">
                      <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                      Live Vision Frame
                    </div>
                  </div>
                )}

                {/* AI Guidance Text Box */}
                <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[9px] font-mono text-purple-300">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      {isThinking ? 'Analyzing screen...' : isSpeaking ? 'Speaking advice...' : 'Lumina AI Guidance:'}
                    </span>
                    {isSpeaking && (
                      <span className="text-pink-400 font-bold flex items-center gap-1">
                        <Volume2 className="w-3 h-3 animate-pulse" /> PLAYING
                      </span>
                    )}
                  </div>
                  <p className="text-slate-200 text-[11px] leading-relaxed">
                    {isThinking ? (
                      <span className="text-slate-400 italic flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                        Observing {activeAppTitle} & generating next steps...
                      </span>
                    ) : lastAdvice ? (
                      lastAdvice
                    ) : (
                      `Lumina AI is watching your desktop screen. Tap the mic or "What Should I Do?" to ask for help anytime!`
                    )}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (isListening) {
                        if (recognitionRef.current) recognitionRef.current.stop();
                        setIsListening(false);
                      } else {
                        startSpeech();
                      }
                    }}
                    disabled={isThinking}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer shadow ${
                      isListening
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                        : isSpeaking
                          ? 'bg-pink-600 hover:bg-pink-500 text-white'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{isListening ? 'Listening...' : isSpeaking ? 'Interrupt' : 'Talk to AI'}</span>
                  </button>

                  <button
                    onClick={() => askLuminaVision("Look at my active window and tell me what I should do next.")}
                    disabled={isThinking}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white/10 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 text-xs font-semibold transition cursor-pointer"
                    title="Ask AI what to do next on this screen"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-purple-300" />
                    <span>What to do?</span>
                  </button>
                </div>
              </div>

              {/* Footer hint */}
              <div className="px-3 py-1.5 bg-slate-900/50 border-t border-white/5 flex items-center justify-between text-[8.5px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Move className="w-2.5 h-2.5" /> Drag bubble to reposition
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:text-purple-300 flex items-center gap-0.5 cursor-pointer"
                >
                  <Minimize2 className="w-2.5 h-2.5" /> Collapse
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
