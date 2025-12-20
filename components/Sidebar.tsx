
import React, { useRef } from 'react';
import { X, PlusSquare, HelpCircle, Info, Sliders, HardDrive, ImagePlus, ExternalLink, Film } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewProject: () => void;
  onImportImage: (file: File) => void; // Updated to accept a file
  onSaveProject: () => void;
  onExportVideo: () => void;
  onSettings: () => void;
  onAbout: () => void;
  onHelp: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onNewProject, 
  onImportImage,
  onSaveProject,
  onExportVideo,
  onSettings,
  onAbout,
  onHelp
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportImage(file);
      onClose();
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-dark-900 border-r border-gray-800 z-[70] transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-gray-800">
             <h2 className="font-bold text-lg text-white">Studio Menu</h2>
             <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors">
               <X size={20} />
             </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-4">
             <div className="flex flex-col px-2 gap-1">
                <button 
                  onClick={() => { onNewProject(); onClose(); }}
                  className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all text-left group"
                >
                  <PlusSquare size={20} className="text-brand-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">New Animation Project</span>
                </button>
                
                {/* Device Import Logic */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
                <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all text-left group"
                >
                  <ImagePlus size={20} className="text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Import Image Reference</span>
                </button>

                <div className="h-px bg-gray-800 my-2 mx-4" />

                <button 
                   onClick={() => { onSaveProject(); onClose(); }}
                   className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all text-left group"
                >
                  <HardDrive size={20} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Backup to Project File</span>
                </button>

                <button 
                   onClick={() => { onExportVideo(); onClose(); }}
                   className="flex items-center gap-3 px-4 py-3 text-brand-400 hover:bg-white/5 hover:text-brand-300 rounded-xl transition-all text-left font-semibold group"
                >
                  <Film size={20} className="group-hover:scale-110 transition-transform" />
                  <span>Render & Export Video</span>
                </button>
                
                <div className="h-px bg-gray-800 my-2 mx-4" />
                
                <button 
                  onClick={() => { onSettings(); onClose(); }}
                  className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all text-left group"
                >
                  <Sliders size={20} className="text-gray-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Studio Preferences</span>
                </button>
                
                <button 
                  onClick={() => { onHelp(); onClose(); }}
                  className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all text-left group"
                >
                  <HelpCircle size={20} className="text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="flex-1 font-medium">Help & Tutorials</span>
                  <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                
                <button 
                  onClick={() => { onAbout(); onClose(); }}
                  className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-all text-left group"
                >
                  <Info size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">About AniMate</span>
                </button>
             </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800 text-[10px] text-center text-gray-600 font-bold uppercase tracking-widest">
             AniMate Studio v1.0.0<br/>
             <span className="text-brand-500/50">Local Import Engine Active</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
