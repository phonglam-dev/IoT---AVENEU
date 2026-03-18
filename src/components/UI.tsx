import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ScadaPanel: React.FC<{ 
  children?: React.ReactNode, 
  className?: string, 
  title?: string,
  status?: 'NORMAL' | 'WARNING' | 'ALARM' | 'OFFLINE',
  isInset?: boolean,
  onClick?: () => void
}> = ({ children, className, title, status, isInset, onClick }) => {
  const statusGlows = {
    NORMAL: "hover:shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:border-scada-blue/40",
    WARNING: "shadow-[0_0_10px_rgba(255,255,0,0.1)] border-scada-yellow/30 hover:shadow-[0_0_15px_rgba(255,255,0,0.2)] hover:border-scada-yellow/50",
    ALARM: "shadow-[0_0_12px_rgba(255,49,49,0.15)] border-scada-red/40 hover:shadow-[0_0_20px_rgba(255,49,49,0.25)] hover:border-scada-red/60",
    OFFLINE: "opacity-60"
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "border border-scada-border bg-scada-panel p-4 flex flex-col transition-all duration-300 group relative",
        "panel-corner panel-corner-tl panel-corner-tr panel-corner-bl panel-corner-br",
        "hover:-translate-y-0.5 hover:scale-[1.005]",
        onClick && "cursor-pointer",
        isInset && "shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] bg-scada-bg/30",
        status && statusGlows[status],
        !status && "hover:shadow-[0_0_15px_rgba(0,229,255,0.1)] hover:border-scada-blue/30",
        className
      )}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-scada-border mb-4 pb-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-scada-grey font-bold flex items-center gap-2 group-hover:text-scada-text transition-colors">
            <div className={cn(
              "w-1 h-3 transition-colors",
              status === 'ALARM' ? "bg-scada-red" : status === 'WARNING' ? "bg-scada-yellow" : "bg-scada-blue/50 group-hover:bg-scada-blue"
            )} />
            {title}
          </div>
          <div className="flex gap-1.5">
            <div className="w-1 h-1 bg-scada-border rounded-full group-hover:bg-scada-blue/30 transition-colors" />
            <div className="w-1 h-1 bg-scada-border rounded-full group-hover:bg-scada-blue/30 transition-colors" />
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};

export const ScadaValue = ({ label, value, unit, color, status }: { label: string, value: string | number, unit?: string, color?: string, status?: 'NORMAL' | 'WARNING' | 'ALARM' }) => {
  const statusColor = status === 'ALARM' ? 'text-scada-red glow-red' : status === 'WARNING' ? 'text-scada-yellow' : color === 'green' ? 'text-scada-green glow-green' : color === 'blue' ? 'text-scada-blue glow-blue' : 'text-scada-blue';
  
  return (
    <div className="flex justify-between items-baseline gap-4 border-b border-scada-border/20 py-2 group/value hover:bg-white/5 transition-colors px-1">
      <span className="text-[10px] text-scada-grey uppercase tracking-wider group-hover/value:text-scada-text transition-colors">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className={cn("text-xl font-bold leading-none tracking-tight", statusColor, status === 'ALARM' && "blink")}>
          {value}
        </span>
        {unit && <span className="text-[9px] text-scada-grey font-medium">{unit}</span>}
      </div>
    </div>
  );
};

export const ScadaButton: React.FC<{ 
  children: React.ReactNode, 
  onClick?: () => void, 
  className?: string, 
  variant?: 'primary' | 'danger' | 'ghost' | 'outline'
}> = ({ children, onClick, className, variant = 'primary' }) => {
  const variants = {
    primary: 'bg-scada-blue/10 border-scada-blue/50 text-scada-blue hover:bg-scada-blue/20',
    danger: 'bg-scada-red/10 border-scada-red/50 text-scada-red hover:bg-scada-red/20',
    ghost: 'bg-transparent border-transparent text-scada-grey hover:text-scada-text',
    outline: 'bg-transparent border-scada-border text-scada-grey hover:border-scada-blue hover:text-scada-blue'
  };

  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-2 border text-[11px] font-bold transition-all duration-200 flex items-center gap-2 active:scale-95",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

export const Modal: React.FC<{
  isOpen: boolean,
  onClose: () => void,
  title: string,
  children: React.ReactNode
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        "relative w-full max-w-2xl bg-scada-panel border border-scada-border shadow-2xl flex flex-col max-h-[90vh]",
        "panel-corner panel-corner-tl panel-corner-tr panel-corner-bl panel-corner-br"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-scada-border">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-4 bg-scada-blue" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-scada-text">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-scada-grey hover:text-scada-text transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-auto">
          {children}
        </div>
        <div className="p-4 border-t border-scada-border flex justify-end">
          <ScadaButton onClick={onClose} variant="outline">CLOSE</ScadaButton>
        </div>
      </div>
    </div>
  );
};

export const ScadaInput = ({ label, value, onChange, unit }: { label: string, value: number, onChange: (val: number) => void, unit?: string }) => (
  <div className="flex items-center justify-between gap-2 py-1">
    <span className="text-[10px] text-scada-grey uppercase">{label}</span>
    <div className="flex items-center gap-1">
      <input 
        type="number" 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 bg-scada-bg border border-scada-border text-scada-blue text-[11px] px-1 py-0.5 focus:outline-none focus:border-scada-blue"
      />
      {unit && <span className="text-[9px] text-scada-grey">{unit}</span>}
    </div>
  </div>
);

export const StatusIndicator = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    NORMAL: 'bg-scada-green shadow-[0_0_8px_rgba(0,255,0,0.5)]',
    COMM_LOSS: 'bg-scada-red shadow-[0_0_8px_rgba(255,0,0,0.5)]',
    WARNING: 'bg-scada-yellow shadow-[0_0_8px_rgba(255,255,0,0.5)]',
    ALARM: 'bg-scada-red shadow-[0_0_8px_rgba(255,0,0,0.5)] blink',
    OFFLINE: 'bg-scada-grey',
  };
  return <div className={cn("w-3 h-3 border border-black/50", colors[status] || 'bg-scada-grey')} />;
};
