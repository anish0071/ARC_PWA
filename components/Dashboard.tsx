import React, { useEffect, useMemo, useState } from "react";
import { StudentRecord, UserState } from "../types";
import { Logo, Button } from "./UI";
import {
  debugAdvisorStudentProbe,
  fetchStudentsBySection,
  fetchAllStudents,
  setNeedsUpdation,
  clearNeedsUpdation,
  fetchNeedsUpdation,
  updateStudentByRegNo,
  broadcastNeedsUpdation,
  fetchStudentColumns,
} from "../services/arcData";
import { mapStudentRowToRecord } from "../services/studentMapper";

const INITIAL_FIELD_GROUPS: Record<string, string[]> = {
  "Core Profile": [
    "REG NO",
    "NAME",
    "DEPT",
    "YEAR",
    "SECTION",
    "GENDER",
    "MOBILE NO",
    "ALT MOBILE NO",
    "OFFICIAL MAIL",
    "EMAIL",
  ],
  "Identity & Residence": [
    "CURRENT ADDRESS",
    "PERMANENT ADDRESS",
    "PINCODE",
    "STATE",
    "AADHAR NO",
    "PAN NO",
    "FATHER NAME",
    "MOTHER NAME",
  ],
  "Academic Matrix": [
    "10TH BOARD %",
    "12TH BOARD %",
    "10TH YEAR",
    "12TH YEAR",
    "GPA SEM1",
    "GPA SEM2",
    "GPA SEM3",
    "CGPA (3 sem)",
  ],
  "Coding & Career": [
    "KNOWN TECH STACK",
    "RESUME LINK",
    "WILLING TO RELOCATE",
    "PLACEMENT/HS",
    "COMPANY/OFFER LINK",
    "LEETCODE ID",
    "LC TOTAL",
    "LC EASY",
    "LC MED",
    "LC HARD",
    "LC RATING",
    "LC BADGES",
    "LC MAX",
    "CODECHEF ID",
    "CC TOTAL",
    "CC RANK",
    "CC BADGES",
    "CC RATING",
    "SR PROBLEMS",
    "SR RANK",
    "GITHUB ID",
    "LINKEDIN",
  ],
  "Center of Excellence": ["COE NAME", "COE INCHARGE", "COE PROJECTS"],
};

// Initial registry fields generated from the field groups
const INITIAL_REGISTRY_FIELDS = Object.entries(INITIAL_FIELD_GROUPS).flatMap(
  ([group, fields]) =>
    fields.map((label, idx) => ({
      id: `${group.toLowerCase().replace(/\s+/g, "_")}_${idx}`,
      label,
      cat: group,
    }))
);

// Removed local mock data generator to ensure dashboard shows only DB-fetched students

const BATCH_SIZE = 15;

