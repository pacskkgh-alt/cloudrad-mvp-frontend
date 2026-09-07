import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl, getPacsUrl, getAuthHeaders, relativeTime, getModalityColor } from '../api';
import { 
  Share2, Mail, QrCode, Clock, UploadCloud, MessageSquare, 
  FileImage, ChevronRight,
  Search, Plus, LogOut, Settings, HelpCircle, Trash2, ShieldAlert, Check, Copy, Link as LinkIcon,
  Menu, Users, Target, Inbox, Trash, UserPlus, Video, Bell, MessageCircle, Calendar, Filter, Folder, MoreVertical, Loader2
} from 'lucide-react';
import StudyHoverActions from '../components/StudyHoverActions';
import UploadTypeModal from '../components/UploadTypeModal';

const API_URL = getApiUrl();
const PACS_URL = getPacsUrl();

const CaseTimeline = ({ doctor, onLogout }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/studies`, {
        headers: getAuthHeaders()
      });
      setCases(response.data);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const deleteStudy = async (studyId) => {
    if(!window.confirm("Are you sure you want to delete this case?")) return;
    try {
      await axios.delete(`${API_URL}/api/studies/${studyId}`, {
        headers: getAuthHeaders()
      });
      fetchCases();
    } catch (err) {
      console.error('Failed to delete study', err);
      alert('Could not delete study.');
    }
  };


  const handleDiscard = () => {
    setIsExtracted(false);
    setShowUploadModal(false);
    setUploadProgress(0);
    setPatientData(null);
    setGeneratedToken(null);
  };

  const openShareModal = (study) => {
    setPatientData({
      study_id: study.id,
      name: study.patient_name || "Unknown Patient",
      id: study.patient_id_number || "N/A",
      modality: study.modality || "CT"
    });
    setGeneratedToken(null);
    setShowShareModal(true);
  };

  const generateLink = async () => {
    setIsGenerating(true);
    try {
      let expiryDays = 7;
      if (expiry.includes('14')) expiryDays = 14;
      else if (expiry.includes('Immediately')) expiryDays = 0;

      const res = await axios.post(`${API_URL}/api/links/`, {
        study_id: patientData.study_id,
        duration_days: expiryDays > 0 ? expiryDays : null,
        passcode: linkPasscode ? linkPasscode.trim() : null,
        allows_download: true,
        is_anonymized: false
      }, {
        headers: getAuthHeaders()
      });
      
      setGeneratedToken(res.data.token);
    } catch (err) {
      alert("Failed to generate secure link. Ensure you have permission.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
     if (navigator.clipboard) {
         navigator.clipboard.writeText(`${window.location.origin}/view/${generatedToken}`);
     } else {
         const el = document.createElement('textarea');
         el.value = `${window.location.origin}/view/${generatedToken}`;
         document.body.appendChild(el);
         el.select();
         document.execCommand('copy');
         document.body.removeChild(el);
     }
     setCopiedKey(true);
     setTimeout(()=>setCopiedKey(false), 2000);
  };

  const userName = doctor?.name || "Dr. Demo";
  
  // Filter cases by search query
  const filteredCases = cases.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (c.patient_name || '').toLowerCase().includes(q) ||
           (c.patient_id_number || '').toLowerCase().includes(q) ||
           (c.modality || '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex overflow-hidden">
      
      {/* 1. Left Sidebar (Icon only) */}
      <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 flex-shrink-0 z-20">
        <button className="text-gray-500 hover:text-gray-800 mb-8 transition-colors"><Menu size={24} /></button>
        
        <div className="flex flex-col gap-6 w-full items-center">
           <div className="w-full flex justify-center py-2 relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-md"></div>
              <button className="text-emerald-500 bg-emerald-50 p-2 rounded-lg" title="Cases"><Users size={20}/></button>
           </div>
           <button className="text-gray-400 hover:text-gray-600 p-2 transition-colors"><Target size={20} title="Exams"/></button>
           <button className="text-gray-400 hover:text-gray-600 p-2 transition-colors"><Inbox size={20} title="Inbox"/></button>
           <button className="text-gray-400 hover:text-gray-600 p-2 transition-colors"><Trash size={20} title="Trash"/></button>
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
               <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-white text-[10px] font-bold">C</div>
               CloudRad Medical
               <ChevronRight size={14} className="rotate-90 text-gray-500 ml-1"/>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors" title="Share"><Share2 size={18} /></button>
            <button className="p-2 text-fuchsia-500 bg-fuchsia-100/50 rounded-lg hover:bg-fuchsia-100 transition-colors" title="Video"><Video size={18} /></button>
            <button className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
               <UserPlus size={16} />
               Invite
            </button>
            
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            
            <button className="text-gray-500 hover:text-gray-800 p-1.5 transition-colors relative"><Bell size={20}/></button>
            <button className="text-gray-500 hover:text-gray-800 p-1.5 transition-colors"><MessageCircle size={20}/></button>
            
            <div className="flex items-center gap-2 ml-2 cursor-pointer border border-gray-200 pl-2 pr-4 py-1.5 rounded-full shadow-sm hover:shadow transition-all bg-white">
               <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                  {userName.charAt(0).toUpperCase()}
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
             </div>

             <div className="pb-3">
                <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 border border-emerald-500 text-emerald-600 bg-white hover:bg-emerald-50 px-5 py-2 rounded-full text-sm font-bold shadow-sm transition-all focus:ring-2 ring-emerald-200 hover:shadow-md hover:-translate-y-0.5">
                   <Plus size={16} strokeWidth={3}/> New case
                </button>
             </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
             <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search patients..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm w-56 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white shadow-sm font-medium transition-all" 
                  />
                </div>
                <input type="text" placeholder="Labels" className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm w-32 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white shadow-sm font-medium" />
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
                <span>{filteredCases.length} cases</span>
             </div>
          </div>

          {/* Cases Data Table */}
          <div className="flex-1 overflow-hidden flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm">
             <div className="grid grid-cols-12 border-b border-gray-200 p-4 text-[13px] font-bold text-gray-900 bg-white shrink-0 items-center pl-6">
               <div className="col-span-1 items-center justify-start flex"><input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer" /></div>
               <div className="col-span-3">Patient details</div>
               <div className="col-span-2">Patient ID</div>
               <div className="col-span-2">Modality</div>
               <div className="col-span-1">Last update</div>
               <div className="col-span-1">Study date</div>
               <div className="col-span-2 text-right pr-2">Actions</div>
             </div>
             
             {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30 py-20">
                   <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
                   <span className="text-sm font-medium">Loading cases...</span>
                </div>
             ) : filteredCases.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30 py-20">
                   <Folder className="mb-3 text-gray-300" size={48} strokeWidth={1.5}/>
                   <p className="text-lg font-medium text-gray-500">No cases found</p>
                   <p className="text-sm text-gray-400 mt-1">Upload DICOM files to get started</p>
                </div>
             ) : (
                <div className="flex-1 overflow-y-auto bg-gray-50/10">
                   {filteredCases.map((c, index) => (
                      <div 
                        key={c.id} 
                        className="relative grid grid-cols-12 border-b border-gray-100 p-4 text-sm font-medium text-gray-800 bg-white hover:bg-emerald-50/30 transition-all items-center group cursor-pointer pl-6"
                        style={{ animationDelay: `${index * 30}ms` }}
                        onClick={() => {
                          if (c.study_instance_uid) {
                            window.open(`${PACS_URL}/ohif/viewer?url=/dicom-web/studies/${c.study_instance_uid}`, '_blank');
                          } else if (c.orthanc_study_uuid) {
                            window.open(`${PACS_URL}/osimis-viewer/app/index.html?study=${c.orthanc_study_uuid}`, '_blank');
                          }
                        }}
                      >

                         <div className="col-span-1 items-center justify-start flex">
                            <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer" onClick={(e)=>e.stopPropagation()} />
                         </div>
                         
                         <div className="col-span-3 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 relative shadow-sm">
                               <span className="text-gray-100 text-2xl font-black font-serif italic z-10 opacity-80">{(c.patient_name || 'U').charAt(0)}</span>
                            </div>
                            <div className="flex flex-col">
                               <span className="text-gray-900 font-bold text-[15px] group-hover:text-emerald-700 transition-colors">{c.patient_name || 'Unknown'}</span>
                               {c.has_report && <span className="text-[10px] text-emerald-500 font-bold mt-0.5 flex items-center gap-1"><Check size={10}/> Report ready</span>}
                            </div>
                         </div>
                         
                         <div className="col-span-2 text-gray-600 font-semibold text-[13px]">
                            {c.patient_id_number || '-'}
                         </div>
                         
                         <div className="col-span-2 flex items-center">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getModalityColor(c.modality)}`}>
                              {c.modality || 'N/A'}
                            </span>
                         </div>
                         
                         <div className="col-span-1 flex flex-col text-[12px]">
                            <span className="text-gray-900 font-semibold mb-0.5">{relativeTime(c.created_at)}</span>
                         </div>
                         
                         <div className="col-span-1 font-semibold text-gray-600 text-[13px]">
                            {c.study_date ? new Date(c.study_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: '2-digit'}) : 'N/A'}
                         </div>
                         
                         <div className="col-span-2 flex items-center justify-end gap-3 text-right pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); openShareModal(c); }} className="border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:shadow">
                               <Share2 size={14}/> Share
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteStudy(c.id); }} className="text-gray-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-all focus:outline-none">
                               <Trash2 size={16}/>
                            </button>
                         </div>

                         {/* Hover Actions Overlay */}
                         <StudyHoverActions
                           patientInitial={(c.patient_name || 'U').charAt(0)}
                           hasReport={Boolean(c.has_report)}
                           onCreateCase={() => {
                             if (c.study_instance_uid) {
                               window.open(`${PACS_URL}/ohif/viewer?url=/dicom-web/studies/${c.study_instance_uid}`, '_blank');
                             } else if (c.orthanc_study_uuid) {
                               window.open(`${PACS_URL}/osimis-viewer/app/index.html?study=${c.orthanc_study_uuid}`, '_blank');
                             }
                           }}
                           onShare={() => openShareModal(c)}
                           onManageLabels={() => {
                             alert(`Manage labels for ${c.patient_name || 'Study'}`);
                           }}
                           onCompare={() => {
                             if (c.study_instance_uid) {
                               window.open(`${PACS_URL}/ohif/viewer?url=/dicom-web/studies/${c.study_instance_uid}`, '_blank');
                             } else if (c.orthanc_study_uuid) {
                               window.open(`${PACS_URL}/osimis-viewer/app/index.html?study=${c.orthanc_study_uuid}`, '_blank');
                             }
                           }}
                           onDownload={() => {
                             if (c.orthanc_study_uuid) {
                               window.open(`${PACS_URL}/studies/${c.orthanc_study_uuid}/archive`, '_blank');
                             } else {
                               alert('Direct download link not available for this study.');
                             }
                           }}
                           onTrash={() => deleteStudy(c.id)}
                         />
                      </div>
                   ))}
                </div>
             )}
          </div>
        </main>
      </div>

      {/* Upload Type Modal (Dark Theme UI) */}
      <UploadTypeModal
        isOpen={showUploadModal && !isExtracted}
        onClose={() => {
          setShowUploadModal(false);
          setUploadProgress(0);
        }}
        onUploadSuccess={(data) => {
          setShowUploadModal(false);
          const meta = data?.metadata || {};
          setPatientData({
            study_id: data?.study_id || "",
            name: meta.patient_name || "Unknown Patient",
            id: meta.patient_id || "N/A",
            age: meta.patient_age || 'Unknown',
            sex: meta.patient_gender || 'Unknown',
            modality: meta.modality || 'CT',
            studyDate: meta.study_date ? new Date(meta.study_date).toLocaleDateString() : new Date().toLocaleDateString(),
            instances_count: meta.instances_count || 1
          });
          setIsExtracted(true);
          fetchCases();
        }}
      />

      {/* Extracted Case & Token Generation Modal */}
      {isExtracted && patientData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl space-y-6 my-8">
            <div className="flex justify-end relative z-10 w-full">
               <button onClick={handleDiscard} className="text-gray-500 bg-white rounded-full hover:text-gray-800 hover:bg-gray-100 w-10 h-10 flex border border-gray-200 items-center justify-center shadow-sm transition-colors">&times;</button>
            </div>
            
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
                      <span className="flex items-center gap-1.5"><span className="text-gray-500">Modality:</span> <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getModalityColor(patientData.modality)}`}>{patientData.modality}</span></span>
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
                               className="w-full bg-white border border-gray-200 p-3.5 rounded-lg text-sm focus:outline-none focus:border-blue-500 shadow-sm"
                            />
                            <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] uppercase font-bold text-gray-500">Passcode Protection</label>
                         </div>
                      </div>
                      <button 
                         onClick={generateLink} 
                         disabled={isGenerating} 
                         className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3.5 rounded-lg text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                         {isGenerating ? <Loader2 className="animate-spin" size={16}/> : <LinkIcon size={16}/>}
                         Generate Secure View Link
                      </button>
                   </div>
                ) : (
                   <div className="space-y-4 max-w-xl mx-auto">
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                         <input 
                            type="text" 
                            readOnly 
                            value={`${window.location.origin}/view/${generatedToken}`} 
                            className="bg-transparent border-none text-xs text-emerald-800 font-mono flex-1 focus:outline-none select-all"
                         />
                         <button 
                            onClick={copyToClipboard} 
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                         >
                            {copiedKey ? <Check size={14}/> : <Copy size={14}/>}
                            {copiedKey ? 'Copied' : 'Copy'}
                         </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                         <button onClick={() => window.open(`${window.location.origin}/view/${generatedToken}`, '_blank')} className="flex flex-col items-center justify-center p-4 h-full rounded-lg bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all border border-gray-200 font-semibold text-sm group shadow-sm">
                            <ChevronRight size={20} className="mb-2 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                            Open View
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
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
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

      {/* Help Modal */}
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

      {/* Share Modal */}
      {showShareModal && patientData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-gray-200 p-8 rounded-2xl shadow-xl relative">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Share2 size={20} className="text-blue-500"/> Share Study</h3>
                <button onClick={() => {setShowShareModal(false); setPatientData(null); setGeneratedToken(null);}} className="text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center border border-gray-200">&times;</button>
             </div>
             
             <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-4">
               <div className="bg-emerald-50 text-emerald-600 w-12 h-12 rounded-lg font-bold flex items-center justify-center border border-emerald-100">
                  {patientData.name.charAt(0)}
               </div>
               <div>
                  <h4 className="text-gray-900 font-bold">{patientData.name}</h4>
                  <p className="text-xs text-gray-500">ID: {patientData.id} &bull; Modality: <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getModalityColor(patientData.modality)}`}>{patientData.modality}</span></p>
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
                  <button onClick={generateLink} disabled={isGenerating} className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold p-3.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 hover:shadow-md">
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
