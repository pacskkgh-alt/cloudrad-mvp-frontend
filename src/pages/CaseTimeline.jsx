import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.167-233-227-144.nip.io';
import { 
  Share2, Mail, QrCode, Clock, UploadCloud, MessageSquare, 
  FileImage, ChevronRight,
  Search, Plus, LogOut, Settings, HelpCircle, Moon, Trash2, ShieldAlert, Check, Copy, Link as LinkIcon
} from 'lucide-react';

const CaseTimeline = ({ doctor, onLogout }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isExtracted, setIsExtracted] = useState(false);
  const [expiry, setExpiry] = useState("7 Days");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('cases');
  const [theme, setTheme] = useState('dark');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [patientData, setPatientData] = useState(null);
  const [linkPasscode, setLinkPasscode] = useState('');
  const [generatedToken, setGeneratedToken] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

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

  useEffect(() => {
    fetchCases();
  }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    try {
      setUploadProgress(0);
      setGeneratedToken(null);
      setLinkPasscode('');
      const token = localStorage.getItem('cloudrad_token');
      const formData = new FormData();
      formData.append('file', acceptedFiles[0]);
      
      const res = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: (pe) => setUploadProgress(Math.round((pe.loaded * 100) / pe.total))
      });
      setUploadProgress(100);
      setPatientData({
         name: res.data.metadata.patient_name || 'Unknown Patient',
         id: res.data.study_id,
         age: res.data.metadata.patient_age || '?',
         sex: typeof res.data.metadata.patient_gender === 'string' ? res.data.metadata.patient_gender.charAt(0) : 'U',
         modality: res.data.metadata.modality || 'UNKNOWN',
         studyDate: res.data.metadata.study_date ? new Date(res.data.metadata.study_date).toLocaleDateString() : 'N/A',
         instances_count: res.data.metadata.instances_count || 0
      });
      setIsExtracted(true);
      fetchCases();
    } catch (err) {
      alert(err.response?.data?.detail || "Upload failed");
      setUploadProgress(0);
      setIsExtracted(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleDiscard = async () => {
      if(!window.confirm("Delete this case from the database permanently?")) return;
      try {
         const token = localStorage.getItem('cloudrad_token');
         await axios.delete(`${API_URL}/api/studies/${patientData.id}`, {
            headers: { Authorization: `Bearer ${token}` }
         });
         setShowUploadModal(false);
         setIsExtracted(false);
         setPatientData(null);
         fetchCases();
      } catch(err) {
         alert("Delete Failed: " + (err.response?.data?.detail || err.message));
      }
  };

  const deleteStudy = async (studyId) => {
      if(!window.confirm("Are you sure you want to delete this study? This action cannot be undone.")) return;
      try {
         const token = localStorage.getItem('cloudrad_token');
         await axios.delete(`${API_URL}/api/studies/${studyId}`, {
            headers: { Authorization: `Bearer ${token}` }
         });
         fetchCases();
      } catch(err) {
         alert("Delete Failed: " + (err.response?.data?.detail || err.message));
      }
  };

  const openShareModal = (study) => {
      setPatientData({
         id: study.id,
         name: study.patient_name || 'Unknown Patient',
         modality: study.modality || 'UNKNOWN'
      });
      setGeneratedToken(null);
      setLinkPasscode('');
      setShowShareModal(true);
  };

  const generateLink = async () => {
    setIsGenerating(true);
    try {
       const token = localStorage.getItem('cloudrad_token');
       let days = 7;
       if (expiry === "14 Days Activity") days = 14;
       if (expiry === "Close Immediately") days = 0;
       
       const res = await axios.post(`${API_URL}/api/links/`, {
          study_id: patientData.id,
          duration_days: days,
          passcode: linkPasscode || null
       }, { headers: { Authorization: `Bearer ${token}` }});
       setGeneratedToken(res.data.token);
    } catch(err) {
       alert("Error creating link: " + (err.response?.data?.detail || err.message));
    } finally {
       setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
     if(!generatedToken) return;
     navigator.clipboard.writeText(`${window.location.origin}/view/${generatedToken}`);
     setCopiedKey(true);
     setTimeout(()=>setCopiedKey(false), 2000);
  };

  const userName = doctor?.name || "Dr. Demo";
  const userEmail = doctor?.email || "demo@cloudrad.app";

  return (
    <div className={`min-h-screen text-gray-300 font-sans flex overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0b0f19]' : 'bg-[#1f2937]'}`}>
      
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
            <button onClick={() => setActiveTab('cases')} className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'cases' ? 'bg-blue-600/10 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <span>Cases</span>
              <span className={`${activeTab === 'cases' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'} text-[10px] px-2 py-0.5 rounded-full font-bold`}>{cases.length}</span>
            </button>
            <button onClick={() => setActiveTab('shared')} className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'shared' ? 'bg-blue-600/10 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <span>Shared with me</span>
              <span className={`${activeTab === 'shared' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'} text-[10px] px-2 py-0.5 rounded-full font-bold`}>3</span>
            </button>
          </nav>

          {/* Playlists & Tags Section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-3 group">
              <span className="text-[10px] font-bold tracking-widest text-gray-500">PLAYLISTS</span>
              <button onClick={() => prompt('Enter new playlist name:')} className="text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"><Plus size={14}/></button>
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
              <span onClick={() => setActiveTab('cases')} className={`h-full flex items-center border-b-2 cursor-pointer transition-colors ${activeTab === 'cases' ? 'text-white border-blue-500' : 'text-gray-400 hover:text-gray-200 border-transparent'}`}>Cases</span>
              <span onClick={() => setActiveTab('assessments')} className={`h-full flex items-center border-b-2 cursor-pointer transition-colors ${activeTab === 'assessments' ? 'text-white border-blue-500' : 'text-gray-400 hover:text-gray-200 border-transparent'}`}>Assessments</span>
              <span onClick={() => setActiveTab('account')} className={`h-full flex items-center border-b-2 cursor-pointer transition-colors ${activeTab === 'account' ? 'text-white border-blue-500' : 'text-gray-400 hover:text-gray-200 border-transparent'}`}>Account</span>
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
              <button className="text-gray-500 hover:text-white p-1.5 rounded-md hover:bg-gray-800 transition-colors" title="Settings" onClick={() => setShowSettingsModal(true)}><Settings size={18}/></button>
              <button className="text-gray-500 hover:text-white p-1.5 rounded-md hover:bg-gray-800 transition-colors" title="Theme" onClick={() => setTheme(theme === 'dark' ? 'dim' : 'dark')}><Moon size={18}/></button>
              <button className="text-gray-500 hover:text-white p-1.5 rounded-md hover:bg-gray-800 transition-colors" title="Help" onClick={() => setShowHelpModal(true)}><HelpCircle size={18}/></button>
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
            <div className={`border border-gray-800 rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-[#0b0f19]' : 'bg-[#111827]'} flex-1 flex flex-col shadow-2xl`}>
              {activeTab === 'cases' && (
                <>
                  {/* Table Header */}
                  <div className={`grid grid-cols-12 border-b border-gray-800 ${theme==='dark'?'bg-[#0d1321]':'bg-[#1f2937]'} p-4 text-[11px] font-bold text-gray-500 tracking-widest shrink-0`}>
                    <div className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-gray-300">DESCRIPTION <ChevronRight size={12} className="rotate-90"/></div>
                    <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-300">MODALITY <ChevronRight size={12} className="rotate-90"/></div>
                    <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-300">IMAGES <ChevronRight size={12} className="rotate-90"/></div>
                    <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-300">REPORT <ChevronRight size={12} className="rotate-90"/></div>
                    <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-300">DATE <ChevronRight size={12} className="rotate-90"/></div>
                    <div className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-gray-300 justify-end">ACTIONS</div>
                  </div>
                  
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
                        <div key={c.id} className="grid grid-cols-12 border-b border-gray-800 p-4 text-sm font-medium text-gray-300 hover:bg-gray-800/50 transition-colors cursor-pointer group">
                          <div className="col-span-3 flex items-center gap-3" onClick={() => window.open(`${window.location.origin}/view/${c.id}`, '_blank')}>
                            <div className="w-8 h-8 rounded bg-blue-900/30 text-blue-400 flex items-center justify-center font-bold text-xs">{c.patient_name ? c.patient_name.charAt(0) : '?'}</div>
                            <div className="flex flex-col">
                               <span className="text-gray-200">{c.patient_name || 'Unknown Patient'}</span>
                               <span className="text-xs text-gray-500">{c.patient_id_number || 'N/A'}</span>
                            </div>
                          </div>
                          
                          <div className="col-span-2 flex items-center" onClick={() => window.open(`${window.location.origin}/view/${c.id}`, '_blank')}>
                            <span className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs font-bold text-gray-300">{c.modality || 'UNKNOWN'}</span>
                          </div>
                          
                          <div className="col-span-2 flex items-center gap-2" onClick={() => window.open(`${window.location.origin}/view/${c.id}`, '_blank')}>
                            <FileImage size={14} className="text-gray-500" />
                            <span>{c.instances_count || 0}</span>
                          </div>
                          
                          <div className="col-span-2 flex items-center" onClick={() => window.open(`${window.location.origin}/view/${c.id}`, '_blank')}>
                            {c.has_report ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Report Ready</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700 text-xs font-bold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>No Report</span>
                            )}
                          </div>
                          
                          <div className="col-span-2 flex items-center text-gray-400" onClick={() => window.open(`${window.location.origin}/view/${c.id}`, '_blank')}>
                            {c.study_date ? new Date(c.study_date).toLocaleDateString() : 'N/A'}
                          </div>
                          
                          <div className="col-span-1 flex items-center justify-end gap-2">
                            <button onClick={(e) => { e.stopPropagation(); openShareModal(c); }} className="p-1.5 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded transition-colors" title="Share Case"><Share2 size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteStudy(c.id); }} className="p-1.5 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded transition-colors" title="Delete Case"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'shared' && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <Share2 size={48} className="mb-4 text-gray-800" strokeWidth={1} />
                  <p className="text-lg font-medium text-gray-400">No Shared Cases</p>
                  <p className="text-sm mt-1 text-gray-600">Cases shared with you will appear here.</p>
                </div>
              )}

              {activeTab === 'assessments' && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <Clock size={48} className="mb-4 text-gray-800" strokeWidth={1} />
                  <p className="text-lg font-medium text-gray-400">No Pending Assessments</p>
                  <p className="text-sm mt-1 text-gray-600">Pending tasks and studies requiring reports will appear here.</p>
                </div>
              )}

              {activeTab === 'account' && (
                <div className="flex-1 flex flex-col p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">Account Profile</h2>
                  <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-6 max-w-2xl">
                    <div className="flex items-center gap-6 mb-8 border-b border-gray-800 pb-6">
                      <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                        {userName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{userName}</h3>
                        <p className="text-gray-400">{userEmail}</p>
                        <span className="inline-block mt-2 px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold rounded uppercase tracking-wider">Active</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                       <div className="grid grid-cols-3 text-sm border-b border-gray-800 pb-2">
                         <span className="text-gray-500 font-bold">Role</span>
                         <span className="col-span-2 text-gray-200 uppercase">{doctor?.role || 'Doctor'}</span>
                       </div>
                       <div className="grid grid-cols-3 text-sm pb-2">
                         <span className="text-gray-500 font-bold">Clinic Identifier</span>
                         <span className="col-span-2 text-gray-200">{doctor?.clinic_id || 'System Base'}</span>
                       </div>
                    </div>
                  </div>
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
                        {patientData.instances_count !== undefined && (
                           <span className="flex items-center gap-1.5"><span className="text-gray-500 text-xs flex items-center"><FileImage size={12} className="mr-1"/> Images:</span> <span className="text-green-400 font-bold">{patientData.instances_count}</span></span>
                        )}
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
                  <div className="flex justify-between items-center mb-4">
                     <h4 className="text-[11px] font-bold text-gray-500 flex items-center gap-2 tracking-widest uppercase"><Share2 size={14}/> Collaboration & Sharing</h4>
                     <button onClick={handleDiscard} className="text-rose-500 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-2"><Trash2 size={14}/> Discard Case</button>
                  </div>
                  
                  {!generatedToken ? (
                     <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
                        <div className="flex w-full gap-4">
                           <div className="flex-1 relative">
                              <select 
                                 value={expiry} 
                                 onChange={(e) => setExpiry(e.target.value)}
                                 className="w-full bg-[#0b0f19] border border-gray-700 text-gray-300 p-3.5 rounded-lg appearance-none text-sm focus:outline-none focus:border-blue-500 font-semibold"
                              >
                                 <option>7 Days Activity</option>
                                 <option>14 Days Activity</option>
                                 <option>Close Immediately</option>
                              </select>
                              <Clock size={16} className="absolute right-4 top-4 text-gray-600" pointerEvents="none"/>
                              <label className="absolute -top-2 left-3 bg-[#0b0f19] px-1 text-[10px] uppercase font-bold text-gray-500">Token Expiry</label>
                           </div>
                           <div className="flex-1 relative">
                              <input 
                                 type="text" 
                                 value={linkPasscode}
                                 onChange={(e) => setLinkPasscode(e.target.value)}
                                 placeholder="Optional Passcode"
                                 className="w-full bg-[#0b0f19] border border-gray-700 text-gray-300 p-3.5 rounded-lg text-sm focus:outline-none focus:border-blue-500 font-semibold"
                              />
                              <ShieldAlert size={16} className="absolute right-4 top-4 text-gray-600" pointerEvents="none"/>
                              <label className="absolute -top-2 left-3 bg-[#0b0f19] px-1 text-[10px] uppercase font-bold text-gray-500">Access Control</label>
                           </div>
                        </div>
                        <button onClick={generateLink} disabled={isGenerating} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold p-3.5 rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2">
                           {isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <LinkIcon size={18}/>}
                           Save Case & Generate Secure Link
                        </button>
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onClick={copyToClipboard} className={`flex flex-col items-center justify-center p-4 h-full rounded-lg transition-all border font-semibold text-sm group ${copiedKey ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500 shadow-lg'}`}>
                           {copiedKey ? <Check size={20} className="mb-2" /> : <Copy size={20} className="mb-2" />}
                           {copiedKey ? 'Link Copied!' : 'Copy Secure Link'}
                        </button>
                        <a href={`https://wa.me/?text=${encodeURIComponent(`Hello ${patientData.name}, your ${patientData.modality} study is ready. View it here: ${window.location.origin}/view/${generatedToken} ${linkPasscode ? `(Passcode: ${linkPasscode})` : ''}`)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-4 h-full rounded-lg bg-gray-900/50 text-gray-300 hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]/30 transition-all border border-gray-800 font-semibold text-sm group">
                           <MessageSquare size={20} className="mb-2 text-gray-500 group-hover:text-[#25D366] transition-colors" />
                           WhatsApp
                        </a>
                        <a href={`mailto:?subject=Your Radiology Study is Ready&body=${encodeURIComponent(`Hello ${patientData.name}, your ${patientData.modality} study is ready.\nView securely: ${window.location.origin}/view/${generatedToken} \n${linkPasscode ? `(Passcode: ${linkPasscode})` : ''}`)}`} className="flex flex-col items-center justify-center p-4 h-full rounded-lg bg-gray-900/50 text-gray-300 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 transition-all border border-gray-800 font-semibold text-sm group">
                           <Mail size={20} className="mb-2 text-gray-500 group-hover:text-blue-400 transition-colors" />
                           Email Link
                        </a>
                     </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md ${theme === 'dark' ? 'bg-[#111827]' : 'bg-[#1f2937]'} border border-gray-800 p-8 rounded-2xl shadow-2xl relative`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Settings size={20}/> User Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Display Name</label>
                 <input type="text" defaultValue={userName} className="w-full bg-[#0b0f19] border border-gray-800 rounded p-3 text-white focus:border-blue-500 outline-none" />
              </div>
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Notifications</label>
                 <select className="w-full bg-[#0b0f19] border border-gray-800 rounded p-3 text-white focus:border-blue-500 outline-none">
                    <option>All events</option>
                    <option>Urgent only</option>
                    <option>None</option>
                 </select>
              </div>
              <button onClick={() => {alert('Preferences saved'); setShowSettingsModal(false);}} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg mt-4 transition-colors">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md ${theme === 'dark' ? 'bg-[#111827]' : 'bg-[#1f2937]'} border border-gray-800 p-8 rounded-2xl shadow-2xl relative`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><HelpCircle size={20}/> Help & Support</h3>
              <button onClick={() => setShowHelpModal(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            <p className="text-sm text-gray-400 mb-6">If you need technical assistance with CloudRad PACS, you can access the documentation or contact our 24/7 technical team.</p>
            <div className="space-y-3">
              <a href={`mailto:tech@cloudrad.com`} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"><Mail size={16}/> Email tech@cloudrad.com</a>
              <button onClick={() => setShowHelpModal(false)} className="w-full border border-gray-700 hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Share Only Modal */}
      {showShareModal && patientData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-2xl ${theme === 'dark' ? 'bg-[#0b0f19]' : 'bg-[#111827]'} border border-gray-800 p-8 rounded-2xl shadow-2xl relative`}>
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Share2 size={20} className="text-blue-500"/> Share Study</h3>
                <button onClick={() => {setShowShareModal(false); setPatientData(null);}} className="text-gray-400 hover:text-white bg-gray-900 rounded-full w-8 h-8 flex items-center justify-center border border-gray-800">&times;</button>
             </div>
             
             <div className="mb-6 p-4 bg-gray-900/50 rounded-xl border border-gray-800 flex items-center gap-4">
               <div className="bg-blue-900/30 text-blue-400 w-12 h-12 rounded-lg font-bold flex items-center justify-center border border-blue-800/50">
                  {patientData.name.charAt(0)}
               </div>
               <div>
                  <h4 className="text-gray-200 font-bold">{patientData.name}</h4>
                  <p className="text-xs text-gray-500">ID: {patientData.id} &bull; Modality: {patientData.modality}</p>
               </div>
             </div>

             {!generatedToken ? (
                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl flex flex-col space-y-4">
                  <div className="flex w-full gap-4">
                     <div className="flex-1 relative">
                        <select 
                           value={expiry} 
                           onChange={(e) => setExpiry(e.target.value)}
                           className="w-full bg-[#0b0f19] border border-gray-700 text-gray-300 p-3.5 rounded-lg appearance-none text-sm focus:outline-none focus:border-blue-500 font-semibold"
                        >
                           <option>7 Days Activity</option>
                           <option>14 Days Activity</option>
                           <option>Close Immediately</option>
                        </select>
                        <Clock size={16} className="absolute right-4 top-4 text-gray-600" pointerEvents="none"/>
                        <label className="absolute -top-2 left-3 bg-[#0b0f19] px-1 text-[10px] uppercase font-bold text-gray-500">Token Expiry</label>
                     </div>
                     <div className="flex-1 relative">
                        <input 
                           type="text" 
                           value={linkPasscode}
                           onChange={(e) => setLinkPasscode(e.target.value)}
                           placeholder="Optional Passcode"
                           className="w-full bg-[#0b0f19] border border-gray-700 text-gray-300 p-3.5 rounded-lg text-sm focus:outline-none focus:border-blue-500 font-semibold"
                        />
                        <ShieldAlert size={16} className="absolute right-4 top-4 text-gray-600" pointerEvents="none"/>
                        <label className="absolute -top-2 left-3 bg-[#0b0f19] px-1 text-[10px] uppercase font-bold text-gray-500">Access Control</label>
                     </div>
                  </div>
                  <button onClick={generateLink} disabled={isGenerating} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold p-3.5 rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2">
                     {isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <LinkIcon size={18}/>}
                     Generate Secure Link
                  </button>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <button onClick={copyToClipboard} className={`flex flex-col items-center justify-center p-4 h-32 rounded-lg transition-all border font-semibold text-sm group ${copiedKey ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500 shadow-lg'}`}>
                      {copiedKey ? <Check size={24} className="mb-3" /> : <Copy size={24} className="mb-3" />}
                      {copiedKey ? 'Link Copied!' : 'Copy Secure Link'}
                   </button>
                   <a href={`https://wa.me/?text=${encodeURIComponent(`Hello ${patientData.name}, your ${patientData.modality} study is ready. View it here: ${window.location.origin}/view/${generatedToken} ${linkPasscode ? `(Passcode: ${linkPasscode})` : ''}`)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-4 h-32 rounded-lg bg-gray-900/50 text-gray-300 hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]/30 transition-all border border-gray-800 font-semibold text-sm group">
                      <MessageSquare size={24} className="mb-3 text-gray-500 group-hover:text-[#25D366] transition-colors" />
                      WhatsApp
                   </a>
                   <a href={`mailto:?subject=Your Radiology Study is Ready&body=${encodeURIComponent(`Hello ${patientData.name}, your ${patientData.modality} study is ready.\nView securely: ${window.location.origin}/view/${generatedToken} \n${linkPasscode ? `(Passcode: ${linkPasscode})` : ''}`)}`} className="flex flex-col items-center justify-center p-4 h-32 rounded-lg bg-gray-900/50 text-gray-300 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 transition-all border border-gray-800 font-semibold text-sm group">
                      <Mail size={24} className="mb-3 text-gray-500 group-hover:text-blue-400 transition-colors" />
                      Email Link
                   </a>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseTimeline;
