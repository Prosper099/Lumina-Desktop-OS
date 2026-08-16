import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { Terminal } from 'lucide-react';

interface LogLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success';
}

interface TerminalAppProps {
  id: string;
  args?: {
    autorun?: string;
  };
}

export const TerminalApp: React.FC<TerminalAppProps> = ({ id, args }) => {
  const {
    fileSystem,
    createFile,
    createDirectory,
    deleteItem,
    currentExplorerPath,
    setCurrentExplorerPath,
    addNotification,
    closeWindow
  } = useOS();

  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<LogLine[]>([
    { text: 'Microsoft Windows [Version 11.0.22621]', type: 'output' },
    { text: '(c) Microsoft Corporation. All rights reserved. Supported with Gemini AI.', type: 'output' },
    { text: 'Type "help" to list available shell controls.', type: 'output' },
    { text: '', type: 'output' }
  ]);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Handle auto-run from AI Command parameters
  useEffect(() => {
    if (args?.autorun) {
      executeCommand(args.autorun);
    }
  }, [args]);

  const executeCommand = async (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    // Append user input line
    const nextHistory = [...history, { text: `C:${currentExplorerPath}> ${trimmed}`, type: 'input' as const }];

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').replace(/['"']/g, ''); // strip outer quotes

    let outputLines: LogLine[] = [];

    // Filter current folder nodes
    const getFolderContents = (p: string) => {
      return fileSystem.filter(node => node.parentPath === p);
    };

    switch (command) {
      case 'help': {
        outputLines = [
          { text: 'SHELL VIRTUAL DRIVE COMMANDS:', type: 'success' },
          { text: '  help              Display this complete commands instruction card', type: 'output' },
          { text: '  ls / dir          List contents of the current folder', type: 'output' },
          { text: '  cd <folder>       Traverse directories. (Use "cd .." to regress)', type: 'output' },
          { text: '  cat <file>        Read and print file text', type: 'output' },
          { text: '  mkdir <folder>    Create a virtual directory in path', type: 'output' },
          { text: '  touch <file>      Create an empty file / write basic text', type: 'output' },
          { text: '  rm <item>         Permanently purge details of a file/folder', type: 'output' },
          { text: '  sys               Print hardware specifications & virtual RAM detail', type: 'output' },
          { text: '  ai "<prompt>"     Route high quality queries directly to Gemini in console', type: 'output' },
          { text: '  clear             Wipe console lines completely', type: 'output' },
          { text: '  exit              Close Terminal Window', type: 'output' }
        ];
        break;
      }
      case 'ls':
      case 'dir': {
        const contents = getFolderContents(currentExplorerPath);
        if (contents.length === 0) {
          outputLines = [{ text: ' Folder is empty.', type: 'output' }];
        } else {
          outputLines = contents.map(node => {
            const dateStr = new Date(node.updatedAt).toLocaleDateString();
            const timeStr = new Date(node.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const typeLabel = node.type === 'directory' ? '<DIR>' : `${node.size || 0} B`;
            return {
              text: `${dateStr}  ${timeStr}   ${typeLabel.padEnd(10)}  ${node.name}`,
              type: node.type === 'directory' ? 'success' : 'output'
            };
          });
        }
        break;
      }
      case 'cd': {
        if (!arg) {
          outputLines = [{ text: `Current Path: ${currentExplorerPath}`, type: 'output' }];
        } else if (arg === '..') {
          if (currentExplorerPath === '/' || currentExplorerPath === '') {
            outputLines = [{ text: 'Already at root registry.', type: 'output' }];
          } else {
            const parent = currentExplorerPath.split('/').slice(0, -1).join('/') || '/';
            setCurrentExplorerPath(parent);
          }
        } else {
          // Navigate to folder
          const targetPath = currentExplorerPath === '/' ? `/${arg}` : `${currentExplorerPath}/${arg}`;
          const folderExists = fileSystem.some(node => node.path === targetPath && node.type === 'directory');
          
          if (folderExists) {
            setCurrentExplorerPath(targetPath);
          } else {
            outputLines = [{ text: `Directory not found: "${arg}"`, type: 'error' }];
          }
        }
        break;
      }
      case 'cat': {
        if (!arg) {
          outputLines = [{ text: 'Provide a filename. e.g. "cat Welcome_Guide.txt"', type: 'error' }];
        } else {
          const targetPath = currentExplorerPath === '/' ? `/${arg}` : `${currentExplorerPath}/${arg}`;
          const targetNode = fileSystem.find(node => node.path === targetPath && node.type === 'file');
          if (targetNode) {
            outputLines = (targetNode.content || '').split('\n').map(line => ({ text: line, type: 'output' }));
          } else {
            outputLines = [{ text: `File not found: ${arg}`, type: 'error' }];
          }
        }
        break;
      }
      case 'mkdir': {
        if (!arg) {
          outputLines = [{ text: 'Please specify folder label.', type: 'error' }];
        } else {
          const folderPath = currentExplorerPath === '/' ? `/${arg}` : `${currentExplorerPath}/${arg}`;
          createDirectory(folderPath);
          outputLines = [{ text: `Created directory: "${arg}"`, type: 'success' }];
        }
        break;
      }
      case 'touch': {
        if (!arg) {
          outputLines = [{ text: 'Please specify file label.', type: 'error' }];
        } else {
          const filePath = currentExplorerPath === '/' ? `/${arg}` : `${currentExplorerPath}/${arg}`;
          createFile(filePath, 'Write text here...');
          outputLines = [{ text: `Created node file "${arg}" successfully.`, type: 'success' }];
        }
        break;
      }
      case 'rm': {
        if (!arg) {
          outputLines = [{ text: 'Please specify target file path to purge.', type: 'error' }];
        } else {
          const targetPath = currentExplorerPath === '/' ? `/${arg}` : `${currentExplorerPath}/${arg}`;
          const nodeExists = fileSystem.some(node => node.path === targetPath);
          if (nodeExists) {
            deleteItem(targetPath);
            outputLines = [{ text: `Permanently purged "${arg}" from disk.`, type: 'success' }];
          } else {
            outputLines = [{ text: `Unresolved path: "${arg}"`, type: 'error' }];
          }
        }
        break;
      }
      case 'sys': {
        outputLines = [
          { text: 'SYSTEM SYSTEM SPECIFICATIONS:', type: 'success' },
          { text: '  CPU:   AMD Ryzen Threadripper 5995WX (64-core, 128-thread sim node)', type: 'output' },
          { text: '  RAM:   64.0 GB LPDDR5 Virtual Stack', type: 'output' },
          { text: '  GPU:   Google TPU Core v4 Hyper-matrix', type: 'output' },
          { text: '  DISK:  100KB Virtual local quota storage registry', type: 'output' },
          { text: '  OS:    React Windows 11 Fluent Sim (aistudio-build container integration)', type: 'output' }
        ];
        break;
      }
      case 'clear': {
        setHistory([]);
        setInputVal('');
        return;
      }
      case 'exit': {
        closeWindow(id);
        return;
      }
      case 'ai': {
        if (!arg) {
          outputLines = [{ text: 'Acknowledge: Please write a query after ai. E.g: ai "write a poem"', type: 'error' }];
        } else {
          // Talk to Gemini via backend
          setHistory([...nextHistory, { text: 'Contacting Gemini model node...', type: 'output' }]);
          setInputVal('');
          try {
            const resp = await fetch('/api/gemini/command', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: arg, fileSystem: [] })
            });
            const data = await resp.json();
            outputLines = [
              { text: '[AI RESPONSE]', type: 'success' },
              ...data.reply.split('\n').map((line: string) => ({ text: line, type: 'output' as const }))
            ];
          } catch (err: any) {
            outputLines = [{ text: 'Terminal link error: ' + err.message, type: 'error' }];
          }
          setHistory(prev => [...prev, ...outputLines]);
          return;
        }
        break;
      }
      default: {
        outputLines = [{ text: `'${command}' is not recognized as an internal or external command, operable program or batch file. Type "help" for controls.`, type: 'error' }];
      }
    }

    setHistory([...nextHistory, ...outputLines]);
    setInputVal('');
  };

  return (
    <div className="flex flex-col h-full bg-black text-slate-100 font-mono text-sm leading-relaxed p-3 overflow-hidden select-text">
      {/* Scrollable logs */}
      <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin select-text">
        {history.map((line, idx) => (
          <div
            key={idx}
            className={`whitespace-pre-wrap leading-relaxed ${
              line.type === 'input' 
                ? 'text-slate-100 font-bold' 
                : line.type === 'error' 
                  ? 'text-red-400' 
                  : line.type === 'success' 
                    ? 'text-emerald-400 font-semibold' 
                    : 'text-slate-300'
            }`}
          >
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="flex items-center mt-2.5 pt-2 border-t border-slate-900 leading-none">
        <span className="text-emerald-500 font-bold mr-2 whitespace-nowrap">C:{currentExplorerPath}&gt;</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && executeCommand(inputVal)}
          autoFocus
          className="flex-1 bg-transparent border-none outline-none font-mono text-slate-100 leading-none text-sm"
          spellCheck="false"
        />
      </div>
    </div>
  );
};
