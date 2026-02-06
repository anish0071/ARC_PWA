import React, { useState, useRef, useEffect } from "react";
import { UserState } from "../types";
import { Logo } from "./UI";
import { fetchAvailableSections, fetchAllStudents, updateStudentByRegNo } from "../services/arcData";
import { StudentRecord } from "../types";
import { mapStudentRowToRecord } from "../services/studentMapper";

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
      className={`group relative bg-white/95 rounded-[2.5rem] p-7 border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer active:scale-[0.98] pearl-glass ${
        isSDE
          ? "hover:bg-orange-500 hover:border-orange-500"
          : "hover:bg-violet-600 hover:border-violet-600"
      }`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-900 uppercase tracking-tight group-hover:text-white transition-colors">
            Section {section}
          </h3>
        </div>
        <div
          className={`p-2.5 rounded-2xl transition-all duration-500 group-hover:scale-110 ${
            isSDE
              ? "bg-orange-50 text-orange-500 shadow-orange-100 group-hover:bg-white/20 group-hover:text-white"
              : "bg-violet-50 text-violet-500 shadow-violet-100 group-hover:bg-white/20 group-hover:text-white"
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
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-white/80 transition-colors">
          Click to view students
        </p>

        <div className="pt-5 mt-2 border-t border-slate-50 group-hover:border-white/20 flex items-center justify-end transition-colors">
          <div className={`w-7 h-7 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-white group-hover:rotate-45 transition-all duration-500 ${
            isSDE ? "group-hover:text-orange-500" : "group-hover:text-violet-600"
          }`}>
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
  // NLP states and student list for HOD-level queries
  const [nlpQuery, setNlpQuery] = useState("");
  const [nlpResult, setNlpResult] = useState<{
    items: ({ students: StudentRecord[]; fields: string[] | null; query: string; notFound?: boolean; lowConfidence?: boolean; confidence?: number; scores?: number[]; suggestion?: string; suggestionScore?: number })[];
  } | null>(null);
  // Inline edits similar to Advisor dashboard
  const [nlpEdits, setNlpEdits] = useState<Record<string, Record<string, any>>>({});
  const [selectedStudentByItem, setSelectedStudentByItem] = useState<Record<number, string>>({});
  const [suggestionDismissed, setSuggestionDismissed] = useState<Record<number, boolean>>({});
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
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

  // Load all students for HOD-level queries on demand
  const ensureStudents = async () => {
    if (students && students.length > 0) return;
    setStudentsLoading(true);
    try {
      const rows = await fetchAllStudents();
      const mapped = rows.map(mapStudentRowToRecord);
      setStudents(mapped);
    } catch (e) {
      console.warn("fetchAllStudents failed", e);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  // small helpers for fuzzy matching (copied from Dashboard)
  const levenshtein = (a: string, b: string) => {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[m][n];
  };

  const similarity = (a: string, b: string) => {
    if (!a && !b) return 1;
    if (!a || !b) return 0;
    const lev = levenshtein(a, b);
    const maxLen = Math.max(a.length, b.length);
    return maxLen === 0 ? 1 : 1 - lev / maxLen;
  };

  const startEditing = (regNo: string, key: string, currentVal: any) => {
    setNlpEdits((p) => ({ ...(p || {}), [regNo]: { ...((p || {})[regNo] || {}), [key]: currentVal } }));
  };

  const downloadCsv = (filename: string, headers: string[], rows: Array<string[]>) => {
    const esc = (v: string) => '"' + String(v).replace(/"/g, '""') + '"';
    const csv = [headers.map(esc).join(',')].concat(rows.map((r) => r.map((c) => esc(String(c ?? ''))).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const updateEditValue = (regNo: string, key: string, value: any) => {
    setNlpEdits((p) => ({ ...(p || {}), [regNo]: { ...((p || {})[regNo] || {}), [key]: value } }));
  };

  const clearEditsFor = (regNo: string) => {
    setNlpEdits((p) => {
      if (!p) return {};
      const copy = { ...p };
      delete copy[regNo];
      return copy;
    });
  };

  const saveEditsForItem = async (itemIdx: number) => {
    if (!nlpResult) return;
    const item = nlpResult.items[itemIdx];
    if (!item || !item.students || item.students.length === 0) return;

    const regNos = Array.from(new Set(item.students.map((s) => s.regNo)));
    const results: any[] = [];
    for (const reg of regNos) {
      const edits = (nlpEdits || {})[reg];
      if (!edits || Object.keys(edits).length === 0) continue;
      try {
        const res = await updateStudentByRegNo(reg, edits);
        if (res && res.success && res.data) {
          try {
            const mapped = mapStudentRowToRecord(res.data as any);
            setStudents((prev) => prev.map((s) => (s.regNo === mapped.regNo ? { ...s, ...mapped } : s)));
          } catch (e) {
            console.warn("mapping after save failed", e);
          }
          clearEditsFor(reg);
        }
        results.push({ reg, ok: true });
      } catch (e) {
        console.warn("saveEdits failed for", reg, e);
        results.push({ reg, ok: false, error: e });
      }
    }

    setNlpResult((p) => ({ ...(p || {}), items: p?.items || [] }));
    return results;
  };

  // Process NLP for HOD: uses same logic as advisor but operates on `students` (all DB unless section specified)
  const processNlpQuery = async (rawQ: string) => {
    const raw = String(rawQ ?? "").trim();
    if (!raw) {
      setNlpResult(null);
      return;
    }

    await ensureStudents();

    const intents: Record<string, string[]> = {
      leetcode: ["leetcode", "lc"],
      personal: ["personal", "personal details", "personal info", "details"],
      phone: ["phone", "mobile", "contact", "phone number", "mobile no"],
      cgpa: ["cgpa", "cgpa index", "cgpa overall"],
      gpa: ["gpa", "sem", "semester"],
      codechef: ["codechef", "cc"],
      skillrack: ["skillrack", "sr"],
      github: ["github", "git hub", "git-hub", "git hub", "git"],
      residency: ["hostel", "hosteller", "residency", "home", "home type", "home types", "residency status", "day scholar", "dayscholar"],
      address: ["address", "home", "residence", "permanent address", "current address"],
      resume: ["resume", "cv", "curriculum vitae"],
      id: ["aadhar", "pan", "adhar", "aadhar no", "pan no"],
      placement: ["placement", "offer", "company", "placed"],
      coe: ["coe", "center of excellence", "projects"],
    };

    const groups = String(raw).split(/\s*;\s*/).map((g) => g.trim()).filter(Boolean);
    const items: { students: StudentRecord[]; fields: string[] | null; query: string; notFound?: boolean; lowConfidence?: boolean; confidence?: number; scores?: number[]; suggestion?: string; suggestionScore?: number }[] = [];

    for (const group of groups) {
      const subsegments = String(group).split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
      const groupItems: { students: StudentRecord[]; fields: string[] | null; query: string; notFound?: boolean; lowConfidence?: boolean; confidence?: number; scores?: number[]; suggestion?: string; suggestionScore?: number }[] = [];

      for (const seg of subsegments) {
        const segLow = seg.toLowerCase();

        // Special: detect "top N <platform>" queries
        const topMatch = segLow.match(/\btop\s+(\d{1,3})\s*(?:by\s*)?(lc|leetcode|codechef|cc|skillrack|sr|placement|cgpa|gpa)\b(?:\s+(rating|total|solved))?/i);
        if (topMatch) {
          const n = Math.max(1, Math.min(200, Number(topMatch[1] || 10)));
          const platform = (topMatch[2] || "lc").toLowerCase();
          const metricHint = (topMatch[3] || "").toLowerCase();

          let metric = "lcTotal";
          let fieldsForPlatform: string[] = ["leetcodeId", "lcTotal", "lcRating", "lcEasy", "lcMed", "lcHard"];

          if (platform === "codechef" || platform === "cc") {
            metric = "ccTotal";
            fieldsForPlatform = ["codechefId", "ccTotal", "ccRating", "ccRank", "ccBadges"];
          } else if (platform === "skillrack" || platform === "sr") {
            metric = "srProblems";
            fieldsForPlatform = ["skillrackId", "srProblems", "srRank"];
          } else if (platform === "placement") {
            metric = "placementStatus";
            fieldsForPlatform = ["placement", "internshipCompany", "internshipOfferLink"];
          } else if (platform === "cgpa") {
            metric = "cgpaOverall";
            fieldsForPlatform = ["cgpaOverall", "gpaSem1", "gpaSem2", "gpaSem3"];
          } else if (platform === "gpa") {
            metric = "gpaSem1";
            fieldsForPlatform = ["gpaSem1", "gpaSem2", "gpaSem3", "gpaSem4"];
          }

          if (metricHint === "rating") {
            if (metric === "lcTotal") metric = "lcRating";
            if (metric === "ccTotal") metric = "ccRating";
          }

          const scored = students
            .map((s) => ({ s, val: Number((s as any)[metric]) || 0 }))
            .sort((a, b) => b.val - a.val)
            .slice(0, n)
            .map((x) => x.s);

          items.push({ students: scored, fields: fieldsForPlatform, query: seg, notFound: scored.length === 0, lowConfidence: false, confidence: 1 });
          continue;
        }

        let fields: string[] | null = null;

        // exact intent tokens
        for (const key in intents) {
          for (const k of intents[key]) {
            if (segLow.includes(k)) {
              switch (key) {
                case "leetcode":
                  fields = ["leetcodeId", "lcTotal", "lcRating", "lcEasy", "lcMed", "lcHard", "lcBadges", "lcMax"];
                  break;
                case "phone":
                  fields = ["mobile", "altMobile"];
                  break;
                case "personal":
                  fields = ["personalEmail", "officialEmail", "currentAddress", "permanentAddress"];
                  break;
                case "cgpa":
                  fields = ["cgpaOverall"];
                  break;
                case "gpa":
                  fields = ["gpaSem1", "gpaSem2", "gpaSem3"];
                  break;
                case "codechef":
                  fields = ["codechefId", "ccTotal", "ccRank", "ccRating", "ccBadges"];
                  break;
                case "skillrack":
                  fields = ["srProblems", "srRank"];
                  break;
                case "github":
                  fields = ["github"];
                  break;
                case "residency":
                  fields = ["isHosteller"];
                  break;
              }
            }
          }
        }

        const fieldAliases: Record<string, string[]> = {
          guardianName: ["guardian", "guardian name", "guardian_name", "guardianname"],
          diplomaYear: ["diploma year", "diploma", "diploma_year"],
          diplomaPercentage: ["diploma %", "diploma percentage", "diploma_pct"],
          gpaSem4: ["gpa sem4", "gpa sem 4", "sem4", "gpa4"],
          gpaSem5: ["gpa sem5", "gpa sem 5", "sem5", "gpa5"],
          gpaSem6: ["gpa sem6", "gpa sem 6", "sem6", "gpa6"],
          gpaSem7: ["gpa sem7", "gpa sem 7", "sem7", "gpa7"],
          gpaSem8: ["gpa sem8", "gpa sem 8", "sem8", "gpa8"],
          skillrackId: ["skillrack id", "skill rack id", "sr id", "skillrackid"],
          internshipCompany: ["internship", "internship company", "internship company name", "internship_company"],
          internshipOfferLink: ["internship offer", "internship offer link", "offer letter", "internship_offer_link"],
          aadhar: ["aadhar", "adhar", "aadhar no", "aadhar number"],
          pan: ["pan", "pan no", "pan number"],
          cgpaOverall: ["cgpa", "cgpa overall"],
          leetcodeId: ["leetcode", "lc", "leet"],
          codechefId: ["codechef", "cc"],
          github: ["github", "git", "git hub"],
          linkedin: ["linkedin", "linked in"],
          personalEmail: ["email", "personal email", "personal mail", "mail"],
          officialEmail: ["official email", "official mail", "office mail"],
          mobile: ["mobile", "phone", "mobile no", "phone number", "contact"],
          fatherName: ["father", "father name", "dad", "daddy", "father's name"],
          motherName: ["mother", "mother name", "mom", "mummy", "mother's name"],
          dob: ["dob", "date of birth", "birthdate", "d.o.b", "birth date", "bday", "birthdate", "dateofbirth"],
          lcTotal: ["lc total", "lc count", "leetcode total", "leetcode count", "leetcode solved", "lc solved", "lc_total", "total solved", "total problems", "lc problems"],
          ccTotal: ["cc total", "cc count", "codechef total", "codechef count", "cc solved", "cc_total", "codechef solved"],
          name: ["name", "student name", "student_name", "studentname"],
          regNo: ["reg", "reg no", "registration", "roll", "roll no", "regno"],
          resumeUrl: ["resume", "cv", "curriculum vitae", "resume link"],
          knownTechStack: ["skills", "known tech stack", "tech stack", "technologies", "stack"],
          placement: ["placement", "placed", "offer", "company", "company offer", "package"],
          coeName: ["coe", "center of excellence", "coe name", "projects"],
          isHosteller: ["hostel", "hosteller", "residency", "home", "day scholar", "dayscholar"],
        };

        const tokens = segLow.split(/\s+/).filter(Boolean);
        for (const key in fieldAliases) {
          for (const alias of fieldAliases[key]) {
            if (segLow.includes(alias.toLowerCase())) {
              fields = Array.from(new Set([...(fields || []), key]));
            }
          }
        }

        for (const t of tokens) {
          for (const key in fieldAliases) {
            for (const alias of fieldAliases[key]) {
              const sim = similarity(t, alias.toLowerCase());
              if (sim > 0.75) {
                fields = Array.from(new Set([...(fields || []), key]));
              }
            }
          }
        }

        for (const t of tokens) {
          for (const intentKey in intents) {
            for (const alias of intents[intentKey]) {
              const sim = similarity(t, alias.toLowerCase());
              if (sim > 0.8) {
                switch (intentKey) {
                  case "leetcode":
                    fields = Array.from(new Set([...(fields || []), "leetcodeId", "lcTotal", "lcRating", "lcEasy", "lcMed", "lcHard", "lcBadges", "lcMax"]));
                    break;
                  case "phone":
                    fields = Array.from(new Set([...(fields || []), "mobile", "altMobile"]));
                    break;
                  case "personal":
                    fields = Array.from(new Set([...(fields || []), "personalEmail", "officialEmail", "currentAddress", "permanentAddress"]));
                    break;
                  case "cgpa":
                    fields = Array.from(new Set([...(fields || []), "cgpaOverall"]));
                    break;
                  case "gpa":
                    fields = Array.from(new Set([...(fields || []), "gpaSem1", "gpaSem2", "gpaSem3"]));
                    break;
                  case "codechef":
                    fields = Array.from(new Set([...(fields || []), "codechefId", "ccTotal", "ccRank", "ccRating", "ccBadges"]));
                    break;
                  case "skillrack":
                    fields = Array.from(new Set([...(fields || []), "srProblems", "srRank"]));
                    break;
                  case "github":
                    fields = Array.from(new Set([...(fields || []), "github"]));
                    break;
                  case "residency":
                    fields = Array.from(new Set([...(fields || []), "isHosteller"]));
                    break;
                }
              }
            }
          }
        }

        // Numeric comparator / presence / text contains handling
        // Detect simple numeric comparisons like "lc problems more than 22" or "cgpas above 8.5"
        const numberMatch = segLow.match(/([0-9]+(?:\.[0-9]+)?)/);
        const hasNegative = /\b(no|without|missing|has no|not have)\b/.test(segLow);
        const textContainsMatch = segLow.match(/(?:address|city|town|state)\s*(?:is|:)?\s*([a-zA-Z ]{2,50})$/i);

        if (numberMatch) {
          const num = Number(numberMatch[1]);
          // determine operator
          let op: string = '=';
          if (/\b(more than|above|greater than|greater)\b|>/.test(segLow)) op = '>';
          else if (/\b(less than|below|smaller than)\b|</.test(segLow)) op = '<';
          else if (/\b(at least|>=|minimum|min)\b/.test(segLow)) op = '>=';
          else if (/\b(at most|<=|maximum|max)\b/.test(segLow)) op = '<=';

          // find numeric field candidate from detected fields or aliases
          const numericCandidates = ['lcTotal', 'ccTotal', 'lcRating', 'ccRating', 'srProblems', 'cgpaOverall', 'gpaSem1', 'gpaSem2', 'gpaSem3'];
          let numericField: string | null = null;
          // prefer already-detected fields
          if (fields) {
            for (const f of fields) if (numericCandidates.includes(f)) { numericField = f; break; }
          }
          // fallback: search aliases
          if (!numericField) {
            for (const key in fieldAliases) {
              if (numericCandidates.includes(key)) {
                for (const alias of fieldAliases[key]) {
                  if (segLow.includes(alias.toLowerCase())) { numericField = key; break; }
                }
              }
              if (numericField) break;
            }
          }

          if (numericField) {
            const filtered = students.filter((s) => {
              const raw = (s as any)[numericField];
              const val = Number(raw);
              if (!Number.isFinite(val)) return false;
              switch (op) {
                case '>': return val > num;
                case '<': return val < num;
                case '>=': return val >= num;
                case '<=': return val <= num;
                default: return val === num;
              }
            });
            items.push({ students: filtered, fields: Array.from(new Set([...(fields || []), numericField])), query: seg, notFound: filtered.length === 0, lowConfidence: false, confidence: 1 });
            continue;
          }
        }

        // presence checks: e.g., "no pan" -> missing pan
        if (hasNegative) {
          for (const key in fieldAliases) {
            for (const alias of fieldAliases[key]) {
              if (segLow.includes(alias.toLowerCase())) {
                const filtered = students.filter((s) => {
                  const v = (s as any)[key];
                  return v === null || v === undefined || String(v).trim() === '';
                });
                items.push({ students: filtered, fields: Array.from(new Set([...(fields || []), key])), query: seg, notFound: filtered.length === 0, lowConfidence: false, confidence: 1 });
                break;
              }
            }
          }
        }

        // text contains checks for address-like queries
        if (textContainsMatch) {
          const needle = String(textContainsMatch[1] || '').trim().toLowerCase();
          if (needle) {
            const filtered = students.filter((s) => {
              const ca = String((s as any).currentAddress || '').toLowerCase();
              const pa = String((s as any).permanentAddress || '').toLowerCase();
              return (ca && ca.includes(needle)) || (pa && pa.includes(needle));
            });
            items.push({ students: filtered, fields: Array.from(new Set([...(fields || []), 'currentAddress', 'permanentAddress'])), query: seg, notFound: filtered.length === 0, lowConfidence: false, confidence: 1 });
            continue;
          }
        }

        const numericTokens = tokens.filter((tt) => /^\d+$/.test(tt));
        for (const nt of numericTokens) {
          const n = Number(nt);
          if (n === 10) {
            fields = Array.from(new Set([...(fields || []), 'tenthPercentage', 'tenthYear']));
          } else if (n === 12) {
            fields = Array.from(new Set([...(fields || []), 'twelfthPercentage', 'twelfthYear']));
          } else if (nt.length >= 3) {
            fields = Array.from(new Set([...(fields || []), 'regNo', 'name', 'dept', 'section']));
          } else if (n >= 1 && n <= 8) {
            fields = Array.from(new Set([...(fields || []), 'year']));
          } else {
            fields = Array.from(new Set([...(fields || []), 'regNo', 'name', 'dept', 'section']));
          }
        }

        try {
          const exemplar = (students && students[0]) || {};
          const addIfExists = (key: string) => {
            if (!key) return;
            const k = String(key);
            if (Object.prototype.hasOwnProperty.call(exemplar, k)) {
              fields = Array.from(new Set([...(fields || []), k]));
              return true;
            }
            return false;
          };

          const toCamel = (raw: string) => {
            const parts = raw.split(/[^a-z0-9]+/i).filter(Boolean);
            if (parts.length === 0) return "";
            return (
              parts[0].toLowerCase() +
              parts
                .slice(1)
                .map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase())
                .join("")
            );
          };

          for (const t of tokens) {
            const cleaned = String(t || "").replace(/[^a-z0-9_\-]/gi, "");
            if (!cleaned) continue;
            const camel = toCamel(cleaned);
            if (camel && addIfExists(camel)) continue;
            if (addIfExists(cleaned.toLowerCase())) continue;
            const low = cleaned.toLowerCase();
            if (low.includes("intern") || low.includes("company") || low.includes("offer")) {
              addIfExists("internshipCompany");
              addIfExists("internshipOfferLink");
            }
            if (low.includes("diploma")) {
              addIfExists("diplomaYear");
              addIfExists("diplomaPercentage");
            }
            if (low.includes("guardian")) {
              addIfExists("guardianName");
            }
            const m = low.match(/(?:sem|gpa)\s*\-?\s*(\d)/);
            if (m) {
              const n = Number(m[1]);
              if (n >= 4 && n <= 8) addIfExists(`gpaSem${n}`);
            }
          }
        } catch (e) {}

        let nameOnly = segLow;
        for (const arr of Object.values(intents)) {
          for (const token of arr) nameOnly = nameOnly.replace(new RegExp(token, "gi"), "").trim();
        }

        for (const arr of Object.values({ aadhar: ["aadhar", "adhar", "aadhar no", "aadhar number"], pan: ["pan", "pan no", "pan number"], cgpaOverall: ["cgpa", "cgpa overall"], leetcodeId: ["leetcode", "lc", "leet"], codechefId: ["codechef", "cc"], github: ["github", "git", "git hub"], linkedin: ["linkedin", "linked in"], personalEmail: ["email", "personal email", "personal mail", "mail"], officialEmail: ["official email", "official mail", "office mail"], mobile: ["mobile", "phone", "mobile no", "phone number", "contact"], fatherName: ["father", "father name", "dad", "daddy", "father's name"], motherName: ["mother", "mother name", "mom", "mummy", "mother's name"], dob: ["dob", "date of birth", "birthdate", "d.o.b"], regNo: ["reg", "reg no", "registration", "roll", "roll no", "regno"], resumeUrl: ["resume", "cv", "curriculum vitae", "resume link"], knownTechStack: ["skills", "known tech stack", "tech stack", "technologies", "stack"], placement: ["placement", "placed", "offer", "company", "company offer", "package"], coeName: ["coe", "center of excellence", "coe name", "projects"], isHosteller: ["hostel", "hosteller", "residency", "home", "day scholar", "dayscholar"] })) {
          for (const token of arr) {
            nameOnly = nameOnly.replace(new RegExp(token, "gi"), "").trim();
          }
        }

        const matchByRegLocal = (s: StudentRecord) => s.regNo.toLowerCase() === segLow || s.regNo.toLowerCase() === seg.toLowerCase();

        let matches: StudentRecord[] = students.filter((s) => matchByRegLocal(s));

        if (matches.length === 0) {
          const guess = nameOnly || segLow;
          matches = students.filter((s) => {
            const n = s.name.toLowerCase();
            return n === guess || n.startsWith(guess) || n.includes(guess);
          });
        }

        let notFound = false;
        if (matches.length === 0) {
          const guess = (nameOnly || segLow).toLowerCase();
          const allScored = students.map((s) => {
            const nameSim = similarity(s.name.toLowerCase(), guess);
            const regSim = similarity((s.regNo || "").toLowerCase(), guess);
            const emailSim = similarity(((s.personalEmail || s.officialEmail) || "").toLowerCase(), guess);
            const score = Math.max(nameSim, regSim, emailSim);
            return { s, score };
          });
          const scoredAllSorted = allScored.sort((a, b) => b.score - a.score);
          const maxScore = scoredAllSorted.length ? scoredAllSorted[0].score : 0;

          if (maxScore < 0.3) {
            // If very low similarity, consider not found. If it's marginally low,
            // offer a "did you mean" suggestion using the top candidate.
            if (maxScore >= 0.25 && scoredAllSorted.length > 0) {
              const best = scoredAllSorted[0];
              // produce an item with suggestion (no students)
              items.push({ students: [], fields, query: seg, notFound: true, suggestion: best.s.name, suggestionScore: best.score });
              continue;
            }
            notFound = true;
          } else {
            const threshold = maxScore >= 0.6 ? 0.35 : 0.25;
            const scored = scoredAllSorted.filter((x) => x.score >= threshold);
            if (scored.length > 0) {
              matches = scored.slice(0, 5).map((x) => x.s);
              const scores = scored.slice(0, 5).map((x) => x.score);
              const confidence = maxScore;
              const lowConfidence = confidence < 0.6;
              items.push({ students: matches, fields, query: seg, notFound: false, lowConfidence, confidence, scores });
              continue;
            } else {
              // No scored matches above threshold: offer suggestion if the best candidate is somewhat close
              if (scoredAllSorted.length > 0 && scoredAllSorted[0].score >= 0.25) {
                const best = scoredAllSorted[0];
                items.push({ students: [], fields, query: seg, notFound: true, suggestion: best.s.name, suggestionScore: best.score });
                continue;
              }
              notFound = true;
            }
          }
        }

        if ((matches.length === 0 || notFound) && fields && fields.length > 0 && groupItems.length > 0) {
          const prev = groupItems[groupItems.length - 1];
          prev.fields = Array.from(new Set([...(prev.fields || []), ...fields]));
          prev.query = `${prev.query}, ${seg}`;
          continue;
        }

        groupItems.push({ students: matches, fields, query: seg, notFound });
      }

      items.push(...groupItems);
    }

    // If no items were produced, show a single notFound item so the UI displays a helpful message
    if (!items || items.length === 0) {
      console.debug('[HOD NLP] no items produced for', raw);
      setNlpResult({ items: [{ students: [], fields: null, query: raw, notFound: true }] });
      return;
    }

    console.debug('[HOD NLP] items', items.map(it => ({ q: it.query, count: it.students.length, confidence: it.confidence })));
    setNlpResult({ items });
  };

  // Section color palette: non-SDE (A-M) -> violet, SDE (N-Q) -> orange
  const sectionPaletteFor = (section?: string) => {
    if (!section) return { badge: 'bg-slate-100 text-slate-700', accent: 'border-l-4 border-slate-200' };
    const s = String(section).trim().toUpperCase();
    if (/^[N-Q]$/.test(s)) {
      return { badge: 'bg-orange-100 text-orange-800', accent: 'border-l-4 border-orange-300' };
    }
    return { badge: 'bg-violet-100 text-violet-800', accent: 'border-l-4 border-violet-300' };
  };

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
      <header className="bg-gradient-to-r from-violet-600 to-indigo-700 text-white p-3 shadow-lg sticky top-0 z-50">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <Logo />
            <div>
              <h1 className="text-md font-black tracking-tight uppercase leading-none text-white">
                HOD Dashboard
              </h1>
              <p className="text-[8px] uppercase tracking-[0.3em] opacity-80 mt-0.5 text-white">
                CSE Department
              </p>
            </div>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="bg-white/10 p-1 pr-3 rounded-full border border-white/20 flex items-center gap-2 hover:bg-white/20 transition-all"
            >
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-violet-700 font-black text-[9px]">
                HD
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
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-[2rem] shadow-2xl border border-slate-100 py-3 z-[60] animate-in zoom-in-95 duration-300">
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
                  Logout
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

              className="w-full bg-white border border-slate-200 rounded-[2rem] py-6 pl-16 pr-8 text-base font-semibold shadow-sm focus:outline-none focus:ring-8 focus:ring-violet-500/5 focus:border-violet-300 transition-all placeholder:text-slate-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  // process as NLP query against whole DB unless section specified
                  await processNlpQuery((e.target as HTMLInputElement).value);
                }
              }}
            />
          </div>
          <div className="flex items-center gap-3 pl-2">
            
            <div className="ml-auto">
              <button
                onClick={() => onSectionSelect("ALL")}
                className="px-4 py-2 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-violet-700 transition-colors"
              >
                View All Students
              </button>
            </div>
          </div>
          {/* NLP Result rendering (adapted from Advisor) */}
          {nlpResult && nlpResult.items && nlpResult.items.length > 0 && (
            <div className="px-4">
              {nlpResult.items.map((item, idx) => (
                <div key={idx} className="mb-4">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        {item.notFound ? (
                          <div>
                            {item.suggestion && !suggestionDismissed[idx] ? (
                              <div className="flex items-center gap-3">
                                <div>
                                  <div className="text-sm font-extrabold text-slate-900">Did you mean</div>
                                  <div className="mt-1 text-[11px] text-slate-600">"{item.suggestion}" • {(item.suggestionScore! * 100).toFixed(0)}% match</div>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                  <button onClick={async () => { await processNlpQuery(String(item.suggestion || "")); }} className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-[11px] font-black">Use Suggestion</button>
                                  <button onClick={() => setSuggestionDismissed((p) => ({ ...(p||{}), [idx]: true }))} className="px-3 py-1.5 border border-slate-200 bg-white text-rose-600 rounded-lg text-[11px] font-black">No</button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-sm font-extrabold text-rose-600">No matching student</div>
                                <div className="text-[11px] text-rose-500">Query: {item.query}</div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                                {item.students.length === 1 ? (
                                  <>
                                    <span>{item.students[0].name}</span>
                                    <span className={`${sectionPaletteFor(item.students[0].section).badge} text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md`}>{item.students[0].section || '-'}</span>
                                  </>
                                ) : (`${item.students.length} matches`)}
                              </div>
                              {item.students && item.students.length === 1 && (
                                <div className="text-[10px] text-slate-400 ml-3">Last updated: {(item.students[0].updatedAt && new Date(item.students[0].updatedAt).toLocaleString()) || '-'}</div>
                              )}
                              {typeof item.confidence === 'number' && (
                                <div className={`text-[11px] font-black px-2 py-0.5 rounded-md ${item.lowConfidence ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {item.lowConfidence ? 'Low confidence' : 'Confidence'} • {(item.confidence * 100).toFixed(0)}%
                                </div>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{item.students.length === 1 ? `${item.students[0].regNo} • ${item.students[0].section}` : `Query: ${item.query}`}</div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.students.length === 1 ? (
                          <button onClick={() => { onSectionSelect(item.students[0].section); }} className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-[11px] font-black">View Section</button>
                        ) : null}
                        <button onClick={() => { setNlpResult(null); }} className="px-3 py-1.5 border border-slate-200 bg-white text-slate-700 rounded-lg text-[11px] font-black">Cancel</button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-end gap-2 mb-3">
                        <button
                          onClick={async () => {
                            await saveEditsForItem(idx);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-black"
                        >
                          Save
                        </button>
                      </div>

                        {(() => {
                        const selReg = selectedStudentByItem[idx] || (item.students && item.students[0] && item.students[0].regNo) || '';
                        const s = ((item.students && item.students.find((x) => x.regNo === selReg)) as any) || ((item.students && item.students[0]) as any) || {};
                        const isTopRequest = typeof item.query === 'string' && /\btop\b/i.test(item.query) && Array.isArray(item.students) && item.students.length > 0;
                        const numericFieldSet = new Set(['lcTotal','ccTotal','lcRating','ccRating','srProblems','cgpaOverall','gpaSem1','gpaSem2','gpaSem3','lcEasy','lcMed','lcHard']);
                        const hasNumericFields = Array.isArray(item.fields) && item.fields.some((f) => numericFieldSet.has(f));
                        const shouldRenderTable = isTopRequest || (Array.isArray(item.students) && item.students.length > 1 && (item.confidence === 1 || hasNumericFields));

                        if (shouldRenderTable) {
                          const cols = [
                            { key: '__sno', label: 'S.No' },
                            { key: 'regNo', label: 'Reg No' },
                            { key: 'section', label: 'Section' },
                            { key: 'name', label: 'Name' },
                            // show numeric and requested fields as columns; prefer item.fields when present
                            ...((item.fields && item.fields.length > 0) ? item.fields.map((k) => ({ key: k, label: String(k).replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toUpperCase() })) : []),
                          ];

                          return (
                            <div className="overflow-x-auto">
                              <div className="flex justify-end mb-2">
                                <button
                                  onClick={() => {
                                    const headers = cols.map((c) => c.label);
                                    const rows = (item.students || []).map((st, rix) => cols.map((c) => {
                                      if (c.key === '__sno') return String(rix + 1);
                                      const v = (st as any)[c.key];
                                      if (v === null || v === undefined) return '';
                                      if (Array.isArray(v)) return v.join('; ');
                                      return String(v);
                                    }));
                                    downloadCsv(`nlp-table-${idx + 1}.csv`, headers, rows as any);
                                  }}
                                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-black mr-2"
                                >
                                  Download CSV
                                </button>
                              </div>
                              
                              
                              
                              
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                    {cols.map((c) => (
                                      <th key={c.key} className="px-3 py-2">{c.label}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.students.map((st, ridx) => {
                                    const reg = st.regNo || '';
                                    return (
                                      <tr key={reg || ridx} className="hover:bg-slate-50">
                                        <td className="px-3 py-2 text-[11px] font-black text-slate-400">{ridx + 1}</td>
                                        <td className="px-3 py-2 text-[11px] font-black text-slate-700">{st.regNo || '-'}</td>
                                        <td className="px-3 py-2 text-[11px] font-black text-slate-700">{(() => {
                                          const pal = sectionPaletteFor(st.section);
                                          return (<span className={`${pal.badge} px-2 py-0.5 rounded-full text-[10px] font-black`}>{st.section || '-'}</span>);
                                        })()}</td>
                                        <td className="px-3 py-2 text-[11px] font-black text-slate-900">{st.name || '-'}</td>
                                        {(item.fields || []).map((fk) => {
                                          const editing = (nlpEdits[reg] && Object.prototype.hasOwnProperty.call(nlpEdits[reg], fk));
                                          const editedVal = nlpEdits[reg] ? nlpEdits[reg][fk] : undefined;
                                          const value = editedVal !== undefined ? editedVal : (st as any)[fk];
                                          return (
                                            <td key={fk} className="px-3 py-2 text-[11px] font-black text-slate-700">
                                              {editing ? (
                                                <input
                                                  value={value === null || value === undefined ? '' : String(value)}
                                                  onChange={(e) => updateEditValue(reg, fk, e.target.value)}
                                                  className="w-full p-1 border rounded"
                                                />
                                              ) : (
                                                <div onDoubleClick={() => startEditing(reg, fk, (st as any)[fk] ?? '')}>
                                                  {(() => {
                                                    const v = (st as any)[fk];
                                                    if (v === null || v === undefined || v === '') return '-';
                                                    if (fk === 'isHosteller') return v ? 'Hosteller' : 'Day Scholar';
                                                    if (Array.isArray(v)) return v.length ? v.join(', ') : '-';
                                                    return String(v);
                                                  })()}
                                                </div>
                                              )}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                        }

                        const renderCard = (title: string, value: any, accentClass?: string) => (
                          <div className={`bg-white border border-slate-100 p-3 rounded-xl ${accentClass ?? ''} transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-100`} role="button" tabIndex={0}>
                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-wider">{title}</div>
                            <div className="text-sm font-extrabold text-slate-900 mt-2">{Array.isArray(value) ? (value.length ? value.join(', ') : '-') : (value === null || value === undefined || value === '' ? '-' : String(value))}</div>
                          </div>
                        );

                        const groups = [
                          { title: 'Identification', items: [ { title: 'Name', key: 'name' }, { title: 'Reg No', key: 'regNo' }, { title: 'Dept', key: 'dept' }, { title: 'Year', key: 'year' }, { title: 'Section', key: 'section' }, { title: 'Father Name', key: 'fatherName' }, { title: 'Mother Name', key: 'motherName' }, { title: 'Guardian Name', key: 'guardianName' }, { title: 'DOB', key: 'dob' } ] },
                          { title: 'Contact', items: [ { title: 'Mobile', key: 'mobile' }, { title: 'Alt Mobile', key: 'altMobile' }, { title: 'Official Email', key: 'officialEmail' }, { title: 'Personal Email', key: 'personalEmail' } ] },
                          { title: 'Academics', items: [ { title: '10th %', key: 'tenthPercentage' }, { title: '12th %', key: 'twelfthPercentage' }, { title: 'CGPA', key: 'cgpaOverall' }, { title: 'GPA Sem1', key: 'gpaSem1' }, { title: 'GPA Sem2', key: 'gpaSem2' }, { title: 'GPA Sem3', key: 'gpaSem3' }, { title: 'GPA Sem4', key: 'gpaSem4' }, { title: 'GPA Sem5', key: 'gpaSem5' }, { title: 'GPA Sem6', key: 'gpaSem6' }, { title: 'GPA Sem7', key: 'gpaSem7' }, { title: 'GPA Sem8', key: 'gpaSem8' }, { title: 'Diploma Year', key: 'diplomaYear' }, { title: 'Diploma %', key: 'diplomaPercentage' } ] },
                          { title: 'LeetCode', items: [ { title: 'LeetCode ID', key: 'leetcodeId' }, { title: 'LC Total', key: 'lcTotal' }, { title: 'LC Easy', key: 'lcEasy' }, { title: 'LC Med', key: 'lcMed' }, { title: 'LC Hard', key: 'lcHard' }, { title: 'LC Rating', key: 'lcRating' }, { title: 'LC Badges', key: 'lcBadges' }, { title: 'LC Max', key: 'lcMax' } ] },
                          { title: 'CodeChef', items: [ { title: 'CodeChef ID', key: 'codechefId' }, { title: 'CC Total', key: 'ccTotal' }, { title: 'CC Rank', key: 'ccRank' }, { title: 'CC Rating', key: 'ccRating' }, { title: 'CC Badges', key: 'ccBadges' } ] },
                          { title: 'SkillRack', items: [ { title: 'SR Problems', key: 'srProblems' }, { title: 'SR Rank', key: 'srRank' }, { title: 'SkillRack ID', key: 'skillrackId' } ] },
                          { title: 'Social & Professional', items: [ { title: 'GitHub', key: 'github' }, { title: 'LinkedIn', key: 'linkedin' }, { title: 'Known Tech Stack', key: 'knownTechStack' } ] },
                          { title: 'Placement & COE', items: [ { title: 'Placement', key: 'placement' }, { title: 'COE Name', key: 'coeName' } ] },
                        ];

                        const palette = [
                          { badge: 'bg-blue-100 text-blue-800', accent: 'border-l-4 border-blue-300' },
                          { badge: 'bg-green-100 text-green-800', accent: 'border-l-4 border-green-300' },
                          { badge: 'bg-indigo-100 text-indigo-800', accent: 'border-l-4 border-indigo-300' },
                          { badge: 'bg-rose-100 text-rose-800', accent: 'border-l-4 border-rose-300' },
                        ];

                        return (
                          <div className="space-y-3">
                            {groups.map((g, gi) => {
                              let values = g.items.map((it) => ({ title: it.title, key: it.key, val: s[it.key] }));
                              const requestedFields = item.fields && item.fields.length > 0 ? new Set(item.fields) : null;
                              if (requestedFields) values = values.filter((v) => requestedFields.has(v.key));
                              let hasAny = false;
                              if (requestedFields) {
                                hasAny = values.some((v) => requestedFields.has(v.key) || (v.val !== undefined && v.val !== null && v.val !== ''));
                              } else {
                                hasAny = values.some((v) => v.val !== undefined && v.val !== null && v.val !== '') || values.some((v) => v.key === 'dob');
                              }
                              if (!hasAny) return null;
                              const pal = palette[gi % palette.length];
                              return (
                                <div key={g.title} className="mb-4 group">
                                  <div className={`${pal.badge} inline-block rounded-md px-3 py-1 text-[11px] font-black uppercase tracking-wider mb-2 cursor-default transition-transform duration-150 group-hover:scale-105`}>{g.title}</div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                                    {values.map((v) => {
                                      const reg = s.regNo || (item.students && item.students[0] && item.students[0].regNo) || '';
                                      const editing = (nlpEdits[reg] && Object.prototype.hasOwnProperty.call(nlpEdits[reg], v.key));
                                      const editedVal = nlpEdits[reg] ? (nlpEdits[reg][v.key] ?? undefined) : undefined;
                                      const displayVal = editedVal !== undefined ? editedVal : (v.val === undefined ? '-' : (v.key === 'isHosteller' ? (v.val ? 'Hosteller' : 'Day Scholar') : v.val));
                                      return (
                                        <div key={v.key} className="">
                                          {editing ? (
                                            <div className={`bg-white border border-slate-100 p-3 rounded-xl ${pal.accent} transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg`}>
                                              <div className="text-[9px] font-black text-slate-600 uppercase tracking-wider">{v.title}</div>
                                              <input
                                                value={displayVal === '-' ? '' : displayVal}
                                                onChange={(e) => updateEditValue(reg, v.key, e.target.value)}
                                                className="w-full mt-2 p-2 border rounded-lg text-sm font-extrabold text-slate-900"
                                              />
                                            </div>
                                          ) : (
                                            <div onDoubleClick={() => startEditing(reg, v.key, v.val)}>{renderCard(v.title, displayVal, pal.accent)}</div>
                                          )}
                                        </div>
                                      );
                                    })}
                                      </div>
                                    {/* render alternatives if there are multiple students */}
                                    {item.students && item.students.length > 1 && (
                                      <div className="mt-3 px-3">
                                        <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">Other matches</div>
                                        <div className="flex gap-2 flex-wrap">
                                          {item.students.filter(st => st.regNo !== (s.regNo || '')).map((st) => (
                                            <button key={st.regNo} onClick={() => setSelectedStudentByItem((p) => ({ ...(p||{}), [idx]: st.regNo }))} className="px-3 py-1.5 border border-slate-200 bg-white text-slate-700 rounded-lg text-[11px] font-black">
                                              {st.name} • {st.regNo} • {st.section}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SDE Sector (N-Q) */}
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-orange-500 rounded-full"></div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                SDE Technical Tracks (N-Q)
              </h2>
            </div>
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

        {/* Non-SDE Sector (A-M) */}
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-violet-600 rounded-full"></div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Non SDE Sectors (A-M)
              </h2>
            </div>
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
