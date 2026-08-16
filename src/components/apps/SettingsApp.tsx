import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { 
  Monitor, 
  Palette, 
  Cpu, 
  Volume2, 
  ShieldAlert, 
  Sparkles, 
  FolderSync, 
  Sliders, 
  Moon, 
  Sun, 
  VolumeX, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Activity, 
  Battery, 
  BatteryCharging, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Volume1, 
  Globe, 
  RefreshCw as UpdateIcon, 
  CheckCircle, 
  Play, 
  Square,
  Power
} from 'lucide-react';
import { OSTheme } from '../../types';

const WALLPAPERS = [
  { id: 'glass', name: 'Glassy Bloom', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80' },
  { id: 'synth', name: 'Synthwave Neon', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1600&q=80' },
  { id: 'vibrant', name: 'Vibrant Fluid', url: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1600&q=80' },
  { id: 'art', name: 'Abstract Pastel', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1600&q=80' },
];

const ACCENTS = [
  { name: 'Windows Blue', color: '#0078d4', text: 'text-[#0078d4]', bg: 'bg-[#0078d4]' },
  { name: 'Crimson Red', color: '#e81123', text: 'text-[#e81123]', bg: 'bg-[#e81123]' },
  { name: 'Emerald Green', color: '#107c41', text: 'text-[#107c41]', bg: 'bg-[#107c41]' },
  { name: 'Ultraviolet Purple', color: '#b4009e', text: 'text-[#b4009e]', bg: 'bg-[#b4009e]' },
  { name: 'Sunset Orange', color: '#d83b01', text: 'text-[#d83b01]', bg: 'bg-[#d83b01]' },
];

export const SettingsApp: React.FC = () => {
  const { settings, setTheme, setAccentColor, setWallpaper, updateSettings, fileSystem, addNotification } = useOS();
  const [activeTab, setActiveTab ] = useState<'personalization' | 'display' | 'audio' | 'ai' | 'network' | 'battery' | 'security' | 'updates' | 'system'>('personalization');

  // Load state and safe fallback variables
  const brightness = settings.brightness ?? 100;
  const scale = settings.scale ?? 100;
  const nightLight = settings.nightLight ?? false;
  const nightLightStrength = settings.nightLightStrength ?? 40;
  const aiPersona = settings.aiPersona ?? 'balanced';
  const aiVoiceSpeed = settings.aiVoiceSpeed ?? 1.0;
  const systemSound = settings.systemSound ?? true;
  const username = settings.username ?? 'Administrator';

  const powerPlan = settings.powerPlan ?? 'balanced';
  const sleepTimer = settings.sleepTimer ?? 15;
  const wifiOn = settings.wifiOn ?? true;
  const vpnActive = settings.vpnActive ?? false;
  const bluetoothOn = settings.bluetoothOn ?? true;
  const dnsServer = settings.dnsServer ?? '8.8.8.8';
  const lockEnabled = settings.lockEnabled ?? false;
  const lockPassword = settings.lockPassword ?? '';
  const windowsUpdated = settings.windowsUpdated ?? false;
  const firewallActive = settings.firewallActive ?? true;
  const volume = settings.volume ?? 80;
  const refreshRate = settings.refreshRate ?? 60;

  // Local state for interactive simulators
  // Speed Test Simulator Hook
  const [isTestingSpeed, setIsTestingSpeed] = useState(false);
  const [speedProgress, setSpeedProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
  const [pingSpeed, setPingSpeed] = useState<number | null>(null);

  // Update simulator state
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStepName, setUpdateStepName] = useState('');

  // Audio testing state
  const [isPlayingTestTone, setIsPlayingTestTone] = useState(false);

  // Calculate filesystem size stats
  const fileCount = fileSystem.filter(n => n.type === 'file').length;
  const folderCount = fileSystem.filter(n => n.type === 'directory').length;
  const totalDiskSize = fileSystem.reduce((sum, n) => sum + (n.size || 0), 0);
  const percentUsed = Math.min(100, Math.ceil((totalDiskSize / 100000) * 100)); // 100KB virtual quota

  // Handle speed test logic
  const runSpeedTest = () => {
    setIsTestingSpeed(true);
    setSpeedProgress(0);
    setDownloadSpeed(null);
    setUploadSpeed(null);
    setPingSpeed(null);
  };

  useEffect(() => {
    if (!isTestingSpeed) return;
    
    const interval = setInterval(() => {
      setSpeedProgress(prev => {
        const next = prev + 4;
        if (next >= 100) {
          clearInterval(interval);
          setIsTestingSpeed(false);
          setDownloadSpeed(Math.floor(250 + Math.random() * 450));
          setUploadSpeed(Math.floor(80 + Math.random() * 120));
          setPingSpeed(Math.floor(4 + Math.random() * 18));
          addNotification('Speed Test Complete', 'Broadband bandwidth integrity check reports maximum performance.', 'success');
          return 100;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isTestingSpeed]);

  // Handle virtual Windows Update logic
  const triggerSystemUpdate = () => {
    setIsUpdating(true);
    setUpdateProgress(0);
    setUpdateStepName('Downloading: LuminaOS Core Framework Security Patch v2.4.9 (x64)...');
  };

  useEffect(() => {
    if (!isUpdating) return;

    const interval = setInterval(() => {
      setUpdateProgress(prev => {
        const next = prev + 1;
        if (next === 30) {
          setUpdateStepName('Verifying credentials, backup restoration check bounds...');
        } else if (next === 60) {
          setUpdateStepName('Unpacking libraries: libcopilot-core-node, libc-graphics-subshell v4...');
        } else if (next === 85) {
          setUpdateStepName('Refiring virtual registry logs and security policy rules...');
        } else if (next >= 100) {
          clearInterval(interval);
          setIsUpdating(false);
          updateSettings({ windowsUpdated: true });
          addNotification('LuminaOS Updated', 'Workspace system patch v2.4.9 installed successfully.', 'success');
          return 100;
        }
        return next;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [isUpdating]);

  // Speaker Test Tone
  const playTestTone = () => {
    if (isPlayingTestTone) return;
    setIsPlayingTestTone(true);
    
    // Simulate real Web Audio API chime
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.type = 'sine';
      // Dual futuristic frequency cascade
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 pitch
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5 pitch
      
      gainNode.gain.setValueAtTime((volume / 100) * 0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio context bypass for test sound");
    }

    setTimeout(() => {
      setIsPlayingTestTone(false);
    }, 400);
  };

  const triggerWallpaperReset = (url: string, name: string) => {
    setWallpaper(url);
    addNotification('Wallpaper Customised', `Background changed to "${name}" successfully.`, 'success');
  };

  return (
    <div id="settings_window_root" className="flex bg-slate-950 text-slate-100 h-full font-sans select-none overflow-hidden">
      {/* Sidebar options */}
      <div id="settings_sidebar" className="w-56 bg-slate-900 border-r border-slate-800/80 p-3 flex flex-col gap-1 text-[11px] text-slate-400 font-semibold select-none shrink-0 overflow-y-auto scrollbar-none">
        <div className="text-[9px] text-slate-500 uppercase tracking-wider px-2 mb-2 font-bold font-mono">Control Station</div>
        
        <button
          id="btn_set_tab_personalization"
          onClick={() => setActiveTab('personalization')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition duration-150 text-left cursor-pointer ${activeTab === 'personalization' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'hover:bg-slate-800 hover:text-white'}`}
        >
          <Palette className="w-3.5 h-3.5" /> Personalization
        </button>

        <button
          id="btn_set_tab_display"
          onClick={() => setActiveTab('display')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition duration-150 text-left cursor-pointer ${activeTab === 'display' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'hover:bg-slate-800 hover:text-white'}`}
        >
          <Monitor className="w-3.5 h-3.5" /> Display Config
        </button>

        <button
          id="btn_set_tab_audio"
          onClick={() => setActiveTab('audio')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition duration-150 text-left cursor-pointer ${activeTab === 'audio' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'hover:bg-slate-800 hover:text-white'}`}
        >
          <Volume2 className="w-3.5 h-3.5" /> Audio Settings
        </button>

        <button
          id="btn_set_tab_network"
          onClick={() => setActiveTab('network')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition duration-150 text-left cursor-pointer ${activeTab === 'network' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'hover:bg-slate-800 hover:text-white'}`}
        >
          <Wifi className="w-3.5 h-3.5 text-emerald-400" /> Network & Internet
        </button>

        <button
          id="btn_set_tab_battery"
          onClick={() => setActiveTab('battery')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition duration-150 text-left cursor-pointer ${activeTab === 'battery' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'hover:bg-slate-800 hover:text-white'}`}
        >
          <Battery className="w-3.5 h-3.5 text-amber-400" /> Power & Battery
        </button>

        <button
          id="btn_set_tab_security"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition duration-150 text-left cursor-pointer ${activeTab === 'security' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'hover:bg-slate-800 hover:text-white'}`}
        >
          <Lock className="w-3.5 h-3.5 text-red-400" /> Account & Security
        </button>

        <button
          id="btn_set_tab_ai"
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition duration-150 text-left cursor-pointer ${activeTab === 'ai' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'hover:bg-slate-800 hover:text-white'}`}
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" /> AI Desk Tuning
        </button>

        <button
          id="btn_set_tab_system"
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition duration-150 text-left cursor-pointer ${activeTab === 'system' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'hover:bg-slate-800 hover:text-white'}`}
        >
          <Cpu className="w-3.5 h-3.5" /> Hardware Emulation
        </button>

        <button
          id="btn_set_tab_updates"
          onClick={() => setActiveTab('updates')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition duration-150 text-left cursor-pointer ${activeTab === 'updates' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' : 'hover:bg-slate-800 hover:text-white'}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isUpdating ? 'animate-spin' : ''}`} /> OS Upgrades
        </button>

        <div className="mt-auto px-2 py-2 bg-slate-950 rounded-lg border border-slate-800/80 text-[10px] text-slate-500 font-mono text-center flex items-center justify-center gap-1 leading-relaxed">
          <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" /> Enterprise Sandbox
        </div>
      </div>

      {/* Main Settings Canvas */}
      <div id="settings_main_body" className="flex-1 p-5 overflow-y-auto space-y-6 scrollbar-none leading-normal">
        
        {/* TAB 1: PERSONALIZATION */}
        {activeTab === 'personalization' && (
          <div id="tab_content_personalization" className="space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <Palette className="w-4 h-4 text-blue-400" /> Personalise Surface
              </h2>
              <p className="text-2xs text-slate-400 mt-0.5">Customize systems style, desktop background preset, name and accent Highlights.</p>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] hover:text-slate-100 transition duration-150 font-bold uppercase tracking-widest text-slate-400 font-mono">User Name</label>
              <input
                id="input_username"
                type="text"
                value={username}
                onChange={(e) => updateSettings({ username: e.target.value })}
                className="w-full max-w-xs bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 transition"
                placeholder="Change Username"
              />
            </div>

            {/* Theme select option */}
            <div className="space-y-2">
              <h3 className="text-[9px] hover:text-slate-100 transition duration-150 font-bold uppercase tracking-widest text-slate-400 font-mono">Active Windows Style</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'dark', title: 'Atmospheric Dark', desc: 'Secure high contrast depth' },
                  { id: 'light', title: 'Refined Light', desc: 'Specular bright clean layout' },
                  { id: 'glass', title: 'Acrylic Glass', desc: 'Aero translucent backdrops' },
                ].map(thm => (
                  <button
                    id={`btn_theme_${thm.id}`}
                    key={thm.id}
                    onClick={() => {
                      setTheme(thm.id as OSTheme);
                      addNotification('Theme Altered', `Applied: ${thm.title}`, 'info');
                    }}
                    className={`text-left p-2.5 rounded-lg border transition cursor-pointer ${settings.theme === thm.id ? 'border-blue-500 bg-slate-800 shadow-md shadow-blue-500/10' : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'}`}
                  >
                    <div className="text-xs font-semibold text-slate-100">{thm.title}</div>
                    <div className="text-[9.5px] text-slate-400 mt-1 leading-snug">{thm.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Selector */}
            <div className="space-y-2">
              <h3 className="text-[9px] hover:text-slate-100 transition duration-150 font-bold uppercase tracking-widest text-slate-400 font-mono">System Accent Highlights</h3>
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map(acc => (
                  <button
                    id={`btn_accent_${acc.name.replace(/\s+/g, '_')}`}
                    key={acc.name}
                    onClick={() => {
                      setAccentColor(acc.color);
                      addNotification('Accent Altered', `Applied ${acc.name} highlight.`, 'info');
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-2xs cursor-pointer transition ${settings.accentColor === acc.color ? 'border-blue-500 bg-slate-800 shadow-sm' : 'border-slate-800/80 hover:border-slate-700 bg-slate-900/20'}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${acc.bg} border border-black/30`} />
                    <span className="text-slate-200 font-semibold">{acc.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Wallpapers Presets */}
            <div className="space-y-2">
              <h3 className="text-[9px] hover:text-slate-100 transition duration-150 font-bold uppercase tracking-widest text-slate-400 font-mono">Select Desktop Wallpaper</h3>
              <div className="grid grid-cols-4 gap-2.5">
                {WALLPAPERS.map(wall => (
                  <button
                    id={`btn_wallpaper_${wall.id}`}
                    key={wall.id}
                    onClick={() => triggerWallpaperReset(wall.url, wall.name)}
                    className={`relative h-16 rounded-lg overflow-hidden border cursor-pointer transition transform hover:scale-[1.02] hover:shadow-lg ${settings.wallpaper === wall.url ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-800 hover:border-slate-700'}`}
                  >
                    <img src={wall.url} alt={wall.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 hover:bg-black/30 transition flex items-end p-1.5">
                      <span className="text-[9px] text-white font-bold leading-none">{wall.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DISPLAY CONFIGURATION */}
        {activeTab === 'display' && (
          <div id="tab_content_display" className="space-y-5">
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-400" /> Display Configurations
              </h2>
              <p className="text-2xs text-slate-400 mt-0.5">Tweak backlight bounds, eye comfort mode, scale multipliers, other resolution metrics.</p>
            </div>

            {/* Brightness Controller */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" /> Desktop Brightness
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-snug">Adjust overall backlight filter level of the desktop viewport.</p>
                </div>
                <span className="text-xs font-mono text-blue-400 font-bold">{brightness}%</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Sun className="w-3 h-3 text-slate-500" />
                <input
                  id="slider_brightness"
                  type="range"
                  min="30"
                  max="100"
                  value={brightness}
                  onChange={(e) => updateSettings({ brightness: parseInt(e.target.value) })}
                  className="flex-1 accent-blue-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                />
                <Sun className="w-4 h-4 text-amber-400" />
              </div>
            </div>

            {/* Night Light eye preservation */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" /> Warm Night Light Filter
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-snug">Block blue frequencies by adding warm color blending, soothing eye strains.</p>
                </div>
                <button
                  id="toggle_nightlight"
                  onClick={() => updateSettings({ nightLight: !nightLight })}
                  className={`text-2xs font-extrabold uppercase px-2.5 py-1 rounded-md border transition duration-150 cursor-pointer ${
                    nightLight 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  {nightLight ? 'Active' : 'Disabled'}
                </button>
              </div>

              {nightLight && (
                <div className="space-y-2 border-t border-slate-800/50 pt-2.5">
                  <div className="flex justify-between text-[9.5px] font-mono">
                    <span className="text-slate-400">Warm Strength Level</span>
                    <span className="text-amber-400 font-bold">{nightLightStrength}%</span>
                  </div>
                  <input
                    id="slider_nightlight_strength"
                    type="range"
                    min="10"
                    max="90"
                    value={nightLightStrength}
                    onChange={(e) => updateSettings({ nightLightStrength: parseInt(e.target.value) })}
                    className="w-full accent-amber-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Screen Zoom/scale factor */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" /> Interface Scale / Zoom
                </h4>
                <p className="text-[10px] text-slate-400 leading-snug">Rerender visual canvas fonts, bounding containers and icons to active ratio.</p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[100, 105, 110, 115].map(val => (
                  <button
                    id={`btn_display_zoom_${val}`}
                    key={val}
                    onClick={() => {
                      updateSettings({ scale: val });
                      addNotification('Display Zoom Set', `Workspace scaled to ${val}% factor.`, 'success');
                    }}
                    className={`py-1.5 text-2xs font-bold border rounded-lg transition text-center cursor-pointer ${
                      scale === val 
                        ? 'border-blue-500 bg-blue-950/25 text-blue-300 font-extrabold' 
                        : 'border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    {val}% {val === 100 ? '(Native)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Refresh & Ratio Metrics */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-violet-400" /> Virtual Refresh Rate Config
              </h4>
              <p className="text-[10px] text-slate-400 leading-snug">Instruct UI ticking clock triggers to process animations smoothly.</p>
              
              <div className="flex gap-2.5">
                {[60, 120].map(rate => (
                  <button
                    id={`btn_refresh_rate_${rate}`}
                    key={rate}
                    onClick={() => {
                      updateSettings({ refreshRate: rate as any });
                      addNotification('Display Synced', `Visual clock synced to high accuracy ${rate}Hz.`, 'info');
                    }}
                    className={`flex-1 py-2 rounded-lg border text-2xs font-bold transition text-center cursor-pointer ${
                      refreshRate === rate 
                        ? 'bg-blue-600/10 text-blue-300 border-blue-500/40 font-extrabold' 
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    🚀 {rate} Hz Refresh Rate {rate === 120 ? '(Performance)' : '(Standard)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIO CONFIGURATIONS */}
        {activeTab === 'audio' && (
          <div id="tab_content_audio" className="space-y-5">
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-400" /> Audio Matrix Console
              </h2>
              <p className="text-2xs text-slate-400 mt-0.5">Control notification ringtones output drivers, master speaker volume parameters.</p>
            </div>

            {/* Master Volume Controller */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <Volume1 className="w-4 h-4 text-blue-400" /> Master Speaker volume
                </h4>
                <span className="text-xs font-mono font-bold text-blue-400">{volume}%</span>
              </div>

              <div className="flex items-center gap-2.5">
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <input
                  id="slider_master_volume"
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => updateSettings({ volume: parseInt(e.target.value) })}
                  className="flex-1 accent-blue-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                />
                <Volume2 className="w-4 h-4 text-blue-400" />
              </div>
            </div>

            {/* Chimes & Alert Toggles */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-100">App Notification Alert Chimes</h4>
                  <p className="text-[10px] text-slate-400 tracking-wide mt-0.5">Toggle alert synthesizer ringtones for operations.</p>
                </div>
                <button
                  id="toggle_aud_sound"
                  onClick={() => updateSettings({ systemSound: !systemSound })}
                  className={`flex items-center gap-1 text-2xs font-extrabold uppercase px-2.5 py-1 rounded-md border transition duration-150 cursor-pointer ${
                    systemSound 
                      ? 'bg-blue-600/25 text-blue-300 border-blue-500/40' 
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  {systemSound ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5" /> Activated
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5" /> Muted
                    </>
                  )}
                </button>
              </div>

              <div className="border-t border-slate-800/50 pt-3 flex justify-between gap-3 items-end">
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block mb-1">Ringtone profile chime</label>
                  <select id="select_sound_chyme" className="bg-slate-950 border border-slate-800 text-slate-200 text-2xs rounded-lg p-1.5 focus:outline-none w-full focus:border-blue-500">
                    <option>Ethereal Harmony Chime (Default)</option>
                    <option>8-Bit Retro Suite Synth</option>
                    <option>Lumina Symphony Chime</option>
                    <option>Absolute Silence / Whispers</option>
                  </select>
                </div>
                <button
                  id="btn_speaker_test"
                  onClick={playTestTone}
                  disabled={isPlayingTestTone}
                  className={`px-3 py-1.5 border border-slate-800 rounded-lg text-2xs text-slate-300 font-bold hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer ${isPlayingTestTone ? 'opacity-50' : ''}`}
                >
                  <Play className="w-3 h-3 text-emerald-400" /> {isPlayingTestTone ? 'Chiming...' : 'Test Sound'}
                </button>
              </div>
            </div>

            {/* Output audio map */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-100">Sound Device Output Mapping</h4>
              <p className="text-[10px] text-slate-400 leading-snug">Reroute software outputs to linked drivers seamlessly.</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="p-2.5 bg-slate-950/80 border border-blue-500/35 rounded-lg text-2xs cursor-pointer">
                  <div className="font-bold text-slate-200 flex items-center gap-1">🔊 Virtual Sandbox Controller</div>
                  <div className="text-slate-500 mt-0.5">Default integrated stereo</div>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-2xs opacity-50 hover:opacity-75 transition cursor-pointer">
                  <div className="font-bold text-slate-400">🎧 External HDMI Headphones</div>
                  <div className="text-slate-500 mt-0.5">No driver linked</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: NEW - NETWORK & INTERNET TAB WITH BANDWIDTH SPEED TEST */}
        {activeTab === 'network' && (
          <div id="tab_content_network" className="space-y-5">
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-400" /> Network & Internet Config
              </h2>
              <p className="text-2xs text-slate-400 mt-0.5">Manage wireless connectivity parameters, VPN gateways, and perform real speed tests.</p>
            </div>

            {/* Broadband Toggles and DNS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-3.5">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5 text-blue-400" /> Wireless Connection (Wi-Fi)
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-snug">Toggle virtual antenna receiver.</p>
                  </div>
                  <button
                    id="toggle_wifi"
                    onClick={() => updateSettings({ wifiOn: !wifiOn })}
                    className={`text-2xs font-extrabold uppercase px-2.5 py-1 rounded-md border transition cursor-pointer ${wifiOn ? 'bg-emerald-500/25 border-emerald-500/40 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                  >
                    {wifiOn ? 'Online' : 'Offline'}
                  </button>
                </div>
                <div className="text-[10.5px] text-slate-400">
                  {wifiOn ? (
                    <div>
                      <span className="text-emerald-400 font-bold">Connected to:</span> <span className="font-mono text-slate-200">SecureGuest_Fiber_5G</span>
                    </div>
                  ) : (
                    <span className="text-red-400">Not connected to any systems subnet.</span>
                  )}
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-3.5">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" /> Virtual VPN Sandbox
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-snug">Redirect internet gateway packets.</p>
                  </div>
                  <button
                    id="toggle_vpn"
                    onClick={() => {
                      if (!wifiOn) {
                        addNotification('VPN Error', 'Cannot initialize proxy tunnel while Wi-Fi is disabled.', 'error');
                        return;
                      }
                      updateSettings({ vpnActive: !vpnActive });
                      addNotification('VPN Modified', vpnActive ? 'Direct internet routing restored.' : 'Encrypted proxy tunnel established successfully.', 'success');
                    }}
                    className={`text-2xs font-extrabold uppercase px-2.5 py-1 rounded-md border transition cursor-pointer ${vpnActive ? 'bg-indigo-500/25 border-indigo-500/40 text-indigo-400 font-extrabold' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                  >
                    {vpnActive ? 'Tunneling' : 'Disabled'}
                  </button>
                </div>
                <div className="text-[10.5px] text-slate-400">
                  {vpnActive ? (
                    <div>
                      <span className="text-indigo-400 font-bold">Location:</span> <span className="font-mono text-slate-200">Zurich, Switzerland (SEC-IP)</span>
                    </div>
                  ) : (
                    <span>Direct unfiltered packets routing.</span>
                  )}
                </div>
              </div>
            </div>

            {/* DNS modification */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-3">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Primary DNS Server Gateway</label>
              <div className="flex gap-2">
                <input
                  id="input_dns_server"
                  type="text"
                  value={dnsServer}
                  onChange={(e) => updateSettings({ dnsServer: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                  placeholder="Primary DNS server"
                />
                <button
                  id="btn_reset_dns"
                  onClick={() => {
                    updateSettings({ dnsServer: '8.8.8.8' });
                    addNotification('DNS Customised', 'DNS server parameters restored to Google Public servers default.', 'info');
                  }}
                  className="border border-slate-800 hover:border-slate-700 bg-slate-900 px-3 py-1.5 text-2xs font-bold text-slate-300 rounded-lg cursor-pointer"
                >
                  Defaults
                </button>
              </div>
              <p className="text-[9.5px] text-slate-500 font-mono">Modifying standard address resolution parameters might require restarting the browser.</p>
            </div>

            {/* BROADBRAND LIVE SPEED TEST WIDGET */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" /> Broadband Bandwidth Integrity check
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-snug">Assess virtual latency ping, download rates, and network uploads.</p>
                </div>
                <button
                  id="btn_trigger_speedtest"
                  onClick={runSpeedTest}
                  disabled={isTestingSpeed}
                  className={`bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-2xs px-3 py-1.5 rounded-lg border border-emerald-500/30 transition cursor-pointer`}
                >
                  {isTestingSpeed ? 'Testing...' : 'Begin Diagnostics'}
                </button>
              </div>

              {/* Progress and indicators */}
              {isTestingSpeed && (
                <div className="space-y-2 pt-1 border-t border-slate-800/40">
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/60">
                    <div style={{ width: `${speedProgress}%` }} className="bg-emerald-500 h-full rounded-full transition-all duration-150" />
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 flex justify-between">
                    <span>Synthesizing high bandwidth network pockets...</span>
                    <span>{speedProgress}%</span>
                  </div>
                </div>
              )}

              {/* Speed Metrics Display */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 text-center">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">LATENCY (PING)</span>
                  <span className="text-sm font-extrabold font-mono text-emerald-400 mt-1 block">
                    {isTestingSpeed ? '---' : pingSpeed ? `${pingSpeed} ms` : '12 ms'}
                  </span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 text-center">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">DOWNLOAD SPEED</span>
                  <span className="text-sm font-extrabold font-mono text-blue-400 mt-1 block animate-pulse">
                    {isTestingSpeed ? `${Math.floor(200 + Math.random() * 400)} Mbps` : downloadSpeed ? `${downloadSpeed} Mbps` : '425 Mbps'}
                  </span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 text-center">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">UPLOAD SPEED</span>
                  <span className="text-sm font-extrabold font-mono text-violet-400 mt-1 block">
                    {isTestingSpeed ? '---' : uploadSpeed ? `${uploadSpeed} Mbps` : '94 Mbps'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: NEW - POWER-SAVING & BATTERY SECTION */}
        {activeTab === 'battery' && (
          <div id="tab_content_battery" className="space-y-5">
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <Battery className="w-4 h-4 text-amber-500" /> Power-Saving & Battery
              </h2>
              <p className="text-2xs text-slate-400 mt-0.5">Diagnose battery longevity multipliers, plan custom sleep intervals, or trigger savings option.</p>
            </div>

            {/* Battery Emulate Status */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4.5 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-slate-400 text-2xs font-extrabold uppercase tracking-wide font-mono">Simulated Battery charge state</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight">84%</span>
                  <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                    <BatteryCharging className="w-3.5 h-3.5" /> Charging (24m until full)
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Total design capacity check: 4720 mAh lithium cells. Voltage safety limits are balanced.</p>
              </div>
              <div className="w-24 h-12 border-2 border-slate-800 rounded-xl p-1 relative flex items-center bg-slate-950/60">
                <div className="w-5/6 h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-md shadow-emerald-500/10">84%</div>
                <div className="w-1.5 h-4 bg-slate-700 right-[-6px] absolute rounded-r" />
              </div>
            </div>

            {/* Power plans config */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-3.5">
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <Power className="w-3.5 h-3.5 text-blue-400" /> Performance Power plan
                </h4>
                <p className="text-[10px] text-slate-400 leading-snug">Choose an orchestration schedule mapping processor multipliers against power save parameters.</p>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'saver', title: '🍃 Power Saving', text: 'Dim levels safely' },
                  { id: 'balanced', title: '⚖️ Symmetric balanced', text: 'Default auto schedule' },
                  { id: 'performance', title: '🔥 High Performance', text: 'Discharge limits lifted' },
                ].map(plan => (
                  <button
                    id={`btn_power_plan_${plan.id}`}
                    key={plan.id}
                    onClick={() => {
                      updateSettings({ powerPlan: plan.id as any });
                      if (plan.id === 'saver') {
                        updateSettings({ brightness: 50, nightLight: true });
                        addNotification('Power Saver Mode', 'Screen brightness scaled down to conserves energy.', 'warning');
                      } else {
                        addNotification('Power Plan Altered', `Workspace scheduled mode shifted: ${plan.title}`, 'success');
                      }
                    }}
                    className={`p-2.5 border rounded-lg transition text-left cursor-pointer ${
                      powerPlan === plan.id 
                        ? 'border-amber-500 bg-amber-950/10 text-amber-300' 
                        : 'border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="text-2xs font-extrabold leading-none">{plan.title}</div>
                    <div className="text-[8.5px] mt-1 leading-snug">{plan.text}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep Interval configuration */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-3">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block mb-1">Turn off display after inactivity</label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 15, 30, 0].map(mins => (
                  <button
                    id={`btn_sleep_timer_${mins}`}
                    key={mins}
                    onClick={() => {
                      updateSettings({ sleepTimer: mins });
                      addNotification('Sleep Timer Altered', mins === 0 ? 'Display configured to stay active permanently.' : `Display set to standby after ${mins} minutes.`, 'info');
                    }}
                    className={`py-1.8 text-2xs font-bold border rounded-lg transition text-center cursor-pointer ${
                      sleepTimer === mins 
                        ? 'border-blue-500 bg-blue-950/25 text-blue-300 font-extrabold' 
                        : 'border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    {mins === 0 ? 'Never' : `${mins} Mins`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: NEW - ACCOUNT & SYSTEM SECURITY */}
        {activeTab === 'security' && (
          <div id="tab_content_security" className="space-y-5">
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400" /> Account & System Security
              </h2>
              <p className="text-2xs text-slate-400 mt-0.5">Toggle interface passwords lock configuration, safety firewalls, and startup software limits.</p>
            </div>

            {/* Lock Passwords configurator */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-3.5">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    {lockEnabled ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-slate-500" />} Local Lock Password protection
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-snug">Restrict entry access of guest desktop viewholders during startup cycles.</p>
                </div>
                <button
                  id="toggle_lock_enabled"
                  onClick={() => {
                    if (lockEnabled) {
                      updateSettings({ lockEnabled: false, lockPassword: '' });
                      addNotification('Password Guard Muted', 'Interface entry checks deactivated.', 'info');
                    } else {
                      if (!lockPassword.trim()) {
                        addNotification('Password Empty', 'Please provide a password log first to active.', 'error');
                        return;
                      }
                      updateSettings({ lockEnabled: true });
                      addNotification('Local Lock Active', 'Account lock password registered.', 'success');
                    }
                  }}
                  className={`text-2xs font-extrabold uppercase px-2.5 py-1 rounded-md border transition cursor-pointer ${lockEnabled ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                >
                  {lockEnabled ? 'Deactivate' : 'Activate password'}
                </button>
              </div>

              {!lockEnabled && (
                <div className="space-y-2 border-t border-slate-800/50 pt-2.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Setup lock password</label>
                  <input
                    id="input_lock_password"
                    type="password"
                    value={lockPassword}
                    onChange={(e) => updateSettings({ lockPassword: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="Enter custom lock string"
                  />
                </div>
              )}
            </div>

            {/* Firewalls configuration shield */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Lumina Security Firewall
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-snug">Filter incoming API networks and block unsanctioned code execution traces.</p>
                </div>
                <button
                  id="toggle_firewall"
                  onClick={() => {
                    updateSettings({ firewallActive: !firewallActive });
                    addNotification('Security Guard', firewallActive ? 'Local sandbox security rules are deactivated.' : 'Enterprise sandbox firewall protection activated.', firewallActive ? 'warning' : 'success');
                  }}
                  className={`text-2xs font-extrabold uppercase px-2.5 py-1 rounded-md border transition cursor-pointer ${firewallActive ? 'bg-emerald-500/25 border-emerald-500/40 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                >
                  {firewallActive ? 'Shield Guarded' : 'Vulnerable'}
                </button>
              </div>
            </div>

            {/* Simulated app startup catalog */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-100">Simulated Autostart Apps checklist</h4>
              <p className="text-[10px] text-slate-400 leading-snug">Check programs configured to load automatically as workspace boots up.</p>
              
              <div className="space-y-2 mt-2">
                {[
                  { name: 'Lumina Copilot AI system', load: 'Instant start', status: 'Optimal' },
                  { name: 'System audio synthesizer suite', load: 'Background sound', status: 'Optimal' },
                  { name: 'Web proxy network driver', load: 'Network socket', status: 'Optimal' },
                ].map((as_app, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-950/80 border border-slate-800/80 rounded-lg text-2xs">
                    <div>
                      <span className="font-semibold text-slate-200">{as_app.name}</span>
                      <span className="text-[8.5px] text-slate-500 block">{as_app.load}</span>
                    </div>
                    <span className="text-emerald-400 font-bold bg-emerald-550/10 px-1.5 py-0.5 rounded text-[8px] tracking-wide uppercase">{as_app.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: AI TUNING INTERIOR */}
        {activeTab === 'ai' && (
          <div id="tab_content_ai" className="space-y-5">
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" /> AI Desk Tuning & Personality
              </h2>
              <p className="text-2xs text-slate-400 mt-0.5">Calibrate parameters, temperature values, chat memory wipes of Gemini Copilot.</p>
            </div>

            {/* AI Personality Selector */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-3.5">
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-sky-400" /> AI Persona Profile
                </h4>
                <p className="text-[10px] text-slate-400 leading-snug">Modifies the language style used by Gemini Copilot in responsive system answers.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'balanced', label: '✦ Balanced Sparkles', desc: 'Auto helpful, normal mode' },
                  { id: 'professional', label: '💼 Professional Core', desc: 'Dry, precise corporate responses' },
                  { id: 'creative', label: '🎨 Creative Composer', desc: 'Artistic, open and musical styles' },
                  { id: 'minimalist', label: '⚡ Minimalist Assistant', desc: 'Extremely concise text lines' },
                ].map(item => (
                  <button
                    id={`btn_ai_persona_${item.id}`}
                    key={item.id}
                    onClick={() => {
                      updateSettings({ aiPersona: item.id as any });
                      addNotification('AI Persona Altered', `Twin parameter set: ${item.label}`, 'success');
                    }}
                    className={`text-left p-2.5 rounded-lg border transition cursor-pointer ${
                      aiPersona === item.id 
                        ? 'border-sky-500 bg-slate-800 shadow-md shadow-sky-500/10' 
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-100">{item.label}</div>
                    <div className="text-[9.5px] text-slate-400 mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Voice speed */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-3.5">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Copilot Audio Reading speed</h4>
                  <p className="text-[10px] text-slate-400 leading-snug">Speeds up or slow down speech reading frequencies.</p>
                </div>
                <span className="text-xs font-mono text-sky-400 font-bold">{aiVoiceSpeed}x</span>
              </div>

              <div className="flex justify-between gap-1.5">
                {[0.75, 1.0, 1.25, 1.5, 1.75].map(speed => (
                  <button
                    id={`btn_ai_speed_${speed}`}
                    key={speed}
                    onClick={() => updateSettings({ aiVoiceSpeed: speed })}
                    className={`flex-1 py-1.5 text-2xs font-bold border rounded-lg transition text-center cursor-pointer ${
                      aiVoiceSpeed === speed 
                        ? 'border-sky-500 bg-sky-950/20 text-sky-300' 
                        : 'border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    {speed}x {speed === 1.0 ? '(Normal)' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: SYSTEM SPECIFICATIONS & STORAGE DRIVE HEALTH */}
        {activeTab === 'system' && (
          <div id="tab_content_system" className="space-y-5">
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" /> Virtual Hardware System Stats
              </h2>
              <p className="text-2xs text-slate-400 mt-0.5">Diagnose simulated computing cores, WebAssembly limits, local visual system logs.</p>
            </div>

            {/* Specs Grid */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-2.5">
              <h4 className="font-bold text-xs text-slate-200">Processor Emulation Specifications</h4>
              <div className="grid grid-cols-2 gap-2.5 font-mono text-[10px]">
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block text-[8px] uppercase">CORES ALLOCATED</span>
                  <span className="text-blue-400 font-bold">12 Virtual Threads</span>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block text-[8px] uppercase">DYNAMIC BUS SPEED</span>
                  <span className="text-emerald-400 font-bold">5.82 GHz Boosted</span>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block text-[8px] uppercase">ACTIVE PROCESSES</span>
                  <span className="text-amber-400 font-bold">17 Instances Online</span>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block text-[8px] uppercase">VIRTUAL ARCHITECTURE</span>
                  <span className="text-purple-400 font-bold">V8 C++ WebAssembly x64</span>
                </div>
              </div>
            </div>

            {/* Drive status */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <FolderSync className="w-3.5 h-3.5 text-blue-405" /> Virtual Drive Partition (Drive C:\)
              </h3>
              
              <div className="grid grid-cols-3 gap-3 text-2xs font-semibold">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  <div className="text-slate-500 text-[8px] font-bold font-mono">TOTAL FILES</div>
                  <div className="text-slate-200 text-sm font-mono mt-0.5">{fileCount} items</div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  <div className="text-slate-500 text-[8px] font-bold font-mono">DIRECTORIES</div>
                  <div className="text-slate-200 text-sm font-mono mt-0.5">{folderCount} folders</div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  <div className="text-slate-500 text-[8px] font-bold font-mono">USED QUOTA</div>
                  <div className="text-slate-200 text-sm font-mono mt-0.5">{totalDiskSize} B</div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/65">
                  <div style={{ width: `${percentUsed}%` }} className="bg-blue-600 h-full rounded-full transition-all duration-500" />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-400 leading-none">
                  <span>{percentUsed}% Occupied Space ({totalDiskSize} of 100,000 bytes virtual limit)</span>
                  <button 
                    id="btn_recalc_disk"
                    onClick={() => {
                      addNotification('Quota Scanned', 'Fragmentation metrics are at perfectly optimal 0.00%. Drive sectors check passed.', 'success');
                    }}
                    className="hover:text-blue-400 tracking-wide flex items-center gap-1 transition leading-none uppercase text-[8px] font-bold cursor-pointer"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Recalibrate drive C:
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: NEW - WINDOWS UPDATE EMULATION PAGE */}
        {activeTab === 'updates' && (
          <div id="tab_content_updates" className="space-y-5">
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-405" /> Lumina Update & Security Center
              </h2>
              <p className="text-2xs text-slate-400 mt-0.5">Control core operating security updates framework versions and visual dependencies.</p>
            </div>

            {/* Current status card */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  {windowsUpdated ? (
                    <div className="text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Enterprise Desktop is Up to Date
                    </div>
                  ) : (
                    <div className="text-amber-400 text-xs font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 animate-bounce" /> 1 Security System patch available
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {windowsUpdated 
                      ? 'Last checked: Today, 1:20 PM. Active security patches: LuminaOS v2.4.9 (Live with full scale adjustments).' 
                      : 'Recommended Update: LuminaOS v2.4.9 Core Patch. Fixes Display Scaling parameters, audio test modules and network speed-test widgets.'}
                  </p>
                </div>

                {!windowsUpdated && !isUpdating && (
                  <button
                    id="btn_download_updates"
                    onClick={triggerSystemUpdate}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-2xs px-3.5 py-1.8 rounded-lg cursor-pointer shadow-md shadow-blue-600/10 transition"
                  >
                    Download & Install
                  </button>
                )}
              </div>

              {/* Progress Bar of actual updating */}
              {isUpdating && (
                <div className="space-y-2 border-t border-slate-800/50 pt-3.5">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-blue-400 font-bold">{updateStepName}</span>
                    <span className="text-blue-400 font-bold">{updateProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-805/45">
                    <div style={{ width: `${updateProgress}%` }} className="bg-blue-500 h-full rounded-full transition-all duration-100" />
                  </div>
                  <div className="text-[9.5px] text-slate-500 font-mono italic">Please do not power off or close workspace settings window.</div>
                </div>
              )}
            </div>

            {/* Updates list */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl space-y-2.5">
              <h4 className="text-xs font-bold text-slate-100">Update system history log</h4>
              <div className="space-y-2 font-mono text-[9px]">
                <div className="flex justify-between items-center p-2.5 bg-slate-950/70 border border-slate-840/50 rounded-lg">
                  <span className="text-slate-300">✓ LuminaOS Security Patch v2.4.0 (Base package)</span>
                  <span className="text-emerald-400 font-bold">INSTALLED</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-950/70 border border-slate-840/50 rounded-lg">
                  <span className="text-slate-300">✓ Systems AI Copilot Gemini API connection parameters v1.1.2</span>
                  <span className="text-emerald-400 font-bold">INSTALLED</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
