
import React from 'react';

export const Input: React.FC<{
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  icon?: React.ReactNode;
}> = ({ label, type, placeholder, value, onChange, icon }) => (
  <div className="space-y-1.5 group">
    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-focus-within:text-violet-600 transition-colors duration-300">
      {label}
    </label>
    <div className="relative transform transition-all duration-300 ease-out">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-violet-300 group-focus-within:text-violet-600 transition-colors duration-300">
        {icon}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50/80 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 transition-all hover:bg-white text-sm"
      />
    </div>
  </div>
);

export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  type?: 'button' | 'submit';
}> = ({ children, onClick, loading, variant = 'primary', type = 'button' }) => {
  const base = "w-full py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] focus:outline-none";
  const variants = {
    primary: "bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-900/10 hover:shadow-violet-900/20 hover:-translate-y-0.5",
    secondary: "bg-white hover:bg-slate-50 text-violet-600 border border-slate-200 shadow-sm",
    ghost: "bg-transparent hover:bg-violet-50 text-violet-600"
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={loading}
      className={`${base} ${variants[variant]} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : children}
    </button>
  );
};

export const Logo: React.FC = () => (
  <div className="flex items-center gap-3 mb-2 justify-center group cursor-default">
    <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-800 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/20 transition-transform duration-500 group-hover:rotate-6">
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
    <div className="flex flex-col text-left">
      <span className="text-2xl font-black tracking-tighter leading-none text-slate-800">
        A.R.C.
      </span>
    </div>
  </div>
);
