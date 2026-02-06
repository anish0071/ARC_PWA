import type { StudentRecord } from "../types";
import type { StudentRow } from "./arcData";

/**
 * Creates an empty StudentRecord with only basic identifying fields populated.
 * All other fields use empty/zero defaults—no mock or placeholder data.
 */
function createEmptyStudentRecord(
  regNo: string,
  name: string,
  section: string
): StudentRecord {
  const initials = name.trim() ? name.trim()[0].toUpperCase() : "";
  return {
    id: regNo || "",
    regNo: regNo || "",
    name: name || "",
    dept: "",
    year: "",
    section: section || "",
    gender: "",
    mobile: "",
    altMobile: "",
    officialEmail: "",
    personalEmail: "",
    currentAddress: "",
    permanentAddress: "",
    pincode: "",
    state: "",
    aadhar: "",
    pan: "",
    fatherName: "",
    motherName: "",
    tenthPercentage: 0,
    twelfthPercentage: 0,
    tenthYear: "",
    twelfthYear: "",
    gpaSem1: 0,
    gpaSem2: 0,
    gpaSem3: 0,
    cgpaOverall: 0,
    techStack: [],
    resumeUrl: "",
    relocate: "",
    category: "",
    placementStatus: "",
    leetcodeId: "",
    lcTotal: 0,
    lcEasy: 0,
    lcMed: 0,
    lcHard: 0,
    lcRating: 0,
    lcBadges: 0,
    lcMax: 0,
    codechefId: "",
    ccTotal: 0,
    ccRank: "",
    ccBadges: 0,
    ccRating: 0,
    srProblems: 0,
    srRank: "",
    github: "",
    linkedin: "",
    initials,
    coeName: "",
    coeIncharge: "",
    coeProjects: "",
    isHosteller: false,
    // new defaults
    gpaSem4: 0,
    gpaSem5: 0,
    gpaSem6: 0,
    gpaSem7: 0,
    gpaSem8: 0,
    skillrackId: "",
    guardianName: "",
    diplomaYear: "",
    diplomaPercentage: 0,
    internshipCompany: "",
    internshipOfferLink: "",
  };
}

