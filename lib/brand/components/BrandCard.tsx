'use client';

import React from 'react';
import { BrandMarkSvg } from '../vectors/BrandMarkSvg';

export interface BrandCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  shimmer?: boolean;
  surface?: 'white' | 'ice' | 'muted';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  edgeEmblem?: boolean | 'top-right' | 'bottom-right';
  children: React.ReactNode;
}

const PADDING_STYLES = {
  none: '',
  sm: 'p-4 sm:p-5',
  md: 'p-6 sm:p-7',
  lg: 'p-8 sm:p-10',
  xl: 'p-10 sm:p-14',
} as const;

const SURFACE_STYLES = {
  white: 'bg-white',
  ice: 'bg-brand-surface-subtle',
  muted: 'bg-brand-surface-muted',
} as const;

export function BrandCard({
  hover = false,
  shimmer = false,
  surface = 'white',
  padding = 'md',
  edgeEmblem = false,
  children,
  className = '',
  ...props
}: BrandCardProps) {
  const padClass = PADDING_STYLES[padding];
  const surfClass = SURFACE_STYLES[surface];

  const elevationClass = hover
    ? 'shadow-brand-card transition-all duration-300 hover:-translate-y-1 hover:shadow-brand-card-hover hover:border-brand-border-hover'
    : 'shadow-brand-card';

  const shimmerClass = shimmer
    ? 'relative before:absolute before:-inset-[1px] before:rounded-[calc(var(--radius)+12px)] before:bg-gradient-to-r before:from-brand-cyan/25 before:to-brand-lime/25 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:pointer-events-none'
    : '';

  const emblemPos = edgeEmblem === true ? 'top-right' : edgeEmblem;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-border text-brand-navy ${surfClass} ${padClass} ${elevationClass} ${shimmerClass} ${className}`}
      {...props}
    >
      {/* Optional Cropped Edge Brand Emblem */}
      {emblemPos && (
        <div
          className={`absolute pointer-events-none select-none -z-0 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-300 ${
            emblemPos === 'bottom-right'
              ? '-bottom-10 -right-10 w-36 h-36 transform rotate-12'
              : '-top-10 -right-10 w-36 h-36 transform rotate-6'
          }`}
          aria-hidden="true"
        >
          <BrandMarkSvg size="100%" />
        </div>
      )}

      {/* Card Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
