import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, icon, ...props }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#6b46c1] transition-colors">
          {icon}
        </div>
      )}
      <input
        {...props}
        className={`w-full py-4 ${icon ? 'pl-12' : 'pl-4'} pr-4 bg-slate-50 border-2 border-slate-100 text-slate-900 text-sm font-bold rounded-2xl focus:outline-none focus:border-[#6b46c1] focus:bg-white transition-all placeholder:text-slate-300 placeholder:font-medium`}
      />
    </div>
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, loading, ...props }) => (
  <button
    {...props}
    disabled={loading || props.disabled}
    className="w-full py-4 px-6 bg-[#6b46c1] hover:bg-[#553c9a] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-violet-200 active:scale-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
  >
    {loading ? (
      <>
        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Processing</span>
      </>
    ) : children}
  </button>
);

export const Logo: React.FC = () => (
  <div className="flex flex-col items-center justify-center">
    <div className="w-12 h-12 bg-[#6b46c1] rounded-xl flex items-center justify-center shadow-lg shadow-violet-200 mb-2">
      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
    <h1 className="text-2xl font-black text-slate-800 tracking-tighter">A.R.C.</h1>
  </div>
);
