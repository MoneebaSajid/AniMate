import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Layer, BrushSettings, ToolType, OnionSkinSettings, ShapeType, Point, DynamicEffect, TransformState } from '../types';
import { 
  Check, X, Pen, Eraser, Move, Type, Square, Circle, Triangle, Star, 
  Hexagon, Pentagon, Octagon, Diamond, Heart, ArrowRight, Layout, 
  Crosshair, Moon, Cloud, Zap, Settings, MessageSquare, Shield, 
  Flower2, Sun, ZapIcon, Disc, Egg, Bookmark, Droplets, Smile, Frown, 
  Leaf, Flame, Database, PieChart, Sparkles, ChevronDown, RefreshCw, Clover, Award, Box, Maximize2, Scaling
} from 'lucide-react';

interface CanvasProps {
  currentLayer: Layer;
  prevFrameLayer: Layer | null;
  nextFrameLayer: Layer | null;
  effectsLayer: DynamicEffect[];
  onionSkinSettings: OnionSkinSettings;
  brushSettings: BrushSettings;
  activeTool: ToolType;
  onUpdateLayer: (data: string) => void;
  zoom: number;
  width: number;
  height: number;
  showGrid: boolean;
  pendingImage: string | null;
  onClearPendingImage: () => void;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const Canvas: React.FC<CanvasProps> = ({
  currentLayer,
  prevFrameLayer,
  nextFrameLayer,
  effectsLayer,
  onionSkinSettings,
  brushSettings,
  activeTool,
  onUpdateLayer,
  zoom,
  width,
  height,
  showGrid,
  pendingImage,
  onClearPendingImage
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onionRef = useRef<HTMLCanvasElement>(null);
  const effectsCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | 'move' | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [activeObject, setActiveObject] = useState<TransformState | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  const particles = useMemo(() => {
    return Array.from({ length: 50 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.2,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5
    }));
  }, [width, height]);

  // Handle AI Character Import Glitch - Operational Restoration
  useEffect(() => {
    if (pendingImage) {
      const img = new Image();
      img.src = pendingImage;
      img.onload = () => {
        // Correctly set initial size to 300x300 while centered
        const initSize = Math.min(width, height) * 0.6;
        setActiveObject({
          x: (width - initSize) / 2,
          y: (height - initSize) / 2,
          width: initSize,
          height: initSize,
          rotation: 0,
          image: img
        });
        onClearPendingImage();
      };
    }
  }, [pendingImage, width, height, onClearPendingImage]);

  useEffect(() => {
    if (activeTool !== ToolType.SHAPE && activeTool !== ToolType.MOVE && activeTool !== ToolType.RESIZE && activeTool !== ToolType.TEXT) {
      if (activeObject) commitActiveObject();
    }
  }, [activeTool]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    if (currentLayer.data) {
        const img = new Image();
        img.src = currentLayer.data;
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            drawActiveObject(ctx);
        };
        if (img.complete) {
          ctx.drawImage(img, 0, 0);
          drawActiveObject(ctx);
        }
    } else {
        drawActiveObject(ctx);
    }
  }, [currentLayer.data, activeObject, brushSettings, isDrawing, width, height]);

  const handleTransformLayer = () => {
    if (!currentLayer.data || activeObject) return;
    const img = new Image();
    img.src = currentLayer.data;
    img.onload = () => {
      onUpdateLayer('');
      setActiveObject({
        x: 0,
        y: 0,
        width: width,
        height: height,
        rotation: 0,
        image: img
      });
    };
  };

  const commitActiveObject = () => {
    if (!activeObject) return;
    const canvas = canvasRef.current;
    if (canvas) { 
      const ctx = canvas.getContext('2d')!;
      drawActiveObject(ctx);
      onUpdateLayer(canvas.toDataURL()); 
      setActiveObject(null); 
    }
  };

  const drawActiveObject = (ctx: CanvasRenderingContext2D) => {
      if (!activeObject) return;
      ctx.save();
      const centerX = activeObject.x + activeObject.width / 2;
      const centerY = activeObject.y + activeObject.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((activeObject.rotation * Math.PI) / 180);
      
      ctx.lineWidth = brushSettings.size;
      ctx.lineJoin = brushSettings.lineJoin;
      ctx.lineCap = 'round';
      
      if (brushSettings.gradient.enabled) {
          const rad = (brushSettings.gradient.angle * Math.PI) / 180;
          const hw = Math.abs(activeObject.width / 2);
          const hh = Math.abs(activeObject.height / 2);
          const x0 = -Math.cos(rad) * hw;
          const y0 = -Math.sin(rad) * hh;
          const x1 = Math.cos(rad) * hw;
          const y1 = Math.sin(rad) * hh;
          const grad = ctx.createLinearGradient(x0, y0, x1, y1);
          grad.addColorStop(0, brushSettings.gradient.colorStart);
          grad.addColorStop(1, brushSettings.gradient.colorEnd);
          ctx.strokeStyle = grad;
          ctx.fillStyle = grad;
      } else {
          ctx.strokeStyle = brushSettings.color;
          ctx.fillStyle = brushSettings.color;
      }

      const w = activeObject.width;
      const h = activeObject.height;
      const hw = w / 2;
      const hh = h / 2;
      
      if (activeObject.image) {
          ctx.drawImage(activeObject.image, -hw, -hh, w, h);
      } else if (activeTool === ToolType.TEXT || activeObject.text !== undefined) {
          ctx.font = `bold ${Math.abs(h)}px ${brushSettings.fontFamily || 'Arial'}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(activeObject.text || "Type Here", 0, 0);
      } else {
          ctx.beginPath();
          const r = Math.min(Math.abs(hw), Math.abs(hh));
          switch (brushSettings.shapeType) {
              case ShapeType.RECTANGLE: ctx.strokeRect(-hw, -hh, w, h); break;
              case ShapeType.CIRCLE: ctx.ellipse(0, 0, Math.abs(hw), Math.abs(hh), 0, 0, Math.PI * 2); ctx.stroke(); break;
              case ShapeType.TRIANGLE: ctx.moveTo(0, -hh); ctx.lineTo(hw, hh); ctx.lineTo(-hw, hh); ctx.closePath(); ctx.stroke(); break;
              case ShapeType.STAR:
                  for (let i = 0; i < 10; i++) {
                      const dist = i % 2 === 0 ? r : r * 0.45;
                      const a = (Math.PI * i) / 5 - Math.PI / 2;
                      ctx.lineTo(Math.cos(a) * dist, Math.sin(a) * dist);
                  }
                  ctx.closePath(); ctx.stroke(); break;
              case ShapeType.STAR_4:
                  for (let i = 0; i < 8; i++) {
                    const dist = i % 2 === 0 ? r : r * 0.3;
                    const a = (Math.PI * i) / 4 - Math.PI / 2;
                    ctx.lineTo(Math.cos(a) * dist, Math.sin(a) * dist);
                  }
                  ctx.closePath(); ctx.stroke(); break;
              case ShapeType.STAR_6:
                  for (let i = 0; i < 12; i++) {
                    const dist = i % 2 === 0 ? r : r * 0.577;
                    const a = (Math.PI * i) / 6 - Math.PI / 2;
                    ctx.lineTo(Math.cos(a) * dist, Math.sin(a) * dist);
                  }
                  ctx.closePath(); ctx.stroke(); break;
              case ShapeType.HEXAGON:
                  for (let i = 0; i < 6; i++) {
                      const a = (Math.PI * i) / 3;
                      ctx.lineTo(Math.cos(a) * hw, Math.sin(a) * hh);
                  }
                  ctx.closePath(); ctx.stroke(); break;
              case ShapeType.PENTAGON:
                  for (let i = 0; i < 5; i++) {
                      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                      ctx.lineTo(Math.cos(a) * hw, Math.sin(a) * hh);
                  }
                  ctx.closePath(); ctx.stroke(); break;
              case ShapeType.OCTAGON:
                  for (let i = 0; i < 8; i++) {
                      const a = (Math.PI * 2 * i) / 8 + Math.PI / 8;
                      ctx.lineTo(Math.cos(a) * hw, Math.sin(a) * hh);
                  }
                  ctx.closePath(); ctx.stroke(); break;
              case ShapeType.DIAMOND: ctx.moveTo(0, -hh); ctx.lineTo(hw, 0); ctx.lineTo(0, hh); ctx.lineTo(-hw, 0); ctx.closePath(); ctx.stroke(); break;
              case ShapeType.HEART:
                  ctx.moveTo(0, hh * 0.5);
                  ctx.bezierCurveTo(-hw, -hh * 0.5, -hw * 1.5, hh * 0.5, 0, hh);
                  ctx.bezierCurveTo(hw * 1.5, hh * 0.5, hw, -hh * 0.5, 0, hh * 0.5);
                  ctx.stroke(); break;
              case ShapeType.ARROW:
                  ctx.moveTo(-hw, -hh/3); ctx.lineTo(hw/4, -hh/3); ctx.lineTo(hw/4, -hh); ctx.lineTo(hw, 0); ctx.lineTo(hw/4, hh); ctx.lineTo(hw/4, hh/3); ctx.lineTo(-hw, hh/3); ctx.closePath(); ctx.stroke(); break;
              case ShapeType.CROSS:
                  const t = r * 0.3;
                  ctx.moveTo(-t, -hh); ctx.lineTo(t, -hh); ctx.lineTo(t, -t); ctx.lineTo(hw, -t); ctx.lineTo(hw, t); ctx.lineTo(t, t); ctx.lineTo(t, hh); ctx.lineTo(-t, hh); ctx.lineTo(-t, t); ctx.lineTo(-hw, t); ctx.lineTo(-hw, -t); ctx.lineTo(-t, -t); ctx.closePath(); ctx.stroke(); break;
              case ShapeType.DROP:
                  ctx.moveTo(0, -hh);
                  ctx.bezierCurveTo(hw, -hh * 0.2, hw, hh, 0, hh);
                  ctx.bezierCurveTo(-hw, hh, -hw, -hh * 0.2, 0, -hh);
                  ctx.stroke(); break;
              case ShapeType.CAPSULE:
                  ctx.moveTo(-hw + hh, -hh); ctx.lineTo(hw - hh, -hh); ctx.arc(hw - hh, 0, hh, -Math.PI/2, Math.PI/2); ctx.lineTo(-hw + hh, hh); ctx.arc(-hw + hh, 0, hh, Math.PI/2, -Math.PI/2); ctx.stroke(); break;
              case ShapeType.CRESCENT:
                  ctx.arc(0, 0, r, Math.PI * 0.2, Math.PI * 1.8); ctx.quadraticCurveTo(hw * 0.6, 0, 0, hh * 0.95); ctx.stroke(); break;
              case ShapeType.L_SHAPE:
                  const lt = r * 0.4;
                  ctx.moveTo(-hw, -hh); ctx.lineTo(-hw + lt, -hh); ctx.lineTo(-hw + lt, hh - lt); ctx.lineTo(hw, hh - lt); ctx.lineTo(hw, hh); ctx.lineTo(-hw, hh); ctx.closePath(); ctx.stroke(); break;
              case ShapeType.CHEVRON:
                  const ct = r * 0.4;
                  ctx.moveTo(-hw, -hh); ctx.lineTo(0, hh - ct); ctx.lineTo(hw, -hh); ctx.lineTo(hw, -hh + ct); ctx.lineTo(0, hh); ctx.lineTo(-hw, -hh + ct); ctx.closePath(); ctx.stroke(); break;
              case ShapeType.SPIRAL:
                  for (let i = 0; i < 50; i++) {
                    const angle = 0.1 * i;
                    const x = (0.2 + 0.1 * angle) * Math.cos(angle) * hw;
                    const y = (0.2 + 0.1 * angle) * Math.sin(angle) * hh;
                    ctx.lineTo(x, y);
                  }
                  ctx.stroke(); break;
              case ShapeType.SHAMROCK:
                  for (let i = 0; i < 3; i++) {
                    const angle = (Math.PI * 2 * i) / 3;
                    const ox = Math.cos(angle) * hw * 0.4;
                    const oy = Math.sin(angle) * hh * 0.4;
                    ctx.beginPath(); ctx.ellipse(ox, oy, Math.abs(hw * 0.4), Math.abs(hh * 0.4), angle, 0, Math.PI * 2); ctx.stroke();
                  }
                  break;
              case ShapeType.BADGE:
                  for (let i = 0; i < 16; i++) {
                    const dist = i % 2 === 0 ? r : r * 0.85;
                    const a = (Math.PI * i) / 8;
                    ctx.lineTo(Math.cos(a) * dist, Math.sin(a) * dist);
                  }
                  ctx.closePath(); ctx.stroke(); break;
              case ShapeType.CUBE_3D:
                  const d = r * 0.4;
                  ctx.strokeRect(-hw, -hh + d, w - d, h - d);
                  ctx.strokeRect(-hw + d, -hh, w - d, h - d);
                  ctx.moveTo(-hw, -hh + d); ctx.lineTo(-hw + d, -hh);
                  ctx.moveTo(hw - d, -hh + d); ctx.lineTo(hw, -hh);
                  ctx.moveTo(-hw, hh); ctx.lineTo(-hw + d, hh - d);
                  ctx.moveTo(hw - d, hh); ctx.lineTo(hw, hh - d);
                  ctx.stroke(); break;
              default:
                  ctx.strokeRect(-hw, -hh, w, h); break;
          }
      }
      ctx.restore();
  };

  useEffect(() => {
    const canvas = effectsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      effectsLayer.forEach(effect => {
        ctx.save();
        if (effect.type === 'particles') {
          ctx.fillStyle = effect.color || '#38bdf8';
          particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;
            ctx.globalAlpha = p.opacity * (effect.intensity / 100);
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
          });
        } else if (effect.type === 'speed_lines') {
          ctx.strokeStyle = effect.color || '#ffffff'; ctx.lineWidth = 1; ctx.globalAlpha = (effect.intensity / 100) * 0.4;
          for (let i = 0; i < 40; i++) {
            const y = (i * (height / 40)) + (Math.sin(Date.now() / 100 + i) * 10);
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
          }
        } else if (effect.type === 'glow') {
          const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
          grad.addColorStop(0, `${effect.color || '#38bdf8'}44`); grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad; ctx.globalAlpha = (effect.intensity / 100) * 0.5; ctx.fillRect(0, 0, width, height);
        }
        ctx.restore();
      });
      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, [effectsLayer, width, height, particles, prevFrameLayer]);

  useEffect(() => {
    const canvas = onionRef.current;
    if (!canvas || !onionSkinSettings.enabled) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const drawOnion = (layer: Layer | null, color: string) => {
      if (!layer?.data) return;
      const img = new Image(); img.src = layer.data;
      img.onload = () => {
        ctx.save(); ctx.globalAlpha = onionSkinSettings.opacity;
        const tempCanvas = document.createElement('canvas'); tempCanvas.width = width; tempCanvas.height = height;
        const tCtx = tempCanvas.getContext('2d')!; tCtx.drawImage(img, 0, 0);
        tCtx.globalCompositeOperation = 'source-in'; tCtx.fillStyle = color; tCtx.fillRect(0, 0, width, height);
        ctx.drawImage(tempCanvas, 0, 0); ctx.restore();
      };
    };
    if (onionSkinSettings.showPrevious) drawOnion(prevFrameLayer, '#ef4444');
    if (onionSkinSettings.showNext) drawOnion(nextFrameLayer, '#22c55e');
  }, [prevFrameLayer, nextFrameLayer, onionSkinSettings, width, height]);

  const getCoordinates = (e: React.PointerEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const coords = getCoordinates(e);
    if (activeTool === ToolType.SHAPE || activeTool === ToolType.TEXT) {
        if (!activeObject) { 
            setIsCreating(true); 
            setActiveObject({ 
              x: coords.x, 
              y: coords.y, 
              width: 0, 
              height: 0, 
              rotation: 0,
              text: activeTool === ToolType.TEXT ? "" : undefined
            }); 
        }
        else {
            const handle = getHandleAt(coords);
            // Fix: Removed impossible tool checks (activeTool === ToolType.RESIZE/MOVE) 
            // inside a block where activeTool is narrowed to SHAPE | TEXT.
            // This allows manipulating the active shape/text object directly.
            if (handle) setActiveHandle(handle);
            else if (coords.x >= activeObject.x && coords.x <= activeObject.x + activeObject.width && coords.y >= activeObject.y && coords.y <= activeObject.y + activeObject.height) { 
                setActiveHandle('move'); 
            }
            else { commitActiveObject(); }
        }
    } else if (activeTool === ToolType.PEN || activeTool === ToolType.ERASER) { 
        setIsDrawing(true); 
    } else if (activeTool === ToolType.MOVE || activeTool === ToolType.RESIZE) {
        const handle = getHandleAt(coords);
        if (handle && activeTool === ToolType.RESIZE) setActiveHandle(handle);
        else if (activeObject && coords.x >= activeObject.x && coords.x <= activeObject.x + activeObject.width && coords.y >= activeObject.y && coords.y <= activeObject.y + activeObject.height) { 
            if (activeTool === ToolType.MOVE) setActiveHandle('move'); 
        }
    }
    lastPos.current = coords;
    if(canvasRef.current) canvasRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const coords = getCoordinates(e);
    setMousePos(coords);
    if (!lastPos.current) return;
    const dx = coords.x - lastPos.current.x;
    const dy = coords.y - lastPos.current.y;
    
    if (isCreating && activeObject) { 
        setActiveObject({ ...activeObject, width: coords.x - activeObject.x, height: coords.y - activeObject.y }); 
    }
    else if (activeHandle && activeObject) {
        const obj = { ...activeObject };
        const ratio = activeObject.width / (activeObject.height || 1);
        
        switch (activeHandle) {
            case 'move': 
                // Fix: Added SHAPE and TEXT to allowed tools for moving an active object
                if (activeTool === ToolType.MOVE || activeTool === ToolType.SHAPE || activeTool === ToolType.TEXT) {
                  obj.x += dx; obj.y += dy; 
                }
                break;
            case 'nw': 
                // Fix: Added SHAPE and TEXT to allowed tools for resizing an active object
                if (activeTool === ToolType.RESIZE || activeTool === ToolType.SHAPE || activeTool === ToolType.TEXT) {
                  obj.x += dx; obj.y += dy; obj.width -= dx; obj.height -= dy; 
                  if (lockAspectRatio) obj.height = obj.width / ratio; 
                }
                break;
            case 'ne': 
                if (activeTool === ToolType.RESIZE || activeTool === ToolType.SHAPE || activeTool === ToolType.TEXT) {
                  obj.y += dy; obj.width += dx; obj.height -= dy; 
                  if (lockAspectRatio) obj.height = obj.width / ratio; 
                }
                break;
            case 'sw': 
                if (activeTool === ToolType.RESIZE || activeTool === ToolType.SHAPE || activeTool === ToolType.TEXT) {
                  obj.x += dx; obj.width -= dx; obj.height += dy; 
                  if (lockAspectRatio) obj.height = obj.width / ratio; 
                }
                break;
            case 'se': 
                if (activeTool === ToolType.RESIZE || activeTool === ToolType.SHAPE || activeTool === ToolType.TEXT) {
                  obj.width += dx; obj.height += dy; 
                  if (lockAspectRatio) obj.height = obj.width / ratio; 
                }
                break;
            case 'n': if (activeTool === ToolType.RESIZE || activeTool === ToolType.SHAPE || activeTool === ToolType.TEXT) { obj.y += dy; obj.height -= dy; } break;
            case 's': if (activeTool === ToolType.RESIZE || activeTool === ToolType.SHAPE || activeTool === ToolType.TEXT) { obj.height += dy; } break;
            case 'e': if (activeTool === ToolType.RESIZE || activeTool === ToolType.SHAPE || activeTool === ToolType.TEXT) { obj.width += dx; } break;
            case 'w': if (activeTool === ToolType.RESIZE || activeTool === ToolType.SHAPE || activeTool === ToolType.TEXT) { obj.x += dx; obj.width -= dx; } break;
        }
        setActiveObject(obj);
    } else if (isDrawing) {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath(); ctx.lineCap = 'round'; ctx.lineWidth = brushSettings.size;
            ctx.globalCompositeOperation = activeTool === ToolType.ERASER ? 'destination-out' : 'source-over';
            ctx.strokeStyle = brushSettings.color; ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(coords.x, coords.y); ctx.stroke();
        }
    }
    lastPos.current = coords;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsCreating(false); setActiveHandle(null); setIsDrawing(false);
    if (activeTool === ToolType.PEN || activeTool === ToolType.ERASER) {
      onUpdateLayer(canvasRef.current!.toDataURL());
    }
    if (canvasRef.current) canvasRef.current.releasePointerCapture(e.pointerId);
  };

  const getHandleAt = (coords: Point): ResizeHandle | null => {
    if (!activeObject) return null;
    const s = 14 / zoom;
    const { x, y, width: w, height: h } = activeObject;
    const handles: Record<ResizeHandle, { x: number, y: number }> = {
        nw: { x, y }, n: { x: x + w / 2, y }, ne: { x: x + w, y },
        e: { x: x + w, y: y + h / 2 }, se: { x: x + w, y: y + h },
        s: { x: x + w / 2, y: y + h }, sw: { x, y: y + h },
        w: { x, y: y + h / 2 }
    };
    for (const [key, handlePos] of Object.entries(handles)) {
        if (coords.x >= handlePos.x - s && coords.x <= handlePos.x + s && coords.y >= handlePos.y - s && coords.y <= handlePos.y + s) return key as ResizeHandle;
    }
    return null;
  };

  const renderCursor = () => {
    if (!mousePos) return null;
    const scale = zoom;
    const left = mousePos.x * scale;
    const top = mousePos.y * scale;

    const getToolIcon = () => {
      switch (activeTool) {
        case ToolType.PEN: return <Pen size={28} className="text-white fill-brand-500 drop-shadow-[0_4px_10px_rgba(14,165,233,0.5)]" />;
        case ToolType.ERASER: return <Eraser size={28} className="text-white fill-red-500 drop-shadow-[0_4px_10px_rgba(239,68,68,0.5)]" />;
        case ToolType.MOVE: return <Move size={28} className="text-white fill-brand-400 drop-shadow-[0_4px_10px_rgba(14,165,233,0.5)]" />;
        case ToolType.RESIZE: return <Scaling size={28} className="text-white fill-brand-400 drop-shadow-[0_4px_10px_rgba(14,165,233,0.5)]" />;
        case ToolType.TEXT: return <Type size={28} className="text-white fill-white drop-shadow-[0_4px_10px_rgba(255,255,255,0.5)]" />;
        case ToolType.SHAPE: return <Sparkles size={28} className="text-white fill-brand-500 drop-shadow-[0_4px_10px_rgba(14,165,233,0.5)]" />;
        default: return null;
      }
    };

    return (
      <div 
        className="pointer-events-none absolute z-[100] flex items-center justify-center"
        style={{ left, top, transform: 'translate(-50%, -50%)' }}
      >
        {(activeTool === ToolType.PEN || activeTool === ToolType.ERASER) && (
          <div 
            className="absolute rounded-full border-2 border-white/40 mix-blend-difference shadow-2xl"
            style={{ 
              width: brushSettings.size * scale, 
              height: brushSettings.size * scale 
            }}
          />
        )}
        <div className="absolute -top-12 -right-12 flex flex-col items-center gap-1.5 animate-in fade-in zoom-in duration-300">
           <div className="bg-dark-900/95 p-2.5 rounded-2xl border border-white/10 shadow-3xl backdrop-blur-xl transform scale-125">
            {getToolIcon()}
           </div>
           <div className="bg-brand-500 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg border border-white/20">
            {activeTool === ToolType.SHAPE ? brushSettings.shapeType.replace('_', ' ') : activeTool}
           </div>
        </div>
      </div>
    );
  };

  const getHandleStyle = (h: string): React.CSSProperties => {
    const offset = '-8px';
    switch (h) {
        case 'nw': return { top: offset, left: offset, cursor: 'nwse-resize' };
        case 'n': return { top: offset, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' };
        case 'ne': return { top: offset, right: offset, cursor: 'nesw-resize' };
        case 'e': return { top: '50%', right: offset, transform: 'translateY(-50%)', cursor: 'ew-resize' };
        case 'se': return { bottom: offset, right: offset, cursor: 'nwse-resize' };
        case 's': return { bottom: offset, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' };
        case 'sw': return { bottom: offset, left: offset, cursor: 'nesw-resize' };
        case 'w': return { top: '50%', left: offset, transform: 'translateY(-50%)', cursor: 'ew-resize' };
        default: return {};
    }
  };

  return (
    <div 
      className="relative shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-white select-none overflow-hidden cursor-none rounded-lg ring-1 ring-white/10" 
      style={{ width: width * zoom, height: height * zoom }}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setMousePos(null)}
    >
        <div 
          className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-300" 
          style={{ 
            opacity: showGrid ? 0.4 : 0, 
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`
          }} 
        />

        <canvas ref={onionRef} width={width} height={height} className="absolute inset-0 pointer-events-none z-[1]" />
        <canvas ref={effectsCanvasRef} width={width} height={height} className="absolute inset-0 pointer-events-none z-[5]" />
        <canvas ref={canvasRef} width={width} height={height} className="absolute inset-0 z-10 w-full h-full touch-none" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} />
        
        {renderCursor()}

        {/* Transform Visualization Overlay - ONLY visible when RESIZE tool is active or an object is selected */}
        {activeObject && (
            <div 
              className="absolute border-2 border-brand-500 pointer-events-none z-20" 
              style={{ 
                left: activeObject.x * zoom, 
                top: activeObject.y * zoom, 
                width: activeObject.width * zoom, 
                height: activeObject.height * zoom, 
                transform: `rotate(${activeObject.rotation}deg)` 
              }}
            >
                {/* 8-Point Resize Handles - only functional in RESIZE tool or active creation mode */}
                {(activeTool === ToolType.RESIZE || activeTool === ToolType.SHAPE || activeTool === ToolType.TEXT) && ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((h) => (
                    <div 
                      key={h} 
                      className="absolute w-5 h-5 bg-white border-2 border-brand-500 rounded-full pointer-events-auto shadow-md hover:bg-brand-400 transition-colors z-30" 
                      style={{ ...getHandleStyle(h) }} 
                    />
                ))}
            </div>
        )}

        {/* Main Resize Action Prompt for Current Layer */}
        {(activeTool === ToolType.MOVE || activeTool === ToolType.RESIZE) && !activeObject && currentLayer.data && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50 animate-in slide-in-from-top-4 duration-300">
               <button 
                onClick={handleTransformLayer}
                className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-2xl flex items-center gap-2 text-sm font-black shadow-2xl border border-white/20 transition-all hover:scale-105 active:scale-95 group"
               >
                 <Maximize2 size={18} className="group-hover:rotate-12 transition-transform" /> 
                 TRANSFORM CURRENT DRAWING
               </button>
            </div>
        )}

        {/* Transform Control Bar (Bottom) */}
        {activeObject && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-dark-900/98 p-5 rounded-3xl flex items-center gap-8 z-50 border border-white/10 shadow-3xl animate-in fade-in slide-in-from-bottom-4 backdrop-blur-xl">
                <div className="flex flex-col gap-1.5 border-r border-white/10 pr-8">
                   <div className="flex items-center justify-between gap-12">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Ratio Lock</span>
                        <span className="text-[8px] text-brand-400/70 font-bold uppercase">Maintain Aspect</span>
                      </div>
                      <button 
                        onClick={() => setLockAspectRatio(!lockAspectRatio)}
                        className={`w-12 h-6 rounded-full relative transition-all shadow-inner ${lockAspectRatio ? 'bg-brand-500' : 'bg-gray-700'}`}
                      >
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-transform ${lockAspectRatio ? 'left-7' : 'left-1'}`} />
                      </button>
                   </div>
                </div>
                
                {activeObject.text !== undefined && (
                  <div className="flex flex-col gap-1.5 border-r border-white/10 pr-8">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Edit Text</span>
                    <input 
                      autoFocus
                      value={activeObject.text}
                      onChange={(e) => setActiveObject({...activeObject, text: e.target.value})}
                      placeholder="Type text..."
                      className="bg-dark-800 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-brand-500 w-48 text-sm shadow-inner"
                    />
                  </div>
                )}
                
                <div className="flex gap-3">
                  <button onClick={() => commitActiveObject()} className="bg-brand-500 text-white p-3 rounded-2xl flex items-center gap-2 text-xs font-black px-10 hover:bg-brand-400 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-500/30"> 
                    <Check size={20} /> APPLY 
                  </button>
                  <button 
                    onClick={() => { 
                      if (activeObject.image && !currentLayer.data) onUpdateLayer(activeObject.image.src); 
                      setActiveObject(null); 
                    }} 
                    className="text-gray-400 hover:text-white p-3 hover:bg-white/10 rounded-2xl transition-all"
                    title="Cancel Transform"
                  >
                    <X size={24} />
                  </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default Canvas;