
import React from 'react';

// MACRO: Títulos limpos e escuros
export const MacroTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h1 className={`text-2xl md:text-4xl font-bold tracking-tight text-gray-900 font-display ${className}`}>
    {children}
  </h1>
);

// MICRO: Etiquetas sutis com leve degradê no texto ou fundo
export const MicroLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span className={`text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent mb-1 block ${className}`}>
    {children}
  </span>
);

// MESO: Leitura confortável
export const MesoText: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-600 leading-relaxed ${className}`}>
    {children}
  </p>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseClass = "px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 active:scale-95";
  
  const variants = {
    primary: "bg-gradient-to-br from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/20 border-transparent",
    secondary: "bg-white text-brand-600 hover:bg-brand-50 border border-brand-100 shadow-sm",
    ghost: "bg-transparent text-gray-500 hover:text-brand-600 hover:bg-gray-100"
  };

  return (
    <button className={`${baseClass} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-3xl shadow-sm border border-gray-100 p-6 ${className}`}>
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-semibold text-gray-600 ml-1">{label}</label>
    <input 
      className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:bg-white outline-none transition-all placeholder:text-gray-400 font-medium"
      {...props}
    />
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; active?: boolean }> = ({ children, active = false }) => {
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${active ? 'bg-gradient-to-r from-brand-50 to-white border-brand-200 text-brand-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
      {children}
    </span>
  );
};
