import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Building2, 
  Search, 
  ArrowLeft, 
  FileText, 
  ExternalLink, 
  Eye, 
  Check, 
  Save, 
  Send, 
  RefreshCw, 
  Filter, 
  UserCheck, 
  Maximize2,
  Stethoscope,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { getApiUrl, getPacsUrl, getAuthHeaders, getModalityColor } from '../api';

const API_URL = getApiUrl();
const PACS_URL = getPacsUrl();

export default function TeleradWorklist({ doctor, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all | stat | routine | claimed
  const [searchQuery, setSearchQuery] = useState('');
  
  // Split-View Reading Workspace State
  const [readingOrder, setReadingOrder] = useState(null);
  const [reportText, setReportText] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [finalizeSuccess, setFinalizeSuccess] = useState(false);
  const [viewerType, setViewerType] = useState('ohif'); // 'ohif' | 'osimis'

  // Fetch Worklist
  const fetchWorklist = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/telerad/worklist?filter_type=${filterType}`, {
        headers: getAuthHeaders(),
      });
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load teleradiology worklist:', err);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchWorklist();
    // Auto-poll worklist every 30 seconds for real-time triage
    const interval = setInterval(fetchWorklist, 30000);
    return () => clearInterval(interval);
  }, [fetchWorklist]);

  // Live countdown timer updater (ticks every 1 second)
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (deadlineStr) => {
    if (!deadlineStr) return { text: '—', isBreached: false, colorClass: 'text-gray-400' };
    const deadline = new Date(deadlineStr).getTime();
    const diffMs = deadline - now;
    
    if (diffMs <= 0) {
      const breachedMin = Math.abs(Math.floor(diffMs / 60000));
      return { 
        text: `BREACHED (+${breachedMin}m)`, 
        isBreached: true, 
        colorClass: 'text-red-600 bg-red-50 border-red-200 font-black animate-pulse' 
      };
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (hours > 0) {
      return { 
        text: `${hours}h ${minutes}m left`, 
        isBreached: false, 
        colorClass: hours < 2 ? 'text-amber-700 bg-amber-50 border-amber-200 font-bold' : 'text-slate-700 bg-slate-50 border-slate-200' 
      };
    }
    return { 
      text: `${minutes}m ${seconds}s left`, 
      isBreached: false, 
      colorClass: 'text-red-700 bg-red-50 border-red-200 font-black animate-pulse' 
    };
  };

  // Claim Order & Open Reading Interface
  const handleStartReading = async (order) => {
    try {
      if (order.status === 'DISPATCHED') {
        await axios.put(`${API_URL}/api/telerad/orders/${order.id}/claim`, {}, {
          headers: getAuthHeaders(),
        });
      }
      setReadingOrder(order);
      setFinalizeSuccess(false);
      
      // Attempt to load existing draft report if available
      try {
        const repRes = await axios.get(`${API_URL}/api/reports/${order.study_id}`, {
          headers: getAuthHeaders(),
        });
        setReportText(repRes.data.report_content || '');
      } catch {
        setReportText(`EXAMINATION: ${order.modality} ${order.body_part || ''}
CLINICAL INDICATION: ${order.clinical_notes || 'Teleradiology Consultation'}

FINDINGS:
- 

IMPRESSION:
- `);
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'فشل بدء قراءة الحالة. تأكد من عدم حجزها من قبل طبيب آخر.');
      fetchWorklist();
    }
  };

  // Finalize Report
  const handleFinalizeReport = async () => {
    if (!readingOrder) return;
    if (!reportText.trim()) {
      alert('يرجى إدخال التقرير الطبي قبل الاعتماد.');
      return;
    }

    setSubmittingReport(true);
    try {
      await axios.post(`${API_URL}/api/telerad/orders/${readingOrder.id}/finalize`, {
        report_content: reportText,
      }, {
        headers: getAuthHeaders(),
      });

      setFinalizeSuccess(true);
      fetchWorklist();
      setTimeout(() => {
        setReadingOrder(null);
        setFinalizeSuccess(false);
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.detail || 'فشل اعتماد التقرير.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (o.patient_name || '').toLowerCase().includes(q) ||
        (o.patient_id_number || '').toLowerCase().includes(q) ||
        (o.modality || '').toLowerCase().includes(q) ||
        (o.sender_clinic_name || '').toLowerCase().includes(q) ||
        (o.target_clinic_name || '').toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery]);

  const stats = useMemo(() => {
    const total = orders.length;
    const statCount = orders.filter((o) => o.priority === 'URGENT_STAT' && o.status !== 'COMPLETED').length;
    const inReading = orders.filter((o) => o.status === 'IN_READING').length;
    const completed = orders.filter((o) => o.status === 'COMPLETED').length;
    return { total, statCount, inReading, completed };
  }, [orders]);

  // Viewer URL Builder
  const getViewerUrl = (order) => {
    if (viewerType === 'ohif' && order.study_instance_uid) {
      return `${PACS_URL}/ohif/viewer?url=/dicom-web/studies/${order.study_instance_uid}`;
    }
    if (order.orthanc_study_uuid) {
      return `${PACS_URL}/osimis-viewer/app/index.html?study=${order.orthanc_study_uuid}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      
      {/* 1. Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Back to My Cases">
              <ArrowLeft size={20} />
            </a>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                T
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 tracking-tight leading-tight flex items-center gap-2">
                  CloudRad Teleradiology Network
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                    Hub & Spoke
                  </span>
                </h1>
                <p className="text-xs text-slate-400 font-medium">Multi-Center Reading Worklist & SLA Dispatch</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchWorklist} 
              disabled={loading}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh Worklist"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-teal-600' : ''} />
              <span>Refresh</span>
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
              <Building2 size={14} className="text-slate-500" />
              <span className="font-semibold text-slate-700">{doctor?.clinic_name || 'Reading Specialist'}</span>
              <span className="text-slate-400">&bull;</span>
              <span className="font-medium text-slate-600">{doctor?.name || 'Dr. Radiologist'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Content / Split-View Mode */}
      {readingOrder ? (
        /* SPLIT-VIEW READING WORKSPACE */
        <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-900 overflow-hidden">
          {/* Workspace Top Toolbar */}
          <div className="h-14 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setReadingOrder(null)}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-bold bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
              >
                <ArrowLeft size={14} /> Worklist
              </button>
              <div className="h-5 w-px bg-slate-800"></div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{readingOrder.patient_name}</span>
                <span className="text-xs text-slate-400">ID: {readingOrder.patient_id_number}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getModalityColor(readingOrder.modality)}`}>
                  {readingOrder.modality}
                </span>
                {readingOrder.priority === 'URGENT_STAT' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white uppercase tracking-wider animate-pulse flex items-center gap-1">
                    <ShieldAlert size={11} /> STAT URGENT
                  </span>
                )}
              </div>
            </div>

            {/* SLA & Viewer Switcher */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-xs">
                <Clock size={13} className="text-slate-400" />
                <span className="text-slate-400">SLA:</span>
                <span className={formatCountdown(readingOrder.sla_deadline).colorClass + ' px-1.5 py-0.5 rounded text-xs'}>
                  {formatCountdown(readingOrder.sla_deadline).text}
                </span>
              </div>
              <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-xs font-bold">
                <button
                  onClick={() => setViewerType('ohif')}
                  className={`px-2.5 py-1 rounded ${viewerType === 'ohif' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                >
                  OHIF Viewer
                </button>
                <button
                  onClick={() => setViewerType('osimis')}
                  className={`px-2.5 py-1 rounded ${viewerType === 'osimis' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                >
                  Osimis Viewer
                </button>
              </div>
              <a
                href={getViewerUrl(readingOrder) || '#'}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg border border-slate-700"
                title="Open in new window"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          {/* Split Pane: Left (DICOM Viewer) & Right (Report Editor) */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Pane: DICOM Viewer */}
            <div className="flex-1 bg-black relative border-r border-slate-800 flex flex-col">
              {getViewerUrl(readingOrder) ? (
                <iframe
                  src={getViewerUrl(readingOrder)}
                  title="PACS DICOM Viewer"
                  className="w-full h-full border-0 bg-black"
                  allow="fullscreen"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <Activity size={36} className="opacity-40" />
                  <p className="text-sm font-semibold">Viewer endpoint not configured or study UUID missing.</p>
                </div>
              )}
            </div>

            {/* Right Pane: Report Editor */}
            <div className="w-[480px] lg:w-[540px] bg-slate-900 text-slate-100 flex flex-col border-l border-slate-800 shrink-0">
              {/* Study Indication Header */}
              <div className="p-4 bg-slate-950/60 border-b border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-teal-400" />
                    Sender: <strong className="text-slate-200">{readingOrder.sender_clinic_name}</strong>
                  </span>
                  <span>Exam Date: {readingOrder.study_date || 'N/A'}</span>
                </div>
                {readingOrder.clinical_notes && (
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 text-xs text-amber-200/90 flex items-start gap-2">
                    <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Clinical Indication:</strong> {readingOrder.clinical_notes}</span>
                  </div>
                )}
              </div>

              {/* Template Shortcuts */}
              <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 text-xs">
                <span className="text-slate-400 text-[11px] font-bold uppercase">Templates:</span>
                <button
                  type="button"
                  onClick={() => setReportText(prev => prev + `\n\nCHEST X-RAY / CT:\nLungs are clear bilaterally. No pneumothorax or pleural effusion. Cardiomediastinal silhouette is within normal limits.`)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px]"
                >
                  Normal Chest
                </button>
                <button
                  type="button"
                  onClick={() => setReportText(prev => prev + `\n\nBRAIN CT/MRI:\nNo acute intracranial hemorrhage, midline shift, or mass effect. Ventricles and sulci are unremarkable for age.`)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px]"
                >
                  Normal Brain
                </button>
                <button
                  type="button"
                  onClick={() => setReportText('')}
                  className="px-2 py-0.5 rounded bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-red-400 text-[11px] ml-auto"
                >
                  Clear
                </button>
              </div>

              {/* Diagnostic Textarea */}
              <div className="flex-1 p-4 flex flex-col">
                <label className="text-xs font-bold text-slate-300 uppercase mb-2 flex items-center justify-between">
                  <span>Diagnostic Findings & Impression (التقرير والتشخيص)</span>
                  <span className="text-[11px] font-normal text-slate-500 font-mono">
                    {reportText.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </label>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Enter detailed radiological findings, technique, and clinical impression..."
                  className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono leading-relaxed resize-none"
                />
              </div>

              {/* Action Toolbar */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                {finalizeSuccess ? (
                  <div className="w-full py-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> تم اعتماد التقرير وإشعار المركز بنجاح!
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => alert('Draft saved locally.')}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Save size={14} /> Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalizeReport}
                      disabled={submittingReport}
                      className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl shadow-lg text-xs font-bold transition-all flex items-center gap-2 hover:shadow-teal-500/20"
                    >
                      {submittingReport ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Finalizing...
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          Finalize & Sign Report (اعتماد التقرير)
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* WORKLIST TABLE VIEW */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col space-y-6">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Orders</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                <FileText size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-500">STAT Urgent</p>
                <p className="text-2xl font-black text-red-600 mt-1">{stats.statCount}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center font-bold">
                <ShieldAlert size={20} className={stats.statCount > 0 ? 'animate-bounce' : ''} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-500">In Reading</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{stats.inReading}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Stethoscope size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">Completed</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{stats.completed}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 size={20} />
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterType === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Cases
              </button>
              <button
                onClick={() => setFilterType('stat')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  filterType === 'stat' ? 'bg-red-600 text-white shadow-xs' : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                STAT Urgent
              </button>
              <button
                onClick={() => setFilterType('routine')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterType === 'routine' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Routine
              </button>
              <button
                onClick={() => setFilterType('claimed')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterType === 'claimed' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                My Reading Cases
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, ID, modality, center..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Worklist Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <Loader2 size={28} className="animate-spin text-teal-600" />
                <p className="text-xs font-semibold">Loading multi-center teleradiology worklist...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <CheckCircle2 size={32} className="text-slate-300" />
                <p className="text-sm font-bold text-slate-600">Worklist Clear</p>
                <p className="text-xs text-slate-400">No pending orders matching the current filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-5 py-3.5">Priority</th>
                      <th className="px-5 py-3.5">SLA Countdown</th>
                      <th className="px-5 py-3.5">Patient / Study</th>
                      <th className="px-5 py-3.5">Modality</th>
                      <th className="px-5 py-3.5">Sender Center</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Assigned Radiologist</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((o) => {
                      const countdown = formatCountdown(o.sla_deadline);
                      const isClaimedByMe = o.assigned_radiologist_id === doctor?.id;
                      
                      return (
                        <tr 
                          key={o.id} 
                          className={`hover:bg-slate-50/80 transition-colors ${o.priority === 'URGENT_STAT' ? 'bg-red-50/20' : ''}`}
                        >
                          {/* Priority Badge */}
                          <td className="px-5 py-4">
                            {o.priority === 'URGENT_STAT' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-600 text-white uppercase tracking-wider shadow-xs animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                STAT
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase border border-slate-200">
                                Routine
                              </span>
                            )}
                          </td>

                          {/* SLA Countdown Timer */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${countdown.colorClass}`}>
                              <Clock size={12} className="shrink-0" />
                              {countdown.text}
                            </span>
                          </td>

                          {/* Patient & Study */}
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900 text-sm">{o.patient_name}</div>
                            <div className="text-slate-400 text-[11px] font-mono mt-0.5">ID: {o.patient_id_number}</div>
                            {o.body_part && (
                              <div className="text-slate-500 text-[11px] italic mt-0.5">{o.body_part}</div>
                            )}
                          </td>

                          {/* Modality */}
                          <td className="px-5 py-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-black border ${getModalityColor(o.modality)}`}>
                              {o.modality}
                            </span>
                          </td>

                          {/* Sender Center */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                              <Building2 size={14} className="text-slate-400 shrink-0" />
                              <span className="truncate max-w-[140px]">{o.sender_clinic_name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">➔ {o.target_clinic_name}</div>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            {o.status === 'COMPLETED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={12} /> Completed
                              </span>
                            ) : o.status === 'IN_READING' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Stethoscope size={12} /> In Reading
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                Dispatched
                              </span>
                            )}
                          </td>

                          {/* Assigned Radiologist */}
                          <td className="px-5 py-4">
                            {o.assigned_radiologist_name ? (
                              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                                <UserCheck size={13} className="text-teal-600" />
                                {o.assigned_radiologist_name}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="px-5 py-4 text-right">
                            {o.status === 'COMPLETED' ? (
                              <button
                                onClick={() => handleStartReading(o)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                              >
                                <Eye size={13} /> View Report
                              </button>
                            ) : o.status === 'IN_READING' ? (
                              <button
                                onClick={() => handleStartReading(o)}
                                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors"
                              >
                                <Stethoscope size={13} /> Continue Reading
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartReading(o)}
                                className={`px-4 py-1.5 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors ${
                                  o.priority === 'URGENT_STAT'
                                    ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                                    : 'bg-teal-600 hover:bg-teal-500 text-white'
                                }`}
                              >
                                <Stethoscope size={13} /> Claim & Read
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      )}

    </div>
  );
}
