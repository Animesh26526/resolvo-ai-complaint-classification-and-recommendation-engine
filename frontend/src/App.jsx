import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Server, 
  Cpu, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Users, 
  Headphones, 
  CheckSquare, 
  BarChart3 
} from 'lucide-react';
import { checkBackendHealth } from './services/api';

export default function App() {
  const [backendHealth, setBackendHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await checkBackendHealth();
      setBackendHealth(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to connect to backend');
      setBackendHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const roles = [
    {
      title: 'Customer',
      code: 'customer',
      icon: Users,
      color: 'blue',
      description: 'Submit text/call complaints, receive AI-driven suggestions, and track complaint status.'
    },
    {
      title: 'Customer Support Executive (CSE)',
      code: 'cse',
      icon: Headphones,
      color: 'indigo',
      description: 'Review multi-channel complaints, view AI recommendations, take resolution actions, or escalate.'
    },
    {
      title: 'Quality Assurance Team (QAT)',
      code: 'qat',
      icon: CheckSquare,
      color: 'emerald',
      description: 'Validate classification accuracy, inspect resolution quality, and identify recurring issues.'
    },
    {
      title: 'Operations Manager (OM)',
      code: 'om',
      icon: BarChart3,
      color: 'purple',
      description: 'Monitor overall SLA compliance, category/priority distribution, workload metrics, and export reports.'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">Resolvo</span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                Core Engine v1.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Check Backend
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            AI-Powered Complaint Classification & Resolution Recommendation Engine
          </h1>
          <p className="text-slate-400 text-base sm:text-lg">
            Automating multi-channel complaint intake, classification (Product, Packaging, Trade), sentiment analysis, dynamic priority assignment, and intelligent resolution recommendations.
          </p>
        </section>

        {/* System Architecture Health Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Frontend Card */}
          <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/70 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Frontend UI</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-700/60 rounded-lg text-indigo-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-200">React + Vite</p>
                <p className="text-xs text-slate-400">Tailwind CSS Shell Ready</p>
              </div>
            </div>
          </div>

          {/* Backend Card */}
          <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/70 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Main Backend</span>
              <span className={`w-2.5 h-2.5 rounded-full ${backendHealth ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-700/60 rounded-lg text-emerald-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-200">Node.js + Express</p>
                <p className="text-xs text-slate-400">
                  {backendHealth ? `Status: ${backendHealth.status}` : 'Awaiting connection...'}
                </p>
              </div>
            </div>
          </div>

          {/* Database Card */}
          <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/70 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Database</span>
              <span className={`w-2.5 h-2.5 rounded-full ${backendHealth?.database?.isConnected ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-700/60 rounded-lg text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-200">MongoDB + Mongoose</p>
                <p className="text-xs text-slate-400">
                  {backendHealth?.database ? `DB: ${backendHealth.database.status}` : 'Configured (ComplaintDB)'}
                </p>
              </div>
            </div>
          </div>

          {/* AI Service Card */}
          <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/70 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI/ML Service</span>
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-700/60 rounded-lg text-indigo-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-200">FastAPI + Python</p>
                <p className="text-xs text-slate-400">Service Initialized (:8000)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Backend Connectivity Status Box */}
        <section className="p-5 rounded-xl bg-slate-800/40 border border-slate-800 text-sm">
          <div className="flex items-center gap-2 mb-2 font-medium text-slate-300">
            {backendHealth ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : error ? (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            ) : (
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            )}
            <span>Backend Integration Status</span>
          </div>
          {backendHealth ? (
            <p className="text-emerald-400 text-xs">
              Connected to backend successfully. API message: "{backendHealth.message}" at {backendHealth.timestamp}
            </p>
          ) : error ? (
            <p className="text-amber-400 text-xs">
              Backend not currently reachable on configured endpoint. Run <code className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-200">npm run dev</code> inside <code className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-200">backend/</code> to start the Express server.
            </p>
          ) : (
            <p className="text-slate-400 text-xs">Pinging Node.js backend health endpoint...</p>
          )}
        </section>

        {/* System Roles Architecture */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Role-Based System Modules (PRD Reference)</h2>
            <p className="text-sm text-slate-400">The platform is structured to support four core authenticated user roles:</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <div 
                  key={role.code} 
                  className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 transition space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100 text-base">{role.title}</h3>
                      <span className="text-xs text-indigo-400 font-mono">Role: {role.code}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {role.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/50 text-center py-6 text-xs text-slate-500">
        Resolvo Engine &bull; Initial Architecture Setup Stage &bull; Ready for Feature Implementation
      </footer>
    </div>
  );
}
