import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
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
      const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.165-227-89-199.nip.io';
          
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
        setError('Invalid Email or Password.');
      } else {
        setError('Server connection error.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 font-sans selection:bg-emerald-500/30">
      <div className="w-full max-w-[420px] p-8 sm:p-10 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
        
        {/* Subtle Background Accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-emerald-500"></div>

        {/* CloudRad Branding */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20 mb-5 relative overflow-hidden">
            <span className="text-3xl font-black text-white tracking-widest leading-none z-10 italic font-serif">M</span>
            {/* Subtle gloss effect */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20"></div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">CLOUDRAD</h1>
          <p className="text-gray-500 mt-2 text-sm font-medium tracking-wide">Enter the clinical portal</p>
        </div>

        {/* Error Warning */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 border-l-4 border-l-red-500 text-sm font-medium text-center shadow-sm">
            {error}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 transition-colors">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-200 shadow-sm font-medium"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-2 transition-colors">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3.5 pr-12 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-200 shadow-sm font-bold tracking-widest placeholder:tracking-normal"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors duration-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:-translate-y-0.5 disabled:transform-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Separator */}
        <div className="relative mt-8 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
             <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative bg-white px-4 text-[11px] text-gray-400 uppercase font-bold tracking-widest">
            Or continue with
          </div>
        </div>

        {/* Google Authentication Module */}
        <button
          type="button"
          onClick={() => alert("Google Workspace Auth not yet configured.")}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-xl transition-all duration-200 mb-8 shadow-sm group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>

        {/* Minimal Text Anchors */}
        <div className="flex flex-col items-center justify-center gap-3 text-[13px] font-medium">
          <span className="text-gray-500 hover:text-gray-900 transition-colors duration-200 cursor-pointer">
            Forgot password?
          </span>
          <div className="text-gray-500">
            Don't have an account?{' '}
            <span className="text-emerald-500 hover:text-emerald-600 font-bold transition-colors duration-200 cursor-pointer">
              Register a new account
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
