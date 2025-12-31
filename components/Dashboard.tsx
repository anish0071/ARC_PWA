
import React, { useState, useMemo } from 'react';
import { StudentRecord, UserState } from '../types';
import { Logo, Input, Button } from './UI';

const RAW_DATA: Record<string, [string, string][]> = {
  "A": [["24CS0001", "A GAYATHIRIDEVI"], ["24CS0002", "A LOGESSH"], ["24CS0003", "A MOHITHA"], ["24CS0004", "A NEHASHREE"], ["24CS0005", "A RAMKARTHICK"], ["24CS0006", "A SAJITHA YASMEEN"], ["24CS0007", "A SAMYUKTA"], ["24CS0008", "A SHALINI"], ["24CS0009", "A SHREE KAILASH"], ["24CS0011", "AADHIRSHA S"], ["24CS0013", "AARTHI M"], ["24CS0014", "ABDUL KASIM R"], ["24CS0016", "ABHINAV B M"], ["24CS0017", "ABHINETHRA A"], ["24CS0018", "ABHISHEK KUMAR SARAVANAKUMAR AMBIKA"], ["24CS0019", "ABHISHEK R"], ["24CS0022", "ABIKSHA T"], ["24CS0025", "ABINAYA PRABHAKARAN"], ["24CS0026", "ABINAYA V"], ["24CS0029", "ADHITTYAKARAN R G"], ["24CS0030", "ADISH M"], ["24CS0033", "AHANURUDHA S"], ["24CS0035", "AJAY S"], ["24CS0037", "AKASH ARUL KUMAR"], ["24CS0039", "AKASH M S"], ["24CS0041", "AKHIL S"], ["24CS0042", "AKHILAN R S"], ["24CS0044", "AKILAN PANDIAN D"], ["24CS0045", "AKILLESH K P"], ["24CS0050", "AMARNATH SIVASHANKAR"], ["24CS0051", "AMIRDHA VARSHINI R"], ["24CS0052", "AMIRTHAVARSHINI S"], ["24CS0059", "ANBUCHELVAN GANESAN"], ["24CS0060", "ANGELENA PRINCESS S"], ["24CS0061", "ANGELINE STEVE S"], ["24CS0064", "ANISH V"], ["24CS0066", "ANJALI R"], ["24CS0067", "ANTHONY VIMAL PRINCE J"], ["24CS0093", "ASHWANTH A S"], ["24CS0182", "DEVA PRASHANTH KP"], ["24CS0372", "JEEVAN SRI M"], ["24CS0590", "NAVEENKUMAR T S"], ["24CS0592", "NERESH KUMAR A"], ["24CS0677", "PREMKUMAR M"], ["24CS0716", "RAGHAV A"], ["24CS0717", "RAGHAV BALAJI R"], ["24CS0718", "RAGUL KRISHNA K G"], ["24CS0719", "RAGUL L"], ["24CS0723", "RAJASRI D"], ["24CS0725", "RAJESHWARI V"], ["24CS0726", "RAKESH A"], ["24CS0727", "RAKESH S"], ["24CS0728", "RAKSHANA E"], ["24CS0729", "RAKSHINI R"], ["24CS0731", "RAVIKUMAR G"], ["24CS0733", "REHMAAN I R A"], ["24CS0734", "RENALD ROSHAN A"], ["24CS0735", "RESHEEBA R"], ["24CS0736", "RESHEKA R K"], ["24CS0738", "REVATHY S"], ["24CS0742", "RICHARD RUBAN KUMAR R"], ["24CS3011", "KRISHNA K"], ["24CS3012", "KRITHIKESH S"], ["24CS3013", "MANIKANDAN S"], ["24CS3017", "ROOPAN KUMAR"], ["24CS3022", "SRINATH K"]],
  "B": [["24CS0069", "ANUPRIYA S"], ["24CS0070", "ANUSH B"], ["24CS0071", "ANUSHKA N H"], ["24CS0073", "ANUSHRI A"], ["24CS0075", "APARAAJIT AATHIYAN Y A"], ["24CS0078", "ARCHANA L"], ["24CS0079", "ARCHITA J B"], ["24CS0080", "ARJUN M"], ["24CS0082", "ARNOLD JOAN A"], ["24CS0083", "AROCKIA ADIL ROONEY J"], ["24CS0084", "ARUL MURUGAN M"], ["24CS0085", "ARULNATHAN M"]],
  "Q": [["24CS0801", "AISWARYA M"], ["24CS0802", "AKASSHKUMAR SUGUMAR"], ["24CS0803", "AKSHAYAKUMARAN A"], ["24CS0804", "ANISH MUTHUKRISHNAN"], ["24CS0805", "B AKSHAYA"]]
};

