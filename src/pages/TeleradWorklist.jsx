import React, { useState, useEffect } from "react";
import axios from "axios";
import { Activity, Clock, AlertCircle, Eye, CheckCircle, ShieldAlert } from "lucide-react";

export default function TeleradWorklist() {
  const [cases, setCases] = useState([]);
  const [filterPriority, setFilterPriority] = useState("all");
  const token = localStorage.getItem("cloudrad_token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchWorklist();
  }, []);

  const fetchWorklist = async () => {
    try {
      // Assuming getApiUrl logic exists or fallback to proxy/env
      const API_URL = import.meta.env.VITE_API_URL || "";
      const res = await axios.get(`${API_URL}/api/telerad/worklist`, { headers });
      setCases(res.data);
    } catch (err) {
      console.error("فشل جلب قائمة الفحوصات", err);
    }
  };

  const handleClaimCase = async (studyId) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "";
      await axios.post(`${API_URL}/api/telerad/cases/${studyId}/claim`, {}, { headers });
      fetchWorklist();
    } catch (err) {
      alert(err.response?.data?.detail || "تعذر استلام الحالة");
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "stat":
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-xs flex items-center gap-1 font-bold animate-pulse"><ShieldAlert className="w-3 h-3" /> طوارئ قصوى (STAT)</span>;
      case "urgent":
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-xs flex items-center gap-1 font-semibold"><Clock className="w-3 h-3" /> عاجل (Urgent)</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-xs">روتيني (Routine)</span>;
    }
  };

  const filteredCases = filterPriority === "all" ? cases : cases.filter(c => c.priority === filterPriority);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans rtl" dir="rtl">
      {/* الهيدر والمؤشرات */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-xl font-bold">شبكة قراءة الأشعة عن بُعد (Teleradiology Worklist)</h1>
            <p className="text-xs text-slate-400">توزيع الحالات وإدارة زمن الاستجابة الطبية (SLA)</p>
          </div>
        </div>
        <div className="flex gap-2">
          {["all", "stat", "urgent", "routine"].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-1.5 rounded-lg text-xs transition ${
                filterPriority === p ? "bg-cyan-600 text-white font-bold" : "bg-slate-900 border border-slate-800 text-slate-400"
              }`}
            >
              {p === "all" ? "جميع الحالات" : p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* جدول الحالات */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-right border-collapse text-sm">
          <thead>
            <tr className="bg-slate-800/60 text-slate-400 text-xs border-b border-slate-800">
              <th className="p-4">الأولوية / SLA</th>
              <th className="p-4">المنشأة المصدر</th>
              <th className="p-4">نوع الفحص والمقطع</th>
              <th className="p-4">الحالة التشغيلية</th>
              <th className="p-4 text-center">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredCases.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/30 transition">
                <td className="p-4">{getPriorityBadge(c.priority)}</td>
                <td className="p-4 font-medium text-slate-300">{c.institution_name || "مركز أشعة معتمد"}</td>
                <td className="p-4">
                  <div className="font-mono text-xs text-cyan-400 font-bold">{c.modality}</div>
                  <div className="text-[11px] text-slate-400">{c.body_part || "عام"}</div>
                </td>
                <td className="p-4">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                    {c.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  {c.is_assigned_to_me ? (
                    <button
                      onClick={() => window.location.href = `/doctor/workspace?study=${c.id}`}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 mx-auto transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> فتح التشخيص
                    </button>
                  ) : (
                    <button
                      onClick={() => handleClaimCase(c.id)}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 mx-auto transition"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> استلام الحالة
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
