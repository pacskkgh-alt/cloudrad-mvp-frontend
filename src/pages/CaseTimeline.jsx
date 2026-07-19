import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Share2, Mail, QrCode, Clock, UploadCloud, MessageSquare, FileImage, Download, ChevronLeft, ChevronRight } from 'lucide-react';

const CaseTimeline = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isExtracted, setIsExtracted] = useState(false);
  const [expiry, setExpiry] = useState("7 Days");

  // Simulated Resumable Chunk Upload (Cimar-inspired)
  const onDrop = useCallback((acceptedFiles) => {
    console.log("Accepted files:", acceptedFiles);
    // Simulation of resumable chunking mechanism
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExtracted(true); // Trigger PostDICOM extraction view upon completion
          return 100;
        }
        return prev + 15;
      });
    }, 400);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const patientData = {
    name: "John Doe", id: "PT-849201", age: "45", sex: "M", modality: "MRI Brain", studyDate: "2026-07-19"
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full space-y-8">
        
        {/* Cimar-Inspired Resumable Upload Zone */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <UploadCloud size={20}/> Upload DICOM (Folders or ZIP)
          </h3>
          <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'}`}>
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto text-gray-400 mb-4" size={40} />
            <p className="text-gray-700 font-medium text-lg">Drag & drop raw DICOM folders or ZIP files here</p>
            <p className="text-sm text-gray-400 mt-2">Chunked & Resumable transmission. Slices into 5MB chunks automatically.</p>
          </div>
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2 font-medium">
                <span>Uploading & Chunking...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <p className="text-xs text-center text-gray-400 mt-2">Network robust: Auto-resumes from last chunk if disconnected.</p>
            </div>
          )}
        </div>

        {/* Immediate PostDICOM Extraction Patient Card */}
        {isExtracted && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
              <div className="flex items-center gap-5">
                <div className="bg-indigo-100 text-indigo-700 p-5 rounded-full font-bold text-2xl shadow-inner">JD</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{patientData.name} <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">ID: {patientData.id}</span></h2>
                  <div className="mt-3 text-sm text-gray-700 flex flex-wrap gap-x-6 gap-y-2">
                    <span className="flex items-center gap-1"><span className="font-semibold text-gray-500">Age:</span> {patientData.age}</span>
                    <span className="flex items-center gap-1"><span className="font-semibold text-gray-500">Sex:</span> {patientData.sex}</span>
                    <span className="flex items-center gap-1"><span className="font-semibold text-gray-500">Modality:</span> <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-800">{patientData.modality}</span></span>
                    <span className="flex items-center gap-1"><span className="font-semibold text-gray-500">Study Date:</span> {patientData.studyDate}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">Metadata Extracted</span>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Mini-gallery / Carousel Preview */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><FileImage size={16}/> Study Preview Carousel</h4>
              <div className="relative group">
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar items-center">
                  {[1,2,3,4,5,6].map(thumb => (
                    <div key={thumb} className="snap-start min-w-[140px] h-[140px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all shadow-md overflow-hidden relative">
                       {/* Placeholder for DICOM Thumbnail */}
                       <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                       <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 rounded">Img {thumb}</div>
                    </div>
                  ))}
                </div>
                <button className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 bg-white shadow-md p-1.5 rounded-full text-gray-600 hover:text-blue-600 hidden group-hover:block"><ChevronLeft size={20}/></button>
                <button className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 bg-white shadow-md p-1.5 rounded-full text-gray-600 hover:text-blue-600 hidden group-hover:block"><ChevronRight size={20}/></button>
              </div>
            </div>
            
            <hr className="border-gray-100" />
            
            {/* PostDICOM Inspired Flexible Sharing Panel */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><Share2 size={16}/> Flexible Sharing Module</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                
                {/* WhatsApp Instant Share */}
                <a href={`https://wa.me/?text=Hello ${patientData.name}, your ${patientData.modality} study is ready. View it here: https://cloudrad.local/view/123`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 h-full rounded-xl bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/30 font-semibold text-sm">
                  <MessageSquare size={22} className="mb-2" />
                  WhatsApp
                </a>
                
                {/* Email Instant Share */}
                <a href={`mailto:?subject=Your Radiology Study is Ready&body=Hello ${patientData.name}, your ${patientData.modality} study is ready.%0D%0AView securely: https://cloudrad.local/view/123`} className="flex flex-col items-center justify-center p-3 h-full rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200 font-semibold text-sm">
                  <Mail size={22} className="mb-2" />
                  Email Study
                </a>
                
                {/* QR Code Printable Card Generator */}
                <button className="flex flex-col items-center justify-center p-3 h-full rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors border shadow-md font-semibold text-sm">
                  <QrCode size={22} className="mb-2" />
                  Print QR Badge
                </button>
                
                {/* Expiry Configurator */}
                <div className="h-full flex flex-col justify-end">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Link Expiry</label>
                  <div className="relative">
                    <select 
                      value={expiry} 
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full bg-white border-2 border-gray-200 text-gray-800 p-2.5 rounded-xl appearance-none text-sm focus:outline-none focus:border-blue-500 font-semibold shadow-sm transition-colors"
                    >
                      <option>7 Days</option>
                      <option>14 Days</option>
                      <option>Close Link</option>
                    </select>
                    <Clock size={16} className="absolute right-3 top-3 text-gray-400" pointerEvents="none"/>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default CaseTimeline;
