import { supabase } from "./supabaseClient";

// Debug: helps confirm the latest module version is running in the browser.
const ARC_DATA_DEBUG_VERSION = "2026-01-25";
if (import.meta.env.DEV) {
  console.debug("[arcData] loaded", { version: ARC_DATA_DEBUG_VERSION });
}

export type ArcRole = "SECTION_ADVISOR" | "HOD" | "STUDENT";

export interface ArcProfile {
  id: string;
  email: string | null;
  username: string | null;
  role: ArcRole;
  // dbRole holds the raw value from the `profiles.role` column (e.g. 'STUDENT','SECTION_ADVISOR','HOD')
  dbRole: string | null;
  section: string | null;
}

export interface StudentRow {
  id?: string;
  reg_no: string;
  name: string;
  dept?: string | null;
  year?: number | null;
  section: string;
  gender?: string | null;
  mobile?: string | null;
  alt_mobile?: string | null;
  official_email?: string | null;
  personal_email?: string | null;

  current_address?: string | null;
  permanent_address?: string | null;
  pincode?: string | null;
  state?: string | null;
  aadhar?: string | null;
  pan?: string | null;
  father_name?: string | null;
  mother_name?: string | null;

  tenth_percentage?: number | null;
  twelfth_percentage?: number | null;
  tenth_year?: string | null;
  twelfth_year?: string | null;

  gpa_sem1?: number | null;
  gpa_sem2?: number | null;
  gpa_sem3?: number | null;
  cgpa_overall?: number | null;

  tech_stack?: string[] | null;
  resume_url?: string | null;
  relocate?: string | null;
  category?: string | null;
  placement_status?: string | null;

  leetcode_id?: string | null;
  lc_total?: number | null;
  lc_easy?: number | null;
  lc_med?: number | null;
  lc_hard?: number | null;
  lc_rating?: number | null;
  lc_badges?: number | null;
  lc_max?: number | null;

  codechef_id?: string | null;
  cc_total?: number | null;
  cc_rank?: string | null;
  cc_badges?: number | null;
  cc_rating?: number | null;

  sr_problems?: number | null;
  sr_rank?: string | null;

  github?: string | null;
  linkedin?: string | null;

  coe_name?: string | null;
  coe_incharge?: string | null;
  coe_projects?: string | null;

  is_hosteller?: boolean | null;
}

function lookupField(row: any, candidates: string[]) {
  if (!row || typeof row !== "object") return undefined;
  const keys = Object.keys(row);
  for (const cand of candidates) {
    const candNorm = String(cand)
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase();
    for (const k of keys) {
      const kn = String(k)
        .replace(/[^a-z0-9]/gi, "")
        .toLowerCase();
      if (kn === candNorm) return row[k];
    }
  }
  return undefined;
}

