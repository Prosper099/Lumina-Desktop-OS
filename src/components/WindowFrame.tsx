import React, { useRef, useState, useEffect } from 'react';
import { useOS } from '../context/OSContext';
import { OSWindow } from '../types';
import { Minus, Square, X, Maximize2, Move } from 'lucide-react';

interface WindowFrameProps {
  windowState: OSWindow;
  children: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({ windowState, children }) => {
  const {
    activeWindowId,
    focusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowPosition,
    updateWindowSize,
    settings
  } = useOS();

  const titleBarRef = useRef<HTMLDivElement | null>(null);
  const resizeRef = useRef<HTMLDivElement | null>(null);

  const [dragState, setDragState] = useState({ isDragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const [resizeState, setResizeState] = useState({ isResizing: false, startX: 0, startY: 0, originW: 0, originH: 0 });

  const isActive = activeWindowId === windowState.id;

  // Window drag handlers
  const handleDragDown = (e: React.MouseEvent) => {
    if (windowState.isMaximized) return; // Cannot drag maximized windows
    focusWindow(windowState.id);
    
    // Stop event propagating to app logic
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: windowState.x,
      originY: windowState.y
    });
    
    e.preventDefault();
  };

  // Window resize handler
  const handleResizeDown = (e: React.MouseEvent) => {
    if (windowState.isMaximized) return;
    focusWindow(windowState.id);
    e.stopPropagation(); // Stop trigger window drag

    setResizeState({
      isResizing: true,
      startX: e.clientX,
      startY: e.clientY,
      originW: windowState.width,
      originH: windowState.height
    });
    
    e.preventDefault();
  };

  // Drag and resize mouse move listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragState.isDragging) {
        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;
        
        // Enforce boundary constraints (keep at least 120px of title bar visible on screen, and prevent going above top bar)
        const nextX = Math.max(-windowState.width + 120, Math.min(window.innerWidth - 80, dragState.originX + deltaX));
        const nextY = Math.max(0, Math.min(window.innerHeight - 80, dragState.originY + deltaY));
        
        updateWindowPosition(windowState.id, nextX, nextY);
      }

      if (resizeState.isResizing) {
        const deltaX = e.clientX - resizeState.startX;
        const deltaY = e.clientY - resizeState.startY;
        
        const nextW = Math.max(windowState.minWidth || 200, resizeState.originW + deltaX);
        const nextH = Math.max(windowState.minHeight || 200, resizeState.originH + deltaY);
        
        updateWindowSize(windowState.id, nextW, nextH);
      }
    };

    const handleMouseUp = () => {
      if (dragState.isDragging) setDragState(prev => ({ ...prev, isDragging: false }));
      if (resizeState.isResizing) setResizeState(prev => ({ ...prev, isResizing: false }));
    };

    if (dragState.isDragging || resizeState.isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, resizeState]);

  if (!windowState.isOpen) return null;
  if (windowState.isMinimized) return null;

  // Render proper header and outer cards depending on overall theme
  // themes: light, dark, glassmorphism
  const getThemeClasses = () => {
    switch (settings.theme) {
      case 'dark':
        return {
          window: 'bg-slate-900/95 backdrop-blur-xl border border-slate-800 text-slate-100 window-shadow rounded-2xl',
          header: isActive ? 'bg-slate-900/90 border-b border-slate-800 px-4 py-2' : 'bg-slate-950/40 text-slate-400 border-b border-slate-900/50 px-4 py-2',
          title: 'text-slate-150 text-xs font-semibold uppercase tracking-wider'
        };
      case 'light':
        return {
          window: 'bg-slate-50 border border-slate-200 text-slate-900 window-shadow-light rounded-2xl',
          header: isActive ? 'bg-slate-100 border-b border-slate-200 px-4 py-2' : 'bg-slate-50/90 text-slate-400 border-b border-slate-200/60 px-4 py-2',
          title: 'text-slate-900 text-xs font-semibold'
        };
      case 'glass':
      default:
        return {
          window: 'glass-effect text-slate-100 window-shadow rounded-2xl backdrop-blur-2xl',
          header: isActive ? 'bg-white/10 border-b border-white/10 px-4 py-2' : 'bg-black/20 text-slate-400 border-b border-white/5 px-4 py-2',
          title: 'text-white text-xs font-semibold uppercase tracking-wider'
        };
    }
  };

  const styleClasses = getThemeClasses();

  return (
    <div
      style={{
        position: 'absolute',
        left: windowState.x,
        top: windowState.y,
        width: windowState.width,
        height: windowState.height,
        zIndex: windowState.zIndex,
        transform: settings.scale && settings.scale !== 100 ? `scale(${settings.scale / 100})` : undefined,
        transformOrigin: 'center center',
      }}
      onClick={() => focusWindow(windowState.id)}
      className={`flex flex-col overflow-hidden transition-shadow duration-300 pointer-events-auto ${styleClasses.window} ${isActive ? 'ring-1 ring-blue-500/20' : ''}`}
    >
      {/* Title Header Bar */}
      <div
        ref={titleBarRef}
        onMouseDown={handleDragDown}
        className={`flex items-center justify-between px-3.5 py-1.5 cursor-move select-none ${styleClasses.header}`}
      >
        <div className="flex items-center gap-2.5 max-w-[70%] select-none">
          <span className="text-slate-400 text-sm select-none">💻</span>
          <span className={`truncate ${styleClasses.title}`}>{windowState.title}</span>
        </div>

        {/* Controls: Minimize, Maximize, Close */}
        <div className="flex items-center gap-1.5 select-none" onMouseDown={e => e.stopPropagation()}>
          <button
            onClick={() => {
              minimizeWindow(windowState.id);
            }}
            className="p-1 hover:bg-slate-500/20 active:bg-slate-500/30 rounded text-slate-400 hover:text-white transition cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          
          {windowState.appId !== 'calc' && (
            <button
              onClick={() => {
                maximizeWindow(windowState.id);
              }}
              className="p-1 hover:bg-slate-500/20 active:bg-slate-500/30 rounded text-slate-400 hover:text-white transition cursor-pointer"
            >
              <Square className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => {
              closeWindow(windowState.id);
            }}
            className="p-1 hover:bg-red-600 active:bg-red-700 rounded text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Embedded application container */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>

      {/* Resize handle bottom right */}
      {!windowState.isMaximized && windowState.appId !== 'calc' && (
        <div
          ref={resizeRef}
          onMouseDown={handleResizeDown}
          className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-se-resize z-[1000] select-none flex items-end justify-end p-0.5"
        >
          <svg width="6" height="6" viewBox="0 0 6 6" className="opacity-40 hover:opacity-80 transition fill-current text-slate-400">
            <path d="M6,0 L6,6 L0,6 Z" />
          </svg>
        </div>
      )}
    </div>
  );
};
