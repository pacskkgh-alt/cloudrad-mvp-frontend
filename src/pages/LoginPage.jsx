import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Loader2, Stethoscope, ChevronRight } from 'lucide-react';
import axios from 'axios';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.167-233-227-144.nip.io';
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      
      localStorage.setItem('cloudrad_token', res.data.access_token);
      localStorage.setItem('cloudrad_doctor', JSON.stringify({
        id: res.data.doctor_id,
        name: res.data.full_name,
        email: res.data.email,
        clinic_id: res.data.clinic_id,
        role: res.data.role,
      }));
      
      onLogin(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else {
        setError('خطأ في الاتصال بالخادم. تأكد من تشغيل الخدمات.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] relative overflow-hidden font-sans" dir="rtl">
      
      {/* --- Aesthetic Abstract Background Orbs --- */}
      <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-blue-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-10000 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-cyan-600/20 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-7000 pointer-events-none"></div>
      
      {/* Decorative Network Grid */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-lg px-6">
        
        {/* App Logo Area */}
        <div className="flex flex-col items-center justify-center mb-10 transform transition-all hover:scale-105 duration-500">
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-[0_0_40px_rgba(56,189,248,0.5)] mb-4 before:absolute before:inset-0 before:bg-white/20 before:rounded-2xl before:backdrop-blur-sm">
            <Stethoscope className="w-10 h-10 text-white relative z-10 drop-shadow-md" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-cyan-200 drop-shadow-sm">
            CloudRad <span className="font-light text-blue-400">Access</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm font-medium tracking-wide">المنصة السحابية المتقدمة لطب الأشعة</p>
        </div>

        {/* Premium Glassmorphism Card */}
        <div className="relative group">
          {/* Glowing Border Underlay */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/50 to-cyan-400/50 rounded-[2rem] blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
          
          <div className="relative bg-[#111827]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-10 shadow-2xl overflow-hidden text-right">
            
            {/* Subtle card highlight */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <div className="flex items-center justify-center gap-2 mb-8 bg-blue-500/10 text-blue-400 py-2.5 px-4 rounded-xl border border-blue-500/20 shadow-inner">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-semibold tracking-wider">بوابة دخول موحدة (Simple Access)</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {/* Email Input */}
              <div className="relative group/input">
                <label className="block text-sm font-medium text-gray-300 mb-2 transition-colors group-focus-within/input:text-blue-400">عنوان البريد الإلكتروني</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@clinic.com"
                    required
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 focus:bg-white/10 transition-all duration-300 peer shadow-inner"
                  />
                  {/* Focus line effect */}
                  <div className="absolute bottom-0 left-1/2 right-1/2 h-0.5 bg-blue-400 transition-all duration-300 peer-focus:left-0 peer-focus:right-0 opacity-0 peer-focus:opacity-100 rounded-b-xl"></div>
                </div>
              </div>

              {/* Password Input */}
              <div className="relative group/input">
                <label className="block text-sm font-medium text-gray-300 mb-2 transition-colors group-focus-within/input:text-blue-400">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-5 py-4 pl-14 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 focus:bg-white/10 transition-all duration-300 peer shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors duration-200 bg-white/5 p-1.5 rounded-md hover:bg-white/10"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <div className="absolute bottom-0 left-1/2 right-1/2 h-0.5 bg-blue-400 transition-all duration-300 peer-focus:left-0 peer-focus:right-0 opacity-0 peer-focus:opacity-100 rounded-b-xl"></div>
                </div>
              </div>

              {error && (
                <div className="animate-in fade-in slide-in-from-top-2 text-red-300 text-sm bg-red-950/40 border border-red-500/30 px-4 py-3 rounded-xl flex items-center gap-2">
                  <div className="w-1.5 h-full rounded-full bg-red-500"></div>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
              >
                {/* Button shine effect */}
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-[shine_1s_infinite]"></div>
                
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    المصادقة جارية...
                  </>
                ) : (
                  <>
                    الدخول للنظام
                    <ChevronRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center flex flex-col gap-1 items-center opacity-60 hover:opacity-100 transition-opacity duration-300">
          <p className="text-gray-400 text-xs tracking-wider">نظام فحص متوافق مع مبادئ DICOM</p>
          <div className="flex gap-2 text-gray-500 text-[10px]">
             <span>الدعم الفني</span> • <span>الخصوصية</span> • <span>الشروط</span>
          </div>
        </div>
      </div>
      
      {/* Tailwind Custom Keyframes Extension inside style array if needed */}
      <style>{`
        @keyframes shine {
          100% { left: 200%; }
        }
      `}</style>
    </div>
  );
}
