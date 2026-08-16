import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { Mic, MicOff, PhoneOff, Sparkles, Volume2, HelpCircle, AudioLines, AlertTriangle } from 'lucide-react';

export const VoiceApp: React.FC = () => {
  const { addNotification } = useOS();
  const [isConnected, setIsConnected] = useState(false);
  const [statusText, setStatusText] = useState('Assistant ready for voice link.');
  const [isSpeaking, setIsSpeaking] = useState(false); // Model is talking
  const [isListening, setIsListening] = useState(false); // User is talking/mic capturing
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  // Custom audio playback queue for 24kHz raw PCM chunks from Live API
  const nextStartTimeRef = useRef<number>(0);

  const startVoiceSession = async () => {
    setConnectionError(null);
    setStatusText('Acquiring mic permissions...');
    
    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      // 2. Establish WebSocket to backend
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setStatusText('Connected to Gemini Live Node. Speak now!');
        setConnectionError(null);
        addNotification('Live Link Established', 'Streaming 16kHz PCM audio securely.', 'success');
        
        // Initialize Audio contexts
        inputAudioCtxRef.current = new AudioContext({ sampleRate: 16000 });
        outputAudioCtxRef.current = new AudioContext({ sampleRate: 24000 });
        nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;

        // Start capturing and sending mic audio
        startMicStreaming(stream);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.error) {
            setConnectionError(data.error);
            setStatusText('Connection suspended.');
            closeVoiceSession();
            return;
          }

          if (data.interrupted) {
            // Stop current playback, reset queue
            nextStartTimeRef.current = outputAudioCtxRef.current?.currentTime || 0;
            setIsSpeaking(false);
            return;
          }

          if (data.audio) {
            setIsSpeaking(true);
            playAudioRawPCM(data.audio);
          }
        } catch (e) {
          console.error("Audio messaging parsing failed:", e);
        }
      };

      ws.onclose = () => {
        setStatusText('Session disconnected.');
        closeVoiceSession();
      };

      ws.onerror = () => {
        setConnectionError('WebSocket connection layer reported an error.');
        closeVoiceSession();
      };

    } catch (err: any) {
      console.error(err);
      setConnectionError(err.message || 'Microphone credentials or access blocked.');
      setStatusText('Session initialization failed.');
      closeVoiceSession();
      addNotification('Mic Denied', 'Could not open microphone line.', 'error');
    }
  };

  const startMicStreaming = (stream: MediaStream) => {
    const ctx = inputAudioCtxRef.current;
    if (!ctx) return;

    try {
      const source = ctx.createMediaStreamSource(stream);
      // script processor 4096 buffer, 1 input channel, 1 output channel
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(ctx.destination);

      processor.onaudioprocess = (e) => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) return;

        const inputChannelData = e.inputBuffer.getChannelData(0);
        
        // Check if user is actively speaking (amplitude threshold)
        const maxVal = Math.max(...Array.from(inputChannelData).map(Math.abs));
        setIsListening(maxVal > 0.08);

        // Convert PCM floats to 16bit signed Int integers, then Base64 encode
        const base64Audio = pcmFloat32To16BitBase64(inputChannelData);
        if (base64Audio) {
          socketRef.current.send(JSON.stringify({ audio: base64Audio }));
        }
      };
    } catch (e) {
      console.error("Mic hook execution failed:", e);
    }
  };

  // Convert Float32 array to Mono Int16 Base64 representation
  const pcmFloat32To16BitBase64 = (float32Array: Float32Array): string => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    
    // Uint8 conversion to base64
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkLength = 0xffff;
    
    for (let i = 0; i < bytes.length; i += chunkLength) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkLength)));
    }
    return btoa(binary);
  };

  const playAudioRawPCM = (base64Data: string) => {
    const ctx = outputAudioCtxRef.current;
    if (!ctx) return;

    try {
      // Decode base64 back into buffer
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Live returns raw PCM 24kHz Int16. We divide bytes length by 2 to get number of samples
      const numSamples = bytes.length / 2;
      const floatBuffer = new Float32Array(numSamples);
      const dataView = new DataView(bytes.buffer);

      for (let i = 0; i < numSamples; i++) {
        const int16Sample = dataView.getInt16(i * 2, true); // true for little endian
        floatBuffer[i] = int16Sample / 32768.0; // scale float
      }

      // Create Web Audio Buffer
      const audioBuffer = ctx.createBuffer(1, numSamples, 24000); // 24kHz sample rate
      audioBuffer.getChannelData(0).set(floatBuffer);

      // Schedule gapless playback
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }

      source.start(nextStartTimeRef.current);
      // Advance timeline by buffer duration
      nextStartTimeRef.current += audioBuffer.duration;

      source.onended = () => {
        // Simple heuristic to check if speech finished
        if (ctx.currentTime >= nextStartTimeRef.current - 0.2) {
          setIsSpeaking(false);
        }
      };
    } catch (e) {
      console.error("Audio chunk playback failed:", e);
    }
  };

  const closeVoiceSession = () => {
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
    
    // Close mic Stream
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    // Disconnect processors
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Close sockets
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    // Close contexts
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      closeVoiceSession();
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-6 items-center justify-between font-sans select-all">
      {/* Upper Title */}
      <div className="w-full flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="flex items-center gap-2">
          <AudioLines className="w-5 h-5 text-purple-400 animate-pulse" />
          <div>
            <h1 className="text-xs font-bold font-mono tracking-wider text-slate-200">Gemini Live Voice Link</h1>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">16kHz PCM duplex stream</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 select-none text-[9px] px-2 py-0.5 rounded-full border border-purple-900 bg-purple-950/40 text-purple-300 font-bold font-mono uppercase">
          <Sparkles className="w-3 h-3 text-purple-400 animate-spin" /> Live API
        </div>
      </div>

      {/* Main Orb Sphere Visualizer */}
      <div className="relative flex flex-col items-center justify-center py-8">
        {/* Hypnotic Glowing Orbs */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Outer ripples */}
          <div className={`absolute w-full h-full rounded-full bg-gradient-to-tr from-purple-600/20 via-blue-600/10 to-teal-600/20 filter blur-xl transition-all duration-700 ${
            isSpeaking ? 'scale-125 opacity-100 animate-pulse' :
            isListening ? 'scale-110 opacity-80 animate-ping' : 'scale-90 opacity-40'
          }`} />

          {/* Master Glowing sphere */}
          <div className={`w-28 h-28 rounded-full bg-gradient-to-tr transition-all duration-500 flex items-center justify-center shadow-2xl relative ${
            isSpeaking ? 'from-pink-600 via-purple-600 to-indigo-600 scale-105 border border-pink-400/30 shadow-pink-500/10' :
            isListening ? 'from-teal-500 via-emerald-600 to-blue-600 scale-110 border border-teal-400/30 shadow-teal-500/10' :
            isConnected ? 'from-purple-800 via-indigo-900 to-slate-950 scale-100 border border-purple-800/20 shadow-purple-500/5' :
            'from-slate-900 via-slate-950 to-slate-950 scale-95 border border-slate-800/40'
          }`}>
            {/* Pulsating lines inside orb */}
            {isConnected ? (
              <div className="flex gap-1 items-center justify-center">
                <span className={`w-1 bg-white/80 rounded-full transition-all ${isSpeaking ? 'h-10 animate-pulse' : isListening ? 'h-8' : 'h-3'}`} />
                <span className={`w-1 bg-white/80 rounded-full transition-all delay-75 ${isSpeaking ? 'h-14 animate-pulse' : isListening ? 'h-12' : 'h-4'}`} />
                <span className={`w-1 bg-white/80 rounded-full transition-all delay-150 ${isSpeaking ? 'h-12 animate-pulse' : isListening ? 'h-10' : 'h-3'}`} />
                <span className={`w-1 bg-white/80 rounded-full transition-all delay-100 ${isSpeaking ? 'h-7 animate-pulse' : isListening ? 'h-7' : 'h-2'}`} />
              </div>
            ) : (
              <MicOff className="w-8 h-8 text-slate-500" />
            )}
          </div>
        </div>

        {/* Dynamic Speech Info panel */}
        <div className="text-center mt-6 space-y-1">
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 font-mono block">Status logs</span>
          <p className="text-xs text-slate-200 font-medium">{statusText}</p>
        </div>
      </div>

      {/* Connection Errors Fallback Panel */}
      {connectionError && (
        <div className="w-full flex items-start gap-2.5 bg-red-950/20 hover:bg-red-950/30 border border-red-900/40 hover:border-red-800/50 p-3.5 rounded-xl text-[10px] text-red-300 transition select-none">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Google Live Node Blocked</span>
            <p className="text-slate-400 leading-normal">{connectionError}</p>
          </div>
        </div>
      )}

      {/* Button controls */}
      <div className="w-full flex justify-center pb-2 select-none">
        {isConnected ? (
          <button
            onClick={closeVoiceSession}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 hover:scale-105 active:scale-95 text-white font-bold text-xs rounded-full transition duration-300 shadow-lg shadow-red-500/20 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" /> Stop Voice Chat
          </button>
        ) : (
          <button
            onClick={startVoiceSession}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:scale-105 active:scale-95 text-white font-bold text-xs rounded-full transition duration-300 shadow-lg shadow-purple-500/20 cursor-pointer"
          >
            <Mic className="w-4 h-4 text-purple-200 animate-pulse" /> Begin Voice Dialog
          </button>
        )}
      </div>
    </div>
  );
};