const INITIAL_FIELD_GROUPS: Record<string, string[]> = {
  "Core Profile": ["REG NO", "NAME", "DEPT", "YEAR", "SECTION", "GENDER", "MOBILE NO", "ALT MOBILE NO", "OFFICIAL MAIL", "EMAIL"],
  "Identity & Residence": ["CURRENT ADDRESS", "PERMANENT ADDRESS", "PINCODE", "STATE", "AADHAR NO", "PAN NO", "FATHER NAME", "MOTHER NAME"],
  "Academic Matrix": ["10TH BOARD %", "12TH BOARD %", "10TH YEAR", "12TH YEAR", "GPA SEM1", "GPA SEM2", "GPA SEM3", "CGPA (3 sem)"],
  "Coding & Career": ["KNOWN TECH STACK", "RESUME LINK", "WILLING TO RELOCATE", "PLACEMENT/HS", "COMPANY/OFFER LINK", "LEETCODE ID", "LC TOTAL", "LC EASY", "LC MED", "LC HARD", "LC RATING", "LC BADGES", "LC MAX", "CODECHEF ID", "CC TOTAL", "CC RANK", "CC BADGES", "CC RATING", "SR PROBLEMS", "SR RANK", "GITHUB ID", "LINKEDIN"],
  "Center of Excellence": ["COE NAME", "COE INCHARGE", "COE PROJECTS"]
};

const generateStudentFromBase = (regNo: string, name: string, section: string): StudentRecord => {
  const seed = parseInt(regNo.replace(/\D/g, '')) || Math.abs(name.split('').reduce((a,b) => (a<<5)-a+b.charCodeAt(0), 0));
  const gender = seed % 2 === 0 ? 'F' : 'M';
  const gpaBase = 7.0 + (seed % 300) / 100;
  const isHosteller = seed % 3 === 0;
  
  return {
    id: regNo, regNo, name, dept: 'CSE', year: 2024, section, gender,
    isHosteller,
    mobile: `9${(seed * 77) % 999999999}`.padEnd(10, '0'),
    altMobile: `8${(seed * 33) % 999999999}`.padEnd(10, '0'),
    officialEmail: `${name.toLowerCase().replace(/\s/g, '')}.cse2024@citchennai.net`,
    personalEmail: `${name.toLowerCase().split(' ')[0]}${seed % 100}@gmail.com`,
    currentAddress: `${(seed % 500) + 1} Phase-II, CIT Heights`,
    permanentAddress: `Main Road, Tamil Nadu`,
    pincode: `600${(seed % 100) + 10}`.padEnd(6, '0'),
    state: 'TN',
    aadhar: `34${(seed * 123) % 999999999}`.padEnd(12, '0'),
    pan: `ABCDE${(seed % 9999)}F`,
    fatherName: `${name.split(' ').slice(-1)} Senior`,
    motherName: `Mrs. ${name.split(' ').slice(-1)}`,
    tenthPercentage: 85 + (seed % 15), twelfthPercentage: 80 + (seed % 18),
    tenthYear: '2022', twelfthYear: '2024',
    gpaSem1: gpaBase, gpaSem2: Math.min(10, gpaBase + 0.2), gpaSem3: Math.min(10, gpaBase - 0.1),
    cgpaOverall: Math.min(10, gpaBase + 0.05),
    techStack: ['SDE', 'FSD', 'ML'].slice(0, (seed % 3) + 1),
    resumeUrl: '#', relocate: 'Chennai, Bangalore', category: 'Placement',
    placementStatus: seed % 5 === 0 ? 'TCS Ninja' : 'Eligible',
    leetcodeId: name.toLowerCase().replace(/\s/g, ''),
    lcTotal: 200 + (seed % 400), lcEasy: 100 + (seed % 150), lcMed: 80 + (seed % 150),
    lcHard: 20 + (seed % 100), lcRating: 1400 + (seed % 600), lcBadges: seed % 6, lcMax: 1800 + (seed % 500),
    codechefId: `${name.toLowerCase().split(' ')[0]}_cc`,
    ccTotal: 100 + (seed % 300), ccRank: `${10000 + (seed % 50000)}`, ccBadges: seed % 4,
    ccRating: 1000 + (seed % 800), srProblems: 100 + (seed % 500), srRank: `${seed % 2000}`,
    github: `https://github.com/${name.toLowerCase().replace(/\s/g, '')}`,
    linkedin: `https://linkedin.com/in/${name.toLowerCase().replace(/\s/g, '')}`,
    initials: name[0], coeName: 'Full Stack Development', coeIncharge: 'Dr. Pavitra S',
    coeProjects: 'Smart Reporting System, Auth Protocol'
  };
};