export const Dashboard: React.FC<{
  user: UserState;
  onLogout: () => void;
  sectionName?: string;
  onBack?: () => void;
}> = ({ user, onLogout, sectionName = "", onBack }) => {
  // Toggle this flag to enable/disable the lightweight console debug.
  // Remove or set to `false` before committing to production.
  const DEBUG_LOG_STUDENTS = false;
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(
    null
  );
  const [editedStudent, setEditedStudent] = useState<Record<string, any> | null>(null);
  const [sortField, setSortField] = useState<keyof StudentRecord>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [profileOpen, setProfileOpen] = useState(false);

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState("");

  // Modal states
  const [updationModalOpen, setUpdationModalOpen] = useState(false);
  const [pruneModalOpen, setPruneModalOpen] = useState(false);
  const [injectModalOpen, setInjectModalOpen] = useState(false);

  // Registry Data States
  const [registryFields, setRegistryFields] = useState(INITIAL_REGISTRY_FIELDS);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [newFieldName, setNewFieldName] = useState("");
  const [activeUpdationFields, setActiveUpdationFields] = useState<string[]>([]);

  // Load student records for the active section from Supabase (or all for HOD)
  useEffect(() => {
    // load active updation fields for this section and schema fields
    let mounted2 = true;
    (async () => {
      if (!sectionName) return;
      const active = await fetchNeedsUpdation(sectionName === 'ALL' ? '' : sectionName);
      if (mounted2) setActiveUpdationFields(active || []);

      // fetch column names from students table and populate registryFields
      const cols = await fetchStudentColumns();
      if (mounted2 && Array.isArray(cols) && cols.length > 0) {
        // filter out metadata-like columns
        const skip = new Set(['id', 'created_at', 'updated_at']);
        const fields = cols
          .filter((c) => !skip.has(c.toLowerCase()))
          .map((c, idx) => ({
            id: `schema_${idx}_${c}`,
            label: String(c).replace(/_/g, ' ').toUpperCase(),
            cat: 'Schema',
            raw: c,
          }));
        setRegistryFields(fields);
      }
    })();

    let mounted = true;
    setStudentsLoading(true);
    setStudentsError("");

    (async () => {
      try {
        if (
          DEBUG_LOG_STUDENTS &&
          String(user?.role ?? "").toUpperCase() === "SECTION_ADVISOR" &&
          sectionName &&
          sectionName !== "ALL"
        ) {
          const probe = await debugAdvisorStudentProbe(sectionName);
          console.debug("[Dashboard] advisor probe", probe);
        }

        const rows =
          sectionName === "ALL"
            ? await fetchAllStudents()
            : await fetchStudentsBySection(sectionName);
        const mapped = rows.map(mapStudentRowToRecord);
        if (mounted) setStudents(mapped);
        // Small removable debug to help verify advisor-section loads.
        if (
          DEBUG_LOG_STUDENTS &&
          user?.role &&
          String(user.role).toUpperCase() === "SECTION_ADVISOR"
        ) {
          console.debug("[Dashboard] students loaded", {
            section: sectionName,
            count: Array.isArray(mapped) ? mapped.length : 0,
            sample: Array.isArray(mapped) ? mapped.slice(0, 5) : mapped,
          });
        }
      } catch (e: any) {
        if (mounted) setStudentsError(e?.message ?? "Failed to load students.");
        if (mounted) setStudents([]);
      } finally {
        if (mounted) setStudentsLoading(false);
      }
    })();

    return () => {
      mounted = false;
      mounted2 = false;
    };
  }, [sectionName, user?.role]);

  const filteredAndSortedStudents = useMemo(() => {
    try {
      const q = String(search ?? "")
        .trim()
        .toLowerCase();

      const safeIncludes = (field: any) =>
        String(field ?? "")
          .toLowerCase()
          .includes(q);

      let result = students.filter(
        (s) => safeIncludes(s.name) || safeIncludes(s.regNo)
      );

      result.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];

        const numA = Number(valA);
        const numB = Number(valB);
        const bothNum = Number.isFinite(numA) && Number.isFinite(numB);

        if (bothNum) {
          return sortDirection === "asc" ? numA - numB : numB - numA;
        }

        const strA = String(valA ?? "").toLowerCase();
        const strB = String(valB ?? "").toLowerCase();
        return sortDirection === "asc"
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });

      return result;
    } catch (err) {
      console.error("filter/sort error", err);
      return [] as StudentRecord[];
    }
  }, [search, sortField, sortDirection, students]);

  const aggregates = useMemo(() => {
    const total = Array.isArray(students) ? students.length : 0;
    if (total === 0) return { cgpa: "0.00", lc: "0 / 0", residency: "0/0" };

    const safeNum = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const avgCgpa =
      students.reduce((acc, s) => acc + safeNum(s.cgpaOverall), 0) / total;
    const avgLcRating =
      students.reduce((acc, s) => acc + safeNum(s.lcRating), 0) / total;
    const avgLcSolved =
      students.reduce((acc, s) => acc + safeNum(s.lcTotal), 0) / total;
    const hostellers = students.filter((s) => !!s.isHosteller).length;
    const dayScholars = total - hostellers;

    const cgpa = Number.isFinite(avgCgpa) ? avgCgpa : 0;

    return {
      cgpa: cgpa.toFixed(2),
      lc: `${Math.round(avgLcSolved)} / ${Math.round(avgLcRating)}`,
      residency: `${hostellers}H / ${dayScholars}D`,
    };
  }, [students]);

  const toggleFieldSelection = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const labelToKey = (label: string) => {
    const map: Record<string, string> = {
      'REG NO': 'regNo',
      'NAME': 'name',
      'DEPT': 'dept',
      'YEAR': 'year',
      'SECTION': 'section',
      'GENDER': 'gender',
      'MOBILE NO': 'mobile',
      'ALT MOBILE NO': 'altMobile',
      'OFFICIAL MAIL': 'officialEmail',
      'EMAIL': 'personalEmail',
      'CURRENT ADDRESS': 'currentAddress',
      'PERMANENT ADDRESS': 'permanentAddress',
      'PINCODE': 'pincode',
      'STATE': 'state',
      'AADHAR NO': 'aadhar',
      'PAN NO': 'pan',
      'FATHER NAME': 'fatherName',
      'MOTHER NAME': 'motherName',
      '10TH BOARD %': 'tenthPercentage',
      '12TH BOARD %': 'twelfthPercentage',
      '10TH YEAR': 'tenthYear',
      '12TH YEAR': 'twelfthYear',
      'CGPA (3 sem)': 'cgpaOverall',
      'RESIDENCY STATUS': 'isHosteller',
      'GITHUB ID': 'github',
      'LINKEDIN': 'linkedin',
      'RESUME LINK': 'resumeUrl',
    };
    return map[label] || label.replace(/[^a-z0-9]/gi, "").toLowerCase();
  };

  const clearSelections = () => {
    setSelectedFields([]);
    setNewFieldName("");
  };

  return (
    <div className="min-h-screen bg-[#fcfaff] flex flex-col font-medium text-slate-900 text-xs">
      <header className="bg-gradient-to-r from-violet-600 to-indigo-700 text-white p-3 shadow-lg sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1 hover:bg-white/20 rounded-lg transition-all active:scale-90"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            <Logo />
            <div>
              <h1 className="text-md font-black tracking-tight uppercase leading-none text-white">
                A.R.C. Portal
              </h1>
              <p className="text-[8px] uppercase tracking-[0.3em] opacity-80 mt-0.5 text-white">
                Section {sectionName}
              </p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="bg-white/10 p-1 pr-3 rounded-full border border-white/20 flex items-center gap-2 hover:bg-white/20 transition-all"
            >
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-violet-700 font-black text-[9px]">
                AD
              </div>
              <div className="text-[10px] font-black hidden md:block text-white">
                {user.username}
              </div>
              <svg
                className={`w-2.5 h-2.5 transition-transform duration-500 text-white ${
                  profileOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-[60] overflow-hidden">
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-[9px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full p-4 lg:p-6 gap-6 overflow-hidden">
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AiryStatCard
              label="SECTION AVG CGPA"
              value={aggregates.cgpa}
              sub="Global Metrics"
              icon="🏆"
              color="purple"
            />
            <AiryStatCard
              label="CODING SOLVED / RATING"
              value={aggregates.lc}
              sub="Avg Solved / Avg Rating"
              icon="💻"
              color="blue"
            />
            <AiryStatCard
              label="RESIDENCY HUB"
              value={aggregates.residency}
              sub="Hosteller / DayScholar"
              icon="🏠"
              color="green"
            />
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Filter nodes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-violet-400 transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <svg
                  className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
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
              <div className="flex gap-2">
                <AirySortBtn
                  active={sortField === "cgpaOverall"}
                  onClick={() => {
                    setSortField("cgpaOverall");
                    setSortDirection((p) => (p === "asc" ? "desc" : "asc"));
                  }}
                >
                  CGPA GRID
                </AirySortBtn>
                <AirySortBtn
                  active={sortField === "name"}
                  onClick={() => {
                    setSortField("name");
                    setSortDirection((p) => (p === "asc" ? "desc" : "asc"));
                  }}
                >
                  ALPHA
                </AirySortBtn>
              </div>
            </div>

            <div className="overflow-x-auto">
              {studentsLoading && (
                <div className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Loading section data...
                </div>
              )}
              {!studentsLoading && studentsError && (
                <div className="p-4 text-[10px] font-black text-rose-500 uppercase tracking-widest">
                  {studentsError}
                </div>
              )}
              {!studentsLoading &&
                !studentsError &&
                filteredAndSortedStudents.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      No students found
                    </p>
                    <p className="text-[9px] text-slate-300 mt-2">
                      {sectionName
                        ? `No data available for section ${sectionName}`
                        : "No section selected"}
                    </p>
                  </div>
                )}
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    <th className="px-4 py-3">S.No</th>
                    <th className="px-4 py-3">Reg No</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">CGPA</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedStudents.map((s, idx) => (
                    <tr
                      key={s.regNo}
                      onClick={() => setSelectedStudent(s)}
                      className="group cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <td className="px-4 py-3 text-[10px] font-black text-slate-300 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 text-[10px] font-black text-slate-400 tabular-nums">
                        {s.regNo}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-[9px] font-black text-violet-700">
                            {s.initials}
                          </div>
                          <span className="text-xs font-black text-slate-900 group-hover:text-violet-700 transition-colors truncate">
                            {s.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const cgpa = Number.isFinite(Number(s.cgpaOverall))
                            ? Number(s.cgpaOverall)
                            : 0;
                          const high = cgpa >= 8.5;
                          return (
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                                high
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : "bg-white text-indigo-500 border-slate-100"
                              }`}
                            >
                              {cgpa.toFixed(2)}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="w-full lg:w-64 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
              <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-900">
                COMMAND HUB
              </h3>
            </div>
            <div className="space-y-3">
              <AiryCommandBtn
                label="NEED UPDATION"
                icon="🔄"
                sub="Registry Sync"
                color="bg-indigo-600"
                onClick={() => {
                  clearSelections();
                  setUpdationModalOpen(true);
                }}
              />
              <AiryCommandBtn
                label="DYNAMIC INJECT"
                icon="+"
                sub="Extend Matrix"
                color="bg-violet-600"
                onClick={() => {
                  clearSelections();
                  setInjectModalOpen(true);
                }}
              />
              <AiryCommandBtn
                label="PRUNE NODES"
                icon="🗑️"
                sub="Remove Data"
                color="bg-rose-600"
                onClick={() => {
                  clearSelections();
                  setPruneModalOpen(true);
                }}
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Intelligence Profile Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            onClick={() => setSelectedStudent(null)}
          ></div>
                <div className="relative bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="w-full md:w-72 bg-slate-50 border-r border-slate-100 p-8 flex flex-col items-center">
              <div className="relative group mb-6">
                <div className="absolute -inset-2 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative w-32 h-32 rounded-[1.8rem] bg-gradient-to-br from-violet-600 to-indigo-800 flex items-center justify-center text-4xl font-black text-white shadow-2xl">
                  {selectedStudent.initials}
                </div>
              </div>

              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase text-center mb-1 leading-tight">
                {selectedStudent.name}
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">
                {selectedStudent.regNo}
              </p>

              <div className="w-full space-y-3 mt-auto">
                <BrandedButton
                  label="LinkedIn Profile"
                  href={selectedStudent.linkedin}
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  }
                  color="bg-[#0077b5]"
                />
                <BrandedButton
                  label="GitHub Repos"
                  href={selectedStudent.github}
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  }
                  color="bg-[#24292e]"
                />
                <BrandedButton
                  label="Resume Vault"
                  href={selectedStudent.resumeUrl}
                  icon={
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  }
                  color="bg-emerald-600"
                />
              </div>
            </div>

              <div className="flex-1 p-10 overflow-y-auto custom-scrollbar relative">
              <button
                onClick={() => setSelectedStudent(null)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-xl transition-all active:scale-90 group"
              >
                <svg
                  className="w-6 h-6 text-slate-300 group-hover:text-rose-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="space-y-12">
                <section>
                  <AiryModalHeader title="Intelligence Node" icon="🧬" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                    <AiryDataItem
                      label="Gender Cluster"
                      value={selectedStudent.gender === "F" ? "Female" : "Male"}
                    />
                    <AiryDataItem
                      label="Dept Matrix"
                      value={selectedStudent.dept}
                    />
                    <AiryDataItem
                      label="Registry Year"
                      value={selectedStudent.year || "-"}
                    />
                    <AiryDataItem
                      label="Section Hub"
                      value={selectedStudent.section}
                    />
                    <AiryDataItem
                      label="Aadhar Identity"
                      value={selectedStudent.aadhar}
                      highlight
                    />
                    <AiryDataItem
                      label="PAN Node"
                      value={selectedStudent.pan}
                      highlight
                    />
                    <AiryDataItem
                      label="Father Identity"
                      value={selectedStudent.fatherName}
                    />
                    <AiryDataItem
                      label="Mother Identity"
                      value={selectedStudent.motherName}
                    />
                  </div>
                </section>

                <section>
                  <AiryModalHeader title="Connectivity Protocols" icon="📡" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                    <div className="space-y-4">
                      <AiryDataItem
                        label="Official Mail Relay"
                        value={selectedStudent.officialEmail}
                        editable={activeUpdationFields.includes('OFFICIAL MAIL')}
                        editValue={editedStudent?.officialEmail ?? selectedStudent.officialEmail}
                        onEdit={(v: any) => setEditedStudent((p) => ({ ...(p || selectedStudent), officialEmail: v }))}
                      />
                      <AiryDataItem
                        label="Personal Mail Relay"
                        value={selectedStudent.personalEmail}
                      />
                    </div>
                    <div className="space-y-4">
                      <AiryDataItem
                        label="Primary Contact"
                        value={selectedStudent.mobile}
                        highlight
                        editable={activeUpdationFields.includes('MOBILE NO')}
                        editValue={editedStudent?.mobile ?? selectedStudent.mobile}
                        onEdit={(v: any) => setEditedStudent((p) => ({ ...(p || selectedStudent), mobile: v }))}
                      />
                      <AiryDataItem
                        label="Emergency Contact"
                        value={selectedStudent.altMobile}
                        editable={activeUpdationFields.includes('ALT MOBILE NO')}
                        editValue={editedStudent?.altMobile ?? selectedStudent.altMobile}
                        onEdit={(v: any) => setEditedStudent((p) => ({ ...(p || selectedStudent), altMobile: v }))}
                      />
                    </div>
                  </div>
                </section>

                <section className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                  <AiryModalHeader title="Performance Matrix" icon="📈" />
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-6">
                    <div className="col-span-2 md:col-span-1">
                      <AiryDataItem
                        label="CGPA INDEX"
                        value={
                          Number.isFinite(Number(selectedStudent?.cgpaOverall))
                            ? Number(selectedStudent?.cgpaOverall).toFixed(2)
                            : "0.00"
                        }
                        highlight
                        large
                      />
                    </div>
                    <AiryDataItem
                      label="SEM 01"
                      value={
                        Number.isFinite(Number(selectedStudent?.gpaSem1))
                          ? Number(selectedStudent?.gpaSem1).toFixed(2)
                          : "0.00"
                      }
                    />
                    <AiryDataItem
                      label="SEM 02"
                      value={
                        Number.isFinite(Number(selectedStudent?.gpaSem2))
                          ? Number(selectedStudent?.gpaSem2).toFixed(2)
                          : "0.00"
                      }
                    />
                    <AiryDataItem
                      label="SEM 03"
                      value={
                        Number.isFinite(Number(selectedStudent?.gpaSem3))
                          ? Number(selectedStudent?.gpaSem3).toFixed(2)
                          : "0.00"
                      }
                    />
                    <AiryDataItem
                      label="10TH BOARD %"
                      value={selectedStudent.tenthPercentage}
                    />
                    <AiryDataItem
                      label="12TH BOARD %"
                      value={selectedStudent.twelfthPercentage}
                    />
                    <AiryDataItem
                      label="10TH YEAR"
                      value={selectedStudent.tenthYear}
                    />
                    <AiryDataItem
                      label="12TH YEAR"
                      value={selectedStudent.twelfthYear}
                    />
                    <AiryDataItem
                      label="Residency Status"
                      value={
                        selectedStudent.isHosteller
                          ? "Hosteller"
                          : "Day Scholar"
                      }
                      highlight
                    />
                  </div>
                </section>

                <section>
                  <AiryModalHeader title="Competitive Coding Pulse" icon="⚔️" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <CodingHubCard
                      name="LeetCode"
                      id={selectedStudent.leetcodeId}
                      rating={selectedStudent.lcRating}
                      total={selectedStudent.lcTotal}
                      badges={selectedStudent.lcBadges}
                      color="orange"
                    />
                    <CodingHubCard
                      name="CodeChef"
                      id={selectedStudent.codechefId}
                      rating={selectedStudent.ccRating}
                      total={selectedStudent.ccTotal}
                      badges={selectedStudent.ccBadges}
                      color="rose"
                    />
                    <CodingHubCard
                      name="SkillRack"
                      id={selectedStudent.srRank}
                      rating={0}
                      total={selectedStudent.srProblems}
                      badges={0}
                      color="blue"
                    />
                  </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <AiryModalHeader title="Professional DNA" icon="💼" />
                    <div className="mt-6 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {(selectedStudent.techStack || []).map((t) => (
                          <span
                            key={t}
                            className="px-3 py-1 bg-violet-50 text-violet-700 text-[9px] font-black uppercase rounded-lg border border-violet-100"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <AiryDataItem
                        label="Willing to Relocate"
                        value={selectedStudent.relocate}
                      />
                      <AiryDataItem
                        label="Placement Category"
                        value={selectedStudent.category}
                      />
                    </div>
                  </div>
                  <div>
                    <AiryModalHeader title="COE Architecture" icon="🏛️" />
                    <div className="mt-6 space-y-4">
                      <AiryDataItem
                        label="COE Node"
                        value={selectedStudent.coeName}
                      />
                      <AiryDataItem
                        label="COE Incharge"
                        value={selectedStudent.coeIncharge}
                      />
                      <AiryDataItem
                        label="Current Projects"
                        value={selectedStudent.coeProjects}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <AiryModalHeader title="Registry Address" icon="📍" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                    <AiryDataItem
                      label="Current Logistics"
                      value={selectedStudent.currentAddress}
                    />
                    <AiryDataItem
                      label="Permanent Registry"
                      value={selectedStudent.permanentAddress}
                    />
                  </div>
                </section>
              </div>
              {/* Footer actions removed per request */}
            </div>
          </div>
        </div>
      )}

      {/* Need Updation Modal */}
      {updationModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
            onClick={() => setUpdationModalOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] p-10 shadow-3xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-black">
                  🔄
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase text-slate-900 leading-none">
                    Registry Sync matrix
                  </h3>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">
                    Select fields to broadcast for updation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUpdationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
              <div className="space-y-3">
                {registryFields.map((field) => (
                  <label
                    key={field.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.id)}
                        onChange={() => toggleFieldSelection(field.id)}
                        className="w-5 h-5 rounded border-slate-200 text-violet-600 focus:ring-violet-500/20"
                      />
                      <div className="flex flex-col">
                        <span className={`text-[11px] font-black uppercase ${
                          selectedFields.includes(field.id) ? 'text-violet-600' : 'text-slate-800'
                        }`}>{field.label}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">
                          {field.cat}
                        </span>
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {/* show raw column name for schema-derived fields */}
                      {field.raw ? field.raw : ''}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-10 flex gap-4">
              <button
                onClick={async () => {
                  // Persist selection to backend for this section
                  if (!user || !sectionName) {
                    setUpdationModalOpen(false);
                    return;
                  }

                  // map selectedFields ids -> labels
                  const labels = registryFields
                    .filter((f) => selectedFields.includes(f.id))
                    .map((f) => f.label);

                  const res = await setNeedsUpdation(sectionName === 'ALL' ? '' : sectionName, labels);
                  if (res && res.success) {
                    setActiveUpdationFields(labels);
                    // best-effort: broadcast a notification to students in this section
                    try {
                      await broadcastNeedsUpdation(sectionName === 'ALL' ? '' : sectionName, labels);
                    } catch (e) {
                      console.warn('broadcastNeedsUpdation failed:', e);
                    }
                  }
                  setUpdationModalOpen(false);
                }}
                className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Broadcast Sync
              </button>
              <button
                onClick={async () => {
                  // Cancel local selection without persisting
                  setUpdationModalOpen(false);
                }}
                className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel active updation (admin action) */}
      {activeUpdationFields.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={async () => {
              if (!sectionName) return;
              const res = await clearNeedsUpdation(sectionName === 'ALL' ? '' : sectionName);
              if (res && res.success) setActiveUpdationFields([]);
            }}
            className="py-3 px-4 bg-rose-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg"
          >
            Cancel Active Updation
          </button>
        </div>
      )}

      {/* Prune Logic Modal */}
      {pruneModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
            onClick={() => setPruneModalOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-3xl max-h-[85vh] flex flex-col animate-in zoom-in-95">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl font-black">
                🗑️
              </div>
              <div>
                <h3 className="text-xl font-black uppercase text-slate-900 leading-none">
                  Prune Logic Nodes
                </h3>
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-1">
                  Select fields to remove from the registry schema
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-2 mb-8">
              <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">
                Registry Logic Fields
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {registryFields.map((field) => (
                  <label
                    key={field.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group cursor-pointer border border-transparent hover:border-rose-100 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.id)}
                        onChange={() => toggleFieldSelection(field.id)}
                        className="w-5 h-5 rounded border-slate-200 text-rose-600 focus:ring-rose-500/20"
                      />
                      <div className="flex flex-col">
                        <span
                          className={`text-[11px] font-black uppercase transition-colors ${
                            selectedFields.includes(field.id)
                              ? "text-rose-600"
                              : "text-slate-800"
                          }`}
                        >
                          {field.label}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">
                          {field.cat} Hub
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setPruneModalOpen(false)}
                className="flex-1 py-5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-rose-700 active:scale-95 transition-all"
              >
                Execute Pruning
              </button>
              <button
                onClick={() => setPruneModalOpen(false)}
                className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Inject Modal */}
      {injectModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
            onClick={() => setInjectModalOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-md rounded-[2rem] p-8 shadow-3xl flex flex-col border border-violet-100 animate-in zoom-in-95">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center text-2xl font-black">
                +
              </div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 leading-none">
                  Dynamic Inject
                </h3>
                <p className="text-[8px] font-black text-violet-400 uppercase tracking-widest mt-1">
                  Append New Logic Node
                </p>
              </div>
            </div>
            <div className="space-y-2 mb-8">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Descriptor Name
              </label>
              <input
                type="text"
                placeholder="e.g. Placement Cell ID"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-all shadow-inner"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (newFieldName.trim()) {
                    setRegistryFields((prev) => [
                      ...prev,
                      {
                        id: newFieldName.toLowerCase().replace(/\s/g, "_"),
                        label: newFieldName.toUpperCase(),
                        cat: "Custom",
                      },
                    ]);
                    setInjectModalOpen(false);
                    setNewFieldName("");
                  }
                }}
                disabled={!newFieldName.trim()}
                className="flex-1 py-4 bg-violet-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-violet-700 active:scale-95 disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                onClick={() => setInjectModalOpen(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AiryStatCard: React.FC<{
  label: string;
  value: string;
  sub: string;
  icon: string;
  color: string;
}> = ({ label, value, sub, icon, color }) => {
  const styles = {
    purple: "bg-violet-50 text-violet-600 border-violet-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
  }[color as "purple" | "blue" | "green"];

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border ${styles}`}
        >
          {icon}
        </div>
        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
          {label}
        </span>
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter">
          {value}
        </p>
        <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
          {sub}
        </p>
      </div>
    </div>
  );
};

const BrandedButton: React.FC<{
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}> = ({ label, href, icon, color }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`w-full ${color} p-4 rounded-2xl flex items-center gap-4 text-white transition-all hover:scale-[1.02] active:scale-95 group shadow-lg shadow-black/5`}
  >
    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
      {icon}
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest">
      {label}
    </span>
  </a>
);

const CodingHubCard: React.FC<{
  name: string;
  id: string;
  rating: number;
  total: number;
  badges: number;
  color: string;
}> = ({ name, id, rating, total, badges, color }) => {
  const themes = {
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
  }[color as "orange" | "rose" | "blue"];

  return (
    <div
      className={`p-5 rounded-2xl border ${themes} flex flex-col justify-between`}
    >
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest">
          {name}
        </h4>
        <span className="text-[9px] font-black bg-white/50 px-2 py-0.5 rounded-lg border border-current opacity-60 truncate max-w-[100px]">
          {id}
        </span>
      </div>
      <div>
        <p className="text-xl font-black tabular-nums">{rating || "N/A"}</p>
        <p className="text-[8px] font-black opacity-60 uppercase tracking-tighter">
          Rating Index
        </p>
      </div>
      <div className="flex justify-between mt-4 pt-4 border-t border-current/10">
        <div>
          <p className="text-[10px] font-black">{total}</p>
          <p className="text-[7px] uppercase font-black opacity-40">Problems</p>
        </div>
        <div>
          <p className="text-[10px] font-black">{badges}</p>
          <p className="text-[7px] uppercase font-black opacity-40">Badges</p>
        </div>
      </div>
    </div>
  );
};

const AirySortBtn: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border ${
      active
        ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-900/10"
        : "bg-white text-slate-400 border-slate-200 hover:text-violet-600"
    }`}
  >
    {children}
  </button>
);

