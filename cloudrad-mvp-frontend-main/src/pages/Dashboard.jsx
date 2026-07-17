import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileType, CheckCircle, Share2, Moon, Sun, LogOut, ClipboardCopy, List, FileText } from 'lucide-react';
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

export default function Dashboard({ doctor, onLogout }) {
  const [darkMode, setDarkMode] = useState(false);
  const [currentStudy, setCurrentStudy] = useState(null);
  const [report, setReport] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [studies, setStudies] = useState([]);
  const [loadingStudies, setLoadingStudies] = useState(true);
  const [view, setView] = useState('list'); // 'list' or 'viewer'

  // Share modal state
  const [shareDuration, setShareDuration] = useState('');
  const [sharePasscode, setSharePasscode] = useState('');
  const [shareAnonymized, setShareAnonymized] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Fetch studies on mount
  useEffect(() => {
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
    // Load existing report if any
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
        alert('انتهت صلاحية الجلسة');
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
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      {/* Navbar */}
      <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">CloudRad</h1>
          <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">مرحباً، {doctor.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {currentStudy && (
            <button onClick={() => { setCurrentStudy(null); setView('list'); }} className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-1.5">
              <List className="w-4 h-4" /> القائمة
            </button>
          )}
          <button onClick={toggleDark} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>
          <button onClick={onLogout} className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition" title="تسجيل الخروج">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 flex flex-col gap-6 bg-gray-50 dark:bg-gray-900">
        {view === 'list' ? (
          <div className="max-w-5xl mx-auto w-full mt-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold dark:text-white">الدراسات</h2>
              <span className="text-sm text-gray-500">{studies.length} دراسة</span>
            </div>

            {/* Upload Section */}
            <Uploader onUploadSuccess={(id) => { fetchStudies(); selectStudy(id); }} />

            {/* Studies List */}
            <div className="mt-8 space-y-3">
              {loadingStudies ? (
                <p className="text-center text-gray-500 py-10 animate-pulse">جاري تحميل الدراسات...</p>
              ) : studies.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <FileType className="w-16 h-16 mx-auto mb-4 opacity-40" />
                  <p className="text-lg">لا توجد دراسات بعد</p>
                  <p className="text-sm mt-1">قم برفع ملف DICOM ZIP لبدء العمل</p>
                </div>
              ) : (
                studies.map((study) => (
                  <button
                    key={study.id}
                    onClick={() => selectStudy(study.id)}
                    className="w-full text-right bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition flex justify-between items-center gap-4"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 dark:text-white">{study.patient_name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {study.modality} · {study.instances_count} صورة · {study.series_count} سلسلة
                      </p>
                      {study.created_at && (
                        <p className="text-xs text-gray-400 mt-1">{new Date(study.created_at).toLocaleDateString('ar-SA')}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {study.has_report && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                          <FileText className="w-3 h-3" /> تقرير
                        </span>
                      )}
                      <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium">
                        {study.modality}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 h-full flex-1">
            {/* Viewer Section */}
            <div className="flex-1 bg-black rounded-2xl overflow-hidden shadow-lg border border-gray-800 relative min-h-[600px]">
              <div className="absolute top-0 left-0 w-full p-2 bg-gradient-to-b from-black/80 flex justify-between z-10">
                <span className="text-white text-sm font-medium px-2 py-1 bg-black/50 rounded">OHIF Viewer</span>
                {currentStudyData && (
                  <span className="text-white text-sm px-2 py-1 bg-black/50 rounded">{currentStudyData.patient_name}</span>
                )}
              </div>
              <iframe
                src={`${PACS_URL}/ohif/viewer.html`}
                className="w-full h-full border-0"
                title="DICOM Viewer"
              />
            </div>

            {/* Report Section */}
            <div className="w-full lg:w-1/3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border dark:border-gray-700 p-6 flex flex-col pt-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold dark:text-white">التقرير الطبي</h2>
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

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 dark:text-white">إنشاء رابط مشاركة آمن</h3>

            {shareLink ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-green-600 font-medium">تم إنشاء الرابط بنجاح!</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl text-sm break-all text-gray-700 dark:text-gray-300 border dark:border-gray-700">
                  {shareLink}
                </div>
                <button onClick={copyLink} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition">
                  <ClipboardCopy className="w-4 h-4" /> نسخ الرابط
                </button>
                <button onClick={() => { setShowShareModal(false); setShareLink(''); setSharePasscode(''); setShareDuration(''); setShareAnonymized(false); }} className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 transition">
                  إغلاق
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">صلاحية الرابط</label>
                    <select
                      value={shareDuration}
                      onChange={(e) => setShareDuration(e.target.value)}
                      className="w-full border dark:border-gray-700 rounded-lg p-2 bg-transparent dark:text-white"
                    >
                      <option value="">بدون انتهاء</option>
                      <option value="7">أسبوع واحد</option>
                      <option value="30">شهر واحد</option>
                      <option value="90">3 أشهر</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">كلمة المرور (اختياري)</label>
                    <input
                      type="password"
                      value={sharePasscode}
                      onChange={(e) => setSharePasscode(e.target.value)}
                      placeholder="***"
                      className="w-full border dark:border-gray-700 rounded-lg p-2 bg-transparent dark:text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="anon"
                      checked={shareAnonymized}
                      onChange={(e) => setShareAnonymized(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="anon" className="text-sm dark:text-gray-300">إخفاء بيانات المريض (Anonymize)</label>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button onClick={() => { setShowShareModal(false); setShareLink(''); }} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl">
                    إلغاء
                  </button>
                  <button
                    onClick={createShareLink}
                    disabled={creatingLink}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-50"
                  >
                    {creatingLink ? 'جاري الإنشاء...' : 'إنشاء الرابط'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
