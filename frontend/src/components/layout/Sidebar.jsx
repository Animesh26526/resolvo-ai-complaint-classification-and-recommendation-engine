import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

// Provides the main navigation sidebar, dynamically rendering links based on user role.
export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  // Define navigation based on role
  const getNavItems = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'om':
        return [
          { name: 'Operations Overview', path: '/om/dashboard', icon: 'dashboard' },
          { name: 'All Complaints', path: '/om/complaints', icon: 'inbox' },
          { name: 'Reports & Export', path: '/om/reports', icon: 'cloud_download' },
        ];
      case 'qat':
        return [
          { name: 'AI Re-Review & QA', path: '/qat/dashboard', icon: 'fact_check' },
          { name: 'All Complaints', path: '/qat/complaints', icon: 'inbox' },
        ];
      case 'cse':
        return [
          { name: 'My Dashboard', path: '/cse/dashboard', icon: 'dashboard' },
          { name: 'My Assigned Cases', path: '/cse/complaints', icon: 'inbox' },
          { name: 'Submit Intake', path: '/cse/submit', icon: 'post_add' },
        ];
      case 'customer':
        return [
          { name: 'Submit Complaint', path: '/customer/submit', icon: 'post_add' },
          { name: 'My Complaints', path: '/customer/complaints', icon: 'inbox' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  
  const roleNameMap = {
    'om': 'Operations Manager',
    'qat': 'QA Team',
    'cse': 'Customer Support',
    'customer': 'Customer'
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-50 border-r border-slate-200 z-50 flex flex-col justify-between select-none">
      <div className="flex flex-col">
        {/* App Brand */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <span className="font-bold text-sm tracking-tight font-sans">R</span>
            </div>
            <span className="font-semibold text-slate-900 text-[15px] tracking-tight">Resolvo</span>
          </div>
        </div>

        {/* Current Role Pill */}
        {user && (
          <div className="px-4 py-3">
            <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs text-slate-700 font-medium">{roleNameMap[user.role] || user.role}</span>
              </div>
              <span className="font-mono text-[10px] text-slate-500 font-medium uppercase px-1.5 py-0.5 bg-slate-100 rounded">Active</span>
            </div>
          </div>
        )}

        {/* Section Label */}
        <div className="px-5 mt-2 mb-1.5">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400 font-medium">Navigation</span>
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-0.5 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors",
                isActive 
                  ? "bg-slate-200/70 text-slate-900 font-medium" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              )}
            >
              {({ isActive }) => (
                <>
                  <span className={clsx("material-symbols-outlined text-[18px]", isActive ? "text-slate-800" : "text-slate-500")}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      
    </aside>
  );
}
