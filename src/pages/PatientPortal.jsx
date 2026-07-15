import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DownloadCloud, ShieldCheck } from 'lucide-react';
import axios from 'axios';

export default function PatientPortal() {
  const { token } = useParams();
  const [studyInfo, setStudyInfo] = useState({ study_id: 'test' }); // Simulated for MVP
  const [report, setReport] = useState('<p>لم يتم كتابة التقرير بعد.</p>');

  useEffect(() => {
    // In a real MVP, we verify the token here:
    // axios.post(`/api/links/${token}/verify`, { passcode: '' }).then(...)
    setReport('<p>تم رصد بعض التغيرات في الهيكل العظمي للمفصل، مما يستدعي عناية والبدء في العلاج الطبيعي.</p>');
  }, [token]);

  const downloadPDF = () => {
    window.open(`http://localhost:8000/api/reports/${studyInfo.study_id}/pdf?token=${token}`, '_blank');
  };

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
             src="http://localhost:8042/ohif/viewer.html" 
             className="w-full h-full border-0"
             title="Patient DICOM Viewer"
          />
        </div>

        {/* Right Side: Report & Actions */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
             <h2 className="text-2xl font-bold mb-4 text-gray-800">التقرير الطبي الخاص بك</h2>
             <hr className="mb-4" />
             <div className="prose prose-blue text-gray-700" dangerouslySetInnerHTML={{ __html: report }} />
          </div>

          <button 
            onClick={downloadPDF}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold py-4 rounded-2xl shadow-lg flex justify-center items-center gap-3 transition-transform active:scale-95"
          >
            <DownloadCloud className="w-6 h-6" />
            تحميل التقرير كملف PDF
          </button>
        </div>
      </main>
    </div>
  );
}
