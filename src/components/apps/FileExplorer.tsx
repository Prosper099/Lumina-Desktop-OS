import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { 
  Folder, 
  FileText, 
  ArrowUp, 
  FolderPlus, 
  FilePlus, 
  Trash2, 
  ChevronRight, 
  CornerDownLeft, 
  Eye, 
  List, 
  Grid, 
  Search, 
  Upload, 
  Download, 
  Info, 
  Edit3, 
  X,
  // Windows Explorer custom components
  Monitor,
  Cpu,
  Home,
  DownloadCloud,
  Image,
  Video,
  HardDrive,
  Sparkles,
  Clipboard,
  Copy,
  Scissors,
  RefreshCw,
  Plus,
  Compass,
  Play,
  Film
} from 'lucide-react';
import { FSNode } from '../../types';
import { 
  getVideoUrlForFile, 
  getRecordingResult, 
  downloadRecordingBlob, 
  downloadVideoFile,
  dataUrlToBlob,
  formatRecordingDuration 
} from '../../utils/screenRecorder';

export const FileExplorer: React.FC = () => {
  const {
    fileSystem,
    createFile,
    createDirectory,
    deleteItem,
    renameItem,
    currentExplorerPath,
    setCurrentExplorerPath,
    openWindow,
    addNotification,
    sendAICommand,
    isAIPending
  } = useOS();

  // Standard File Explorer States
  const [newItemName, setNewItemName] = useState('');
  const [addingType, setAddingType] = useState<'folder' | 'file' | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<{
    name: string;
    url: string;
    duration?: number;
    timestamp?: string;
    content?: string;
  } | null>(null);
  
  // Custom Premium Features States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchGlobally, setSearchGlobally] = useState(false);
  const [showProperties, setShowProperties] = useState(true);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  // Custom Windows Explorer states (Clipboard, Context Menu, Inline AI Prompter)
  const [clipboard, setClipboard] = useState<{ path: string; action: 'copy' | 'cut' } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetPath: string | null } | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAISending, setIsAISending] = useState(false);
  
  // Rename Modal States
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close context menu on any outside click
  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Filter out nodes depending on current path and search options
  const filterNodes = () => {
    let baseNodes = fileSystem;
    
    if (!searchGlobally) {
      baseNodes = fileSystem.filter(node => node.parentPath === currentExplorerPath);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return baseNodes.filter(node => node.name.toLowerCase().includes(q));
    }
    
    return baseNodes;
  };

  const currentNodes = filterNodes();
  const selectedNode = fileSystem.find(n => n.path === selectedPath);

  // Navigate back to the parent folder
  const handleNavigateUp = () => {
    if (currentExplorerPath === '/' || currentExplorerPath === '') return;
    const parent = currentExplorerPath.split('/').slice(0, -1).join('/') || '/';
    setCurrentExplorerPath(parent);
    setSelectedPath(null);
  };

  // Switch folder and ensure the folder exists (auto directories)
  const navigateWithAutoDir = (path: string) => {
    const exists = fileSystem.some(n => n.path === path && n.type === 'directory');
    if (!exists && path !== '/') {
      createDirectory(path);
      addNotification('Directory Initialized', `Auto-created system target directory: C:${path}`, 'info');
    }
    setCurrentExplorerPath(path);
    setSelectedPath(null);
  };

  // Helper to determine if a node is a video or screen recording
  const isVideoFile = (node: FSNode) => {
    if (node.type === 'directory') return false;
    if (node.name.match(/\.(webm|mp4|mov|mkv|avi|ogv)$/i)) return true;
    if (node.content && (
      node.content.startsWith('data:video/') || 
      node.content.startsWith('blob:') || 
      node.content.includes('Lumina OS Screen Recording File') ||
      node.content.includes('URL: blob:')
    )) return true;
    if (node.path.startsWith('/Videos/')) return true;
    return !!getRecordingResult(node.name);
  };

  const resolveVideoUrl = (node: FSNode): string | null => {
    return getVideoUrlForFile(node.name, node.content);
  };

  // Directory traversal vs app launch
  const handleNodeDoubleClick = (node: FSNode) => {
    if (node.type === 'directory') {
      setCurrentExplorerPath(node.path);
      setSelectedPath(null);
    } else {
      openFile(node);
    }
  };

  const openFile = (node: FSNode) => {
    if (isVideoFile(node)) {
      const videoUrl = resolveVideoUrl(node) || '';
      const recMeta = getRecordingResult(node.name);
      setPreviewVideo({
        name: node.name,
        url: videoUrl,
        duration: recMeta?.durationSeconds,
        timestamp: recMeta?.timestamp,
        content: node.content
      });
    } else if (node.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) || (node.content && node.content.startsWith('data:image'))) {
      setPreviewImage(node.content || null);
    } else {
      openWindow('notepad', { path: node.path, content: node.content });
    }
  };

  // Create folder or file action
  const handleCreateNode = () => {
    if (!newItemName.trim()) return;
    const finalName = newItemName.trim();
    
    const proposedPath = currentExplorerPath === '/' ? `/${finalName}` : `${currentExplorerPath}/${finalName}`;
    const duplicate = fileSystem.find(n => n.path === proposedPath);
    if (duplicate) {
      addNotification('Duplicate Name', `An item with the name "${finalName}" already exists.`, 'warning');
      return;
    }

    if (addingType === 'folder') {
      createDirectory(proposedPath);
      addNotification('Folder Created', `Folder "${finalName}" created in ${currentExplorerPath}`, 'success');
    } else if (addingType === 'file') {
      const fileLabel = finalName.includes('.') ? finalName : finalName + '.txt';
      const fileFullPath = currentExplorerPath === '/' ? `/${fileLabel}` : `${currentExplorerPath}/${fileLabel}`;
      createFile(fileFullPath, 'Created via local UI. Double-click or open in Notepad to overwrite this text.');
      addNotification('File Created', `Plain text "${fileLabel}" added successfully.`, 'success');
    }

    setNewItemName('');
    setAddingType(null);
  };

  // Delete selection action
  const handleDeleteSelected = () => {
    if (selectedPath) {
      const targetName = selectedPath.split('/').pop();
      deleteItem(selectedPath);
      setSelectedPath(null);
      addNotification('Deleted Successfully', `Permanently removed "${targetName}" from virtual workspace.`, 'info');
    }
  };

  // Rename actions
  const triggerRenameFlow = () => {
    if (selectedNode) {
      setRenamingPath(selectedNode.path);
      setRenamingName(selectedNode.name);
    }
  };

  const handleRenameConfirm = () => {
    if (!renamingName.trim() || !renamingPath) return;
    const finalName = renamingName.trim();
    
    const segments = renamingPath.split('/');
    segments[segments.length - 1] = finalName;
    const newPath = segments.join('/');

    if (fileSystem.find(n => n.path === newPath && n.path !== renamingPath)) {
      addNotification('Naming Match Collision', `An item named "${finalName}" already exists on the target path.`, 'warning');
      return;
    }

    renameItem(renamingPath, finalName);
    addNotification('File Renamed', `Changed file to "${finalName}" successfully.`, 'success');
    setSelectedPath(newPath);
    setRenamingPath(null);
  };

  // Copy-Cut-Paste System
  const handleCopy = (path: string) => {
    setClipboard({ path, action: 'copy' });
    addNotification('Item Copied', `Copied "${path.split('/').pop()}" to OS clipboard.`, 'info');
  };

  const handleCut = (path: string) => {
    setClipboard({ path, action: 'cut' });
    addNotification('Item Cut', `Prepared "${path.split('/').pop()}" to cut and move.`, 'info');
  };

  const handlePaste = () => {
    if (!clipboard) return;
    const sourceNode = fileSystem.find(n => n.path === clipboard.path);
    if (!sourceNode) {
      addNotification('Paste Error', 'Source file could not be fetched from simulated memory.', 'error');
      return;
    }

    const sourceName = sourceNode.name;
    const destinationPath = currentExplorerPath === '/' ? `/${sourceName}` : `${currentExplorerPath}/${sourceName}`;

    if (clipboard.path === currentExplorerPath || currentExplorerPath.startsWith(clipboard.path + '/')) {
      addNotification('Clipboard Loop', 'Cannot replicate a folder tree nested inside itself.', 'error');
      return;
    }

    if (sourceNode.type === 'file') {
      let targetPath = destinationPath;
      if (fileSystem.find(n => n.path === targetPath)) {
        const parts = sourceName.split('.');
        const ext = parts.pop();
        const base = parts.join('.');
        const uniqueName = ext ? `${base}_copy.${ext}` : `${sourceName}_copy`;
        targetPath = currentExplorerPath === '/' ? `/${uniqueName}` : `${currentExplorerPath}/${uniqueName}`;
      }

      createFile(targetPath, sourceNode.content || '');
      addNotification('File Pasted', `Successfully pasted file into current path.`, 'success');

      if (clipboard.action === 'cut') {
        deleteItem(clipboard.path);
        setClipboard(null);
      }
    } else {
      let targetFolderPath = destinationPath;
      if (fileSystem.find(n => n.path === targetFolderPath)) {
        targetFolderPath = currentExplorerPath === '/' ? `/${sourceName}_copy` : `${currentExplorerPath}/${sourceName}_copy`;
      }

      createDirectory(targetFolderPath);

      const prefix = clipboard.path + '/';
      const descendants = fileSystem.filter(node => node.path.startsWith(prefix));

      descendants.forEach(desc => {
        const relativeSeg = desc.path.substring(prefix.length);
        const childTarget = `${targetFolderPath}/${relativeSeg}`;
        if (desc.type === 'directory') {
          createDirectory(childTarget);
        } else {
          createFile(childTarget, desc.content || '');
        }
      });

      addNotification('Folder Tree Pasted', `Replicated folder directory recursively.`, 'success');

      if (clipboard.action === 'cut') {
        deleteItem(clipboard.path);
        setClipboard(null);
      }
    }
  };

  // Drag and drop processing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processNativeFiles(e.target.files);
    }
  };

  const processNativeFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      const isMedia = file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/');

      reader.onload = (e) => {
        const fileContent = e.target?.result as string;
        const targetPath = currentExplorerPath === '/' 
          ? `/${file.name}` 
          : `${currentExplorerPath}/${file.name}`;
        
        createFile(targetPath, fileContent);
        addNotification('System Import', `Uploaded "${file.name}" to simulated drive successfully.`, 'success');
      };

      if (isMedia) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processNativeFiles(e.dataTransfer.files);
    }
  };

  // File download helper
  const handleDownloadSelected = () => {
    if (!selectedNode || selectedNode.type === 'directory') return;

    if (isVideoFile(selectedNode)) {
      const ok = downloadVideoFile(selectedNode.name, selectedNode.content);
      if (ok) {
        addNotification('Download Ready', `Exporting video recording "${selectedNode.name}"`, 'success');
        return;
      }
    }

    const element = document.createElement('a');
    if (selectedNode.content?.startsWith('data:')) {
      try {
        const blob = dataUrlToBlob(selectedNode.content);
        const url = URL.createObjectURL(blob);
        element.href = url;
        element.download = selectedNode.name;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        setTimeout(() => {
          try { URL.revokeObjectURL(url); } catch (_) {}
        }, 500);
        addNotification('Download Ready', `File "${selectedNode.name}" exported successfully.`, 'success');
        return;
      } catch (_) {
        element.href = selectedNode.content;
      }
    } else if (selectedNode.content?.startsWith('blob:')) {
      element.href = selectedNode.content;
    } else {
      if (isVideoFile(selectedNode)) {
        addNotification('Video Export Notice', 'No binary video data found in record. Please record a new clip.', 'warning');
        return;
      }
      const file = new Blob([selectedNode.content || ''], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
    }
    element.download = selectedNode.name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    addNotification('Download Ready', `File "${selectedNode.name}" exported to client downloads folder.`, 'success');
  };

  // Direct Inline AI File Agent execution
  const handleAIStepSubmit = async () => {
    if (!aiPrompt.trim() || isAISending) return;
    const initialPromptText = aiPrompt.trim();
    setAiPrompt('');
    setIsAISending(true);
    addNotification('Lumina AI Active', 'Thinking about your filesystem instruction...', 'info');

    try {
      // Craft instruction with complete contextual folder listings
      const contextualRefPrompt = `You are a helper AI executing inside the user's live simulated File Explorer.
Current Working Path directory: "${currentExplorerPath}"
The filesystem tree in OS: ${JSON.stringify(fileSystem.map(n => ({ path: n.path, type: n.type })))}

User requested filesystem manipulation task: "${initialPromptText}"

Please process the user's task and compile the actions needed (e.g. creating files, directories, renaming files, deleting files, or opening apps in user OS). Your actions list will execute automatically! Thank you!`;

      await sendAICommand(contextualRefPrompt);
      addNotification('Lumina Agent Complete', 'Successfully processed your request!', 'success');
    } catch (e: any) {
      addNotification('AI Task Failed', e.message || 'Error occurred while contacting model.', 'error');
    } finally {
      setIsAISending(false);
    }
  };

  // Intercepting Right-Click events
  const handleItemContextMenu = (e: React.MouseEvent, node: FSNode) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedPath(node.path);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetPath: node.path
    });
  };

  const handleContainerContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetPath: null
    });
  };

  // Formatting utilities for statistics
  const formatSize = (bytes?: number) => {
    if (bytes === undefined) return '--';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans select-none overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Absolute Drag Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-md z-45 flex flex-col items-center justify-center p-6 border-4 border-dashed border-blue-400 m-2 rounded-2xl animate-pulse pointer-events-none">
          <Upload className="w-16 h-16 text-blue-400 mb-2" />
          <div className="text-sm font-bold text-white tracking-widest uppercase">Drop files to upload</div>
          <p className="text-xs text-blue-200 mt-1">Files will be loaded directly into virtual Local Disk C:</p>
        </div>
      )}

      {/* Top Application Ribbon */}
      <div className="flex flex-wrap items-center gap-2.5 px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
        <button
          onClick={handleNavigateUp}
          disabled={currentExplorerPath === '/' || currentExplorerPath === ''}
          className="flex items-center gap-1 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent px-2.5 py-1.5 rounded-lg border border-white/5 transition font-semibold cursor-pointer text-slate-200"
          title="Back to parent folder"
        >
          <ArrowUp className="w-3.5 h-3.5" /> Back
        </button>

        <div className="h-5 w-px bg-slate-800 font-mono" />

        <button
          onClick={() => { setAddingType('folder'); setNewItemName(''); }}
          className="flex items-center gap-1.5 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-white/5 text-sky-400 transition cursor-pointer font-semibold"
        >
          <FolderPlus className="w-3.5 h-3.5 font-bold" /> New Folder
        </button>
        <button
          onClick={() => { setAddingType('file'); setNewItemName(''); }}
          className="flex items-center gap-1.5 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-white/5 text-emerald-400 transition cursor-pointer font-semibold"
        >
          <FilePlus className="w-3.5 h-3.5 font-bold" /> New File
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-white/5 cursor-pointer transition font-semibold"
          title="Upload multiple text or image files"
        >
          <Upload className="w-3.5 h-3.5 text-blue-400" /> Upload
        </button>

        <input 
          type="file" 
          ref={fileInputRef} 
          multiple 
          onChange={handleFileUpload} 
          className="hidden" 
          accept=".txt,.json,.md,.js,.ts,.css,.html,.png,.jpg,.jpeg,.gif"
        />

        <div className="h-5 w-px bg-slate-800 font-mono" />

        <button
          onClick={triggerRenameFlow}
          disabled={!selectedNode}
          className="flex items-center gap-1.5 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-amber-400 px-2.5 py-1.5 rounded-lg border border-white/5 cursor-pointer transition font-semibold"
          title="Rename selected directory or file"
        >
          <Edit3 className="w-3.5 h-3.5" /> Rename
        </button>

        {selectedNode && selectedNode.type === 'file' && (
          <button
            onClick={handleDownloadSelected}
            className="flex items-center gap-1.5 hover:bg-slate-800 text-violet-400 px-2.5 py-1.5 rounded-lg border border-white/5 cursor-pointer transition font-semibold"
            title="Download virtual file to actual computer download disk"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        )}

        {clipboard && (
          <button
            onClick={handlePaste}
            className="flex items-center gap-1.5 hover:bg-emerald-950/40 border border-emerald-900 px-2.5 py-1.5 rounded-lg text-emerald-400 transition cursor-pointer font-semibold"
            title="Paste copied or cut file here"
          >
            <Clipboard className="w-3.5 h-3.5 animate-pulse" /> Paste Item
          </button>
        )}

        <button
          onClick={handleDeleteSelected}
          disabled={!selectedPath}
          className="flex items-center gap-1.5 hover:bg-red-950/40 border border-white/5 hover:border-red-800 text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded-lg transition disabled:opacity-30 disabled:border-white/5 disabled:hover:text-red-400 disabled:hover:bg-transparent cursor-pointer font-semibold"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>

        {/* View togglers align right */}
        <div className="ml-auto flex items-center gap-1 bg-slate-950 p-1 border border-white/5 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg cursor-pointer transition ${viewMode === 'grid' ? 'bg-slate-800 text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
            title="Grid Icons View"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg cursor-pointer transition ${viewMode === 'list' ? 'bg-slate-800 text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
            title="Detailed Columns List View"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-slate-800" />
          <button
            onClick={() => setShowProperties(!showProperties)}
            className={`p-1.5 rounded-lg cursor-pointer transition ${showProperties ? 'bg-slate-800 text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
            title="Sided Metadata Properties Panel"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Path Breadcrumbs & Search Utility */}
      <div className="flex items-center justify-between gap-4 px-4 py-2 bg-slate-900 border-b border-slate-800/60 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-1 flex-1 overflow-hidden">
          <span className="text-slate-500 hover:text-slate-300 uppercase tracking-wide shrink-0 font-bold select-none">Drive C:</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <div className="flex items-center gap-1 truncate text-slate-300 font-medium select-none">
            <span onClick={() => setCurrentExplorerPath('/')} className="hover:underline hover:text-sky-400 cursor-pointer text-slate-400">root</span>
            {currentExplorerPath.split('/').map((segment, idx) => (
              <React.Fragment key={idx}>
                {segment && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span 
                      onClick={() => {
                        const pathSlice = currentExplorerPath.split('/').slice(0, idx + 1).join('/');
                        setCurrentExplorerPath(pathSlice || '/');
                      }}
                      className="hover:underline hover:text-sky-400 cursor-pointer"
                    >
                      {segment}
                    </span>
                  </>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Dynamic Search Box */}
        <div className="flex items-center gap-2 shrink-0 select-none">
          <div className="relative flex items-center">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search current disk C: ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700/80 rounded-full pl-7 pr-3 py-1 text-[10px] text-slate-200 focus:border-blue-700 outline-none w-44 transition text-ellipsis"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-slate-500 hover:text-slate-300 bg-transparent border-none outline-none cursor-pointer p-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
          <label className="flex items-center gap-1.5 text-[9px] text-slate-400 cursor-pointer font-sans bg-slate-950 hover:bg-slate-800 border border-white/5 py-1 px-2.5 rounded-full select-none transition">
            <input 
              type="checkbox" 
              checked={searchGlobally} 
              onChange={() => setSearchGlobally(!searchGlobally)} 
              className="accent-blue-500 pointer-events-auto cursor-pointer"
            />
            Global
          </label>
        </div>
      </div>

      {/* Main Panel Frame: Navigation Sidebar, Explorer Canvas Files Grid/List & Properties panel */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* LEFT WINDOWS EXPLORER NAVIGATION SIDEBAR */}
        <aside className="w-[195px] max-w-[40%] bg-slate-900 border-r border-slate-800 flex flex-col justify-between truncate shrink-0 select-none overflow-y-auto scrollbar-none">
          
          <div className="flex flex-col gap-1 py-3">
            {/* Header: NAVIGATION */}
            <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500/80 font-sans px-4.5 mb-2.5">
              Navigation
            </h2>

            {/* This PC Navigation Element */}
            <div className="px-2">
              <button
                onClick={() => navigateWithAutoDir('/')}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-left text-xs transition cursor-pointer font-sans ${
                  currentExplorerPath === '/'
                    ? 'bg-blue-600 font-extrabold text-white shadow-md shadow-blue-600/10'
                    : 'text-slate-300 hover:bg-slate-800/60 font-medium hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="truncate">This PC</span>
              </button>
              
              {/* Indented Local Disk (C:) */}
              <div className="pl-3 mt-1">
                <button
                  onClick={() => navigateWithAutoDir('/')}
                  className={`w-full flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-left text-xs transition cursor-pointer font-sans ${
                    currentExplorerPath === '/'
                      ? 'bg-blue-900/20 text-sky-300 border border-sky-900/30'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-white font-medium'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">Local Disk (C:)</span>
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-800/40 my-2 mx-3.5" />

            {/* General Directories Navigation */}
            <div className="px-2 space-y-1">
              {[
                { name: 'System Root (/)', path: '/', icon: Cpu, color: 'text-purple-400' },
                { name: 'Desktop', path: '/Desktop', icon: Home, color: 'text-amber-400' },
                { name: 'Downloads', path: '/Downloads', icon: DownloadCloud, color: 'text-emerald-400' },
                { name: 'Documents', path: '/Documents', icon: FileText, color: 'text-blue-400' },
                { name: 'Pictures', path: '/Pictures', icon: Image, color: 'text-rose-400' },
                { name: 'Videos', path: '/Videos', icon: Video, color: 'text-teal-400' }
              ].map((item, idx) => {
                const isActive = currentExplorerPath === item.path;
                const IconComp = item.icon;
                
                return (
                  <button
                    key={idx}
                    onClick={() => navigateWithAutoDir(item.path)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-left text-xs transition cursor-pointer font-sans ${
                      isActive
                        ? 'bg-blue-600 font-extrabold text-white shadow-md shadow-blue-600/10'
                        : 'text-slate-300 hover:bg-slate-800/60 font-medium hover:text-white'
                    }`}
                  >
                    <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.color}`} />
                    <span className="truncate">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Disk space visual indicator */}
          <div className="p-3 mx-2.5 mb-2.5 bg-slate-950/40 rounded-xl border border-white/5 select-none font-sans">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
              <HardDrive className="w-3 h-3 text-sky-400" /> System Unit Space
            </div>
            
            <div className="mt-1.5 relative h-1.5 w-full bg-slate-900 border border-white/5 rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(100, (fileSystem.length * 100) / 120)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[8.5px] font-mono text-slate-400 mt-1">
              <span>{formatSize(fileSystem.reduce((acc, curr) => acc + (curr.size || curr.content?.length || 0), 0))} used</span>
              <span>128 GB Disk C:</span>
            </div>
          </div>

          {/* ✨ Premium Interactive Inline AI File Agent Input block */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 shrink-0">
            <div className="flex items-center gap-1.5 text-[9.5px] font-bold font-mono uppercase text-purple-400 tracking-wider mb-1.5 select-none">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse shrink-0" /> Lumina AI File Agent
            </div>
            <div className="flex items-center gap-1.5 relative">
              <input
                type="text"
                placeholder="Organize this folder..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAIStepSubmit()}
                disabled={isAISending || isAIPending}
                className="w-full bg-slate-900 outline-none placeholder-slate-600 text-[10px] text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-800 focus:border-purple-600 transition truncate pr-6 font-medium disabled:opacity-45"
              />
              <button
                onClick={handleAIStepSubmit}
                disabled={!aiPrompt.trim() || isAISending || isAIPending}
                className="absolute right-1 text-purple-400 hover:text-purple-300 transition cursor-pointer disabled:opacity-30 bg-transparent py-0.5 px-1 rounded hover:bg-slate-800"
                title="Direct AI Instruction execution"
              >
                <CornerDownLeft className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[8px] text-slate-500/90 font-mono mt-1.5 leading-snug">
              Instruct system AI to arrange, clean, rename, or write contents instantly.
            </p>
          </div>
        </aside>

        {/* Dynamic Canvas Area (GRID or LIST files) */}
        <div 
          className="flex-1 p-4.5 overflow-y-auto bg-slate-950 relative"
          onContextMenu={handleContainerContextMenu}
        >
          {/* AI Executing Loading Overlay */}
          {(isAISending || isAIPending) && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 select-none animate-fade-in pointer-events-none">
              <Sparkles className="w-10 h-10 text-purple-400 animate-spin mb-3 stroke-[1.5]" />
              <div className="text-xs font-bold text-white tracking-widest uppercase font-mono animate-pulse">Lumina AI organizing folder...</div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono max-w-[250px] text-center leading-relaxed">Evaluating virtual files and running filesystem operations asynchronously.</p>
            </div>
          )}

          {/* Add Folder/File Input Card */}
          {addingType && (
            <div className="flex items-center gap-2 mb-4 bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 max-w-sm animate-fade-in shadow-xl z-10 relative">
              <span className="text-[10px] uppercase font-extrabold text-blue-400 px-1 font-mono tracking-wider">{addingType}</span>
              <input
                type="text"
                placeholder={addingType === 'folder' ? 'DesignFolder' : 'document.txt'}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateNode()}
                autoFocus
                className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs rounded-lg px-2.5 py-1.5 outline-none text-slate-200 font-medium font-mono"
              />
              <button
                onClick={handleCreateNode}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-blue-400 hover:text-blue-300 transition cursor-pointer"
                title="Create"
              >
                <CornerDownLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAddingType(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {currentNodes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500/80 py-16 text-center select-none">
              <Folder className="w-14 h-14 text-slate-800 mb-2.5 stroke-[1.25]" />
              <div className="text-xs font-bold font-sans text-slate-400 uppercase tracking-widest leading-none">Folder Empty</div>
              <p className="text-[10px] text-slate-600 mt-1.5 font-mono max-w-[210px] leading-relaxed mx-auto">This directory is silent. Paste items (Clipboard) or click New folder to start.</p>
            </div>
          ) : (
            viewMode === 'grid' ? (
              /* GRID VIEW INTERACTIVE COMPONENT */
              <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                {currentNodes.map(node => {
                  const isSelected = selectedPath === node.path;
                  const isImage = node.name.match(/\.(png|jpg|jpeg|gif)$/i) || (node.content && node.content.startsWith('data:image'));
                  
                  return (
                    <div
                      key={node.path}
                      onClick={(e) => { e.stopPropagation(); setSelectedPath(node.path); }}
                      onDoubleClick={(e) => { e.stopPropagation(); handleNodeDoubleClick(node); }}
                      onContextMenu={(e) => handleItemContextMenu(e, node)}
                      className={`flex flex-col items-center justify-between p-3.5 rounded-xl border text-center transition cursor-pointer group min-h-[105px] relative ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-900/10 shadow-lg shadow-blue-500/5' 
                          : 'border-white/5 hover:border-slate-800 hover:bg-slate-900/30'
                      }`}
                    >
                      {/* Clipboard state indicator on node */}
                      {clipboard?.path === node.path && (
                        <div className="absolute top-1 right-1 px-1 bg-amber-500/80 border border-amber-400 rounded text-[7px] font-mono text-slate-950 font-extrabold uppercase select-none scale-90">
                          {clipboard.action}
                        </div>
                      )}

                      {isImage ? (
                        <div className="w-12 h-12 rounded border border-white/10 overflow-hidden bg-slate-900 flex items-center justify-center p-0.5 group-hover:scale-105 transition shadow">
                          <img src={node.content} alt={node.name} className="w-full h-full object-cover rounded" referrerPolicy="no-referrer" />
                        </div>
                      ) : isVideoFile(node) ? (
                        <div className="w-12 h-12 rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-950/80 to-slate-900 flex items-center justify-center p-0.5 group-hover:scale-105 transition shadow relative overflow-hidden">
                          <Video className="w-6 h-6 text-teal-400" />
                          <div className="absolute inset-0 bg-teal-500/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <Play className="w-4 h-4 text-white fill-white" />
                          </div>
                          <span className="absolute bottom-0.5 right-1 text-[7px] font-mono text-teal-300 font-bold">REC</span>
                        </div>
                      ) : node.type === 'directory' ? (
                        <Folder className="w-12 h-12 text-yellow-500 fill-yellow-600/10 group-hover:scale-105 transition stroke-[1.6]" />
                      ) : (
                        <FileText className="w-12 h-12 text-blue-400 group-hover:scale-105 transition stroke-[1.6]" />
                      )}

                      <span className="text-[11px] text-slate-200 font-semibold truncate w-full mt-2.5 leading-normal font-sans">
                        {node.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* DETAILED COLUMNS LIST VIEW */
              <div className="border border-white/5 rounded-xl overflow-hidden bg-slate-900/15">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-white/5 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                      <th className="py-2.5 px-4 font-bold">Name</th>
                      <th className="py-2.5 px-4 font-bold">Date Modified</th>
                      <th className="py-2.5 px-4 font-bold">Type</th>
                      <th className="py-2.5 px-4 font-bold text-right">Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentNodes.map(node => {
                      const isSelected = selectedPath === node.path;
                      const isImage = node.name.match(/\.(png|jpg|jpeg|gif)$/i) || (node.content && node.content.startsWith('data:image'));
                      
                      return (
                        <tr
                          key={node.path}
                          onClick={(e) => { e.stopPropagation(); setSelectedPath(node.path); }}
                          onDoubleClick={(e) => { e.stopPropagation(); handleNodeDoubleClick(node); }}
                          onContextMenu={(e) => handleItemContextMenu(e, node)}
                          className={`border-b border-slate-900 last:border-none transition cursor-pointer select-none text-[11.5px] ${
                            isSelected ? 'bg-blue-900/15 text-blue-300' : 'hover:bg-slate-900/50'
                          }`}
                        >
                          <td className="py-2.5 px-4 flex items-center gap-2.5 font-semibold text-slate-200 truncate max-w-[240px] relative">
                            {clipboard?.path === node.path && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Item in clipboard" />
                            )}
                            {isImage ? (
                              <div className="w-5 h-5 rounded overflow-hidden bg-slate-950 shrink-0">
                                <img src={node.content} alt={node.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            ) : isVideoFile(node) ? (
                              <div className="w-5 h-5 rounded bg-teal-950/80 border border-teal-500/40 flex items-center justify-center shrink-0">
                                <Video className="w-3.5 h-3.5 text-teal-400" />
                              </div>
                            ) : node.type === 'directory' ? (
                              <Folder className="w-4 h-4 text-yellow-500 shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                            )}
                            <span className="truncate">{node.name}</span>
                          </td>
                          <td className="py-2 px-4 text-slate-400 font-mono">{formatDate(node.updatedAt)}</td>
                          <td className="py-2 px-4 text-slate-500 font-mono uppercase">
                            {node.type === 'directory' ? 'File Folder' : isVideoFile(node) ? 'Screen Recording Video' : node.name.split('.').pop() + ' file'}
                          </td>
                          <td className="py-2 px-4 text-slate-400 text-right font-mono font-medium">
                            {node.type === 'directory' ? '--' : formatSize(node.size || node.content?.length)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Sidebar Properties Summary Frame */}
        {showProperties && (
          <aside className="w-[245px] border-l border-slate-800 bg-slate-900 p-4.5 flex flex-col gap-4 overflow-y-auto truncate shrink-0 scrollbar-none animate-fade-in text-[11px]">
            {selectedNode ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5 select-none">
                  <h3 className="text-[10px] font-extrabold uppercase text-slate-400 font-mono tracking-widest">Metadata Properties</h3>
                  <button 
                    onClick={() => setSelectedPath(null)}
                    className="text-slate-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Graph preview node */}
                <div className="flex flex-col items-center justify-center py-4 bg-slate-950/40 rounded-xl border border-white/5 min-h-[110px]">
                  {selectedNode.name.match(/\.(png|jpg|jpeg|gif)$/i) || (selectedNode.content && selectedNode.content.startsWith('data:image')) ? (
                    <div className="w-20 h-20 rounded border border-white/10 overflow-hidden bg-slate-950 shadow-lg p-0.5">
                      <img src={selectedNode.content} alt={selectedNode.name} className="w-full h-full object-cover rounded" referrerPolicy="no-referrer" />
                    </div>
                  ) : isVideoFile(selectedNode) ? (
                    <div className="w-full px-2 flex flex-col items-center gap-2">
                      <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shadow-lg shadow-teal-500/10">
                        <Video className="w-8 h-8" />
                      </div>
                      <button
                        onClick={() => openFile(selectedNode)}
                        className="w-full py-1.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-teal-600/20"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        Play Video
                      </button>
                    </div>
                  ) : selectedNode.type === 'directory' ? (
                    <Folder className="w-16 h-16 text-yellow-500 fill-yellow-600/5 stroke-[1.25]" />
                  ) : (
                    <FileText className="w-16 h-16 text-blue-400 stroke-[1.25]" />
                  )}
                  <span className="text-xs font-bold text-white text-center px-2 mt-3 truncate w-full select-text">{selectedNode.name}</span>
                  <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase">
                    {selectedNode.type === 'directory' ? 'Simulated Folder' : isVideoFile(selectedNode) ? 'Screen Recording (WebM)' : 'Plain-Text Doc'}
                  </span>
                </div>

                {/* Info listings */}
                <div className="space-y-2 font-mono">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block leading-none">Virtual Path:</span>
                    <span className="text-slate-300 font-medium select-text break-all">C:{selectedNode.path}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block leading-none">Size on disk:</span>
                    <span className="text-slate-300 font-medium">
                      {selectedNode.type === 'directory' 
                        ? fileSystem.filter(n => n.path.startsWith(selectedNode.path + '/')).length + ' sub-objects'
                        : formatSize(selectedNode.size || selectedNode.content?.length)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block leading-none">Created timestamp:</span>
                    <span className="text-slate-300 text-[10px] leading-tight block">{formatDate(selectedNode.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block leading-none">Modified timestamp:</span>
                    <span className="text-slate-300 text-[10px] leading-tight block">{formatDate(selectedNode.updatedAt)}</span>
                  </div>
                </div>

                {/* Sub-content Preview */}
                {selectedNode.type === 'file' && selectedNode.content && !selectedNode.content.startsWith('data:') && (
                  <div className="flex flex-col gap-1 border-t border-white/5 pt-3">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Text preview:</span>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-white/5 text-[9.5px] font-mono text-slate-400 select-text max-h-[140px] overflow-y-auto whitespace-pre-wrap break-all scrollbar-none leading-relaxed">
                      {selectedNode.content.length > 250 
                        ? selectedNode.content.slice(0, 250) + '...' 
                        : selectedNode.content}
                    </div>
                  </div>
                )}

                {/* Context actions */}
                <div className="flex flex-col gap-1.5 border-t border-white/5 pt-3 select-none">
                  <button
                    onClick={() => openFile(selectedNode)}
                    className="w-full text-center bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded-lg font-bold transition cursor-pointer text-xs"
                  >
                    Open Item
                  </button>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleCopy(selectedNode.path)}
                      className="text-center bg-slate-800 hover:bg-slate-700 text-slate-200 py-1 rounded transition border border-white/5 cursor-pointer font-semibold text-[10px]"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => handleCut(selectedNode.path)}
                      className="text-center bg-slate-800 hover:bg-slate-700 text-slate-200 py-1 rounded transition border border-white/5 cursor-pointer font-semibold text-[10px]"
                    >
                      Cut
                    </button>
                  </div>
                  {selectedNode.type === 'file' && (
                    <button
                      onClick={handleDownloadSelected}
                      className="w-full text-center bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-lg transition border border-white/5 cursor-pointer font-semibold text-xs"
                    >
                      Export/Download
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500/80 py-12 select-none">
                <Info className="w-10 h-10 text-slate-700/60 mb-2 stroke-[1.25]" />
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">No Selection</div>
                <p className="text-[9px] text-slate-600 font-mono mt-1 px-4 leading-relaxed">Click a virtual file or directory to preview properties and diagnostic records here.</p>
              </div>
            )}
          </aside>
        )}

        {/* CUSTOM ABSOLUTE WINDOWS CONTEXT MENU */}
        {contextMenu && (
          <div 
            className="absolute bg-slate-900 border border-slate-700/90 rounded-2xl p-1.5 w-44 shadow-2xl z-50 animate-fade-in font-sans text-slate-200 text-xs flex flex-col gap-0.5 select-none"
            style={{ top: contextMenu.y - 70, left: Math.min(window.innerWidth - 220, contextMenu.x - 20) }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.targetPath ? (
              <>
                {/* File Operation actions */}
                <button 
                  onClick={() => {
                    const node = fileSystem.find(n => n.path === contextMenu.targetPath);
                    if (node) openFile(node);
                    setContextMenu(null);
                  }}
                  className="w-full hover:bg-slate-800/85 hover:text-white text-left px-2.5 py-1.5 rounded-lg transition flex items-center gap-2 cursor-pointer font-semibold"
                >
                  {(() => {
                    const targetNode = fileSystem.find(n => n.path === contextMenu.targetPath);
                    if (targetNode && isVideoFile(targetNode)) {
                      return <><Play className="w-3.5 h-3.5 text-teal-400 fill-teal-400" /> Play Video</>;
                    }
                    return <><Eye className="w-3.5 h-3.5 text-blue-400" /> Open</>;
                  })()}
                </button>
                <div className="h-px bg-slate-800 my-1" />
                <button 
                  onClick={() => { handleCopy(contextMenu.targetPath!); setContextMenu(null); }}
                  className="w-full hover:bg-slate-800/85 hover:text-white text-left px-2.5 py-1.5 rounded-lg transition flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy
                </button>
                <button 
                  onClick={() => { handleCut(contextMenu.targetPath!); setContextMenu(null); }}
                  className="w-full hover:bg-slate-800/85 hover:text-white text-left px-2.5 py-1.5 rounded-lg transition flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Scissors className="w-3.5 h-3.5 text-slate-400" /> Cut
                </button>
                <div className="h-px bg-slate-800 my-1" />
                <button 
                  onClick={() => { triggerRenameFlow(); setContextMenu(null); }}
                  className="w-full hover:bg-slate-800/85 hover:text-white text-left px-2.5 py-1.5 rounded-lg transition flex items-center gap-2 cursor-pointer font-semibold"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-500" /> Rename
                </button>
                <button 
                  onClick={() => { handleDeleteSelected(); setContextMenu(null); }}
                  className="w-full hover:bg-red-950/40 hover:text-red-300 text-left px-2.5 py-1.5 rounded-lg transition flex items-center gap-2 cursor-pointer font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" /> Delete
                </button>
                {selectedNode?.type === 'file' && (
                  <button 
                    onClick={() => { handleDownloadSelected(); setContextMenu(null); }}
                    className="w-full hover:bg-slate-800/85 hover:text-white text-left px-2.5 py-1.5 rounded-lg transition flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-400" /> Export File
                  </button>
                )}
                <button 
                  onClick={() => { setShowProperties(true); setContextMenu(null); }}
                  className="w-full hover:bg-slate-800/85 hover:text-white text-left px-2.5 py-1.5 rounded-lg transition flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Info className="w-3.5 h-3.5 text-gray-400" /> Properties
                </button>
              </>
            ) : (
              <>
                {/* Empty Container Context actions */}
                <button 
                  onClick={() => { setAddingType('folder'); setNewItemName(''); setContextMenu(null); }}
                  className="w-full hover:bg-slate-800/85 hover:text-white text-left px-2.5 py-1.5 rounded-lg transition flex items-center gap-2 cursor-pointer font-medium"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-yellow-500" /> New Folder
                </button>
                <button 
                  onClick={() => { setAddingType('file'); setNewItemName(''); setContextMenu(null); }}
                  className="w-full hover:bg-slate-800/85 hover:text-white text-left px-2.5 py-1.5 rounded-lg transition flex items-center gap-2 cursor-pointer font-medium"
                >
                  <FilePlus className="w-3.5 h-3.5 text-emerald-500" /> New File
                </button>
                {clipboard && (
                  <>
                    <div className="h-px bg-slate-800 my-1" />
                    <button 
                      onClick={() => { handlePaste(); setContextMenu(null); }}
                      className="w-full hover:bg-slate-800/85 hover:text-white text-left px-2.5 py-1.5 rounded-lg transition flex items-center gap-2 cursor-pointer font-semibold"
                    >
                      <Clipboard className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Paste Item
                    </button>
                  </>
                )}
                <div className="h-px bg-slate-800 my-1" />
                <button 
                  onClick={() => { 
                    addNotification('Synced', 'Simulated virtual C: disk refreshed.', 'info'); 
                    setContextMenu(null); 
                  }}
                  className="w-full hover:bg-slate-800/85 hover:text-white text-left px-2.5 py-1.5 rounded-lg transition flex items-center gap-2 cursor-pointer font-mono text-[10.5px]"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-sky-400" /> Refresh List
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* RENAME MODAL DIALOG */}
      {renamingPath && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4.5 w-full max-w-sm shadow-2xl relative text-slate-200 select-none">
            <h3 className="text-xs font-extrabold mb-3 flex items-center gap-2 uppercase tracking-widest text-white font-mono">
              <Edit3 className="w-4 h-4 text-sky-400" /> Rename Virtual Node
            </h3>
            <p className="text-[10px] text-slate-400 mb-3 font-mono leading-relaxed">Enter the replacement name for your virtual simulated asset:</p>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700/70 text-xs rounded-xl px-3 py-2 outline-none text-slate-200 mb-4 font-mono font-medium focus:border-blue-500"
              value={renamingName}
              onChange={(e) => setRenamingName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm()}
              autoFocus
            />
            <div className="flex justify-end gap-2 text-[10px] font-bold">
              <button
                onClick={() => setRenamingPath(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-white/5 cursor-pointer uppercase font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameConfirm}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition cursor-pointer uppercase font-mono shadow-md shadow-blue-600/10"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Overlay Modal */}
      {previewImage && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4.5 w-full max-w-lg shadow-2xl relative text-slate-200 select-none font-sans">
            <h3 className="text-xs font-extrabold mb-3.5 flex items-center gap-1.5 uppercase tracking-widest text-slate-200 font-mono">
              <Eye className="w-4 text-emerald-400" /> Image File Previewer
            </h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 overflow-hidden flex items-center justify-center max-h-[330px]">
              <img src={previewImage} alt="Preview" className="max-w-full max-h-[310px] object-contain rounded-lg" referrerPolicy="no-referrer" />
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Overlay Modal */}
      {previewVideo && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4.5 w-full max-w-xl shadow-2xl relative text-slate-200 select-none font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold font-mono text-white truncate max-w-[280px]">
                    {previewVideo.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {previewVideo.duration ? `Duration: ${formatRecordingDuration(previewVideo.duration)}` : 'Screen Recording'} • Saved to Virtual Disk
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-black rounded-xl overflow-hidden border border-white/10 mb-3 flex items-center justify-center min-h-[220px] max-h-[360px]">
              {previewVideo.url ? (
                <video
                  src={previewVideo.url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full max-h-[350px] object-contain rounded-xl"
                />
              ) : (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-3 font-mono">
                  <Video className="w-12 h-12 text-teal-400/60" />
                  <div>
                    <div className="text-xs font-bold text-slate-300">Screen Recording Record</div>
                    <div className="text-[10px] text-slate-500 mt-1">Recorded video stream captured in session.</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 font-mono text-[10px]">
              <div className="text-slate-400 truncate max-w-[240px]">
                {previewVideo.timestamp ? `Recorded: ${previewVideo.timestamp}` : `Location: C:/Videos/${previewVideo.name}`}
              </div>
              <div className="flex items-center gap-2">
                {previewVideo.url && (
                  <button
                    onClick={() => {
                      const ok = downloadVideoFile(previewVideo.name, previewVideo.content || previewVideo.url);
                      if (ok) {
                        addNotification('Download Started', `Downloading video "${previewVideo.name}"`, 'info');
                      } else {
                        addNotification('Download Notice', 'Failed to retrieve binary video data.', 'warning');
                      }
                    }}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-teal-600/20 font-mono"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Video
                  </button>
                )}
                <button
                  onClick={() => setPreviewVideo(null)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Footer */}
      <div className="px-4 py-1.5 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between font-mono shrink-0">
        <div>{currentNodes.length} files/folders listed</div>
        <div>Selected: {selectedNode ? `${selectedNode.name} (${selectedNode.type === 'directory' ? 'folder' : formatSize(selectedNode.size || selectedNode.content?.length)})` : 'none'}</div>
      </div>
    </div>
  );
};
