import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.167-233-227-144.nip.io';
import { 
  Share2, Mail, QrCode, Clock, UploadCloud, MessageSquare, 
  FileImage, ChevronRight,
  Search, Plus, LogOut, Settings, HelpCircle, Moon
} from 'lucide-react';

const CaseTimeline = ({ doctor, onLogout }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isExtracted, setIsExtracted] = useState(false);
  const [expiry, setExpiry] = useState("7 Days");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem('cloudrad_token');
        const res = await axios.get(`${API_URL}/api/studies`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCases(res.data);
      } catch (err) {
        console.error("Failed to fetch cases", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  // Simulated Resumable Chunk Upload (Cimar-inspired)
  const onDrop = useCallback((acceptedFiles) => {
    console.log("Accepted files:", acceptedFiles);
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExtracted(true);
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

  const userName = doctor?.name || "Dr. Demo";
  const userEmail = doctor?.email || "demo@cloudrad.app";

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-300 font-sans flex overflow-hidden">
      
      {/* 1. Persistent Left Sidebar */}
      <aside className="w-64 bg-[#0b0f19] border-r border-gray-800 flex flex-col hidden md:flex shrink-0">
        {/* User Identity Profile */}
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
            {userName.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-semibold text-white truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-6 px-4 space-y-8 overflow-y-auto">
          <nav className="space-y-1">
            <button className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md bg-blue-600/10 text-blue-400">
              <span>Cases</span>
              <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{cases.length}</span>
            </button>
            <button className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <span>Shared with me</span>
              <span className="bg-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded-full font-bold">3</span>
            </button>
          </nav>

          {/* Playlists & Tags Section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-3 group">
              <span className="text-[10px] font-bold tracking-widest text-gray-500">PLAYLISTS</span>
              <button className="text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"><Plus size={14}/></button>
            </div>
            <div className="px-3 text-sm text-gray-600 italic pb-2">No playlists added</div>
          </div>

          <div>
            <div className="flex items-center justify-between px-3 mb-3">
              <span className="text-[10px] font-bold tracking-widest text-gray-500">TAGS</span>
            </div>
            <div className="px-3 flex gap-2 flex-wrap">
              <span className="px-2 py-1 text-[10px] rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-widest font-bold">Urgent</span>
              <span className="px-2 py-1 text-[10px] rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-widest font-bold">Pending Review</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* 2. Top Navigation Bar (Navbar) */}
        <header className="h-16 bg-[#0b0f19] border-b border-gray-800 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
          <div className="flex items-center gap-8 h-full">
            <h1 className="text-xl font-black text-white tracking-widest uppercase md:hidden hidden sm:flex h-full items-center">CR</h1>
            <nav className="hidden sm:flex items-center space-x-6 text-sm font-medium h-full">
              <span className="text-white border-b-2 border-blue-500 h-full flex items-center cursor-pointer">Cases</span>
              <span className="text-gray-400 hover:text-gray-200 h-full flex items-center border-b-2 border-transparent cursor-pointer transition-colors">Assessments</span>
              <span className="text-gray-400 hover:text-gray-200 h-full flex items-center border-b-2 border-transparent cursor-pointer transition-colors">Account</span>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setShowUploadModal(true)} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all">
              <UploadCloud size={16} />
              Upload
            </button>
            
            <div className="h-6 w-px bg-gray-800 hidden sm:block mx-1"></div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-500 hidden lg:block mr-2">{userEmail}</span>
              <button className="text-gray-500 hover:text-white p-1.5 rounded-md hover:bg-gray-800 transition-colors" title="Settings" onClick={() => alert("Settings module is coming soon!")}><Settings size={18}/></button>
              <button className="text-gray-500 hover:text-white p-1.5 rounded-md hover:bg-gray-800 transition-colors" title="Theme" onClick={() => alert("Theme switching is currently disabled.")}><Moon size={18}/></button>
              <button className="text-gray-500 hover:text-white p-1.5 rounded-md hover:bg-gray-800 transition-colors" title="Help" onClick={() => alert("Help and support documentation will be available here.")}><HelpCircle size={18}/></button>
              <button onClick={onLogout} className="text-rose-500 hover:text-rose-400 p-1.5 rounded-md hover:bg-rose-500/10 ml-1 transition-colors" title="Logout"><LogOut size={18}/></button>
            </div>
          </div>
        </header>

        {/* 3. Center-Right Main Workspace Ledger */}
        <div className="flex-1 flex flex-col bg-[#05070c] relative">
          {/* Search & Filter Header */}
          <div className="p-6 shrink-0">
            <div className="relative max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Find..." 
                className="w-full bg-[#111827] border border-gray-800 text-gray-200 rounded-lg py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium placeholder-gray-600"
              />
            </div>
          </div>

          {/* Main Grid/Table Layout */}
          <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col">
            <div className="border border-gray-800 rounded-xl overflow-hidden bg-[#0b0f19] flex-1 flex flex-col shadow-2xl">
              {/* Table Header */}
              <div className="grid grid-cols-3 border-b border-gray-800 bg-[#0d1321] p-4 text-[11px] font-bold text-gray-500 tracking-widest shrink-0">
                <div className="flex items-center gap-1 cursor-pointer hover:text-gray-300">DESCRIPTION <ChevronRight size={12} className="rotate-90"/></div>
                <div className="flex items-center gap-1 cursor-pointer hover:text-gray-300">MODALITY <ChevronRight size={12} className="rotate-90"/></div>
                <div className="flex items-center gap-1 cursor-pointer hover:text-gray-300">DATE <ChevronRight size={12} className="rotate-90"/></div>
              </div>
              
              {/* Empty State / Cases List */}
              {loading ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                   <p className="text-lg font-medium text-gray-400">Loading cases...</p>
                 </div>
              ) : cases.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <FileImage size={48} className="mb-4 text-gray-800" strokeWidth={1} />
                  <p className="text-lg font-medium text-gray-400">No cases found</p>
                  <p className="text-sm mt-1 text-gray-600">Your uploaded radiological cases will appear here.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {cases.map((c) => (
                    <div key={c.id} className="grid grid-cols-3 border-b border-gray-800 p-4 text-sm font-medium text-gray-300 hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => alert(`Ready to view case ${c.id}: ${c.patient_name}`)}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-900/30 text-blue-400 flex items-center justify-center font-bold text-xs">{c.patient_name ? c.patient_name.charAt(0) : '?'}</div>
                        <div className="flex flex-col">
                           <span className="text-gray-200">{c.patient_name || 'Unknown Patient'}</span>
                           <span className="text-xs text-gray-500">{c.patient_id_number || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center"><span className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs font-bold text-gray-300">{c.modality || 'UNKNOWN'}</span></div>
                      <div className="flex items-center text-gray-400">{c.study_date ? new Date(c.study_date).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal / Extracted Patient Card Overlays */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl space-y-6 my-8">
            <div className="flex justify-end relative z-10 w-full">
               <button onClick={() => {setShowUploadModal(false); setIsExtracted(false); setUploadProgress(0);}} className="text-gray-400 bg-gray-900 rounded-full hover:text-white hover:bg-gray-800 w-10 h-10 flex border border-gray-800 items-center justify-center shadow-lg transition-colors">&times;</button>
            </div>
            
            {/* Cimar-Inspired Resumable Upload Zone */}
            {!isExtracted && (
              <div className="bg-[#0b0f19] border border-gray-800 p-8 md:p-12 rounded-2xl shadow-2xl relative -mt-10">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><UploadCloud size={24}/></span>
                  Upload DICOM (Folders or ZIP)
                </h3>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${isDragActive ? 'border-blue-500 bg-blue-900/10' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'}`}>
                  <input {...getInputProps()} />
                  <UploadCloud className={`mx-auto mb-4 transition-colors ${isDragActive ? 'text-blue-500' : 'text-gray-600'}`} size={48} />
                  <p className="text-gray-300 font-medium text-lg">Drag & drop raw DICOM folders or ZIP files here</p>
                  <p className="text-sm text-gray-500 mt-2">Chunked & Resumable transmission. Slices into 5MB chunks automatically.</p>
                </div>
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-8">
                    <div className="flex justify-between text-sm text-gray-400 mb-2 font-medium">
                      <span className="text-blue-400 flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div> Uploading & Chunking...</span>
                      <span className="text-white bg-gray-800 px-2 py-0.5 rounded font-mono">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-500 h-2 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.8)] relative" style={{ width: `${uploadProgress}%` }}>
                        <div className="absolute inset-0 bg-white/20 w-full"></div>
                      </div>
                    </div>
                    <p className="text-xs text-center text-gray-500 mt-3">Network robust: Auto-resumes from last chunk if disconnected.</p>
                  </div>
                )}
              </div>
            )}

            {/* Immediate PostDICOM Extraction Patient Card */}
            {isExtracted && (
              <div className="bg-[#0b0f19] border border-gray-800 rounded-2xl shadow-2xl p-8 space-y-8 relative -mt-10">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex items-center gap-5">
                    <div className="bg-blue-900/30 text-blue-400 p-5 rounded-xl font-bold text-2xl shadow-inner border border-blue-800/50 flex items-center justify-center w-16 h-16">JD</div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        {patientData.name} 
                        <span className="text-xs font-bold text-blue-400 bg-blue-900/30 px-2.5 py-1 rounded border border-blue-800/50 tracking-wider">ID: {patientData.id}</span>
                      </h2>
                      <div className="mt-2 text-sm text-gray-400 flex flex-wrap gap-x-6 gap-y-2 font-medium">
                        <span className="flex items-center gap-1.5"><span className="text-gray-500">Age:</span> <span className="text-gray-200">{patientData.age}</span></span>
                        <span className="flex items-center gap-1.5"><span className="text-gray-500">Sex:</span> <span className="text-gray-200">{patientData.sex}</span></span>
                        <span className="flex items-center gap-1.5"><span className="text-gray-500">Modality:</span> <span className="bg-gray-800 border border-gray-700 px-2 py-0.5 rounded text-gray-200 font-bold">{patientData.modality}</span></span>
                        <span className="flex items-center gap-1.5"><span className="text-gray-500">Date:</span> <span className="text-gray-200">{patientData.studyDate}</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end w-full md:w-auto">
                    <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded text-xs font-bold border border-emerald-500/20 flex items-center gap-2 uppercase tracking-wide"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_rgba(52,211,153,1)]"></span> Extracted</span>
                  </div>
                </div>

                <hr className="border-gray-800" />

                {/* Mini-gallery / Carousel Preview */}
                <div>
                  <h4 className="text-[11px] font-bold text-gray-500 mb-4 flex items-center gap-2 tracking-widest uppercase"><FileImage size={14}/> Image Gallery</h4>
                  <div className="relative group">
                    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar items-center">
                      {[1,2,3,4,5,6].map(thumb => (
                        <div key={thumb} className="flex-shrink-0 w-[140px] h-[140px] bg-[#05070c] border border-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all shadow-lg overflow-hidden relative group/item">
                           <svg className="w-10 h-10 text-gray-800 group-hover/item:text-blue-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                           <div className="absolute bottom-2 right-2 bg-black text-gray-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-800">IMG {thumb}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <hr className="border-gray-800" />
                
                {/* PostDICOM Inspired Flexible Sharing Panel */}
                <div>
                  <h4 className="text-[11px] font-bold text-gray-500 mb-4 flex items-center gap-2 tracking-widest uppercase"><Share2 size={14}/> Collaboration & Sharing</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <a href={`https://wa.me/?text=Hello ${patientData.name}, your ${patientData.modality} study is ready. View it here: https://cloudrad.local/view/123`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-4 h-full rounded-lg bg-gray-900/50 text-gray-300 hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]/30 transition-all border border-gray-800 font-semibold text-sm group">
                      <MessageSquare size={20} className="mb-2 text-gray-500 group-hover:text-[#25D366] transition-colors" />
                      WhatsApp
                    </a>
                    <a href={`mailto:?subject=Your Radiology Study is Ready&body=Hello ${patientData.name}, your ${patientData.modality} study is ready.%0D%0AView securely: https://cloudrad.local/view/123`} className="flex flex-col items-center justify-center p-4 h-full rounded-lg bg-gray-900/50 text-gray-300 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 transition-all border border-gray-800 font-semibold text-sm group">
                      <Mail size={20} className="mb-2 text-gray-500 group-hover:text-blue-400 transition-colors" />
                      Email Link
                    </a>
                    <button className="flex flex-col items-center justify-center p-4 h-full rounded-lg bg-gray-900/50 text-gray-300 hover:bg-gray-800 hover:text-white transition-all border border-gray-800 font-semibold text-sm group">
                      <QrCode size={20} className="mb-2 text-gray-500 group-hover:text-white transition-colors" />
                      Print Badge
                    </button>
                    <div className="h-full flex flex-col justify-end">
                      <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest pl-1">Expirable Token</label>
                      <div className="relative">
                        <select 
                          value={expiry} 
                          onChange={(e) => setExpiry(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-800 text-gray-300 p-3.5 rounded-lg appearance-none text-sm focus:outline-none focus:border-blue-500 font-semibold transition-colors shadow-inner"
                        >
                          <option>7 Days Activity</option>
                          <option>14 Days Activity</option>
                          <option>Close Immediately</option>
                        </select>
                        <Clock size={16} className="absolute right-4 top-4 text-gray-600" pointerEvents="none"/>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseTimeline;