export function mapStudentRowToRecord(row: StudentRow): StudentRecord {
  const safe = (v: any, fallback: any) =>
    v === null || v === undefined ? fallback : v;
  const base = createEmptyStudentRecord(
    safe(row.reg_no, ""),
    safe(row.name, ""),
    safe(row.section, "")
  );

  const toNum = (v: any, fallback = 0) => {
    if (v === null || v === undefined || v === "") return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const toStr = (v: any, fallback = "") =>
    v === null || v === undefined ? fallback : String(v);

  // permissive alias for raw DB row to access alternate column names without strict typing
  const r: any = row;

  const toBool = (v: any, fallback = false) => {
    if (v === null || v === undefined) return fallback;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    const s = String(v).toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  };

  const parseArray = (v: any): string[] => {
    if (!v) return base.techStack ?? [];
    if (Array.isArray(v)) return v.map((x) => String(x));
    return String(v)
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  return {
    ...base,
    id: toStr(safe(row.id, base.id)),
    regNo: toStr(safe(row.reg_no, base.regNo)),
    name: toStr(safe(row.name, base.name)),
    dept: toStr(safe(row.dept, base.dept)),
    year: toStr(safe(row.year, base.year)),
    gender: toStr(safe(row.gender, base.gender)),
    mobile: toStr(safe(row.mobile, base.mobile)),
    altMobile: toStr(safe(row.alt_mobile, base.altMobile)),
    officialEmail: toStr(safe(row.official_email, base.officialEmail)),
    personalEmail: toStr(safe(row.personal_email, base.personalEmail)),

    currentAddress: toStr(safe(row.current_address, base.currentAddress)),
    permanentAddress: toStr(safe(row.permanent_address, base.permanentAddress)),
    pincode: toStr(safe(row.pincode, base.pincode)),
    state: toStr(safe(row.state, base.state)),
    aadhar: toStr(safe(row.aadhar, base.aadhar)),
    pan: toStr(safe(row.pan, base.pan)),
    fatherName: toStr(safe(row.father_name, base.fatherName)),
    motherName: toStr(safe(row.mother_name, base.motherName)),
    dob: toStr(safe(r.dob ?? r.date_of_birth ?? r.dateofbirth ?? r.birthdate ?? row.dob, base.dob)),

    tenthPercentage: toNum(safe(row.tenth_percentage, base.tenthPercentage)),
    twelfthPercentage: toNum(
      safe(row.twelfth_percentage, base.twelfthPercentage)
    ),
    tenthYear: toStr(safe(row.tenth_year, base.tenthYear)),
    twelfthYear: toStr(safe(row.twelfth_year, base.twelfthYear)),

    gpaSem1: toNum(safe(row.gpa_sem1, base.gpaSem1)),
    gpaSem2: toNum(safe(row.gpa_sem2, base.gpaSem2)),
    gpaSem3: toNum(safe(row.gpa_sem3, base.gpaSem3)),
    cgpaOverall: toNum(safe(row.cgpa_overall, base.cgpaOverall)),

    techStack: parseArray(r.tech_stack ?? r.known_tech_stack ?? base.techStack),
    resumeUrl: toStr(safe(row.resume_url, base.resumeUrl)),
    relocate: toStr(safe(row.relocate, base.relocate)),
    category: toStr(safe(row.category, base.category)),
    placementStatus: toStr(safe(row.placement_status, base.placementStatus)),

    leetcodeId: toStr(safe(row.leetcode_id, base.leetcodeId)),
    lcTotal: toNum(safe(r.lc_total ?? r.lc_total_problems, base.lcTotal)),
    lcEasy: toNum(safe(row.lc_easy, base.lcEasy)),
    lcMed: toNum(safe(r.lc_med ?? r.lc_medium, base.lcMed)),
    lcHard: toNum(safe(row.lc_hard, base.lcHard)),
    lcRating: toNum(safe(row.lc_rating, base.lcRating)),
    lcBadges: toNum(safe(row.lc_badges, base.lcBadges)),
    lcMax: toNum(safe(r.lc_max ?? r.lc_max_rating, base.lcMax)),

    codechefId: toStr(safe(row.codechef_id, base.codechefId)),
    ccTotal: toNum(safe(row.cc_total, base.ccTotal)),
    ccRank: toStr(safe(row.cc_rank, base.ccRank)),
    ccBadges: toNum(safe(row.cc_badges, base.ccBadges)),
    ccRating: toNum(safe(row.cc_rating, base.ccRating)),

    srProblems: toNum(safe(r.sr_problems ?? r.sr_problems_solved, base.srProblems)),
    srRank: toStr(safe(row.sr_rank, base.srRank)),

    github: toStr(safe(r.github ?? r.github_id ?? r.github_link, base.github)),
    linkedin: toStr(safe(r.linkedin ?? r.linkedin_url, base.linkedin)),

    coeName: toStr(safe(row.coe_name, base.coeName)),
    coeIncharge: toStr(safe(row.coe_incharge, base.coeIncharge)),
    coeProjects: toStr(safe(row.coe_projects, base.coeProjects)),

    isHosteller: toBool(safe(row.is_hosteller, base.isHosteller)),
    // additional mappings
    gpaSem4: toNum(safe(row.gpa_sem4, base.gpaSem4)),
    gpaSem5: toNum(safe(row.gpa_sem5, base.gpaSem5)),
    gpaSem6: toNum(safe(row.gpa_sem6, base.gpaSem6)),
    gpaSem7: toNum(safe(row.gpa_sem7, base.gpaSem7)),
    gpaSem8: toNum(safe(row.gpa_sem8, base.gpaSem8)),

    skillrackId: toStr(safe(r.skillrack_id ?? r.skillrackid ?? r.sr_id, base.skillrackId)),
    guardianName: toStr(safe(row.guardian_name, base.guardianName)),
    diplomaYear: toStr(safe(r.diploma_year ?? r.diplomaYear ?? r.diplomayear ?? row.diploma_year, base.diplomaYear)),
    diplomaPercentage: toNum(safe(r.diploma_percentage ?? r.diploma_pct ?? r.diplomaPct ?? row.diploma_percentage, base.diplomaPercentage)),

    internshipCompany: toStr(safe(r.internship_company ?? r.internship_company_name ?? r.internshipcompany ?? r.internshipCompany ?? row.internship_company, base.internshipCompany)),
    internshipOfferLink: toStr(safe(r.internship_offer_link ?? r.internship_offer_letter_link ?? r.internshipOfferLink ?? row.internship_offer_link, base.internshipOfferLink)),
    // map updated timestamp if present in raw row variants (use permissive alias `r`)
    updatedAt: toStr(safe(r.updated_at ?? r.updatedAt ?? "", "")),
  };
}
