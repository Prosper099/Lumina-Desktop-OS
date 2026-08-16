import React, { useRef, useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { Square, Palette, Circle, Eraser, Download, Save, RefreshCw, Wand2, Sparkles } from 'lucide-react';

export const PaintApp: React.FC<{ id: string }> = ({ id }) => {
  const { createFile, currentExplorerPath, addNotification } = useOS();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set styling dimensions
    canvas.width = 800;
    canvas.height = 450;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    contextRef.current = context;

    // Fill white or transparent? Fill Slate dark background so drawings look nice in transparent OS
    context.fillStyle = '#0f172a'; // slate-900 background to match paint app layout
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Update stroke values when color / brushSize / tool change
  useEffect(() => {
    if (!contextRef.current) return;
    contextRef.current.strokeStyle = tool === 'eraser' ? '#0f172a' : color;
    contextRef.current.lineWidth = brushSize;
  }, [color, brushSize, tool]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = nativeEvent.clientX - rect.left;
    const y = nativeEvent.clientY - rect.top;

    if (!contextRef.current) return;
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = nativeEvent.clientX - rect.left;
    const y = nativeEvent.clientY - rect.top;

    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    context.fillStyle = '#0f172a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    addNotification('Canvas Cleared', 'Painting reset successfully.', 'info');
  };

  const saveToVFS = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Export canvas image base64 URL
    const dataUrl = canvas.toDataURL('image/png');
    const timestamp = Math.floor(Date.now() / 1000);
    const fileName = `artwork_${timestamp}.png`;
    const targetPath = `/Pictures/${fileName}`;

    createFile(targetPath, dataUrl);
    addNotification('Drawing Saved', `Artwork saved as "${fileName}" inside Pictures!`, 'success');
  };

  // AI engine type selector state
  const [aiEngine, setAiEngine] = useState<'vector' | 'photo' | 'edit'>('photo');

  // Dynamic AI Art Generation (Supports Vectors, Gemini 3.1 photo-generation, and Gemini 3.1 image editing)
  const generateAIArt = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      if (aiEngine === 'vector') {
        const response = await fetch('/api/gemini/paint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: aiPrompt })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!data.shapes || data.shapes.length === 0) {
          throw new Error("No shapes returned by Gemini vector artist model.");
        }

        drawShapesOnCanvas(data.shapes);
        addNotification('AI Art Generated', `Vector artwork matching "${aiPrompt}" created successfully!`, 'success');
      } else {
        // Photorealistic generation or editing using gemini-3.1-flash-image
        let imagePayload: string | undefined = undefined;
        
        if (aiEngine === 'edit') {
          // Captures current canvas as base image
          imagePayload = canvas.toDataURL('image/png');
        }

        const response = await fetch('/api/gemini/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: aiPrompt,
            imageBase64: imagePayload,
            mimeType: 'image/png'
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!data.image) {
          throw new Error("No pixel canvas returned by Gemini 3.1 image model.");
        }

        // Draw returned photo onto canvas
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            addNotification(
              aiEngine === 'edit' ? 'Canvas Edited' : 'Image Rendered', 
              aiEngine === 'edit' ? `Gemini edited painting with prompt "${aiPrompt}"` : `Neural artwork generated of "${aiPrompt}"`, 
              'success'
            );
          }
        };
        img.src = data.image;
      }
    } catch (e: any) {
      console.warn("AI Model service offline/unreachable. Rendering stunning local procedural vector-art.", e);
      const shapes = generateMockShapes(aiPrompt);
      drawShapesOnCanvas(shapes);
      addNotification('AI Rendering fallback', `Synthesized vector-art layout matching "${aiPrompt}" completely local!`, 'info');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const generateMockShapes = (prompt: string): any[] => {
    const p = prompt.toLowerCase();
    const hash = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const shapes: any[] = [];
    
    if (p.includes('sun') || p.includes('day') || p.includes('morning') || p.includes('beach') || p.includes('summer') || p.includes('sunset') || p.includes('sunrise')) {
      // Warm golden beach sun vibes
      // Sea/Sky dividers
      shapes.push({ type: 'rect', color: '#0c4a6e', x: 0, y: 220, w: 800, h: 230, fill: true }); // Sea
      shapes.push({ type: 'rect', color: '#0284c7', x: 0, y: 0, w: 800, h: 220, fill: true }); // Sky
      
      // Radiant rising/setting Sun
      shapes.push({ type: 'circle', color: '#f59e0b', x: 400, y: 220, r: 80, fill: true });
      shapes.push({ type: 'circle', color: '#fde04777', x: 400, y: 220, r: 120, fill: true });
      
      // Sun rays
      for (let angle = 0; angle < 360; angle += 30) {
        const rad = (angle * Math.PI) / 180;
        shapes.push({
          type: 'line',
          color: '#fef08a99',
          x: 400 + Math.cos(rad) * 95,
          y: 220 + Math.sin(rad) * 95,
          x2: 400 + Math.cos(rad) * 160,
          y2: 220 + Math.sin(rad) * 160,
          w: 4
        });
      }
      // Reflection on water
      for (let i = 1; i <= 6; i++) {
        shapes.push({
          type: 'line',
          color: '#fef08acc',
          x: 400 - i * 15 - 10,
          y: 220 + i * 25,
          x2: 400 + i * 15 + 10,
          y2: 220 + i * 25,
          w: 4
        });
      }
      
      // Clouds
      shapes.push({ type: 'circle', color: '#ffffffcc', x: 180, y: 100, r: 35, fill: true });
      shapes.push({ type: 'circle', color: '#ffffffcc', x: 220, y: 90, r: 45, fill: true });
      shapes.push({ type: 'circle', color: '#ffffffcc', x: 260, y: 100, r: 35, fill: true });
      
      shapes.push({ type: 'circle', color: '#ffffffaa', x: 580, y: 120, r: 25, fill: true });
      shapes.push({ type: 'circle', color: '#ffffffaa', x: 610, y: 110, r: 35, fill: true });
      shapes.push({ type: 'circle', color: '#ffffffaa', x: 640, y: 120, r: 25, fill: true });
    }
    else if (p.includes('cat') || p.includes('dog') || p.includes('animal') || p.includes('face') || p.includes('rabbit') || p.includes('bunny') || p.includes('bear')) {
      // Warm cute character shapes
      // Background gradient/card
      shapes.push({ type: 'rect', color: '#111827', x: 0, y: 0, w: 800, h: 450, fill: true });
      shapes.push({ type: 'circle', color: '#1e1b4b', x: 400, y: 225, r: 180, fill: true });
      shapes.push({ type: 'circle', color: '#c084fc22', x: 400, y: 225, r: 210, fill: true });
      
      const isRabbit = p.includes('rabbit') || p.includes('bunny');
      const isBear = p.includes('bear');
      
      if (isRabbit) {
        // Long Ears
        shapes.push({ type: 'circle', color: '#f3e8ff', x: 330, y: 120, r: 30, fill: true }); 
        shapes.push({ type: 'circle', color: '#f472b6', x: 330, y: 120, r: 15, fill: true }); 
        shapes.push({ type: 'circle', color: '#f3e8ff', x: 470, y: 120, r: 30, fill: true }); 
        shapes.push({ type: 'circle', color: '#f472b6', x: 470, y: 120, r: 15, fill: true }); 
      } else if (isBear) {
        // Bear ears
        shapes.push({ type: 'circle', color: '#b45309', x: 310, y: 130, r: 35, fill: true });
        shapes.push({ type: 'circle', color: '#f59e0b', x: 310, y: 130, r: 18, fill: true });
        shapes.push({ type: 'circle', color: '#b45309', x: 490, y: 130, r: 35, fill: true });
        shapes.push({ type: 'circle', color: '#f59e0b', x: 490, y: 130, r: 18, fill: true });
      } else {
        // Cat Ears
        shapes.push({ type: 'line', color: '#e2e8f0', x: 300, y: 130, x2: 340, y2: 190, w: 12 });
        shapes.push({ type: 'line', color: '#e2e8f0', x: 340, y: 190, x2: 280, y2: 190, w: 12 });
        shapes.push({ type: 'line', color: '#e2e8f0', x: 500, y: 130, x2: 460, y2: 190, w: 12 });
        shapes.push({ type: 'line', color: '#e2e8f0', x: 460, y: 190, x2: 520, y2: 190, w: 12 });
        
        shapes.push({ type: 'circle', color: '#f472b6', x: 310, y: 165, r: 10, fill: true });
        shapes.push({ type: 'circle', color: '#f472b6', x: 490, y: 165, r: 10, fill: true });
      }
      
      // Face Head
      const headColor = isBear ? '#d97706' : '#f8fafc';
      shapes.push({ type: 'circle', color: headColor, x: 400, y: 240, r: 110, fill: true });
      
      // Cute Rosy Cheeks
      shapes.push({ type: 'circle', color: '#f472b6ee', x: 325, y: 265, r: 22, fill: true });
      shapes.push({ type: 'circle', color: '#f472b6ee', x: 475, y: 265, r: 22, fill: true });

      // Eyes
      shapes.push({ type: 'circle', color: '#0f172a', x: 350, y: 225, r: 12, fill: true });
      shapes.push({ type: 'circle', color: '#6366f1', x: 350, y: 225, r: 4, fill: true }); 
      shapes.push({ type: 'circle', color: '#ffffff', x: 347, y: 221, r: 4, fill: true }); 
      
      shapes.push({ type: 'circle', color: '#0f172a', x: 450, y: 225, r: 12, fill: true });
      shapes.push({ type: 'circle', color: '#6366f1', x: 450, y: 225, r: 4, fill: true }); 
      shapes.push({ type: 'circle', color: '#ffffff', x: 447, y: 221, r: 4, fill: true }); 
      
      // Mouth/Muzzle
      shapes.push({ type: 'circle', color: '#f1f5f9', x: 400, y: 265, r: 25, fill: true });
      // Nose
      shapes.push({ type: 'circle', color: '#db2777', x: 400, y: 255, r: 8, fill: true });
      
      // Mouth lines
      shapes.push({ type: 'line', color: '#475569', x: 400, y: 263, x2: 400, y2: 275, w: 3 });
      shapes.push({ type: 'line', color: '#475569', x: 388, y: 275, x2: 412, y2: 275, w: 3 });
      
      // Cat Whiskers
      if (!isBear && !isRabbit) {
        shapes.push({ type: 'line', color: '#cbd5e1', x: 280, y: 250, x2: 210, y2: 240, w: 4 });
        shapes.push({ type: 'line', color: '#cbd5e1', x: 280, y: 265, x2: 200, y2: 265, w: 4 });
        shapes.push({ type: 'line', color: '#cbd5e1', x: 280, y: 280, x2: 210, y2: 290, w: 4 });
        
        shapes.push({ type: 'line', color: '#cbd5e1', x: 520, y: 250, x2: 590, y2: 240, w: 4 });
        shapes.push({ type: 'line', color: '#cbd5e1', x: 520, y: 265, x2: 600, y2: 265, w: 4 });
        shapes.push({ type: 'line', color: '#cbd5e1', x: 520, y: 280, x2: 590, y2: 290, w: 4 });
      }
    }
    else if (p.includes('tree') || p.includes('forest') || p.includes('flower') || p.includes('garden') || p.includes('landscape') || p.includes('nature') || p.includes('mountain') || p.includes('hills')) {
      // Stunning forest & galaxy landscape layers
      shapes.push({ type: 'rect', color: '#1e293b', x: 0, y: 0, w: 800, h: 450, fill: true });
      
      // Moon crescent
      shapes.push({ type: 'circle', color: '#fef08a', x: 680, y: 90, r: 40, fill: true });
      shapes.push({ type: 'circle', color: '#1e293b', x: 660, y: 80, r: 40, fill: true }); 
      
      // Sparkly stars
      for (let i = 0; i < 15; i++) {
        shapes.push({ type: 'circle', color: '#ffffffdd', x: (hash * i * 49) % 800, y: (hash * i * 31) % 220, r: (hash * i) % 3 + 1, fill: true });
      }
      
      // Mountains
      shapes.push({ type: 'line', color: '#334155', x: 50, y: 350, x2: 300, y2: 120, w: 8 });
      shapes.push({ type: 'line', color: '#334155', x: 300, y: 120, x2: 550, y2: 350, w: 8 });
      
      shapes.push({ type: 'line', color: '#475569', x: 250, y: 350, x2: 520, y2: 150, w: 8 });
      shapes.push({ type: 'line', color: '#475569', x: 520, y: 150, x2: 790, y2: 350, w: 8 });
      
      // Green earth ground
      shapes.push({ type: 'rect', color: '#064e3b', x: 0, y: 320, w: 800, h: 130, fill: true });
      shapes.push({ type: 'circle', color: '#065f46', x: 200, y: 380, r: 100, fill: true });
      shapes.push({ type: 'circle', color: '#0f766e', x: 600, y: 390, r: 120, fill: true });
      
      // Trees
      for (let i = 0; i < 6; i++) {
        const x = 120 + i * 110 + (hash % 15);
        const size = 30 + (hash % 20);
        shapes.push({ type: 'rect', color: '#78350f', x: x - 4, y: 280, w: 8, h: 60, fill: true }); 
        shapes.push({ type: 'circle', color: '#10b981', x: x, y: 250, r: size, fill: true }); 
        shapes.push({ type: 'circle', color: '#34d399', x: x - 5, y: 240, r: size - 8, fill: true }); 
        shapes.push({ type: 'circle', color: '#059669', x: x + 8, y: 255, r: size - 12, fill: true }); 
      }
    }
    else if (p.includes('space') || p.includes('galaxy') || p.includes('planet') || p.includes('star') || p.includes('rocket') || p.includes('ufo')) {
      // Cosmic Space Science Art
      shapes.push({ type: 'rect', color: '#020617', x: 0, y: 0, w: 800, h: 450, fill: true });
      
      // Glowing Nebulas
      shapes.push({ type: 'circle', color: '#7c3aed33', x: 400, y: 225, r: 160, fill: true });
      shapes.push({ type: 'circle', color: '#ec489922', x: 450, y: 200, r: 210, fill: true });
      shapes.push({ type: 'circle', color: '#06b6d422', x: 350, y: 250, r: 180, fill: true });
      
      // Cosmic Stars
      for (let i = 0; i < 30; i++) {
        shapes.push({
          type: 'circle',
          color: ((hash + i) % 5 === 0) ? '#a78bfaaa' : '#ffffffdd',
          x: (hash * i * 37) % 800,
          y: (hash * i * 19) % 450,
          r: (hash * i) % 2 + 1,
          fill: true
        });
      }
      
      // Center Saturn-like Planet
      shapes.push({ type: 'circle', color: '#ea580c', x: 400, y: 225, r: 60, fill: true }); 
      shapes.push({ type: 'circle', color: '#f97316', x: 380, y: 205, r: 35, fill: true }); 
      
      // Planet Rings
      for (let d = -4; d <= 4; d++) {
        shapes.push({
          type: 'line',
          color: '#fde047aa',
          x: 230 + d * 5,
          y: 285 - d * 3,
          x2: 570 + d * 5,
          y2: 165 - d * 3,
          w: 3
        });
      }
      // Draw half overlapping dome to create 3D ring effect
      shapes.push({ type: 'circle', color: '#ea580c', x: 400, y: 225, r: 60, fill: true });
    }
    else {
      // Stunning Constructivist Abstract Geometric Art default!
      shapes.push({ type: 'rect', color: '#020617', x: 0, y: 0, w: 800, h: 450, fill: true });
      
      // Constructivism elements
      shapes.push({ type: 'circle', color: '#1e1b4b', x: 550, y: 225, r: 180, fill: true });
      shapes.push({ type: 'rect', color: '#311042', x: 60, y: 80, w: 320, h: 290, fill: true });
      
      shapes.push({ type: 'circle', color: '#ec489977', x: 260, y: 180, r: 90, fill: true });
      shapes.push({ type: 'circle', color: '#22d3ee', x: 480, y: 180, r: 55, fill: true });
      shapes.push({ type: 'circle', color: '#f59e0b', x: 190, y: 310, r: 40, fill: true });
      
      for (let i = 0; i < 8; i++) {
        shapes.push({
          type: 'line',
          color: '#ffffff12',
          x: 420 + i * 20,
          y: 50,
          x2: 420 + i * 20,
          y2: 400,
          w: 4
        });
      }
      
      shapes.push({ type: 'line', color: '#db2777', x: 100, y: 380, x2: 700, y2: 80, w: 5 });
      shapes.push({ type: 'line', color: '#fcd34d', x: 100, y: 395, x2: 600, y2: 145, w: 3 });
      
      shapes.push({ type: 'rect', color: '#10b981', x: 600, y: 325, w: 40, h: 12, fill: true });
      shapes.push({ type: 'rect', color: '#6366f1', x: 660, y: 290, w: 25, h: 25, fill: true });
      shapes.push({ type: 'circle', color: '#ffffff', x: 110, y: 120, r: 8, fill: true });
      shapes.push({ type: 'circle', color: '#3b82f6', x: 150, y: 110, r: 15, fill: true });
    }
    
    shapes.push({
      type: 'text',
      color: '#ffffff88',
      x: 30,
      y: 45,
      text: `🎨 Co-Artist AI Layout: "${prompt}"`
    });
    
    return shapes;
  };

  const drawShapesOnCanvas = (shapes: any[]) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    // Clear previous drawing
    context.fillStyle = '#0f172a';
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (const shape of shapes) {
      context.beginPath();
      context.strokeStyle = shape.color || '#ffffff';
      context.fillStyle = shape.color || '#ffffff';
      context.lineWidth = shape.w || 2;

      if (shape.type === 'circle') {
        const x = Math.min(Math.max(10, shape.x), 790);
        const y = Math.min(Math.max(10, shape.y), 440);
        const r = Math.min(Math.max(2, shape.r), 150);
        context.arc(x, y, r, 0, Math.PI * 2);
        context.stroke();
        if (shape.fill !== false) {
          context.fillStyle = (shape.color || '#ffffff') + '55'; // half transparent
          context.fill();
        }
      } else if (shape.type === 'rect') {
        const x = Math.min(Math.max(0, shape.x), 750);
        const y = Math.min(Math.max(0, shape.y), 420);
        const w = Math.min(Math.max(5, shape.w), 400);
        const h = Math.min(Math.max(5, shape.h), 300);
        context.rect(x, y, w, h);
        context.stroke();
        if (shape.fill !== false) context.fill();
      } else if (shape.type === 'line') {
        context.moveTo(shape.x, shape.y);
        context.lineTo(shape.x2, shape.y2);
        context.stroke();
      } else if (shape.type === 'text') {
        context.font = '24px "JetBrains Mono", monospace';
        context.fillText(shape.text || '', shape.x, shape.y);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 font-sans select-none overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-slate-800 border-b border-slate-700 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-700">
          <button
            onClick={() => setTool('brush')}
            className={`px-2 py-0.5 rounded cursor-pointer transition ${tool === 'brush' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            Brush
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer transition ${tool === 'eraser' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            <Eraser className="w-3" /> Eraser
          </button>
        </div>

        {/* Brush size slider */}
        <div className="flex items-center gap-2">
          <span>Brush Size:</span>
          <input
            type="range"
            min="1"
            max="40"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-20 accent-blue-500 cursor-pointer"
          />
          <span className="w-6 text-center text-slate-400 font-mono">{brushSize}px</span>
        </div>

        {/* Color Palette Presets */}
        <div className="h-4 w-px bg-slate-700" />
        <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-700">
          {['#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#000000'].map(preset => (
            <button
              key={preset}
              onClick={() => { setColor(preset); setTool('brush'); }}
              style={{ backgroundColor: preset }}
              className={`w-4 h-4 rounded-full border cursor-pointer border-slate-800 transition transform hover:scale-125 ${color === preset && tool === 'brush' ? 'ring-2 ring-blue-500' : ''}`}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => { setColor(e.target.value); setTool('brush'); }}
            className="w-5 h-5 bg-transparent border-0 outline-none cursor-pointer rounded-full p-0"
          />
        </div>

        {/* Clear & Save VFS */}
        <div className="h-4 w-px bg-slate-700" />
        <button
          onClick={clearCanvas}
          className="flex items-center gap-1 hover:bg-red-950 border border-slate-700 hover:border-red-800 text-slate-400 hover:text-red-300 font-semibold px-2 py-1 rounded cursor-pointer transition"
        >
          <RefreshCw className="w-3" /> Reset
        </button>
        <button
          onClick={saveToVFS}
          className="flex items-center gap-1 bg-green-700 hover:bg-green-600 font-semibold text-white px-2 py-1 rounded cursor-pointer transition"
        >
          <Save className="w-3" /> Save to Drive
        </button>
      </div>

      {/* Main Sandbox Canvas Area */}
      <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 overflow-auto">
        <div className="relative border border-slate-700 rounded shadow-2xl">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className={`bg-[#0f172a] shadow-inner block ${tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'}`}
          />
        </div>
      </div>

      {/* Dynamic AI Generation Footer */}
      <div className="px-4 py-3 bg-slate-850 border-t border-slate-800 flex items-center gap-3">
        <Sparkles className="w-4 text-purple-400 h-4" />
        <div className="text-xs text-purple-300 font-semibold whitespace-nowrap">AI Co-Artist:</div>
        
        {/* AI Engine Model Picker */}
        <select
          value={aiEngine}
          onChange={(e: any) => setAiEngine(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
        >
          <option value="photo">Gemini 3.1: Create New Image</option>
          <option value="edit">Gemini 3.1: Edit Current Canvas</option>
          <option value="vector">Gemini 3.5: Vector Shapes</option>
        </select>

        <input
          type="text"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder={
            aiEngine === 'edit'
              ? "Describe changes to apply to existing canvas... (e.g. 'turn this into watercolor oil painting')"
              : "Describe a scene to render... (e.g. 'cute fluffy cat on a red skateboard')"
          }
          className="flex-1 bg-slate-900 border border-purple-900/60 text-slate-200 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-purple-500"
          onKeyDown={(e) => e.key === 'Enter' && generateAIArt()}
        />
        <button
          onClick={generateAIArt}
          disabled={isAiGenerating || !aiPrompt.trim()}
          className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 font-semibold text-white px-3 py-1.5 rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <Wand2 className="w-3" />
          {isAiGenerating ? 'Synthesizing...' : aiEngine === 'edit' ? 'Edit Canvas' : 'Create Art'}
        </button>
      </div>
    </div>
  );
};
