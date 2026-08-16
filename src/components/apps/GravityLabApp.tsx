import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';

interface StellarBody {
  id: string;
  name: string;
  type: 'asteroid' | 'planet' | 'gasgiant' | 'star' | 'blackhole';
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: string;
  trail: { x: number; y: number }[];
  isStatic?: boolean;
}

const BODY_PRESETS: Record<
  'asteroid' | 'planet' | 'gasgiant' | 'star' | 'blackhole',
  { name: string; mass: number; radius: number; color: string; isStatic?: boolean }
> = {
  asteroid: { name: 'Asteroid', mass: 2, radius: 4, color: '#94a3b8' },
  planet: { name: 'Terra Planet', mass: 15, radius: 8, color: '#3b82f6' },
  gasgiant: { name: 'Gigant Jupiter', mass: 75, radius: 14, color: '#f97316' },
  star: { name: 'Helios Star', mass: 800, radius: 24, color: '#eab308', isStatic: true },
  blackhole: { name: 'Singularity Black Hole', mass: 4000, radius: 18, color: '#a855f7', isStatic: true },
};

export const GravityLabApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Physics states
  const [bodies, setBodies] = useState<StellarBody[]>([]);
  const [selectedSpawn, setSelectedSpawn] = useState<keyof typeof BODY_PRESETS>('planet');
  const [gravityG, setGravityG] = useState<number>(0.6);
  const [timeMultiplier, setTimeMultiplier] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [collisions, setCollisions] = useState<number>(0);
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [gridVisible, setGridVisible] = useState<boolean>(true);

  // Orbit analyzer AI state
  const [aiReport, setAiReport] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Mouse interaction states for click-and-drag planet launch
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

  // Play sound synth
  const playCollisionSound = (type: string) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'blackhole') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      // Ignored browser autoplay blocks
    }
  };

  // Preset systems loading
  const loadPreset = (presetName: 'solar' | 'threebody' | 'devourer' | 'binary') => {
    setCollisions(0);
    setAiReport('');

    if (!canvasRef.current) return;
    const w = canvasRef.current.width || 800;
    const h = canvasRef.current.height || 450;
    const cx = w / 2;
    const cy = h / 2;

    switch (presetName) {
      case 'solar':
        setBodies([
          {
            id: 'star-1',
            name: 'Sun',
            type: 'star',
            x: cx,
            y: cy,
            vx: 0,
            vy: 0,
            mass: 800,
            radius: 24,
            color: '#fbbf24',
            trail: [],
            isStatic: true,
          },
          {
            id: 'planet-1',
            name: 'Aquarius',
            type: 'planet',
            x: cx,
            y: cy - 110,
            vx: 2.1, // circular orbit velocity: sqrt(G*M/r)
            vy: 0,
            mass: 15,
            radius: 8,
            color: '#60a5fa',
            trail: [],
          },
          {
            id: 'planet-2',
            name: 'Ares',
            type: 'planet',
            x: cx,
            y: cy + 170,
            vx: -1.7,
            vy: 0,
            mass: 25,
            radius: 10,
            color: '#f87171',
            trail: [],
          },
          {
            id: 'asteroid-1',
            name: 'Pallas Rogue',
            type: 'asteroid',
            x: cx - 220,
            y: cy,
            vx: 0,
            vy: 1.4,
            mass: 2,
            radius: 4,
            color: '#a1a1aa',
            trail: [],
          }
        ]);
        break;

      case 'threebody':
        // Chaotic stable-ish 3 Equal Stars
        setBodies([
          {
            id: 'star-a',
            name: 'Alpha Centauri A',
            type: 'star',
            x: cx - 120,
            y: cy - 40,
            vx: 0.4,
            vy: 1.2,
            mass: 500,
            radius: 18,
            color: '#f87171',
            trail: [],
          },
          {
            id: 'star-b',
            name: 'Alpha Centauri B',
            type: 'star',
            x: cx + 120,
            y: cy - 40,
            vx: -0.4,
            vy: -1.2,
            mass: 500,
            radius: 18,
            color: '#60a5fa',
            trail: [],
          },
          {
            id: 'star-c',
            name: 'Proxima',
            type: 'star',
            x: cx,
            y: cy + 100,
            vx: 0.8,
            vy: -0.2,
            mass: 500,
            radius: 18,
            color: '#fbbf24',
            trail: [],
          }
        ]);
        break;

      case 'devourer':
        setBodies([
          {
            id: 'bh-1',
            name: 'Gargantua Singularity',
            type: 'blackhole',
            x: cx,
            y: cy,
            vx: 0,
            vy: 0,
            mass: 5000,
            radius: 15,
            color: '#c084fc',
            trail: [],
            isStatic: true,
          },
          {
            id: 'ast-1',
            name: 'Debris belt alpha',
            type: 'asteroid',
            x: cx - 90,
            y: cy - 90,
            vx: 4.2,
            vy: -4.2,
            mass: 2,
            radius: 3,
            color: '#cbd5e1',
            trail: [],
          },
          {
            id: 'ast-2',
            name: 'Debris belt beta',
            type: 'asteroid',
            x: cx + 130,
            y: cy,
            vx: 0,
            vy: -4.8,
            mass: 2,
            radius: 3,
            color: '#94a3b8',
            trail: [],
          },
          {
            id: 'giant-1',
            name: 'Gas Goliath',
            type: 'gasgiant',
            x: cx,
            y: cy + 190,
            vx: -3.8,
            vy: 0,
            mass: 100,
            radius: 13,
            color: '#f97316',
            trail: [],
          }
        ]);
        break;

      case 'binary':
        setBodies([
          {
            id: 'star-alpha',
            name: 'Sol Prime',
            type: 'star',
            x: cx - 70,
            y: cy,
            vx: 0,
            vy: 1.1,
            mass: 600,
            radius: 16,
            color: '#fca5a5',
            trail: [],
          },
          {
            id: 'star-beta',
            name: 'Sol Secundus',
            type: 'star',
            x: cx + 70,
            y: cy,
            vx: 0,
            vy: -1.1,
            mass: 600,
            radius: 16,
            color: '#fef08a',
            trail: [],
          },
          {
            id: 'dweller',
            name: 'Orbit Voyager',
            type: 'planet',
            x: cx,
            y: cy - 180,
            vx: 2.2,
            vy: 0,
            mass: 12,
            radius: 7,
            color: '#10b981',
            trail: [],
          }
        ]);
        break;
    }
  };

  // Launch analysis request using /api/gemini/gravity-analysis
  const analyzeOrbitSystem = async () => {
    if (bodies.length === 0) return;
    setIsAiLoading(true);
    setAiReport('');

    try {
      const response = await fetch('/api/gemini/gravity-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bodies: bodies.map(b => ({
            name: b.name,
            type: b.type,
            mass: b.mass,
            x: b.x,
            y: b.y,
            vx: b.vx,
            vy: b.vy,
            color: b.color,
          })),
          G: gravityG,
          collisionsCount: collisions,
        }),
      });

      const data = await response.json();
      if (data.reply) {
        setAiReport(data.reply);
      } else {
        setAiReport('Failed to parse telemetry log reply.');
      }
    } catch (err: any) {
      console.error(err);
      setAiReport(`Astrophysics diagnostics offline: ${err.message || 'connection failed'}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Standard Canvas loop and physics loop
  useEffect(() => {
    if (bodies.length === 0) {
      loadPreset('solar');
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Clear with elegant translucent dark fill for smooth trail fade
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw cosmic grid
      if (gridVisible) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < w; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }

      // 2. Physics logic
      if (isPlaying) {
        setBodies(prevBodies => {
          let updated = prevBodies.map(b => ({
            ...b,
            trail: showTrails ? [...b.trail, { x: b.x, y: b.y }].slice(-120) : [],
          }));

          // Compute gravity forces between all pairs of objects
          const steps = 4; // Multiple sub-steps for higher numerical integration accuracy
          const dt = (0.04 * timeMultiplier) / steps;

          for (let step = 0; step < steps; step++) {
            // Accumulate gravitational forces
            const ax = new Array(updated.length).fill(0);
            const ay = new Array(updated.length).fill(0);

            for (let i = 0; i < updated.length; i++) {
              for (let j = i + 1; j < updated.length; j++) {
                const b1 = updated[i];
                const b2 = updated[j];

                const dx = b2.x - b1.x;
                const dy = b2.y - b1.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);

                // Skip calculations if bodies are extremely close (softening threshold to prevent NaN / division-by-zero explosions)
                if (dist < 4) continue;

                // Gravitational force: F = G * m1 * m2 / (distSq + softening)
                const softening = 200;
                const force = (gravityG * b1.mass * b2.mass) / (distSq + softening);

                // Acceleration = Force / Mass
                const ax1 = (force * (dx / dist)) / b1.mass;
                const ay1 = (force * (dy / dist)) / b1.mass;

                const ax2 = (-force * (dx / dist)) / b2.mass;
                const ay2 = (-force * (dy / dist)) / b2.mass;

                if (!b1.isStatic) {
                  ax[i] += ax1;
                  ay[i] += ay1;
                }
                if (!b2.isStatic) {
                  ax[j] += ax2;
                  ay[j] += ay2;
                }
              }
            }

            // Update positions & velocities
            for (let i = 0; i < updated.length; i++) {
              const b = updated[i];
              if (!b.isStatic) {
                b.vx += ax[i] * dt;
                b.vy += ay[i] * dt;
                b.x += b.vx * dt;
                b.y += b.vy * dt;
              }
            }

            // Collision resolution (merging)
            let collided = false;
            for (let i = 0; i < updated.length; i++) {
              for (let j = i + 1; j < updated.length; j++) {
                const b1 = updated[i];
                const b2 = updated[j];

                const dx = b2.x - b1.x;
                const dy = b2.y - b1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const collisionDist = b1.radius + b2.radius;

                if (dist < collisionDist) {
                  // Merge smaller body into the larger body!
                  const larger = b1.mass >= b2.mass ? b1 : b2;
                  const smaller = b1.mass >= b2.mass ? b2 : b1;

                  // Conserve momentum: m_new * v_new = m1 * v1 + m2 * v2
                  const totalMass = b1.mass + b2.mass;
                  if (!larger.isStatic) {
                    larger.vx = (b1.mass * b1.vx + b2.mass * b2.vx) / totalMass;
                    larger.vy = (b1.mass * b1.vy + b2.mass * b2.vy) / totalMass;
                  }

                  // Black holes swallow and grow slower in size but absorb 100% mass
                  larger.mass = totalMass;
                  larger.radius = larger.type === 'blackhole' 
                    ? Math.max(larger.radius, Math.min(30, larger.radius + 0.3))
                    : Math.min(45, Math.sqrt(larger.radius * larger.radius + smaller.radius * smaller.radius));

                  // Increment collisions log
                  setCollisions(c => c + 1);
                  playCollisionSound(larger.type);

                  // Remove smaller body from physics array
                  updated = updated.filter(x => x.id !== smaller.id);
                  collided = true;
                  break;
                }
              }
              if (collided) break;
            }
          }

          return updated;
        });
      }

      // Draw trails
      if (showTrails) {
        bodies.forEach(b => {
          if (b.trail.length < 2) return;
          ctx.beginPath();
          ctx.moveTo(b.trail[0].x, b.trail[0].y);
          for (let i = 1; i < b.trail.length; i++) {
            ctx.lineTo(b.trail[i].x, b.trail[i].y);
          }
          ctx.strokeStyle = `${b.color}25`;
          ctx.lineWidth = Math.max(1, b.radius * 0.15);
          ctx.stroke();
        });
      }

      // Draw bodies
      bodies.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);

        if (b.type === 'blackhole') {
          // Special glowing blackhole styling
          const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 1.8);
          grad.addColorStop(0, '#020617');
          grad.addColorStop(0.5, '#020617');
          grad.addColorStop(0.7, '#a855f7');
          grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius * 1.8, 0, Math.PI * 2);
          ctx.fill();

          // Black center
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Star glow or standard body styling
          if (b.type === 'star') {
            const glowGrad = ctx.createRadialGradient(b.x, b.y, b.radius * 0.2, b.x, b.y, b.radius * 2);
            glowGrad.addColorStop(0, '#ffffff');
            glowGrad.addColorStop(0.2, b.color);
            glowGrad.addColorStop(0.6, '#ef4444');
            glowGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * 2, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = b.color;
          ctx.fill();

          // Elegant outline
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Draw names
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.name, b.x, b.y - b.radius - 6);
      });

      // Draw launch/drag vector preview
      if (dragStart && dragCurrent) {
        ctx.beginPath();
        ctx.moveTo(dragStart.x, dragStart.y);
        ctx.lineTo(dragCurrent.x, dragCurrent.y);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(dragCurrent.y - dragStart.y, dragCurrent.x - dragStart.x);
        ctx.beginPath();
        ctx.moveTo(dragCurrent.x, dragCurrent.y);
        ctx.lineTo(dragCurrent.x - 8 * Math.cos(angle - Math.PI / 6), dragCurrent.y - 8 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(dragCurrent.x - 8 * Math.cos(angle + Math.PI / 6), dragCurrent.y - 8 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = '#22c55e';
        ctx.fill();

        // Micro label
        const dx = dragStart.x - dragCurrent.x;
        const dy = dragStart.y - dragCurrent.y;
        const vel = (Math.sqrt(dx * dx + dy * dy) * 0.05).toFixed(1);
        ctx.fillStyle = '#22c55e';
        ctx.font = '10px monospace';
        ctx.fillText(`Launch Vector v=${vel}`, dragStart.x, dragStart.y + 18);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [bodies, isPlaying, gravityG, timeMultiplier, showTrails, gridVisible, dragStart, dragCurrent]);

  // Handle click-and-drag mechanics on canvas
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    setDragStart(pos);
    setDragCurrent(pos);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragStart) return;
    setDragCurrent(getMousePos(e));
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragStart) return;
    const pos = getMousePos(e);

    // Calculate velocity based on launch vector direction (pull-back to sling mechanism)
    // Pulling backwards shoots forwards
    const dx = dragStart.x - pos.x;
    const dy = dragStart.y - pos.y;
    const velocityScale = 0.08; // sensitivity factor

    const template = BODY_PRESETS[selectedSpawn];
    const newBody: StellarBody = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `${template.name} ${bodies.length + 1}`,
      type: selectedSpawn,
      x: dragStart.x,
      y: dragStart.y,
      vx: dx * velocityScale,
      vy: dy * velocityScale,
      mass: template.mass,
      radius: template.radius,
      color: template.color,
      trail: [],
      isStatic: template.isStatic,
    };

    setBodies(prev => [...prev, newBody]);
    setDragStart(null);
    setDragCurrent(null);
  };

  return (
    <div className="w-full h-full flex flex-col font-sans select-none overflow-hidden bg-slate-950 text-slate-100" id="lumina_gravity_lab_root">
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-[#090d16] border-b border-white/5 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Icons.Orbit className="w-5 h-5 text-indigo-400 animate-spin-slow" />
          <span className="font-bold text-sm text-slate-200">Lumina Gravity Sandbox</span>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono">Quantum Lab v1.4</span>
        </div>

        {/* Quick presets buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 font-mono mr-1">PRESETS:</span>
          {[
            { id: 'solar', label: 'Solar System', icon: 'Sun' },
            { id: 'threebody', label: '3-Body Chaos', icon: 'Activity' },
            { id: 'binary', label: 'Binary Orbit', icon: 'Compass' },
            { id: 'devourer', label: 'Singularity', icon: 'Aperture' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => loadPreset(p.id as any)}
              className="px-2.5 py-1 text-[10px] font-semibold rounded bg-slate-900 border border-white/5 hover:border-indigo-500/30 text-slate-300 hover:text-white transition cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main UI layout */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left main workspace */}
        <div className="flex-1 h-full flex flex-col relative overflow-hidden bg-slate-950">
          
          {/* Controls Bar */}
          <div className="px-3.5 py-2 bg-slate-950 border-b border-white/5 flex items-center justify-between gap-4 z-10 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-1.5 rounded text-slate-300 hover:text-white transition cursor-pointer ${isPlaying ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-900 border border-white/10'}`}
                title={isPlaying ? 'Pause simulation' : 'Play simulation'}
              >
                {isPlaying ? <Icons.Pause className="w-4 h-4" /> : <Icons.Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setBodies([]);
                  setCollisions(0);
                  setAiReport('');
                }}
                className="p-1.5 rounded bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:border-red-500/40 transition cursor-pointer"
                title="Clear universe"
              >
                <Icons.Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Slider parameters */}
            <div className="flex items-center gap-4 flex-1 max-w-lg text-xs">
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">G (Gravity):</span>
                <input
                  type="range"
                  min="0.05"
                  max="2.5"
                  step="0.05"
                  value={gravityG}
                  onChange={e => setGravityG(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-900 rounded-lg appearance-none"
                />
                <span className="text-[10px] font-mono font-bold text-slate-200 w-8">{gravityG.toFixed(2)}</span>
              </div>

              <div className="flex-1 flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">Time warp:</span>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.1"
                  value={timeMultiplier}
                  onChange={e => setTimeMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-900 rounded-lg appearance-none"
                />
                <span className="text-[10px] font-mono font-bold text-slate-200 w-8">{timeMultiplier.toFixed(1)}x</span>
              </div>
            </div>

            {/* Display switches */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTrails(!showTrails)}
                className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer ${showTrails ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' : 'bg-black/40 border-white/5 text-slate-500'}`}
              >
                Trails
              </button>
              <button
                onClick={() => setGridVisible(!gridVisible)}
                className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer ${gridVisible ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' : 'bg-black/40 border-white/5 text-slate-500'}`}
              >
                Grid
              </button>
            </div>
          </div>

          {/* Interactive Physics Canvas */}
          <div className="flex-1 relative bg-[#02050c] overflow-hidden">
            <canvas
              ref={canvasRef}
              width={750}
              height={420}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="w-full h-full cursor-crosshair block"
            />

            {/* Float Launch selector Overlay */}
            <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md border border-white/10 p-2.5 rounded-lg text-xs space-y-2 z-10 w-48">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block border-b border-white/5 pb-1">Spawn Selection</span>
              <div className="space-y-1">
                {(Object.keys(BODY_PRESETS) as Array<keyof typeof BODY_PRESETS>).map(type => {
                  const preset = BODY_PRESETS[type];
                  const isSelected = selectedSpawn === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedSpawn(type)}
                      className={`w-full text-left px-2 py-1.5 rounded transition text-[11px] font-mono flex items-center justify-between cursor-pointer ${isSelected ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-900/60 text-slate-400 hover:bg-slate-900 border border-white/5'}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.color }} />
                        <span className="capitalize">{type}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-normal">M: {preset.mass}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed pt-1.5 border-t border-white/5 font-mono">
                💡 <strong>How to launch:</strong> Click and drag anywhere on the canvas, pull back to aim launch trajectory, then release!
              </p>
            </div>

            {/* Live Stats Overlay Panel - Bottom Left */}
            <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md border border-white/10 px-2.5 py-1.5 rounded-md text-[10px] font-mono text-slate-400 flex gap-4 z-10">
              <div>Bodies: <span className="text-white font-bold">{bodies.length}</span></div>
              <div className="border-l border-white/10 pl-4">Collisions: <span className="text-amber-400 font-bold">{collisions}</span></div>
            </div>
          </div>
        </div>

        {/* Right Astro-AI telemetry sidebar */}
        <div className="w-[300px] border-l border-white/5 bg-[#070b12] flex flex-col h-full min-h-0 z-10 relative">
          
          {/* Top Panel */}
          <div className="p-4 border-b border-white/5 bg-slate-950/25">
            <span className="text-[10px] text-indigo-400 font-bold tracking-wider uppercase font-mono block">Astrophysics telemetry</span>
            <h3 className="text-xs font-bold text-white mt-1 leading-normal">COSMOS Orbit Simulator</h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Analyze orbital resonance and gravitational stability of custom stars, planets and black holes.
            </p>
          </div>

          {/* AI Output Content box */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
            {isAiLoading ? (
              <div className="space-y-3 py-4 text-center">
                <Icons.Sparkles className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                <p className="text-[10px] text-slate-500 font-mono animate-pulse">Running orbital resonance matrices, predicting long-term gravitational decay...</p>
              </div>
            ) : aiReport ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-1">
                  <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-bold">ORACLE REPORT</span>
                  <button onClick={() => setAiReport('')} className="text-[9px] text-slate-500 hover:text-white font-mono">CLEAR</button>
                </div>
                <div className="text-slate-300 leading-relaxed font-sans bg-black/40 border border-white/5 p-3 rounded-lg text-[11.5px] max-w-full overflow-x-hidden whitespace-pre-wrap">
                  {aiReport}
                </div>
              </div>
            ) : (
              <div className="text-center p-6 border border-white/5 border-dashed rounded-lg bg-slate-900/10 space-y-3">
                <Icons.Globe className="w-10 h-10 text-slate-600 mx-auto stroke-[1.1] opacity-40" />
                <div className="font-bold text-slate-400 text-xs">Awaiting Simulation</div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Launch planets, configure gravitational parameters, watch systems collide, and trigger the Astro-AI to analyze system equilibrium!
                </p>
              </div>
            )}
          </div>

          {/* AI Trigger button in footer of sidebar */}
          <div className="p-4 border-t border-white/5 bg-slate-950/40">
            <button
              onClick={analyzeOrbitSystem}
              disabled={isAiLoading || bodies.length === 0}
              className={`w-full py-2 px-3 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${bodies.length === 0 ? 'bg-slate-900 text-slate-600 border border-white/5 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
            >
              <Icons.Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Declassify Gravity Grid</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
