import React, { useEffect } from 'react';
import { 
  X, 
  Disc, 
  Laptop, 
  FolderPlus, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  ArrowRight 
} from 'lucide-react';

/**
 * UploadTypeModal Component
 * 
 * A dark-themed modal allowing users to choose an upload source:
 * 1. Medical Imaging from CD
 * 2. Medical Imaging from Computer
 * 3. Other Documents from Computer or CD
 * 
 * @param {boolean} isOpen - Controls modal visibility (defaults to true)
 * @param {function} onClose - Callback triggered to close modal
 * @param {function} onSelect - Optional callback receiving selected type ('cd' | 'computer' | 'documents')
 */
export default function UploadTypeModal({ isOpen = true, onClose, onSelect }) {
  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCardClick = (type) => {
    if (onSelect) {
      onSelect(type);
    }
  };

  const imagingTags = ['MRI', 'CT', 'PET-CT', 'ULTRASOUND', 'X-RAY'];
  const documentTags = ['.PDF', '.DOC', '.DOCX', 'IMAGE', 'VIDEO'];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-4xl bg-[#111317] border border-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 text-left transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-800/80">
          <h2 
            id="upload-modal-title" 
            className="text-xl font-semibold text-white tracking-wide"
          >
            Upload files
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-800/80 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Structure */}
        <div className="mt-6 flex flex-col gap-4">
          
          {/* Top Row: 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card 1: Medical Imaging from CD */}
            <div
              onClick={() => handleCardClick('cd')}
              className="group relative flex flex-col justify-between bg-[#1a1c22] hover:bg-[#1f222a] border border-gray-700/50 hover:border-emerald-500/60 rounded-xl p-6 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-emerald-950/20"
            >
              <div>
                {/* Icon Composition */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform duration-200">
                    <Laptop size={22} className="text-emerald-400" />
                    <Disc size={15} className="absolute -bottom-1 -right-1 text-emerald-300 bg-[#1a1c22] rounded-full p-0.5 shadow-sm" />
                  </div>
                </div>

                {/* Sub-title */}
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  FROM CD
                </span>

                {/* Main Title */}
                <h3 className="text-white text-lg font-medium leading-snug mb-4 group-hover:text-emerald-300 transition-colors">
                  Upload medical imaging from a CD
                </h3>
              </div>

              {/* Tags Row */}
              <div className="flex flex-wrap gap-2 pt-2">
                {imagingTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded bg-[#23252b] text-gray-300 text-xs font-semibold tracking-wider uppercase border border-gray-700/40"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Card 2: Medical Imaging from Computer */}
            <div
              onClick={() => handleCardClick('computer')}
              className="group relative flex flex-col justify-between bg-[#1a1c22] hover:bg-[#1f222a] border border-gray-700/50 hover:border-emerald-500/60 rounded-xl p-6 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-emerald-950/20"
            >
              <div>
                {/* Icon: Window Mockup with FolderPlus */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex flex-col overflow-hidden text-emerald-400 group-hover:scale-105 transition-transform duration-200">
                    {/* Mockup title bar */}
                    <div className="h-3 bg-emerald-500/20 border-b border-emerald-500/20 flex items-center px-1.5 gap-1">
                      <div className="w-1 h-1 rounded-full bg-emerald-400/80"></div>
                      <div className="w-1 h-1 rounded-full bg-emerald-400/80"></div>
                      <div className="w-1 h-1 rounded-full bg-emerald-400/80"></div>
                    </div>
                    {/* Window content */}
                    <div className="flex-1 flex items-center justify-center">
                      <FolderPlus size={18} className="text-emerald-400" />
                    </div>
                  </div>
                </div>

                {/* Sub-title */}
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  FROM YOUR COMPUTER
                </span>

                {/* Main Title */}
                <h3 className="text-white text-lg font-medium leading-snug mb-4 group-hover:text-emerald-300 transition-colors">
                  Upload medical imaging from your computer
                </h3>
              </div>

              {/* Tags Row */}
              <div className="flex flex-wrap gap-2 pt-2">
                {imagingTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded bg-[#23252b] text-gray-300 text-xs font-semibold tracking-wider uppercase border border-gray-700/40"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Row: Full-width Card (Other Documents) */}
          <div
            onClick={() => handleCardClick('documents')}
            className="group relative flex flex-col sm:flex-row bg-[#1a1c22] hover:bg-[#1f222a] border border-gray-700/50 hover:border-blue-500/60 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 shadow-sm hover:shadow-blue-950/20"
          >
            {/* Left Content Area */}
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div>
                {/* Group of File Icons */}
                <div className="flex items-center mb-4">
                  <div className="flex items-center -space-x-1.5">
                    <div className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-blue-400 shadow-sm z-30 group-hover:-translate-y-0.5 transition-transform duration-200">
                      <FileText size={18} />
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-emerald-400 shadow-sm z-20 group-hover:-translate-y-0.5 transition-transform duration-200 delay-75">
                      <ImageIcon size={18} />
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-purple-400 shadow-sm z-10 group-hover:-translate-y-0.5 transition-transform duration-200 delay-150">
                      <Video size={18} />
                    </div>
                  </div>
                </div>

                {/* Sub-title */}
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  FROM YOUR COMPUTER
                </span>

                {/* Main Title */}
                <h3 className="text-white text-lg font-medium leading-snug mb-4 group-hover:text-blue-300 transition-colors">
                  Upload other documents from your computer or CD
                </h3>
              </div>

              {/* Tags Row */}
              <div className="flex flex-wrap gap-2 pt-2">
                {documentTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded bg-[#23252b] text-gray-300 text-xs font-semibold tracking-wider uppercase border border-gray-700/40"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Side Button Area (Distinct Dark Blue Container) */}
            <div className="sm:w-36 bg-[#162a4a] group-hover:bg-[#1a365d] border-t sm:border-t-0 sm:border-l border-blue-900/40 flex flex-col items-center justify-center p-6 transition-colors duration-200">
              <div className="flex flex-col items-center gap-2 group-hover:translate-x-1 transition-transform duration-200">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                  <ArrowRight size={20} className="text-blue-400" />
                </div>
                <span className="text-xs font-bold text-blue-400 tracking-wider uppercase">
                  UPLOAD
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