const AiryCommandBtn: React.FC<{
  label: string;
  icon: string;
  sub: string;
  color: string;
  onClick?: () => void;
}> = ({ label, icon, sub, color, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full ${color} p-4 rounded-2xl flex items-center gap-4 text-white transition-all hover:scale-[1.02] active:scale-95 group shadow-lg`}
  >
    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg">
      {icon}
    </div>
    <div className="text-left overflow-hidden">
      <p className="text-[11px] font-black uppercase leading-none truncate">
        {label}
      </p>
      <p className="text-[8px] opacity-60 font-black mt-1 uppercase">{sub}</p>
    </div>
  </button>
);

const AiryModalHeader: React.FC<{ title: string; icon: string }> = ({
  title,
  icon,
}) => (
  <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
    <span className="text-xl">{icon}</span>
    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
      {title}
    </h4>
  </div>
);

const AiryDataItem: React.FC<{
  label: string;
  value: string | number;
  highlight?: boolean;
  large?: boolean;
  editable?: boolean;
  editValue?: any;
  onEdit?: (v: any) => void;
}> = ({ label, value, highlight, large, editable, editValue, onEdit }) => (
  <div className="flex flex-col min-w-0">
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">
      {label}
    </span>
    {editable ? (
      <input
        className={`w-full font-black tracking-tight leading-none break-words ${
          large ? "text-2xl" : "text-[11px]"
        } ${highlight ? "text-violet-600" : "text-slate-900"} p-2 border rounded-lg`}
        value={editValue ?? value ?? ""}
        onChange={(e) => onEdit && onEdit(e.target.value)}
      />
    ) : (
      <span
        className={`font-black tracking-tight leading-none break-words ${
          large ? "text-2xl" : "text-[11px]"
        } ${highlight ? "text-violet-600" : "text-slate-900"}`}
      >
        {value || "-"}
      </span>
    )}
  </div>
);
