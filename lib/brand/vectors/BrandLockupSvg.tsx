'use client';

import React from 'react';
import { BrandMarkSvg } from './BrandMarkSvg';
import { BrandWordmarkSvg } from './BrandWordmarkSvg';
import { BRAND_BASE64 } from './rawVectors';

export interface BrandLockupSvgProps {
  layout?: 'horizontal' | 'stacked' | 'mark-only' | 'wordmark-only';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark' | 'monochrome' | 'gradient';
  showMotto?: boolean;
  className?: string;
}

const SCALE_MAP = {
  sm: { width: 130, height: 28, markSize: 28, wordmarkHeight: 22, mottoClass: 'text-[9px] tracking-[0.2em]' },
  md: { width: 175, height: 38, markSize: 38, wordmarkHeight: 30, mottoClass: 'text-[10px] tracking-[0.22em]' },
  lg: { width: 230, height: 50, markSize: 50, wordmarkHeight: 40, mottoClass: 'text-xs tracking-[0.24em]' },
  xl: { width: 310, height: 68, markSize: 68, wordmarkHeight: 54, mottoClass: 'text-sm tracking-[0.26em]' },
};

/**
 * BrandLockupSvg
 * Unified lockup primitive rendering 1:1 exact combinations of the 3D U-Ribbon mark,
 * typographic wordmark, and verification motto.
 */
export function BrandLockupSvg({
  layout = 'horizontal',
  size = 'md',
  theme = 'light',
  showMotto = false,
  className = '',
}: BrandLockupSvgProps) {
  const currentScale = SCALE_MAP[size];
  const isDark = theme === 'dark';
  const isMono = theme === 'monochrome';
  const logoB64 = isDark ? BRAND_BASE64.logoWhite : BRAND_BASE64.logoBlack;

  // Mark only
  if (layout === 'mark-only') {
    return (
      <BrandMarkSvg
        size={currentScale.markSize}
        variant={isMono ? 'monochrome' : 'full-color'}
        className={className}
      />
    );
  }

  // Wordmark only
  if (layout === 'wordmark-only') {
    return (
      <BrandWordmarkSvg
        height={currentScale.wordmarkHeight}
        theme={theme}
        className={className}
      />
    );
  }

  // Stacked Layout
  if (layout === 'stacked') {
    return (
      <div className={`inline-flex flex-col items-center justify-center text-center gap-2 ${className}`}>
        <BrandMarkSvg
          size={currentScale.markSize * 1.5}
          variant={isMono ? 'monochrome' : 'full-color'}
        />
        <BrandWordmarkSvg
          height={currentScale.wordmarkHeight}
          theme={theme}
        />
        {showMotto && (
          <div
            className={`font-mono font-bold uppercase flex items-center justify-center gap-2 pt-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            } ${currentScale.mottoClass}`}
          >
            <span>VERIFY</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#70F818] inline-block shrink-0 shadow-[0_0_8px_#70F818]" />
            <span>MATCH</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D2FF] inline-block shrink-0 shadow-[0_0_8px_#00D2FF]" />
            <span>CONFIRM</span>
          </div>
        )}
      </div>
    );
  }

  // Horizontal Layout (100% 1:1 Unified Exact Vector Logo)
  return (
    <div className={`inline-flex flex-col ${className}`}>
      <svg
        viewBox="0 0 1075 238"
        width={currentScale.width}
        height={currentScale.height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 select-none"
        aria-label="Upilerify Logo"
        role="img"
      >
        <image
          href={`data:image/png;base64,${logoB64}`}
          width="1075"
          height="238"
          preserveAspectRatio="xMidYMid meet"
          style={isMono ? { filter: 'grayscale(100%)' } : undefined}
        />
      </svg>

      {showMotto && (
        <div
          className={`font-mono font-bold uppercase flex items-center justify-between gap-1.5 pt-1 px-1 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          } ${currentScale.mottoClass}`}
        >
          <span>VERIFY</span>
          <span className="w-1 h-1 rounded-full bg-[#70F818] inline-block shrink-0 shadow-[0_0_6px_#70F818]" />
          <span>MATCH</span>
          <span className="w-1 h-1 rounded-full bg-[#00D2FF] inline-block shrink-0 shadow-[0_0_6px_#00D2FF]" />
          <span>CONFIRM</span>
        </div>
      )}
    </div>
  );
}
