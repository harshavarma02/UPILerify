'use client';

import React from 'react';
import Link from 'next/link';
import { BrandLockupSvg } from '../vectors/BrandLockupSvg';
import { BrandMarkSvg } from '../vectors/BrandMarkSvg';
import { BRAND } from '../tokens';

export interface BrandLogoProps {
  variant?: 'horizontal' | 'icon' | 'stacked' | 'wordmark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark' | 'monochrome' | 'gradient';
  className?: string;
  showMotto?: boolean;
  linkToHome?: boolean;
}

/**
 * BrandLogo
 * Master logo component for Upilerify.
 * Powered by pure, crisp SVG vector primitives for zero-layout-shift,
 * infinite 4K resolution clarity, and responsive theme adaptability.
 */
export function BrandLogo({
  variant = 'horizontal',
  size = 'md',
  theme = 'light',
  className = '',
  showMotto = false,
  linkToHome = false,
}: BrandLogoProps) {
  let content: React.ReactNode;

  if (variant === 'icon') {
    const iconSizeMap = { sm: 32, md: 42, lg: 56, xl: 74 };
    content = (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
        <BrandMarkSvg
          size={iconSizeMap[size]}
          variant={theme === 'monochrome' ? 'monochrome' : 'full-color'}
        />
      </div>
    );
  } else if (variant === 'wordmark') {
    content = (
      <BrandLockupSvg
        layout="wordmark-only"
        size={size}
        theme={theme}
        className={className}
      />
    );
  } else if (variant === 'stacked') {
    content = (
      <BrandLockupSvg
        layout="stacked"
        size={size}
        theme={theme}
        showMotto={showMotto}
        className={className}
      />
    );
  } else {
    // Primary Horizontal
    content = (
      <BrandLockupSvg
        layout="horizontal"
        size={size}
        theme={theme}
        showMotto={showMotto}
        className={className}
      />
    );
  }

  if (linkToHome) {
    return (
      <Link
        href="/"
        className="inline-block transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
        aria-label={`${BRAND.name} Home`}
      >
        {content}
      </Link>
    );
  }

  return <>{content}</>;
}
