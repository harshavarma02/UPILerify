'use client';

import React from 'react';

export interface BrandDividerProps {
  variant?: 'line' | 'arc' | 'nodes' | 'gradient';
  className?: string;
}

export function BrandDivider({
  variant = 'line',
  className = '',
}: BrandDividerProps) {
  if (variant === 'gradient') {
    return (
      <div
        className={`w-full h-[1px] bg-gradient-to-r from-transparent via-brand-cyan/35 to-transparent my-8 ${className}`}
      />
    );
  }

  if (variant === 'nodes') {
    return (
      <div className={`w-full flex items-center justify-center gap-3 my-8 ${className}`}>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-border"></div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-lime"></span>
          <span className="w-6 h-[1px] bg-border"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan"></span>
          <span className="w-6 h-[1px] bg-border"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-blue"></span>
        </div>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-border"></div>
      </div>
    );
  }

  if (variant === 'arc') {
    return (
      <div className={`w-full flex justify-center overflow-hidden my-12 pointer-events-none ${className}`}>
        <svg
          viewBox="0 0 1200 60"
          className="w-full max-w-5xl h-8 stroke-border fill-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 30 Q 300 0, 600 30 T 1200 30"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="stroke-brand-cyan/30"
          />
          <circle cx="600" cy="30" r="4" className="fill-brand-lime" />
          <circle cx="300" cy="15" r="3" className="fill-brand-cyan" />
          <circle cx="900" cy="45" r="3" className="fill-brand-blue" />
        </svg>
      </div>
    );
  }

  // Default clean line
  return <div className={`w-full border-b border-border my-6 ${className}`} />;
}
