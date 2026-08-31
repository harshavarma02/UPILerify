'use client';

import React from 'react';
import { BRAND_BASE64 } from './rawVectors';

export interface BrandMarkSvgProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  variant?: 'full-color' | 'monochrome' | 'outline' | 'glow';
  className?: string;
}

/**
 * BrandMarkSvg
 * 100% Exact 1:1 Vector primitive for the 3D U-Ribbon Logo Mark.
 * Scales smoothly without layout shift across any resolution.
 */
export function BrandMarkSvg({
  size = 48,
  variant = 'full-color',
  className = '',
  ...props
}: BrandMarkSvgProps) {
  const isMono = variant === 'monochrome';

  return (
    <svg
      viewBox="0 0 238 238"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="Upilerify 3D Ribbon Mark"
      role="img"
      {...props}
    >
      <image
        href={`data:image/png;base64,${BRAND_BASE64.mark}`}
        width="238"
        height="238"
        preserveAspectRatio="xMidYMid meet"
        style={isMono ? { filter: 'grayscale(100%) brightness(0)' } : undefined}
      />
    </svg>
  );
}
