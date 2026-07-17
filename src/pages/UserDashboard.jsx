import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle, Clock, Activity, FileType, MapPin, User, LogOut, Sun, Moon } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

function getAuthHeaders() {
  const token = localStorage.getItem('cloudrad_token');
  return { Authorization: `Bearer ${token}` };
}

export default function UserDashboard({ doctor, onLogout }) {
  const [darkMode, setDarkMode] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [lastUploaded, setLastUploaded] = useState(null);
  const [isAnonymize, setIsAnonymize] = useState(false);

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return alert('الرجاء رفع ملفات الفحص');

    const formData = new FormData();
    formData.append('anonymize', isAnonymize);

    if (acceptedFiles.length === 1 && acceptedFiles[0].name.endsWith('.zip')) {
      formData.append('file', acceptedFiles[0]);
    } else {
      const dicomFiles = acceptedFiles.filter(f => !f.name.startsWith('.'));
      if (dicomFiles.length === 0) return alert('لا يوجد ملفات صالحة للرفع.');
      dicomFiles.forEach(f => {
        formData.append('files', f);
      });
    }

    setUploading(true);
    setUploadProgress(0);
    setLastUploaded(null);

    try {
      const res = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: getAuthHeaders(),
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      setLastUploaded(res.data.metadata);
    } catch (err) {
      if (err.response?.status === 401) {
        alert('انتهت صلاحية الجلسة.');
        window.location.href = '/login';
      } else {
        alert('فشل رفع الملف. تأكد من حجم الملف والاتصال بالخادم.');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-[#0a0f1c] text-white' : 'bg-slate-50 text-slate-900'} transition-colors duration-500 font-sans`} dir="rtl">
      
      {/* Header */}
      <header className={`flex justify-between items-center p-5 lg:px-10 backdrop-blur-md sticky top-0 z-40 transition-colors ${darkMode ? 'bg-[#0a0f1c]/80 border-b border-white/5' : 'bg-white/80 border-b border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
            <h1 className="text-xl font-bold text-white uppercase tracking-wider">CR</h1>
          </div>
          <h1 className="text-xl font-bold">CloudRad <span className="font-light text-blue-400">الاستقبال</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-medium px-4 py-1.5 rounded-full ${darkMode ? 'bg-slate-800/50 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
            مرحباً، {doctor?.name}
          </span>
          <button onClick={toggleDark} className={`p-2.5 rounded-full ${darkMode ? 'bg-slate-800/80 text-yellow-400' : 'bg-white text-slate-600'}`}>
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={onLogout} className="p-2.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full z-10">
        
        {/* Intake Zone */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="mb-2">
            <h2 className="text-3xl font-bold tracking-tight">مركز العمليات (Intake Zone)</h2>
            <p className="mt-2 text-slate-500">قم برفع حالات التصوير الجديدة هنا ليتم قراءة وتحليل الفحص المعني.</p>
          </div>

          <div {...getRootProps()} className={`relative group overflow-hidden border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-cyan-400 bg-cyan-900/20 scale-[1.02]' : 'border-slate-600/50 bg-slate-800/30'}`}>
            <input {...getInputProps()} />
            
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mb-6" />
                <p className="text-2xl font-bold text-cyan-400 mb-4 tracking-wider">جاري معالجة ورفع بيانات DICOM...</p>
                <div className="w-full max-w-md bg-gray-800 rounded-full h-3 mb-2 border border-slate-700">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <p className="text-sm text-slate-400">{uploadProgress}% مكتمل</p>
              </div>
            ) : (
              <div className="flex flex-col items-center relative z-10">
                <div className={`p-5 rounded-full mb-6 ${isDragActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700/50 text-slate-400'}`}>
                  <UploadCloud className="h-16 w-16 drop-shadow-md" />
                </div>
                <p className="text-xl font-bold text-slate-200 mb-2">اسحب مجلد الفحص (Folder) أو ملف (ZIP) هنا</p>
                <p className="text-sm text-slate-500">سوف يقوم النظام باستخراج كافة التفاصيل ألياً ومعالجتها فوراً (مئات الملفات مدعومة).</p>
              </div>
            )}
          </div>

          <div className={`mt-2 p-4 rounded-2xl flex items-center gap-3 border transition-colors ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
            <input 
               type="checkbox" 
               id="anonymize-check"
               checked={isAnonymize}
               onChange={(e) => setIsAnonymize(e.target.checked)}
               className="w-5 h-5 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500/50"
            />
            <label htmlFor="anonymize-check" className="text-sm font-semibold cursor-pointer">
              طمس وإخفاء هوية المريض قبل المعالجة (Anonymize DICOM PII)
            </label>
          </div>
        </div>

        {/* Metadata Sheet */}
        <div className={`w-full lg:w-[450px] rounded-3xl border p-8 flex flex-col ${darkMode ? 'bg-[#111827] border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
           <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <CheckCircle className="text-cyan-400 w-6 h-6" />
              لوحة البيانات المستخرجة
           </h3>
           
           {lastUploaded ? (
             <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className={`p-5 rounded-2xl ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                   <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><User className="w-4 h-4"/> بيانات المريض</p>
                   <p className="text-xl font-bold text-cyan-400">{lastUploaded.patient_name}</p>
                   <div className="flex gap-4 mt-3 text-sm">
                     <div>الرقم: <span className="font-bold text-white">{lastUploaded.patient_id}</span></div>
                     <div>العمر: <span className="font-bold text-white">{lastUploaded.patient_age || '--'}</span></div>
                     <div>الجنس: <span className="font-bold text-white">{lastUploaded.patient_gender || '--'}</span></div>
                   </div>
                </div>

                <div className={`p-5 rounded-2xl ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                   <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><Activity className="w-4 h-4"/> تفاصيل الفحص</p>
                   <div className="flex justify-between items-end">
                     <div>
                       <p className="text-2xl font-black text-white">{lastUploaded.modality}</p>
                       <p className="text-sm text-blue-400 uppercase tracking-widest mt-1">{lastUploaded.body_part || 'BODY PART'}</p>
                     </div>
                     <div className="text-left text-sm text-slate-400">
                        {lastUploaded.instances_count} صورة
                     </div>
                   </div>
                </div>

                <div className={`p-5 rounded-2xl ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                   <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><Clock className="w-4 h-4"/> الوقت والتاريخ</p>
                   <p className="font-medium">{lastUploaded.study_date} {lastUploaded.study_time}</p>
                   <p className="text-sm text-slate-500 mt-2 flex items-center gap-2"><MapPin className="w-4 h-4"/> {lastUploaded.institution_name || 'UNKNOWN CLINIC'}</p>
                </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                <FileType className="w-16 h-16 mb-4 text-slate-600" />
                <p className="text-lg font-bold">بانتظار رفع عينة</p>
                <p className="text-sm">ستعرض البيانات وتُحلّل هنا فورياً بعد الإرسال</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

// Ensure Loader2 is imported effectively manually above if missing.
import { Loader2 } from 'lucide-react';
