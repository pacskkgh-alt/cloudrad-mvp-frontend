import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileType, CheckCircle, Share2, Moon, Sun } from 'lucide-react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const Uploader = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles.find(f => f.name.endsWith('.zip'));
    if (!file) return alert('برجاء رفع ملف ZIP يحتوي على صور DICOM');
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/upload', formData);
      onUploadSuccess(res.data.study_id);
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-10 mt-4 text-center cursor-pointer transition ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'}`}>
      <input {...getInputProps()} />
      <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-3" />
      {uploading ? (
        <p className="text-lg font-semibold text-blue-600 animate-pulse">جاري الرفع والمعالجة...</p>
      ) : (
        <p className="text-gray-600 dark:text-gray-300">اسحب وأفلت مجلد الدراسة هنا (بصيغة ZIP)، أو اضغط لاختيار الملف</p>
      )}
    </div>
  );
};

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentStudy, setCurrentStudy] = useState(null);
  const [report, setReport] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const saveReport = async () => {
    if (!currentStudy) return;
    try {
      await axios.post('http://localhost:8000/api/reports', {
        study_id: currentStudy,
        doctor_id: '123', // Dummy doctor 
        report_content: report,
        is_finalized: false
      });
      alert('تم حفظ التقرير بنجاح');
    } catch (err) {
      alert('خطأ في الحفظ');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">CloudRad <span className="text-sm font-normal text-gray-500">Doctor Panel</span></h1>
        <button onClick={toggleDark} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
        </button>
      </header>

      <div className="flex-1 p-6 flex flex-col gap-6">
        {!currentStudy ? (
          <div className="max-w-3xl mx-auto w-full mt-10">
            <h2 className="text-3xl font-semibold mb-2">مرحباً بك في لوحة تحكم الطبيب</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">قم برفع دراسة المريض لبدء التشخيص وكتابة التقرير الطبي.</p>
            <Uploader onUploadSuccess={(id) => setCurrentStudy(id)} />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 h-full flex-1">
            {/* Viewer Section */}
            <div className="flex-1 bg-black rounded-2xl overflow-hidden shadow-lg border border-gray-800 relative min-h-[600px]">
              <div className="absolute top-0 left-0 w-full p-2 bg-gradient-to-b from-black/80 flex justify-between z-10">
                 <span className="text-white text-sm font-medium px-2 py-1 bg-black/50 rounded">OHIF Viewer</span>
              </div>
              <iframe 
                 src="http://localhost:8042/ohif/viewer.html" 
                 className="w-full h-full border-0"
                 title="DICOM Viewer"
              />
            </div>

            {/* Report Section */}
            <div className="w-full lg:w-1/3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border dark:border-gray-700 p-6 flex flex-col pt-4">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold">التقرير الطبي</h2>
                 <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 text-sm bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
                   <Share2 className="w-4 h-4" /> مشاركة
                 </button>
               </div>
               
               <div className="flex-1 flex flex-col h-[500px] bg-white dark:bg-gray-900 rounded-lg overflow-hidden border dark:border-gray-700">
                  <ReactQuill theme="snow" value={report} onChange={setReport} className="h-full flex-1 flex flex-col mb-10" />
               </div>
               
               <button onClick={saveReport} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition">
                  حفظ التقرير
               </button>
            </div>
          </div>
        )}
      </div>

      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">إنشاء رابط مشاركة آمن</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">صلاحية الرابط</label>
                <select className="w-full border dark:border-gray-700 rounded-lg p-2 bg-transparent">
                  <option>بدون انتهاء</option>
                  <option>أسبوع واحد</option>
                  <option>شهر واحد</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">كلمة المرور (اختياري)</label>
                <input type="password" placeholder="***" className="w-full border dark:border-gray-700 rounded-lg p-2 bg-transparent" />
              </div>
              
              <div className="flex items-center gap-2">
                <input type="checkbox" id="anon" className="rounded" />
                <label htmlFor="anon" className="text-sm">إخفاء بيانات المريض (Anonymize)</label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
               <button onClick={() => setShowShareModal(false)} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl">إلغاء</button>
               <button onClick={() => {
                 alert('تم إنشاء الرابط: http://localhost:5173/patient/token123');
                 setShowShareModal(false);
               }} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30">إنشاء الرابط</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
