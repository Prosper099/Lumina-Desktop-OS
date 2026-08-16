import React, { useState, useEffect } from 'react';
import { useOS } from '../context/OSContext';
import { WindowFrame } from './WindowFrame';

// Import apps
import { Notepad } from './apps/Notepad';
import { PaintApp } from './apps/PaintApp';
import { BrowserApp } from './apps/BrowserApp';
import { CalcApp } from './apps/CalcApp';
import { SettingsApp } from './apps/SettingsApp';
import { TerminalApp } from './apps/TerminalApp';
import { FileExplorer } from './apps/FileExplorer';
import { CopilotApp } from './apps/CopilotApp';
import { GravityLabApp } from './apps/GravityLabApp';
import { VoiceApp } from './apps/VoiceApp';
import { SystemMonitor } from './apps/SystemMonitor';
import { MapsApp } from './apps/MapsApp';

import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Helper component to map string keys to Lucide icons
export const IconRenderer: React.FC<{ name: string; className?: string }> = ({ name, className }) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Icons.Layers className={className} />;
  return <IconComponent className={className} />;
};

// A custom high-fidelity SVG icon renderer that matches the reference image exactly
export const renderCustomAppIcon = (appId: string, className = "w-6 h-6") => {
  switch (appId) {
    case 'copilot':
      return (
        <div className={`relative ${className} flex items-center justify-center`}>
          {/* Pulsing deep glow behind the exquisite icon */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/15 blur-[6px] animate-pulse" />
          
          <svg viewBox="0 0 24 24" className="w-full h-full relative" fill="none">
            {/* Outer high-tech orbital track ring */}
            <circle 
              cx="12" 
              cy="12" 
              r="9.5" 
              stroke="url(#luminaAI_orbital)" 
              strokeWidth="0.6" 
              strokeDasharray="2 2" 
              className="animate-[spin_45s_linear_infinite]" 
            />
            
            {/* Soft inner magnetic boundary gradient ring */}
            <circle 
              cx="12" 
              cy="12" 
              r="8" 
              stroke="url(#luminaAI_innerTrack)" 
              strokeWidth="0.5" 
              strokeOpacity="0.7" 
            />

            {/* Micro network node connections (beautiful tiny constellation dots) */}
            <g className="animate-[spin_60s_linear_infinite_reverse] origin-[12px_12px]">
              <circle cx="12" cy="2.5" r="0.75" fill="#a5f3fc" />
              <circle cx="12" cy="21.5" r="0.75" fill="#a5f3fc" />
              <circle cx="2.5" cy="12" r="0.75" fill="#c084fc" />
              <circle cx="21.5" cy="12" r="0.75" fill="#f472b6" />
            </g>

            {/* Core Neural Ribbons Loop / High tech infinity torus lobes */}
            <g className="animate-[spin_20s_linear_infinite] origin-[12px_12px]">
              {/* Lobe 1: Cyber Blue/Cyan Swoosh */}
              <path 
                d="M12 12 C14.5 9, 18 8.5, 18 12 C18 15.5, 14.5 15, 12 12 Z" 
                fill="url(#luminaAI_cyan)" 
                fillOpacity="0.7"
              />
              {/* Lobe 2: Ultraviolet/Voilet Swoosh */}
              <path 
                d="M12 12 C9.5 15, 6 15.5, 6 12 C6 8.5, 9.5 9, 12 12 Z" 
                fill="url(#luminaAI_violet)" 
                fillOpacity="0.7"
              />
              {/* Lobe 3: Radiant Fuchsia / Pink (vertical alignment) */}
              <path 
                d="M12 12 C15 14.5, 15.5 18, 12 18 C8.5 18, 9 14.5, 12 12 Z" 
                fill="url(#luminaAI_pink)" 
                fillOpacity="0.65"
              />
              {/* Lobe 4: Celestial Purple (vertical alignment) */}
              <path 
                d="M12 12 C9 9.5, 8.5 6, 12 6 C15.5 6, 15 9.5, 12 12 Z" 
                fill="url(#luminaAI_purple)" 
                fillOpacity="0.65"
              />
            </g>

            {/* Secondary offset sparkling stars - Adds gorgeous tech-savvy depth */}
            <g className="animate-[pulse_2.5s_ease-in-out_infinite] origin-[12px_12px]">
              <line x1="12" y1="9.5" x2="12" y2="14.5" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" />
              <line x1="9.5" y1="12" x2="14.5" y2="12" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" />
            </g>

            {/* Glowing Singularity Inner Core Sphere */}
            <circle 
              cx="12" 
              cy="12" 
              r="2.2" 
              fill="#ffffff" 
              stroke="url(#luminaAI_coreRing)"
              strokeWidth="0.3"
            />
            {/* High opacity micro speckle representing a spark of consciousness */}
            <circle cx="12" cy="12" r="0.7" fill="#ffffff" />

            <defs>
              <linearGradient id="luminaAI_orbital" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#818cf8" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="luminaAI_innerTrack" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="luminaAI_cyan" x1="11" y1="10" x2="18" y2="14">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#a5f3fc" />
              </linearGradient>
              <linearGradient id="luminaAI_violet" x1="13" y1="14" x2="6" y2="10">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="50%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
              <linearGradient id="luminaAI_pink" x1="13" y1="12" x2="10" y2="18">
                <stop offset="0%" stopColor="#db2777" />
                <stop offset="60%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#fda4af" />
              </linearGradient>
              <linearGradient id="luminaAI_purple" x1="11" y1="12" x2="14" y2="6">
                <stop offset="0%" stopColor="#9333ea" />
                <stop offset="60%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#e9d5ff" />
              </linearGradient>
              <linearGradient id="luminaAI_coreRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      );
    case 'explorer':
      return (
        <svg viewBox="0 0 24 24" className={`${className} text-amber-500`} fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* High gloss golden-yellow folder layout */}
          <path d="M3 20h18a1.5 1.5 0 0 0 1.5-1.5V8.5A1.5 1.5 0 0 0 21 7h-8.5l-2-2.5a1.5 1.5 0 0 0-1.2-.5H3A1.5 1.5 0 0 0 1.5 5.5v13A1.5 1.5 0 0 0 3 20z" />
          {/* Subtle horizontal light band in the middle */}
          <path d="M2.2 11.5h19.6" stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.4" />
        </svg>
      );
    case 'notepad':
    case 'editor':
      return (
        <svg viewBox="0 0 24 24" className={`${className} text-emerald-400`} fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* High gloss forest green file document */}
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" strokeWidth="2" />
          {/* Bold diagonal intersecting operations mimic cross emblem */}
          <path d="M8.5 12.5l7 5" stroke="#10b981" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M15.5 12.5l-7 5" stroke="#10b981" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      );
    case 'paint':
    case 'palette':
      return (
        <svg viewBox="0 0 24 24" className={`${className} text-indigo-400`} fill="none" stroke="#818cf8" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          {/* Premium organic painter's palette with colored dollop pins */}
          <path d="M12 2A10 10 0 0 0 2.2 13.2a4 4 0 0 1 4 3.5c.3 2 1.8 3.3 3.8 3.3 1 0 1.5-.3 2-.7a1.5 1.5 0 0 0 2 0c.5.4 1 .7 2 .7 4.5 0 8-3.7 8-8S17.5 2 12 2z" />
          {/* Dollops paint dots */}
          <circle cx="7.5" cy="10.5" r="1.5" fill="#f43f5e" stroke="none" />
          <circle cx="11.5" cy="7.5" r="1.5" fill="#f59e0b" stroke="none" />
          <circle cx="16.5" cy="9.5" r="1.5" fill="#10b981" stroke="none" />
          <circle cx="15.5" cy="14.5" r="1.5" fill="#3b82f6" stroke="none" />
          {/* Solid dark-filled finger thumbhole matching graphic exactly */}
          <circle cx="10" cy="15.5" r="1.4" fill="#0d0c11" stroke="#818cf8" strokeWidth="1" />
        </svg>
      );
    case 'terminal':
      return (
        <svg viewBox="0 0 24 24" className={`${className} text-emerald-400 fill-slate-950/40`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="18" rx="3" />
          <polyline points="7 9 11 12 7 15" strokeWidth="2" />
          <line x1="13" y1="15" x2="17" y2="15" strokeWidth="2" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" className={`${className} text-purple-400`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 'browser':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <circle cx="12" cy="12" r="11" fill="white" />
          {/* Red block: top and top-left */}
          <path d="M12 2C7.15 2 3.1 5.4 2.2 10l5 5a6 6 0 0 1 4.8-3H22C21.1 6.1 17.1 2 12 2z" fill="#EA4335" />
          {/* Green block: bottom and bottom-left */}
          <path d="M2.2 10a10 10 0 0 0 11.3 11.5l5-5a6 6 0 0 1-7.8-.5l-8.5-6z" fill="#34A853" />
          {/* Yellow block: right and bottom-right */}
          <path d="M22 10H12a6 6 0 0 1 3 4.8l5 5A10 10 0 0 0 22 10z" fill="#FBBC05" />
          <circle cx="12" cy="12" r="5" fill="white" />
          <circle cx="12" cy="12" r="3.7" fill="#4285F4" />
        </svg>
      );
    case 'calc':
    case 'calculator':
      return (
        <svg viewBox="0 0 24 24" className={`${className} text-indigo-300 fill-indigo-500/5`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="9" y1="22" x2="9" y2="16" />
          <line x1="15" y1="22" x2="15" y2="16" />
          <line x1="9" y1="16" x2="15" y2="16" />
          <line x1="8" y1="6" x2="16" y2="6" strokeWidth="2" />
          <line x1="8" y1="11" x2="16" y2="11" strokeWidth="2" />
        </svg>
      );
    case 'gravity':
      return (
        <svg viewBox="0 0 24 24" className={`${className} text-indigo-400`} fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3.5" fill="#818cf8" />
          <ellipse cx="12" cy="12" rx="9" ry="3" stroke="#818cf8" strokeWidth="1.2" transform="rotate(-30 12 12)" />
          <ellipse cx="12" cy="12" rx="9" ry="3" stroke="#c084fc" strokeWidth="1.2" strokeDasharray="2 2" transform="rotate(30 12 12)" />
          <circle cx="5" cy="8" r="1.5" fill="#a855f7" />
          <circle cx="19" cy="16" r="1" fill="#60a5fa" />
        </svg>
      );
    case 'voice':
      return (
        <svg viewBox="0 0 24 24" className={`${className} text-purple-400`} fill="none" stroke="#c084fc" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      );
    case 'sysmon':
      return (
        <svg viewBox="0 0 24 24" className={`${className}`} fill="none" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="18" rx="2.5" stroke="#0f766e" strokeWidth="1.2" />
          <path d="M2 13h4l2-6 3 11 2-8 2 6h7" stroke="#00f2fe" strokeWidth="2.1" strokeLinecap="round" />
          <circle cx="15" cy="11" r="1" fill="#22d3ee" />
        </svg>
      );
    case 'maps':
      return (
        <svg viewBox="0 0 24 24" className={`${className}`} fill="none" stroke="#f59e0b" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="#d97706" strokeWidth="1.2" />
          <path d="M3 8h18M3 16h18M8 3v18M16 3v18" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.4" />
          <polygon points="12,7 8,14 16,14" fill="#ef4444" fillOpacity="0.3" stroke="#ef4444" strokeWidth="1.5" />
          <circle cx="12" cy="11" r="2" fill="#f59e0b" />
        </svg>
      );
    default:
      return <Icons.Layers className={className} />;
  }
};

interface DesktopIcon {
  id: string;
  label: string;
  iconName: string;
  appId: string;
  colorClass: string;
}

const DESKTOP_LAUNCHERS: DesktopIcon[] = [
  { id: 'explorer', label: 'File Explorer', iconName: 'FolderClosed', appId: 'explorer', colorClass: 'text-amber-400 font-bold' },
  { id: 'notepad', label: 'Notepad', iconName: 'FileText', appId: 'notepad', colorClass: 'text-emerald-400 font-medium' },
  { id: 'paint', label: 'Paint Studio', iconName: 'Palette', appId: 'paint', colorClass: 'text-pink-400 font-medium' },
  { id: 'browser', label: 'Google Chrome', iconName: 'Globe', appId: 'browser', colorClass: 'text-sky-400 font-semibold' },
  { id: 'calc', label: 'Calculator', iconName: 'Calculator', appId: 'calc', colorClass: 'text-slate-300' },
  { id: 'settings', label: 'Settings', iconName: 'Settings', appId: 'settings', colorClass: 'text-purple-400' },
  { id: 'terminal', label: 'Terminal', iconName: 'Terminal', appId: 'terminal', colorClass: 'text-emerald-400 font-mono' },
  { id: 'voice', label: 'Gemini Live', iconName: 'Mic', appId: 'voice', colorClass: 'text-purple-400 animate-pulse' },
  { id: 'sysmon', label: 'System Monitor', iconName: 'Activity', appId: 'sysmon', colorClass: 'text-cyan-400 font-medium' },
  { id: 'maps', label: 'Lumina Maps', iconName: 'maps', appId: 'maps', colorClass: 'text-amber-400 font-semibold' },
];

const CALENDAR_EVENTS: { [key: string]: { time: string; label: string; type: 'system' | 'ai' | 'creative' }[] } = {
  "2026-06-12": [
    { time: "09:00 AM", label: "Lumina OS Update Hook", type: "system" },
    { time: "11:30 AM", label: "COSMOS AI Core Alignment", type: "ai" },
    { time: "04:00 PM", label: "Art Studio Render Pass", type: "creative" }
  ],
  "2026-06-13": [
    { time: "10:00 AM", label: "Memory Flush & Diagnostic", type: "system" },
    { time: "02:00 PM", label: "Explorer File Index Sync", type: "system" }
  ],
  "2026-06-14": [
    { time: "01:30 PM", label: "Neural Network Weights Check", type: "ai" },
    { time: "07:00 PM", label: "AI Backup Routine", type: "ai" }
  ],
  "default": [
    { time: "12:30 PM", label: "Daily Diagnostics Run", type: "system" },
    { time: "03:30 PM", label: "System Idle Optimization", type: "system" }
  ]
};

interface CalendarCell {
  day: number;
  isCurrentMonth: boolean;
  date: Date;
}

const getDaysInMonth = (date: Date): CalendarCell[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  
  const prevDaysToPad: CalendarCell[] = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    prevDaysToPad.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, prevMonthDays - i)
    });
  }
  
  const currentDays: CalendarCell[] = [];
  for (let i = 1; i <= totalDays; i++) {
    currentDays.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    });
  }
  
  const totalCells = 42;
  const nextDaysToPadCount = totalCells - (prevDaysToPad.length + currentDays.length);
  const nextDaysToPad: CalendarCell[] = [];
  for (let i = 1; i <= nextDaysToPadCount; i++) {
    nextDaysToPad.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    });
  }
  
  return [...prevDaysToPad, ...currentDays, ...nextDaysToPad];
};

