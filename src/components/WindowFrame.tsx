import React, { useRef, useState, useEffect } from 'react';
import { useOS } from '../context/OSContext';
import { OSWindow } from '../types';
import { Minus, Square, X, LayoutGrid, ArrowLeftToLine, ArrowRightToLine, Maximize2 } from 'lucide-react';

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
    snapWindow,
    setSnapPreview,
    updateWindowPosition,
    updateWindowSize,
    settings
  } = useOS();

  const titleBarRef = useRef<HTMLDivElement | null>(null);
  const resizeRef = useRef<HTMLDivElement | null>(null);

  const [dragState, setDragState] = useState({ isDragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const [resizeState, setResizeState] = useState({ isResizing: false, startX: 0, startY: 0, originW: 0, originH: 0 });
  const [isSnapMenuOpen, setIsSnapMenuOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  const snapMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeCandidateSnapRef = useRef<'left' | 'right' | 'top' | 'none'>('none');
  const isActive = activeWindowId === windowState.id;

  // Track window resize to adapt layout between mobile, tablet, and desktop
  useEffect(() => {
    const handleViewportResize = () => {
      setIsMobileScreen(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleViewportResize);
    return () => window.removeEventListener('resize', handleViewportResize);
  }, []);

  // Generic start drag logic
  const startDragAt = (clientX: number, clientY: number) => {
    focusWindow(windowState.id);
    setIsSnapMenuOpen(false);

    if (windowState.isMaximized || (windowState.snapState && windowState.snapState !== 'none')) {
      const restoredW = windowState.prevWidth || (isMobileScreen ? window.innerWidth : 800);
      const restoredH = windowState.prevHeight || (isMobileScreen ? window.innerHeight - 56 : 520);
      
      const currentWidth = windowState.width || window.innerWidth;
      const ratio = Math.max(0.15, Math.min(0.85, (clientX - windowState.x) / currentWidth));
      const newOriginX = Math.max(0, Math.min(window.innerWidth - restoredW, clientX - restoredW * ratio));
      const newOriginY = Math.max(0, clientY - 16);

      updateWindowSize(windowState.id, restoredW, restoredH);
      updateWindowPosition(windowState.id, newOriginX, newOriginY);

      setDragState({
        isDragging: true,
        startX: clientX,
        startY: clientY,
        originX: newOriginX,
        originY: newOriginY
      });
      activeCandidateSnapRef.current = 'none';
      return;
    }

    setDragState({
      isDragging: true,
      startX: clientX,
      startY: clientY,
      originX: windowState.x,
      originY: windowState.y
    });
    activeCandidateSnapRef.current = 'none';
  };

  // Window drag handlers (Mouse & Touch)
  const handleDragDown = (e: React.MouseEvent) => {
    if (isMobileScreen) return; // Full-screen on mobile
    startDragAt(e.clientX, e.clientY);
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMobileScreen) return; // Full-screen on mobile
    if (e.touches.length === 1) {
      startDragAt(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Window resize handler
  const handleResizeDown = (e: React.MouseEvent) => {
    if (windowState.isMaximized || isMobileScreen) return;
    focusWindow(windowState.id);
    e.stopPropagation();

    setResizeState({
      isResizing: true,
      startX: e.clientX,
      startY: e.clientY,
      originW: windowState.width,
      originH: windowState.height
    });
    e.preventDefault();
  };

  const handleTouchResizeStart = (e: React.TouchEvent) => {
    if (windowState.isMaximized || isMobileScreen) return;
    focusWindow(windowState.id);
    e.stopPropagation();

    if (e.touches.length === 1) {
      setResizeState({
        isResizing: true,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        originW: windowState.width,
        originH: windowState.height
      });
    }
  };

  // Drag and resize mouse & touch move listeners
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (dragState.isDragging) {
        const deltaX = clientX - dragState.startX;
        const deltaY = clientY - dragState.startY;
        
        // Enforce boundary constraints
        const nextX = Math.max(-windowState.width + 120, Math.min(window.innerWidth - 80, dragState.originX + deltaX));
        const nextY = Math.max(0, Math.min(window.innerHeight - 80, dragState.originY + deltaY));
        
        updateWindowPosition(windowState.id, nextX, nextY);

        // Edge snapping detection (Windows 11 / Aero Snap behavior)
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const usableH = screenH - 48;
        const EDGE_THRESHOLD = 32;

        if (clientY <= 16 && windowState.appId !== 'calc') {
          activeCandidateSnapRef.current = 'top';
          setSnapPreview({
            active: true,
            snapType: 'top',
            x: 8,
            y: 8,
            width: screenW - 16,
            height: usableH - 16
          });
        } else if (clientX <= EDGE_THRESHOLD) {
          activeCandidateSnapRef.current = 'left';
          setSnapPreview({
            active: true,
            snapType: 'left',
            x: 8,
            y: 8,
            width: Math.floor(screenW / 2) - 12,
            height: usableH - 16
          });
        } else if (clientX >= screenW - EDGE_THRESHOLD) {
          activeCandidateSnapRef.current = 'right';
          setSnapPreview({
            active: true,
            snapType: 'right',
            x: Math.floor(screenW / 2) + 4,
            y: 8,
            width: Math.ceil(screenW / 2) - 12,
            height: usableH - 16
          });
        } else {
          if (activeCandidateSnapRef.current !== 'none') {
            activeCandidateSnapRef.current = 'none';
            setSnapPreview(null);
          }
        }
      }

      if (resizeState.isResizing) {
        const deltaX = clientX - resizeState.startX;
        const deltaY = clientY - resizeState.startY;
        
        const nextW = Math.max(windowState.minWidth || 220, resizeState.originW + deltaX);
        const nextH = Math.max(windowState.minHeight || 220, resizeState.originH + deltaY);
        
        updateWindowSize(windowState.id, nextW, nextH);
      }
    };

    const handleEnd = () => {
      if (dragState.isDragging) {
        const candidate = activeCandidateSnapRef.current;
        if (candidate !== 'none') {
          snapWindow(windowState.id, candidate);
          setSnapPreview(null);
          activeCandidateSnapRef.current = 'none';
        }
        setDragState(prev => ({ ...prev, isDragging: false }));
      }
      if (resizeState.isResizing) setResizeState(prev => ({ ...prev, isResizing: false }));
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => handleEnd();

    if (dragState.isDragging || resizeState.isResizing) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [dragState, resizeState, windowState]);

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
        left: isMobileScreen ? 0 : windowState.x,
        top: isMobileScreen ? 0 : windowState.y,
        width: isMobileScreen ? '100vw' : windowState.width,
        height: isMobileScreen ? 'calc(100vh - 48px)' : windowState.height,
        zIndex: windowState.zIndex,
        transform: !isMobileScreen && settings.scale && settings.scale !== 100 ? `scale(${settings.scale / 100})` : undefined,
        transformOrigin: 'center center',
      }}
      onClick={() => focusWindow(windowState.id)}
      className={`flex flex-col overflow-hidden transition-all duration-150 pointer-events-auto ${
        isMobileScreen ? 'rounded-none border-x-0 border-t-0' : styleClasses.window
      } ${isActive ? 'ring-1 ring-blue-500/30' : ''}`}
    >
      {/* Title Header Bar */}
      <div
        ref={titleBarRef}
        onMouseDown={handleDragDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={() => {
          if (windowState.appId !== 'calc' && !isMobileScreen) {
            maximizeWindow(windowState.id);
          }
        }}
        className={`flex items-center justify-between px-3 sm:px-3.5 py-1.5 sm:py-2 select-none relative ${
          isMobileScreen ? 'cursor-default' : 'cursor-move'
        } ${styleClasses.header}`}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 max-w-[70%] select-none">
          <span className="text-slate-400 text-sm select-none">💻</span>
          <span className={`truncate ${styleClasses.title}`}>{windowState.title}</span>
          {!isMobileScreen && windowState.snapState === 'left' && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Left 50%
            </span>
          )}
          {!isMobileScreen && windowState.snapState === 'right' && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Right 50%
            </span>
          )}
        </div>

        {/* Controls: Minimize, Maximize/Snap, Close */}
        <div 
          className="flex items-center gap-1 select-none relative" 
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
        >
          <button
            onClick={() => {
              minimizeWindow(windowState.id);
            }}
            className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-slate-500/20 active:bg-slate-500/30 rounded text-slate-400 hover:text-white transition cursor-pointer"
            title="Minimize"
          >
            <Minus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>
          
          {windowState.appId !== 'calc' && !isMobileScreen && (
            <div
              className="relative"
              onMouseEnter={() => {
                if (snapMenuTimeoutRef.current) clearTimeout(snapMenuTimeoutRef.current);
                setIsSnapMenuOpen(true);
              }}
              onMouseLeave={() => {
                snapMenuTimeoutRef.current = setTimeout(() => {
                  setIsSnapMenuOpen(false);
                }, 300);
              }}
            >
              <button
                onClick={() => {
                  maximizeWindow(windowState.id);
                }}
                className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-slate-500/20 active:bg-slate-500/30 rounded text-slate-400 hover:text-white transition cursor-pointer"
                title="Maximize / Snap Layouts"
              >
                <Square className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
              </button>

              {/* Windows 11 Style Snap Layout Assist Menu */}
              {isSnapMenuOpen && (
                <div 
                  className="absolute right-0 top-full mt-2 w-48 p-2.5 rounded-xl bg-slate-950/95 border border-white/15 backdrop-blur-2xl shadow-2xl z-[9999] text-slate-200 animate-in fade-in zoom-in-95 duration-150"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider font-mono">
                    Snap Layouts
                  </div>
                  
                  {/* Split Screen 50/50 Layout Options */}
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    <button
                      onClick={() => {
                        snapWindow(windowState.id, 'left');
                        setIsSnapMenuOpen(false);
                      }}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-900/60 hover:bg-blue-600/30 border border-white/5 hover:border-blue-500/40 text-[11px] text-slate-200 transition cursor-pointer group text-left"
                    >
                      <div className="w-4 h-3.5 rounded-[2px] border border-blue-400 bg-blue-500/40 flex">
                        <div className="w-1/2 h-full bg-blue-400 rounded-l-[1px]"></div>
                      </div>
                      <span>Left 50%</span>
                    </button>

                    <button
                      onClick={() => {
                        snapWindow(windowState.id, 'right');
                        setIsSnapMenuOpen(false);
                      }}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-900/60 hover:bg-blue-600/30 border border-white/5 hover:border-blue-500/40 text-[11px] text-slate-200 transition cursor-pointer group text-left"
                    >
                      <div className="w-4 h-3.5 rounded-[2px] border border-blue-400 bg-blue-500/40 flex">
                        <div className="w-1/2 h-full"></div>
                        <div className="w-1/2 h-full bg-blue-400 rounded-r-[1px]"></div>
                      </div>
                      <span>Right 50%</span>
                    </button>
                  </div>

                  {/* Maximize & Restore Options */}
                  <div className="flex flex-col gap-1 border-t border-white/5 pt-1.5">
                    <button
                      onClick={() => {
                        snapWindow(windowState.id, 'top');
                        setIsSnapMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-900 text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Maximize Fullscreen</span>
                    </button>
                    {(windowState.isMaximized || (windowState.snapState && windowState.snapState !== 'none')) && (
                      <button
                        onClick={() => {
                          snapWindow(windowState.id, 'none');
                          setIsSnapMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-900 text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                        <span>Restore Floating</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              closeWindow(windowState.id);
            }}
            className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-red-600 active:bg-red-700 rounded text-slate-400 hover:text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>

      {/* Embedded application container */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>

      {/* Resize handle bottom right */}
      {!windowState.isMaximized && !windowState.snapState && !isMobileScreen && windowState.appId !== 'calc' && (
        <div
          ref={resizeRef}
          onMouseDown={handleResizeDown}
          onTouchStart={handleTouchResizeStart}
          className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize z-[1000] select-none flex items-end justify-end p-1"
        >
          <svg width="7" height="7" viewBox="0 0 6 6" className="opacity-40 hover:opacity-80 transition fill-current text-slate-400">
            <path d="M6,0 L6,6 L0,6 Z" />
          </svg>
        </div>
      )}
    </div>
  );
};
