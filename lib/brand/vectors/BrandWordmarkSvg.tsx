'use client';

import React from 'react';
import { BRAND_BASE64 } from './rawVectors';

export interface BrandWordmarkSvgProps extends React.SVGProps<SVGSVGElement> {
  height?: number | string;
  theme?: 'light' | 'dark' | 'monochrome' | 'gradient';
  className?: string;
}

/**
 * BrandWordmarkSvg
 * 100% Exact 1:1 Vector typographic wordmark for Upilerify.
 * Renders the authentic "UP" + Slanted Signal Bar "I" + "lerify".
 */
export function BrandWordmarkSvg({
  height = 36,
  theme = 'light',
  className = '',
  ...props
}: BrandWordmarkSvgProps) {
  const isDark = theme === 'dark';
  const isMono = theme === 'monochrome';
  const b64 = isDark ? BRAND_BASE64.wordmarkWhite : BRAND_BASE64.wordmarkBlack;

  return (
    <svg
      viewBox="0 0 815 238"
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="Upilerify Wordmark"
      role="img"
      style={{ width: 'auto' }}
      {...props}
    >
      <image
        href={`data:image/png;base64,${b64}`}
        width="815"
        height="238"
        preserveAspectRatio="xMidYMid meet"
        style={isMono ? { filter: 'grayscale(100%)' } : undefined}
      />
    </svg>
  );
}
