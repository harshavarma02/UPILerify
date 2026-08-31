'use client';

import React from 'react';
import { BrandMarkSvg } from './BrandMarkSvg';

export interface BrandAnatomySvgProps {
  theme?: 'light' | 'dark';
  className?: string;
}

/**
 * BrandAnatomySvg
 * Interactive vector deconstruction showing the mathematical formula:
 * U (Unified) + ▶ (UPI Payments) + ✔ (Verify / Confirm) = 3D U-Ribbon Mark.
 */
export function BrandAnatomySvg({
  theme = 'light',
  className = '',
}: BrandAnatomySvgProps) {
  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-slate-100' : 'text-[#0A0F1D]';
  const subColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200';
  const symbolColor = isDark ? 'text-slate-500' : 'text-slate-400';

  return (
    <div
      className={`w-full p-6 sm:p-8 rounded-3xl border shadow-sm flex flex-col items-center gap-6 ${cardBg} ${className}`}
    >
      <div className="text-center space-y-1">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#00D2FF]">
          Logo Construction Geometry
        </span>
        <h4 className={`text-lg sm:text-xl font-extrabold ${textColor}`}>
          The Unified Verification Equation
        </h4>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2">
        {/* 1. Element: U (Unified) */}
        <div className="flex flex-col items-center gap-2 text-center min-w-[70px]">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0A0F1D]/5 dark:bg-white/5 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center">
            <span className={`font-mono text-2xl sm:text-3xl font-extrabold ${textColor}`}>
              U
            </span>
          </div>
          <span className={`text-xs font-bold ${textColor}`}>Unified</span>
          <span className={`text-[10px] font-mono ${subColor}`}>Foundation</span>
        </div>

        {/* Plus Symbol */}
        <span className={`text-2xl font-bold ${symbolColor}`}>+</span>

        {/* 2. Element: ▶ (UPI Velocity) */}
        <div className="flex flex-col items-center gap-2 text-center min-w-[70px]">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#00D2FF]/10 border border-[#00D2FF]/30 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-7 h-7 fill-[#00D2FF]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M 6 4 L 20 12 L 6 20 Z" />
            </svg>
          </div>
          <span className={`text-xs font-bold ${textColor}`}>UPI</span>
          <span className={`text-[10px] font-mono ${subColor}`}>Velocity</span>
        </div>

        {/* Plus Symbol */}
        <span className={`text-2xl font-bold ${symbolColor}`}>+</span>

        {/* 3. Element: ✔ (Verify / Confirm) */}
        <div className="flex flex-col items-center gap-2 text-center min-w-[70px]">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#70F818]/15 border border-[#70F818]/40 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-7 h-7 stroke-[#16A34A] dark:stroke-[#70F818] fill-none stroke-[3] stroke-linecap-round stroke-linejoin-round"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className={`text-xs font-bold ${textColor}`}>Verify</span>
          <span className={`text-[10px] font-mono ${subColor}`}>Mailbox Match</span>
        </div>

        {/* Equals Symbol */}
        <span className={`text-2xl font-bold ${symbolColor}`}>=</span>

        {/* 4. Element: 3D Ribbon Mark (Result) */}
        <div className="flex flex-col items-center gap-2 text-center min-w-[90px]">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-cyan-500/30 shadow-[0_0_20px_rgba(0,210,255,0.25)] flex items-center justify-center p-2">
            <BrandMarkSvg size={54} />
          </div>
          <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00D2FF] to-[#70F818]">
            3D U-Ribbon
          </span>
          <span className={`text-[10px] font-mono ${subColor}`}>Master Emblem</span>
        </div>
      </div>
    </div>
  );
}