function normalizeStudentRow(row: any): StudentRow {
  if (!row) return {} as StudentRow;
  const out: any = {};

  out.id = lookupField(row, ["id", "Id", "ID"]);
  out.reg_no = lookupField(row, [
    "reg_no",
    "regno",
    "REGNO",
    "REG_NO",
    "REGNO",
  ]);
  out.name = lookupField(row, ["name", "NAME"]);
  out.dept = lookupField(row, ["dept", "DEPT"]);
  out.year = lookupField(row, ["year", "YEAR"]);
  out.section = lookupField(row, ["section", "SECTION"]);
  out.gender = lookupField(row, ["gender", "GENDER"]);
  out.mobile = lookupField(row, [
    "mobile_no",
    "mobileno",
    "MOBILE_NO",
    "MOBILE",
  ]);
  out.alt_mobile = lookupField(row, [
    "alt_mobile",
    "altmobileno",
    "ALT_MOBILE_NO",
  ]);
  out.official_email = lookupField(row, [
    "official_mail",
    "officialemail",
    "OFFICIAL_MAIL",
  ]);
  out.personal_email = lookupField(row, [
    "email",
    "EMAIL",
    "personal_email",
    "personalemail",
  ]);

  out.current_address = lookupField(row, [
    "current_address",
    "currentaddress",
    "CURRENT_ADDRESS",
  ]);
  out.permanent_address = lookupField(row, [
    "permanent_address",
    "permanentaddress",
    "PERMANENT_ADDRESS",
  ]);
  out.pincode = lookupField(row, ["pincode", "PINCODE"]);
  out.state = lookupField(row, ["state", "STATE"]);
  out.aadhar = lookupField(row, ["aadhar_no", "aadhar", "AADHAR_NO"]);
  out.pan = lookupField(row, ["pan_no", "pan", "PAN_NO"]);
  out.father_name = lookupField(row, [
    "father_name",
    "fathername",
    "FATHER_NAME",
  ]);
  out.mother_name = lookupField(row, [
    "mother_name",
    "mothername",
    "MOTHER_NAME",
  ]);

  out.tenth_percentage = lookupField(row, [
    // "10th_board_marks",
    "10th_board_pct",
    "10th_board_pct",
    "10TH_BOARD_PCT",
    "10TH_BOARD_MARKS",
    "10th_board_marks",
  ]);
  out.twelfth_percentage = lookupField(row, [
    // "12th_board_marks",
    "12th_board_pct",
    "12TH_BOARD_PCT",
    "12TH_BOARD_MARKS",
  ]);
  out.tenth_year = lookupField(row, [
    "10th_board_year",
    "10TH_BOARD_YEAR",
    "tenth_year",
  ]);
  out.twelfth_year = lookupField(row, [
    "12th_board_year",
    "12TH_BOARD_YEAR",
    "twelfth_year",
  ]);

  out.gpa_sem1 = lookupField(row, ["gpa_sem1", "GPA_SEM1"]);
  out.gpa_sem2 = lookupField(row, ["gpa_sem2", "GPA_SEM2"]);
  out.gpa_sem3 = lookupField(row, ["gpa_sem3", "GPA_SEM3"]);
  out.cgpa_overall = lookupField(row, ["cgpa", "CGPA", "cgpa_overall"]);

  // Coding platforms
  out.leetcode_id = lookupField(row, ["leetcode_id", "LEETCODE_ID"]);
  out.lc_total = lookupField(row, [
    "lc_total_problems",
    "lc_total",
    "LC_TOTAL_PROBLEMS",
  ]);
  out.lc_easy = lookupField(row, ["lc_easy", "LC_EASY"]);
  out.lc_med = lookupField(row, ["lc_medium", "lc_med", "LC_MEDIUM"]);
  out.lc_hard = lookupField(row, ["lc_hard", "LC_HARD"]);
  out.lc_rating = lookupField(row, ["lc_rating", "LC_RATING"]);
  out.lc_badges = lookupField(row, ["lc_badges", "LC_BADGES"]);
  out.lc_max = lookupField(row, ["lc_max_rating", "LC_MAX_RATING"]);

  out.codechef_id = lookupField(row, ["codechef_id", "CODECHEF_ID"]);
  out.cc_total = lookupField(row, ["cc_total_problems", "CC_TOTAL_PROBLEMS"]);
  out.cc_rank = lookupField(row, ["cc_rank", "CC_RANK"]);
  out.cc_badges = lookupField(row, ["cc_badges", "CC_BADGES"]);
  out.cc_rating = lookupField(row, ["cc_rating", "CC_RATING"]);

  out.sr_problems = lookupField(row, [
    "sr_problems_solved",
    "sr_problems",
    "SR_PROBLEMS_SOLVED",
  ]);
  out.sr_rank = lookupField(row, ["sr_rank", "SR_RANK"]);

  out.github = lookupField(row, [
    "github_id",
    "GITHUB_ID",
    "github_link",
    "GITHUB_LINK",
  ]);
  out.linkedin = lookupField(row, ["linkedin_url", "LINKEDIN_URL"]);

  out.tech_stack = lookupField(row, [
    "known_tech_stack",
    "KNOWN_TECH_STACK",
    "tech_stack",
  ]);
  out.resume_url = lookupField(row, [
    "resume_link",
    "RESUME_LINK",
    "resume_url",
  ]);
  out.relocate = lookupField(row, [
    "willing_to_relocate",
    "WILLING_TO_RELOCATE",
  ]);
  out.category = lookupField(row, ["placement_hs", "PLACEMENT_HS"]);

  out.coe_name = lookupField(row, ["coe_name", "COE_NAME"]);
  out.coe_incharge = lookupField(row, [
    "coe_incharge_name",
    "COE_INCHARGE_NAME",
    "coe_incharge",
  ]);
  out.coe_projects = lookupField(row, [
    "coe_projects_done",
    "COE_PROJECTS_DONE",
    "coe_projects",
  ]);

  // Derive residency as boolean from either a text column (RESIDENCY_STATUS)
  // or a direct boolean column (is_hosteller). Prefer explicit residency_status text when present.
  const residencyRaw = lookupField(row, [
    "residency_status",
    "RESIDENCY_STATUS",
    "residency",
    "RESIDENCY",
  ]);
  const directHosteller = lookupField(row, ["is_hosteller", "IS_HOSTELLER"]);

  let derivedIsHosteller: boolean | null = null;
  if (residencyRaw !== undefined && residencyRaw !== null && String(residencyRaw).trim() !== "") {
    const r = String(residencyRaw).trim().toLowerCase();
    derivedIsHosteller = r === "hosteller" || r === "hostel" || r === "host" || r === "hosteller";
  } else if (directHosteller !== undefined && directHosteller !== null) {
    if (typeof directHosteller === "boolean") derivedIsHosteller = directHosteller;
    else {
      const d = String(directHosteller).trim().toLowerCase();
      derivedIsHosteller = d === "true" || d === "1" || d === "yes" || d === "hosteller";
    }
  }

  out.is_hosteller = derivedIsHosteller;

  return out as StudentRow;
}

