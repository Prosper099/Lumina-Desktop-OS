import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { Sparkles, Send, Trash2, HelpCircle, Terminal, FileCode, Hammer, X, Mic, MicOff, PhoneCall, AudioLines } from 'lucide-react';

export const CopilotApp: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { chatHistory, sendAICommand, isAIPending, clearChatHistory, addNotification, openWindow } = useOS();
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAIPending]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setInput(prev => {
        const space = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
        return prev + space + transcript;
      });
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onerror = (e: any) => {
      console.error('AI Voice recognition error:', e);
      setIsListening(false);
      if (e.error !== 'no-speech') {
        addNotification('Voice Command Error', `Speech recognition error: ${e.error || 'unknown'}`, 'error');
      }
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [addNotification]);

  const toggleListening = () => {
    if (!speechSupported) {
      addNotification('Unsupported Feature', 'Speech Recognition (Web Speech API) is not supported in this browser.', 'warning');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        addNotification('Mic Active', 'Listening for your command/prompt...', 'info');
      } catch (err) {
        console.error(err);
        addNotification('Mic Error', 'Could not open microphone: ' + String(err), 'error');
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isAIPending) return;
    const txt = input;
    setInput('');
    await sendAICommand(txt);
  };

  const handlePreset = async (prompt: string) => {
    if (isAIPending) return;
    await sendAICommand(prompt);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 text-slate-100 font-sans select-all justify-between">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 select-none">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="text-xs font-bold font-mono tracking-wider uppercase text-slate-200">Lumina AI</span>
          <span className="text-[9px] bg-purple-950/60 text-purple-300 border border-purple-800/60 px-1.5 py-0.5 rounded font-mono font-bold leading-none">Gemini 3.5</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={clearChatHistory}
            title="Clear Logs"
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Close Panel"
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Regular Interactive Texts & Presets View */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Suggestion Chips */}
        <div className="bg-slate-950/40 border-b border-slate-800/80 p-3 select-none">
          <label className="text-[9px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1 mb-2">
            <Hammer className="w-3 text-purple-400" /> Presets (OS Hotkeys)
          </label>
          <div className="flex flex-wrap gap-2 text-[10px] font-semibold">
            {[
              { label: "Change to light mode", cmd: "Change system style to light mode" },
              { label: "Open Notepad Editor", cmd: "Launch Notepad application" },
              { label: "Create a list on Desktop", cmd: "Create a shopping.txt file on my Desktop containing bread, cheese and milk, and open Notepad to view it" },
              { label: "Launch Calculator", cmd: "Open Calculator" },
              { label: "Search Space News", cmd: "Search the web for the latest NASA James Webb telescope news" },
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handlePreset(preset.cmd)}
                disabled={isAIPending}
                className="px-2.5 py-1 bg-slate-900/60 hover:bg-purple-900/25 border border-slate-800 hover:border-purple-800 text-slate-300 hover:text-purple-300 rounded-full transition disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950 text-xs leading-relaxed select-text">
          {chatHistory.map((item, idx) => {
            const isAI = item.role === 'assistant';
            return (
              <div key={idx} className={`flex ${isAI ? 'justify-start' : 'justify-end animate-fade-in'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-md leading-relaxed whitespace-pre-wrap ${isAI ? 'bg-slate-900/80 text-slate-200 border border-slate-800' : 'bg-blue-600 text-white font-medium'}`}>
                  {isAI && (
                    <div className="flex items-center gap-1 mb-1.5 select-none">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 font-mono">Lumina AI response</span>
                    </div>
                  )}
                  {item.content}
                </div>
              </div>
            );
          })}

          {isAIPending && (
            <div className="flex justify-start select-none">
              <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">AI compiling actions...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input panel bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 select-none font-sans">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening... Speak clearly" : "Ask system AI... (type or talk)"}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isAIPending}
            className="flex-1 bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 outline-none text-slate-200 disabled:opacity-40 font-medium placeholder-slate-500/70"
          />
          <button
            onClick={toggleListening}
            disabled={isAIPending}
            title={isListening ? "Stop voice dictation" : "Dictate speech to text"}
            className={`p-2 rounded-lg transition disabled:opacity-40 cursor-pointer shadow-lg ${
              isListening 
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse border border-red-500' 
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-white'
            }`}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-purple-400 font-bold" />}
          </button>
          <button
            type="button"
            onClick={() => openWindow('voice')}
            disabled={isAIPending}
            title="Connect Live Voice Chat (duplex audio link)"
            className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-purple-400 hover:text-purple-300 border border-slate-800/80 cursor-pointer shadow-lg transition duration-200"
          >
            <AudioLines className="w-3.5 h-3.5 animate-pulse" />
          </button>
          <button
            onClick={handleSend}
            disabled={isAIPending || !input.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-40 cursor-pointer shadow-lg shadow-blue-500/10"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