export const Desktop: React.FC = () => {
  const {
    windows,
    focusWindow,
    openWindow,
    settings,
    notifications,
    notificationHistory,
    dismissNotification,
    clearNotificationHistory,
    isStartMenuOpen,
    setIsStartMenuOpen,
    isQuickSettingsOpen,
    setIsQuickSettingsOpen,
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    activeWindowId,
    minimizeWindow,
    fileSystem,
    chatHistory,
    sendAICommand,
    isAIPending,
    addNotification
  } = useOS();

  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [customDateStr, setCustomDateStr] = useState('');
  const [simpleDateStr, setSimpleDateStr] = useState('');
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [isCopilotSidebarOpen, setIsCopilotSidebarOpen] = useState(false);
  const [isNebulaDropdownOpen, setIsNebulaDropdownOpen] = useState(false);
  const [isNotificationsDropdownOpen, setIsNotificationsDropdownOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
  const [customEvents, setCustomEvents] = useState<{ [key: string]: { time: string; label: string; type: 'system' | 'ai' | 'creative' }[] }>(() => {
    const saved = localStorage.getItem('lumina_calendar_events');
    return saved ? JSON.parse(saved) : {};
  });
  const [newEventText, setNewEventText] = useState('');
  const isLightTheme = settings.theme === 'light';

  // System Power State Machine
  const [powerState, setPowerState] = useState<'booting' | 'on' | 'shutting-down' | 'off' | 'sleeping'>('booting');
  const [bootProgress, setBootProgress] = useState(0);
  const [bootStatus, setBootStatus] = useState('Initializing Lumina kernel...');
  const [shutdownProgress, setShutdownProgress] = useState(0);
  const [shutdownStatus, setShutdownStatus] = useState('');
  const [shutdownNextState, setShutdownNextState] = useState<'off' | 'booting'>('off');
  const [isPowerMenuOpen, setIsPowerMenuOpen] = useState(false);

  // Boot Sequence Logic
  useEffect(() => {
    if (powerState !== 'booting') return;
    
    // Play warm programmatic audio chime
    playStartupSound();
    
    setBootProgress(0);
    setBootStatus('Initializing ROM BIOS...');
    
    let current = 0;
    const interval = setInterval(() => {
      // Fast incremental ticks for smoother visual animation
      current += Math.floor(Math.random() * 8) + 4;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setBootProgress(100);
        setBootStatus('Unleashing visual workspace...');
        setTimeout(() => {
          setPowerState('on');
        }, 600);
      } else {
        setBootProgress(current);
        if (current < 15) {
          setBootStatus('kernel: Loading microcode and kernel drivers...');
        } else if (current < 35) {
          setBootStatus('disks: Verifying file system structures [EXT4]... OK');
        } else if (current < 60) {
          setBootStatus('network: Securing TLS links to Gemini AI agent pool...');
        } else if (current < 85) {
          setBootStatus('profile: Synchronizing persistent settings cache...');
        } else {
          setBootStatus('shell: Compiling graphic theme layers...');
        }
      }
    }, 120);

    return () => clearInterval(interval);
  }, [powerState]);

  // Shutdown Sequence Logic
  useEffect(() => {
    if (powerState !== 'shutting-down') return;
    
    setShutdownProgress(0);
    setShutdownStatus('Initiating ACPI powerdown sequence...');
    
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 12) + 6;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setShutdownProgress(100);
        setShutdownStatus('Lumina OS disconnected.');
        setTimeout(() => {
          setPowerState(shutdownNextState);
        }, 650);
      } else {
        setShutdownProgress(current);
        if (current < 25) {
          setShutdownStatus('Executing SIGTERM triggers and flushing user buffers...');
        } else if (current < 55) {
          setShutdownStatus('Unmounting dev/vda1 virtual file blocks...');
        } else if (current < 80) {
          setShutdownStatus('AI: Disconnecting live telemetry & voice stream pipelines...');
        } else {
          setShutdownStatus('ACPI: Dropping processor states to lower sleep tier... Goodbye.');
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [powerState, shutdownNextState]);
  
  const handleAddEvent = () => {
    if (!newEventText.trim()) return;
    const dateKey = selectedCalendarDate.toISOString().split('T')[0];
    const newEvent = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      label: newEventText.trim(),
      type: 'creative' as const
    };
    const updated = {
      ...customEvents,
      [dateKey]: [...(customEvents[dateKey] || []), newEvent]
    };
    setCustomEvents(updated);
    localStorage.setItem('lumina_calendar_events', JSON.stringify(updated));
    setNewEventText('');
  };

  const [isDockExpanded, setIsDockExpanded] = useState(true);

  // Bento Grid dynamic dashboard states
  const [bentoAIInput, setBentoAIInput] = useState('');
  const [aiModeOn, setAiModeOn] = useState(true);
  const [turboOn, setTurboOn] = useState(true);
  const [focusOn, setFocusOn] = useState(false);
  const [mediaActive, setMediaActive] = useState(true);
  const [mediaPos, setMediaPos] = useState(38);
  const [cpuVal, setCpuVal] = useState(17);
  const [tempVal, setTempVal] = useState(42);

  // CPU and Temperature dynamic ticks
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuVal(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(12, Math.min(prev + delta, 28));
      });
      setTempVal(prev => {
        const delta = Math.floor(Math.random() * 3) - 1;
        return Math.max(39, Math.min(prev + delta, 45));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Music progress tracking
  useEffect(() => {
    if (!mediaActive) return;
    const interval = setInterval(() => {
      setMediaPos(prev => (prev >= 100 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [mediaActive]);

  const handleBentoAIPrompt = async () => {
    if (!bentoAIInput.trim() || isAIPending) return;
    const val = bentoAIInput;
    setBentoAIInput('');
    await sendAICommand(val);
  };

  // Quick settings sliders state
  const [wifiOn, setWifiOn] = useState(true);
  const [bluetoothOn, setBluetoothOn] = useState(true);
  const [airplaneOn, setAirplaneOn] = useState(false);
  const [volume, setVolume] = useState(75);
  const [brightness, setBrightness] = useState(85);

  // Update virtual clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
      
      const rawDate = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      setDateStr(rawDate);

      const month = now.toLocaleDateString([], { month: 'short' }).toUpperCase();
      const day = now.toLocaleDateString([], { day: '2-digit' });
      const year = now.getFullYear();
      setCustomDateStr(`${month} ${day} / ${year}X`); // '202X' feel with uppercase formatting
      setSimpleDateStr(now.toLocaleDateString([], { month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-dismiss transient notification toasts after 4 seconds
  useEffect(() => {
    if (notifications.length === 0) return;
    const timers = notifications.map(toast => {
      return setTimeout(() => {
        dismissNotification(toast.id);
      }, 4000);
    });
    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [notifications, dismissNotification]);

  const handleLaunchIcon = (appId: string) => {
    openWindow(appId);
    setSelectedIconId(null);
  };

  const handleTaskbarClick = (wId: string, isMin: boolean) => {
    if (isMin) {
      focusWindow(wId);
    } else {
      if (activeWindowId === wId) {
        minimizeWindow(wId);
      } else {
        focusWindow(wId);
      }
    }
  };

  const playStartupSound = () => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Master Gain for pleasant overall volume
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.1); 
      masterGain.gain.setValueAtTime(0.12, ctx.currentTime + 2.0);
      masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.0);
      masterGain.connect(ctx.destination);

      // Airy ambient background pad sweeping high-mids
      const padOsc = ctx.createOscillator();
      padOsc.type = 'sine';
      padOsc.frequency.setValueAtTime(220, ctx.currentTime);
      padOsc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 3.0);
      
      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'bandpass';
      padFilter.frequency.setValueAtTime(400, ctx.currentTime);
      padFilter.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 2.5);
      padFilter.Q.value = 1.2;
      
      const padGain = ctx.createGain();
      padGain.gain.setValueAtTime(0, ctx.currentTime);
      padGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.2);
      padGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.8);
      
      padOsc.connect(padFilter);
      padFilter.connect(padGain);
      padGain.connect(masterGain);
      
      padOsc.start(ctx.currentTime);
      padOsc.stop(ctx.currentTime + 4.0);

      // Celestial Shimmering Tuning Glockenspiel Cascade Notes:
      // E5 (659.25 Hz), A5 (880.00 Hz), B5 (987.77 Hz), E6 (1318.51 Hz), G#6 (1661.22 Hz)
      const glassBellNotes = [659.25, 880.00, 987.77, 1318.51, 1661.22];
      const noteDelay = 0.15; // elegant arpeggio timing

      glassBellNotes.forEach((freq, idx) => {
        const startTime = ctx.currentTime + idx * noteDelay;
        
        // Pure sine chime
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        // Slightly detuned triangle for rich shimmering chorus twinkle
        const oscSub = ctx.createOscillator();
        oscSub.type = 'triangle';
        oscSub.frequency.setValueAtTime(freq * 1.002, startTime);
        
        // Crisp metallic resonance bandpass filter
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freq, startTime);
        filter.Q.value = 6.0; 
        
        // Exponential bell envelope
        const envelope = ctx.createGain();
        envelope.gain.setValueAtTime(0, ctx.currentTime);
        envelope.gain.setValueAtTime(0, startTime);
        envelope.gain.linearRampToValueAtTime(0.24, startTime + 0.04); // quick snap attack
        envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.4); // pleasant long ring
        
        osc.connect(filter);
        oscSub.connect(filter);
        filter.connect(envelope);
        envelope.connect(masterGain);
        
        osc.start(startTime);
        osc.stop(startTime + 3.0);
        oscSub.start(startTime);
        oscSub.stop(startTime + 3.0);
      });

      setTimeout(() => {
        try {
          ctx.close();
        } catch (err) {}
      }, 5000);
    } catch (e) {
      console.warn("Bootstrap Audio synthesis skipped/blocked by host browser sandbox policy.");
    }
  };

  const triggerPowerReset = () => {
    setIsStartMenuOpen(false);
    localStorage.removeItem('os_fs');
    localStorage.removeItem('os_copilot_history');
    window.location.reload();
  };

  // Filter apps matching Start Search Query
  const startAppsFiltered = DESKTOP_LAUNCHERS.filter(launcher =>
    launcher.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      style={{
        backgroundImage: `url(${settings.wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: `brightness(${settings.brightness ?? 100}%)`,
      }}
      className="h-screen w-screen relative overflow-hidden flex flex-col justify-between select-none"
    >
      {/* Dynamic Night Light Overlayer */}
      {settings.nightLight && (
        <div 
          className="absolute inset-0 pointer-events-none z-[99999] transition-colors duration-300"
          style={{ 
            backgroundColor: `rgba(245, 158, 11, ${(settings.nightLightStrength ?? 40) * 0.0022})`, 
            mixBlendMode: 'multiply' 
          }}
        />
      )}

      {/* 1. TOP STATS BAR (PRECISELY LUMINA.OS STYLING) */}
      <nav className="w-full h-14 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 select-none z-[9900] shadow-2xl relative">
        {/* Left Dropdown trigger container */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setIsNebulaDropdownOpen(!isNebulaDropdownOpen)}
            className="flex items-center gap-3.5 text-slate-100 hover:text-sky-300 font-bold font-sans text-xs tracking-widest uppercase transition bg-slate-900/60 hover:bg-slate-800/80 px-4 py-2.5 rounded-full border border-white/10 cursor-pointer"
          >
            <div className="grid grid-cols-2 gap-1">
              <div className="w-2 h-2 rounded-full bg-[#1f83fa]" />
              <div className="w-2 h-2 rounded-full bg-[#02bbf9]" />
              <div className="w-2 h-2 rounded-full bg-[#5e5eff]" />
              <div className="w-2 h-2 rounded-full bg-[#858ffc]" />
            </div>
            <span className="text-[12px] font-extrabold tracking-widest text-white">LUMINA.OS</span>
            <Icons.ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isNebulaDropdownOpen ? 'rotate-180 text-sky-400' : ''}`} />
          </button>
        </div>

        {/* Right side system workspace label and interactive notification center */}
        <div className="flex items-center gap-4 relative">
          <button
            onClick={() => setIsNotificationsDropdownOpen(!isNotificationsDropdownOpen)}
            className="flex items-center gap-2 hover:text-sky-300 text-slate-300 font-bold font-sans text-xs tracking-wider transition bg-slate-900/60 hover:bg-slate-800/85 px-3.5 py-2 rounded-full border border-white/10 cursor-pointer relative"
          >
            <Icons.Bell className={`w-3.5 h-3.5 ${notifications.length > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="text-[10px] font-bold font-mono tracking-wide uppercase">
              {notifications.length > 0 ? `${notifications.length} NEW` : 'NOTIFICATIONS'}
            </span>
            {notificationHistory.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-blue-600 outline outline-2 outline-slate-950 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center font-mono">
                {notificationHistory.length}
              </span>
            )}
          </button>

          <div className="text-[10px] font-bold text-slate-500 font-mono tracking-widest uppercase hidden sm:block">
            WORKSPACE ACTIVE
          </div>
        </div>
      </nav>

      {/* 2. NEBULA CORE CONTROL PANEL (DROPDOWN FLYOUT) */}
      <AnimatePresence>
        {isNebulaDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-16 left-6 w-[310px] max-w-[90vw] rounded-2xl bg-slate-950/95 border border-white/10 shadow-2xl z-[9950] p-3 backdrop-blur-3xl text-slate-200 flex flex-col gap-2.5 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gloss Decoration and Header */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 blur-[32px] pointer-events-none"></div>
            <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
              <div className="flex items-center gap-1">
                <Icons.Sliders className="w-3 h-3 text-sky-400" />
                <span className="text-[8.5px] uppercase font-bold tracking-widest text-slate-200 font-mono">System Console</span>
              </div>
              <button
                onClick={() => setIsNebulaDropdownOpen(false)}
                className="text-slate-500 hover:text-white text-[8px] font-mono uppercase bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition border border-white/5 cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Premium Launchers bar (Start and Browser trigger shortcuts) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsStartMenuOpen(true);
                  setIsNebulaDropdownOpen(false);
                }}
                className="p-2 bg-gradient-to-r from-blue-900/25 to-cyan-900/10 hover:from-blue-800/35 hover:to-cyan-800/20 border border-blue-500/15 rounded-lg text-left transition relative overflow-hidden group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {/* High-fidelity 4-circle Start Logo */}
                    <div className="grid grid-cols-2 gap-1 p-0.5 pointer-events-none">
                      <div className="w-2 h-2 rounded-full bg-[#1f83fa] shadow-[0_0_5px_rgba(31,131,250,0.6)]" style={{ width: '8px', height: '8px' }} />
                      <div className="w-2 h-2 rounded-full bg-[#02bbf9] shadow-[0_0_5px_rgba(2,187,249,0.6)]" style={{ width: '8px', height: '8px' }} />
                      <div className="w-2 h-2 rounded-full bg-[#5e5eff] shadow-[0_0_5px_rgba(94,94,255,0.6)]" style={{ width: '8px', height: '8px' }} />
                      <div className="w-2 h-2 rounded-full bg-[#858ffc] shadow-[0_0_5px_rgba(133,143,252,0.6)]" style={{ width: '8px', height: '8px' }} />
                    </div>
                    <div>
                      <div className="text-[9px] font-extrabold text-blue-300 uppercase tracking-wider font-mono">Launch Menu</div>
                      <div className="text-[8.5px] text-slate-400 leading-tight">System indices</div>
                    </div>
                  </div>
                  <Icons.ArrowUpRight className="w-3 h-3 text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>

              <button
                onClick={() => {
                  openWindow('browser');
                  setIsNebulaDropdownOpen(false);
                  addNotification('Web Browser', 'Opened secure sandbox web search.', 'success');
                }}
                className="p-2 bg-gradient-to-r from-emerald-900/25 to-teal-900/10 hover:from-emerald-800/35 hover:to-teal-800/20 border border-emerald-500/15 rounded-lg text-left transition relative overflow-hidden group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">🌐</span>
                    <div>
                      <div className="text-[8px] font-extrabold text-emerald-300 uppercase tracking-wider font-mono">Web Browser</div>
                      <div className="text-[7.5px] text-slate-400 leading-tight">Surf safely</div>
                    </div>
                  </div>
                  <Icons.ArrowUpRight className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>
            </div>

            {/* Lumina AI System Co-Processor Command Center */}
            <section className="bg-slate-900/30 border border-white/5 rounded-xl p-2.5 flex flex-col gap-1.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <h2 className="text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 text-slate-100">
                  <Icons.Sparkles className="text-blue-400 w-3 h-3 animate-pulse" /> AI Assistant Desk
                </h2>
                <span className="text-[6.5px] bg-blue-950/40 text-blue-400 border border-blue-900/30 font-mono font-bold px-1 py-0.5 rounded uppercase select-none">Ready</span>
              </div>

              <div className="h-[52px] bg-slate-950/70 rounded-lg p-2 border border-white/5 font-mono text-[8px] leading-relaxed overflow-y-auto scrollbar-none select-text text-slate-300">
                {chatHistory.length > 0 ? (
                  <div>
                    <span className="text-[7px] text-blue-400 font-extrabold uppercase select-none tracking-wider block mb-0.5 font-mono">
                      ✦ CO-PROCESSOR:
                    </span>
                    <p className="whitespace-pre-wrap">{chatHistory[chatHistory.length - 1].content}</p>
                  </div>
                ) : (
                  <p className="text-slate-500 font-mono">Ask AI to modify paint templates or handle files automation.</p>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask Lumina AI co-processor..."
                  value={bentoAIInput}
                  onChange={(e) => setBentoAIInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBentoAIPrompt()}
                  className="w-full bg-slate-950/90 border border-white/5 hover:border-slate-800 focus:border-blue-500/80 rounded-lg py-1 pl-2.5 pr-10 text-[8.5px] text-slate-200 placeholder-slate-600 focus:outline-none transition outline-none"
                />
                <button
                  onClick={handleBentoAIPrompt}
                  disabled={isAIPending || !bentoAIInput.trim()}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-1.5 py-0.5 rounded text-white font-bold text-[7px] uppercase transition cursor-pointer"
                >
                  Send
                </button>
              </div>
            </section>

            {/* Diagnostics Stats */}
            <div className="grid grid-cols-2 gap-2">
              {/* Resource Load meter */}
              <div className="bg-slate-900/50 border border-white/5 rounded-xl p-2.5 flex flex-col justify-between h-[65px]">
                <h3 className="text-[8px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                  <Icons.Cpu className="w-2.5 h-2.5 text-purple-400" /> Diagnostics
                </h3>
                <div className="space-y-1">
                  <div>
                    <div className="flex justify-between text-[7.5px] font-mono">
                      <span className="text-slate-400 uppercase">Temp</span>
                      <span className="text-blue-400 font-bold">{tempVal}°C</span>
                    </div>
                    <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000" style={{ width: `${(tempVal/100)*100}%` }}></div>
                    </div>
                  </div>
                  <div className="text-[7px] text-purple-400 font-mono tracking-wide uppercase">Stack active</div>
                </div>
              </div>

              {/* Ambient Mode Slider indicators */}
              <div className="bg-slate-900/50 border border-white/5 rounded-xl p-2.5 flex flex-col justify-between h-[65px]">
                <h3 className="text-[8px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                  <Icons.Sliders className="w-2.5 h-2.5 text-emerald-400" /> Overclock
                </h3>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => {
                      setAiModeOn(!aiModeOn);
                      addNotification('Core Engine', aiModeOn ? 'Core normal' : 'Accelerating processor core logs', 'info');
                    }}
                    className={`text-[7px] font-bold py-0.5 rounded border transition text-center cursor-pointer ${aiModeOn ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/5 border-blue-500/40 text-blue-300' : 'bg-slate-950 border-white/5 text-slate-500'}`}
                  >
                    AI: {aiModeOn ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => {
                      setTurboOn(!turboOn);
                      addNotification('Turbo State', turboOn ? 'Core clock idle' : 'Overclock core speed multiplier unlocked', 'success');
                    }}
                    className={`text-[7px] font-bold py-0.5 rounded border transition text-center cursor-pointer ${turboOn ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/5 border-purple-500/40 text-purple-300' : 'bg-slate-950 border-white/5 text-slate-500'}`}
                  >
                    Turbo: {turboOn ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Web/App Directory Folder list inside Dropdown */}
            <section className="bg-slate-900/30 border border-white/5 rounded-xl p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-[8px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                  <Icons.Folder className="w-2.5 h-2.5 text-amber-400" /> Fast Access
                </h3>
                <span className="text-[7.5px] font-mono text-slate-500">Edit saved logs</span>
              </div>
              <div className="grid grid-cols-3 gap-1 col-span-3">
                {fileSystem.filter(node => node.parentPath === '/Documents' && node.type === 'file').slice(0, 3).map(node => (
                  <div
                    key={node.path}
                    onClick={() => {
                      openWindow('notepad', { path: node.path, content: node.content });
                      setIsNebulaDropdownOpen(false);
                      addNotification('Notepad', `Opened ${node.name}`, 'info');
                    }}
                    className="bg-slate-950/60 hover:bg-slate-950 border border-white/5 p-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer select-none group"
                  >
                    <span className="text-[9px] group-hover:scale-110 transition duration-150 font-sans">📄</span>
                    <div className="truncate flex-1">
                      <div className="text-[7.5px] font-bold text-slate-300 truncate leading-tight group-hover:text-blue-300">{node.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Direct Access alerts nested list in the core dropdown */}
            <section className="bg-slate-900/30 border border-white/5 rounded-xl p-2.5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[8px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                  <Icons.Bell className="w-2.5 h-2.5 text-sky-400" /> System Alerts Tray
                </h3>
                {notificationHistory.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearNotificationHistory();
                      addNotification('Logs Cleared', 'System activity traces cleared successfully.', 'info');
                    }}
                    className="text-[7.5px] font-bold font-mono text-slate-500 hover:text-white uppercase transition cursor-pointer"
                  >
                    Clear Records
                  </button>
                )}
              </div>
              <div className="space-y-1 max-h-[85px] overflow-y-auto scrollbar-none flex flex-col gap-1">
                {notificationHistory.length === 0 ? (
                  <p className="text-slate-600 font-mono text-[7.5px] text-center py-2.5">No logged alert reports.</p>
                ) : (
                  notificationHistory.slice(0, 3).map(log => (
                    <div key={log.id} className="bg-slate-950/60 p-1.5 rounded-lg border border-white/5 flex items-center justify-between gap-1.5 select-text">
                      <div className="truncate flex-1">
                        <span className="text-[8px] font-bold text-slate-200 block truncate">{log.title}</span>
                        <span className="text-[7px] text-slate-400 block truncate">{log.message}</span>
                      </div>
                      <span className="text-[6.5px] font-mono text-slate-500 block shrink-0">{log.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SYSTEM NOTIFICATION HISTORY CENTER (DROPDOWN FLYOUT) */}
      <AnimatePresence>
        {isNotificationsDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-16 right-6 w-[340px] max-w-[90vw] rounded-2xl bg-slate-950/95 border border-white/10 shadow-2xl z-[9950] p-4.5 backdrop-blur-3xl text-slate-200 flex flex-col gap-3 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/5 blur-[32px] pointer-events-none"></div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <Icons.Bell className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-100 font-mono">Activity Logs Center</span>
              </div>
              <div className="flex items-center gap-2">
                {notificationHistory.length > 0 && (
                  <button
                    onClick={() => {
                      clearNotificationHistory();
                      addNotification('Logs Cleared', 'System activity traces cleared successfully.', 'info');
                    }}
                    className="text-[8.5px] text-blue-400 hover:text-blue-300 font-mono font-bold hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setIsNotificationsDropdownOpen(false)}
                  className="text-slate-500 hover:text-white text-[8px] font-mono uppercase bg-white/5 hover:bg-white/10 px-2.5 py-0.5 rounded transition border border-white/5 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Notification logs scrollbox */}
            <div className="max-h-[300px] overflow-y-auto space-y-2 scrollbar-none">
              {notificationHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                  <Icons.BellOff className="w-8 h-8 text-slate-700 stroke-[1.5]" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 font-sans">No logs or alerts registered</div>
                    <div className="text-[9px] text-slate-500 mt-1 max-w-[210px] leading-relaxed mx-auto">Actions and adjustments you take on Lumina OS will be catalogued here.</div>
                  </div>
                </div>
              ) : (
                notificationHistory.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border relative group transition duration-150 flex items-start gap-3 bg-slate-900/40 hover:bg-slate-900/60 border-white/5"
                  >
                    {/* Log severity accent icon */}
                    <div className="mt-0.5 select-none text-base shrink-0">
                      {log.type === 'success' && <Icons.CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {log.type === 'error' && <Icons.AlertOctagon className="w-4 h-4 text-red-400" />}
                      {log.type === 'warning' && <Icons.AlertTriangle className="w-4 h-4 text-amber-500" />}
                      {log.type === 'info' && <Icons.Info className="w-4 h-4 text-blue-400" />}
                    </div>

                    <div className="flex-1 space-y-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-extrabold text-white truncate leading-tight font-sans">{log.title}</span>
                        <span className="text-[8px] font-mono text-slate-500 block shrink-0">{log.timestamp}</span>
                      </div>
                      <p className="text-[9px] text-slate-300 leading-normal break-words select-text font-sans">{log.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="text-[8.5px] font-mono text-slate-500 border-t border-white/5 pt-2 flex items-center justify-between">
              <span>Total Entries: {notificationHistory.length}</span>
              <span>Lumina.OS v2.4.9</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. NOTIFICATION CENTER (TOP RIGHT FLYOUTUNITS) */}
      <div className="absolute top-16 right-4 z-[9999] flex flex-col gap-3.5 max-w-sm w-full select-none">
        <AnimatePresence>
          {notifications.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, scale: 0.85, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', damping: 20 }}
              className={`p-4 rounded-xl shadow-xl border flex items-start gap-3 w-full backdrop-blur-md select-none ${
                toast.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                  : toast.type === 'error'
                    ? 'bg-red-950/80 border-red-500/40 text-red-200'
                    : toast.type === 'warning'
                      ? 'bg-amber-950/80 border-amber-500/40 text-amber-200'
                      : 'bg-slate-900/85 border-slate-700/50 text-slate-200'
              }`}
            >
              <div className="mt-0.5 text-base">
                {toast.type === 'success' && <Icons.CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {toast.type === 'error' && <Icons.AlertOctagon className="w-5 h-5 text-red-400" />}
                {toast.type === 'warning' && <Icons.AlertTriangle className="w-5 h-5 text-amber-400" />}
                {toast.type === 'info' && <Icons.Info className="w-5 h-5 text-blue-400" />}
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold leading-tight">{toast.title}</div>
                <div className="text-[10px] opacity-80 mt-1 leading-normal">{toast.message}</div>
              </div>
              <button
                onClick={() => dismissNotification(toast.id)}
                className="hover:bg-white/10 p-1 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
              >
                <Icons.X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 4. MAIN DESKTOP WORKING GRID STAGE (LEFT LAUNCH SHORTCUTS VERTICALLY ARRANGED) */}
      <div
        className="flex-1 relative p-6 pointer-events-auto select-none"
        onClick={() => {
          setSelectedIconId(null);
          setIsStartMenuOpen(false);
          setIsQuickSettingsOpen(false);
          setIsSearchOpen(false);
          setIsNebulaDropdownOpen(false);
          setIsNotificationsDropdownOpen(false);
          setIsCalendarOpen(false);
        }}
      >
        {/* Left Side Large Glowing Launch Icons (Generous, crisp and comfortable OS layout) */}
        <div 
          className="absolute left-6 top-8 flex flex-row gap-6 select-none touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Column 1: Core OS utilities */}
          <div className="flex flex-col gap-4">
            {[
              { id: 'explorer', label: 'File Explorer', appId: 'explorer', shadowGlow: 'hover:shadow-[0_0_16px_rgba(245,158,11,0.3)] hover:border-amber-500/35' },
              { id: 'notepad', label: 'Notepad', appId: 'notepad', shadowGlow: 'hover:shadow-[0_0_16px_rgba(16,185,129,0.3)] hover:border-emerald-500/35' },
              { id: 'paint', label: 'Paint Studio', appId: 'paint', shadowGlow: 'hover:shadow-[0_0_16px_rgba(244,63,94,0.3)] hover:border-pink-500/35' },
              { id: 'browser', label: 'Google Chrome', appId: 'browser', shadowGlow: 'hover:shadow-[0_0_16px_rgba(56,189,248,0.3)] hover:border-sky-500/35' },
              { id: 'terminal', label: 'Terminal', appId: 'terminal', shadowGlow: 'hover:shadow-[0_0_16px_rgba(16,185,129,0.3)] hover:border-emerald-500/35' },
            ].map(shortcut => {
              const isSelected = selectedIconId === shortcut.id;
              return (
                <div
                  key={shortcut.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIconId(shortcut.id);
                    handleLaunchIcon(shortcut.appId);
                  }}
                  className="flex flex-col items-center select-none cursor-pointer group w-20 transition duration-150 active:scale-95"
                >
                  {/* Modern Rounded Translucent Icon Squircle Wrapper */}
                  <div
                    className={`w-14 h-14 flex items-center justify-center rounded-2xl border transition duration-150 select-none relative ${
                      isSelected 
                        ? 'bg-[#18171f]/95 border-blue-500/80 shadow-[0_0_16px_rgba(59,130,246,0.4)] scale-95' 
                        : 'bg-[#131217]/90 backdrop-blur-xl border-white/10 hover:bg-[#1c1a24]/90 hover:border-white/20 group-hover:scale-105 shadow-lg'
                    } ${shortcut.shadowGlow}`}
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none"></div>
                    {renderCustomAppIcon(shortcut.appId, "w-8 h-8")}
                  </div>
                  
                  {/* Text Label Underneath */}
                  <span className="text-[11px] font-medium text-slate-100 group-hover:text-white select-none mt-1.5 text-center w-full truncate leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                    {shortcut.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Column 2: Intelligence & System Utilities */}
          <div className="flex flex-col gap-4">
            {[
              { id: 'calc', label: 'Calculator', appId: 'calc', shadowGlow: 'hover:shadow-[0_0_16px_rgba(129,140,248,0.3)] hover:border-indigo-500/35' },
              { id: 'voice', label: 'Gemini Live', appId: 'voice', shadowGlow: 'hover:shadow-[0_0_16px_rgba(168,85,247,0.3)] hover:border-purple-500/35' },
              { id: 'maps', label: 'Lumina Maps', appId: 'maps', shadowGlow: 'hover:shadow-[0_0_16px_rgba(245,158,11,0.3)] hover:border-amber-500/35' },
              { id: 'sysmon', label: 'Sys Monitor', appId: 'sysmon', shadowGlow: 'hover:shadow-[0_0_16px_rgba(34,211,238,0.3)] hover:border-cyan-500/35' },
              { id: 'settings', label: 'Settings', appId: 'settings', shadowGlow: 'hover:shadow-[0_0_16px_rgba(168,85,247,0.3)] hover:border-purple-500/35' },
            ].map(shortcut => {
              const isSelected = selectedIconId === shortcut.id;
              return (
                <div
                  key={shortcut.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIconId(shortcut.id);
                    handleLaunchIcon(shortcut.appId);
                  }}
                  className="flex flex-col items-center select-none cursor-pointer group w-20 transition duration-150 active:scale-95"
                >
                  {/* Modern Rounded Translucent Icon Squircle Wrapper */}
                  <div
                    className={`w-14 h-14 flex items-center justify-center rounded-2xl border transition duration-150 select-none relative ${
                      isSelected 
                        ? 'bg-[#18171f]/95 border-blue-500/80 shadow-[0_0_16px_rgba(59,130,246,0.4)] scale-95' 
                        : 'bg-[#131217]/90 backdrop-blur-xl border-white/10 hover:bg-[#1c1a24]/90 hover:border-white/20 group-hover:scale-105 shadow-lg'
                    } ${shortcut.shadowGlow}`}
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none"></div>
                    {renderCustomAppIcon(shortcut.appId, "w-8 h-8")}
                  </div>
                  
                  {/* Text Label Underneath */}
                  <span className="text-[11px] font-medium text-slate-100 group-hover:text-white select-none mt-1.5 text-center w-full truncate leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                    {shortcut.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Float Active Draggable App Panels */}
        {windows.map(win => (
          <WindowFrame key={win.id} windowState={win}>
            {win.appId === 'notepad' && <Notepad id={win.id} args={win.args} />}
            {win.appId === 'paint' && <PaintApp id={win.id} />}
            {win.appId === 'browser' && <BrowserApp />}
            {win.appId === 'calc' && <CalcApp />}
            {win.appId === 'settings' && <SettingsApp />}
            {win.appId === 'terminal' && <TerminalApp id={win.id} args={win.args} />}
            {win.appId === 'explorer' && <FileExplorer />}
            {win.appId === 'copilot' && <CopilotApp />}
            {win.appId === 'voice' && <VoiceApp />}
            {win.appId === 'sysmon' && <SystemMonitor />}
            {win.appId === 'maps' && <MapsApp />}
          </WindowFrame>
        ))}
      </div>

      {/* Slideout system Copilot Sidebar */}
      <AnimatePresence>
        {isCopilotSidebarOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="absolute top-14 right-0 bottom-0 w-96 bg-slate-950/95 backdrop-blur-xl border-l border-white/5 shadow-2xl z-[9000] overflow-hidden"
          >
            <div className="h-full flex flex-col justify-between">
              <CopilotApp onClose={() => setIsCopilotSidebarOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLYOUT: FLUENT WINDOWS START MENU */}
      <AnimatePresence>
        {isStartMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute bottom-22 left-1/2 -translate-x-1/2 w-[440px] max-w-[92vw] rounded-2xl bg-slate-950/95 border border-white/10 shadow-2xl shadow-black/80 z-[9000] p-5 backdrop-blur-3xl text-slate-200 flex flex-col gap-4.5 overflow-hidden"
          >
            {/* Gloss Decoration and Header */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 blur-[45px] pointer-events-none"></div>

            {/* Search input inside Start Menu */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-900/50 border border-white/10 focus-within:border-blue-500/50 rounded-xl select-none">
              <Icons.Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search apps, tools, settings or files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-0 outline-none text-xs flex-1 text-slate-100 placeholder-slate-500 focus:ring-0 focus:outline-none"
              />
            </div>

            {/* Pinned launcher section */}
            <div className="flex-1 min-h-[170px]">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-3 select-none font-mono">
                <span>Pinned Applications</span>
              </div>

              {startAppsFiltered.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-slate-500 font-mono text-xs">
                  No matching apps found.
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2.5">
                  {startAppsFiltered.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleLaunchIcon(item.appId);
                        setIsStartMenuOpen(false);
                      }}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-slate-900/30 border border-white/5 hover:bg-slate-900/70 hover:border-white/15 transition text-center cursor-pointer select-none group"
                    >
                      <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-950/70 border border-white/10 transition duration-150 relative group-hover:scale-105">
                        {renderCustomAppIcon(item.appId, "w-6.5 h-6.5")}
                      </div>
                      <span className="text-[10.5px] font-medium text-slate-200 group-hover:text-white select-none text-center w-full truncate leading-tight">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom active context bar */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5 select-none font-mono">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 font-bold flex items-center justify-center text-[10px] text-white">
                  A
                </div>
                <div>
                  <div className="text-[10px] font-bold leading-tight">Admin System</div>
                  <div className="text-[8px] text-slate-500 leading-none">system_admin</div>
                </div>
              </div>

              <div className="flex items-center gap-2 select-none relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPowerMenuOpen(!isPowerMenuOpen);
                  }}
                  title="Power Options"
                  className={`p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer flex items-center justify-center border border-transparent hover:border-white/5 ${
                    isPowerMenuOpen ? 'bg-white/10 text-white' : 'text-slate-400'
                  }`}
                >
                  <Icons.Power className="w-3.5 h-3.5" />
                </button>

                {/* Dropdown containing sleep, shut down, restart, and reset options */}
                <AnimatePresence>
                  {isPowerMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-9 right-0 w-44 bg-slate-950/95 border border-white/10 rounded-xl p-1 shadow-2xl z-[9500] flex flex-col backdrop-blur-3xl divide-y divide-white/5"
                    >
                      <div className="p-1">
                        <button
                          onClick={() => {
                            setIsPowerMenuOpen(false);
                            setIsStartMenuOpen(false);
                            setPowerState('sleeping');
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-[9.5px] text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition cursor-pointer font-sans font-medium text-left"
                        >
                          <Icons.Moon className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Sleep Mode</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setIsPowerMenuOpen(false);
                            setIsStartMenuOpen(false);
                            setShutdownNextState('off');
                            setPowerState('shutting-down');
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-[9.5px] text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition cursor-pointer font-sans font-medium text-left"
                        >
                          <Icons.Power className="w-3.5 h-3.5 text-red-400" />
                          <span>Shut Down</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setIsPowerMenuOpen(false);
                            setIsStartMenuOpen(false);
                            setShutdownNextState('booting');
                            setPowerState('shutting-down');
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-[9.5px] text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition cursor-pointer font-sans font-medium text-left"
                        >
                          <Icons.RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Restart OS</span>
                        </button>
                      </div>

                      <div className="p-1">
                        <button
                          onClick={() => {
                            setIsPowerMenuOpen(false);
                            setIsStartMenuOpen(false);
                            triggerPowerReset();
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-[9px] text-red-500 hover:text-white hover:bg-red-500/20 rounded-lg transition cursor-pointer font-sans font-bold text-left"
                        >
                          <Icons.Trash2 className="w-3.5 h-3.5 text-red-500" />
                          <span>Factory Reset</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLYOUT: ACTIVE SYSTEM QUICK SETTINGS PANEL */}
      <AnimatePresence>
        {isQuickSettingsOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`absolute bottom-22 right-6 w-[345px] rounded-3xl p-5 shadow-2xl z-[9000] border flex flex-col gap-4 select-none ${
              isLightTheme 
                ? 'acrylic-light text-slate-950 border-slate-300 shadow-slate-950/20' 
                : 'acrylic text-white border-white/10 shadow-black/70'
            }`}
          >
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => setWifiOn(!wifiOn)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl cursor-pointer transition select-none ${
                  wifiOn 
                    ? 'bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]' 
                    : isLightTheme 
                      ? 'bg-slate-900/10 hover:bg-slate-900/15 text-slate-700 border border-slate-200' 
                      : 'bg-white/10 hover:bg-white/15 text-slate-300'
                }`}
              >
                <Icons.Wifi className="w-4 h-4 mb-1.5" />
                <span className="text-[10px] font-bold">WiFi</span>
              </button>
              <button
                onClick={() => setBluetoothOn(!bluetoothOn)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl cursor-pointer transition select-none ${
                  bluetoothOn 
                    ? 'bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]' 
                    : isLightTheme 
                      ? 'bg-slate-900/10 hover:bg-slate-900/15 text-slate-700 border border-slate-200' 
                      : 'bg-white/10 hover:bg-white/15 text-slate-300'
                }`}
              >
                <Icons.Bluetooth className="w-4 h-4 mb-1.5" />
                <span className="text-[10px] font-bold">Bluetooth</span>
              </button>
              <button
                onClick={() => setAirplaneOn(!airplaneOn)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl cursor-pointer transition select-none ${
                  airplaneOn 
                    ? 'bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]' 
                    : isLightTheme 
                      ? 'bg-slate-900/10 hover:bg-slate-900/15 text-slate-700 border border-slate-200' 
                      : 'bg-white/10 hover:bg-white/15 text-slate-300'
                }`}
              >
                <Icons.Plane className="w-4 h-4 mb-1.5" />
                <span className="text-[10px] font-bold">Airplane</span>
              </button>
            </div>

            <div className={`space-y-3.5 border-t pt-3.5 ${isLightTheme ? 'border-slate-200' : 'border-white/5'}`}>
              <div className="flex items-center gap-3 select-none">
                <Icons.Volume2 className={`w-4 h-4 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`} />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="flex-1 accent-blue-500 cursor-pointer h-1.5 rounded-lg bg-white/10"
                  style={{ backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)' }}
                />
                <span className={`text-[10px] font-mono font-bold w-6 text-right ${isLightTheme ? 'text-slate-700' : 'text-slate-400'}`}>{volume}%</span>
              </div>
              <div className="flex items-center gap-3 select-none">
                <Icons.Sun className={`w-4 h-4 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`} />
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="flex-1 accent-blue-500 cursor-pointer h-1.5 rounded-lg bg-white/10"
                  style={{ backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)' }}
                />
                <span className={`text-[10px] font-mono font-bold w-6 text-right ${isLightTheme ? 'text-slate-700' : 'text-slate-400'}`}>{brightness}%</span>
              </div>
            </div>

            <div className={`flex items-center justify-between border-t pt-3 leading-none text-[10px] select-none ${
              isLightTheme ? 'border-slate-200 text-slate-500' : 'border-white/5 text-slate-400'
            }`}>
              <div className="flex items-center gap-1 font-mono uppercase">
                <Icons.Cpu className="w-3 text-sky-400" /> Core System online
              </div>
              <div className="font-mono font-medium">92% Power Charge</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLYOUT: ACTIVE SYSTEM CALENDAR & TIME PANEL */}
      <AnimatePresence>
        {isCalendarOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`absolute bottom-22 left-1/2 translate-x-[90px] -translate-x-1/2 w-[315px] rounded-2xl p-4 shadow-2xl z-[9000] border flex flex-col gap-3 select-none ${
              isLightTheme 
                ? 'acrylic-light text-slate-950 border-slate-300 shadow-slate-950/20' 
                : 'acrylic text-white border-white/10 shadow-black/70'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Compact Month & Year and Navigation combined to save vertical space */}
            <div className={`flex items-center justify-between border-b pb-2.5 select-none ${isLightTheme ? 'border-slate-200' : 'border-white/5'}`}>
              <div className="flex flex-col gap-0.5">
                <span className={`text-xs font-bold font-mono uppercase tracking-wider ${isLightTheme ? 'text-slate-800' : 'text-slate-200'}`}>
                  {calendarDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                </span>
                <span className="text-[10px] font-medium tracking-wide text-sky-500">
                  {selectedCalendarDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const prev = new Date(calendarDate);
                    prev.setMonth(prev.getMonth() - 1);
                    setCalendarDate(prev);
                  }}
                  className={`p-1 rounded-lg transition cursor-pointer ${
                    isLightTheme 
                      ? 'hover:bg-slate-200 text-slate-600 hover:text-slate-900' 
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  }`}
                  title="Previous Month"
                >
                  <Icons.ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const todayObj = new Date();
                    setCalendarDate(todayObj);
                    setSelectedCalendarDate(todayObj);
                  }}
                  className={`px-1.5 py-0.5 text-[8px] rounded font-mono transition uppercase cursor-pointer ${
                    isLightTheme 
                      ? 'hover:bg-slate-200 text-slate-600 hover:text-blue-600' 
                      : 'hover:bg-white/10 text-slate-400 hover:text-sky-400'
                  }`}
                  title="Go to Today"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const next = new Date(calendarDate);
                    next.setMonth(next.getMonth() + 1);
                    setCalendarDate(next);
                  }}
                  className={`p-1 rounded-lg transition cursor-pointer ${
                    isLightTheme 
                      ? 'hover:bg-slate-200 text-slate-600 hover:text-slate-900' 
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  }`}
                  title="Next Month"
                >
                  <Icons.ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex flex-col gap-1">
              {/* Day headers */}
              <div className={`grid grid-cols-7 text-center font-mono text-[9px] font-bold mb-1 select-none justify-items-center w-full ${
                isLightTheme ? 'text-slate-600' : 'text-slate-500'
              }`}>
                <span>SU</span>
                <span>MO</span>
                <span>TU</span>
                <span>WE</span>
                <span>TH</span>
                <span>FR</span>
                <span>SA</span>
              </div>
              
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1 text-center justify-items-center w-full">
                {getDaysInMonth(calendarDate).map((cell, idx) => {
                  const isCurSelected = 
                    selectedCalendarDate.getDate() === cell.day &&
                    selectedCalendarDate.getMonth() === cell.date.getMonth() &&
                    selectedCalendarDate.getFullYear() === cell.date.getFullYear();
                  
                  const isActualToday = 
                    new Date().getDate() === cell.day &&
                    new Date().getMonth() === cell.date.getMonth() &&
                    new Date().getFullYear() === cell.date.getFullYear();

                  const dateKey = cell.date.toISOString().split('T')[0];
                  const hasCustomEvents = customEvents[dateKey] && customEvents[dateKey].length > 0;
                  const hasEvents = (CALENDAR_EVENTS[dateKey] && CALENDAR_EVENTS[dateKey].length > 0) || hasCustomEvents;

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedCalendarDate(cell.date)}
                      className={`h-7 w-7 rounded-full flex flex-col items-center justify-center text-[11px] relative transition cursor-pointer select-none ${
                        !cell.isCurrentMonth 
                          ? isLightTheme ? 'text-slate-400' : 'text-slate-600 font-normal opacity-50' 
                          : isLightTheme ? 'text-slate-800 font-medium' : 'text-slate-200 font-medium'
                      } ${
                        isCurSelected 
                          ? 'bg-blue-600 text-white font-bold shadow-[0_0_8px_rgba(37,99,235,0.6)]' 
                          : isLightTheme ? 'hover:bg-slate-200' : 'hover:bg-white/5'
                      } ${
                        isActualToday && !isCurSelected ? 'border border-sky-400/50' : ''
                      }`}
                    >
                      <span>{cell.day}</span>
                      {hasEvents && (
                        <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isCurSelected ? 'bg-white' : 'bg-sky-500'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Events view / Logs section */}
            <div className={`border-t pt-2 flex flex-col gap-2 ${isLightTheme ? 'border-slate-200' : 'border-white/5'}`}>
              <span className={`text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 select-none font-bold ${
                isLightTheme ? 'text-slate-700' : 'text-slate-400'
              }`}>
                <Icons.ListTodo className="w-3.5 h-3.5 text-sky-500" />
                Routines & Tasks
              </span>

              {/* Event list */}
              <div className="max-h-[90px] overflow-y-auto pr-1 flex flex-col gap-1.2 scrollbar-thin">
                {(() => {
                  const dateKey = selectedCalendarDate.toISOString().split('T')[0];
                  
                  // Combine default events (only if specific to this date) and custom events
                  const daySpecificEvents = CALENDAR_EVENTS[dateKey] || [];
                  const userEvents = customEvents[dateKey] || [];
                  const mergedEvents = [...daySpecificEvents, ...userEvents];

                  // Fallback to default index template if it's not a specified day and empty
                  const activeEvents = mergedEvents.length > 0 ? mergedEvents : CALENDAR_EVENTS['default'];

                  if (!activeEvents || activeEvents.length === 0) {
                    return (
                      <span className="text-[10px] font-mono italic p-1 text-slate-500">No active cycles or tasks.</span>
                    );
                  }

                  return activeEvents.map((ev, i) => {
                    const badgeColors = isLightTheme ? (
                      ev.type === 'system' ? 'border-sky-300 text-sky-700 bg-sky-50 shadow-sm' :
                      ev.type === 'ai' ? 'border-purple-300 text-purple-700 bg-purple-50 shadow-sm' :
                      'border-emerald-300 text-emerald-700 bg-emerald-50 shadow-sm'
                    ) : (
                      ev.type === 'system' ? 'border-sky-500/20 text-sky-400 bg-sky-950/20' :
                      ev.type === 'ai' ? 'border-purple-500/20 text-purple-400 bg-purple-950/20' :
                      'border-emerald-500/20 text-emerald-400 bg-emerald-950/20'
                    );

                    return (
                      <div key={i} className={`flex items-center justify-between gap-1.5 p-1 rounded-lg border transition ${
                        isLightTheme 
                          ? 'bg-slate-100/85 hover:bg-slate-200/80 border-slate-200' 
                          : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/5'
                      }`}>
                        <div className="flex flex-col gap-0.5 max-w-[70%]">
                          <span className={`text-[9.5px] font-semibold truncate leading-tight select-none ${isLightTheme ? 'text-slate-800' : 'text-slate-200'}`}>{ev.label}</span>
                          <span className={`text-[8px] font-mono leading-none flex items-center gap-1 select-none ${isLightTheme ? 'text-slate-500' : 'text-slate-500'}`}>
                            <Icons.Clock className="w-2.5 h-2.5 text-slate-600" /> {ev.time}
                          </span>
                        </div>
                        <span className={`text-[8px] px-1 py-0.5 rounded border ${badgeColors} font-mono select-none`}>
                          {ev.type}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Direct interactive interface to add a routine task in calendar */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <input
                  type="text"
                  placeholder="Schedule routine task..."
                  value={newEventText}
                  onChange={(e) => setNewEventText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddEvent();
                  }}
                  className={`border focus:border-sky-500/30 rounded-lg px-2 py-1 text-[9px] flex-1 outline-none font-sans ${
                    isLightTheme 
                      ? 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500' 
                      : 'bg-slate-950/40 border-white/5 text-white placeholder-slate-600'
                  }`}
                />
                <button
                  onClick={handleAddEvent}
                  className={`p-1 px-1.5 rounded-lg border transition cursor-pointer ${
                    isLightTheme 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm' 
                      : 'bg-sky-600/25 hover:bg-sky-600 text-sky-400 hover:text-white border-sky-500/10'
                  }`}
                >
                  <Icons.Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. FLOATING GLASSY BOTTOM DOCK (PRECISELY LIKE SCREENSHOT) */}
      <div 
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[9000] flex flex-col items-center gap-1 select-none pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toggle chevron when minimized */}
        {!isDockExpanded && (
          <button
            onClick={() => setIsDockExpanded(true)}
            className="w-7 h-5 bg-slate-950/80 hover:bg-slate-900 border border-white/5 rounded-t-xl flex items-center justify-center hover:text-white text-slate-400 cursor-pointer transition focus:outline-none pointer-events-auto shadow-lg"
            title="Reveal Dock"
          >
            <Icons.ChevronUp className="w-3.5 h-3.5 text-sky-400 animate-bounce" />
          </button>
        )}

        {/* The main dynamic dock menu frame */}
        <AnimatePresence>
          {isDockExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className={`px-4 py-2 border rounded-full backdrop-blur-3xl flex items-center gap-3 w-auto shadow-2xl relative ${
                isLightTheme 
                  ? 'bg-slate-100/95 border-slate-300 shadow-slate-400/20' 
                  : 'bg-slate-950/80 border-white/15 shadow-black/60'
              }`}
            >
              {/* Start Logo button shortcut (custom high quality Windows 11 style) */}
              <button
                onClick={() => {
                  setIsStartMenuOpen(!isStartMenuOpen);
                  setIsQuickSettingsOpen(false);
                  setIsSearchOpen(false);
                }}
                className={`w-10 h-10 flex items-center justify-center rounded-2xl transition transform active:scale-95 cursor-pointer select-none border border-transparent ${
                  isStartMenuOpen 
                    ? 'bg-white/15 border-white/10 shadow-inner' 
                    : 'hover:bg-white/10 text-sky-400'
                }`}
                title="Start Menu"
              >
                <div className="grid grid-cols-2 gap-[3.5px] p-1 pointer-events-none">
                  <div className="rounded-[3px] bg-[#1f83fa] shadow-[0_0_6px_rgba(31,131,250,0.6)]" style={{ width: '9.5px', height: '9.5px' }} />
                  <div className="rounded-[3px] bg-[#02bbf9] shadow-[0_0_6px_rgba(2,187,249,0.6)]" style={{ width: '9.5px', height: '9.5px' }} />
                  <div className="rounded-[3px] bg-[#5e5eff] shadow-[0_0_6px_rgba(94,94,255,0.6)]" style={{ width: '9.5px', height: '9.5px' }} />
                  <div className="rounded-[3px] bg-[#858ffc] shadow-[0_0_6px_rgba(133,143,252,0.6)]" style={{ width: '9.5px', height: '9.5px' }} />
                </div>
              </button>

              <div className={`h-6 w-px select-none ${isLightTheme ? 'bg-slate-300' : 'bg-white/10'}`} />

              {/* Pin shortcut application links with glow highlights */}
              {[
                { id: 'terminal', label: 'Terminal', appId: 'terminal' },
                { id: 'explorer', label: 'Explorer', appId: 'explorer' },
                { id: 'notepad', label: 'Notepad', appId: 'notepad' },
                { id: 'browser', label: 'Chrome', appId: 'browser' },
                { id: 'paint', label: 'Paint', appId: 'paint' },
                { id: 'calc', label: 'Calculator', appId: 'calc' },
              ].map(launcher => {
                const isOpen = windows.some(w => w.appId === launcher.appId);
                const isActive = activeWindowId && windows.find(w => w.id === activeWindowId)?.appId === launcher.appId;
                
                return (
                  <button
                    key={launcher.id}
                    onClick={() => handleLaunchIcon(launcher.appId)}
                    className={`w-10 h-10 flex flex-col items-center justify-center rounded-2xl relative cursor-pointer select-none transition ${
                      isActive 
                        ? isLightTheme ? 'bg-slate-300 text-slate-900 font-bold shadow-sm' : 'bg-white/15 text-white shadow-inner' 
                        : isLightTheme ? 'hover:bg-slate-200/70 text-slate-750' : 'hover:bg-white/10 text-slate-300'
                    }`}
                    title={launcher.label}
                  >
                    {renderCustomAppIcon(launcher.appId, "w-6.5 h-6.5")}
                    
                    {/* Active/Minimized status dot on the bottom */}
                    {isOpen && (
                      <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        isActive 
                          ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)] scale-110' 
                          : 'bg-slate-400'
                      }`} />
                    )}
                  </button>
                );
              })}

              <div className={`h-6 w-px select-none ${isLightTheme ? 'bg-slate-300' : 'bg-white/10'}`} />

              {/* Chevron inline minimize caret */}
              <button
                onClick={() => setIsDockExpanded(false)}
                className={`flex items-center justify-center w-8 h-8 rounded-xl cursor-pointer transition ${
                  isLightTheme ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-white/10 text-slate-400 hover:text-white'
                }`}
                title="Hide Dock"
              >
                <Icons.ChevronDown className="w-4 h-4" />
              </button>

              {/* Pill with WiFi and Video camera icons */}
              <button
                onClick={() => {
                  setIsQuickSettingsOpen(!isQuickSettingsOpen);
                  setIsStartMenuOpen(false);
                  setIsCalendarOpen(false);
                }}
                className={`flex items-center gap-2 px-3 h-10 rounded-2xl cursor-pointer select-none transition border border-transparent ${
                  isQuickSettingsOpen 
                    ? 'bg-white/20 border-white/10' 
                    : isLightTheme 
                      ? 'bg-slate-200/70 hover:bg-slate-250 text-slate-800' 
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
                title="Quick Control Sliders"
              >
                <Icons.Wifi className="w-4 h-4" />
                <Icons.Video className="w-4 h-4" />
              </button>

              {/* Pill with Bell icon */}
              <button
                onClick={() => {
                  addNotification("Quick Diagnostic", "All system resources operating within normal parameters.", "info");
                }}
                className={`flex items-center justify-center w-10 h-10 rounded-2xl cursor-pointer select-none transition ${
                  isLightTheme 
                    ? 'bg-slate-200/70 hover:bg-slate-250 text-slate-800' 
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
                title="Notifications"
              >
                <Icons.Bell className="w-4 h-4" />
              </button>

              {/* Stacked Time/Date clock capsule trigger */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCalendarOpen(!isCalendarOpen);
                  setIsNebulaDropdownOpen(false);
                  setIsStartMenuOpen(false);
                  setIsQuickSettingsOpen(false);
                  setIsSearchOpen(false);
                }}
                className={`text-center flex flex-col justify-center select-none px-4 h-10 rounded-2xl transition-all duration-150 cursor-pointer ${
                  isCalendarOpen 
                    ? 'bg-white/15 border border-white/10 shadow-inner' 
                    : isLightTheme 
                      ? 'bg-slate-200/70 hover:bg-slate-250 text-slate-800' 
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
                title="System Calendar"
              >
                <div className={`font-bold text-xs tracking-wider leading-none ${isLightTheme ? 'text-slate-900' : 'text-slate-100'}`}>
                  {timeStr}
                </div>
                <div className="text-[8.5px] uppercase tracking-widest text-slate-400 block mt-0.5 font-sans">
                  {simpleDateStr}
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button (FAB) for AI Copilot (designed like reference photo) */}
      <div className={`absolute bottom-6 right-6 z-[9500] pointer-events-auto select-none transition-all duration-300 ${
        isCopilotSidebarOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100'
      }`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsCopilotSidebarOpen(!isCopilotSidebarOpen);
            // Close other overlay menus
            setIsStartMenuOpen(false);
            setIsQuickSettingsOpen(false);
            setIsSearchOpen(false);
            setIsNebulaDropdownOpen(false);
            setIsCalendarOpen(false);
          }}
          className={`group flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ease-out cursor-pointer ${
            isCopilotSidebarOpen 
              ? 'bg-[#9333ea] border border-[#a855f7]/50 rotate-90 scale-95 shadow-[0_0_20px_rgba(147,51,234,0.55)] hover:bg-[#a855f7]' 
              : 'rainbow-glow-border rainbow-pulsing-shadow bg-slate-950/95 hover:scale-[1.10] active:scale-90 text-white'
          }`}
          title="Toggle Lumina AI assistant"
        >
          {isCopilotSidebarOpen ? (
            <Icons.X className="w-5 h-5 text-white" />
          ) : (
            renderCustomAppIcon('copilot', "w-7.5 h-7.5")
          )}
        </button>
      </div>

      {/* POWER STATE OVERLAYS */}
      <AnimatePresence>
        {/* Sleeping screen state */}
        {powerState === 'sleeping' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            onClick={() => setPowerState('on')}
            className="absolute inset-0 bg-black/95 z-[999999] flex flex-col items-center justify-center cursor-pointer select-none"
          >
            {/* Pulsing breathing ambient light orb */}
            <div className="absolute w-[280px] h-[280px] rounded-full bg-indigo-600/10 blur-[90px] animate-pulse duration-[4000ms]" />
            <motion.div 
              animate={{ 
                scale: [0.95, 1.05, 0.95],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="flex flex-col items-center gap-4 text-center select-none"
            >
              <Icons.Moon className="w-12 h-12 text-indigo-400 opacity-60" />
              <div className="space-y-1">
                <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">System Suspended</p>
                <p className="text-[10px] text-slate-600 font-sans">Click anywhere to resume session</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Shutting-down screen state */}
        {powerState === 'shutting-down' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-slate-950 z-[999999] flex flex-col items-center justify-center select-none overflow-hidden"
          >
            {/* Spinning background gradients */}
            <div className="absolute w-[450px] h-[450px] rounded-full bg-red-600/5 blur-[120px]" />
            
            <div className="max-w-md w-full px-8 flex flex-col items-center gap-7">
              {/* Spinner */}
              <div className="relative flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border border-white/5" />
                <div className="absolute w-10 h-10 rounded-full border-t border-red-500 animate-spin" />
              </div>
              
              <div className="space-y-2 text-center">
                <h1 className="text-sm font-extrabold tracking-[0.2em] text-white">SHUTTING DOWN</h1>
                <p className="text-[10px] text-slate-400 font-mono h-4 select-none leading-none">
                  {shutdownStatus}
                </p>
              </div>
              
              {/* Mini Terminal Bar Indicator */}
              <div className="w-full max-w-[200px] h-1 bg-white/5 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-150"
                  style={{ width: `${shutdownProgress}%` }}
                />
              </div>

              <div className="text-[9px] font-mono text-slate-600">
                Lumina ACPI Subsystem v1.0.4 • PROGRESS {shutdownProgress}%
              </div>
            </div>
          </motion.div>
        )}

        {/* Completely OFF state with central power button */}
        {powerState === 'off' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-black z-[999999] flex flex-col items-center justify-center select-none"
          >
            <div className="text-center space-y-7">
              {/* Central Glowing Power Switch */}
              <button
                onClick={() => {
                  playStartupSound();
                  setPowerState('booting');
                }}
                title="Power On Lumina OS"
                className="w-16 h-16 rounded-full border border-white/5 bg-[#0a0a0c] hover:bg-[#121215] flex items-center justify-center text-slate-500 hover:text-white transition-all duration-300 hover:shadow-[0_0_24px_rgba(255,255,255,0.06)] hover:border-white/10 group cursor-pointer"
              >
                <Icons.Power className="w-6 h-6 text-slate-600 group-hover:text-amber-400 group-hover:scale-105 transition" />
              </button>
              
              <div className="space-y-1">
                <p className="text-[10px] font-mono tracking-widest text-slate-600 uppercase">System Power Off</p>
                <p className="text-[9px] text-slate-700 font-sans">Click the switch to start workspace bootloader</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Booting Loader State */}
        {powerState === 'booting' && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="absolute inset-0 bg-slate-950 z-[999999] flex flex-col items-center justify-center select-none overflow-hidden"
          >
            {/* Ambient Cosmic Orbs */}
            <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            
            <div className="max-w-md w-full px-8 flex flex-col items-center gap-7">
              {/* Spinning Brand Icon */}
              <div className="flex flex-col items-center gap-2">
                <div className="grid grid-cols-2 gap-1.5 p-3.5 bg-slate-900/40 rounded-3xl border border-white/10 shadow-2xl relative">
                  {/* Subtle Spinner ring under brand icon */}
                  <div className="absolute inset-0 rounded-3xl border border-blue-500/20 animate-pulse" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#1f83fa] shadow-[0_0_8px_rgba(31,131,250,0.6)] animate-bounce delay-75" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#02bbf9] shadow-[0_0_8px_rgba(2,187,249,0.6)] animate-bounce delay-150" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#5e5eff] shadow-[0_0_8px_rgba(94,94,255,0.6)] animate-bounce delay-225" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#858ffc] shadow-[0_0_8px_rgba(133,143,252,0.6)] animate-bounce delay-300" />
                </div>
                <span className="text-base font-extrabold tracking-[0.35em] text-white mt-1">LUMINA.OS</span>
              </div>

              {/* Status and Diagnostics */}
              <div className="space-y-2 text-center w-full max-w-[280px]">
                <p className="text-[10px] text-slate-400 font-mono h-4 truncate select-none leading-none">
                  {bootStatus}
                </p>
                
                {/* Visual loading bar */}
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#1f83fa] to-[#858ffc] rounded-full transition-all duration-150"
                    style={{ width: `${bootProgress}%` }}
                  />
                </div>
              </div>

              <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
                Kernel Version 2.6.4-prod • PROGRESS {bootProgress}%
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Desktop;
