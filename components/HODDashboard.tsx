
import React, { useState, useRef, useEffect } from 'react';
import { UserState } from '../types';
import { Logo } from './UI';

interface ActivityCardProps {
  title: string;
  date: string;
  metric1Label: string;
  metric1Value: string;
  metric2Label: string;
  metric2Value: string;
  metric2Color?: string;
  status: 'ONGOING' | 'COMPLETED';
  type: 'non-sde' | 'sde';
  onClick: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ 
  title, date, metric1Label, metric1Value, metric2Label, metric2Value, metric2Color, status, type, onClick 
}) => {
  const isSDE = type === 'sde';
  return (
    <div 
      onClick={onClick}
      className="ripple-card bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden cursor-pointer active:scale-95"
    >
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-sm font-black leading-tight transition-colors duration-300 uppercase tracking-tight group-hover:text-white">
          {title}
        </h3>
        <div className="transition-colors duration-300 group-hover:text-white/60">
          {isSDE ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          )}
        </div>
      </div>
      
      <div className="space-y-4 relative z-10">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 group-hover:text-white/50 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {date}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-bold text-slate-400 group-hover:text-white/60 transition-colors">{metric1Label}:</span>
            <span className="font-black text-slate-700 group-hover:text-white transition-colors">{metric1Value}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-bold text-slate-400 group-hover:text-white/60 transition-colors">{metric2Label}:</span>
            <span className={`font-black transition-colors ${metric2Color || 'text-emerald-500'} group-hover:text-white`}>
              {metric2Value}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-50 group-hover:border-white/10 flex items-center justify-between">
          <span className={`text-[9px] font-black tracking-widest uppercase transition-colors ${status === 'ONGOING' ? 'text-blue-500' : 'text-emerald-500'} group-hover:text-white/90`}>
            {status}
          </span>
          <div className="p-1.5 rounded-lg text-slate-300 group-hover:text-white transition-all transform group-hover:translate-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickFilter: React.FC<{ label: string; icon: React.ReactNode; color: string }> = ({ label, icon, color }) => (
  <button className={`ripple-card group relative overflow-hidden bg-white border-2 border-slate-100 px-6 py-3 rounded-2xl flex items-center gap-3 transition-all hover:border-violet-200 active:scale-95 shadow-sm`}>
    <div className={`p-2 rounded-xl transition-colors duration-300 group-hover:bg-white/20 ${color} text-white relative z-10`}>
      {icon}
    </div>
    <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 transition-colors duration-300 group-hover:text-white relative z-10">
      {label}
    </span>
  </button>
);