export async function fetchProfileByUserId(
  userId: string,
  userEmail?: string
): Promise<ArcProfile | null> {
  try {
    // Support two common schemas:
    // A) profiles.user_id stores auth.users.id (uuid)
    // B) profiles.id is a FK to auth.users.id (uuid)
    let data: any = null;

    const primary = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!primary.error) {
      data = primary.data;
    } else {
      const msg = String((primary.error as any)?.message ?? "").toLowerCase();
      const looksLikeMissingUserIdColumn =
        msg.includes("user_id") && msg.includes("does not exist");

      if (!looksLikeMissingUserIdColumn) {
        throw primary.error;
      }

      const fallback = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (fallback.error) throw fallback.error;
      data = fallback.data;
    }

    // Final fallback: some schemas store profiles keyed by email, not auth user id.
    if (!data && userEmail) {
      const normalizedEmail = String(userEmail).trim().toLowerCase();
      const byEmail = await supabase
        .from("profiles")
        .select("*")
        .eq("email", normalizedEmail)
        .maybeSingle();
      if (!byEmail.error) data = byEmail.data;
    }

    if (!data) return null;

    const idVal = lookupField(data, ["id", "ID"]) ?? data.id;
    const emailVal = lookupField(data, ["email", "EMAIL"]) ?? data.email;
    const usernameVal =
      lookupField(data, ["username", "USERNAME"]) ?? data.username;
    const roleVal = lookupField(data, ["role", "ROLE"]) ?? data.role;
    const sectionRaw =
      lookupField(data, ["section", "SECTION"]) ?? data.section;

    const dbRole = roleVal ? String(roleVal).toUpperCase() : null;

    // Allowed role vocabularies for this project:
    // - STUDENT
    // - SECTION_ADVISOR
    // - HOD
    const allowedRoles = new Set(["STUDENT", "SECTION_ADVISOR", "HOD"]);
    if (dbRole && !allowedRoles.has(dbRole)) {
      console.warn(
        `profiles.role has unexpected value '${dbRole}' for user ${userId}`
      );
      return null;
    }

    const role =
      dbRole === "HOD"
        ? "HOD"
        : ((dbRole === "STUDENT" ? "STUDENT" : "SECTION_ADVISOR") as ArcRole);

    const sectionVal = sectionRaw
      ? String(sectionRaw).trim().toUpperCase()
      : null;

    return {
      id: idVal ? String(idVal) : String(data.id ?? ""),
      email: emailVal ?? null,
      username: usernameVal ?? null,
      role,
      dbRole,
      section: sectionVal,
    };
  } catch (err: any) {
    console.warn("fetchProfileByUserId failed:", err?.message ?? err);
    return null;
  }
}

