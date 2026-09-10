import React, { useState, useEffect } from "react";
import axios from "axios";
import { Stethoscope, FileText, Eye, Download, CheckCircle, Search } from "lucide-react";
import { getApiUrl } from "../config";

export default function DoctorWorkspace({ doctor, onLogout }) {
  const [studies, setStudies] = useState([]);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [reportText, setReportText] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const token = localStorage.getItem("cloudrad_token");
  const API_URL = getApiUrl();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/studies`, { headers });
      // Fetch report contents as well
      const studiesWithReports = await Promise.all(res.data.map(async (study) => {
        if (study.has_report) {
           try {
             const repRes = await axios.get(`${API_URL}/api/reports/${study.id}`, { headers });
             return { ...study, report_content: repRes.data.report_content, is_finalized: repRes.data.is_finalized };
           } catch {
             return study;
           }
        }
        return study;
      }));
      setStudies(studiesWithReports);
    } catch (err) {
      console.error("فشل جلب الدراسات", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenViewer = (orthancUuid) => {
    window.open(`/viewer/index.html?study=${orthancUuid}`, "_blank");
  };

  const handleSaveReport = async (studyId) => {
    try {
      await axios.post(`${API_URL}/api/reports/`, {
        study_id: studyId,
        report_content: reportText,
        is_finalized: true
      }, { headers });
      alert("تم اعتماد وحفظ التقرير الطبي بنجاح");
      fetchStudies();
    } catch (err) {
      alert("فشل حفظ التقرير");
    }
  };

  const filteredStudies = studies.filter(s => 
    s.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.modality?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans rtl" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Stethoscope className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="text-xl font-bold">محطة الطبيب التشخيصية (Doctor Workspace)</h1>
            <p className="text-xs text-slate-400">قائمة الحالات الطبية، كتابة التقارير واعتمادها - مرحباً د. {doctor?.name}</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="w-72">
            <input 
              type="text" 
              placeholder="بحث باسم المريض أو نوع الفحص (CT, MRI)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button onClick={onLogout} className="text-xs bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition">تسجيل الخروج</button>
        </div>
      </div>

      {/* Grid: قائمة الحالات + مساحة كتابة التقرير */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* قائمة الدراسات */}
        <div className="lg:col-span-2 space-y-3">
          {filteredStudies.map((study) => (
            <div 
              key={study.id} 
              className={`p-4 rounded-xl border transition flex items-center justify-between ${
                selectedStudy?.id === study.id ? "bg-slate-900 border-emerald-500/50" : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">{study.patient_name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    {study.modality || "DICOM"}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex gap-4">
                  <span>تاريخ الفحص: {study.study_date || "اليوم"}</span>
                  <span>الصور: {study.instances_count || 1}</span>
                </div>
              </div>

              {/* أزرار الطبيب */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenViewer(study.orthanc_study_uuid)}
                  className="flex items-center gap-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  <Eye className="w-4 h-4" /> فتح العارض
                </button>
                <button
                  onClick={() => {
                    setSelectedStudy(study);
                    setReportText(study.report_content ? study.report_content.replace(/<[^>]+>/g, '') : "");
                  }}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  <FileText className="w-4 h-4" /> كتابة تقرير
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* مساحة كتابة التقرير */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col h-full min-h-[500px]">
          <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            {selectedStudy ? `تقرير المريض: ${selectedStudy.patient_name}` : "اختر دراسة لكتابة التقرير"}
          </h2>
          {selectedStudy ? (
            <div className="flex-1 flex flex-col gap-3 h-full">
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="اكتب التشخيص، الملاحظات الطبية، والتوصيات هنا..."
                className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono leading-relaxed"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveReport(selectedStudy.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold transition"
                >
                  <CheckCircle className="w-4 h-4" /> اعتماد التقرير الطبي
                </button>
                {selectedStudy.has_report && (
                  <a
                    href={`${API_URL}/api/reports/${selectedStudy.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                    title="تحميل PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
              يرجى اختيار مريض من القائمة للبدء في كتابة أو مراجعة التقرير
            </div>
          )}
        </div>
      </div>
    </div>
  );