export const HODDashboard: React.FC<{ user: UserState; onLogout: () => void; onSectionSelect: (section: string) => void }> = ({ user, onLogout, onSectionSelect }) => {
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nonSdeSections = Array.from({ length: 13 }, (_, i) => String.fromCharCode(65 + i));
  const sdeSections = Array.from({ length: 4 }, (_, i) => String.fromCharCode(78 + i));

  return (
    <div className="min-h-screen bg-[#fcfaff] flex flex-col">
      <header className="bg-gradient-to-r from-violet-600 to-indigo-700 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight uppercase leading-none">A.R.C. Command</h1>
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-80 mt-0.5">Intelligence Node • HOD Portal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="relative" ref={dropdownRef}>
               <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 bg-white/10 p-1.5 pr-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all active:scale-95"
               >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-violet-700 font-bold text-xs shadow-sm">
                    {user.username.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold leading-tight">{user.username}</span>
                    <span className="text-[9px] opacity-70 uppercase tracking-tighter">Department Head</span>
                  </div>
                  <svg className={`w-3 h-3 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                  </svg>
               </button>

               {dropdownOpen && (
                 <div className="absolute right-0 mt-3 w-48 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 py-2 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-800/50 mb-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Node Admin</p>
                    </div>
                    <button className="w-full text-left px-4 py-3 text-[11px] font-bold text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Department Settings
                    </button>
                    <div className="h-px bg-slate-800 my-1 mx-2"></div>
                    <button 
                      onClick={onLogout}
                      className="w-full text-left px-4 py-3 text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Log out
                    </button>
                 </div>
               )}
             </div>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-[1600px] mx-auto w-full">
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase animate-in slide-in-from-left duration-700">CSE DEPARTMENT</h2>
      </div>

      <div className="max-w-[1600px] mx-auto w-full px-8 mb-12 space-y-6">
        <div className="max-w-3xl">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search sections, query metrics, or ask questions..." 
              className="w-full bg-white border border-slate-200 rounded-2xl py-5 pl-14 pr-6 text-sm font-medium shadow-sm focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-300 transition-all placeholder:text-slate-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-violet-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
          <QuickFilter 
            label="LeetCode" 
            color="bg-orange-500"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
          />
          <QuickFilter 
            label="CGPA" 
            color="bg-violet-600"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14v7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5.48 10.58l4.74 2.63" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.52 10.58l-4.74 2.63" /></svg>}
          />
          <QuickFilter 
            label="CodeChef" 
            color="bg-rose-500"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v13m0 0l4-4m-4 4l-4-4m-3 7h14" /></svg>}
          />
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto w-full px-8 flex flex-col gap-12 pb-20">
        
        {/* SDE Section (N-Q) */}
        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="section-badge group">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-3 group-hover:text-violet-600 transition-colors animate-glow">
                <span className="p-1 bg-violet-600 rounded-md text-white">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </span>
                SDE TRACKS
              </h2>
            </div>
            <button className="text-[10px] font-black text-violet-600 uppercase tracking-widest hover:translate-x-1 transition-transform border-b-2 border-transparent hover:border-violet-600 pb-1">Full Grid →</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sdeSections.map((sec) => (
              <ActivityCard 
                key={sec}
                title={`Section ${sec}`} 
                date="Dec 24, 2025" 
                metric1Label="Avg Submission" metric1Value={`${85 + Math.floor(Math.random() * 15)}%`}
                metric2Label="Below 80%" metric2Value={`${Math.floor(Math.random() * 5)} units`} 
                metric2Color={Math.random() > 0.5 ? 'text-emerald-500' : 'text-rose-500'}
                status={Math.random() > 0.2 ? 'ONGOING' : 'COMPLETED'} 
                type="sde" 
                onClick={() => onSectionSelect(sec)}
              />
            ))}
          </div>
        </section>

        {/* Non SDE Section (A-M) */}
        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="section-badge group">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-3 group-hover:text-violet-600 transition-colors animate-glow">
                <span className="p-1 bg-indigo-600 rounded-md text-white">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </span>
                CORE SECTIONS
              </h2>
            </div>
            <button className="text-[10px] font-black text-violet-600 uppercase tracking-widest hover:translate-x-1 transition-transform border-b-2 border-transparent hover:border-violet-600 pb-1">Full Grid →</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {nonSdeSections.map((sec) => (
              <ActivityCard 
                key={sec}
                title={`Section ${sec}`} 
                date="Dec 24, 2025" 
                metric1Label="Participants" metric1Value={(150 + Math.floor(Math.random() * 100)).toString()}
                metric2Label="Completion" metric2Value={`${70 + Math.floor(Math.random() * 30)}%`}
                metric2Color={Math.random() > 0.5 ? 'text-emerald-500' : 'text-orange-500'}
                status={Math.random() > 0.3 ? 'COMPLETED' : 'ONGOING'} 
                type="non-sde" 
                onClick={() => onSectionSelect(sec)}
              />
            ))}
          </div>
        </section>

      </main>

      <footer className="mt-auto p-10 border-t border-slate-50 flex flex-col items-center gap-4 bg-white/50">
        <Logo />
        <p className="text-[9px] font-black uppercase tracking-[1em] text-slate-300">A.R.C. Strategic Intelligence Network</p>
      </footer>
    </div>
  );
};
