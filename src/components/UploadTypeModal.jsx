import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  X, 
  Disc, 
  Laptop, 
  FolderPlus, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { getApiUrl, getAuthToken } from '../api';

/**
 * UploadTypeModal Component
 * 
 * Dark-themed modal allowing users to choose an upload source:
 * 1. Medical Imaging from CD
 * 2. Medical Imaging from Computer
 * 3. Other Documents from Computer or CD
 * 
 * Features:
 * - Modal Overlay: Fixed full-screen with bg-black/80 and backdrop-blur-sm
 * - Main Container: Centered, bg-[#111317], rounded-xl, border-gray-800, max-w-4xl
 * - Header: "Upload files" (white, text-xl, font-semibold), 'X' close button
 * - Grid: 2 columns top row, 1 full-width card bottom row
 * - Card 1: Disc & Laptop (text-emerald-400), "FROM CD", "Upload medical imaging from a CD"
 * - Card 2: FolderPlus (text-emerald-400), "FROM YOUR COMPUTER", "Upload medical imaging from your computer"
 * - Card 3: FileText, Image, Video, "FROM YOUR COMPUTER", "Upload other documents from your computer or CD", right blue button bg-[#1a365d] "UPLOAD"
 * - Tags: bg-[#23252b] text-gray-400 text-xs px-2 py-1 uppercase rounded font-bold
 * - Authenticated Upload: Automatic JWT retrieval and Bearer header inclusion (fixes 401 error)
 * - Hidden file inputs for CD, computer, and documents
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback triggered to close modal
 * @param {function} onUploadSuccess - Callback triggered after successful upload with response data
 * @param {function} onSelect - Optional callback receiving selected type
 */
