import React, { useState, useMemo } from 'react';
import { StudentRecord, UserState } from '../types';
import { Logo, Button } from './UI';

// Full 68 Student Dataset for Section Q
const STUDENT_NAMES = [
  "AISWARYA M", "AKASSHKUMAR SUGUMAR", "AKSHAYAKUMARAN A", "ANISH MUTHUKRISHNAN", "B AKSHAYA", 
  "DARSHINI S", "DHARANI M", "DHARSHANRAJ K J", "DIJO S BENELEN", "DIVYA HARINI A", 
  "DIVYA S", "H SHAKTHI PRIYA", "HARSINI D", "HEMA HARINI H", "INIYA J", 
  "JAI SHREE R", "JENISHA R", "JESIKA J", "K TARUN VARMA", "KANI J", 
  "KATHIRUDHAYAN P", "KIRUTHIK ROSHAN T", "KISHORE KUMAR J", "KRISHNAPRIYA A", "L N PRADHIKA", 
  "LAKSHANIKA R S M", "LIBERSHA S", "LOKPRADEEP S S", "SRIVATHSAN M P", "MARIA MEGHA L", 
  "MERLIN M", "MONISHA K", "MOULEESWARAN M", "MUTHALAGAMMAI S", "NAMBOORI HARSHITH VARMA", 
  "NILASHINI S", "NIVETHA S", "PALANISAMY R", "PRAVEEN S", "PRIEYAN M N", 
  "PRIYA DHARSHINI R", "PRIYADHARSHINI D", "PUSHPASRI V", "R SANJANA SREE", "RESHMI A K", 
  "RITHIKA SHRE K P", "ROHIT S", "S ABISHEAK", "S AKILESH", "S SUBARNALAKSHMI", 
  "SAKTHIVEL S S", "SAMIKSHA R", "SANDHIYA S", "SANJAI J V", "SANJANA P", 
  "SARVESH K", "SENTHANAMUTHAN S", "SHANMUGAPRIYAN D", "SHARVESH N", "SIVAPURAM PRANATI", 
  "SRIRAM R", "SUBHAM SAHOO S", "SUBHIKSHA S", "THARUNKRISHNA T H", "VISHVAK R", 
  "YAMUNA P", "YASHWANTH V N", "BHAVADHARANI L"
];

