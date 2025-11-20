import React from 'react';

export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'default',
  className = '',
  disabled = false,
  fullWidth = false
}: { 
  children?: React.ReactNode; 
  onClick?: React.MouseEventHandler<HTMLButtonElement>; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'; 
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";
  
  const sizes = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-12 px-8 text-lg",
    icon: "h-10 w-10"
  };

  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 dark:bg-primary-600 dark:hover:bg-primary-700",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700",
    outline: "border border-slate-200 bg-transparent hover:bg-slate-100 text-slate-900 dark:border-slate-800 dark:text-slate-50 dark:hover:bg-slate-800",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export const Input = ({
  value,
  onChange,
  placeholder,
  className = "",
  icon,
  onClick
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLInputElement>;
}) => {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>
      )}
      <input
        type="text"
        value={value}
        onChange={onChange}
        onClick={onClick}
        placeholder={placeholder}
        className={`w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 ${icon ? 'pl-10' : ''} ${className}`}
      />
    </div>
  );
};

export const Textarea = ({
  value,
  onChange,
  placeholder,
  className = "",
  rows = 4
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 ${className}`}
    />
  );
};

export const Select = ({
  value,
  onChange,
  options,
  className = ""
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { label: string; value: string }[];
  className?: string;
}) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={`w-full h-10 appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 ${className}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
};

export const Badge = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:border-slate-800 dark:focus:ring-slate-300 ${className}`}>
    {children}
  </span>
);

export const Card = ({ children, className = "", onClick }: { children?: React.ReactNode; className?: string, onClick?: () => void, key?: React.Key }) => (
  <div 
    onClick={onClick}
    className={`rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 ${onClick ? 'cursor-pointer hover:shadow-md transition-all' : ''} ${className}`}
  >
    {children}
  </div>
);