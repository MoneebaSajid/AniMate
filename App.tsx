
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProjectState, Frame, ToolType, BrushSettings, OnionSkinSettings, DynamicEffectType } from './types';
import { INITIAL_PROJECT_STATE, INITIAL_BRUSH_SETTINGS, INITIAL_TOOL, INITIAL_FRAME, INITIAL_LAYER, INITIAL_ONION_SKIN_SETTINGS } from './constants';
import Toolbar from './components/Toolbar';
import Timeline from './components/Timeline';
import Canvas from './components/Canvas';
import CharacterGenerator from './components/CharacterGenerator';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import AboutModal from './components/AboutModal';
import MusicModal from './components/MusicModal';
import EffectsModal, { EffectType } from './components/EffectsModal';
import Logo from './components/Logo';
import { Menu, Wand2, Share2, AlertCircle, Undo, Redo, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [project, setProject] = useState<ProjectState>(INITIAL_PROJECT_STATE);
  const [activeTool, setActiveTool] = useState<ToolType>(INITIAL_TOOL);
  const [brushSettings, setBrushSettings] = useState<BrushSettings>(INITIAL_BRUSH_SETTINGS);
  const [onionSkinSettings, setOnionSkinSettings] = useState<OnionSkinSettings>(INITIAL_ONION_SKIN_SETTINGS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isEffectsOpen, setIsEffectsOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'error' | 'success' | 'info'} | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  // History for Undo/Redo
  const [history, setHistory] = useState<ProjectState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const playbackInterval = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Loading animation
  useEffect(() => {
    const duration = 2000;
    const interval = 40;
    const step = 100 / (duration / interval);
    const timer = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setLoading(false), 500);
          return 100;
        }
        return prev + step;
      });
    }, interval);
    return () => clearInterval(timer);
  }, []);

  const getCurrentFrame = () => project.frames[project.currentFrameIndex];
  const getCurrentLayer = () => getCurrentFrame().layers[project.currentLayerIndex];
  const getPrevFrameLayer = () => project.currentFrameIndex > 0 ? project.frames[project.currentFrameIndex - 1].layers[0] : null;
  const getNextFrameLayer = () => project.currentFrameIndex < project.frames.length - 1 ? project.frames[project.currentFrameIndex + 1].layers[0] : null;

  const saveToHistory = useCallback((newState: ProjectState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    if (newHistory.length > 20) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setProject(newState);
  }, [history, historyIndex]);

  const handleLayerUpdate = (dataUrl: string) => {
     const newFrames = project.frames.map((f, i) => {
       if (i === project.currentFrameIndex) {
         return { ...f, layers: f.layers.map((l, li) => li === project.currentLayerIndex ? { ...l, data: dataUrl } : l), thumbnail: dataUrl };
       }
       return f;
     });
     saveToHistory({ ...project, frames: newFrames });
  };

  const addFrame = useCallback(() => {
    const newFrame: Frame = {
      ...INITIAL_FRAME,
      id: `frame-${Date.now()}`,
      layers: [{ ...INITIAL_LAYER, id: `layer-${Date.now()}` }],
    };
    const newFrames = [...project.frames];
    newFrames.splice(project.currentFrameIndex + 1, 0, newFrame);
    saveToHistory({ 
      ...project, 
      frames: newFrames, 
      currentFrameIndex: project.currentFrameIndex + 1 
    });
  }, [project, saveToHistory]);

  const deleteFrame = useCallback((index: number) => {
    if (project.frames.length <= 1) return;
    const newFrames = project.frames.filter((_, i) => i !== index);
    const newIndex = Math.max(0, Math.min(project.currentFrameIndex, newFrames.length - 1));
    saveToHistory({ ...project, frames: newFrames, currentFrameIndex: newIndex });
  }, [project, saveToHistory]);

  const duplicateFrame = useCallback((index: number) => {
    const frameToCopy = project.frames[index];
    const newFrame: Frame = {
      ...frameToCopy,
      id: `frame-${Date.now()}`,
      layers: frameToCopy.layers.map(l => ({ ...l, id: `layer-${Date.now()}` }))
    };
    const newFrames = [...project.frames];
    newFrames.splice(index + 1, 0, newFrame);
    saveToHistory({ ...project, frames: newFrames, currentFrameIndex: index + 1 });
  }, [project, saveToHistory]);

  const reorderFrames = useCallback((from: number, to: number) => {
    const newFrames = [...project.frames];
    const [movedFrame] = newFrames.splice(from, 1);
    newFrames.splice(to, 0, movedFrame);
    saveToHistory({ ...project, frames: newFrames, currentFrameIndex: to });
  }, [project, saveToHistory]);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setProject(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setProject(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);
  
  // Universal Image Import Handler (Used by AI and Local)
  const handleImageImport = (dataUrl: string, source: 'ai' | 'local' = 'ai') => {
    setPendingImage(dataUrl);
    setActiveTool(ToolType.MOVE); 
    setShowAIGenerator(false);
    const sourceLabel = source === 'ai' ? "Character generated" : "Image imported";
    setNotification({ message: `${sourceLabel}! Position it with MOVE tool.`, type: 'info' });
    setTimeout(() => setNotification(null), 3000);
  };

  // Device Import Logic
  const handleLocalImageImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        handleImageImport(dataUrl, 'local');
      }
    };
    reader.onerror = () => {
      setNotification({ message: "Failed to read local image file.", type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleExportVideo = async () => {
    setIsExporting(true);
    setNotification({ message: "Rendering video...", type: 'info' });
    try {
        const canvas = document.createElement('canvas');
        canvas.width = project.width;
        canvas.height = project.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("No context");
        
        const stream = canvas.captureStream(project.fps);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
        const chunks: BlobPart[] = [];
        
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `animation-${Date.now()}.webm`;
            a.click();
            setIsExporting(false);
            setNotification({ message: "Export complete!", type: 'success' });
            setTimeout(() => setNotification(null), 3000);
        };
        
        recorder.start();
        
        for (const frame of project.frames) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            for (const layer of frame.layers) {
                if (layer.visible && layer.data) {
                    await new Promise<void>((resolve) => {
                        const img = new Image();
                        img.onload = () => { ctx.drawImage(img, 0, 0); resolve(); };
                        img.src = layer.data!;
                    });
                }
            }
            await new Promise(r => setTimeout(r, 1000 / project.fps));
        }
        
        recorder.stop();
    } catch (e) {
        setNotification({ message: "Export failed", type: 'error' });
        setIsExporting(false);
        setTimeout(() => setNotification(null), 3000);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Sync audio playback with isPlaying state - Operational Restoration
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && project.audioUrl) {
      if (project.currentFrameIndex === 0) {
        audio.currentTime = 0;
      }
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          console.debug("Audio playback waiting for interaction");
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, project.currentFrameIndex, project.audioUrl]);

  useEffect(() => {
    if (isPlaying) {
      playbackInterval.current = window.setInterval(() => {
        setProject(prev => {
          const nextIndex = (prev.currentFrameIndex + 1) % prev.frames.length;
          return { ...prev, currentFrameIndex: nextIndex };
        });
      }, 1000 / project.fps);
    } else {
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
        playbackInterval.current = null;
      }
    }
    return () => { if (playbackInterval.current) clearInterval(playbackInterval.current); };
  }, [isPlaying, project.fps]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-dark-950 flex flex-col items-center justify-center z-[999]">
        <Logo size={120} animated className="mb-8" />
        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">Ani<span className="text-brand-500">Mate</span></h1>
        <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-brand-500 transition-all duration-300 ease-out"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em]">Initializing Creative Engine</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-dark-950 text-white flex flex-col overflow-hidden font-sans selection:bg-brand-500/30">
      {/* Top Header */}
      <header className="h-14 bg-dark-900/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-40">
        <div className="flex items-center gap-6">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-white/5 rounded-xl transition-all text-gray-400 hover:text-white">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3 group cursor-default">
            <Logo size={32} />
            <h1 className="text-xl font-black tracking-tighter group-hover:scale-105 transition-transform">Ani<span className="text-brand-400">Mate</span></h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowAIGenerator(true)}
            className="bg-brand-500 hover:bg-brand-400 text-white px-5 py-2 rounded-xl flex items-center gap-2 text-xs font-black shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Wand2 size={16} /> CHARACTER GEN
          </button>
          <button 
            onClick={handleExportVideo}
            disabled={isExporting}
            className="bg-dark-800 hover:bg-dark-700 text-gray-200 px-5 py-2 rounded-xl flex items-center gap-2 text-xs font-black border border-white/5 transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
            EXPORT
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden relative">
        <Toolbar 
          activeTool={activeTool} 
          setTool={setActiveTool} 
          brushSettings={brushSettings} 
          setBrushSettings={setBrushSettings}
          onUndo={undo}
          onRedo={redo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onClearFrame={() => handleLayerUpdate('')}
          onOpenMusic={() => setIsMusicOpen(true)}
          onOpenEffects={() => setIsEffectsOpen(true)}
        />
        
        <div className="flex-1 bg-dark-950 flex flex-col items-center justify-center p-8 overflow-auto custom-scrollbar relative">
          {/* Zoom Controls Overlay */}
          <div className="absolute top-6 right-6 flex items-center gap-2 z-30 bg-dark-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/5">
             <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-xl text-gray-400 transition-colors"> - </button>
             <span className="text-[10px] font-black text-gray-300 w-10 text-center">{Math.round(zoom * 100)}%</span>
             <button onClick={() => setZoom(Math.min(5, zoom + 0.1))} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-xl text-gray-400 transition-colors"> + </button>
          </div>

          <Canvas 
            currentLayer={getCurrentLayer()}
            prevFrameLayer={getPrevFrameLayer()}
            nextFrameLayer={getNextFrameLayer()}
            effectsLayer={getCurrentFrame().effectsLayer}
            onionSkinSettings={onionSkinSettings}
            brushSettings={brushSettings}
            activeTool={activeTool}
            onUpdateLayer={handleLayerUpdate}
            zoom={zoom}
            width={project.width}
            height={project.height}
            showGrid={showGrid}
            pendingImage={pendingImage}
            onClearPendingImage={() => setPendingImage(null)}
          />
        </div>

        {/* Floating Notification */}
        {notification && (
          <div className={`absolute bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right-8 duration-300 z-50 ${
            notification.type === 'error' ? 'bg-red-500 border-red-400 text-white' : 
            notification.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 
            'bg-brand-500 border-brand-400 text-white'
          }`}>
            <AlertCircle size={20} />
            <span className="text-sm font-bold tracking-tight">{notification.message}</span>
          </div>
        )}
      </main>

      {/* Timeline Footer */}
      <Timeline 
        frames={project.frames}
        currentFrameIndex={project.currentFrameIndex}
        onSelectFrame={(index) => setProject({ ...project, currentFrameIndex: index })}
        onAddFrame={addFrame}
        onDeleteFrame={deleteFrame}
        onDuplicateFrame={duplicateFrame}
        onReorderFrames={reorderFrames}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        fps={project.fps}
        setFps={(fps) => setProject({ ...project, fps })}
        onionSkinSettings={onionSkinSettings}
        setOnionSkinSettings={setOnionSkinSettings}
      />

      {/* Modals & Overlays */}
      <CharacterGenerator 
        isOpen={showAIGenerator} 
        onClose={() => setShowAIGenerator(false)} 
        onImport={(data) => handleImageImport(data, 'ai')}
      />
      
      <Sidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        onNewProject={() => {
          if (window.confirm("Start a new project? Current work will be lost.")) {
            setProject(INITIAL_PROJECT_STATE);
            setHistory([]);
            setHistoryIndex(-1);
          }
        }}
        onImportImage={handleLocalImageImport}
        onSaveProject={() => {
          const data = JSON.stringify(project);
          const blob = new Blob([data], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `project-${Date.now()}.animate`;
          a.click();
        }}
        onExportVideo={handleExportVideo}
        onSettings={() => setIsSettingsOpen(true)}
        onAbout={() => setIsAboutOpen(true)}
        onHelp={() => window.open('https://example.com/tutorials', '_blank')}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        width={project.width}
        height={project.height}
        onUpdateDimensions={(w, h) => setProject({ ...project, width: w, height: h })}
      />

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      
      <MusicModal 
        isOpen={isMusicOpen} 
        onClose={() => setIsMusicOpen(false)} 
        currentAudioUrl={project.audioUrl}
        onSelectAudio={(url) => setProject({ ...project, audioUrl: url })}
      />

      <EffectsModal 
        isOpen={isEffectsOpen} 
        onClose={() => setIsEffectsOpen(false)}
        onApplyEffect={(type, all) => {
          console.log("Apply pixel effect:", type, "to all:", all);
        }}
        onApplyDynamicEffect={(type, intensity, all) => {
          const newFrames = project.frames.map((f, i) => {
            if (all || i === project.currentFrameIndex) {
              const existing = f.effectsLayer.find(e => e.type === type);
              if (existing) return { ...f, effectsLayer: f.effectsLayer.filter(e => e.type !== type) };
              return { ...f, effectsLayer: [...f.effectsLayer, { type, intensity }] };
            }
            return f;
          });
          saveToHistory({ ...project, frames: newFrames });
        }}
      />

      {project.audioUrl && (
        <audio ref={audioRef} src={project.audioUrl} loop hidden />
      )}
    </div>
  );
};

export default App;
