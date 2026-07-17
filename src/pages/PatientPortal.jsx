import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { useParams } from 'react-router-dom';
import { DownloadCloud, ShieldCheck, Lock, Loader2, AlertTriangle, FileText, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const PACS_URL = import.meta.env.VITE_PACS_URL || 'http://localhost:8042';

export default function PatientPortal() {
  const { token } = useParams();
  const [studyInfo, setStudyInfo] = useState(null);
  const [report, setReport] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('report'); // 'report' or 'images' for mobile toggle
  
  // Passcode state
  const [needsPasscode, setNeedsPasscode] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    verifyToken('');
  }, [token]);

  const verifyToken = async (passcodeValue) => {
    setVerifying(true);
    try {
      const res = await axios.post(`${API_URL}/api/links/${token}/verify`, {
        passcode: passcodeValue || null,
      });

      if (res.data.requires_passcode) {
        setNeedsPasscode(true);
        setLoading(false);
        setVerifying(false);
        return;
      }

      setStudyInfo(res.data);
      setNeedsPasscode(false);

      // Load report
      try {
        const reportRes = await axios.get(`${API_URL}/api/reports/${res.data.study_id}?share_token=${token}`);
        setReport(reportRes.data.report_content || '');
        setDoctorName(reportRes.data.doctor_name || '');
      } catch {
        setReport('<p>لم يتم كتابة التقرير بعد.</p>');
      }

      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('كلمة المرور غير صحيحة');
      } else if (err.response?.status === 403) {
        setError('انتهت صلاحية هذا الرابط');
        setLoading(false);
      } else if (err.response?.status === 404) {
        setError('رابط غير صالح');
        setLoading(false);
      } else {
        setError('خطأ في الاتصال بالخادم');
        setLoading(false);
      }
      setVerifying(false);
    }
  };

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();
    setError('');
    verifyToken(passcode);
  };

  const currentUrl = window.location.href;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`;

  // 1. Loading state
  if (loading && !needsPasscode) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans tracking-wide">
        <div className="text-center animate-pulse">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-bold">جاري تأمين الاتصال وجلب بياناتك...</p>
        </div>
      </div>
    );
  }

  // 2. Error state
  if (error && !needsPasscode) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans tracking-wide" dir="rtl">
        <div className="bg-white rounded-[2rem] shadow-2xl p-10 max-w-md w-full text-center border border-red-100">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
             <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">تعذر الوصول للبيانات</h2>
          <p className="text-slate-500 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // 3. Passcode Wall
  if (needsPasscode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4 font-sans tracking-wide" dir="rtl">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl p-8 lg:p-10 max-w-md w-full border border-white">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
               <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">حماية الخصوصية</h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">الرجاء إدخال رمز المرور (PIN) المرسل هاتفياً لحماية بياناتك الصحية</p>
          </div>
          <form onSubmit={handlePasscodeSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="أدخل الرمز السري هنا"
                required
                className={`w-full px-5 py-4 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 text-center text-2xl tracking-widest font-bold transition-all shadow-inner ${error ? 'border-red-400 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500 bg-slate-50'}`}
              />
              {error && <p className="text-red-500 text-sm text-center mt-3 font-bold animate-pulse">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="w-full relative overflow-hidden group bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-lg py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
            >
              {verifying ? 'جاري الفتح...' : 'كشف البيانات'}
              <div className="absolute top-0 -inset-full h-full w-1/2 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-[shine_1s_infinite]"></div>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 4. Main Portal View
  return (
    <>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans tracking-wide print:hidden" dir="rtl">
        {/* Header (Screen) */}
        <header className="w-full bg-white/80 backdrop-blur-md shadow-sm p-4 lg:py-5 lg:px-10 flex justify-between items-center sticky top-0 z-40">
          <div>
             <h1 className="text-xl lg:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">CloudRad</h1>
             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">بوابة المريض الرقمية</p>
          </div>
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full text-xs lg:text-sm font-bold shadow-sm">
            <ShieldCheck className="w-4 h-4 lg:w-5 lg:h-5" /> اتصال آمن ومشفر
          </div>
        </header>

        {/* Mobile Tab Switcher */}
        <div className="lg:hidden flex bg-white border-b sticky top-[72px] z-30 shadow-sm">
          <button 
            onClick={() => setView('report')} 
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold text-sm transition-all ${view === 'report' ? 'text-blue-600 border-b-[3px] border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
             <FileText className="w-4 h-4" /> التشخيص
          </button>
          <button 
            onClick={() => setView('images')} 
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold text-sm transition-all ${view === 'images' ? 'text-blue-600 border-b-[3px] border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
             <ImageIcon className="w-4 h-4" /> الأشعة
          </button>
        </div>

        <main className="w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6 p-4 lg:p-6 lg:mt-4 flex-1">
          
          {/* Images Panel (Hidden on mobile if not active) */}
          <div className={`${view === 'images' ? 'flex' : 'hidden'} lg:flex flex-[2] bg-[#0a0f1c] rounded-[2rem] overflow-hidden shadow-2xl relative min-h-[60vh] lg:min-h-[750px] border border-slate-800`}>
             <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/90 to-transparent flex justify-between items-start z-10 pointer-events-none">
                 {studyInfo?.patient_name && (
                   <span className="text-white text-xs lg:text-sm font-bold px-4 py-1.5 bg-blue-600/80 rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                     {studyInfo.patient_name}
                   </span>
                 )}
                 <span className="text-white/80 text-[10px] lg:text-xs font-bold tracking-widest uppercase px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-md text-left" dir="ltr">DICOM VIEWER</span>
             </div>
            <iframe
              src={`${PACS_URL}/ohif/viewer.html${studyInfo?.orthanc_study_uuid ? '?StudyInstanceUIDs=' + studyInfo.orthanc_study_uuid : ''}`}
              className="w-full h-full border-0"
              title="Patient DICOM Viewer"
            />
          </div>

          {/* Report Panel (Hidden on mobile if not active) */}
          <div className={`${view === 'report' ? 'flex' : 'hidden'} lg:flex flex-[1] lg:max-w-[450px] flex-col gap-4`}>
            <div className="bg-white p-6 lg:p-8 rounded-[2rem] shadow-xl border border-slate-100 flex-1 relative overflow-hidden flex flex-col">
              
              <h2 className="text-2xl font-black mb-1 text-slate-800 relative z-10">التقرير الطبي الخاص بك</h2>
              
              {doctorName && (
                 <p className="text-sm font-bold text-slate-500 mb-6 flex items-center gap-2 relative z-10">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    بقلم: د. {doctorName}
                 </p>
              )}

              {/* Fake lines to look cool */}
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-6"></div>
              
              {/* Report Body */}
              <div 
                 className="flex-1 overflow-auto prose prose-sm lg:prose-base prose-blue prose-headings:font-bold text-slate-700 font-medium relative z-10" 
                 dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(report) }} 
              />
            </div>

            {studyInfo?.allows_download && (
              <button
                onClick={() => window.print()}
                className="w-full relative overflow-hidden group bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white font-bold text-lg py-5 rounded-[2rem] shadow-2xl transition-all flex justify-center items-center gap-3 mt-2"
              >
                <DownloadCloud className="w-6 h-6" />
                تحميل التقرير كوثيقة (PDF)
                <div className="absolute top-0 -inset-full h-full w-1/2 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-10 group-hover:animate-[shine_1s_infinite]"></div>
              </button>
            )}
          </div>
        </main>
      </div>

      {/* --- PRINT ONLY VIEW (Creates the PDF) --- */}
      <div className="hidden print:block bg-white text-black font-sans w-full max-w-[210mm] mx-auto p-[10mm]" dir="rtl">
         
         {/* Print Header */}
         <div className="flex justify-between items-start border-b-[3px] border-slate-900 pb-6 mb-8">
             <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">تقرير فحص أشعة</h1>
                <p className="text-lg font-bold text-slate-600 mt-2 uppercase tracking-widest" dir="ltr">CloudRad Medical Center</p>
             </div>
             <div className="text-center flex flex-col items-center">
                 <img src={qrCodeUrl} alt="Scan to view images" className="w-28 h-28 object-contain mb-2" />
                 <p className="text-[10px] font-bold text-slate-500" dir="ltr">مسح الرمز لمشاهدة الأشعة</p>
             </div>
         </div>
         
         {/* Patient Info Grid */}
         <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-10 p-5 bg-slate-50 rounded-2xl border-2 border-slate-200">
            <div>
               <p className="text-xs text-slate-500 font-bold mb-1">اسم المريض</p>
               <p className="text-lg font-black text-slate-800">{studyInfo?.patient_name}</p>
            </div>
            <div>
               <p className="text-xs text-slate-500 font-bold mb-1">الرقم الطبي (السجل)</p>
               <p className="text-lg font-black text-slate-800">{studyInfo?.patient_id_number || '----------'}</p>
            </div>
            <div>
               <p className="text-xs text-slate-500 font-bold mb-1">نوع الفحص المجُرى</p>
               <p className="text-lg font-black text-slate-800 uppercase tracking-widest">{studyInfo?.modality}</p>
            </div>
            <div>
               <p className="text-xs text-slate-500 font-bold mb-1">تاريخ الفحص</p>
               <p className="text-lg font-black text-slate-800" dir="ltr">{studyInfo?.study_date || 'غير محدد'}</p>
            </div>
         </div>

         {/* Print Body */}
         <div className="min-h-[400px]">
            <h2 className="text-2xl font-black mb-6 text-slate-900 border-b border-slate-300 pb-3 inline-block">النتائج والتشخيص (Findings)</h2>
            <div 
               className="print-content text-slate-800 text-out font-medium leading-loose prose max-w-none" 
               dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(report) }} 
            />
         </div>

         {/* Print Footer */}
         <div className="flex justify-between items-end mt-16 pt-8 border-t-2 border-slate-900">
            <div className="pb-2">
               <p className="text-slate-400 text-xs font-bold mb-1">تم توثيق التقرير رقمياً وإصداره عبر منصة (CloudRad.com)</p>
               <p className="text-slate-400 text-xs font-bold" dir="ltr">Printed on: {new Date().toLocaleDateString('en-US')} {new Date().toLocaleTimeString('en-US')}</p>
            </div>
            <div className="text-center px-10">
               <div className="w-full border-b-[2px] border-dashed border-slate-400 mb-4 h-12"></div>
               <p className="font-bold text-xs text-slate-600 mb-1">توقيع الطبيب المعتمد</p>
               <p className="font-black text-xl text-slate-900">د. {doctorName}</p>
            </div>
         </div>
      </div>
      
      <style>{`
        @media print {
          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
          .prose {
             font-size: 14pt !important;
             color: black !important;
          }
          .prose p { margin-bottom: 0.5em !important; }
        }
      `}</style>
    </>
  );
}
