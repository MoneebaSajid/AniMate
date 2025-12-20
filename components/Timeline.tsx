
import React, { useRef, useEffect, useState } from 'react';
import { Plus, Copy, Trash, Play, Pause, Layers, Check, Minus, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { Frame, OnionSkinSettings } from '../types';

interface TimelineProps {
  frames: Frame[];
  currentFrameIndex: number;
  onSelectFrame: (index: number) => void;
  onAddFrame: () => void;
  onDeleteFrame: (index: number) => void;
  onDuplicateFrame: (index: number) => void;
  onReorderFrames: (from: number, to: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  fps: number;
  setFps: (fps: number) => void;
  onionSkinSettings: OnionSkinSettings;
  setOnionSkinSettings: (settings: OnionSkinSettings) => void;
}

const Timeline: React.FC<TimelineProps> = ({
  frames,
  currentFrameIndex,
  onSelectFrame,
  onAddFrame,
  onDeleteFrame,
  onDuplicateFrame,
  onReorderFrames,
  isPlaying,
  onTogglePlay,
  fps,
  setFps,
  onionSkinSettings,
  setOnionSkinSettings
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showOnionControls, setShowOnionControls] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.children[currentFrameIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentFrameIndex]);

  const adjustFps = (delta: number) => {
      setFps(Math.max(1, Math.min(60, fps + delta)));
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('frameIndex', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('frameIndex'));
    setDragOverIndex(null);
    onReorderFrames(fromIndex, index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  return (
    <div className="h-52 bg-dark-900/80 backdrop-blur-xl border-t border-white/5 flex flex-col z-20 shadow-2xl">
      <div className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-5">
          <button
            onClick={onTogglePlay}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
              isPlaying 
                ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                : 'bg-brand-500 shadow-[0_0_15px_rgba(14,165,233,0.4)]'
            } text-white`}
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
          </button>
          
          <div className="flex items-center gap-2 bg-black/40 rounded-xl p-1 border border-white/10">
             <span className="text-[10px] text-gray-500 font-bold px-2 tracking-widest">FPS</span>
             <button onClick={() => adjustFps(-1)} className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded text-gray-300"><Minus size={12} /></button>
             <span className="w-6 text-center text-xs font-bold text-white">{fps}</span>
             <button onClick={() => adjustFps(1)} className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded text-gray-300"><Plus size={12} /></button>
          </div>

          <div className="h-6 w-px bg-white/10" />

          <div className="relative">
            <button
               onClick={() => setOnionSkinSettings({ ...onionSkinSettings, enabled: !onionSkinSettings.enabled })}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border ${
                 onionSkinSettings.enabled 
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.1)]' 
                    : 'text-gray-500 border-transparent hover:bg-white/5'
               }`}
            >
              <Layers size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Onion Skin</span>
            </button>
            
             <button 
               onClick={() => setShowOnionControls(!showOnionControls)}
               className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border border-dark-900 ${showOnionControls ? 'bg-brand-500' : 'bg-gray-700'} text-[8px] transition-colors`}
             >
               ▼
             </button>

            {onionSkinSettings.enabled && showOnionControls && (
                <div className="absolute bottom-full left-0 mb-3 bg-dark-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl z-50 w-56 flex flex-col gap-3">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <span>Opacity</span>
                        <span>{Math.round(onionSkinSettings.opacity * 100)}%</span>
                    </div>
                    <input type="range" min="10" max="100" value={onionSkinSettings.opacity * 100} onChange={(e) => setOnionSkinSettings({ ...onionSkinSettings, opacity: parseInt(e.target.value) / 100 })} className="w-full accent-purple-500 h-1 bg-gray-700 rounded-lg appearance-none" />
                    <div 
                      className="flex items-center justify-between text-[11px] text-gray-300 cursor-pointer hover:bg-white/5 p-2 rounded-lg"
                      onClick={() => setOnionSkinSettings({...onionSkinSettings, showPrevious: !onionSkinSettings.showPrevious})}
                    >
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> PREV FRAME</span>
                        {onionSkinSettings.showPrevious && <Check size={14} className="text-brand-400" />}
                    </div>
                    <div 
                      className="flex items-center justify-between text-[11px] text-gray-300 cursor-pointer hover:bg-white/5 p-2 rounded-lg"
                       onClick={() => setOnionSkinSettings({...onionSkinSettings, showNext: !onionSkinSettings.showNext})}
                    >
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> NEXT FRAME</span>
                         {onionSkinSettings.showNext && <Check size={14} className="text-brand-400" />}
                    </div>
                </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button onClick={() => onDuplicateFrame(currentFrameIndex)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg" title="Duplicate"><Copy size={18} /></button>
           <button onClick={() => onDeleteFrame(currentFrameIndex)} disabled={frames.length <= 1} className={`p-2 rounded-lg ${frames.length <= 1 ? 'text-gray-800' : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'}`}><Trash size={18} /></button>
           <button onClick={onAddFrame} className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-400 text-white rounded-lg text-xs font-bold tracking-widest uppercase transition-all shadow-lg">
             <Plus size={16} />
             <span>Add Frame</span>
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto scrollbar-hide py-4 px-6">
        <div ref={scrollContainerRef} className="flex gap-4 h-full items-center">
          {frames.map((frame, index) => (
            <div
              key={frame.id}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => onSelectFrame(index)}
              className={`
                group relative flex-shrink-0 w-24 h-24 bg-white rounded-xl cursor-pointer transition-all duration-300 overflow-hidden
                ${currentFrameIndex === index 
                  ? 'ring-2 ring-brand-400 shadow-[0_0_20px_rgba(56,189,248,0.3)] scale-105 z-10' 
                  : 'border border-gray-800 opacity-60 hover:opacity-100'}
                ${dragOverIndex === index ? 'border-l-4 border-l-brand-400 pl-1' : ''}
              `}
            >
              <div className="absolute top-1 left-1 text-[8px] font-bold text-gray-500 bg-white/90 px-1 rounded z-10">
                {index + 1}
              </div>
              
              {/* FX Badge Indicator */}
              {frame.effectsLayer && frame.effectsLayer.length > 0 && (
                <div className="absolute top-1 right-1 flex gap-0.5 z-10">
                   <div className="bg-brand-500 text-white p-0.5 rounded shadow-sm animate-pulse">
                      <Zap size={8} fill="white" />
                   </div>
                </div>
              )}
              
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '8px 8px' }} />
              
              {frame.thumbnail ? (
                <img src={frame.thumbnail} alt={`Frame ${index + 1}`} className="w-full h-full object-contain pointer-events-none" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-200">
                  <span className="text-[10px] font-bold text-gray-300 uppercase opacity-30 tracking-widest">Empty</span>
                </div>
              )}
              {currentFrameIndex === index && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-400" />
              )}
            </div>
          ))}
          <button onClick={onAddFrame} className="flex-shrink-0 w-12 h-24 rounded-xl border-2 border-dashed border-gray-800 hover:border-brand-500/50 hover:bg-white/5 flex items-center justify-center text-gray-700 hover:text-brand-400 transition-all">
            <Plus size={24} className="opacity-40" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
