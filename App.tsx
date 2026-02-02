import React, { useEffect, useMemo, useState, useCallback } from "react";
import { UserState } from "./types";
import { Input, Button, Logo } from "./components/UI";
import { Dashboard } from "./components/Dashboard";
import { HODDashboard } from "./components/HODDashboard";
import { supabase } from "./services/supabaseClient";
import { fetchProfileByUserId } from "./services/arcData";
import {
  clearStoredSession,
  readStoredSession,
} from "./services/authBootstrap";

const LectureIllustration = () => (
  <div className="relative w-full max-w-2xl mx-auto p-4 animate-float transform scale-125 lg:scale-[1.4] transition-transform duration-700">
    <svg
      viewBox="0 0 800 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-2xl overflow-visible"
    >
      <g className="animate-gear opacity-40">
        <circle
          cx="710"
          cy="110"
          r="45"
          stroke="#6b46c1"
          strokeWidth="8"
          strokeDasharray="15 10"
        />
        <path d="M710 65 V155 M665 110 H755" stroke="#6b46c1" strokeWidth="5" />
      </g>

      <g className="animate-gear-reverse opacity-30">
        <circle
          cx="100"
          cy="500"
          r="60"
          stroke="#f6ad55"
          strokeWidth="18"
          strokeDasharray="30 15"
        />
      </g>

      <path
        d="M150 550 C 150 450, 300 450, 300 550 L 300 600 L 150 600 Z"
        fill="#4c1d95"
        className="drop-shadow-lg"
      />
      <circle
        cx="225"
        cy="420"
        r="35"
        fill="white"
        stroke="#6b46c1"
        strokeWidth="6"
        className="drop-shadow-md"
      />

      <g className="animate-gear" transform="translate(450, 150)">
        <path
          d="M-30 0 A30 30 0 1 0 30 0 A30 30 0 1 0 -30 0"
          stroke="#6b46c1"
          strokeWidth="12"
          strokeDasharray="12 6"
          fill="none"
        />
        <circle cx="0" cy="0" r="12" fill="#f6ad55" />
      </g>

      <g transform="translate(620, 220) rotate(-45)">
        <circle
          cx="0"
          cy="0"
          r="18"
          stroke="#6b46c1"
          strokeWidth="5"
          fill="#f6ad55"
        />
        <rect x="18" y="-2" width="35" height="6" fill="#6b46c1" />
        <rect x="40" y="3" width="6" height="12" fill="#6b46c1" />
        <rect x="50" y="3" width="6" height="12" fill="#6b46c1" />
      </g>

      <rect
        x="300"
        y="200"
        width="350"
        height="450"
        rx="24"
        fill="#faf5ff"
        stroke="#6b46c1"
        strokeWidth="4"
      />
      <rect
        x="340"
        y="270"
        width="270"
        height="45"
        rx="10"
        fill="white"
        className="drop-shadow-md"
      />
      <rect
        x="340"
        y="335"
        width="270"
        height="45"
        rx="10"
        fill="white"
        className="drop-shadow-md"
      />
      <rect
        x="340"
        y="400"
        width="270"
        height="160"
        rx="10"
        fill="white"
        stroke="#d6bcfa"
        strokeWidth="2"
      />

      <rect
        x="425"
        y="585"
        width="100"
        height="35"
        rx="8"
        fill="#f6ad55"
        className="animate-pulse shadow-lg"
      />

      {[220, 360, 500].map((x, i) => (
        <g
          key={`student-${i}`}
          className="animate-student"
          style={{ animationDelay: `${i * 0.6}s` }}
        >
          <circle
            cx={x + 100}
            cy={140}
            r="30"
            fill="#d6bcfa"
            stroke="#6b46c1"
            strokeWidth="2"
          />
          <path
            d={`M${x + 85} 145 Q ${x + 100} 130 ${x + 115} 145`}
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      ))}

      <g transform="translate(710, 540)">
        <rect x="-45" y="0" width="90" height="70" rx="6" fill="#4c1d95" />
        <path
          d="M0 0 Q 30 -55 65 -20 M0 0 Q -30 -55 -65 -20"
          stroke="#f6ad55"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
        />
        <circle
          cx="0"
          cy="-45"
          r="16"
          fill="white"
          stroke="#6b46c1"
          strokeWidth="4"
        />
      </g>
    </svg>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-violet-600/10 blur-[120px] -z-10 rounded-full"></div>
  </div>
);

