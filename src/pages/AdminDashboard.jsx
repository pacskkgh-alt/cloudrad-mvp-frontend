import React, { useState, useEffect } from 'react';
import { Users, File, Building, LogOut, Sun, Moon } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

function getAuthHeaders() {
  const token = localStorage.getItem('cloudrad_token');
  return { Authorization: `Bearer ${token}` };
}

export default function AdminDashboard({ doctor, onLogout }) {
  const [darkMode, setDarkMode] = useState(true);
  const [stats, setStats] = useState({ totalStudies: 0 });

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    // A simple endpoint to get overall data for the MVP
    axios.get(`${API_URL}/api/studies`, { headers: getAuthHeaders() })
      .then(res => setStats({ totalStudies: res.data.length }))
      .catch(console.error);
  }, []);

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-[#0a0f1c] text-white' : 'bg-slate-50 text-slate-900'} transition-colors duration-500 font-sans`} dir="rtl">
      <header className={`flex justify-between items-center p-5 lg:px-10 backdrop-blur-md sticky top-0 z-40 transition-colors ${darkMode ? 'bg-[#0a0f1c]/80 border-b border-white/5' : 'bg-white/80 border-b border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-400 flex items-center justify-center shadow-lg">
            <h1 className="text-xl font-bold text-white uppercase tracking-wider">CR</h1>
          </div>
          <h1 className="text-xl font-bold">CloudRad <span className="font-light text-indigo-400">الإدارة</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-medium px-4 py-1.5 rounded-full ${darkMode ? 'bg-slate-800/50 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
            مرحباً، المدير {doctor?.name}
          </span>
          <button onClick={toggleDark} className={`p-2.5 rounded-full ${darkMode ? 'bg-slate-800/80 text-yellow-400' : 'bg-white text-slate-600'}`}>
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={onLogout} className="p-2.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <h2 className="text-3xl font-bold tracking-tight mb-8">نظرة عامة على النظام</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-8 rounded-3xl border shadow-xl flex items-center gap-6 ${darkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="p-5 rounded-2xl bg-indigo-500/20 text-indigo-400">
               <File className="w-10 h-10" />
            </div>
            <div>
               <p className="text-4xl font-black">{stats.totalStudies}</p>
               <p className="text-sm text-slate-500 font-bold mt-1">إجمالي الفحوصات في النظام</p>
            </div>
          </div>
          <div className={`p-8 rounded-3xl border shadow-xl flex items-center gap-6 ${darkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="p-5 rounded-2xl bg-cyan-500/20 text-cyan-400">
               <Building className="w-10 h-10" />
            </div>
            <div>
               <p className="text-4xl font-black">--</p>
               <p className="text-sm text-slate-500 font-bold mt-1">العيادات النشطة (قريباً)</p>
            </div>
          </div>
          <div className={`p-8 rounded-3xl border shadow-xl flex items-center gap-6 ${darkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="p-5 rounded-2xl bg-purple-500/20 text-purple-400">
               <Users className="w-10 h-10" />
            </div>
            <div>
               <p className="text-4xl font-black">--</p>
               <p className="text-sm text-slate-500 font-bold mt-1">المستخدمين والأطباء (قريباً)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
