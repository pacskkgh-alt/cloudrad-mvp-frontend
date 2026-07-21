import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { 
  Share2, Mail, QrCode, Clock, CloudUpload, MessageSquare, 
  FileImage, ChevronRight,
  Search, Plus, LogOut, Settings, HelpCircle, Trash2, ShieldAlert, Check, Copy, Link as LinkIcon,
  Menu, Users, Target, Inbox, Trash, UserPlus, Video, Bell, MessageCircle, Calendar, Filter, Folder, MoreVertical
} from 'lucide-react';

const CaseTimeline = ({ doctor, onLogout }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal Overlays
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isExtracted, setIsExtracted] = useState(false);
  const [patientData, setPatientData] = useState(null);
  
  // Link Generation State
  const [expiry, setExpiry] = useState('7 Days Activity');
  const [linkPasscode, setLinkPasscode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const host = window.location.hostname;
      const apiUrl = host === 'localhost' || host === '127.0.0.1' 
        ? 'http://127.0.0.1:8000/api/studies' 
        : 'https://backend.cloudrad.app/api/studies';

      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': 'Basic ' + btoa('viewer:viewer123')
        }
      });
      setCases(response.data);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const deleteStudy = async (studyId) => {
    if(!window.confirm("Are you sure you want to delete this case?")) return;
    try {
      const host = window.location.hostname;
      const apiUrl = host === 'localhost' || host === '127.0.0.1' 
        ? `http://127.0.0.1:8000/api/studies/${studyId}` 
        : `https://backend.cloudrad.app/api/studies/${studyId}`;

      await axios.delete(apiUrl, {
        headers: {
          'Authorization': 'Basic ' + btoa('viewer:viewer123')
        }
      });
      fetchCases();
    } catch (err) {
      console.error('Failed to delete study', err);
      alert('Could not delete study.');
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    setIsExtracted(false);
    setUploadProgress(10);
    
    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const host = window.location.hostname;
      const apiUrl = host === 'localhost' || host === '127.0.0.1' 
        ? 'http://127.0.0.1:8000/api/upload' 
        : 'https://backend.cloudrad.app/api/upload';

      const res = await axios.post(apiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': 'Basic ' + btoa('viewer:viewer123')
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 90) / progressEvent.total);
          setUploadProgress(10 + percentCompleted);
        }
      });
      
      setUploadProgress(100);
      
      const instances = res.data.studies && res.data.studies.length > 0 
          ? res.data.studies[0].instances_count 
          : acceptedFiles.length;

      setPatientData({
        name: res.data.patient_name || "Anonymized Patient",
        id: res.data.patient_id || "PX-" + Math.floor(Math.random()*10000),
        age: 'Unknown',
        sex: 'Unknown',
        modality: res.data.studies && res.data.studies.length > 0 ? res.data.studies[0].modality : 'CT',
        studyDate: new Date().toLocaleDateString(),
        instances_count: instances
      });

      setIsExtracted(true);
      fetchCases();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please ensure the backend is running and CORS is configured correctly.');
      setUploadProgress(0);
    }
  }, [fetchCases]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleDiscard = () => {
    setIsExtracted(false);
    setShowUploadModal(false);
    setUploadProgress(0);
    setPatientData(null);
    setGeneratedToken(null);
  };

  const openShareModal = (study) => {
    setPatientData({
      name: study.patient_name || "Unknown Patient",
      id: study.patient_id_number || "N/A",
      modality: study.modality || "CT"
    });
    setGeneratedToken(null);
    setShowShareModal(true);
  };

  const generateLink = () => {
    setIsGenerating(true);
    setTimeout(() => {
       setIsGenerating(false);
       setGeneratedToken('CLRAD-' + Math.random().toString(36).substr(2, 9).toUpperCase());
    }, 1500);
  };

  const copyToClipboard = () => {
     setCopiedKey(true);
     setTimeout(()=>setCopiedKey(false), 2000);
  };

  const userName = doctor?.name || "Dr. Demo";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex overflow-hidden">
      
      {/* 1. Left Sidebar (Icon only) */}
      <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 flex-shrink-0 z-20">
        <button className="text-gray-500 hover:text-gray-800 mb-8"><Menu size={24} /></button>
        
        <div className="flex flex-col gap-6 w-full items-center">
           <div className="w-full flex justify-center py-2 relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-md"></div>
              <button className="text-emerald-500 bg-emerald-50 p-2 rounded-lg" title="Cases"><Users size={20}/></button>
           </div>
           <button className="text-gray-400 hover:text-gray-600 p-2"><Target size={20} title="Exams"/></button>
           <button className="text-gray-400 hover:text-gray-600 p-2"><Inbox size={20} title="Inbox"/></button>
           <button className="text-gray-400 hover:text-gray-600 p-2"><Trash size={20} title="Trash"/></button>
           <button onClick={() => setShowSettingsModal(true)} className="text-gray-400 hover:text-emerald-600 p-2 transition-colors"><Settings size={20} title="Settings"/></button>
           <button onClick={() => setShowHelpModal(true)} className="text-gray-400 hover:text-blue-600 p-2 transition-colors"><HelpCircle size={20} title="Help"/></button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50/30">
        
        {/* 2. Top Navigation Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-6 h-full">
            <h1 className="text-lg font-black text-teal-600 tracking-widest uppercase flex items-center gap-2"><div className="w-8 h-8 rounded bg-teal-500 text-white flex items-center justify-center leading-none">M</div> CLOUDRAD</h1>
            
            <div className="h-6 w-px bg-gray-200"></div>

            <button className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-100/50 hover:bg-gray-100 px-4 py-2 rounded-full transition-colors border border-gray-200 shadow-sm">
               <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-white text-[10px]">A</div>
               Austin Oncology (Demo)
               <ChevronRight size={14} className="rotate-90 text-gray-500 ml-1"/>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors" title="Share"><Share2 size={18} /></button>
            <button className="p-2 text-fuchsia-500 bg-fuchsia-100/50 rounded-lg hover:bg-fuchsia-100 transition-colors" title="Video"><Video size={18} /></button>
            <button className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
               <UserPlus size={16} />
               Invite to CloudRad
            </button>
            
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            
            <button className="text-gray-500 hover:text-gray-800 p-1.5 transition-colors"><Bell size={20}/></button>
            <button className="text-gray-500 hover:text-gray-800 p-1.5 transition-colors"><MessageCircle size={20}/></button>
            
            <div className="flex items-center gap-2 ml-2 cursor-pointer border border-gray-200 pl-2 pr-4 py-1.5 rounded-full shadow-sm hover:shadow transition-all bg-white">
               <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                  <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-full h-full object-cover" />
               </div>
               <span className="text-sm font-semibold text-gray-700">{userName}</span>
            </div>
            <button onClick={onLogout} className="text-gray-400 hover:text-rose-500 p-1.5 transition-colors ml-1"><LogOut size={16}/></button>
          </div>
        </header>

        {/* 3. Main Workspace */}
        <main className="flex-1 flex flex-col p-8 overflow-y-auto w-full max-w-[1700px] mx-auto">
          
          {/* Tabs & New Case Row */}
          <div className="flex justify-between items-end border-b border-gray-200 mb-6">
             <div className="flex bg-gray-50/50 pl-2 pt-2 rounded-tl-xl border-l border-t border-gray-200 gap-1.5">
                <button className="px-6 py-2.5 bg-white border-t-2 border-t-emerald-500 border-l border-r border-gray-200 font-bold text-sm text-gray-900 rounded-t-lg shadow-[0_-2px_10px_rgba(0,0,0,0.03)] flex items-center gap-2">
                   <Users size={16} className="text-gray-800"/>
                   My Cases
                </button>
                <button className="px-6 py-2.5 text-sm text-gray-500 font-medium hover:text-gray-800 hover:bg-white rounded-t-lg transition-colors flex items-center gap-2">
                   Anonymized00003 <span className="text-gray-400 hover:text-rose-500">&times;</span>
                </button>
             </div>

             <div className="pb-3">
                <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 border border-emerald-500 text-emerald-600 bg-white hover:bg-emerald-50 px-5 py-2 rounded-full text-sm font-bold shadow-sm transition-all focus:ring-2 ring-emerald-200">
                   <Plus size={16} strokeWidth={3}/> New case
                </button>
             </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
             <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm w-48 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white shadow-sm font-medium" />
                </div>
                <input type="text" placeholder="Labels" className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm w-32 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white shadow-sm font-medium" />
                <input type="text" placeholder="Members" className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm w-32 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white shadow-sm font-medium" />
                <input type="text" placeholder="Institution name" className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm w-40 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white shadow-sm font-medium" />
                <div className="relative">
                   <input type="text" placeholder="Last modified" className="pl-4 pr-9 py-2.5 border border-gray-200 rounded-lg text-sm w-36 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white shadow-sm font-medium" />
                   <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                </div>
                <button className="flex items-center gap-2 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm shadow-sm transition-colors font-semibold">
                   <Filter size={14}/> Advanced filters
                </button>
             </div>

             <div className="text-xs font-bold text-gray-800 flex flex-col items-end">
                <span>{cases.length} cases</span>
             </div>
          </div>

          {/* Cases Data Table */}
          <div className="flex-1 overflow-hidden flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm">
             <div className="grid grid-cols-12 border-b border-gray-200 p-4 text-[13px] font-bold text-gray-900 bg-white shrink-0 items-center pl-6">
               <div className="col-span-1 items-center justify-start flex"><input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer" /></div>
               <div className="col-span-4">Patient details</div>
               <div className="col-span-2">Patient ID</div>
               <div className="col-span-2">Members</div>
               <div className="col-span-1">Last update</div>
               <div className="col-span-1">Created at</div>
               <div className="col-span-1 text-right pr-2">Actions</div>
             </div>
             
             {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">Loading cases...</div>
             ) : cases.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
                   <Folder className="mb-3 text-gray-300" size={48} strokeWidth={1.5}/>
                   <p className="text-lg font-medium text-gray-500">No cases found</p>
                </div>
             ) : (
                <div className="flex-1 overflow-y-auto bg-gray-50/10">
                   {cases.map((c) => (
                     <div key={c.id} className="grid grid-cols-12 border-b border-gray-100 p-4 text-sm font-medium text-gray-800 bg-white hover:bg-gray-50 transition-colors items-center group cursor-pointer pl-6" onClick={() => window.open(`${window.location.origin}/view/${c.id}`, '_blank')}>
                        <div className="col-span-1 items-center justify-start flex">
                           <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer" onClick={(e)=>e.stopPropagation()} />
                        </div>
                        
                        <div className="col-span-4 flex items-center gap-4">
                           <div className="w-14 h-14 rounded-lg bg-black border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                              <span className="text-gray-100 text-3xl font-black font-serif italic z-10 opacity-80">M</span>
                              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                           </div>
                           <div className="flex flex-col">
                              <span className="text-gray-900 font-bold text-[15px]">{c.patient_name || 'Anonymized00003'}</span>
                           </div>
                        </div>
                        
                        <div className="col-span-2 text-gray-600 font-semibold text-[13px]">
                           {c.patient_id_number || '-'}
                        </div>
                        
                        <div className="col-span-2 flex items-center">
                           <div className="flex -space-x-2 mr-2">
                              {/* placeholder profiles */}
                              <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex justify-center items-center text-xs font-bold text-blue-600">J</div>
                              <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white flex justify-center items-center text-xs font-bold text-emerald-600">S</div>
                           </div>
                           <span className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-bold border border-gray-200 shadow-sm">+1</span>
                        </div>
                        
                        <div className="col-span-1 flex flex-col text-[12px]">
                           <span className="text-gray-900 font-semibold mb-0.5">2 minutes ago</span>
                           <span className="text-gray-500">{c.study_date ? new Date(c.study_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : 'N/A'}, 4:23 PM</span>
                        </div>
                        
                        <div className="col-span-1 font-semibold text-gray-900 text-[13px]">
                           {c.study_date ? new Date(c.study_date).toLocaleDateString('en-US', {month: 'numeric', day: 'numeric', year: 'numeric'}) : 'N/A'}
                        </div>
                        
                        <div className="col-span-1 flex items-center justify-end gap-3 text-right pr-2">
                           <button onClick={(e) => { e.stopPropagation(); openShareModal(c); }} className="border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                              <Share2 size={14}/> Share
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); deleteStudy(c.id); }} className="text-gray-500 hover:text-gray-800 p-1 focus:outline-none">
                              <MoreVertical size={18}/>
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
             )}
          </div>
        </main>
      </div>

      {/* Modal / Extracted Patient Card Overlays */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl space-y-6 my-8">
            <div className="flex justify-end relative z-10 w-full">
               <button onClick={() => {setShowUploadModal(false); setIsExtracted(false); setUploadProgress(0);}} className="text-gray-500 bg-white rounded-full hover:text-gray-800 hover:bg-gray-100 w-10 h-10 flex border border-gray-200 items-center justify-center shadow-sm transition-colors">&times;</button>
            </div>
            
            {!isExtracted && (
              <div className="bg-white border border-gray-200 p-8 md:p-12 rounded-2xl shadow-xl relative -mt-10">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                   <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><CloudUpload size={20}/></div>
                   Secure Upload Portal
                </h3>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}>
                  <input {...getInputProps()} />
                  <div className="w-16 h-16 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center mb-4 text-blue-500">
                    <QrCode size={28} />
                  </div>
                  <p className="text-gray-800 font-medium text-lg">Drag & drop raw DICOM folders or ZIP files here</p>
                  <p className="text-sm text-gray-500 mt-2">Chunked & Resumable transmission. Slices into 5MB chunks automatically.</p>
                </div>
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-8">
                    <div className="flex justify-between text-sm text-gray-600 mb-2 font-medium">
                      <span className="text-blue-500 flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div> Uploading & Chunking...</span>
                      <span className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded font-mono border border-gray-200">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
                      <div className="bg-blue-500 h-2 rounded-full transition-all duration-300 shadow-sm relative" style={{ width: `${uploadProgress}%` }}>
                        <div className="absolute inset-0 bg-white/20 w-full"></div>
                      </div>
                    </div>
                    <p className="text-xs text-center text-gray-500 mt-3">Network robust: Auto-resumes from last chunk if disconnected.</p>
                  </div>
                )}
              </div>
            )}

            {isExtracted && patientData && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 space-y-8 relative -mt-10">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex items-center gap-5">
                    <div className="bg-emerald-50 text-emerald-600 p-5 rounded-xl font-bold text-2xl shadow-sm border border-emerald-100 flex items-center justify-center w-16 h-16">{patientData.name.charAt(0)}</div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                        {patientData.name} 
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded border border-gray-200 tracking-wider">ID: {patientData.id}</span>
                      </h2>
                      <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-x-6 gap-y-2 font-medium">
                        <span className="flex items-center gap-1.5"><span className="text-gray-500">Age:</span> <span className="text-gray-900">{patientData.age}</span></span>
                        <span className="flex items-center gap-1.5"><span className="text-gray-500">Sex:</span> <span className="text-gray-900">{patientData.sex}</span></span>
                        <span className="flex items-center gap-1.5"><span className="text-gray-500">Modality:</span> <span className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-gray-800 font-bold">{patientData.modality}</span></span>
                        <span className="flex items-center gap-1.5"><span className="text-gray-500">Date:</span> <span className="text-gray-900">{patientData.studyDate}</span></span>
                        {patientData.instances_count !== undefined && (
                           <span className="flex items-center gap-1.5"><span className="text-gray-500 text-xs flex items-center"><FileImage size={12} className="mr-1"/> Images:</span> <span className="text-emerald-500 font-bold">{patientData.instances_count}</span></span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end w-full md:w-auto">
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-2 uppercase tracking-wide shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Extracted</span>
                  </div>
                </div>

                <hr className="border-gray-200" />

                <div>
                  <h4 className="text-[11px] font-bold text-gray-500 mb-4 flex items-center gap-2 tracking-widest uppercase"><FileImage size={14}/> Image Gallery</h4>
                  <div className="relative group">
                    <div className="flex gap-4 overflow-x-auto pb-4 items-center">
                      {[1,2,3,4,5,6].map(thumb => (
                        <div key={thumb} className="flex-shrink-0 w-[140px] h-[140px] bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 hover:ring-1 hover:ring-blue-400 transition-all shadow-sm overflow-hidden relative group/item">
                           <svg className="w-10 h-10 text-gray-400 group-hover/item:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                           <div className="absolute bottom-2 right-2 bg-white text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 shadow-sm">IMG {thumb}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <hr className="border-gray-200" />
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                     <h4 className="text-[11px] font-bold text-gray-500 flex items-center gap-2 tracking-widest uppercase"><Share2 size={14}/> Collaboration & Sharing</h4>
                     <button onClick={handleDiscard} className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-2 border border-rose-200"><Trash2 size={14}/> Discard Case</button>
                  </div>
                  
                  {!generatedToken ? (
                     <div className="bg-gray-50/50 border border-gray-200 p-6 rounded-xl flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
                        <div className="flex w-full gap-4">
                           <div className="flex-1 relative">
                              <select 
                                 value={expiry} 
                                 onChange={(e) => setExpiry(e.target.value)}
                                 className="w-full bg-white border border-gray-200 text-gray-700 p-3.5 rounded-lg appearance-none text-sm focus:outline-none focus:border-blue-500 font-semibold shadow-sm"
                              >
                                 <option>7 Days Activity</option>
                                 <option>14 Days Activity</option>
                                 <option>Close Immediately</option>
                              </select>
                              <Clock size={16} className="absolute right-4 top-4 text-gray-400" pointerEvents="none"/>
                              <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] uppercase font-bold text-gray-500">Token Expiry</label>
                           </div>
                           <div className="flex-1 relative">
                              <input 
                                 type="text" 
                                 value={linkPasscode}
                                 onChange={(e) => setLinkPasscode(e.target.value)}
                                 placeholder="Optional Passcode"
                                 className="w-full bg-white border border-gray-200 shadow-sm text-gray-700 p-3.5 rounded-lg text-sm focus:outline-none focus:border-blue-500 font-semibold"
                              />
                              <ShieldAlert size={16} className="absolute right-4 top-4 text-gray-400" pointerEvents="none"/>
                              <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] uppercase font-bold text-gray-500">Access Control</label>
                           </div>
                        </div>
                        <button onClick={generateLink} disabled={isGenerating} className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold p-3.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
                           {isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <LinkIcon size={18}/>}
                           Save Case & Generate Secure Link
                        </button>
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onClick={copyToClipboard} className={`flex flex-col items-center justify-center p-4 h-full rounded-lg transition-all border font-semibold text-sm group shadow-sm ${copiedKey ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white border-gray-200 text-blue-600 hover:bg-blue-50'}`}>
                           {copiedKey ? <Check size={20} className="mb-2" /> : <Copy size={20} className="mb-2" />}
                           {copiedKey ? 'Link Copied!' : 'Copy Secure Link'}
                        </button>
                        <a href={`https://wa.me/?text=${encodeURIComponent(`Hello ${patientData.name}, your study is ready. View it here: ${window.location.origin}/view/${generatedToken} ${linkPasscode ? `(Passcode: ${linkPasscode})` : ''}`)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-4 h-full rounded-lg bg-white text-gray-600 hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]/30 transition-all border border-gray-200 font-semibold text-sm group shadow-sm">
                           <MessageSquare size={20} className="mb-2 text-gray-400 group-hover:text-[#25D366] transition-colors" />
                           WhatsApp
                        </a>
                        <a href={`mailto:?subject=Your Radiology Study is Ready&body=${encodeURIComponent(`Hello ${patientData.name}, your study is ready.\nView securely: ${window.location.origin}/view/${generatedToken} \n${linkPasscode ? `(Passcode: ${linkPasscode})` : ''}`)}`} className="flex flex-col items-center justify-center p-4 h-full rounded-lg bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all border border-gray-200 font-semibold text-sm group shadow-sm">
                           <Mail size={20} className="mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
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

      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-2xl shadow-xl relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Settings size={20} className="text-gray-500"/> User Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Display Name</label>
                 <input type="text" defaultValue={userName} className="w-full bg-white border border-gray-200 shadow-sm rounded p-3 text-gray-800 focus:border-emerald-500 outline-none" />
              </div>
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Notifications</label>
                 <select className="w-full bg-white border border-gray-200 shadow-sm rounded p-3 text-gray-800 focus:border-emerald-500 outline-none">
                    <option>All events</option>
                    <option>Urgent only</option>
                    <option>None</option>
                 </select>
              </div>
              <button onClick={() => {alert('Preferences saved'); setShowSettingsModal(false);}} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg shadow-sm mt-4 transition-colors">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-2xl shadow-xl relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><HelpCircle size={20} className="text-blue-500"/> Help & Support</h3>
              <button onClick={() => setShowHelpModal(false)} className="text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center">&times;</button>
            </div>
            <p className="text-sm text-gray-600 mb-6">If you need technical assistance with CloudRad PACS, you can access the documentation or contact our 24/7 technical team.</p>
            <div className="space-y-3">
              <a href={`mailto:tech@cloudrad.com`} className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"><Mail size={16}/> Email tech@cloudrad.com</a>
              <button onClick={() => setShowHelpModal(false)} className="w-full border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold py-3 rounded-lg transition-colors shadow-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && patientData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-gray-200 p-8 rounded-2xl shadow-xl relative">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Share2 size={20} className="text-blue-500"/> Share Study</h3>
                <button onClick={() => {setShowShareModal(false); setPatientData(null);}} className="text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center border border-gray-200">&times;</button>
             </div>
             
             <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-4">
               <div className="bg-emerald-50 text-emerald-600 w-12 h-12 rounded-lg font-bold flex items-center justify-center border border-emerald-100">
                  {patientData.name.charAt(0)}
               </div>
               <div>
                  <h4 className="text-gray-900 font-bold">{patientData.name}</h4>
                  <p className="text-xs text-gray-500">ID: {patientData.id} &bull; Modality: {patientData.modality}</p>
               </div>
             </div>

             {!generatedToken ? (
                <div className="bg-gray-50/50 border border-gray-200 p-6 rounded-xl flex flex-col space-y-4">
                  <div className="flex w-full gap-4">
                     <div className="flex-1 relative">
                        <select 
                           value={expiry} 
                           onChange={(e) => setExpiry(e.target.value)}
                           className="w-full bg-white border border-gray-200 shadow-sm text-gray-700 p-3.5 rounded-lg appearance-none text-sm focus:outline-none focus:border-blue-500 font-semibold"
                        >
                           <option>7 Days Activity</option>
                           <option>14 Days Activity</option>
                           <option>Close Immediately</option>
                        </select>
                        <Clock size={16} className="absolute right-4 top-4 text-gray-400" pointerEvents="none"/>
                        <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] uppercase font-bold text-gray-500">Token Expiry</label>
                     </div>
                     <div className="flex-1 relative">
                        <input 
                           type="text" 
                           value={linkPasscode}
                           onChange={(e) => setLinkPasscode(e.target.value)}
                           placeholder="Optional Passcode"
                           className="w-full bg-white border border-gray-200 shadow-sm text-gray-700 p-3.5 rounded-lg text-sm focus:outline-none focus:border-blue-500 font-semibold"
                        />
                        <ShieldAlert size={16} className="absolute right-4 top-4 text-gray-400" pointerEvents="none"/>
                        <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] uppercase font-bold text-gray-500">Access Control</label>
                     </div>
                  </div>
                  <button onClick={generateLink} disabled={isGenerating} className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold p-3.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
                     {isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <LinkIcon size={18}/>}
                     Generate Secure Link
                  </button>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <button onClick={copyToClipboard} className={`flex flex-col items-center justify-center p-4 h-32 rounded-lg transition-all border font-semibold text-sm group shadow-sm ${copiedKey ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white border-gray-200 text-blue-600 hover:bg-blue-50'}`}>
                      {copiedKey ? <Check size={24} className="mb-3" /> : <Copy size={24} className="mb-3" />}
                      {copiedKey ? 'Link Copied!' : 'Copy Secure Link'}
                   </button>
                   <a href={`https://wa.me/?text=${encodeURIComponent(`Hello ${patientData.name}, your study is ready. View it here: ${window.location.origin}/view/${generatedToken} ${linkPasscode ? `(Passcode: ${linkPasscode})` : ''}`)}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-4 h-32 rounded-lg bg-white text-gray-600 hover:bg-[#25D366]/5 hover:text-[#25D366] hover:border-[#25D366]/30 transition-all border border-gray-200 font-semibold text-sm group shadow-sm">
                      <MessageSquare size={24} className="mb-3 text-gray-400 group-hover:text-[#25D366] transition-colors" />
                      WhatsApp
                   </a>
                   <a href={`mailto:?subject=Your Radiology Study is Ready&body=${encodeURIComponent(`Hello ${patientData.name}, your study is ready.\nView securely: ${window.location.origin}/view/${generatedToken} \n${linkPasscode ? `(Passcode: ${linkPasscode})` : ''}`)}`} className="flex flex-col items-center justify-center p-4 h-32 rounded-lg bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all border border-gray-200 font-semibold text-sm group shadow-sm">
                      <Mail size={24} className="mb-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
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
