import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { FileText, Save, FilePlus, LogOut, Type, Minus, Plus, Mic, MicOff } from 'lucide-react';

interface NotepadProps {
  id: string;
  args?: {
    path?: string;
    content?: string;
  };
}

export const Notepad: React.FC<NotepadProps> = ({ id, args }) => {
  const { createFile, fileSystem, currentExplorerPath, closeWindow, addNotification } = useOS();
  const [filePath, setFilePath] = useState<string | null>(args?.path || null);
  const [fileName, setFileName] = useState<string>(args?.path ? args.path.split('/').pop() || '' : 'untitled.txt');
  const [content, setContent] = useState<string>(args?.content || '');
  const [fontSize, setFontSize] = useState<number>(14);
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [saveAsName, setSaveAsName] = useState<string>('untitled.txt');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      const txtArea = textareaRef.current;
      if (txtArea) {
        const start = txtArea.selectionStart;
        const end = txtArea.selectionEnd;
        const text = txtArea.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        const spaceBefore = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : '';
        const spaceAfter = after.length > 0 && !after.startsWith(' ') && !after.startsWith('\n') ? ' ' : '';
        const newContent = before + spaceBefore + transcript + spaceAfter + after;
        setContent(newContent);
        
        // Update cursor position after state recalculation
        setTimeout(() => {
          txtArea.focus();
          const newCursorPos = start + spaceBefore.length + transcript.length + spaceAfter.length;
          txtArea.setSelectionRange(newCursorPos, newCursorPos);
        }, 50);
      } else {
        setContent(curr => {
          const space = curr.length > 0 && !curr.endsWith(' ') && !curr.endsWith('\n') ? ' ' : '';
          return curr + space + transcript;
        });
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onerror = (e: any) => {
      console.error('Speech Recognition error:', e);
      setIsListening(false);
      if (e.error !== 'no-speech') {
        addNotification('Voice Dictation Error', `Speech recognition error: ${e.error || 'unknown'}`, 'error');
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
        addNotification('Mic Live', 'Dictating... Speak into your microphone to type into the editor.', 'info');
      } catch (err) {
        console.error(err);
        addNotification('Mic Error', 'Could not open microphone: ' + String(err), 'error');
      }
    }
  };

  // If args change (e.g., user double-clicked a different file in File Explorer to load it in already open Notepad)
  useEffect(() => {
    if (args?.path) {
      setFilePath(args.path);
      setFileName(args.path.split('/').pop() || '');
      setContent(args.content || '');
    }
  }, [args]);

  const handleSave = () => {
    if (filePath) {
      createFile(filePath, content);
      addNotification('Saved Successfully', `File "${fileName}" saved.`, 'success');
    } else {
      setSaveAsName(fileName);
      setShowSaveDialog(true);
    }
  };

  const executeSaveAs = () => {
    if (!saveAsName.trim()) return;
    const finalName = saveAsName.endsWith('.txt') ? saveAsName : saveAsName + '.txt';
    const targetPath = currentExplorerPath === '/' ? `/${finalName}` : `${currentExplorerPath}/${finalName}`;
    
    // Check if overlaps directory
    createFile(targetPath, content);
    setFilePath(targetPath);
    setFileName(finalName);
    setShowSaveDialog(false);
  };

  const handleNew = () => {
    setFilePath(null);
    setFileName('untitled.txt');
    setContent('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 font-sans select-text">
      {/* Menu bar */}
      <div className="flex items-center gap-4 px-3 py-1 bg-slate-800 border-b border-slate-700 text-xs">
        <button 
          onClick={handleNew} 
          className="flex items-center gap-1 hover:bg-slate-700 px-2 py-1 rounded transition-colors cursor-pointer"
        >
          <FilePlus className="w-3" /> New
        </button>
        <button 
          onClick={handleSave} 
          className="flex items-center gap-1 hover:bg-slate-700 px-2 py-1 rounded transition-colors cursor-pointer"
        >
          <Save className="w-3" /> Save
        </button>
        <div className="h-4 w-px bg-slate-700" />
        <div className="flex items-center gap-1 text-slate-400">
          <Type className="w-3" /> Size:
          <button 
            onClick={() => setFontSize(p => Math.max(10, p - 1))} 
            className="hover:bg-slate-700 px-1 hover:text-white"
          >
            <Minus className="w-3" />
          </button>
          <span className="min-w-[1.2rem] text-center text-slate-200">{fontSize}px</span>
          <button 
            onClick={() => setFontSize(p => Math.min(32, p + 1))} 
            className="hover:bg-slate-700 px-1 hover:text-white"
          >
            <Plus className="w-3" />
          </button>
        </div>
        <div className="h-4 w-px bg-slate-700" />
        <button
          onClick={toggleListening}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-all cursor-pointer font-medium select-none ${
            isListening 
              ? 'bg-red-600 animate-pulse text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
              : 'hover:bg-slate-700 text-slate-300 hover:text-white'
          }`}
          title={isListening ? "Stop voice dictation" : "Dictate text using microphone"}
        >
          {isListening ? <MicOff className="w-3" /> : <Mic className="w-3 text-sky-400" />}
          <span>{isListening ? 'Stop Listening' : 'Dictate'}</span>
        </button>
        <div className="ml-auto text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
          {filePath || "Unsaved Buffer"}
        </div>
      </div>

      {/* Editor text area */}
      <div className="flex-1 p-2 bg-slate-950">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ fontSize: `${fontSize}px` }}
          className="w-full h-full bg-transparent text-slate-200 resize-none outline-none font-mono leading-relaxed"
          placeholder="Start typing..."
          spellCheck="false"
        />
      </div>

      {/* Save Dialog Popup */}
      {showSaveDialog && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 w-full max-w-sm shadow-xl">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1">
              <Save className="w-4 text-blue-400" /> Save Document
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Saving to virtual folder: <strong className="text-slate-300">{currentExplorerPath}</strong>
            </p>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-[10px] text-slate-400 uppercase">File Name</label>
              <input
                type="text"
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                autoFocus
                className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded px-3 py-1.5 outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 text-xs">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={executeSaveAs}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded font-semibold transition"
              >
                Save File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-800 border-t border-slate-700 text-[10px] text-slate-400 font-mono">
        <div>Lines: {content.split('\n').length} | Words: {content.trim() ? content.trim().split(/\s+/).length : 0}</div>
        <div>UTF-8</div>
      </div>
    </div>
  );
};
