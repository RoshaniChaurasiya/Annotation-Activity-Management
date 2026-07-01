import React from "react";

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function Panel({ children, className = "", hoverable = false, ...props }: PanelProps) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-slate-900/70 shadow-[0_16px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl ${hoverable ? "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(2,6,23,0.45)]" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