// --- Needs updation helpers ---
export async function setNeedsUpdation(section: string, fields: string[]) {
  try {
    const normalizedSection = (section || '').toString().trim().toUpperCase();

    // Remove existing entries for this section
    await supabase.from('field_update_requests').delete().eq('section', normalizedSection);

    if (!fields || fields.length === 0) return { success: true };

    const rows = fields.map((f) => ({ section: normalizedSection, field_label: f }));
    const { error } = await supabase.from('field_update_requests').insert(rows);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.warn('setNeedsUpdation failed:', err?.message ?? err);
    return { success: false, error: err };
  }
}

export async function clearNeedsUpdation(section: string) {
  try {
    const normalizedSection = (section || '').toString().trim().toUpperCase();
    const { error } = await supabase.from('field_update_requests').delete().eq('section', normalizedSection);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.warn('clearNeedsUpdation failed:', err?.message ?? err);
    return { success: false, error: err };
  }
}

export async function fetchNeedsUpdation(section: string) {
  try {
    const normalizedSection = (section || '').toString().trim().toUpperCase();
    const { data, error } = await supabase.from('field_update_requests').select('field_label').eq('section', normalizedSection);
    if (error) throw error;
    return Array.isArray(data) ? data.map((r: any) => String(r.field_label)) : [];
  } catch (err: any) {
    console.warn('fetchNeedsUpdation failed:', err?.message ?? err);
    return [];
  }
}

export async function updateStudentByRegNo(regNo: string, updates: Record<string, any>) {
  try {
    const normalized = String(regNo || '').trim();
    const { data, error } = await supabase.from('students').update(updates).eq('reg_no', normalized).select().maybeSingle();
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.warn('updateStudentByRegNo failed:', err?.message ?? err);
    return { success: false, error: err };
  }
}

// Return list of column names for the students table by fetching one row and deriving keys.
export async function fetchStudentColumns(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from('students').select('*').limit(1).maybeSingle();
    if (error) {
      // Try capitalized table name as fallback
      const alt = await supabase.from('Students').select('*').limit(1).maybeSingle();
      if (!alt.error && alt.data) return Object.keys(alt.data);
      throw error;
    }
    if (!data) return [];
    return Object.keys(data);
  } catch (err: any) {
    console.warn('fetchStudentColumns failed:', err?.message ?? err);
    return [];
  }
}