const generateSectionQ = (): StudentRecord[] => {
  return STUDENT_NAMES.map((name, i) => {
    const regNo = `24CS${String(34 + i).padStart(4, '0')}`;
    const cgpas = [9.0, 7.6, 7.6, 8.36, 8.1, 8.84, 7.4, 8.13, 7.67, 8.71, 8.6, 8.0, 8.7, 8.24, 8.39, 8.97, 8.42, 8.43, 7.9, 8.46, 7.81, 8.72, 8.13, 7.62, 8.96, 8.66, 8.7, 7.43, 8.62, 8.91, 8.74, 8.5, 8.9, 8.71, 8.29, 8.76, 8.4, 8.21, 8.05, 8.38, 8.84, 8.06, 9.22, 8.12, 8.39, 8.61, 8.41, 8.48, 8.2, 7.54, 8.29, 8.5, 8.93, 8.47, 8.73, 7.47, 8.29, 8.29, 8.78, 9.08, 8.6, 9.3, 9.45, 8.99, 9.19, 9.01, 9.24, 9.0];
    
    return {
      id: regNo,
      regNo,
      name,
      dept: 'CSE',
      year: 2,
      section: 'Q',
      gender: i % 2 === 0 ? 'F' : 'M',
      mobile: `9840${String(1000 + i).substring(0,4)}81`,
      altMobile: `9360${String(2000 + i).substring(0,4)}22`,
      officialEmail: `${name.toLowerCase().replace(/\s/g, '')}.cse2024@citchennai.net`,
      personalEmail: `${name.toLowerCase().replace(/\s/g, '')}@gmail.com`,
      currentAddress: 'Chennai Residence Node',
      permanentAddress: 'Tamil Nadu Hub',
      pincode: '600100',
      state: 'TN',
      aadhar: `1234 5678 ${String(1000+i)} 12`,
      pan: `ABCDE${String(1000+i)}F`,
      fatherName: `Guardian of ${name.split(' ')[0]}`,
      motherName: `Parent of ${name.split(' ')[0]}`,
      tenthPercentage: 85 + (i % 15),
      twelfthPercentage: 80 + (i % 20),
      tenthYear: '2022',
      twelfthYear: '2024',
      gpaSem1: (cgpas[i % cgpas.length] + 0.2),
      gpaSem2: (cgpas[i % cgpas.length] - 0.1),
      gpaSem3: cgpas[i % cgpas.length],
      cgpaOverall: cgpas[i % cgpas.length],
      techStack: ['SDE', 'FSD', 'GenAI'],
      resumeUrl: '#',
      relocate: 'Global Cities',
      category: 'Placement',
      placementStatus: 'Verified Candidate',
      leetcodeId: name.toLowerCase().replace(/\s/g, ''),
      lcTotal: 400 + (i * 10),
      lcEasy: 200 + i,
      lcMed: 150 + i,
      lcHard: 50 + (i % 10),
      lcRating: 1500 + i,
      lcBadges: 4 + (i % 3),
      lcMax: 1800 + i,
      codechefId: `${name.split(' ')[0].toLowerCase()}_cc`,
      ccTotal: 500 + i,
      ccRank: `${i + 100}`,
      ccBadges: 3,
      ccRating: 1400 + i,
      srProblems: 300 + i,
      srRank: `${i + 1}`,
      github: `https://github.com/${name.toLowerCase().replace(/\s/g, '-')}`,
      linkedin: `https://linkedin.com/in/${name.toLowerCase().replace(/\s/g, '-')}`,
      initials: name.split(' ').map(n => n[0]).join(''),
      coeName: 'Intelligence Center',
      coeIncharge: 'Prof. Matrix',
      coeProjects: 'A.R.C. Portal Development',
      isHosteller: i % 3 === 0
    };
  });
};

const SECTION_Q_RECORDS = generateSectionQ();

const INITIAL_REGISTRY_FIELDS = [
  { id: 'reg_no', label: 'REG NO', cat: 'Core' },
  { id: 'name', label: 'NAME', cat: 'Core' },
  { id: 'dept', label: 'DEPT', cat: 'Core' },
  { id: 'year', label: 'YEAR', cat: 'Core' },
  { id: 'section', label: 'SECTION', cat: 'Core' },
  { id: 'gender', label: 'GENDER', cat: 'Core' },
  { id: 'mobile', label: 'MOBILE NO', cat: 'Contact' },
  { id: 'alt_mobile', label: 'ALT MOBILE NO', cat: 'Contact' },
  { id: 'official_mail', label: 'OFFICIAL MAIL', cat: 'Contact' },
  { id: 'personal_email', label: 'EMAIL', cat: 'Contact' },
  { id: 'current_address', label: 'CURRENT ADDRESS', cat: 'Address' },
  { id: 'permanent_address', label: 'PERMANENT ADDRESS', cat: 'Address' },
  { id: 'pincode', label: 'PINCODE', cat: 'Address' },
  { id: 'state', label: 'STATE', cat: 'Address' },
  { id: 'marks_10', label: '10TH BOARD MARKS', cat: 'Schooling' },
  { id: 'marks_12', label: '12TH BOARD MARKS', cat: 'Schooling' },
  { id: 'aadhar', label: 'AADHAR NO', cat: 'Identity' },
  { id: 'pan', label: 'PAN NO', cat: 'Identity' },
  { id: 'father', label: 'FATHER NAME', cat: 'Family' },
  { id: 'mother', label: 'MOTHER NAME', cat: 'Family' },
  { id: 'tech_stack', label: 'KNOWN TECH STACK', cat: 'Professional' },
  { id: 'lc_rating', label: 'LC RATING', cat: 'Coding' },
  { id: 'cc_rating', label: 'CC RATING', cat: 'Coding' },
  { id: 'cgpa', label: 'CGPA', cat: 'Academic' },
  { id: 'coe_name', label: 'COE NAME', cat: 'COE' },
];

