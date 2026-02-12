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
  fetchStudentsWithPendingUpdates,
  checkAndAutoClearUpdates,
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
  // NLP quick-search state (supports comma-separated segments)
  const [nlpQuery, setNlpQuery] = useState("");
  const [nlpResult, setNlpResult] = useState<{
    items: { students: StudentRecord[]; fields: string[] | null; query: string; notFound?: boolean; lowConfidence?: boolean; confidence?: number; scores?: number[] }[];
  } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(
    null
  );
  // Inline edits made during NLP result viewing: { regNo: { fieldKey: value } }
  const [nlpEdits, setNlpEdits] = useState<Record<string, Record<string, any>>>({});
  const [editedStudent, setEditedStudent] = useState<Record<
    string,
    any
  > | null>(null);
  const [sortField, setSortField] = useState<keyof StudentRecord>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [profileOpen, setProfileOpen] = useState(false);

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState("");

  // Modal states
  const [updationModalOpen, setUpdationModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportSelectedFields, setExportSelectedFields] = useState<string[]>([]);

  // Registry Data States
  const [registryFields, setRegistryFields] = useState(INITIAL_REGISTRY_FIELDS);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [activeUpdationFields, setActiveUpdationFields] = useState<string[]>(
    []
  );
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [pendingStudentsTotal, setPendingStudentsTotal] = useState(0);
  const [showPendingList, setShowPendingList] = useState(false);

  // Organize registry fields with coding platforms first, then grouped by category
  const organizedRegistryFields = useMemo(() => {
    // Define priority keywords for coding platforms
    // LC = LeetCode, CC = CodeChef, CF = Codeforces, SR = Skillrack
    const codingKeywords = [
      "LEETCODE",
      "LC_",
      "LC ",
      "CODECHEF",
      "CC_",
      "CC ",
      "CODEFORCES",
      "CF_",
      "CF ",
      "SKILLRACK",
      "SR_",
      "SR ",
      "GITHUB",
      "LINKEDIN",
    ];
    const profileKeywords = [
      "NAME",
      "REG",
      "DEPT",
      "SECTION",
      "YEAR",
      "GENDER",
      "MOBILE",
      "MAIL",
      "EMAIL",
    ];
    const academicKeywords = ["CGPA", "GPA", "SEM", "10TH", "12TH", "BOARD"];

    const coding: { id: string; label: string; cat: string; raw?: string }[] =
      [];
    const profile: { id: string; label: string; cat: string; raw?: string }[] =
      [];
    const academic: { id: string; label: string; cat: string; raw?: string }[] =
      [];
    const other: { id: string; label: string; cat: string; raw?: string }[] =
      [];

    registryFields.forEach((field) => {
      const label = field.label.toUpperCase();
      const fieldWithRaw = { ...field, raw: (field as any).raw };
      if (codingKeywords.some((kw) => label.includes(kw))) {
        coding.push({ ...fieldWithRaw, cat: "🏆 Coding Platforms" });
      } else if (profileKeywords.some((kw) => label.includes(kw))) {
        profile.push({ ...fieldWithRaw, cat: "👤 Profile Info" });
      } else if (academicKeywords.some((kw) => label.includes(kw))) {
        academic.push({ ...fieldWithRaw, cat: "📚 Academics" });
      } else {
        other.push({ ...fieldWithRaw, cat: "📋 Other Fields" });
      }
    });

    return [...coding, ...profile, ...academic, ...other];
  }, [registryFields]);

  // Load student records for the active section from Supabase (or all for HOD)
  useEffect(() => {
    // load active updation fields for this section and schema fields
    let mounted2 = true;
    (async () => {
      if (!sectionName) return;
      const active = await fetchNeedsUpdation(
        sectionName === "ALL" ? "" : sectionName
      );
      if (mounted2) setActiveUpdationFields(active || []);

      // fetch column names from students table and populate registryFields
      const cols = await fetchStudentColumns();
      if (mounted2 && Array.isArray(cols) && cols.length > 0) {
        // filter out metadata-like columns
        const skip = new Set(["id", "created_at", "updated_at"]);
        const fields = cols
          .filter((c) => !skip.has(c.toLowerCase()))
          .map((c, idx) => ({
            id: `schema_${idx}_${c}`,
            label: String(c).replace(/_/g, " ").toUpperCase(),
            cat: "Schema",
            raw: c,
          }));
        setRegistryFields(fields);
      }

      // Fetch students with pending updates and check for auto-clear
      if (active && active.length > 0) {
        const pendingResult = await fetchStudentsWithPendingUpdates(
          sectionName === "ALL" ? "" : sectionName
        );
        if (mounted2) {
          setPendingStudents(pendingResult.students || []);
          setPendingStudentsTotal(pendingResult.totalStudents || 0);

          // Auto-clear if all students have updated
          if (
            pendingResult.allComplete &&
            pendingResult.totalStudents &&
            pendingResult.totalStudents > 0
          ) {
            const clearResult = await checkAndAutoClearUpdates(
              sectionName === "ALL" ? "" : sectionName
            );
            if (clearResult.cleared) {
              setActiveUpdationFields([]);
              setPendingStudents([]);
            }
          }
        }
      } else {
        if (mounted2) {
          setPendingStudents([]);
          setPendingStudentsTotal(0);
        }
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

  // Process NLP query: supports comma-separated segments like "name intent, name2 intent2"
  // Helper: compute Levenshtein distance and similarity ratio
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

  const processNlpQuery = (q: string) => {
    const raw = String(q ?? "").trim();
    if (!raw) {
      setNlpResult(null);
      return;
    }

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

    // Support semicolon-separated student groups, with comma-separated subsegments inside each group.
    const groups = String(raw).split(/\s*;\s*/).map((g) => g.trim()).filter(Boolean);
    const items: { students: StudentRecord[]; fields: string[] | null; query: string; notFound?: boolean; lowConfidence?: boolean; confidence?: number; scores?: number[]; suggestion?: string; suggestionScore?: number }[] = [];

    for (const group of groups) {
      const subsegments = String(group).split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
      const groupItems: { students: StudentRecord[]; fields: string[] | null; query: string; notFound?: boolean; lowConfidence?: boolean; confidence?: number; scores?: number[] }[] = [];

      for (const seg of subsegments) {
        const segLow = seg.toLowerCase();

        // Special: detect "top N <platform>" queries (e.g., "top 10 lc", "top 5 codechef")
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
            metric = "placementStatus"; // placement ranking is less numeric; keep primary placement info
            fieldsForPlatform = ["placement", "internshipCompany", "internshipOfferLink"];
          } else if (platform === "cgpa") {
            metric = "cgpaOverall";
            fieldsForPlatform = ["cgpaOverall", "gpaSem1", "gpaSem2", "gpaSem3"];
          } else if (platform === "gpa") {
            metric = "gpaSem1";
            fieldsForPlatform = ["gpaSem1", "gpaSem2", "gpaSem3", "gpaSem4"];
          }

          // If user asked specifically for 'rating', prefer rating fields where possible
          if (metricHint === "rating") {
            if (metric === "lcTotal") metric = "lcRating";
            if (metric === "ccTotal") metric = "ccRating";
          }

          let finalStudents: StudentRecord[] = [];
          let finalScores: number[] | undefined = undefined;

          if (platform === 'lc' && metricHint !== 'rating') {
            const weights = { lcTotal: 0.2, lcMed: 0.25, lcHard: 0.35, lcRating: 0.2 };
            const maxes = { lcTotal: 0, lcMed: 0, lcHard: 0, lcRating: 0 };
            for (const s of students) {
              maxes.lcTotal = Math.max(maxes.lcTotal, Number((s as any).lcTotal) || 0);
              maxes.lcMed = Math.max(maxes.lcMed, Number((s as any).lcMed) || 0);
              maxes.lcHard = Math.max(maxes.lcHard, Number((s as any).lcHard) || 0);
              maxes.lcRating = Math.max(maxes.lcRating, Number((s as any).lcRating) || 0);
            }

            const scored = students
              .map((s) => {
                const t = Number((s as any).lcTotal) || 0;
                const med = Number((s as any).lcMed) || 0;
                const hard = Number((s as any).lcHard) || 0;
                const rating = Number((s as any).lcRating) || 0;
                const normTotal = t / (maxes.lcTotal || 1);
                const normMed = med / (maxes.lcMed || 1);
                const normHard = hard / (maxes.lcHard || 1);
                const normRating = rating / (maxes.lcRating || 1);
                const score = weights.lcTotal * normTotal + weights.lcMed * normMed + weights.lcHard * normHard + weights.lcRating * normRating;
                return { s, score };
              })
              .sort((a, b) => b.score - a.score)
              .slice(0, n);

            finalStudents = scored.map((x) => x.s);
            finalScores = scored.map((x) => x.score);
          } else {
            const scored = students
              .map((s) => ({ s, val: Number((s as any)[metric]) || 0 }))
              .sort((a, b) => b.val - a.val)
              .slice(0, n)
              .map((x) => x.s);
            finalStudents = scored;
          }

          // Push as a single NLP item with high confidence
          items.push({ students: finalStudents, fields: fieldsForPlatform, query: seg, notFound: finalStudents.length === 0, lowConfidence: false, confidence: 1, scores: finalScores });
          continue;
        }

      // determine fields for this segment via exact intent tokens
      let fields: string[] | null = null;

      // Special: detect "best-performing section lc" queries
      const isBestSectionQuery = segLow.includes('section') && (segLow.includes('lc') || segLow.includes('leetcode')) && (segLow.includes('best') || segLow.includes('top') || segLow.includes('performing'));
      if (isBestSectionQuery) {
        const weights = { lcTotal: 0.2, lcMed: 0.25, lcHard: 0.35, lcRating: 0.2 };
        const maxes = { lcTotal: 0, lcMed: 0, lcHard: 0, lcRating: 0 };
        for (const s of students) {
          maxes.lcTotal = Math.max(maxes.lcTotal, Number((s as any).lcTotal) || 0);
          maxes.lcMed = Math.max(maxes.lcMed, Number((s as any).lcMed) || 0);
          maxes.lcHard = Math.max(maxes.lcHard, Number((s as any).lcHard) || 0);
          maxes.lcRating = Math.max(maxes.lcRating, Number((s as any).lcRating) || 0);
        }

        const perSection = new Map<string, { sum: number; count: number; sumTotal: number; sumMed: number; sumHard: number; sumRating: number }>();
        const studentScores: Map<string, number> = new Map();
        for (const s of students) {
          const t = Number((s as any).lcTotal) || 0;
          const med = Number((s as any).lcMed) || 0;
          const hard = Number((s as any).lcHard) || 0;
          const rating = Number((s as any).lcRating) || 0;
          const normTotal = t / (maxes.lcTotal || 1);
          const normMed = med / (maxes.lcMed || 1);
          const normHard = hard / (maxes.lcHard || 1);
          const normRating = rating / (maxes.lcRating || 1);
          const score = weights.lcTotal * normTotal + weights.lcMed * normMed + weights.lcHard * normHard + weights.lcRating * normRating;
          studentScores.set(s.regNo, score);
          const rawSec = String(s.section || '').trim().toUpperCase();
          const sec = rawSec.length === 1 && /^[A-Q]$/.test(rawSec) ? rawSec : null;
          if (!sec) continue;
          const prev = perSection.get(sec) || { sum: 0, count: 0, sumTotal: 0, sumMed: 0, sumHard: 0, sumRating: 0 };
          prev.sum += score;
          prev.count += 1;
          prev.sumTotal += t;
          prev.sumMed += med;
          prev.sumHard += hard;
          prev.sumRating += rating;
          perSection.set(sec, prev);
        }

        if (perSection.size === 0) {
          items.push({ students: [], fields: fieldsForPlatform, query: seg, notFound: true });
          continue;
        }

        let bestSection = '';
        let bestAvg = -Infinity;
        let bestHard = -Infinity;
        let bestRating = -Infinity;
        let bestTotal = -Infinity;
        for (const [sec, agg] of perSection.entries()) {
          const avg = agg.sum / (agg.count || 1);
          const avgHard = agg.sumHard / (agg.count || 1);
          const avgRating = agg.sumRating / (agg.count || 1);
          const avgTotal = agg.sumTotal / (agg.count || 1);
          if (avg > bestAvg || (avg === bestAvg && (avgHard > bestHard || (avgHard === bestHard && (avgRating > bestRating || (avgRating === bestRating && avgTotal > bestTotal)))))) {
            bestSection = sec;
            bestAvg = avg;
            bestHard = avgHard;
            bestRating = avgRating;
            bestTotal = avgTotal;
          }
        }

        if (bestAvg <= 0) {
          items.push({ students: [], fields: fieldsForPlatform, query: seg, notFound: true, suggestion: 'No LeetCode data available', suggestionScore: 0 });
          continue;
        }

        const studentsInSection = students.filter((s) => {
          const rawSec = String(s.section || '').trim().toUpperCase();
          return rawSec === bestSection;
        });
        const scoredStudents = studentsInSection.map((s) => ({ s, score: studentScores.get(s.regNo) || 0 })).sort((a, b) => b.score - a.score).slice(0, 5);
        const finalStudents = scoredStudents.map((x) => x.s);
        const finalScores = scoredStudents.map((x) => x.score);

        items.push({ students: finalStudents, fields: fieldsForPlatform, query: seg, notFound: finalStudents.length === 0, lowConfidence: false, confidence: bestAvg, suggestion: bestSection, suggestionScore: bestAvg, scores: finalScores });
        continue;
      }

      // Special: detect requests for per-section LC summary / all sections
      const isSectionsSummary = (segLow.includes('sections') || segLow.includes('all sections') || segLow.includes('list sections') || segLow.includes('sections summary') || segLow.includes('section summary')) && (segLow.includes('lc') || segLow.includes('leetcode'));
      if (isSectionsSummary) {
        const weights = { lcTotal: 0.2, lcMed: 0.25, lcHard: 0.35, lcRating: 0.2 };
        const maxes = { lcTotal: 0, lcMed: 0, lcHard: 0, lcRating: 0 };
        for (const s of students) {
          maxes.lcTotal = Math.max(maxes.lcTotal, Number((s as any).lcTotal) || 0);
          maxes.lcMed = Math.max(maxes.lcMed, Number((s as any).lcMed) || 0);
          maxes.lcHard = Math.max(maxes.lcHard, Number((s as any).lcHard) || 0);
          maxes.lcRating = Math.max(maxes.lcRating, Number((s as any).lcRating) || 0);
        }

        const perSection = new Map<string, { count: number; sumTotal: number; sumEasy: number; sumMed: number; sumHard: number; sumBadges: number; sumRating: number; sumComposite: number }>();
        const composites: { regNo: string; name: string; section: string; composite: number; lcTotal: number; lcEasy: number; lcMed: number; lcHard: number; lcBadges: number; lcRating: number }[] = [];
        for (const s of students) {
          const t = Number((s as any).lcTotal) || 0;
          const easy = Number((s as any).lcEasy) || 0;
          const med = Number((s as any).lcMed) || 0;
          const hard = Number((s as any).lcHard) || 0;
          const badges = Number((s as any).lcBadges) || 0;
          const rating = Number((s as any).lcRating) || 0;
          const normTotal = t / (maxes.lcTotal || 1);
          const normEasy = easy / (maxes.lcTotal || 1);
          const normMed = med / (maxes.lcMed || 1);
          const normHard = hard / (maxes.lcHard || 1);
          const normRating = rating / (maxes.lcRating || 1);
          const composite = weights.lcTotal * normTotal + weights.lcMed * normMed + weights.lcHard * normHard + weights.lcRating * normRating;

          const rawSec = String(s.section || '').trim().toUpperCase();
          const sec = rawSec.length === 1 && /^[A-Q]$/.test(rawSec) ? rawSec : null;
          if (!sec) continue;
          const prev = perSection.get(sec) || { count: 0, sumTotal: 0, sumEasy: 0, sumMed: 0, sumHard: 0, sumBadges: 0, sumRating: 0, sumComposite: 0 };
          prev.count += 1;
          prev.sumTotal += t;
          prev.sumEasy += easy;
          prev.sumMed += med;
          prev.sumHard += hard;
          prev.sumBadges += badges;
          prev.sumRating += rating;
          prev.sumComposite += composite;
          perSection.set(sec, prev);

          composites.push({ regNo: s.regNo, name: s.name, section: sec, composite, lcTotal: t, lcEasy: easy, lcMed: med, lcHard: hard, lcBadges: badges, lcRating: rating });
        }

        const rows: any[] = [];
        for (const [sec, agg] of perSection.entries()) {
          rows.push({
            section: sec,
            studentsCount: agg.count,
            avgLcTotal: agg.sumTotal / agg.count,
            avgLcEasy: agg.sumEasy / agg.count,
            avgLcMed: agg.sumMed / agg.count,
            avgLcHard: agg.sumHard / agg.count,
            avgLcBadges: agg.sumBadges / agg.count,
            avgLcRating: agg.sumRating / agg.count,
            avgComposite: agg.sumComposite / agg.count,
          });
        }

        rows.sort((a, b) => b.avgComposite - a.avgComposite);
        const topStudents = composites.sort((a, b) => b.composite - a.composite).slice(0, 10);
        const result = { sections: rows, topStudents };
        console.debug('[Advisor NLP] sections summary', result);
        items.push({ students: [], fields: fieldsForPlatform, query: seg, notFound: false, suggestion: JSON.stringify(result), suggestionScore: 1 });
        continue;
      }

      // Special: detect "section performance" query - shows CGPA + competitive coding for this section
      const isSectionPerformance = segLow.includes('section') && segLow.includes('performance');
      if (isSectionPerformance) {
        // Compute max values for normalization across all students in this section
        const maxes = {
          cgpa: 0, lcTotal: 0, lcMed: 0, lcHard: 0, lcRating: 0,
          ccTotal: 0, ccRating: 0, srProblems: 0
        };
        for (const s of students) {
          maxes.cgpa = Math.max(maxes.cgpa, Number((s as any).cgpaOverall) || 0);
          maxes.lcTotal = Math.max(maxes.lcTotal, Number((s as any).lcTotal) || 0);
          maxes.lcMed = Math.max(maxes.lcMed, Number((s as any).lcMed) || 0);
          maxes.lcHard = Math.max(maxes.lcHard, Number((s as any).lcHard) || 0);
          maxes.lcRating = Math.max(maxes.lcRating, Number((s as any).lcRating) || 0);
          maxes.ccTotal = Math.max(maxes.ccTotal, Number((s as any).ccTotal) || 0);
          maxes.ccRating = Math.max(maxes.ccRating, Number((s as any).ccRating) || 0);
          maxes.srProblems = Math.max(maxes.srProblems, Number((s as any).srProblems) || 0);
        }

        // Calculate aggregates for this section
        let agg = {
          count: 0, sumCgpa: 0,
          sumLcTotal: 0, sumLcEasy: 0, sumLcMed: 0, sumLcHard: 0, sumLcRating: 0, sumLcBadges: 0,
          sumCcTotal: 0, sumCcRating: 0, sumCcBadges: 0,
          sumSrProblems: 0, sumComposite: 0
        };

        const studentDetails: any[] = [];

        for (const s of students) {
          const cgpa = Number((s as any).cgpaOverall) || 0;
          const lcTotal = Number((s as any).lcTotal) || 0;
          const lcEasy = Number((s as any).lcEasy) || 0;
          const lcMed = Number((s as any).lcMed) || 0;
          const lcHard = Number((s as any).lcHard) || 0;
          const lcRating = Number((s as any).lcRating) || 0;
          const lcBadges = Number((s as any).lcBadges) || 0;
          const ccTotal = Number((s as any).ccTotal) || 0;
          const ccRating = Number((s as any).ccRating) || 0;
          const ccBadges = Number((s as any).ccBadges) || 0;
          const srProblems = Number((s as any).srProblems) || 0;

          // Composite score: CGPA (30%) + LC (40%) + CC (20%) + SR (10%)
          const normCgpa = cgpa / (maxes.cgpa || 10);
          const normLc = (lcTotal / (maxes.lcTotal || 1) * 0.3 + lcMed / (maxes.lcMed || 1) * 0.3 + lcHard / (maxes.lcHard || 1) * 0.25 + lcRating / (maxes.lcRating || 1) * 0.15);
          const normCc = (ccTotal / (maxes.ccTotal || 1) * 0.5 + ccRating / (maxes.ccRating || 1) * 0.5);
          const normSr = srProblems / (maxes.srProblems || 1);
          const composite = normCgpa * 0.3 + normLc * 0.4 + normCc * 0.2 + normSr * 0.1;

          agg.count += 1;
          agg.sumCgpa += cgpa;
          agg.sumLcTotal += lcTotal;
          agg.sumLcEasy += lcEasy;
          agg.sumLcMed += lcMed;
          agg.sumLcHard += lcHard;
          agg.sumLcRating += lcRating;
          agg.sumLcBadges += lcBadges;
          agg.sumCcTotal += ccTotal;
          agg.sumCcRating += ccRating;
          agg.sumCcBadges += ccBadges;
          agg.sumSrProblems += srProblems;
          agg.sumComposite += composite;

          studentDetails.push({
            regNo: s.regNo,
            name: s.name,
            cgpa,
            lcTotal, lcEasy, lcMed, lcHard, lcRating, lcBadges,
            ccTotal, ccRating, ccBadges,
            srProblems,
            composite: +composite.toFixed(3)
          });
        }

        // Sort students by composite score
        studentDetails.sort((a, b) => b.composite - a.composite);
        studentDetails.forEach((st, idx) => { st.rank = idx + 1; });

        const c = agg.count || 1;
        const sectionSummary = {
          section: sectionName || 'Unknown',
          studentCount: agg.count,
          avgCgpa: +(agg.sumCgpa / c).toFixed(2),
          avgLcTotal: +(agg.sumLcTotal / c).toFixed(1),
          avgLcEasy: +(agg.sumLcEasy / c).toFixed(1),
          avgLcMed: +(agg.sumLcMed / c).toFixed(1),
          avgLcHard: +(agg.sumLcHard / c).toFixed(1),
          avgLcRating: +(agg.sumLcRating / c).toFixed(0),
          avgLcBadges: +(agg.sumLcBadges / c).toFixed(1),
          avgCcTotal: +(agg.sumCcTotal / c).toFixed(1),
          avgCcRating: +(agg.sumCcRating / c).toFixed(0),
          avgCcBadges: +(agg.sumCcBadges / c).toFixed(1),
          avgSrProblems: +(agg.sumSrProblems / c).toFixed(0),
          compositeScore: +(agg.sumComposite / c).toFixed(3),
        };

        const result = { type: 'sectionPerformance', summary: sectionSummary, topStudents: studentDetails.slice(0, 10) };
        console.debug('[Advisor NLP] section performance', result);
        items.push({ students: [], fields: null, query: seg, notFound: false, suggestion: JSON.stringify(result), suggestionScore: 1 });
        continue;
      }

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

      // Additional fuzzy detection: map common field aliases to keys and detect via similarity
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
      // First pass: detect multi-word aliases that appear in the whole segment (handles 'lc count')
      for (const key in fieldAliases) {
        for (const alias of fieldAliases[key]) {
          if (segLow.includes(alias.toLowerCase())) {
            fields = Array.from(new Set([...(fields || []), key]));
          }
        }
      }
      // fuzzy-match tokens against field aliases
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

      // Also fuzzy-match tokens to intent alias tokens (covers misspellings like 'lcetode')
      for (const t of tokens) {
        for (const intentKey in intents) {
          for (const alias of intents[intentKey]) {
            const sim = similarity(t, alias.toLowerCase());
            if (sim > 0.8) {
              // map intentKey to fields (reuse previous mapping)
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

          const numericCandidates = ['lcTotal', 'ccTotal', 'lcRating', 'ccRating', 'srProblems', 'cgpaOverall', 'gpaSem1', 'gpaSem2', 'gpaSem3'];
          let numericField: string | null = null;
          if (fields) {
            for (const f of fields) if (numericCandidates.includes(f)) { numericField = f; break; }
          }
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
      // Numeric token heuristics: detect bare numbers and map them sensibly
      const numericTokens = tokens.filter((tt) => /^\d+$/.test(tt));
      for (const nt of numericTokens) {
        const n = Number(nt);
        // Common case: '10' or '12' likely refers to 10th/12th academic records
        if (n === 10) {
          fields = Array.from(new Set([...(fields || []), 'tenthPercentage', 'tenthYear']));
        } else if (n === 12) {
          fields = Array.from(new Set([...(fields || []), 'twelfthPercentage', 'twelfthYear']));
        } else if (nt.length >= 3) {
          // longer numeric tokens could be a regNo fragment or a year (e.g., 2021)
          // assume regNo fragment first
          fields = Array.from(new Set([...(fields || []), 'regNo', 'name', 'dept', 'section']));
        } else if (n >= 1 && n <= 8) {
          // small numbers 1..8 could mean academic year/semester — show year field
          fields = Array.from(new Set([...(fields || []), 'year']));
        } else {
          // fallback: treat as regNo fragment
          fields = Array.from(new Set([...(fields || []), 'regNo', 'name', 'dept', 'section']));
        }
      }

      // Extra: detect tokens that are written like field names (student_name, internship_company, etc.)
      // or camelCase/underscore variants and map them to StudentRecord keys when possible.
      try {
        const exemplar = (students && students[0]) || {};
        const addIfExists = (key: string) => {
          if (!key) return;
          // prefer camelCase key form
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
          // allow underscore/hyphen separated tokens
          const cleaned = String(t || "").replace(/[^a-z0-9_\-]/gi, "");
          if (!cleaned) continue;

          // Attempt direct forms
          const camel = toCamel(cleaned);
          if (camel && addIfExists(camel)) continue;

          // plain lowercase
          if (addIfExists(cleaned.toLowerCase())) continue;

          // check if token contains known words that map to fields
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
          // detect sem/GPA mentions like sem4 or gpa4
          const m = low.match(/(?:sem|gpa)\s*\-?\s*(\d)/);
          if (m) {
            const n = Number(m[1]);
            if (n >= 4 && n <= 8) addIfExists(`gpaSem${n}`);
          }
        }
      } catch (e) {
        // non-fatal
      }

      // remove intent tokens and known field-alias tokens to derive name guess
      let nameOnly = segLow;
      for (const arr of Object.values(intents)) {
        for (const token of arr) {
          nameOnly = nameOnly.replace(new RegExp(token, "gi"), "").trim();
        }
      }
      // also remove tokens from fieldAliases so words like "father" or "aadhar" are stripped
      for (const arr of Object.values((() => {
        // build fieldAliases inline to avoid hoisting issues
        return {
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
          dob: ["dob", "date of birth", "birthdate", "d.o.b"],
          regNo: ["reg", "reg no", "registration", "roll", "roll no", "regno"],
          resumeUrl: ["resume", "cv", "curriculum vitae", "resume link"],
          knownTechStack: ["skills", "known tech stack", "tech stack", "technologies", "stack"],
          placement: ["placement", "placed", "offer", "company", "company offer", "package"],
          coeName: ["coe", "center of excellence", "coe name", "projects"],
          isHosteller: ["hostel", "hosteller", "residency", "home", "day scholar", "dayscholar"],
        };
      })())) {
        for (const token of arr) {
          nameOnly = nameOnly.replace(new RegExp(token, "gi"), "").trim();
        }
      }

      const matchByRegLocal = (s: StudentRecord) => s.regNo.toLowerCase() === segLow || s.regNo.toLowerCase() === seg.toLowerCase();

      let matches: StudentRecord[] = students.filter((s) => matchByRegLocal(s));

      // Exact/substring matching
      if (matches.length === 0) {
        const guess = nameOnly || segLow;
        matches = students.filter((s) => {
          const n = s.name.toLowerCase();
          return n === guess || n.startsWith(guess) || n.includes(guess);
        });
      }

      // Fuzzy matching: consider name, regNo and email similarity; return top matches when above threshold
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

        // Confidence policy:
        // - < 0.30: treat as not found (very unlikely)
        // - 0.30..0.60: low confidence (show best matches but mark as lowConfidence)
        // - > 0.60: high confidence, show matches normally
        if (maxScore < 0.3) {
          notFound = true;
        } else {
          const threshold = maxScore >= 0.6 ? 0.35 : 0.25; // allow wider net when low max
          const scored = scoredAllSorted.filter((x) => x.score >= threshold);
          if (scored.length > 0) {
            // take top 5 fuzzy matches
            matches = scored.slice(0, 5).map((x) => x.s);
            const scores = scored.slice(0, 5).map((x) => x.score);
            const confidence = maxScore;
            const lowConfidence = confidence < 0.6;
            // push item with confidence metadata
            items.push({ students: matches, fields, query: seg, notFound: false, lowConfidence, confidence, scores });
            // skip the default push below
            continue;
          } else {
            notFound = true;
          }
        }
      }

        // If this segment produced no student matches but did identify fields,
        // and there is a previous item in the same semicolon-group, treat this as additional fields for the previous student.
        if ((matches.length === 0 || notFound) && fields && fields.length > 0 && groupItems.length > 0) {
          const prev = groupItems[groupItems.length - 1];
          prev.fields = Array.from(new Set([...(prev.fields || []), ...fields]));
          // Merge query text for clarity
          prev.query = `${prev.query}, ${seg}`;
          continue;
        }

        // default push (exact/substring matches or explicit notFound) into group-specific items
        groupItems.push({ students: matches, fields, query: seg, notFound });
      }

      // append processed items from this semicolon-group to overall items in order
      items.push(...groupItems);
    }

    setNlpResult({ items });
  };

  const startEditing = (regNo: string, key: string, currentVal: any) => {
    setNlpEdits((p) => ({ ...(p || {}), [regNo]: { ...((p || {})[regNo] || {}), [key]: currentVal } }));
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

    // collect unique regNos from this item
    const regNos = Array.from(new Set(item.students.map((s) => s.regNo)));
    const results: any[] = [];
    for (const reg of regNos) {
      const edits = (nlpEdits || {})[reg];
      if (!edits || Object.keys(edits).length === 0) continue;
      // call backend update
      try {
        const res = await updateStudentByRegNo(reg, edits);
        if (res && res.success && res.data) {
          // update local students state by remapping returned row
          try {
            const mapped = mapStudentRowToRecord(res.data as any);
            setStudents((prev) => prev.map((s) => (s.regNo === mapped.regNo ? { ...s, ...mapped } : s)));
          } catch (e) {
            console.warn("mapping after save failed", e);
          }
          // clear edits for this reg
          clearEditsFor(reg);
        }
        results.push({ reg, ok: true });
      } catch (e) {
        console.warn("saveEdits failed for", reg, e);
        results.push({ reg, ok: false, error: e });
      }
    }

    // refresh NLP result to reflect updated values
    setNlpResult((p) => ({ ...(p || {}), items: p?.items || [] }));
    return results;
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

  const labelToKey = (label: string) => {
    const map: Record<string, string> = {
      "REG NO": "regNo",
      NAME: "name",
      DEPT: "dept",
      YEAR: "year",
      SECTION: "section",
      GENDER: "gender",
      "MOBILE NO": "mobile",
      "ALT MOBILE NO": "altMobile",
      "OFFICIAL MAIL": "officialEmail",
      EMAIL: "personalEmail",
      "CURRENT ADDRESS": "currentAddress",
      "PERMANENT ADDRESS": "permanentAddress",
      PINCODE: "pincode",
      STATE: "state",
      "AADHAR NO": "aadhar",
      "PAN NO": "pan",
      "FATHER NAME": "fatherName",
      "MOTHER NAME": "motherName",
      "10TH BOARD %": "tenthPercentage",
      "12TH BOARD %": "twelfthPercentage",
      "10TH YEAR": "tenthYear",
      "12TH YEAR": "twelfthYear",
      "CGPA (3 sem)": "cgpaOverall",
      "RESIDENCY STATUS": "isHosteller",
      "GITHUB ID": "github",
      LINKEDIN: "linkedin",
      "RESUME LINK": "resumeUrl",
      "GUARDIAN NAME": "guardianName",
      "DIPLOMA YEAR": "diplomaYear",
      "DIPLOMA %": "diplomaPercentage",
      "GPA SEM4": "gpaSem4",
      "GPA SEM5": "gpaSem5",
      "GPA SEM6": "gpaSem6",
      "GPA SEM7": "gpaSem7",
      "GPA SEM8": "gpaSem8",
      "SKILL RACK ID": "skillrackId",
      "INTERNSHIP COMPANY NAME": "internshipCompany",
      "INTERNSHIP OFFER LETTER LINK": "internshipOfferLink",
      "COMPANY/OFFER": "internshipCompany",
    };
    return map[label] || label.replace(/[^a-z0-9]/gi, "").toLowerCase();
  };

  const clearSelections = () => {
    setSelectedFields([]);
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
                  placeholder="Type In Query"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-violet-400 transition-all"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setNlpQuery(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      processNlpQuery((e.target as HTMLInputElement).value);
                    }
                  }}
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
              {/* Sort buttons removed per request */}
            </div>

              {/* Render NLP result cards when present */}
              {nlpResult && nlpResult.items && nlpResult.items.length > 0 && (
                <div className="px-4">
                  {nlpResult.items.map((item, idx) => {
                    // Check if this is a section performance result
                    let sectionPerformanceData: { type: string; summary: any; topStudents: any[] } | null = null;
                    try {
                      if (item.suggestion && typeof item.suggestion === 'string' && item.suggestion.includes('sectionPerformance')) {
                        sectionPerformanceData = JSON.parse(item.suggestion);
                      }
                    } catch (e) {}

                    if (sectionPerformanceData && sectionPerformanceData.type === 'sectionPerformance') {
                      const summary = sectionPerformanceData.summary;
                      const topStudents = sectionPerformanceData.topStudents;
                      return (
                        <div key={idx} className="mb-4">
                          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <div className="text-sm font-extrabold text-slate-900">Section {summary.section} Performance</div>
                                <div className="text-[11px] text-slate-400">{summary.studentCount} students • CGPA + Competitive Coding</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const headers = ['Rank', 'Reg No', 'Name', 'CGPA', 'LC Total', 'LC Easy', 'LC Med', 'LC Hard', 'LC Rating', 'LC Badges', 'CC Total', 'CC Rating', 'CC Badges', 'SR Problems', 'Composite'];
                                    const rows = topStudents.map((s: any) => [
                                      s.rank, s.regNo, s.name, s.cgpa, s.lcTotal, s.lcEasy, s.lcMed, s.lcHard, s.lcRating, s.lcBadges, s.ccTotal, s.ccRating, s.ccBadges, s.srProblems, s.composite
                                    ].map(String));
                                    downloadCsv(`section-${summary.section}-performance.csv`, headers, rows);
                                  }}
                                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-black"
                                >
                                  Download CSV
                                </button>
                                <button onClick={() => setNlpResult(null)} className="px-3 py-1.5 border border-slate-200 bg-white text-slate-700 rounded-lg text-[11px] font-black">Close</button>
                              </div>
                            </div>

                            {/* Section Summary Card */}
                            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl p-4 mb-4">
                              <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">Section Averages</div>
                              <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                                <div className="text-center">
                                  <div className="text-lg font-black text-indigo-700">{summary.avgCgpa}</div>
                                  <div className="text-[9px] text-slate-500">CGPA</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-black text-amber-600">{summary.avgLcTotal}</div>
                                  <div className="text-[9px] text-slate-500">LC Total</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-black text-red-600">{summary.avgLcHard}</div>
                                  <div className="text-[9px] text-slate-500">LC Hard</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-black text-amber-700">{summary.avgLcRating}</div>
                                  <div className="text-[9px] text-slate-500">LC Rating</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-black text-orange-600">{summary.avgCcTotal}</div>
                                  <div className="text-[9px] text-slate-500">CC Total</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-black text-orange-700">{summary.avgCcRating}</div>
                                  <div className="text-[9px] text-slate-500">CC Rating</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-black text-teal-600">{summary.avgSrProblems}</div>
                                  <div className="text-[9px] text-slate-500">SR Problems</div>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="text-xl font-black text-violet-700">{summary.compositeScore}</div>
                                  <div className="text-[9px] text-slate-500">Composite Score</div>
                                </div>
                              </div>
                            </div>

                            {/* Top 10 Students Table */}
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Top 10 Performers</div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="text-[9px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50">
                                    <th className="px-2 py-2">Rank</th>
                                    <th className="px-2 py-2">Reg No</th>
                                    <th className="px-2 py-2">Name</th>
                                    <th className="px-2 py-2 bg-indigo-50 text-indigo-700">CGPA</th>
                                    <th className="px-2 py-2 bg-amber-50 text-amber-700">LC Total</th>
                                    <th className="px-2 py-2 bg-amber-50 text-amber-700">LC Hard</th>
                                    <th className="px-2 py-2 bg-amber-50 text-amber-700">LC Rating</th>
                                    <th className="px-2 py-2 bg-orange-50 text-orange-700">CC Total</th>
                                    <th className="px-2 py-2 bg-orange-50 text-orange-700">CC Rating</th>
                                    <th className="px-2 py-2 bg-teal-50 text-teal-700">SR Problems</th>
                                    <th className="px-2 py-2 bg-violet-50 text-violet-700">Composite</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {topStudents.map((st: any, ridx: number) => {
                                    const isTop3 = ridx < 3;
                                    return (
                                      <tr key={st.regNo} className={`hover:bg-slate-50 ${isTop3 ? 'bg-emerald-50/30' : ''}`}>
                                        <td className="px-2 py-2 text-[11px] font-black text-slate-400">
                                          {st.rank === 1 && <span className="text-amber-500">🥇</span>}
                                          {st.rank === 2 && <span className="text-slate-400">🥈</span>}
                                          {st.rank === 3 && <span className="text-orange-400">🥉</span>}
                                          {st.rank > 3 && st.rank}
                                        </td>
                                        <td className="px-2 py-2 text-[11px] font-bold text-slate-600">{st.regNo}</td>
                                        <td className="px-2 py-2 text-[11px] font-bold text-slate-900">{st.name}</td>
                                        <td className="px-2 py-2 text-[11px] font-black text-indigo-700">{st.cgpa}</td>
                                        <td className="px-2 py-2 text-[11px] font-bold text-amber-700">{st.lcTotal}</td>
                                        <td className="px-2 py-2 text-[11px] font-bold text-red-600">{st.lcHard}</td>
                                        <td className="px-2 py-2 text-[11px] font-bold text-amber-700">{st.lcRating}</td>
                                        <td className="px-2 py-2 text-[11px] font-bold text-orange-700">{st.ccTotal}</td>
                                        <td className="px-2 py-2 text-[11px] font-bold text-orange-700">{st.ccRating}</td>
                                        <td className="px-2 py-2 text-[11px] font-bold text-teal-700">{st.srProblems}</td>
                                        <td className="px-2 py-2 text-[11px] font-black text-violet-700">{st.composite}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                              <span className="font-bold">Composite Score:</span> CGPA (30%) + LeetCode (40%) + CodeChef (20%) + SkillRack (10%)
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                    <div key={idx} className="mb-4">
                      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                          <div className="flex items-center justify-between">
                          <div>
                            {item.notFound ? (
                              <div>
                                <div className="text-sm font-extrabold text-rose-600">No matching student</div>
                                <div className="text-[11px] text-rose-500">Query: {item.query}</div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-3">
                                  <div className="text-sm font-extrabold text-slate-900">{item.students.length === 1 ? item.students[0].name : `${item.students.length} matches`}</div>
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
                              <button onClick={() => { setSelectedStudent(item.students[0]); setNlpResult(null); }} className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-[11px] font-black">View</button>
                            ) : null}
                            <button onClick={() => { setNlpResult(null); }} className="px-3 py-1.5 border border-slate-200 bg-white text-slate-700 rounded-lg text-[11px] font-black">Cancel</button>
                          </div>
                        </div>

                          <div className="mt-3">
                            {/* Save button for edits in this NLP item */}
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
                            const s = ((item.students && item.students[0]) as any) || {};

                            // If this item is a top-N request, render a compact leaderboard table
                            const isTopRequest = typeof item.query === 'string' && /\btop\b/i.test(item.query) && Array.isArray(item.students) && item.students.length > 0;
                            const numericFieldSet = new Set(['lcTotal','ccTotal','lcRating','ccRating','srProblems','cgpaOverall','gpaSem1','gpaSem2','gpaSem3','lcEasy','lcMed','lcHard']);
                            const hasNumericFields = Array.isArray(item.fields) && item.fields.some((f) => numericFieldSet.has(f));
                            const shouldRenderTable = isTopRequest || (Array.isArray(item.students) && item.students.length > 1 && (item.confidence === 1 || hasNumericFields));

                            if (shouldRenderTable) {
                              const cols = [
                                { key: '__sno', label: 'S.No' },
                                { key: 'regNo', label: 'Reg No' },
                                { key: 'name', label: 'Name' },
                                // additional platform fields from item.fields
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

                            const groups: { title: string; items: { title: string; key: string }[] }[] = [
                              { title: 'Identification', items: [
                                  { title: 'Name', key: 'name' },
                                  { title: 'Reg No', key: 'regNo' },
                                  { title: 'Dept', key: 'dept' },
                                  { title: 'Year', key: 'year' },
                                  { title: 'Section', key: 'section' },
                                  { title: 'Father Name', key: 'fatherName' },
                                  { title: 'Mother Name', key: 'motherName' },
                                  { title: 'Guardian Name', key: 'guardianName' },
                                  { title: 'DOB', key: 'dob' },
                                ]
                              },
                              { title: 'Contact', items: [
                                  { title: 'Mobile', key: 'mobile' },
                                  { title: 'Alt Mobile', key: 'altMobile' },
                                  { title: 'Official Email', key: 'officialEmail' },
                                  { title: 'Personal Email', key: 'personalEmail' },
                                ]
                              },
                              { title: 'Residence', items: [
                                  { title: 'Residency', key: 'isHosteller' },
                                  { title: 'Dayscholar/Hosteller', key: 'isHosteller' },
                                ]
                              },
                              { title: 'Address', items: [
                                  { title: 'Current Address', key: 'currentAddress' },
                                  { title: 'Permanent Address', key: 'permanentAddress' },
                                  { title: 'Pincode', key: 'pincode' },
                                  { title: 'State', key: 'state' },
                                ]
                              },
                              { title: 'IDs & Documents', items: [
                                  { title: 'Aadhar', key: 'aadhar' },
                                  { title: 'PAN', key: 'pan' },
                                  { title: 'Resume', key: 'resumeUrl' },
                                ]
                              },
                              { title: 'Academics', items: [
                                  { title: '10th %', key: 'tenthPercentage' },
                                  { title: '10th Year', key: 'tenthYear' },
                                  { title: '12th %', key: 'twelfthPercentage' },
                                  { title: '12th Year', key: 'twelfthYear' },
                                  { title: 'CGPA', key: 'cgpaOverall' },
                                  { title: 'GPA Sem1', key: 'gpaSem1' },
                                  { title: 'GPA Sem2', key: 'gpaSem2' },
                                  { title: 'GPA Sem3', key: 'gpaSem3' },
                                  { title: 'GPA Sem4', key: 'gpaSem4' },
                                  { title: 'GPA Sem5', key: 'gpaSem5' },
                                  { title: 'GPA Sem6', key: 'gpaSem6' },
                                  { title: 'GPA Sem7', key: 'gpaSem7' },
                                  { title: 'GPA Sem8', key: 'gpaSem8' },
                                  { title: 'Diploma Year', key: 'diplomaYear' },
                                  { title: 'Diploma %', key: 'diplomaPercentage' },
                                ]
                              },
                              { title: 'LeetCode', items: [
                                  { title: 'LeetCode ID', key: 'leetcodeId' },
                                  { title: 'LC Total', key: 'lcTotal' },
                                  { title: 'LC Easy', key: 'lcEasy' },
                                  { title: 'LC Med', key: 'lcMed' },
                                  { title: 'LC Hard', key: 'lcHard' },
                                  { title: 'LC Rating', key: 'lcRating' },
                                  { title: 'LC Badges', key: 'lcBadges' },
                                  { title: 'LC Max', key: 'lcMax' },
                                ]
                              },
                              { title: 'CodeChef', items: [
                                  { title: 'CodeChef ID', key: 'codechefId' },
                                  { title: 'CC Total', key: 'ccTotal' },
                                  { title: 'CC Rank', key: 'ccRank' },
                                  { title: 'CC Rating', key: 'ccRating' },
                                  { title: 'CC Badges', key: 'ccBadges' },
                                ]
                              },
                              { title: 'SkillRack', items: [
                                  { title: 'SR Problems', key: 'srProblems' },
                                  { title: 'SR Rank', key: 'srRank' },
                                  { title: 'SkillRack ID', key: 'skillrackId' },
                                ]
                              },
                              { title: 'Social & Professional', items: [
                                  { title: 'GitHub', key: 'github' },
                                  { title: 'LinkedIn', key: 'linkedin' },
                                  { title: 'Known Tech Stack', key: 'knownTechStack' },
                                ]
                              },
                              { title: 'Placement & COE', items: [
                                  { title: 'Placement', key: 'placement' },
                                  { title: 'Internship Company', key: 'internshipCompany' },
                                  { title: 'Internship Offer Link', key: 'internshipOfferLink' },
                                  { title: 'COE Name', key: 'coeName' },
                                ]
                              },
                            ];

                            // compute remaining keys that are not in groups
                            const groupedKeys = new Set<string>();
                            groups.forEach((g) => g.items.forEach((it) => groupedKeys.add(it.key)));
                            // If the NLP segment requested specific fields, show only those; else show all
                            const requestedFields = item.fields && item.fields.length > 0 ? new Set(item.fields) : null;
                            const remaining = requestedFields
                              ? Array.from(requestedFields).filter((k) => !groupedKeys.has(k))
                              : Object.keys(s).filter((k) => k !== 'id' && !groupedKeys.has(k));

                            // subtle palette for groups — light pastel badges and gentle accents
                            const palette = [
                              { badge: 'bg-blue-100 text-blue-800', accent: 'border-l-4 border-blue-300' },
                              { badge: 'bg-green-100 text-green-800', accent: 'border-l-4 border-green-300' },
                              { badge: 'bg-indigo-100 text-indigo-800', accent: 'border-l-4 border-indigo-300' },
                              { badge: 'bg-rose-100 text-rose-800', accent: 'border-l-4 border-rose-300' },
                              { badge: 'bg-amber-100 text-amber-800', accent: 'border-l-4 border-amber-300' },
                              { badge: 'bg-sky-100 text-sky-800', accent: 'border-l-4 border-sky-300' },
                              { badge: 'bg-purple-100 text-purple-800', accent: 'border-l-4 border-purple-300' },
                              { badge: 'bg-teal-100 text-teal-800', accent: 'border-l-4 border-teal-300' },
                              { badge: 'bg-fuchsia-100 text-fuchsia-800', accent: 'border-l-4 border-fuchsia-300' },
                            ];

                            return (
                              <div className="space-y-3">
                                {groups.map((g, gi) => {
                                  // build values for this group
                                  let values = g.items.map((it) => ({ title: it.title, key: it.key, val: s[it.key] }));
                                  // if specific fields requested, filter group items to requested ones
                                  if (requestedFields) {
                                    values = values.filter((v) => requestedFields.has(v.key));
                                  }
                                  let hasAny = false;
                                  if (requestedFields) {
                                    hasAny = values.some((v) => requestedFields.has(v.key) || (v.val !== undefined && v.val !== null && v.val !== ''));
                                  } else {
                                    // show group if any value exists OR if group contains DOB (show '-' when DOB missing)
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
                                    </div>
                                  );
                                })}

                                {remaining.length > 0 && (
                                  <div>
                                    <div className="bg-slate-100 text-slate-700 inline-block rounded-md px-3 py-1 text-[11px] font-black uppercase tracking-wider mb-2">Other</div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                                      {remaining.map((k) => (
                                        <div key={k}>{renderCard(String(k).replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toUpperCase(), s[k], 'border-l-4 border-slate-200')}</div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {item.students.length > 1 && (
                          <div className="mt-3 border-t pt-3">
                            <div className="text-[11px] font-black text-slate-500 mb-2">Matches</div>
                            <div className="divide-y divide-slate-100 rounded-xl overflow-hidden">
                              {item.students.map((s) => (
                                <div key={s.regNo} className="flex items-center justify-between gap-4 p-3 hover:bg-slate-50">
                                  <div>
                                    <div className="text-sm font-extrabold text-slate-900">{s.name}</div>
                                    <div className="text-[11px] text-slate-400">{s.regNo} • {s.section} • {s.dept}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => { setSelectedStudent(s); setNlpResult(null); }} className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-[11px] font-black">View</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}

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
                label="EXPORT CSV"
                icon="📊"
                sub="Download Data"
                color="bg-emerald-600"
                onClick={() => {
                  setExportSelectedFields([]);
                  setExportModalOpen(true);
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

              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase text-center w-full break-words px-2 mb-1 leading-tight">
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
                  <AiryModalHeader title="Details" icon="🧬" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                    <AiryDataItem
                      label="Gender"
                      value={selectedStudent.gender === "F" ? "Female" : "Male"}
                    />
                    <AiryDataItem
                      label="Dept"
                      value={selectedStudent.dept}
                    />
                    <AiryDataItem
                      label="Year"
                      value={selectedStudent.year || "-"}
                    />
                    <AiryDataItem
                      label="Section"
                      value={selectedStudent.section}
                    />
                    <AiryDataItem
                      label="Aadhar Identity"
                      value={selectedStudent.aadhar}
                      highlight
                    />
                    <AiryDataItem
                      label="PAN No."
                      value={selectedStudent.pan}
                      highlight
                    />
                    <AiryDataItem
                      label="Father Name"
                      value={selectedStudent.fatherName}
                    />
                    <AiryDataItem
                      label="Mother Name"
                      value={selectedStudent.motherName}
                    />
                  </div>
                </section>

                <section>
                  <AiryModalHeader title="Contact Detials" icon="📡" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                    <div className="space-y-4">
                      <AiryDataItem
                        label="College Mail"
                        value={selectedStudent.officialEmail}
                        editable={activeUpdationFields.includes(
                          "OFFICIAL MAIL"
                        )}
                        editValue={
                          editedStudent?.officialEmail ??
                          selectedStudent.officialEmail
                        }
                        onEdit={(v: any) =>
                          setEditedStudent((p) => ({
                            ...(p || selectedStudent),
                            officialEmail: v,
                          }))
                        }
                      />
                      <AiryDataItem
                        label="Personal Mail"
                        value={selectedStudent.personalEmail}
                      />
                    </div>
                    <div className="space-y-4">
                      <AiryDataItem
                        label="Primary Contact"
                        value={selectedStudent.mobile}
                        highlight
                        editable={activeUpdationFields.includes("MOBILE NO")}
                        editValue={
                          editedStudent?.mobile ?? selectedStudent.mobile
                        }
                        onEdit={(v: any) =>
                          setEditedStudent((p) => ({
                            ...(p || selectedStudent),
                            mobile: v,
                          }))
                        }
                      />
                      <AiryDataItem
                        label="Emergency Contact"
                        value={selectedStudent.altMobile}
                        editable={activeUpdationFields.includes(
                          "ALT MOBILE NO"
                        )}
                        editValue={
                          editedStudent?.altMobile ?? selectedStudent.altMobile
                        }
                        onEdit={(v: any) =>
                          setEditedStudent((p) => ({
                            ...(p || selectedStudent),
                            altMobile: v,
                          }))
                        }
                      />
                    </div>
                  </div>
                </section>

                <section className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                  <AiryModalHeader title="Performance" icon="📈" />
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-6">
                    <div className="col-span-2 md:col-span-1">
                      <AiryDataItem
                        label="CGPA"
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
                  <AiryModalHeader title="Competitive Coding" icon="⚔️" />
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
                    <AiryModalHeader title="Professional Details" icon="💼" />
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
                    <AiryModalHeader title="COE" icon="🏛️" />
                    <div className="mt-6 space-y-4">
                      <AiryDataItem
                        label="COE Name"
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
                      label="Current Address"
                      value={selectedStudent.currentAddress}
                    />
                    <AiryDataItem
                      label="Permanent Address"
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
                      UPDATE FIELDS
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
              {/* Group fields by category */}
              {(() => {
                const groupedFields: Record<
                  string,
                  typeof organizedRegistryFields
                > = {};
                organizedRegistryFields.forEach((field) => {
                  if (!groupedFields[field.cat]) groupedFields[field.cat] = [];
                  groupedFields[field.cat].push(field);
                });

                return Object.entries(groupedFields).map(
                  ([category, fields]) => (
                    <div key={category} className="mb-6">
                      <div className="flex items-center gap-2 mb-3 sticky top-0 bg-white py-2 z-10">
                        <span className="text-lg">
                          {category.split(" ")[0]}
                        </span>
                        <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                          {category.split(" ").slice(1).join(" ")}
                        </h4>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          {fields.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {fields.map((field) => (
                          <label
                            key={field.id}
                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border-2 ${
                              selectedFields.includes(field.id)
                                ? "bg-violet-50 border-violet-300 shadow-sm"
                                : "bg-slate-50 border-transparent hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedFields.includes(field.id)}
                                onChange={() => toggleFieldSelection(field.id)}
                                className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500/20"
                              />
                              <span
                                className={`text-[11px] font-black uppercase ${
                                  selectedFields.includes(field.id)
                                    ? "text-violet-600"
                                    : "text-slate-700"
                                }`}
                              >
                                {field.label}
                              </span>
                            </div>
                            {field.raw && (
                              <span className="text-[8px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                {field.raw}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                );
              })()}
            </div>
            <div className="mt-10 flex gap-4">
              <button
                onClick={async () => {
                  // Persist selection to backend for this section
                  if (!user || !sectionName) {
                    setUpdationModalOpen(false);
                    return;
                  }

                  // map selectedFields ids -> labels using organizedRegistryFields
                  const labels = organizedRegistryFields
                    .filter((f) => selectedFields.includes(f.id))
                    .map((f) => f.label);

                  const res = await setNeedsUpdation(
                    sectionName === "ALL" ? "" : sectionName,
                    labels
                  );
                  if (res && res.success) {
                    setActiveUpdationFields(labels);
                    // best-effort: broadcast a notification to students in this section
                    try {
                      await broadcastNeedsUpdation(
                        sectionName === "ALL" ? "" : sectionName,
                        labels
                      );
                    } catch (e) {
                      console.warn("broadcastNeedsUpdation failed:", e);
                    }
                    
                    // Fetch pending students after broadcast to update the UI
                    const pendingResult = await fetchStudentsWithPendingUpdates(
                      sectionName === "ALL" ? "" : sectionName
                    );
                    setPendingStudents(pendingResult.students || []);
                    setPendingStudentsTotal(pendingResult.totalStudents || 0);
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

      {/* Cancel active updation (admin action) - show current fields above cancel button */}
      {activeUpdationFields.length > 0 && (
        <div className="fixed bottom-6 right-6 max-w-md z-[100]">
          <div className="bg-white rounded-2xl shadow-2xl border border-indigo-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest">
                    Active Update Request
                  </h4>
                </div>
                <button
                  onClick={async () => {
                    // Refresh pending students
                    const result = await fetchStudentsWithPendingUpdates(
                      sectionName === "ALL" ? "" : sectionName
                    );
                    setPendingStudents(result.students || []);
                    setPendingStudentsTotal(result.totalStudents || 0);
                    if (result.allComplete && result.totalStudents > 0) {
                      const clearResult = await checkAndAutoClearUpdates(
                        sectionName === "ALL" ? "" : sectionName
                      );
                      if (clearResult.cleared) {
                        setActiveUpdationFields([]);
                        setPendingStudents([]);
                      }
                    }
                  }}
                  className="text-white/80 hover:text-white text-[9px] font-bold"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                Fields requiring update ({activeUpdationFields.length})
              </p>
              <div
                className="flex flex-wrap gap-2 mb-4"
                style={{ maxWidth: "320px" }}
              >
                {activeUpdationFields.map((field, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded-lg border border-indigo-100"
                    style={{ wordBreak: "break-word" }}
                  >
                    {field}
                  </span>
                ))}
              </div>

              {/* Pending students indicator */}
              <button
                onClick={() => setShowPendingList(true)}
                className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 w-full text-left hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      Update Status
                    </span>
                    {
                      (() => {
                        const total = (pendingStudentsTotal && pendingStudentsTotal > 0) ? pendingStudentsTotal : (students.length || 0);
                        let completed = 0;
                        if ((pendingStudentsTotal === 0 || !pendingStudentsTotal) && (!pendingStudents || pendingStudents.length === 0)) {
                          completed = 0;
                        } else {
                          completed = Math.max(0, total - (pendingStudents?.length || 0));
                        }
                        const badgeClass = (pendingStudents && pendingStudents.length === 0) ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600';
                        return (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${badgeClass}`}>
                            {completed} / {total} done
                          </span>
                        );
                      })()
                    }
                  </div>
                {pendingStudents.length > 0 && (
                  <div className="w-full py-2 bg-amber-500 text-white rounded-lg font-black text-[9px] uppercase tracking-widest text-center">
                    View {pendingStudents.length} Pending Student
                    {pendingStudents.length > 1 ? "s" : ""}
                  </div>
                )}
                {pendingStudents.length === 0 && pendingStudentsTotal > 0 && (
                  <p className="text-[10px] text-emerald-600 font-bold text-center">
                    ✓ All students have updated!
                  </p>
                )}
              </button>

              <button
                onClick={async () => {
                  if (!sectionName) return;
                  const res = await clearNeedsUpdation(
                    sectionName === "ALL" ? "" : sectionName
                  );
                  if (res && res.success) {
                    setActiveUpdationFields([]);
                    setPendingStudents([]);
                  }
                }}
                className="w-full py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-rose-700 active:scale-95 transition-all"
              >
                Cancel Active Updation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Students Modal */}
      {showPendingList && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
            onClick={() => setShowPendingList(false)}
          ></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2rem] shadow-3xl max-h-[85vh] flex flex-col animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 rounded-t-[2rem]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase">
                      Pending Updates
                    </h3>
                    <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                      {pendingStudents.length} of {pendingStudentsTotal}{" "}
                      students have not updated
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPendingList(false)}
                  className="text-white/70 hover:text-white"
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
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {pendingStudents.map((student, idx) => (
                <div
                  key={student.reg_no || idx}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {student.name || "Unknown"}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {student.reg_no}
                      </p>
                    </div>
                    <span className="text-[9px] font-black px-2 py-1 bg-rose-100 text-rose-600 rounded-lg">
                      {student.completedCount || 0} /{" "}
                      {student.totalRequired || 0} fields
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(student.missingFields || []).map(
                      (field: string, fidx: number) => (
                        <span
                          key={fidx}
                          className="px-2 py-0.5 bg-rose-50 text-rose-500 text-[8px] font-bold uppercase rounded border border-rose-100"
                          style={{ wordBreak: "break-word" }}
                        >
                          {field}
                        </span>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100">
              <button
                onClick={() => setShowPendingList(false)}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export CSV Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
            onClick={() => setExportModalOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] p-10 shadow-3xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-black">
                  📊
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase text-slate-900 leading-none">
                    Export Student Data
                  </h3>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1">
                    Select fields to include in the CSV export
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExportModalOpen(false)}
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
              {/* Default fields notice */}
              <div className="mb-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">
                  Always Included (Default Fields)
                </p>
                <div className="flex flex-wrap gap-2">
                  {["REGNO", "NAME", "DEPT", "YEAR", "SECTION"].map(field => (
                    <span key={field} className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold">
                      {field}
                    </span>
                  ))}
                </div>
              </div>

              {/* Select All / Deselect All buttons */}
              {(() => {
                const defaultFieldsSet = new Set(["REGNO", "NAME", "DEPT", "YEAR", "SECTION"]);
                const filterableFields = organizedRegistryFields.filter(
                  f => !defaultFieldsSet.has((f.raw || f.label).toUpperCase())
                );
                return (
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={() => setExportSelectedFields(filterableFields.map(f => f.id))}
                      className="px-4 py-2 bg-emerald-100 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-200 transition-all"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setExportSelectedFields([])}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Deselect All
                    </button>
                    <span className="ml-auto text-[10px] font-bold text-slate-500 self-center">
                      {exportSelectedFields.length} additional fields selected
                    </span>
                  </div>
                );
              })()}

              {/* Group fields by category */}
              {(() => {
                // Fields that are always included and should not appear in checklist
                const defaultFields = new Set(["REGNO", "NAME", "DEPT", "YEAR", "SECTION"]);
                const filterableFields = organizedRegistryFields.filter(
                  f => !defaultFields.has((f.raw || f.label).toUpperCase())
                );
                
                const groupedFields: Record<string, typeof organizedRegistryFields> = {};
                filterableFields.forEach((field) => {
                  if (!groupedFields[field.cat]) groupedFields[field.cat] = [];
                  groupedFields[field.cat].push(field);
                });

                return Object.entries(groupedFields).map(([category, fields]) => (
                  <div key={category} className="mb-6">
                    <div className="flex items-center gap-2 mb-3 sticky top-0 bg-white py-2 z-10">
                      <span className="text-lg">{category.split(" ")[0]}</span>
                      <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                        {category.split(" ").slice(1).join(" ")}
                      </h4>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {fields.length}
                      </span>
                      <button
                        onClick={() => {
                          const fieldIds = fields.map(f => f.id);
                          const allSelected = fieldIds.every(id => exportSelectedFields.includes(id));
                          if (allSelected) {
                            setExportSelectedFields(prev => prev.filter(id => !fieldIds.includes(id)));
                          } else {
                            setExportSelectedFields(prev => [...new Set([...prev, ...fieldIds])]);
                          }
                        }}
                        className="ml-auto text-[8px] font-bold text-emerald-600 hover:text-emerald-700 uppercase"
                      >
                        {fields.every(f => exportSelectedFields.includes(f.id)) ? 'Deselect Category' : 'Select Category'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {fields.map((field) => (
                        <label
                          key={field.id}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border-2 ${
                            exportSelectedFields.includes(field.id)
                              ? "bg-emerald-50 border-emerald-300 shadow-sm"
                              : "bg-slate-50 border-transparent hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={exportSelectedFields.includes(field.id)}
                              onChange={() => {
                                setExportSelectedFields(prev =>
                                  prev.includes(field.id)
                                    ? prev.filter(id => id !== field.id)
                                    : [...prev, field.id]
                                );
                              }}
                              className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                            />
                            <span
                              className={`text-[11px] font-black uppercase ${
                                exportSelectedFields.includes(field.id)
                                  ? "text-emerald-600"
                                  : "text-slate-700"
                              }`}
                            >
                              {field.label}
                            </span>
                          </div>
                          {field.raw && (
                            <span className="text-[8px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                              {field.raw}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
            <div className="mt-10 flex gap-4">
              <button
                onClick={() => {
                  // Mapping from database column names to StudentRecord property names
                  const dbToPropertyMap: Record<string, string> = {
                    "REGNO": "regNo",
                    "NAME": "name",
                    "DEPT": "dept",
                    "YEAR": "year",
                    "SECTION": "section",
                    "GENDER": "gender",
                    "MOBILE_NO": "mobile",
                    "ALT_MOBILE_NO": "altMobile",
                    "OFFICIAL_MAIL": "officialEmail",
                    "EMAIL": "personalEmail",
                    "CURRENT_ADDRESS": "currentAddress",
                    "PERMANENT_ADDRESS": "permanentAddress",
                    "PINCODE": "pincode",
                    "STATE": "state",
                    "AADHAR_NO": "aadhar",
                    "PAN_NO": "pan",
                    "FATHER_NAME": "fatherName",
                    "MOTHER_NAME": "motherName",
                    "10TH_BOARD_PCT": "tenthPercentage",
                    "12TH_BOARD_PCT": "twelfthPercentage",
                    "10TH_BOARD_YEAR": "tenthYear",
                    "12TH_BOARD_YEAR": "twelfthYear",
                    "GPA_SEM1": "gpaSem1",
                    "GPA_SEM2": "gpaSem2",
                    "GPA_SEM3": "gpaSem3",
                    "GPA_SEM4": "gpaSem4",
                    "GPA_SEM5": "gpaSem5",
                    "GPA_SEM6": "gpaSem6",
                    "GPA_SEM7": "gpaSem7",
                    "GPA_SEM8": "gpaSem8",
                    "CGPA": "cgpaOverall",
                    "KNOWN_TECH_STACK": "techStack",
                    "RESUME_LINK": "resumeUrl",
                    "WILLING_TO_RELOCATE": "relocate",
                    "PLACEMENT_HS": "placementStatus",
                    "LEETCODE_ID": "leetcodeId",
                    "LC_TOTAL_PROBLEMS": "lcTotal",
                    "LC_EASY": "lcEasy",
                    "LC_MEDIUM": "lcMed",
                    "LC_HARD": "lcHard",
                    "LC_RATING": "lcRating",
                    "LC_BADGES": "lcBadges",
                    "LC_MAX_RATING": "lcMax",
                    "CODECHEF_ID": "codechefId",
                    "CC_TOTAL_PROBLEMS": "ccTotal",
                    "CC_RANK": "ccRank",
                    "CC_BADGES": "ccBadges",
                    "CC_RATING": "ccRating",
                    "SKILLRACK_ID": "skillrackId",
                    "SR_PROBLEMS_SOLVED": "srProblems",
                    "SR_RANK": "srRank",
                    "GITHUB_ID": "github",
                    "GITHUB_LINK": "github",
                    "LINKEDIN_URL": "linkedin",
                    "COE_NAME": "coeName",
                    "COE_INCHARGE_NAME": "coeIncharge",
                    "COE_PROJECTS_DONE": "coeProjects",
                    "RESIDENCY_STATUS": "isHosteller",
                    "CODEFORCES_ID": "codeforcesId",
                    "CF_RATING": "cfRating",
                    "INTERNSHIP_COMPANY": "internshipCompany",
                    "INTERNSHIP_OFFER_LINK": "internshipOfferLink",
                  };
                  
                  // Default fields always included
                  const defaultRawFields = ["REGNO", "NAME", "DEPT", "YEAR", "SECTION"];
                  
                  // Get raw field names for selected additional fields
                  const additionalRawFields = organizedRegistryFields
                    .filter(f => exportSelectedFields.includes(f.id))
                    .map(f => f.raw || f.label);
                  
                  // Combine default + selected fields
                  const allFields = [...defaultRawFields, ...additionalRawFields];
                  
                  // Build CSV content
                  const headers = allFields.join(",");
                  const rows = students.map(student => {
                    return allFields.map(field => {
                      // Map database field name to StudentRecord property name
                      const propName = dbToPropertyMap[field] || field;
                      const value = (student as any)[propName] ?? "";
                      // Handle arrays (like techStack)
                      const displayValue = Array.isArray(value) ? value.join("; ") : value;
                      // Escape quotes and wrap in quotes if contains comma
                      const strValue = String(displayValue).replace(/"/g, '""');
                      return strValue.includes(",") || strValue.includes('"') || strValue.includes("\n")
                        ? `"${strValue}"`
                        : strValue;
                    }).join(",");
                  });
                  
                  const csvContent = [headers, ...rows].join("\n");
                  
                  // Create and download the file
                  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                  const link = document.createElement("a");
                  const url = URL.createObjectURL(blob);
                  link.setAttribute("href", url);
                  link.setAttribute("download", `students_${sectionName || 'all'}_${new Date().toISOString().split('T')[0]}.csv`);
                  link.style.visibility = "hidden";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  setExportModalOpen(false);
                }}
                className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 active:scale-95 transition-all"
              >
                Download CSV ({5 + exportSelectedFields.length} fields)
              </button>
              <button
                onClick={() => setExportModalOpen(false)}
                className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all"
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
          Rating
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
        } ${
          highlight ? "text-violet-600" : "text-slate-900"
        } p-2 border rounded-lg`}
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