export async function fetchStudentsBySection(
  section: string
): Promise<StudentRow[]> {
  try {
    const normalized = (section ?? "").toString().trim();
    const normalizedUpper = normalized.toUpperCase();

    // Your schema uses a quoted table: public."Students" and quoted columns like "SECTION" and "NAME".
    // In PostgREST/Supabase client calls, we refer to them WITHOUT embedding quotes in the string.
    // Example: supabase.from('Students').ilike('SECTION', 'O').order('NAME')
    const candidates: Array<{
      table: string;
      sectionCol: string;
      nameCol: string;
    }> = [{ table: "Students", sectionCol: "SECTION", nameCol: "NAME" }];

    // Try filtered queries across table/column variants
    for (const c of candidates) {
      let sawOkEmptyForCandidate = false;
      try {
        const patterns = [normalizedUpper, `${normalizedUpper}%`];
        for (const pattern of patterns) {
          const resp = await supabase
            .from(c.table)
            .select("*")
            .ilike(c.sectionCol, pattern)
            .order(c.nameCol, { ascending: true });

          if (!resp.error) {
            const rows = (resp.data ?? []).map((r: any) =>
              normalizeStudentRow(r)
            ) as StudentRow[];

            if (rows.length > 0) return rows;

            sawOkEmptyForCandidate = true;
            console.debug("[arcData] query ok but zero rows", {
              table: c.table,
              sectionCol: c.sectionCol,
              pattern,
            });
            continue;
          }

          console.debug("[arcData] supabase query error", {
            table: c.table,
            column: c.sectionCol,
            pattern,
            orderBy: c.nameCol,
            status: (resp as any).status ?? undefined,
            error: resp.error,
          });

          const msg = String((resp.error as any)?.message ?? "").toLowerCase();
          const missing =
            msg.includes("does not exist") ||
            msg.includes("relation") ||
            msg.includes("column");
          if (!missing) throw resp.error;
        }
      } catch (e) {
        // try next candidate
      }

      // If the table/columns exist but returned empty for all patterns, try next candidate
      if (sawOkEmptyForCandidate) continue;
    }

    // Final fallback: fetch all rows from candidate tables and filter client-side
    for (const c of candidates) {
      try {
        const resp = await supabase
          .from(c.table)
          .select("*")
          .order(c.nameCol, { ascending: true });
        if (!resp.error) {
          const all = resp.data ?? [];
          const filtered = (all ?? []).filter((r: any) => {
            const nr = normalizeStudentRow(r).section ?? "";
            return String(nr).trim().toUpperCase() === normalized.toUpperCase();
          });
          return filtered.map((r: any) =>
            normalizeStudentRow(r)
          ) as StudentRow[];
        }
        console.debug("[arcData] fetch-all response error", {
          table: c.table,
          orderBy: c.nameCol,
          status: (resp as any).status ?? undefined,
          error: resp.error,
        });
      } catch (e) {
        // continue
      }
    }

    // If nothing worked, return empty list
    return [] as StudentRow[];
  } catch (err: any) {
    console.warn("fetchStudentsBySection failed:", err?.message ?? err);
    return [];
  }
}