export const Dashboard: React.FC<{ user: UserState; onLogout: () => void; sectionName?: string; onBack?: () => void }> = ({ user, onLogout, sectionName = 'Q', onBack }) => {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [sortField, setSortField] = useState<keyof StudentRecord>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [profileOpen, setProfileOpen] = useState(false);
  
  // Modal states
  const [updationModalOpen, setUpdationModalOpen] = useState(false);
  const [pruneModalOpen, setPruneModalOpen] = useState(false);
  const [injectModalOpen, setInjectModalOpen] = useState(false);
  
  // Registry Data States
  const [registryFields, setRegistryFields] = useState(INITIAL_REGISTRY_FIELDS);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [newFieldName, setNewFieldName] = useState('');

  const filteredAndSortedStudents = useMemo(() => {
    let result = SECTION_Q_RECORDS.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.regNo.includes(search)
    );
    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      }
      return sortDirection === 'asc' ? 
        String(valA).localeCompare(String(valB)) : 
        String(valB).localeCompare(String(valA));
    });
    return result;
  }, [search, sortField, sortDirection]);

  const aggregates = useMemo(() => {
    const total = SECTION_Q_RECORDS.length;
    if (total === 0) return { cgpa: '0.00', lc: '0 / 0', residency: '0/0' };
    
    const avgCgpa = SECTION_Q_RECORDS.reduce((acc, s) => acc + s.cgpaOverall, 0) / total;
    const avgLcRating = SECTION_Q_RECORDS.reduce((acc, s) => acc + (s.lcRating || 0), 0) / total;
    const avgLcSolved = SECTION_Q_RECORDS.reduce((acc, s) => acc + (s.lcTotal || 0), 0) / total;
    const hostellers = SECTION_Q_RECORDS.filter(s => s.isHosteller).length;
    const dayScholars = total - hostellers;

    return { 
      cgpa: avgCgpa.toFixed(2), 
      lc: `${Math.round(avgLcSolved)} / ${Math.round(avgLcRating)}`, 
      residency: `${hostellers}H / ${dayScholars}D` 
    };
  }, []);

  const toggleFieldSelection = (fieldId: string) => {
    setSelectedFields(prev => prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]);
  };

  const clearSelections = () => {
    setSelectedFields([]);
    setNewFieldName('');
  };

  return (
    <div className="min-h-screen bg-[#fcfaff] flex flex-col font-medium text-slate-900 text-xs">
      <header className="bg-gradient-to-r from-violet-600 to-indigo-700 text-white p-3 shadow-lg sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            {onBack && (
              <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-lg transition-all active:scale-90">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
              </button>
            )}
            <Logo />
            <div>
              <h1 className="text-md font-black tracking-tight uppercase leading-none text-white">A.R.C. Portal</h1>
              <p className="text-[8px] uppercase tracking-[0.3em] opacity-80 mt-0.5 text-white">Section {sectionName}</p>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setProfileOpen(!profileOpen)} className="bg-white/10 p-1 pr-3 rounded-full border border-white/20 flex items-center gap-2 hover:bg-white/20 transition-all">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-violet-700 font-black text-[9px]">AD</div>
              <div className="text-[10px] font-black hidden md:block text-white">{user.username}</div>
              <svg className={`w-2.5 h-2.5 transition-transform duration-500 text-white ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-[60] overflow-hidden">
                <button onClick={onLogout} className="w-full text-left px-4 py-2 text-[9px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-colors">Log out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full p-4 lg:p-6 gap-6 overflow-hidden">
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AiryStatCard label="SECTION AVG CGPA" value={aggregates.cgpa} sub="Global Metrics" icon="🏆" color="purple" />
            <AiryStatCard label="CODING SOLVED / RATING" value={aggregates.lc} sub="Avg Solved / Avg Rating" icon="💻" color="blue" />
            <AiryStatCard label="RESIDENCY HUB" value={aggregates.residency} sub="Hosteller / DayScholar" icon="🏠" color="green" />
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <input type="text" placeholder="Filter nodes..." className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-violet-400 transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
                <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <div className="flex gap-2">
                 <AirySortBtn active={sortField === 'cgpaOverall'} onClick={() => { setSortField('cgpaOverall'); setSortDirection(p => p === 'asc' ? 'desc' : 'asc'); }}>CGPA GRID</AirySortBtn>
                 <AirySortBtn active={sortField === 'name'} onClick={() => { setSortField('name'); setSortDirection(p => p === 'asc' ? 'desc' : 'asc'); }}>ALPHA</AirySortBtn>
              </div>
            </div>

            <div className="overflow-x-auto">
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
                    <tr key={s.regNo} onClick={() => setSelectedStudent(s)} className="group cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                      <td className="px-4 py-3 text-[10px] font-black text-slate-300 tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-3 text-[10px] font-black text-slate-400 tabular-nums">{s.regNo}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-[9px] font-black text-violet-700">{s.initials}</div>
                          <span className="text-xs font-black text-slate-900 group-hover:text-violet-700 transition-colors truncate">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${s.cgpaOverall >= 8.5 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-indigo-500 border-slate-100'}`}>
                          {s.cgpaOverall.toFixed(2)}
                        </span>
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
               <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-900">COMMAND HUB</h3>
            </div>
            <div className="space-y-3">
               <AiryCommandBtn 
                  label="NEED UPDATION" 
                  icon="🔄" 
                  sub="Registry Sync" 
                  color="bg-indigo-600" 
                  onClick={() => { clearSelections(); setUpdationModalOpen(true); }} 
               />
               <AiryCommandBtn 
                  label="DYNAMIC INJECT" 
                  icon="+" 
                  sub="Extend Matrix" 
                  color="bg-violet-600" 
                  onClick={() => { clearSelections(); setInjectModalOpen(true); }} 
               />
               <AiryCommandBtn 
                  label="PRUNE NODES" 
                  icon="🗑️" 
                  sub="Remove Data" 
                  color="bg-rose-600" 
                  onClick={() => { clearSelections(); setPruneModalOpen(true); }} 
               />
            </div>
          </div>
        </aside>
      </div>

      {/* Intelligence Profile Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setSelectedStudent(null)}></div>
          <div className="relative bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="w-full md:w-72 bg-slate-50 border-r border-slate-100 p-8 flex flex-col items-center">
               <div className="relative group mb-6">
                  <div className="absolute -inset-2 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                  <div className="relative w-32 h-32 rounded-[1.8rem] bg-gradient-to-br from-violet-600 to-indigo-800 flex items-center justify-center text-4xl font-black text-white shadow-2xl">
                    {selectedStudent.initials}
                  </div>
               </div>
               
               <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase text-center mb-1 leading-tight">{selectedStudent.name}</h2>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">{selectedStudent.regNo}</p>
               
               <div className="w-full space-y-3 mt-auto">
                  <BrandedButton label="LinkedIn Profile" href={selectedStudent.linkedin} icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>} color="bg-[#0077b5]" />
                  <BrandedButton label="GitHub Repos" href={selectedStudent.github} icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>} color="bg-[#24292e]" />
                  <BrandedButton label="Resume Vault" href={selectedStudent.resumeUrl} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} color="bg-emerald-600" />
               </div>
            </div>

            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar relative">
               <button onClick={() => setSelectedStudent(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-xl transition-all active:scale-90 group">
                  <svg className="w-6 h-6 text-slate-300 group-hover:text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>

               <div className="space-y-12">
                  <section>
                    <AiryModalHeader title="Intelligence Node" icon="🧬" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                      <AiryDataItem label="Gender Cluster" value={selectedStudent.gender === 'F' ? 'Female' : 'Male'} />
                      <AiryDataItem label="Dept Matrix" value={selectedStudent.dept} />
                      <AiryDataItem label="Registry Year" value={`${selectedStudent.year} (Batch 2024)`} />
                      <AiryDataItem label="Section Hub" value={selectedStudent.section} />
                      <AiryDataItem label="Aadhar Identity" value={selectedStudent.aadhar} highlight />
                      <AiryDataItem label="PAN Node" value={selectedStudent.pan} highlight />
                      <AiryDataItem label="Father Identity" value={selectedStudent.fatherName} />
                      <AiryDataItem label="Mother Identity" value={selectedStudent.motherName} />
                    </div>
                  </section>

                  <section>
                    <AiryModalHeader title="Connectivity Protocols" icon="📡" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                      <div className="space-y-4">
                        <AiryDataItem label="Official Mail Relay" value={selectedStudent.officialEmail} />
                        <AiryDataItem label="Personal Mail Relay" value={selectedStudent.personalEmail} />
                      </div>
                      <div className="space-y-4">
                        <AiryDataItem label="Primary Contact" value={selectedStudent.mobile} highlight />
                        <AiryDataItem label="Emergency Contact" value={selectedStudent.altMobile} />
                      </div>
                    </div>
                  </section>

                  <section className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                    <AiryModalHeader title="Performance Matrix" icon="📈" />
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-6">
                      <div className="col-span-2 md:col-span-1">
                        <AiryDataItem label="CGPA INDEX" value={selectedStudent.cgpaOverall.toFixed(2)} highlight large />
                      </div>
                      <AiryDataItem label="SEM 01" value={selectedStudent.gpaSem1.toFixed(2)} />
                      <AiryDataItem label="SEM 02" value={selectedStudent.gpaSem2.toFixed(2)} />
                      <AiryDataItem label="SEM 03" value={selectedStudent.gpaSem3.toFixed(2)} />
                      <AiryDataItem label="10TH BOARD %" value={selectedStudent.tenthPercentage} />
                      <AiryDataItem label="12TH BOARD %" value={selectedStudent.twelfthPercentage} />
                      <AiryDataItem label="10TH YEAR" value={selectedStudent.tenthYear} />
                      <AiryDataItem label="12TH YEAR" value={selectedStudent.twelfthYear} />
                      <AiryDataItem label="Residency Status" value={selectedStudent.isHosteller ? 'Hosteller' : 'Day Scholar'} highlight />
                    </div>
                  </section>

                  <section>
                    <AiryModalHeader title="Competitive Coding Pulse" icon="⚔️" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                      <CodingHubCard name="LeetCode" id={selectedStudent.leetcodeId} rating={selectedStudent.lcRating} total={selectedStudent.lcTotal} badges={selectedStudent.lcBadges} color="orange" />
                      <CodingHubCard name="CodeChef" id={selectedStudent.codechefId} rating={selectedStudent.ccRating} total={selectedStudent.ccTotal} badges={selectedStudent.ccBadges} color="rose" />
                      <CodingHubCard name="SkillRack" id={selectedStudent.srRank} rating={0} total={selectedStudent.srProblems} badges={0} color="blue" />
                    </div>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                       <AiryModalHeader title="Professional DNA" icon="💼" />
                       <div className="mt-6 space-y-4">
                          <div className="flex flex-wrap gap-2">
                             {selectedStudent.techStack.map(t => (
                               <span key={t} className="px-3 py-1 bg-violet-50 text-violet-700 text-[9px] font-black uppercase rounded-lg border border-violet-100">{t}</span>
                             ))}
                          </div>
                          <AiryDataItem label="Willing to Relocate" value={selectedStudent.relocate} />
                          <AiryDataItem label="Placement Category" value={selectedStudent.category} />
                       </div>
                    </div>
                    <div>
                       <AiryModalHeader title="COE Architecture" icon="🏛️" />
                       <div className="mt-6 space-y-4">
                          <AiryDataItem label="COE Node" value={selectedStudent.coeName} />
                          <AiryDataItem label="COE Incharge" value={selectedStudent.coeIncharge} />
                          <AiryDataItem label="Current Projects" value={selectedStudent.coeProjects} />
                       </div>
                    </div>
                  </section>

                  <section>
                    <AiryModalHeader title="Registry Address" icon="📍" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                      <AiryDataItem label="Current Logistics" value={selectedStudent.currentAddress} />
                      <AiryDataItem label="Permanent Registry" value={selectedStudent.permanentAddress} />
                    </div>
                  </section>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Need Updation Modal */}
      {updationModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setUpdationModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] p-10 shadow-3xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-black">🔄</div>
                   <div>
                      <h3 className="text-xl font-black uppercase text-slate-900 leading-none">Registry Sync matrix</h3>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Select fields to broadcast for updation</p>
                   </div>
                </div>
                <button onClick={() => setUpdationModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                   {['Core', 'Contact', 'Address', 'Academic', 'Coding'].map(cat => (
                     <div key={cat} className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 pb-2">{cat} sector</h4>
                        <div className="space-y-3">
                           {registryFields.filter(f => f.cat === cat).map(field => (
                             <label key={field.id} className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors">
                                <input 
                                  type="checkbox" 
                                  checked={selectedFields.includes(field.id)} 
                                  onChange={() => toggleFieldSelection(field.id)} 
                                  className="w-5 h-5 rounded border-slate-200 text-violet-600 focus:ring-violet-500/20" 
                                />
                                <span className={`text-[11px] font-black uppercase transition-colors ${selectedFields.includes(field.id) ? 'text-violet-600' : 'text-slate-500'}`}>{field.label}</span>
                             </label>
                           ))}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
             <div className="mt-10 flex gap-4">
                <button onClick={() => setUpdationModalOpen(false)} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Broadcast Sync</button>
                <button onClick={() => setUpdationModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all">Cancel</button>
             </div>
          </div>
        </div>
      )}

      {/* Prune Logic Modal */}
      {pruneModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setPruneModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-3xl max-h-[85vh] flex flex-col animate-in zoom-in-95">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl font-black">🗑️</div>
                <div>
                   <h3 className="text-xl font-black uppercase text-slate-900 leading-none">Prune Logic Nodes</h3>
                   <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-1">Select fields to remove from the registry schema</p>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-2 mb-8">
                <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Registry Logic Fields</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {registryFields.map(field => (
                      <label key={field.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group cursor-pointer border border-transparent hover:border-rose-100 transition-all">
                        <div className="flex items-center gap-4">
                           <input 
                              type="checkbox" 
                              checked={selectedFields.includes(field.id)} 
                              onChange={() => toggleFieldSelection(field.id)} 
                              className="w-5 h-5 rounded border-slate-200 text-rose-600 focus:ring-rose-500/20" 
                           />
                           <div className="flex flex-col">
                              <span className={`text-[11px] font-black uppercase transition-colors ${selectedFields.includes(field.id) ? 'text-rose-600' : 'text-slate-800'}`}>{field.label}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase">{field.cat} Hub</span>
                           </div>
                        </div>
                      </label>
                   ))}
                </div>
             </div>

             <div className="flex gap-4">
                <button onClick={() => setPruneModalOpen(false)} className="flex-1 py-5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-rose-700 active:scale-95 transition-all">Execute Pruning</button>
                <button onClick={() => setPruneModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all">Cancel</button>
             </div>
          </div>
        </div>
      )}

      {/* Dynamic Inject Modal */}
      {injectModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setInjectModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2rem] p-8 shadow-3xl flex flex-col border border-violet-100 animate-in zoom-in-95">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center text-2xl font-black">+</div>
                <div>
                   <h3 className="text-lg font-black uppercase text-slate-900 leading-none">Dynamic Inject</h3>
                   <p className="text-[8px] font-black text-violet-400 uppercase tracking-widest mt-1">Append New Logic Node</p>
                </div>
             </div>
             <div className="space-y-2 mb-8">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Descriptor Name</label>
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
                       setRegistryFields(prev => [...prev, { id: newFieldName.toLowerCase().replace(/\s/g, '_'), label: newFieldName.toUpperCase(), cat: 'Custom' }]);
                       setInjectModalOpen(false);
                       setNewFieldName('');
                    }
                  }} 
                  disabled={!newFieldName.trim()} 
                  className="flex-1 py-4 bg-violet-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-violet-700 active:scale-95 disabled:opacity-50"
                >
                  Confirm
                </button>
                <button onClick={() => setInjectModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 active:scale-95">Cancel</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AiryStatCard: React.FC<{ label: string; value: string; sub: string; icon: string; color: string }> = ({ label, value, sub, icon, color }) => {
  const styles = { 
    purple: 'bg-violet-50 text-violet-600 border-violet-100', 
    blue: 'bg-blue-50 text-blue-600 border-blue-100', 
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100' 
  }[color as 'purple' | 'blue' | 'green'];
  
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
       <div className="flex justify-between items-start mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border ${styles}`}>{icon}</div>
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{label}</span>
       </div>
       <div>
          <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter">{value}</p>
          <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{sub}</p>
       </div>
    </div>
  );
};

