
import React from 'react';

// MACRO: Títulos limpos e escuros
export const MacroTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h1 className={`text-2xl md:text-4xl font-extrabold tracking-tight text-rc-text font-display ${className}`}>
    {children}
  </h1>
);

// MICRO: Etiquetas sutis com leve degradê no texto ou fundo
export const MicroLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span className={`text-[10px] font-bold uppercase tracking-wider text-rc-muted mb-1 block ${className}`}>
    {children}
  </span>
);

// MESO: Leitura confortável
export const MesoText: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-sm text-rc-muted leading-relaxed font-medium ${className}`}>
    {children}
  </p>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseClass = "px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 border";
  
  const variants = {
    primary: "bg-brand-500 text-white hover:bg-brand-600 border-brand-600 shadow-[var(--shadow-soft)]",
    secondary: "bg-rc-surface text-rc-text hover:bg-rc-surface3 border-rc-line shadow-[var(--shadow-soft)]",
    ghost: "bg-transparent text-rc-muted hover:text-rc-text hover:bg-rc-surface3 border-transparent"
  };

  return (
    <button className={`${baseClass} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-rc-surface rounded-xl shadow-[var(--shadow)] border border-rc-line-soft p-5 ${className}`}>
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-rc-muted ml-1 uppercase tracking-wide">{label}</label>
    <input 
      className="w-full p-3 rounded-lg border border-rc-line bg-rc-surface3 text-rc-text focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:bg-rc-surface outline-none transition-all placeholder:text-rc-soft font-semibold"
      {...props}
    />
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; active?: boolean }> = ({ children, active = false }) => {
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${active ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-rc-surface3 border-rc-line text-rc-muted'}`}>
      {children}
    </span>
  );
};
