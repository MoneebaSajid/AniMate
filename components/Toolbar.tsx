
import React, { useState, useEffect } from 'react';
import { 
  Pen, Eraser, Move, Undo, Redo, Trash2, Type, Music, Wand, 
  Square, Circle, Triangle, Star, Hexagon, Pentagon, Octagon, 
  Diamond, Heart, ArrowRight, Minus, Crosshair, Moon, Cloud, Layout, 
  Settings2, Palette, X, CornerUpRight, Zap, Settings, MessageSquare, 
  Shield, Flower2, Sun, ZapIcon, Disc, Egg, Bookmark, Droplets, Smile, 
  Frown, Leaf, Flame, Database, PieChart, ChevronDown, Sparkles, 
  BadgeCheck, Box, RefreshCw, Clover, Award, Maximize2, Scaling
} from 'lucide-react';
import { ToolType, BrushSettings, ShapeType } from '../types';

interface ToolbarProps {
  activeTool: ToolType;
  setTool: (t: ToolType) => void;
  brushSettings: BrushSettings;
  setBrushSettings: (s: BrushSettings) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClearFrame: () => void;
  onOpenMusic: () => void;
  onOpenEffects: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setTool,
  brushSettings,
  setBrushSettings,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClearFrame,
  onOpenMusic,
  onOpenEffects
}) => {
  const [showGradientMenu, setShowGradientMenu] = useState(false);
  const [showShapePanel, setShowShapePanel] = useState(false);

  useEffect(() => {
    if (activeTool === ToolType.SHAPE) setShowShapePanel(true);
    else setShowShapePanel(false);
  }, [activeTool]);

  const getShapeIcon = (type: ShapeType, size: number = 18) => {
    switch (type) {
      case ShapeType.RECTANGLE: return <Square size={size} />;
      case ShapeType.CIRCLE: return <Circle size={size} />;
      case ShapeType.TRIANGLE: return <Triangle size={size} />;
      case ShapeType.STAR: return <Star size={size} />;
      case ShapeType.STAR_4: return <Sparkles size={size} />;
      case ShapeType.STAR_6: return <div className="relative" style={{ width: size, height: size }}><Triangle size={size} className="absolute inset-0" /><Triangle size={size} className="absolute inset-0 rotate-180" /></div>;
      case ShapeType.HEXAGON: return <Hexagon size={size} />;
      case ShapeType.PENTAGON: return <Pentagon size={size} />;
      case ShapeType.OCTAGON: return <Octagon size={size} />;
      case ShapeType.DIAMOND: return <Diamond size={size} />;
      case ShapeType.HEART: return <Heart size={size} />;
      case ShapeType.ARROW: return <ArrowRight size={size} />;
      case ShapeType.TRAPEZOID: return <Layout size={size} />;
      case ShapeType.PARALLELOGRAM: return <div className="border-2 border-current transform skew-x-[-20deg]" style={{ width: size, height: size }} />;
      case ShapeType.CROSS: return <Crosshair size={size} />;
      case ShapeType.MOON: return <Moon size={size} />;
      case ShapeType.CLOUD: return <Cloud size={size} />;
      case ShapeType.LIGHTNING: return <Zap size={size} />;
      case ShapeType.GEAR: return <Settings size={size} />;
      case ShapeType.SPEECH_BUBBLE: return <MessageSquare size={size} />;
      case ShapeType.SHIELD: return <Shield size={size} />;
      case ShapeType.FLOWER: return <Flower2 size={size} />;
      case ShapeType.SUN: return <Sun size={size} />;
      case ShapeType.BOLT: return <ZapIcon size={size} />;
      case ShapeType.RING: return <Disc size={size} />;
      case ShapeType.EGG: return <Egg size={size} />;
      case ShapeType.RIBBON: return <Bookmark size={size} />;
      case ShapeType.HEXAGRAM: return <Star size={size} />;
      case ShapeType.DROP: return <Droplets size={size} />;
      case ShapeType.RHOMBUS: return <Diamond size={size} className="rotate-45" />;
      case ShapeType.KITE: return <div className="border-2 border-current transform rotate-45 scale-y-125" style={{ width: size * 0.7, height: size * 0.7 }} />;
      case ShapeType.SMILE: return <Smile size={size} />;
      case ShapeType.FROWN: return <Frown size={size} />;
      case ShapeType.LEAF: return <Leaf size={size} />;
      case ShapeType.FLAME: return <Flame size={size} />;
      case ShapeType.CYLINDER: return <Database size={size} />;
      case ShapeType.PIE: return <PieChart size={size} />;
      case ShapeType.CAPSULE: return <div className="border-2 border-current rounded-full" style={{ width: size, height: size * 0.5 }} />;
      case ShapeType.CRESCENT: return <Moon size={size} />;
      case ShapeType.L_SHAPE: return <div className="border-l-2 border-b-2 border-current" style={{ width: size, height: size }} />;
      case ShapeType.CHEVRON: return <ChevronDown size={size} />;
      case ShapeType.SPIRAL: return <RefreshCw size={size} />;
      case ShapeType.SHAMROCK: return <Clover size={size} />;
      case ShapeType.BADGE: return <Award size={size} />;
      case ShapeType.CUBE_3D: return <Box size={size} />;
      default: return <Square size={size} />;
    }
  };
  
  const tools = [
    { type: ToolType.PEN, icon: <Pen size={22} />, label: 'Pen' },
    { type: ToolType.ERASER, icon: <Eraser size={22} />, label: 'Eraser' },
    { type: ToolType.SHAPE, icon: getShapeIcon(brushSettings.shapeType, 22), label: 'Shape' },
    { type: ToolType.MOVE, icon: <Move size={22} />, label: 'Move' },
    { type: ToolType.RESIZE, icon: <Scaling size={22} />, label: 'Resize' },
    { type: ToolType.TEXT, icon: <Type size={22} />, label: 'Text' },
  ];

  const shapes = Object.values(ShapeType);

  const joinStyles: {id: 'miter' | 'round' | 'bevel', label: string, icon: React.ReactNode}[] = [
    { id: 'miter', label: 'Miter', icon: <CornerUpRight size={14} /> },
    { id: 'round', label: 'Round', icon: <Circle size={10} fill="currentColor" /> },
    { id: 'bevel', label: 'Bevel', icon: <Minus size={14} /> },
  ];

  return (
    <div className="h-full flex relative z-20">
      {/* Main Vertical Tool Strip */}
      <div className="w-20 bg-dark-900/90 backdrop-blur-xl border-r border-white/5 flex flex-col shadow-2xl">
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col items-center py-6 gap-6">
          {tools.map((tool) => (
            <div key={tool.type} className="relative group">
              <button
                onClick={() => setTool(tool.type)}
                className={`p-4 w-full rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                  activeTool === tool.type
                    ? 'bg-brand-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.6)] translate-x-1'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white hover:-translate-y-0.5'
                }`}
                title={tool.label}
              >
                {tool.icon}
                <span className={`text-[8px] font-bold uppercase tracking-tighter ${activeTool === tool.type ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                  {tool.label}
                </span>
              </button>
            </div>
          ))}

          <div className="h-px bg-white/10 my-1 mx-2 w-10 shrink-0" />

          <button onClick={onOpenEffects} className="p-4 rounded-2xl transition-all duration-200 hover:-translate-y-1 text-gray-400 hover:bg-white/10 hover:text-yellow-400 flex flex-col items-center gap-1 group shrink-0" title="Visual Effects">
            <Wand size={22} />
            <span className="text-[8px] font-bold uppercase tracking-tighter text-gray-500 group-hover:text-yellow-400">FX</span>
          </button>

          <button onClick={onOpenMusic} className="p-4 rounded-2xl transition-all duration-200 hover:-translate-y-1 text-gray-400 hover:bg-white/10 hover:text-purple-400 flex flex-col items-center gap-1 group shrink-0" title="Studio Music">
            <Music size={22} />
            <span className="text-[8px] font-bold uppercase tracking-tighter text-gray-500 group-hover:text-purple-400">Audio</span>
          </button>

          <div className="mt-auto flex flex-col gap-3 pb-6 shrink-0 w-full items-center">
            <div className="relative group shrink-0 transition-transform duration-300 hover:scale-110 flex flex-col items-center gap-1">
               <div 
                 className="w-10 h-10 rounded-2xl border-2 border-white/20 cursor-pointer shadow-xl overflow-hidden transition-all group-hover:border-white/50"
                 style={{ 
                   background: brushSettings.gradient.enabled 
                     ? `linear-gradient(${brushSettings.gradient.angle}deg, ${brushSettings.gradient.colorStart}, ${brushSettings.gradient.colorEnd})` 
                     : brushSettings.color 
                 }}
               >
                 {!brushSettings.gradient.enabled && (
                   <input
                     type="color"
                     className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                     value={brushSettings.color}
                     onChange={(e) => setBrushSettings({ ...brushSettings, color: e.target.value })}
                   />
                 )}
               </div>
               <span className="text-[8px] font-bold uppercase tracking-tighter text-gray-500">Color</span>
            </div>

            <button onClick={onClearFrame} className="p-3 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all hover:scale-110 active:scale-95 flex flex-col items-center gap-1 group" title="Clear Canvas">
              <Trash2 size={20} />
              <span className="text-[8px] font-bold text-gray-500 group-hover:text-red-400">CLEAR</span>
            </button>
            <button onClick={onUndo} disabled={!canUndo} className={`p-3 rounded-2xl transition-all ${!canUndo ? 'text-gray-800' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`} title="Undo"><Undo size={20} /></button>
            <button onClick={onRedo} disabled={!canRedo} className={`p-3 rounded-2xl transition-all ${!canRedo ? 'text-gray-800' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`} title="Redo"><Redo size={20} /></button>
          </div>
        </div>
      </div>

      {/* Expanded Shape Library Grid Panel */}
      {showShapePanel && (
        <div className="w-64 bg-dark-950/95 backdrop-blur-2xl border-r border-white/5 flex flex-col animate-in slide-in-from-left duration-300 shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
              <Sparkles size={14} className="text-brand-400" />
              Shapes Library
            </h3>
            <button onClick={() => setShowGradientMenu(!showGradientMenu)} className={`p-1.5 rounded-lg transition-all ${showGradientMenu ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-white/5'}`}>
              <Palette size={16} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-4 gap-2">
              {shapes.map((type) => (
                <button
                  key={type}
                  onClick={() => setBrushSettings({...brushSettings, shapeType: type})}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                    brushSettings.shapeType === type 
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/40 scale-105 z-10 border-2 border-white/20' 
                      : 'bg-dark-800 text-gray-500 hover:text-white hover:bg-dark-700 border border-transparent'
                  }`}
                  title={type.replace('_', ' ')}
                >
                  {getShapeIcon(type, 20)}
                </button>
              ))}
            </div>
          </div>

          {/* Style Engine for Shapes */}
          {showGradientMenu && (
            <div className="p-4 bg-dark-900 border-t border-white/10 animate-in slide-in-from-bottom duration-200 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gradient Fill</span>
                <button 
                  onClick={() => setBrushSettings({...brushSettings, gradient: { ...brushSettings.gradient, enabled: !brushSettings.gradient.enabled }})}
                  className={`w-10 h-5 rounded-full relative transition-colors ${brushSettings.gradient.enabled ? 'bg-brand-500' : 'bg-gray-600'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-md transition-transform ${brushSettings.gradient.enabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              
              <div className="flex flex-col gap-2">
                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Stroke Style</span>
                <div className="flex gap-2">
                  {joinStyles.map(s => (
                    <button 
                      key={s.id}
                      onClick={() => setBrushSettings({...brushSettings, lineJoin: s.id})}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border ${brushSettings.lineJoin === s.id ? 'bg-brand-500 border-brand-400 text-white' : 'border-white/5 text-gray-500'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Toolbar;