export default function UploadTypeModal({ 
  isOpen = true, 
  onClose, 
  onUploadSuccess,
  onSelect 
}) {
  const cdInputRef = useRef(null);
  const computerInputRef = useRef(null);
  const docsInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !uploading) {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, uploading]);

  if (!isOpen) return null;

  // Retrieve JWT token securely
  const getValidToken = () => {
    return (
      getAuthToken() ||
      localStorage.getItem('token') ||
      localStorage.getItem('cloudrad_token') ||
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('cloudrad_token') ||
      ''
    );
  };

  const handleFilesSelected = async (fileList, sourceType) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setErrorMessage('');
    setUploading(true);
    setUploadProgress(5);
    setStatusMessage(`Uploading ${files.length} file${files.length > 1 ? 's' : ''}...`);

    const token = getValidToken();

    // Critical check: if no token found, alert user clearly
    if (!token) {
      setUploading(false);
      setErrorMessage('بيانات الدخول غير متوفرة (JWT Token Missing). يرجى تسجيل الدخول أولاً للمتابعة.');
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    if (files.length === 1) {
      formData.append('file', files[0]);
    }
    formData.append('source_type', sourceType);

    try {
      const API_URL = getApiUrl();
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 90) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      setUploadProgress(100);
      setStatusMessage('Upload complete! Extracting metadata...');

      // Notify parent component
      setTimeout(() => {
        setUploading(false);
        onUploadSuccess?.(response.data);
        onClose?.();
      }, 500);

    } catch (err) {
      console.error('Upload request failed:', err);
      setUploading(false);
      setUploadProgress(0);

      const serverDetail = err.response?.data?.detail;
      if (err.response?.status === 401 || serverDetail === 'بيانات الدخول غير صالحة') {
        setErrorMessage('خطأ في المصادقة: بيانات الدخول غير صالحة أو انتهت صلاحية الجلسة. يرجى إعادة تسجيل الدخول.');
      } else if (err.response?.status === 413) {
        setErrorMessage('حجم الملفات كبير جداً. الحد الأقصى المسموح به هو 2GB.');
      } else {
        setErrorMessage(serverDetail || 'فشل رفع الملفات. يرجى التأكد من اتصال الخادم وإعادة المحاولة.');
      }
    } finally {
      // Reset input values so user can re-select the same file if needed
      if (cdInputRef.current) cdInputRef.current.value = '';
      if (computerInputRef.current) computerInputRef.current.value = '';
      if (docsInputRef.current) docsInputRef.current.value = '';
    }
  };

  const handleCardClick = (type) => {
    if (uploading) return;
    setErrorMessage('');
    onSelect?.(type);

    if (type === 'cd') {
      cdInputRef.current?.click();
    } else if (type === 'computer') {
      computerInputRef.current?.click();
    } else if (type === 'documents') {
      docsInputRef.current?.click();
    }
  };

  const imagingTags = ['MRI', 'CT', 'PET-CT', 'ULTRASOUND', 'X-RAY'];
  const documentTags = ['.PDF', '.DOC', '.DOCX', 'IMAGE', 'VIDEO'];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-200"
      onClick={uploading ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      {/* Hidden file inputs */}
      <input
        ref={cdInputRef}
        type="file"
        className="hidden"
        multiple
        webkitdirectory=""
        directory=""
        onChange={(e) => handleFilesSelected(e.target.files, 'cd')}
      />
      <input
        ref={computerInputRef}
        type="file"
        className="hidden"
        multiple
        accept=".dcm,.zip,.tar,.gz,image/*,application/dicom,*"
        onChange={(e) => handleFilesSelected(e.target.files, 'computer')}
      />
      <input
        ref={docsInputRef}
        type="file"
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx,image/*,video/*"
        onChange={(e) => handleFilesSelected(e.target.files, 'documents')}
      />

      {/* Modal Container */}
      <div 
        className="relative w-full max-w-4xl bg-[#111317] border border-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 text-left transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-800">
          <h2 
            id="upload-modal-title" 
            className="text-xl font-semibold text-white tracking-wide"
          >
            Upload files
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="text-gray-400 hover:text-white hover:bg-gray-800/80 p-2 rounded-lg transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mt-4 p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-start gap-3 animate-fadeIn">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">خطأ في الرفع</span>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-red-400 hover:text-red-200 p-1 rounded"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Upload Progress Banner */}
        {uploading && (
          <div className="mt-4 p-5 rounded-lg bg-[#1a1c22] border border-gray-700/80 space-y-3 animate-fadeIn">
            <div className="flex justify-between items-center text-sm">
              <span className="text-emerald-400 flex items-center gap-2 font-medium">
                <Loader2 size={16} className="animate-spin text-emerald-400" />
                {statusMessage || 'Processing upload...'}
              </span>
              <span className="text-gray-300 font-mono font-bold bg-[#23252b] px-2.5 py-0.5 rounded border border-gray-700">
                {uploadProgress}%
              </span>
            </div>
            <div className="w-full bg-[#111317] rounded-full h-2 overflow-hidden border border-gray-800">
              <div 
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Content Structure */}
        <div className="mt-6 flex flex-col gap-4">
          
          {/* Top Row: 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card 1: Medical Imaging from CD */}
            <div
              onClick={() => handleCardClick('cd')}
              className={`group relative flex flex-col justify-between bg-[#1a1c22] border border-gray-800 rounded-lg p-6 transition-all duration-200 shadow-sm ${
                uploading 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'hover:border-gray-600 cursor-pointer'
              }`}
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
                    className="bg-[#23252b] text-gray-400 text-xs px-2 py-1 uppercase rounded font-bold border border-gray-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Card 2: Medical Imaging from Computer */}
            <div
              onClick={() => handleCardClick('computer')}
              className={`group relative flex flex-col justify-between bg-[#1a1c22] border border-gray-800 rounded-lg p-6 transition-all duration-200 shadow-sm ${
                uploading 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'hover:border-gray-600 cursor-pointer'
              }`}
            >
              <div>
                {/* Icon: FolderPlus */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform duration-200">
                    <FolderPlus size={22} className="text-emerald-400" />
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
                    className="bg-[#23252b] text-gray-400 text-xs px-2 py-1 uppercase rounded font-bold border border-gray-800"
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
            className={`group relative flex flex-col sm:flex-row bg-[#1a1c22] border border-gray-800 rounded-lg overflow-hidden transition-all duration-200 shadow-sm ${
              uploading 
                ? 'opacity-60 cursor-not-allowed' 
                : 'hover:border-gray-600 cursor-pointer'
            }`}
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
                    className="bg-[#23252b] text-gray-400 text-xs px-2 py-1 uppercase rounded font-bold border border-gray-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Side Button Area (dark blue bg-[#1a365d]) */}
            <div className="sm:w-36 bg-[#1a365d] group-hover:bg-[#1e4274] border-t sm:border-t-0 sm:border-l border-blue-900/40 flex flex-col items-center justify-center p-6 transition-colors duration-200">
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