const BATCH_SIZE = 15;

export const Dashboard: React.FC<{ user: UserState; onLogout: () => void; sectionName?: string; onBack?: () => void }> = ({ user, onLogout, sectionName = 'Q', onBack }) => {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [sortField, setSortField] = useState<keyof StudentRecord>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [profileOpen, setProfileOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(BATCH_SIZE);
  const [updationModalOpen, setUpdationModalOpen] = useState(false);
  const [injectModalOpen, setInjectModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [fieldGroups, setFieldGroups] = useState(INITIAL_FIELD_GROUPS);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldCategory, setNewFieldCategory] = useState(Object.keys(INITIAL_FIELD_GROUPS)[0]);

  const students = useMemo(() => {
    const rawList = RAW_DATA[sectionName] || [];
    return rawList.map(([reg, name]) => generateStudentFromBase(reg, name, sectionName));
  }, [sectionName]);

  const filteredAndSortedStudents = useMemo(() => {
    let result = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.regNo.includes(search));
    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') return sortDirection === 'asc' ? valA - valB : valB - valA;
      return sortDirection === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
    return result;
  }, [students, search, sortField, sortDirection]);

  const aggregates = useMemo(() => {
    if (students.length === 0) return { cgpa: '0.00', lc: '0 / 0', residency: '0 / 0' };
    const avgCgpa = students.reduce((acc, s) => acc + s.cgpaOverall, 0) / students.length;
    const avgLc = Math.round(students.reduce((acc, s) => acc + s.lcTotal, 0) / students.length);
    const avgRating = Math.round(students.reduce((acc, s) => acc + s.lcRating, 0) / students.length);
    const hostellers = students.filter(s => s.isHosteller).length;
    return { 
      cgpa: avgCgpa.toFixed(2), 
      lc: `${avgLc} / ${avgRating}`, 
      residency: `${hostellers} Host / ${students.length - hostellers} Day` 
    };
  }, [students]);

  const toggleSort = (field: keyof StudentRecord) => {
    if (sortField === field) setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDirection('desc'); }
  };

  const handleInjectField = () => {
    if (!newFieldName.trim()) return;
    setFieldGroups(prev => ({
      ...prev,
      [newFieldCategory]: [...prev[newFieldCategory], newFieldName.toUpperCase().trim()]
    }));
    setNewFieldName('');
    setInjectModalOpen(false);
  };

  const handleDeleteField = (category: string, fieldName: string) => {
    setFieldGroups(prev => ({
      ...prev,
      [category]: prev[category].filter(f => f !== fieldName)
    }));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-medium text-slate-900">
      <header className="bg-[#7c3aed] text-white p-3 shadow-lg sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
             {onBack && (
               <button onClick={onBack} className="mr-2 p-2 hover:bg-white/20 rounded-xl transition-all">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
               </button>
             )}
             <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <div>
                <h1 className="text-base font-black tracking-tight uppercase leading-none text-white">A.R.C. Command</h1>
                <p className="text-[8px] uppercase tracking-widest font-bold opacity-80 mt-1">Section {sectionName} • Advisor Node</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className="bg-white/10 border border-white/20 p-1 pr-3 rounded-xl flex items-center gap-2 hover:bg-white/20 transition-all active:scale-95">
                <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[#7c3aed] font-black text-[8px]">AD</div>
                <div className="text-left">
                  <p className="text-[8px] font-black leading-none text-white">{user.username}</p>
                  <p className="text-[7px] font-bold opacity-70 uppercase tracking-tighter mt-0.5 text-white">Authorized</p>
                </div>
                <svg className={`w-2.5 h-2.5 transition-transform text-white ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-2xl border border-slate-100 py-1 z-[60]">
                   <button onClick={onLogout} className="w-full text-left px-4 py-2 text-[8px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-colors">Log out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full p-6 gap-6 overflow-hidden">
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ExactStatCard label="AVG SECTION CGPA" value={aggregates.cgpa} subValue="Academic Health" icon="🏆" color="purple" />
            <ExactStatCard label="AVG LC PULSE (CNT/RTG)" value={aggregates.lc} subValue="Logic Pulse" icon="💻" color="blue" />
            <ExactStatCard label="RESIDENCY RATIO" value={aggregates.residency} subValue="Registry Population" icon="🏠" color="green" />
          </div>

          <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative w-full md:w-[20rem]">
                <input type="text" placeholder="Filter Identity Registry..." className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-10 pr-4 text-[10px] font-bold text-slate-800 focus:outline-none focus:border-violet-400 transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
                <svg className="w-3 h-3 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <div className="flex gap-2">
                 <SortBtn active={sortField === 'cgpaOverall'} onClick={() => toggleSort('cgpaOverall')}>CGPA Matrix</SortBtn>
                 <SortBtn active={sortField === 'lcRating'} onClick={() => toggleSort('lcRating')}>LeetCode Pulse</SortBtn>
              </div>
            </div>

            <div className="overflow-x-auto p-4">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="bg-transparent text-[8px] uppercase tracking-[0.3em] font-black text-slate-400 px-6">
                    <th className="px-6 py-2">Idx</th>
                    <th className="px-4 py-2">Reg No</th>
                    <th className="px-4 py-2">Identity Node</th>
                    <th className="px-4 py-2">GPA Index</th>
                    <th className="px-4 py-2">LC Pulse</th>
                    <th className="px-6 py-2 text-center">Authorization</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedStudents.slice(0, displayLimit).map((s, idx) => (
                    <tr key={s.regNo} onClick={() => setSelectedStudent(s)} className="group cursor-pointer bg-slate-50/50 hover:bg-white hover:scale-[1.01] hover:translate-x-1.5 hover:shadow-xl hover:shadow-indigo-900/5 transition-all duration-300 relative z-0 hover:z-10 rounded-2xl">
                      <td className="px-6 py-5 text-[8px] font-black text-indigo-300 tabular-nums first:rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100">{idx + 1}</td>
                      <td className="px-4 py-5 text-[9px] font-bold text-indigo-500/80 tabular-nums border-y border-transparent group-hover:border-slate-100">{s.regNo}</td>
                      <td className="px-4 py-5 border-y border-transparent group-hover:border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-50 flex items-center justify-center text-[11px] font-black text-violet-700 shadow-inner group-hover:rotate-6 transition-transform">{s.initials}</div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-800 transition-colors group-hover:text-violet-700">{s.name}</span>
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">{s.dept} Section {s.section}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 border-y border-transparent group-hover:border-slate-100">
                        <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black border tabular-nums transition-all ${s.cgpaOverall >= 8.5 ? 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-white text-indigo-500 border-slate-200 group-hover:border-violet-400 group-hover:text-violet-600'}`}>
                          {s.cgpaOverall.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-[10px] font-black text-blue-600 tabular-nums group-hover:scale-110 transition-transform border-y border-transparent group-hover:border-slate-100">{s.lcRating}</td>
                      <td className="px-6 py-5 text-center last:rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-100">
                         <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600 transition-colors">
                           {s.placementStatus}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {displayLimit < filteredAndSortedStudents.length && (
                <div className="mt-8 flex justify-center pb-6">
                   <button onClick={() => setDisplayLimit(p => p + BATCH_SIZE)} className="px-12 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-black active:scale-95 transition-all">Synchronize Next Batch</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="w-full lg:w-80 space-y-6 lg:mt-32">
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-8 lg:sticky lg:top-[25vh]">
            <div className="flex items-center gap-3">
               <span className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_12px_rgba(249,115,22,0.6)] animate-pulse"></span>
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-800">COMMAND CENTER</h3>
            </div>
            <div className="space-y-4">
               <CommandBtn label="NEED UPDATION" icon="🔄" sub="Request Data Sync" color="bg-indigo-600" onClick={() => setUpdationModalOpen(true)} />
               <CommandBtn label="INJECT NEW FIELD" icon="+" sub="Dynamic Expansion" color="bg-violet-600" onClick={() => setInjectModalOpen(true)} />
               <CommandBtn label="DELETE FIELD" icon="🗑️" sub="Prune Schema Nodes" color="bg-rose-600" onClick={() => setDeleteModalOpen(true)} />
            </div>
          </div>
        </aside>
      </div>

      {/* Selected Student Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl" onClick={() => setSelectedStudent(null)}></div>
          <div className="relative bg-white w-full max-w-7xl max-h-[92vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <div className="p-8 md:px-12 md:py-8 bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex justify-between items-center">
               <div className="flex items-center gap-8">
                <div className="w-20 h-20 rounded-[2rem] bg-white/10 flex items-center justify-center text-3xl font-black">{selectedStudent.initials}</div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight uppercase">{selectedStudent.name}</h2>
                  <p className="text-[10px] bg-black/30 px-3 py-1 rounded-full font-black uppercase tracking-[0.4em] mt-2 inline-block">{selectedStudent.regNo}</p>
                </div>
               </div>
               <button onClick={() => setSelectedStudent(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            <div className="p-8 md:p-12 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-10 bg-[#f8fafc] flex-1 custom-scrollbar">
               <ModalSection title="Identity" icon="👤">
                 <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4">
                   <ModalItem label="Father Name" value={selectedStudent.fatherName} />
                   <ModalItem label="Registry Mobile" value={selectedStudent.mobile} highlight />
                   <ModalItem label="Official Linked" value={selectedStudent.officialEmail} />
                   <ModalItem label="Residency Status" value={selectedStudent.isHosteller ? 'Hosteller' : 'Day Scholar'} />
                   <ModalItem label="Resident Vector" value={selectedStudent.currentAddress} />
                 </div>
               </ModalSection>
               <ModalSection title="Academic" icon="🎓">
                 <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4">
                   <ModalItem label="AGGREGATE CGPA" value={selectedStudent.cgpaOverall.toFixed(2)} highlight />
                   <ModalItem label="10th Level" value={`${selectedStudent.tenthPercentage}%`} />
                   <ModalItem label="12th Level" value={`${selectedStudent.twelfthPercentage}%`} />
                   <ModalItem label="Placement Track" value={selectedStudent.category} />
                 </div>
               </ModalSection>
               <ModalSection title="Competitive" icon="🚀">
                 <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4">
                   <ModalItem label="LC RATING" value={selectedStudent.lcRating} highlight />
                   <ModalItem label="LC SOLVED" value={selectedStudent.lcTotal} />
                   <ModalItem label="Tech Stack" value={selectedStudent.techStack.join(', ')} />
                   <ModalItem label="COE Stream" value={selectedStudent.coeName} />
                 </div>
               </ModalSection>
            </div>
          </div>
        </div>
      )}

      {/* Updation Modal (Current Schema View) */}
      {updationModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setUpdationModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30">
              <h3 className="text-xl font-black uppercase tracking-tight">Intelligence Refresh</h3>
              <button onClick={() => setUpdationModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-10 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
              {Object.entries(fieldGroups).map(([group, fields]) => (
                <div key={group}>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4">{group}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {fields.map(f => (
                      <button key={f} className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase hover:border-violet-300 hover:bg-white hover:text-violet-600 transition-all text-left">
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inject New Field Modal */}
      {injectModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setInjectModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <div className="p-8 bg-violet-600 text-white flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-widest">Inject Schema Node</h3>
              <button onClick={() => setInjectModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl">
                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 space-y-6 bg-slate-50">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Node Designation (Field Name)</label>
                  <input 
                    type="text" 
                    placeholder="E.G. HACKATHON_WINS" 
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-5 text-sm font-bold uppercase placeholder:text-slate-300 focus:outline-none focus:border-violet-500 shadow-sm"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Target Category Cluster</label>
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-5 text-sm font-bold appearance-none shadow-sm focus:outline-none focus:border-violet-500"
                    value={newFieldCategory}
                    onChange={(e) => setNewFieldCategory(e.target.value)}
                  >
                    {Object.keys(fieldGroups).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
               </div>
               <Button onClick={handleInjectField}>Confirm Node Injection</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Field Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setDeleteModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in duration-300">
            <div className="p-8 bg-rose-600 text-white flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-widest">Prune Schema Nodes</h3>
              <button onClick={() => setDeleteModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl">
                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-10 custom-scrollbar bg-slate-50 flex-1">
              {Object.entries(fieldGroups).map(([cat, fields]) => (
                <div key={cat} className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-400">{cat}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {fields.map(f => (
                      <div key={f} className="group flex items-center justify-between px-4 py-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-rose-200 transition-all">
                        <span className="text-[9px] font-black uppercase tracking-tight text-slate-700">{f}</span>
                        <button 
                          onClick={() => handleDeleteField(cat, f)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-300 hover:text-rose-600 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-white border-t border-slate-100 text-center">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Deletion is permanent within current session memory cluster.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ExactStatCard: React.FC<{ label: string; value: string; subValue: string; icon: string; color: string }> = ({ label, value, subValue, icon, color }) => {
  const c = { purple: 'text-violet-600 bg-violet-50', blue: 'text-blue-600 bg-blue-50', green: 'text-emerald-600 bg-emerald-50' }[color as 'purple' | 'blue' | 'green'] || 'text-slate-600 bg-slate-50';
  return (
    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 relative group overflow-hidden shadow-sm">
      <div className={`absolute top-6 right-8 w-12 h-12 rounded-2xl ${c} flex items-center justify-center text-2xl`}>{icon}</div>
      <div className="space-y-4">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">{label}</span>
        <div className="flex flex-col">
          <span className="text-4xl font-black tracking-tighter leading-none">{value}</span>
          <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{subValue}</span>
        </div>
      </div>
    </div>
  );
};

const SortBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${active ? 'bg-violet-600 border-violet-600 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400'}`}>{children}</button>
);

const CommandBtn: React.FC<{ label: string; icon: string; sub: string; color: string; onClick?: () => void }> = ({ label, icon, sub, color, onClick }) => (
  <button onClick={onClick} className={`w-full ${color} p-4 rounded-[1.5rem] flex items-center gap-4 transition-all hover:-translate-y-1 text-white shadow-lg`}>
    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">{icon}</div>
    <div className="text-left">
      <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
      <p className="text-[8px] font-bold opacity-60 uppercase">{sub}</p>
    </div>
  </button>
);

const ModalSection: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.4em]">{title}</h3>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const ModalItem: React.FC<{ label: string; value: string | number; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className="flex flex-col">
    <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</span>
    <span className={`text-[10px] font-bold tracking-tight ${highlight ? 'text-violet-600' : 'text-slate-800'}`}>{value !== undefined ? value : '-'}</span>
  </div>
);
