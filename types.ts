
export type AuthMode = 'login' | 'signup' | 'forgot-password';

export interface SecurityAnalysis {
  strength: 'weak' | 'moderate' | 'strong' | 'legendary';
  feedback: string;
  tips: string[];
}

export interface UserState {
  username: string;
  email: string;
  role: string;
  isAuthenticated: boolean;
}

export interface StudentRecord {
  // Core Info
  id: string;
  regNo: string;
  name: string;
  dept: string;
  year: number;
  section: string;
  gender: string;
  mobile: string;
  altMobile: string;
  officialEmail: string;
  personalEmail: string;
  
  // Address & Identity
  currentAddress: string;
  permanentAddress: string;
  pincode: string;
  state: string;
  aadhar: string;
  pan: string;
  fatherName: string;
  motherName: string;

  // Schooling
  tenthPercentage: number;
  twelfthPercentage: number;
  tenthYear: string;
  twelfthYear: string;

  // Academic Performance
  gpaSem1: number;
  gpaSem2: number;
  gpaSem3: number;
  cgpaOverall: number;

  // Placement & Career
  techStack: string[];
  resumeUrl: string;
  relocate: string;
  category: string; // Placement/HS
  placementStatus: string; // Company/Offer Link
  
  // Competitive Coding - LeetCode
  leetcodeId: string;
  lcTotal: number;
  lcEasy: number;
  lcMed: number;
  lcHard: number;
  lcRating: number;
  lcBadges: number;
  lcMax: number;

  // Competitive Coding - CodeChef
  codechefId: string;
  ccTotal: number;
  ccRank: string;
  ccBadges: number;
  ccRating: number;

  // SkillRack
  srProblems: number;
  srRank: string;

  // Social & Professional
  github: string;
  linkedin: string;
  initials: string;

  // Center of Excellence
  coeName: string;
  coeIncharge: string;
  coeProjects: string;
}
