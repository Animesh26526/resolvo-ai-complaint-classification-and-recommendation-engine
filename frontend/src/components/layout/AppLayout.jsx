import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import SahayakAI from './SahayakAI';

// Main layout wrapper for authenticated sections, containing the sidebar and header.
export default function AppLayout() {
  return (
    <div className="bg-[#f8fafc] font-sans text-slate-900 antialiased selection:bg-slate-900 selection:text-white flex min-h-screen">
      <Sidebar />
      <div className="pl-64 flex flex-col flex-1 w-full min-h-screen">
        <Header />
        <main className="relative w-full pt-16 flex-1">
          <Outlet />
        </main>
      </div>
      <SahayakAI />
    </div>
  );
}