export async function debugAdvisorStudentProbe(expectedSection: string) {
  try {
    const section = String(expectedSection ?? "")
      .trim()
      .toUpperCase();
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id ?? null;
    const userEmail = sessionData?.session?.user?.email ?? null;

    let profile: any = null;
    if (userId) {
      const resp = await supabase
        .from("profiles")
        .select("id,user_id,email,username,role,section")
        .eq("user_id", userId)
        .maybeSingle();
      if (!resp.error) profile = resp.data;
    }
    if (!profile && userEmail) {
      const resp = await supabase
        .from("profiles")
        .select("id,user_id,email,username,role,section")
        .eq("email", String(userEmail).trim().toLowerCase())
        .maybeSingle();
      if (!resp.error) profile = resp.data;
    }

    const profileSection = profile?.section
      ? String(profile.section).trim().toUpperCase()
      : null;

    const studentsResp = await supabase
      .from("Students")
      .select("id,REGNO,NAME,SECTION")
      .ilike("SECTION", section)
      .limit(5);

    return {
      ok: true,
      expectedSection: section,
      session: {
        hasSession: !!sessionData?.session,
        userId,
        userEmail,
        sessionError,
      },
      profile: {
        found: !!profile,
        role: profile?.role ?? null,
        section: profileSection,
      },
      students: {
        status: (studentsResp as any).status ?? null,
        error: studentsResp.error ?? null,
        count: Array.isArray(studentsResp.data) ? studentsResp.data.length : 0,
        sample: studentsResp.data ?? null,
      },
    };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}

export async function fetchAllStudents(): Promise<StudentRow[]> {
  try {
    const candidates: Array<{ table: string; nameCol: string }> = [
      { table: "Students", nameCol: "NAME" },
    ];

    for (const c of candidates) {
      try {
        const resp = await supabase
          .from(c.table)
          .select("*")
          .order(c.nameCol, { ascending: true });
        if (!resp.error) {
          return (resp.data ?? []).map((r: any) =>
            normalizeStudentRow(r)
          ) as StudentRow[];
        }
        console.debug("[arcData] fetchAllStudents response error", {
          table: c.table,
          orderBy: c.nameCol,
          status: (resp as any).status ?? undefined,
          error: resp.error,
        });
      } catch (e) {
        // try next candidate
      }
    }

    return [] as StudentRow[];
  } catch (err: any) {
    console.warn("fetchAllStudents failed:", err?.message ?? err);
    return [];
  }
}

export async function fetchAvailableSections(): Promise<string[]> {
  try {
    // Prefer a dedicated sections table if you have it
    const fromSections = await supabase
      .from("sections")
      .select("section")
      .order("section", { ascending: true });
    if (
      !fromSections.error &&
      fromSections.data &&
      fromSections.data.length > 0
    ) {
      return fromSections.data
        .map((r: any) => String(r.section).toUpperCase())
        .filter(Boolean);
    }

    // Fallback: distinct sections from Students/students.
    // Do not select columns that don't exist for a given table, or PostgREST returns 400.
    const candidates: Array<{ table: string; sectionCol: string }> = [
      { table: "Students", sectionCol: "SECTION" },
    ];

    for (const c of candidates) {
      const resp = await supabase.from(c.table).select(c.sectionCol);
      if (resp.error) {
        console.debug("[arcData] fetchAvailableSections students query error", {
          table: c.table,
          column: c.sectionCol,
          status: (resp as any).status ?? undefined,
          error: resp.error,
        });
        continue;
      }

      const uniq = new Set(
        (resp.data ?? [])
          .map((r: any) => r?.[c.sectionCol])
          .map((v: any) =>
            String(v ?? "")
              .trim()
              .toUpperCase()
          )
          .filter(Boolean)
      );

      if (uniq.size > 0) return Array.from(uniq).sort();
    }

    return [];
  } catch (err: any) {
    console.warn("fetchAvailableSections failed:", err?.message ?? err);
    return [];
  }
}

// Broadcast a needs-updation notification to all students in a section.
// This is best-effort: it will try a few common notification table names and
// fall back to logging if none exist. The message contains the list of fields.
export async function broadcastNeedsUpdation(section: string, fields: string[]) {
  try {
    const normalizedSection = (section || '').toString().trim().toUpperCase();

    // Build message
    const labels = Array.isArray(fields) ? fields : [];
    const message = labels.length
      ? `Please update the following field(s): ${labels.join(', ')}.`
      : `Please review your registry record.`;

    // Fetch student rows for the section
    const students = await fetchStudentsBySection(normalizedSection);
    if (!Array.isArray(students) || students.length === 0) {
      console.debug('[arcData] broadcastNeedsUpdation: no students found for', normalizedSection);
      return { success: true, note: 'no-students' };
    }

    // Prepare notification rows
    const rows = students.map((s) => ({
      student_reg_no: s.reg_no,
      student_email: s.personal_email ?? s.official_email ?? null,
      message,
      created_at: new Date().toISOString(),
    }));

    // Try common table names
    const candidateTables = ['student_notifications', 'notifications', 'messages'];
    for (const tbl of candidateTables) {
      try {
        const { error } = await supabase.from(tbl).insert(rows);
        if (!error) {
          console.debug('[arcData] broadcastNeedsUpdation inserted into', tbl, 'rows', rows.length);
          return { success: true, table: tbl };
        }

        const msg = String((error as any)?.message ?? '').toLowerCase();
        if (msg.includes('does not exist') || msg.includes('relation')) {
          // try next candidate
          continue;
        }

        // unexpected error
        console.warn('[arcData] broadcastNeedsUpdation insert error', tbl, error);
        return { success: false, error };
      } catch (e: any) {
        // try next candidate
        continue;
      }
    }

    console.debug('[arcData] broadcastNeedsUpdation: no notification table found, logging only');
    // As a fallback, optionally write to a lightweight audit table or return success
    return { success: true, note: 'no-notification-table' };
  } catch (err: any) {
    console.warn('broadcastNeedsUpdation failed:', err?.message ?? err);
    return { success: false, error: err };
  }
}