const App: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserState | null>(null);
  const [activeSection, setActiveSection] = useState<string>("Q");

  const [booting, setBooting] = useState(true);

  const applyProfileForUserId = useCallback(
    async (
      userId: string,
      userEmail?: string,
      options?: { silent?: boolean }
    ) => {
      const profile = await fetchProfileByUserId(userId, userEmail);

      if (!profile) {
        try {
          await supabase.auth.signOut();
        } catch (_) {}
        clearStoredSession();
        setUser(null);
        if (!options?.silent) {
          setError(
            "This account is not configured for the admin portal. Contact your administrator."
          );
        }
        return;
      }

      const normalizedDbRole = (profile.dbRole ?? "").toUpperCase();

      // Student account: show the student-specific UI (treated as an error for this portal)
      if (normalizedDbRole === "STUDENT") {
        if (options?.silent) {
          // Don't auto-log into the admin portal as a student on page load.
          try {
            await supabase.auth.signOut();
          } catch (_) {}
          clearStoredSession();
          setUser(null);
        } else {
          setUser({
            username: profile.username ?? "Student",
            email: profile.email ?? userEmail ?? "",
            role: "STUDENT",
            isAuthenticated: true,
          });
        }
        return;
      }

      // Only allow section advisors or HOD on this web admin UI.
      const allowedAdminRoles = new Set(["SECTION_ADVISOR", "HOD"]);
      if (!allowedAdminRoles.has(normalizedDbRole)) {
        try {
          await supabase.auth.signOut();
        } catch (_) {}
        clearStoredSession();
        setUser(null);
        if (!options?.silent) {
          setError("Access denied: this account is not an advisor or HOD.");
        }
        return;
      }

      const role = profile.role === "HOD" ? "HOD_HUB" : "SECTION_ADVISOR";
      const section = profile.section ?? "";

      // Use normalized section coming from fetchProfileByUserId
      if (role === "SECTION_ADVISOR" && section) {
        setActiveSection(section);
      } else if (role === "SECTION_ADVISOR" && !section) {
        console.warn("Advisor profile contains no section:", profile);
      }

      setUser({
        username:
          profile.username ??
          (role === "HOD_HUB" ? "HOD" : `Section ${section || "Q"} Advisor`),
        email: profile.email ?? userEmail ?? "",
        role,
        isAuthenticated: true,
      });
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Avoid showing stale errors when refreshing.
        setError("");

        const stored = readStoredSession();
        if (!stored?.user?.id) return;
        if (cancelled) return;
        await applyProfileForUserId(stored.user.id, stored.user.email, {
          silent: true,
        });
      } catch (e: any) {
        // Bootstrap should be quiet; just clear any stale session.
        try {
          await supabase.auth.signOut();
        } catch (_) {}
        clearStoredSession();
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Keep state in sync without blocking auth.
      if (!session?.user) {
        setUser(null);
      }
    });

    return () => {
      cancelled = true;
      try {
        if (!sub) return;
        if (typeof (sub as any).subscription?.unsubscribe === "function") {
          (sub as any).subscription.unsubscribe();
        } else if (typeof (sub as any).unsubscribe === "function") {
          (sub as any).unsubscribe();
        } else if (
          typeof (sub as any).data?.subscription?.unsubscribe === "function"
        ) {
          (sub as any).data.subscription.unsubscribe();
        }
      } catch {
        // ignore
      }
    };
  }, [applyProfileForUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) return;

    setLoading(true);
    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password,
        });

      if (signInError) {
        setError(signInError.message || "Invalid authorization credentials.");
        return;
      }

      // Deterministic post-login: use the session returned by Supabase,
      // avoid getUser/getSession which has been hanging in some setups.
      const authUser = data?.user ?? data?.session?.user;
      if (authUser?.id) {
        await applyProfileForUserId(authUser.id, authUser.email);
      } else {
        setError("Signed in, but could not read user information.");
      }
    } catch (err: any) {
      setError(err?.message ?? "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    supabase.auth.signOut().catch(() => {
      // ignore
    });
    setUser(null);
    setEmail("");
    setPassword("");
    setError("");
  }, []);

  const isHodHub = useMemo(() => user?.role === "HOD_HUB", [user]);
  const isHodViewingSection = useMemo(() => user?.role === "HOD", [user]);

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-600 text-sm font-semibold">
        Initializing secure session...
      </div>
    );
  }

  if (user) {
    // If the authenticated user is a student, show a clear message
    // explaining that the web admin UI is not for students.
    if (user.role === "STUDENT") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white text-slate-600 text-sm font-semibold p-6">
          <div className="max-w-xl text-center">
            <h2 className="text-lg font-black mb-4">
              Student Account Detected
            </h2>
            <p className="mb-6">
              It looks like you signed in with a student account. The web admin
              dashboard is for class advisors and HODs only.
            </p>
            <p className="mb-6">
              Please use the Student mobile app to access student features, or
              contact your administrator if you need admin access.
            </p>
            <div className="flex justify-center">
              <button
                className="px-4 py-2 bg-violet-600 text-white rounded"
                onClick={logout}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      );
    }
    if (isHodViewingSection) {
      return (
        <Dashboard
          user={user}
          onLogout={logout}
          sectionName={activeSection}
          onBack={() => setUser({ ...user, role: "HOD_HUB" } as any)}
        />
      );
    }

    if (isHodHub) {
      return (
        <HODDashboard
          user={user}
          onLogout={logout}
          onSectionSelect={(sec) => {
            setActiveSection(sec);
            setUser({ ...user, role: "HOD" });
          }}
        />
      );
    }

    return (
      <Dashboard user={user} onLogout={logout} sectionName={activeSection} />
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
      <div className="hidden lg:flex flex-[1.1] relative bg-slate-50 items-center justify-center overflow-hidden border-r border-slate-100">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-full h-full bg-violet-200 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="relative z-10 text-center px-12 w-full">
          <LectureIllustration />
          <div className="mt-20">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase opacity-90">
              A.R.C. Portal
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative bg-[#6b46c1]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-violet-500 rounded-full blur-[120px] opacity-40"></div>
          <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-indigo-900 rounded-full blur-[120px] opacity-40"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden mb-12 text-center bg-white/10 rounded-[2.5rem] p-8 backdrop-blur-md border border-white/20">
            <div className="transform scale-90">
              <LectureIllustration />
            </div>
          </div>

          <div className="pearl-glass p-10 md:p-12 rounded-[2.5rem] space-y-10 animate-in fade-in zoom-in duration-500 bg-white/95">
            <header className="text-center space-y-6">
              <Logo />
              <div className="relative inline-flex items-center justify-center group">
                <div className="absolute inset-0 bg-violet-100 rounded-full scale-105 group-hover:scale-110 transition-transform duration-500 blur-sm opacity-40"></div>
                <div className="relative px-12 py-3 bg-white border border-violet-100 rounded-full flex items-center gap-3 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
                  <h2 className="text-[12px] font-black text-slate-800 tracking-[0.5em] uppercase">
                    Login
                  </h2>
                </div>
              </div>
            </header>

            <div className="space-y-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Access Identity"
                  type="text"
                  placeholder="asection@citchennai.net"
                  value={email}
                  onChange={setEmail}
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  }
                />

                <div className="space-y-1">
                  <Input
                    label="Secret Phrase"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={setPassword}
                    icon={
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    }
                  />
                  {error && (
                    <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2 px-1 flex items-center gap-2">
                      <div className="w-1 h-1 bg-rose-500 rounded-full"></div>
                      {error}
                    </div>
                  )}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      className="text-[9px] text-slate-400 font-black uppercase tracking-[0.1em] hover:text-[#6b46c1] transition-colors"
                    >
                      Security Inquiry?
                    </button>
                  </div>
                </div>

                <Button type="submit" loading={loading}>
                  Authenticate
                </Button>
              </form>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-white/40 text-[9px] uppercase tracking-[0.6em] font-black select-none">
              A.R.C. Protocol // Node v4.2.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
