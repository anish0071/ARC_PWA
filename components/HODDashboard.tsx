import React, { useState, useRef, useEffect } from "react";
import { UserState } from "../types";
import { Logo } from "./UI";
import { fetchAvailableSections } from "../services/arcData";

interface SectionCardProps {
  section: string;
  type: "non-sde" | "sde";
  onClick: () => void;
}

/**
 * SectionCard displays a clickable card for navigating into a section.
 * All statistics should be fetched from the database—this card now shows only
 * section type classification (Technical Track / Core Skills) without mock numbers.
 */
const SectionCard: React.FC<SectionCardProps> = ({
  section,
  type,
  onClick,
}) => {
  const isSDE = type === "sde";

  return (
    <div
      onClick={onClick}
      className="group relative bg-white/95 rounded-[2.5rem] p-7 border border-slate-100 shadow-sm hover:shadow-2xl hover:border-violet-300 transition-all duration-500 cursor-pointer active:scale-[0.98] pearl-glass"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-900 uppercase tracking-tight group-hover:text-violet-600 transition-colors">
            Section {section}
          </h3>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {isSDE ? "Technical Track" : "Core Skills"}
            </p>
          </div>
        </div>
        <div
          className={`p-2.5 rounded-2xl transition-all duration-500 group-hover:scale-110 ${
            isSDE
              ? "bg-orange-50 text-orange-500 shadow-orange-100"
              : "bg-violet-50 text-violet-500 shadow-violet-100"
          } shadow-inner`}
        >
          {isSDE ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
          Click to view students
        </p>

        <div className="pt-5 mt-2 border-t border-slate-50 flex items-center justify-end">
          <div className="w-7 h-7 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-violet-600 group-hover:text-white group-hover:rotate-45 transition-all duration-500">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HODDashboard: React.FC<{
  user: UserState;
  onLogout: () => void;
  onSectionSelect: (section: string) => void;
}> = ({ user, onLogout, onSectionSelect }) => {
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [sections, setSections] = useState<string[]>([]);
  const [sectionsError, setSectionsError] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchAvailableSections();
        if (mounted) setSections(data);
      } catch (e: any) {
        if (mounted) setSectionsError(e?.message ?? "Failed to load sections.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Defined ranges: A-M for Non-SDE, N-Q for SDE
  const nonSdeSections = sections.filter((s) => /^[A-M]$/.test(s));
  const sdeSections = sections.filter((s) => /^[N-Q]$/.test(s));

  return (
    <div className="min-h-screen bg-[#fcfaff] flex flex-col font-medium text-slate-900 text-xs selection:bg-violet-100 selection:text-violet-700">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 p-5 sticky top-0 z-50">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none animate-in slide-in-from-left duration-700">
              Department Dashboard
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 opacity-80">
              CSE Department - Activity Intelligence
            </p>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-5 hover:bg-slate-50 p-2 pr-4 rounded-[1.5rem] transition-all duration-300 group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-[12px] font-black text-slate-900 leading-none group-hover:text-violet-600 transition-colors">
                  {user.username}
                </p>
                <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-tighter">
                  HOD Portal
                </p>
              </div>
              <div className="w-11 h-11 bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-xl shadow-violet-200 group-hover:rotate-12 transition-transform duration-500">
                HD
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-[2rem] shadow-2xl border border-slate-100 py-3 z-[60] animate-in zoom-in-95 duration-300">
                <div className="px-5 py-3 border-b border-slate-50 mb-2">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                    Active Auth
                  </p>
                  <p className="text-[11px] font-black text-slate-700 truncate">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-5 py-4 text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-3"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M17 16l4-4m0 0l-4-4m4 4H7"
                    />
                  </svg>
                  Terminate Session
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto w-full p-10 space-y-16">
        {/* Intelligence Search Bar */}
        <section className="space-y-5 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="relative group max-w-3xl">
            <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none text-slate-300 group-focus-within:text-violet-500 transition-colors duration-300">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search activities, query data, or ask questions..."
              className="w-full bg-white border border-slate-200 rounded-[2rem] py-6 pl-16 pr-8 text-base font-semibold shadow-sm focus:outline-none focus:ring-8 focus:ring-violet-500/5 focus:border-violet-300 transition-all placeholder:text-slate-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 pl-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Suggested Queries:
            </span>
            <div className="flex flex-wrap gap-2">
              <QueryTip label="Top 10 LeetCode" />
              <QueryTip label="Low Submission sections" />
              <QueryTip label="Section Q status" />
            </div>
            <div className="ml-auto">
              <button
                onClick={() => onSectionSelect("ALL")}
                className="px-4 py-2 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-violet-700 transition-colors"
              >
                View All Students
              </button>
            </div>
          </div>
        </section>

        {/* Non-SDE Sector (A-M) */}
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-violet-600 rounded-full"></div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Non SDE Sectors (A-M)
              </h2>
            </div>
            <button className="px-5 py-2 bg-slate-50 hover:bg-violet-50 text-[10px] font-black text-violet-600 uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
              View Analytics Matrix
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M14 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {sectionsError && (
              <div className="col-span-full text-[10px] font-black text-rose-500 uppercase tracking-widest">
                {sectionsError}
              </div>
            )}
            {!sectionsError && nonSdeSections.length === 0 && (
              <div className="col-span-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                No sections available in this range
              </div>
            )}
            {nonSdeSections.map((sec) => (
              <SectionCard
                key={sec}
                section={sec}
                type="non-sde"
                onClick={() => onSectionSelect(sec)}
              />
            ))}
          </div>
        </section>

        {/* SDE Sector (N-Q) */}
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-orange-500 rounded-full"></div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                SDE Technical Tracks (N-Q)
              </h2>
            </div>
            <button className="px-5 py-2 bg-slate-50 hover:bg-orange-50 text-[10px] font-black text-orange-600 uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
              View Submission Grid
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M14 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {sdeSections.length === 0 && (
              <div className="col-span-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                No sections available in this range
              </div>
            )}
            {sdeSections.map((sec) => (
              <SectionCard
                key={sec}
                section={sec}
                type="sde"
                onClick={() => onSectionSelect(sec)}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-20 p-16 flex flex-col items-center gap-6 bg-slate-50/50 border-t border-slate-100">
        <Logo />
        <div className="text-center space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[1em] text-slate-300">
            A.R.C. Departmental Network
          </p>
        </div>
      </footer>
    </div>
  );
};

const QueryTip: React.FC<{ label: string }> = ({ label }) => (
  <span className="px-3 py-1 bg-white border border-slate-100 text-[9px] font-black text-slate-500 rounded-lg hover:border-violet-200 hover:text-violet-600 cursor-pointer transition-all uppercase tracking-tighter">
    "{label}"
  </span>
);
