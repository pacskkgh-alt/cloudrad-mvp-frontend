import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DownloadCloud, ShieldCheck, Lock, Loader2, AlertTriangle } from 'lucide-react';
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
        const reportRes = await axios.get(`${API_URL}/api/reports/${res.data.study_id}`);
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

  const downloadPDF = () => {
    if (!studyInfo) return;
    window.open(`${API_URL}/api/reports/${studyInfo.study_id}/pdf?token=${token}`, '_blank');
  };

  // Loading state
  if (loading && !needsPasscode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">جاري التحقق من الرابط...</p>
        </div>
      </div>
    );
  }

  // Expired or invalid link
  if (error && !needsPasscode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">تعذر الوصول</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // Passcode prompt
  if (needsPasscode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-800">رابط محمي بكلمة مرور</h2>
            <p className="text-gray-500 text-sm mt-1">أدخل كلمة المرور لعرض الصور والتقرير</p>
          </div>
          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="كلمة المرور"
              required
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-center text-lg"
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={verifying}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition disabled:opacity-50"
            >
              {verifying ? 'جاري التحقق...' : 'دخول'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main portal view
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <header className="w-full bg-white shadow-sm p-4 flex justify-between items-center px-10">
        <h1 className="text-xl font-bold text-blue-600">CloudRad - بوابة المريض</h1>
        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-sm font-medium">
          <ShieldCheck className="w-4 h-4" /> اتصال آمن
        </div>
      </header>

      <main className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 p-6 mt-4 flex-1">
        {/* Left Side: Images */}
        <div className="flex-1 bg-black rounded-2xl overflow-hidden shadow-lg border border-gray-200 relative min-h-[500px]">
          <iframe
            src={`${PACS_URL}/ohif/viewer.html`}
            className="w-full h-full border-0"
            title="Patient DICOM Viewer"
          />
        </div>

        {/* Right Side: Report & Actions */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">التقرير الطبي الخاص بك</h2>
            {doctorName && <p className="text-sm text-gray-500 mb-4">الطبيب: {doctorName}</p>}
            <hr className="mb-4" />
            <div className="prose prose-blue text-gray-700" dangerouslySetInnerHTML={{ __html: report }} />
          </div>

          {studyInfo?.allows_download && (
            <button
              onClick={downloadPDF}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold py-4 rounded-2xl shadow-lg flex justify-center items-center gap-3 transition-transform active:scale-95"
            >
              <DownloadCloud className="w-6 h-6" />
              تحميل التقرير كملف PDF
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