const BrandedButton: React.FC<{ label: string; href: string; icon: React.ReactNode; color: string }> = ({ label, href, icon, color }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer"
    className={`w-full ${color} p-4 rounded-2xl flex items-center gap-4 text-white transition-all hover:scale-[1.02] active:scale-95 group shadow-lg shadow-black/5`}
  >
    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </a>
);

const CodingHubCard: React.FC<{ name: string; id: string; rating: number; total: number; badges: number; color: string }> = ({ name, id, rating, total, badges, color }) => {
  const themes = {
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100'
  }[color as 'orange' | 'rose' | 'blue'];

  return (
    <div className={`p-5 rounded-2xl border ${themes} flex flex-col justify-between`}>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest">{name}</h4>
        <span className="text-[9px] font-black bg-white/50 px-2 py-0.5 rounded-lg border border-current opacity-60 truncate max-w-[100px]">{id}</span>
      </div>
      <div>
        <p className="text-xl font-black tabular-nums">{rating || 'N/A'}</p>
        <p className="text-[8px] font-black opacity-60 uppercase tracking-tighter">Rating Index</p>
      </div>
      <div className="flex justify-between mt-4 pt-4 border-t border-current/10">
        <div><p className="text-[10px] font-black">{total}</p><p className="text-[7px] uppercase font-black opacity-40">Problems</p></div>
        <div><p className="text-[10px] font-black">{badges}</p><p className="text-[7px] uppercase font-black opacity-40">Badges</p></div>
      </div>
    </div>
  );
};

const AirySortBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border ${active ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-900/10' : 'bg-white text-slate-400 border-slate-200 hover:text-violet-600'}`}>{children}</button>
);

const AiryCommandBtn: React.FC<{ label: string; icon: string; sub: string; color: string; onClick?: () => void }> = ({ label, icon, sub, color, onClick }) => (
  <button onClick={onClick} className={`w-full ${color} p-4 rounded-2xl flex items-center gap-4 text-white transition-all hover:scale-[1.02] active:scale-95 group shadow-lg`}>
    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg">{icon}</div>
    <div className="text-left overflow-hidden">
      <p className="text-[11px] font-black uppercase leading-none truncate">{label}</p>
      <p className="text-[8px] opacity-60 font-black mt-1 uppercase">{sub}</p>
    </div>
  </button>
);

const AiryModalHeader: React.FC<{ title: string; icon: string }> = ({ title, icon }) => (
  <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
    <span className="text-xl">{icon}</span>
    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{title}</h4>
  </div>
);

const AiryDataItem: React.FC<{ label: string; value: string | number; highlight?: boolean; large?: boolean }> = ({ label, value, highlight, large }) => (
  <div className="flex flex-col min-w-0">
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{label}</span>
    <span className={`font-black tracking-tight leading-none break-words ${large ? 'text-2xl' : 'text-[11px]'} ${highlight ? 'text-violet-600' : 'text-slate-900'}`}>{value || '-'}</span>
  </div>
);
