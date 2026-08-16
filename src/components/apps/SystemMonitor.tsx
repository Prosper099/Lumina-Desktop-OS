import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { 
  Activity, 
  Cpu, 
  Trash2, 
  LineChart, 
  ShieldAlert, 
  Clock, 
  Percent, 
  RefreshCw,
  HardDrive
} from 'lucide-react';

export const SystemMonitor: React.FC = () => {
  const { windows, closeWindow, addNotification, settings } = useOS();
  const [activeTab, setActiveTab] = useState<'resources' | 'processes' | 'diagnostics'>('resources');
  
  // CPU Usage simulation
  const [cpuUsage, setCpuUsage] = useState<number>(14);
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(30).fill(12));
  
  // Custom RAM tracker calculating base + 150MB per window
  const totalRAM = 16.0; // GB
  const [ramUsed, setRamUsed] = useState<number>(3.25);
  const [ramHistory, setRamHistory] = useState<number[]>(Array(30).fill(3.2));
  
  // Network packages charts
  const [netSpeed, setNetSpeed] = useState<{ rx: number; tx: number }>({ rx: 12.4, tx: 3.8 });
  const [netHistory, setNetHistory] = useState<{ rx: number; tx: number }[]>(
    Array(30).fill({ rx: 8, tx: 2 })
  );

  // Uptime tracking
  const [systemUptime, setSystemUptime] = useState<number>(120); // seconds since launch
  
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemUptime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fluctuations of resources
  useEffect(() => {
    const resourceTimer = setInterval(() => {
      // Base usage based on count of open windows
      const windowCount = windows.length;
      const baseCpu = 4 + windowCount * 3.5;
      const targetCpu = Math.max(2, Math.min(99, baseCpu + (Math.random() * 12 - 6)));
      setCpuUsage(Math.round(targetCpu));
      
      setCpuHistory(prev => {
        const updated = [...prev.slice(1), Math.round(targetCpu)];
        return updated;
      });

      // RAM usage = 2.8 GB base + 0.35 GB per window
      const targetRam = Math.min(15.9, 2.8 + (windowCount * 0.35) + (Math.random() * 0.08 - 0.04));
      setRamUsed(parseFloat(targetRam.toFixed(2)));
      setRamHistory(prev => {
        const updated = [...prev.slice(1), targetRam];
        return updated;
      });

      // Network fluctuation
      const targetRx = parseFloat((Math.random() * 25 + 2).toFixed(1));
      const targetTx = parseFloat((Math.random() * 10 + 0.5).toFixed(1));
      setNetSpeed({ rx: targetRx, tx: targetTx });
      setNetHistory(prev => {
        const updated = [...prev.slice(1), { rx: targetRx, tx: targetTx }];
        return updated;
      });
    }, 1000);

    return () => clearInterval(resourceTimer);
  }, [windows.length]);

  return (
    <div className="h-full flex flex-col bg-[#0b0a0f] text-slate-300 select-none overflow-hidden font-sans">
      {/* Top Banner Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/40 border-b border-white/5 text-[10px] font-mono select-none">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span className="text-slate-400">Processor multi-cluster offline telemetry</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-400">STATUS: NOMINAL</span>
          <span className="text-slate-500">•</span>
          <span className="text-indigo-400">UPTIME: {Math.floor(systemUptime / 60)}m {systemUptime % 60}s</span>
        </div>
      </div>

      {/* Internal Navigation Tabs inside windows */}
      <div className="flex bg-[#0d0c12]/80 border-b border-white/5 px-2">
        {(['resources', 'processes', 'diagnostics'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-[10.5px] font-medium transition relative cursor-pointer outline-none ${
              activeTab === tab 
                ? 'text-white font-semibold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <span className="capitalize">{tab}</span>
            {activeTab === tab && (
              <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-indigo-500 to-[#02bbf9]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'resources' && (
          <div className="space-y-4">
            {/* Split row: CPU & RAM metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CPU Box */}
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#02bbf9]" />
                    <span className="text-xs font-semibold text-slate-200">Central Processor Core</span>
                  </div>
                  <span className="text-xs font-mono font-medium text-[#02bbf9]">{cpuUsage}%</span>
                </div>

                {/* Simulated Graph Canvas */}
                <div className="h-20 bg-[#070609] rounded-lg border border-white/5 relative overflow-hidden flex items-end">
                  <div className="absolute top-1 left-2 text-[8px] font-mono text-slate-600">CPU LOAD PROGRESS HISTORY</div>
                  {/* Grid lines */}
                  <div className="absolute inset-0 grid grid-rows-3 grid-cols-4 pointer-events-none">
                    <div className="border-b border-white/5 w-full h-full" />
                    <div className="border-b border-white/5 border-r w-full h-full" />
                    <div className="border-b border-white/5 w-full h-full" />
                  </div>
                  {/* SVGA line graph path */}
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#02bbf9" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#02bbf9" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d={`M ${cpuHistory.map((val, idx) => `${(idx / (cpuHistory.length - 1)) * 100} ${100 - val}`).join(' L ')} L 100 100 L 0 100 Z`}
                      fill="url(#cpuGrad)"
                    />
                    <path
                      d={cpuHistory.map((val, idx) => `${(idx / (cpuHistory.length - 1)) * 100} ${100 - val}`).join(' L ')}
                      fill="none"
                      stroke="#02bbf9"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>

                <div className="grid grid-cols-3 text-[9px] font-mono text-slate-500">
                  <div>BASE SPEED: 3.8 GHz</div>
                  <div className="text-center">CORES: 8 Virtual</div>
                  <div className="text-right">VOLTAGE: 1.12V</div>
                </div>
              </div>

              {/* RAM Box */}
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-pink-400" />
                    <span className="text-xs font-semibold text-slate-200">System Physical Memory</span>
                  </div>
                  <span className="text-xs font-mono font-medium text-pink-400">
                    {ramUsed.toFixed(2)} / {totalRAM} GB ({Math.round((ramUsed / totalRAM) * 100)}%)
                  </span>
                </div>

                {/* Simulated Graph Canvas for RAM */}
                <div className="h-20 bg-[#070609] rounded-lg border border-white/5 relative overflow-hidden flex items-end">
                  <div className="absolute top-1 left-2 text-[8px] font-mono text-slate-600">RAM HISTOGRAM</div>
                  {/* Grid lines */}
                  <div className="absolute inset-0 grid grid-rows-3 grid-cols-4 pointer-events-none">
                    <div className="border-b border-white/5 w-full h-full" />
                    <div className="border-b border-white/5 border-r w-full h-full" />
                    <div className="border-b border-white/5 w-full h-full" />
                  </div>
                  {/* SLICK line graph path */}
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f472b6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#f472b6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d={`M ${ramHistory.map((val, idx) => `${(idx / (ramHistory.length - 1)) * 100} ${100 - (val / totalRAM) * 100}`).join(' L ')} L 100 100 L 0 100 Z`}
                      fill="url(#ramGrad)"
                    />
                    <path
                      d={ramHistory.map((val, idx) => `${(idx / (ramHistory.length - 1)) * 100} ${100 - (val / totalRAM) * 100}`).join(' L ')}
                      fill="none"
                      stroke="#f472b6"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>

                <div className="grid grid-cols-3 text-[9px] font-mono text-slate-500">
                  <div>SPEED: 4800 MHz</div>
                  <div className="text-center">SLOTS: SO-DIMM</div>
                  <div className="text-right">SWAP: 4.0 GB Enabled</div>
                </div>
              </div>
            </div>

            {/* Network Throughput Chart */}
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200">Network Throughput (Internet Socket Link)</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="text-emerald-400">▼ RX: {netSpeed.rx} Mbps</span>
                  <span className="text-indigo-400">▲ TX: {netSpeed.tx} Mbps</span>
                </div>
              </div>

              {/* Dynamic SVGA line graph path for Network */}
              <div className="h-24 bg-[#070609] rounded-lg border border-white/5 relative overflow-hidden flex items-end">
                <div className="absolute top-1 left-2 text-[8px] font-mono text-slate-600">SPECTRUM TELEMETRY PIPE</div>
                
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="netRxGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="netTxGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* RX line path (Green filled) */}
                  <path
                    d={`M ${netHistory.map((val, idx) => `${(idx / (netHistory.length - 1)) * 100} ${100 - (val.rx / 35) * 100}`).join(' L ')} L 100 100 L 0 100 Z`}
                    fill="url(#netRxGrad)"
                  />
                  <path
                    d={netHistory.map((val, idx) => `${(idx / (netHistory.length - 1)) * 100} ${100 - (val.rx / 35) * 100}`).join(' L ')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.2"
                  />
                  
                  {/* TX line path (Indigo) */}
                  <path
                    d={`M ${netHistory.map((val, idx) => `${(idx / (netHistory.length - 1)) * 100} ${100 - (val.tx / 15) * 100}`).join(' L ')} L 100 100 L 0 100 Z`}
                    fill="url(#netTxGrad)"
                  />
                  <path
                    d={netHistory.map((val, idx) => `${(idx / (netHistory.length - 1)) * 100} ${100 - (val.tx / 15) * 100}`).join(' L ')}
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="1.2"
                    strokeDasharray="1 1"
                  />
                </svg>
              </div>

              <div className="text-[9px] font-mono text-slate-500 text-center uppercase tracking-wider">
                Active SSL Sockets: Chrome Sandbox TLSv1.3 Connection Tunnel Layer
              </div>
            </div>
          </div>
        )}

        {/* Tab - ACTIVE PROCESSES (COMPLETELY INTERACTIVE AND FUNCTIONAL) */}
        {activeTab === 'processes' && (
          <div className="space-y-3.5">
            <div className="text-[10px] text-slate-400 font-medium">
              Below are active executing threads. Ending a task will immediately close the corresponding workspace window frame.
            </div>

            <div className="rounded-xl border border-white/5 bg-slate-950/40 overflow-hidden">
              <div className="grid grid-cols-12 gap-2 bg-[#0e0d14] px-4 py-2 border-b border-white/5 text-[9.5px] font-semibold text-slate-400 font-mono">
                <div className="col-span-5">PROCESS NAME</div>
                <div className="col-span-2 text-right">CPU %</div>
                <div className="col-span-3 text-right">MEM SHARED</div>
                <div className="col-span-2 text-center">ACTION</div>
              </div>

              <div className="divide-y divide-white/5 text-xs">
                {/* Kernel thread - locked */}
                <div className="grid grid-cols-12 gap-2 items-center px-4 py-2.5 bg-slate-900/10 text-slate-300 font-sans">
                  <div className="col-span-5 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="font-medium">Lumina Kernel Core (Init)</span>
                  </div>
                  <div className="col-span-2 text-right text-[10px] font-mono text-slate-400">{Math.floor(cpuUsage * 0.1)}%</div>
                  <div className="col-span-3 text-right text-[10px] font-mono text-slate-400">128.5 MB</div>
                  <div className="col-span-2 text-center text-[10px] font-mono text-slate-500 italic">Protected</div>
                </div>

                {/* Direct loop through genuine active OS windows! */}
                {windows.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-500">
                    No active application windows are executing right now.
                  </div>
                ) : (
                  windows.map((win) => {
                    // Seed deterministic-looking memory values based on App ID
                    const memoryTable: { [key: string]: string } = {
                      'browser': '144.2 MB',
                      'notepad': '18.4 MB',
                      'paint': '82.0 MB',
                      'settings': '34.5 MB',
                      'calc': '12.1 MB',
                      'music': '98.6 MB',
                      'voice': '112.9 MB',
                      'terminal': '22.4 MB',
                      'copilot': '124.0 MB'
                    };
                    const mem = memoryTable[win.appId] || '24.0 MB';
                    
                    // Simple dynamic CPU thread metric
                    const appCpu = Math.max(1, Math.min(65, (win.zIndex * 1.5) + (win.isMinimized ? 0 : 3)));
                    
                    return (
                      <div 
                        key={win.id} 
                        className="grid grid-cols-12 gap-2 items-center px-4 py-2 hover:bg-white/5 transition text-slate-300"
                      >
                        <div className="col-span-5 flex items-center gap-2 truncate">
                          <div className={`w-1.5 h-1.5 rounded-full ${win.isMinimized ? 'bg-slate-600' : 'bg-green-400'}`} />
                          <span className="font-semibold truncate text-[11px]">{win.title} ({win.appId})</span>
                        </div>
                        <div className="col-span-2 text-right text-[10.5px] font-mono">{appCpu}%</div>
                        <div className="col-span-3 text-right text-[10.5px] font-mono text-slate-400">{mem}</div>
                        <div className="col-span-2 text-center">
                          <button
                            onClick={() => {
                              closeWindow(win.id);
                              addNotification(
                                'Process Terminated',
                                `Safely disconnected ${win.title} thread interface.`,
                                'warning'
                              );
                            }}
                            className="px-2 py-1 text-[9px] bg-red-600/10 hover:bg-red-600/35 border border-red-500/20 text-red-400 rounded transition cursor-pointer"
                          >
                            Kill Process
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab - TELEMETRY & DIAGNOSTICS */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-950/40 border border-white/5 rounded-xl space-y-3 font-mono text-[10.5px]">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold font-sans mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>Operating Security & Connection Integrity</span>
              </div>
              
              <div className="space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>SSL HANDSHAKE CIPHER:</span>
                  <span className="text-white">AES_256_GCM_SHA384 (X25519)</span>
                </div>
                <div className="flex justify-between">
                  <span>ACTIVE STORAGE SANDBOX:</span>
                  <span className="text-white">IndexedDB (FS-Cache LocalStorage API)</span>
                </div>
                <div className="flex justify-between">
                  <span>PLATFORM RUNTIME AGENT:</span>
                  <span className="text-pink-400">Gemini-3.5-flash Intelligent Endpoint</span>
                </div>
                <div className="flex justify-between">
                  <span>WEBAUDIO CHANNELS:</span>
                  <span className="text-white">2.0 Full-Stereo DAC Synthetic [PCM]</span>
                </div>
                <div className="flex justify-between">
                  <span>THEME ENVIRONMENT PERSISTENCE:</span>
                  <span className="text-white uppercase">{settings.theme} Layout Style</span>
                </div>
              </div>
            </div>

            {/* Quick action diagnostics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-indigo-950/25 border border-indigo-500/15 rounded-xl text-center space-y-1">
                <div className="text-xs font-semibold text-slate-100">Storage Integrity</div>
                <div className="text-[10px] font-mono text-indigo-400">OK (No Fault blocks)</div>
              </div>
              <div className="p-3 bg-emerald-950/25 border border-emerald-500/15 rounded-xl text-center space-y-1">
                <div className="text-xs font-semibold text-slate-100">Memory Allocation</div>
                <div className="text-[10px] font-mono text-emerald-400">Optimized</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
