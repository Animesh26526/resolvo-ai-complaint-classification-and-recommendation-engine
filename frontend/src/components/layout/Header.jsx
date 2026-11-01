import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Provides the top header, user profile menu, and global search UI.
export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white/90 backdrop-blur-md z-40 border-b border-slate-200">
      <div className="w-full h-full px-6 flex items-center justify-between gap-4">
        {/* Search Input */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input 
              className="w-full pl-9 pr-12 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]" 
              placeholder="Search complaint ID, customer, SLA status, or keywords..." 
              type="text" 
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-200/50">⌘K</span>
          </div>
        </div>

        {/* Header Actions / User */}
        <div className="flex items-center gap-3">

          {/* Time */}
          <div className="hidden md:flex items-center gap-1.5 text-slate-600 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md">
            <span className="material-symbols-outlined text-[14px] text-slate-400">schedule</span>
            <span className="font-mono text-xs font-medium text-slate-700">{time}</span>
          </div>
          
          {/* Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 relative group">
            <div className="flex items-center gap-2.5 cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-100/70 transition-colors">
              <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold uppercase">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs text-slate-900 font-semibold leading-tight">{user?.name || 'User'}</span>
                <span className="text-[11px] text-slate-500 leading-tight">{user?.role || 'Guest'}</span>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-[16px]">expand_more</span>
            </div>
            
            {/* Dropdown Menu (Hover for now) */}
            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-2">
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-slate-50 rounded-md flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
