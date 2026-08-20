import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useOS } from '../../context/OSContext';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  AudioLines, 
  Send, 
  Radio, 
  Bot, 
  User, 
  Activity,
  CheckCircle2,
  ChevronDown,
  ScreenShare,
  Layers,
  HelpCircle,
  Play,
  RotateCcw
} from 'lucide-react';
import { captureDesktopDOM, captureStreamFrame } from '../../utils/screenCapture';

interface VoiceMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
  imagePreview?: string | null;
  isAudioPlaying?: boolean;
}

const LUMINA_VOICES = [
  { id: 'Zephyr', name: 'Lumina Natural', desc: 'Warm, clear, balanced tone' },
  { id: 'Kore', name: 'Lumina Expressive', desc: 'Sharp, engaging, articulate' },
  { id: 'Puck', name: 'Lumina Dynamic', desc: 'Energetic, modern, crisp' },
  { id: 'Fenrir', name: 'Lumina Deep', desc: 'Rich, calm, resonant presence' },
  { id: 'Charon', name: 'Lumina Precise', desc: 'Steady, direct, measured' },
];

export const VoiceApp: React.FC = () => {
  const { 
    addNotification, 
    openWindow, 
    windows, 
    activeWindowId, 
    isScreenVisionActive, 
    setIsScreenVisionActive,
    screenVisionThumbnail,
    setScreenVisionThumbnail
  } = useOS();

  const [selectedVoice, setSelectedVoice] = useState<string>('Zephyr');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusText, setStatusText] = useState('Voice ready. Tap the microphone to talk with Lumina AI.');
  const [transcript, setTranscript] = useState('');
  const [screenShareMode, setScreenShareMode] = useState<'desktop' | 'displayMedia'>('desktop');
  const [displayMediaStream, setDisplayMediaStream] = useState<MediaStream | null>(null);

  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: 'welcome',
      sender: 'gemini',
      text: 'Hello! I am Lumina AI. You can share your screen or active apps with me, and I will guide you with voice instructions in real time.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Audio References
  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isComponentMounted = useRef(true);

  // Determine active app title
  const activeWin = windows.find(w => w.id === activeWindowId);
  const activeAppTitle = activeWin ? activeWin.title : 'Desktop Workspace';
  const openAppTitles = windows.map(w => w.title);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isSpeaking]);

  // Audio Context Initialization
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx({ sampleRate: 24000 });
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // Stop currently playing audio
  const stopAudio = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (_) {}
      currentSourceRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setAudioLevel(0);
  }, []);

  // Play Authentic Neural 24kHz PCM Audio
  const playGeminiNeuralAudio = useCallback((base64Data: string, onEnded?: () => void) => {
    try {
      stopAudio();
      const ctx = getAudioContext();

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

      const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      currentSourceRef.current = source;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVisualizer = () => {
        if (!isComponentMounted.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 255) * 100)));
        animFrameRef.current = requestAnimationFrame(updateVisualizer);
      };

      setIsSpeaking(true);
      setStatusText('Lumina AI is speaking...');
      updateVisualizer();

      source.onended = () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        setIsSpeaking(false);
        setAudioLevel(0);
        setStatusText('Voice assistant ready. Tap microphone to speak.');
        if (onEnded) onEnded();
      };

      source.start(0);
    } catch (err) {
      console.warn("Failed to play Gemini PCM audio:", err);
      setIsSpeaking(false);
      setAudioLevel(0);
    }
  }, [getAudioContext, stopAudio]);

  // Fallback TTS with Web Speech API
  const fallbackSpeak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(v => 
        v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira'))
      );
      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setStatusText('Lumina AI is speaking...');
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setStatusText('Voice assistant ready.');
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (_) {}
  }, []);

  // Screen Capture Helper
  const grabCurrentScreenShot = async (): Promise<string | null> => {
    if (!isScreenVisionActive) return null;

    try {
      if (screenShareMode === 'displayMedia' && displayMediaStream) {
        const frame = await captureStreamFrame(displayMediaStream);
        if (frame) {
          setScreenVisionThumbnail(frame);
          return frame;
        }
      }

      // Default: DOM workspace capture
      const domFrame = await captureDesktopDOM('lumina-desktop-workstage');
      if (domFrame) {
        setScreenVisionThumbnail(domFrame);
        return domFrame;
      }
    } catch (err) {
      console.warn("Screen snapshot capture error:", err);
    }
    return screenVisionThumbnail;
  };

  // Toggle Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenVisionActive) {
      // Turn off
      if (displayMediaStream) {
        displayMediaStream.getTracks().forEach(t => t.stop());
        setDisplayMediaStream(null);
      }
      setIsScreenVisionActive(false);
      setScreenVisionThumbnail(null);
      addNotification('Screen Share Stopped', 'Lumina AI is no longer observing your screen.', 'info');
      setStatusText('Screen sharing stopped.');
    } else {
      // Turn on
      setIsScreenVisionActive(true);
      setStatusText('Screen sharing active! Lumina AI is observing your desktop.');
      addNotification('Screen Share Active', 'Lumina AI is now watching your desktop & active apps.', 'success');
      
      // Take initial snapshot
      setTimeout(async () => {
        const thumb = await captureDesktopDOM('lumina-desktop-workstage');
        if (thumb) setScreenVisionThumbnail(thumb);
      }, 200);
    }
  };

  // Start Real Browser getDisplayMedia Stream
  const startBrowserDisplayMedia = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' } as any,
          audio: false
        });

        setDisplayMediaStream(stream);
        setScreenShareMode('displayMedia');
        setIsScreenVisionActive(true);

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenVisionActive(false);
          setDisplayMediaStream(null);
          setScreenShareMode('desktop');
        };

        const frame = await captureStreamFrame(stream);
        if (frame) setScreenVisionThumbnail(frame);

        addNotification('Live Stream Connected', 'Lumina AI is watching your live screen stream.', 'success');
      } else {
        addNotification('Browser Screen Share', 'Using simulated desktop environment capture.', 'info');
        setScreenShareMode('desktop');
        setIsScreenVisionActive(true);
      }
    } catch (err) {
      console.warn("getDisplayMedia request was cancelled or unsupported:", err);
      setScreenShareMode('desktop');
      setIsScreenVisionActive(true);
    }
  };

  // Process Voice/Text Query with Multimodal Screen Vision + Neural TTS
  const handleQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    stopAudio();

    // Grab latest screen frame if screen sharing is active
    let screenImage: string | null = null;
    if (isScreenVisionActive) {
      setStatusText('Capturing screen for Lumina AI...');
      screenImage = await grabCurrentScreenShot();
    }

    const userMsg: VoiceMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imagePreview: screenImage
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setStatusText(isScreenVisionActive ? 'Lumina AI is analyzing screen & generating guidance...' : 'Lumina AI is thinking...');

    // Trigger local OS commands if requested
    const lower = queryText.toLowerCase();
    if (lower.includes('open notepad')) openWindow('notepad');
    else if (lower.includes('open paint')) openWindow('paint');
    else if (lower.includes('open calculator') || lower.includes('open calc')) openWindow('calc');
    else if (lower.includes('open terminal') || lower.includes('open cmd')) openWindow('terminal');
    else if (lower.includes('open explorer') || lower.includes('open files')) openWindow('explorer');
    else if (lower.includes('open settings')) openWindow('settings');
    else if (lower.includes('open maps')) openWindow('maps');

    try {
      const response = await fetch('/api/gemini/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: queryText,
          voice: selectedVoice,
          image: screenImage,
          screenContext: {
            activeApp: activeAppTitle,
            openApps: openAppTitles
          }
        }),
      });

      const data = await response.json();
      const reply = data.reply || "I am observing your screen. How can I guide you?";

      const aiMsg: VoiceMessage = {
        id: `ai-${Date.now()}`,
        sender: 'gemini',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsLoading(false);

      if (data.audio) {
        playGeminiNeuralAudio(data.audio);
      } else {
        fallbackSpeak(reply);
      }
    } catch (err) {
      console.error("Voice chat error:", err);
      const fallbackReply = isScreenVisionActive 
        ? `I am observing ${activeAppTitle}. You can click anywhere to interact or ask me specific questions about your workflow.`
        : `I received: "${queryText}". Ready for your next command.`;
      
      const aiMsg: VoiceMessage = {
        id: `ai-${Date.now()}`,
        sender: 'gemini',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsLoading(false);
      fallbackSpeak(fallbackReply);
    }
  };

  // Start Speech Recognition
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      addNotification('Mic Notice', 'Web Speech API is not supported in this browser. You can type in the prompt bar below.', 'info');
      setStatusText('Speech API unavailable. Please use the text input below.');
      return;
    }

    try {
      stopAudio();
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setStatusText(isScreenVisionActive ? 'Listening with Screen Vision active... Speak now.' : 'Listening... Speak now.');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const current = finalTranscript || interimTranscript;
        setTranscript(current);

        if (finalTranscript) {
          setIsListening(false);
          setStatusText('Processing speech with Lumina AI...');
          handleQuery(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setStatusText('Microphone permission blocked. Please allow mic access.');
          addNotification('Mic Blocked', 'Allow microphone access in browser settings.', 'error');
        } else if (event.error === 'no-speech') {
          setStatusText('No speech detected. Tap mic to try again.');
        } else {
          setStatusText('Ready. Tap mic to talk.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("Speech recognition error:", e);
      setIsListening(false);
      setStatusText('Failed to start microphone.');
    }
  };

  // Toggle Voice Input
  const toggleVoiceSession = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setStatusText('Listening paused.');
    } else if (isSpeaking) {
      stopAudio();
      setStatusText('Voice stopped. Tap mic to speak.');
    } else {
      startSpeechRecognition();
    }
  };

  // Replay a message with Lumina Voice
  const replayAudio = async (text: string) => {
    stopAudio();
    setIsLoading(true);
    setStatusText('Synthesizing Lumina AI voice...');

    try {
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: selectedVoice })
      });
      const data = await res.json();
      setIsLoading(false);
      if (data.audio) {
        playGeminiNeuralAudio(data.audio);
      } else {
        fallbackSpeak(text);
      }
    } catch (e) {
      setIsLoading(false);
      fallbackSpeak(text);
    }
  };

  // Submit Text Input
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isLoading) return;
    const q = textInput;
    setTextInput('');
    handleQuery(q);
  };

  // Cleanup on unmount
  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
      stopAudio();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopAudio]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans select-none overflow-hidden" id="lumina_voice_agent_app">
      
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-slate-900/70 border-b border-white/5 flex items-center justify-between z-10 shrink-0 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
            <AudioLines className={`w-4 h-4 ${isSpeaking || isListening ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h1 className="text-xs font-bold font-mono tracking-wider text-slate-100 flex items-center gap-2">
              Lumina Voice & Screen Assistant
              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-300 font-mono font-medium border border-purple-500/30">
                Multimodal AI
              </span>
            </h1>
            <p className="text-[9px] text-slate-400 font-mono">Real-time voice guidance & screen vision</p>
          </div>
        </div>

        {/* Screen Share & Voice Selector Controls */}
        <div className="flex items-center gap-2">
          {/* Screen Share Toggle Button */}
          <button
            onClick={toggleScreenShare}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition duration-200 cursor-pointer border ${
              isScreenVisionActive
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/10 hover:border-purple-500/40'
            }`}
            title={isScreenVisionActive ? "Stop Sharing Screen" : "Share Desktop Screen with Lumina AI"}
          >
            <ScreenShare className={`w-3.5 h-3.5 ${isScreenVisionActive ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">
              {isScreenVisionActive ? 'Screen Vision: ON' : 'Share Screen'}
            </span>
          </button>

          {/* Voice Tone Selector */}
          <div className="relative hidden md:block">
            <select
              value={selectedVoice}
              onChange={(e) => {
                setSelectedVoice(e.target.value);
                const voiceObj = LUMINA_VOICES.find(v => v.id === e.target.value);
                addNotification('Voice Changed', `Switched to ${voiceObj ? voiceObj.name : 'Lumina AI'}`, 'info');
              }}
              className="bg-slate-900 text-purple-200 border border-purple-500/30 rounded-lg text-xs px-2.5 py-1.5 pr-6 font-mono appearance-none focus:outline-none focus:border-purple-400 cursor-pointer"
            >
              {LUMINA_VOICES.map(v => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-slate-100">
                  {v.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-purple-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        
        {/* Left Interactive Sound Orb & Screen Vision Visualizer */}
        <div className="flex-1 flex flex-col items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-slate-950 via-[#0a0e1c] to-slate-950 relative overflow-y-auto border-b md:border-b-0 md:border-r border-white/5">
          
          {/* Dynamic Background Aura Glow */}
          <div 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full filter blur-[75px] pointer-events-none transition-all duration-300 ${
              isSpeaking 
                ? 'bg-pink-600/30 scale-125' 
                : isListening 
                  ? 'bg-emerald-500/25 scale-115' 
                  : isLoading 
                    ? 'bg-indigo-600/25 scale-100 animate-pulse' 
                    : isScreenVisionActive
                      ? 'bg-teal-500/20 scale-100'
                      : 'bg-purple-600/10 scale-90'
            }`} 
            style={{
              width: `${160 + (audioLevel * 1.5)}px`,
              height: `${160 + (audioLevel * 1.5)}px`,
            }}
          />

          {/* Top Status & Screen Vision Indicators */}
          <div className="w-full flex items-center justify-between z-10 gap-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                isSpeaking 
                  ? 'bg-pink-400 animate-ping' 
                  : isListening 
                    ? 'bg-emerald-400 animate-ping' 
                    : isLoading 
                      ? 'bg-amber-400 animate-pulse' 
                      : isScreenVisionActive
                        ? 'bg-teal-400 animate-ping'
                        : 'bg-slate-500'
              }`} />
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-300 font-bold">
                {isSpeaking 
                  ? 'Lumina Speaking' 
                  : isListening 
                    ? 'Listening to You' 
                    : isLoading 
                      ? 'Lumina Analyzing...' 
                      : isScreenVisionActive 
                        ? `Watching: ${activeAppTitle}` 
                        : 'Voice Ready'}
              </span>
            </div>

            {isSpeaking && (
              <button 
                onClick={stopAudio}
                className="text-[10px] px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg flex items-center gap-1.5 border border-white/10 transition cursor-pointer"
                title="Stop speech"
              >
                <VolumeX className="w-3 h-3 text-red-400" /> Stop Audio
              </button>
            )}
          </div>

          {/* Screen Vision Live Thumbnail Card (If Active) */}
          {isScreenVisionActive && (
            <div className="w-full max-w-sm mt-3 mb-1 p-2 rounded-2xl bg-slate-900/90 border border-teal-500/30 backdrop-blur-xl shadow-xl z-10 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-mono px-1">
                <span className="flex items-center gap-1.5 text-teal-300 font-bold">
                  <ScreenShare className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                  Screen AI Active
                </span>
                <span className="text-slate-400 truncate max-w-[150px]">
                  {activeAppTitle}
                </span>
              </div>

              <div className="relative rounded-xl overflow-hidden aspect-video bg-black/80 border border-white/10 group">
                {screenVisionThumbnail ? (
                  <img 
                    src={screenVisionThumbnail} 
                    alt="Active Screen" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 font-mono text-[10px] gap-1">
                    <ScreenShare className="w-5 h-5 text-teal-400 animate-pulse" />
                    <span>Observing Desktop Workspace...</span>
                  </div>
                )}

                {/* Laser Radar Scanline Animation */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-teal-400/20 to-transparent h-10 w-full animate-[bounce_3s_ease-in-out_infinite]" />

                <div className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[8.5px] font-mono text-white bg-slate-950/80 px-2 py-0.5 rounded-md border border-white/10">
                  <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                  Observing Apps in Real Time
                </div>
              </div>
            </div>
          )}

          {/* Pulsating Visual Sound Orb */}
          <div className="relative flex flex-col items-center justify-center my-auto py-2 z-10">
            <div 
              onClick={toggleVoiceSession}
              className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 transform active:scale-95 group ${
                isSpeaking 
                  ? 'scale-105 shadow-[0_0_50px_rgba(236,72,153,0.4)]' 
                  : isListening 
                    ? 'scale-110 shadow-[0_0_50px_rgba(16,185,129,0.4)]' 
                    : isLoading 
                      ? 'scale-100 shadow-[0_0_40px_rgba(99,102,241,0.3)]' 
                      : 'hover:scale-105 shadow-[0_0_30px_rgba(168,85,247,0.2)]'
              }`}
            >
              {/* Outer Ripple Wave Rings */}
              <div 
                className={`absolute inset-0 rounded-full border transition-all duration-300 ${
                  isSpeaking 
                    ? 'border-pink-500/50 scale-110' 
                    : isListening 
                      ? 'border-emerald-500/50 scale-110' 
                      : 'border-purple-500/20'
                }`} 
                style={{
                  transform: `scale(${1 + (audioLevel / 200)})`,
                  opacity: isSpeaking ? 0.8 : isListening ? 0.9 : 0.3
                }}
              />

              {/* Master Core Orb */}
              <div className={`w-28 h-28 sm:w-34 sm:h-34 rounded-full bg-gradient-to-tr transition-all duration-500 flex items-center justify-center border ${
                isSpeaking 
                  ? 'from-pink-600 via-purple-600 to-indigo-600 border-pink-300/50 shadow-inner' 
                  : isListening 
                    ? 'from-teal-500 via-emerald-600 to-cyan-600 border-emerald-300/50 shadow-inner' 
                    : isLoading 
                      ? 'from-indigo-700 via-purple-800 to-slate-900 border-indigo-400/50 animate-spin-slow' 
                      : 'from-slate-900 via-purple-950 to-slate-900 border-purple-500/40 group-hover:border-purple-400/80'
              }`}>
                {/* Visualizer Wave Bars */}
                {isSpeaking || isListening || isLoading ? (
                  <div className="flex gap-1.5 items-center justify-center">
                    <span 
                      className="w-1.5 rounded-full bg-white/90 transition-all duration-100" 
                      style={{ height: `${Math.max(8, isSpeaking ? 16 + audioLevel * 0.4 : isListening ? 24 : 10)}px` }}
                    />
                    <span 
                      className="w-1.5 rounded-full bg-white/90 transition-all duration-100 delay-75" 
                      style={{ height: `${Math.max(12, isSpeaking ? 24 + audioLevel * 0.6 : isListening ? 36 : 18)}px` }}
                    />
                    <span 
                      className="w-1.5 rounded-full bg-white/90 transition-all duration-100 delay-150" 
                      style={{ height: `${Math.max(16, isSpeaking ? 32 + audioLevel * 0.8 : isListening ? 44 : 26)}px` }}
                    />
                    <span 
                      className="w-1.5 rounded-full bg-white/90 transition-all duration-100 delay-75" 
                      style={{ height: `${Math.max(12, isSpeaking ? 24 + audioLevel * 0.6 : isListening ? 36 : 18)}px` }}
                    />
                    <span 
                      className="w-1.5 rounded-full bg-white/90 transition-all duration-100" 
                      style={{ height: `${Math.max(8, isSpeaking ? 16 + audioLevel * 0.4 : isListening ? 24 : 10)}px` }}
                    />
                  </div>
                ) : (
                  <Mic className="w-8 h-8 text-purple-300 group-hover:text-white transition group-hover:scale-110" />
                )}
              </div>
            </div>

            {/* Status Feedback Text */}
            <div className="text-center mt-3 max-w-xs px-2">
              <p className="text-xs text-slate-200 font-medium leading-relaxed">
                {statusText}
              </p>
              {transcript && (
                <p className="text-[11px] text-purple-300 mt-1 italic line-clamp-2">
                  "{transcript}"
                </p>
              )}
            </div>
          </div>

          {/* Bottom Action Controls & Screen Guidance Chips */}
          <div className="w-full flex flex-col items-center gap-2.5 z-10 mt-2">
            <button
              onClick={toggleVoiceSession}
              className={`flex items-center gap-2 px-7 py-2.5 rounded-full text-xs font-bold transition duration-200 shadow-xl cursor-pointer ${
                isListening 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25 animate-pulse' 
                  : isSpeaking 
                    ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-pink-500/25' 
                    : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25'
              }`}
            >
              {isListening ? (
                <>
                  <Mic className="w-4 h-4 animate-ping" />
                  <span>Listening... Tap when done</span>
                </>
              ) : isSpeaking ? (
                <>
                  <Volume2 className="w-4 h-4 animate-pulse" />
                  <span>Speaking... Tap to interrupt</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-purple-200" />
                  <span>Tap to Speak with Lumina</span>
                </>
              )}
            </button>

            {/* Multimodal Screen Guidance Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-md">
              {isScreenVisionActive ? (
                <>
                  <button
                    onClick={() => handleQuery("What should I do next on this screen?")}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-500/40 transition cursor-pointer font-sans flex items-center gap-1"
                  >
                    <HelpCircle className="w-3 h-3 text-teal-300" />
                    What should I do?
                  </button>
                  <button
                    onClick={() => handleQuery(`Look at ${activeAppTitle}. Guide me step by step on how to use it.`)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 transition cursor-pointer font-sans"
                  >
                    Guide me in {activeAppTitle}
                  </button>
                  <button
                    onClick={() => handleQuery("Analyze what's drawn or written on my screen.")}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 transition cursor-pointer font-sans"
                  >
                    Review my work
                  </button>
                </>
              ) : (
                [
                  "Open Notepad",
                  "Open Paint",
                  "Open Calculator",
                  "What's the system status?",
                  "Share screen guidance",
                ].map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => {
                      if (prompt === "Share screen guidance") {
                        toggleScreenShare();
                      } else {
                        handleQuery(prompt);
                      }
                    }}
                    className="text-[9.5px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-purple-600/20 hover:border-purple-500/40 text-slate-300 hover:text-purple-200 border border-white/5 transition cursor-pointer font-sans"
                  >
                    {prompt}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Live Transcript & Conversation Log */}
        <div className="w-full md:w-80 flex flex-col bg-[#070a14] border-t md:border-t-0 border-white/5 min-h-0">
          
          {/* Transcript Header */}
          <div className="px-4 py-2.5 border-b border-white/5 bg-slate-950/50 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-purple-400" />
              Conversation Log
            </span>
            <button
              onClick={() => {
                stopAudio();
                setMessages([{
                  id: 'welcome',
                  sender: 'gemini',
                  text: 'Conversation cleared. How can I help you today?',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
              }}
              className="text-[9px] font-mono text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              Clear Log
            </button>
          </div>

          {/* Transcript Chat Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs scrollbar-thin">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono px-1">
                  {msg.sender === 'user' ? (
                    <>
                      <span>You</span>
                      <User className="w-2.5 h-2.5 text-blue-400" />
                    </>
                  ) : (
                    <>
                      <Bot className="w-2.5 h-2.5 text-purple-400" />
                      <span>Lumina AI</span>
                    </>
                  )}
                  <span>• {msg.timestamp}</span>
                </div>

                <div className={`group relative p-2.5 rounded-2xl max-w-[90%] leading-relaxed text-[11px] ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-slate-900 border border-white/5 text-slate-200 rounded-tl-sm'
                }`}>
                  {/* Screen Frame Attachment if present */}
                  {msg.imagePreview && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-white/20 aspect-video bg-black/40">
                      <img 
                        src={msg.imagePreview} 
                        alt="Screen Snapshot" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {msg.text}

                  {msg.sender === 'gemini' && (
                    <button
                      onClick={() => replayAudio(msg.text)}
                      className="opacity-0 group-hover:opacity-100 transition absolute -right-6 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-purple-300 cursor-pointer"
                      title="Replay with Lumina voice"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-2 text-slate-400 text-[10px] font-mono animate-pulse">
                <Sparkles className="w-3 h-3 text-purple-400 animate-spin" />
                <span>Lumina AI is inspecting screen & answering...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Type-to-Speak Text Bar */}
          <form onSubmit={handleTextSubmit} className="p-3 border-t border-white/5 bg-slate-950/70 flex items-center gap-2">
            <input
              type="text"
              placeholder={isScreenVisionActive ? "Ask about what's on your screen..." : "Ask anything or command OS..."}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isLoading}
              className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl transition cursor-pointer"
              title="Send prompt"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
