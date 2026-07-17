import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileType, CheckCircle, Share2, Moon, Sun, LogOut, ClipboardCopy, List, FileText, ChevronRight } from 'lucide-react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const PACS_URL = import.meta.env.VITE_PACS_URL || 'http://localhost:8042';

function getAuthHeaders() {
  const token = localStorage.getItem('cloudrad_token');
  return { Authorization: `Bearer ${token}` };
}

const Uploader = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles.find(f => f.name.endsWith('.zip'));
    if (!file) return alert('برجاء رفع ملف ZIP يحتوي على صور DICOM');

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: getAuthHeaders(),
      });
      onUploadSuccess(res.data.study_id);
    } catch (err) {
      if (err.response?.status === 401) {
        alert('انتهت صلاحية الجلسة. أعد تسجيل الدخول.');
        window.location.href = '/login';
      } else {
        alert('فشل رفع الملف');
      }
    } finally {
      setUploading(false);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} className={`relative group overflow-hidden border-2 border-dashed rounded-3xl p-14 mt-6 text-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-cyan-400 bg-cyan-900/20 scale-[1.02] shadow-[0_0_30px_rgba(34,211,238,0.2)]' : 'border-slate-600/50 hover:border-blue-400/50 bg-slate-800/30 hover:bg-slate-800/50 shadow-inner'}`}>
      {/* Glow effect behind dropzone */}
      <div className={`absolute -inset-10 bg-gradient-to-r from-blue-500/0 via-cyan-400/10 to-blue-500/0 blur-2xl transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${isDragActive ? 'opacity-100' : ''}`}></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <input {...getInputProps()} />
        <div className={`p-4 rounded-full mb-4 transition-colors duration-300 ${isDragActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700/50 text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-400'}`}>
          <UploadCloud className="h-14 w-14 drop-shadow-md" />
        </div>
        
        {uploading ? (
          <div className="space-y-2">
            <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 animate-pulse">جاري فحص المستندات ورفعها...</p>
            <p className="text-sm text-slate-400">الرجاء الانتظار حتى تكتمل المعالجة</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-lg font-medium text-slate-200">اسحب وأفلت مجلد الفحص هنا <span className="text-gray-500 font-normal">(.zip)</span></p>
            <p className="text-sm text-slate-500">أو اضغط لاختيار المجلد يدوياً من جهازك</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Dashboard({ doctor, onLogout }) {
  const [darkMode, setDarkMode] = useState(true);
  const [currentStudy, setCurrentStudy] = useState(null);
  const [report, setReport] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [studies, setStudies] = useState([]);
  const [loadingStudies, setLoadingStudies] = useState(true);
  const [view, setView] = useState('list'); // 'list' or 'viewer'

  const [shareDuration, setShareDuration] = useState('');
  const [sharePasscode, setSharePasscode] = useState('');
  const [shareAnonymized, setShareAnonymized] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    document.documentElement.classList.add('dark'); // Force dark by default for premium feel
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    setLoadingStudies(true);
    try {
      const res = await axios.get(`${API_URL}/api/studies`, {
        headers: getAuthHeaders(),
      });
      setStudies(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        window.location.href = '/login';
      }
      console.error('Failed to fetch studies:', err);
    } finally {
      setLoadingStudies(false);
    }
  };

  const selectStudy = async (studyId) => {
    setCurrentStudy(studyId);
    setView('viewer');
    try {
      const res = await axios.get(`${API_URL}/api/reports/${studyId}`);
      setReport(res.data.report_content || '');
    } catch {
      setReport('');
    }
  };

  const saveReport = async () => {
    if (!currentStudy) return;
    try {
      await axios.post(`${API_URL}/api/reports`, {
        study_id: currentStudy,
        report_content: report,
        is_finalized: false,
      }, { headers: getAuthHeaders() });
      alert('تم حفظ التقرير بنجاح');
    } catch (err) {
      if (err.response?.status === 401) {
        window.location.href = '/login';
      } else {
        alert('خطأ في الحفظ');
      }
    }
  };

  const createShareLink = async () => {
    if (!currentStudy) return;
    setCreatingLink(true);
    try {
      const res = await axios.post(`${API_URL}/api/links`, {
        study_id: currentStudy,
        doctor_id: doctor.id,
        duration_days: shareDuration ? parseInt(shareDuration) : null,
        passcode: sharePasscode || null,
        allows_download: true,
        is_anonymized: shareAnonymized,
      }, { headers: getAuthHeaders() });

      const link = `${window.location.origin}/patient/${res.data.token}`;
      setShareLink(link);
    } catch (err) {
      alert('فشل إنشاء الرابط');
    } finally {
      setCreatingLink(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('تم نسخ الرابط!');
  };

  const currentStudyData = studies.find(s => s.id === currentStudy);

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-[#0a0f1c] text-white' : 'bg-slate-50 text-slate-900'} relative overflow-hidden transition-colors duration-500 font-sans`} dir="rtl">
      
      {/* Subtle Background Glows */}
      {darkMode && (
        <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
      )}

      {/* Navbar */}
      <header className={`flex justify-between items-center p-5 lg:px-10 backdrop-blur-md sticky top-0 z-40 transition-colors ${darkMode ? 'bg-[#0a0f1c]/80 border-b border-white/5' : 'bg-white/80 border-b border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <h1 className="text-xl font-bold text-white uppercase tracking-wider">CR</h1>
          </div>
          <h1 className={`text-2xl font-bold tracking-tight hidden sm:block ${darkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400' : 'text-slate-800'}`}>
            CloudRad 
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-medium px-4 py-1.5 rounded-full hidden md:inline ${darkMode ? 'bg-slate-800/50 border border-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
            مرحباً، د. {doctor.name}
          </span>
          
          {currentStudy && (
            <button onClick={() => { setCurrentStudy(null); setView('list'); }} className={`px-4 py-2 text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 font-medium ${darkMode ? 'bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 text-slate-200' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'}`}>
              <List className="w-4 h-4" /> اللائحة
            </button>
          )}
          
          <button onClick={toggleDark} className={`p-2.5 rounded-full transition-all shadow-sm ${darkMode ? 'bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 text-yellow-400' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600'}`}>
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <button onClick={onLogout} className={`p-2.5 rounded-full transition-all shadow-sm ${darkMode ? 'bg-red-950/30 hover:bg-red-900/50 border border-red-900/30 text-red-400' : 'bg-red-50 hover:bg-red-100 border border-red-100 text-red-500'}`} title="تسجيل الخروج">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 flex flex-col gap-6 relative z-10 max-w-7xl mx-auto w-full">
        {view === 'list' ? (
          <div className="w-full mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">إدارة الدراسات الواردة</h2>
                <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>قم برفع صور المرضى، وإنشاء التقارير ومشاركتها بشكل مريح وآمن.</p>
              </div>
              <span className={`text-sm px-4 py-1.5 rounded-full font-bold shadow-sm border ${darkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                {studies.length} دراسة موجودة
              </span>
            </div>

            {/* Upload Section */}
            <Uploader onUploadSuccess={(id) => { fetchStudies(); selectStudy(id); }} />

            {/* Studies List */}
            <div className="mt-12 space-y-4">
              <h3 className={`text-xl font-bold mb-6 flex items-center gap-3 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                سجل الدراسات الحديثة
                <div className={`h-px flex-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
              </h3>
              
              {loadingStudies ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-cyan-400 animate-spin"></div>
                  <p className="text-slate-500 font-medium tracking-wide">جاري فحص السجلات...</p>
                </div>
              ) : studies.length === 0 ? (
                <div className={`text-center py-24 rounded-3xl transition-colors ${darkMode ? 'bg-slate-800/30 border border-slate-700/50' : 'bg-white border border-slate-200 shadow-sm'}`}>
                  <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${darkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-50 text-slate-300'}`}>
                     <FileType className="w-12 h-12" />
                  </div>
                  <p className={`text-xl font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>مساحة العمل فارغة</p>
                  <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>ارفع أول ملف من بصيغة DICOM ZIP وسنجهز لك بيئة الفحص فوراً</p>
                </div>
              ) : (
                studies.map((study, index) => (
                  <button
                    key={study.id}
                    onClick={() => selectStudy(study.id)}
                    className={`w-full text-right border rounded-3xl p-5 transition-all duration-300 flex justify-between items-center gap-4 group relative overflow-hidden ${
                      darkMode 
                        ? 'bg-[#111827]/80 backdrop-blur-xl border-white/5 hover:bg-slate-800/80 hover:border-cyan-500/50 hover:shadow-[0_4px_30px_rgba(34,211,238,0.1)]' 
                        : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-xl shadow-sm hover:-translate-y-1'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-white/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>

                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner ${darkMode ? 'bg-gradient-to-br from-cyan-600/80 to-blue-600/80 text-white' : 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white'}`}>
                          {study.patient_name.charAt(0)}
                        </div>
                        <div>
                          <p className={`font-bold text-xl ${darkMode ? 'text-white' : 'text-slate-800'} group-hover:text-cyan-400 transition-colors`}>{study.patient_name}</p>
                          <div className={`flex items-center gap-2 mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            <span>{study.modality}</span>
                            <span className="text-xs opacity-50">•</span>
                            <span>{study.instances_count} صورة</span>
                            <span className="text-xs opacity-50">•</span>
                            <span>{study.series_count} سلسلة</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                       {study.created_at && (
                        <p className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${darkMode ? 'bg-slate-800/50 text-slate-400 border border-slate-700/50' : 'bg-slate-100 text-slate-500'}`}>
                          {new Date(study.created_at).toLocaleDateString('ar-SA')}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        {study.has_report && (
                          <span className={`text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold shadow-inner ${darkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                            <FileText className="w-3.5 h-3.5" /> يوجد تقرير
                          </span>
                        )}
                        <span className={`px-4 py-1.5 rounded-xl text-xs font-black tracking-widest uppercase shadow-inner ${darkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                          {study.modality}
                        </span>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 ${darkMode ? 'bg-slate-700/50 text-white' : 'bg-slate-100 text-slate-600'}`}>
                           <ChevronRight className="w-4 h-4 rotate-180" />
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Viewer Section */}
            <div className={`flex-1 rounded-3xl overflow-hidden shadow-2xl relative border ${darkMode ? 'bg-black border-slate-800/80 shadow-[0_0_50px_rgba(0,0,0,0.5)]' : 'bg-[#111] border-slate-800'}`}>
              <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/90 to-transparent flex justify-between items-start z-10 pointer-events-none">
                <span className="text-white/80 text-xs font-bold tracking-widest uppercase px-3 py-1.5 bg-black/60 rounded-lg backdrop-blur-md border border-white/10">OHIF Viewer Engine</span>
                {currentStudyData && (
                  <span className="text-white text-sm font-medium px-4 py-1.5 bg-blue-600/80 rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(37,99,235,0.4)]">{currentStudyData.patient_name}</span>
                )}
              </div>
              <iframe
                src={`${PACS_URL}/ohif/viewer.html`}
                className="w-full h-full border-0"
                title="DICOM Viewer"
              />
            </div>

            {/* Report Section */}
            <div className={`w-full lg:w-[400px] rounded-3xl shadow-2xl border p-6 flex flex-col ${darkMode ? 'bg-[#111827]/90 backdrop-blur-xl border-white/5' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight">التقرير الطبي</h2>
                <button onClick={() => setShowShareModal(true)} className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm ${darkMode ? 'bg-blue-500/10 text-cyan-400 hover:bg-blue-500/20 border border-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                  <Share2 className="w-4 h-4" /> إرسال / مشاركة
                </button>
              </div>

              <div className={`flex-1 flex flex-col rounded-2xl overflow-hidden border shadow-inner ${darkMode ? 'bg-[#0a0f1c] border-slate-800/50' : 'bg-slate-50 border-slate-200'}`}>
                {/* Notice: ReactQuill styling custom overrides can go in css, but keeping it standard for now */}
                <ReactQuill theme="snow" value={report} onChange={setReport} className={`h-full flex-1 flex flex-col mb-12 custom-quill ${darkMode ? 'dark-quill' : ''}`} />
              </div>

              <button onClick={saveReport} className="mt-6 w-full relative group overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-lg py-3.5 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all duration-300">
                 حفظ التقرير بصيغته النهائية
                 <div className="absolute top-0 -inset-full h-full w-1/2 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-[shine_1s_infinite]"></div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modern Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className={`rounded-[2rem] max-w-md w-full p-8 shadow-2xl border relative overflow-hidden ${darkMode ? 'bg-[#111827] border-slate-700/50' : 'bg-white border-slate-200'}`}>
            <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-cyan-400`}></div>
            
            <h3 className="text-2xl font-bold mb-6 tracking-tight">رابط النفاذ الآمن</h3>

            {shareLink ? (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3 bg-green-500/10 p-4 rounded-2xl border border-green-500/20">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-green-500 font-bold">الرابط جاهز للمشاركة والتوزيع!</span>
                </div>
                <div className={`p-4 rounded-2xl text-sm break-all font-mono border shadow-inner ${darkMode ? 'bg-[#0a0f1c] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  {shareLink}
                </div>
                <button onClick={copyLink} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-2xl transition shadow-lg shadow-blue-500/25">
                  <ClipboardCopy className="w-5 h-5" /> نسخ ولصق الرابط
                </button>
                <button onClick={() => { setShowShareModal(false); setShareLink(''); setSharePasscode(''); setShareDuration(''); setShareAnonymized(false); }} className={`w-full px-4 py-3 font-semibold rounded-2xl transition ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
                  إغلاق النافذة
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>صلاحية الإتاحة (أيام)</label>
                  <select
                    value={shareDuration}
                    onChange={(e) => setShareDuration(e.target.value)}
                    className={`w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                  >
                    <option value="">مدة مفتوحة (بدون قيود)</option>
                    <option value="7">أسبوع واحد للأطباء</option>
                    <option value="30">شهر كامل للمريض</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>كلمة مرور إضافية (اختياري)</label>
                  <input
                    type="password"
                    value={sharePasscode}
                    onChange={(e) => setSharePasscode(e.target.value)}
                    placeholder="PIN Code / Password"
                    className={`w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow tracking-widest ${darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
                  />
                </div>

                <div className={`flex items-center gap-3 p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <input
                    type="checkbox"
                    id="anon"
                    checked={shareAnonymized}
                    onChange={(e) => setShareAnonymized(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-600 text-blue-500 focus:ring-blue-500/50"
                  />
                  <label htmlFor="anon" className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'} cursor-pointer`}>
                    طمس بيانات المريض الحقيقية للسرية (Anonymize DICOM Tags)
                  </label>
                </div>

                <div className="mt-8 flex gap-4">
                  <button onClick={() => { setShowShareModal(false); setShareLink(''); }} className={`flex-1 px-4 py-3 font-semibold rounded-xl transition ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                    التراجع
                  </button>
                  <button
                    onClick={createShareLink}
                    disabled={creatingLink}
                    className="flex-[2] relative overflow-hidden group bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all"
                  >
                    {creatingLink ? 'جاري إعداد التشفير...' : 'توليد الرابط الآن'}
                    <div className="absolute top-0 -inset-full h-full w-1/2 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-[shine_1s_infinite]"></div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
