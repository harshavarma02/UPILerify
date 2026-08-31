'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Loader2 } from 'lucide-react';

export interface SplitButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'midnight' | 'cyan' | 'lime' | 'white' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  target?: string;
  rel?: string;
}

const VARIANT_CONFIGS = {
  midnight: {
    pill: 'bg-[#0A0F1D] text-white group-hover:bg-[#0066FF]',
    bead: 'bg-[#0A0F1D] text-white group-hover:bg-[#0066FF]',
  },
  cyan: {
    pill: 'bg-[#00D2FF] text-[#0A0F1D] font-bold group-hover:bg-[#0066FF] group-hover:text-white',
    bead: 'bg-[#00D2FF] text-[#0A0F1D] group-hover:bg-[#0066FF] group-hover:text-white',
  },
  lime: {
    pill: 'bg-[#70F818] text-[#0A0F1D] font-bold group-hover:bg-[#00D2FF]',
    bead: 'bg-[#70F818] text-[#0A0F1D] group-hover:bg-[#00D2FF]',
  },
  white: {
    pill: 'bg-white text-[#0A0F1D] font-bold border border-slate-200/90 shadow-sm group-hover:bg-slate-100',
    bead: 'bg-white text-[#0A0F1D] border border-slate-200/90 shadow-sm group-hover:bg-slate-100',
  },
  outline: {
    pill: 'bg-transparent text-slate-700 font-semibold border border-slate-300 group-hover:bg-[#0A0F1D] group-hover:text-white group-hover:border-[#0A0F1D]',
    bead: 'bg-transparent text-slate-700 border border-slate-300 group-hover:bg-[#0A0F1D] group-hover:text-white group-hover:border-[#0A0F1D]',
  },
} as const;

const SIZE_CONFIGS = {
  sm: {
    pill: 'text-xs px-4 py-2 rounded-full',
    bead: 'w-8 h-8 rounded-full',
    iconSize: 'w-3.5 h-3.5',
    expandPadding: 'group-hover:pr-6',
  },
  md: {
    pill: 'text-sm font-medium px-6 py-3 rounded-full',
    bead: 'w-11 h-11 rounded-full',
    iconSize: 'w-4 h-4',
    expandPadding: 'group-hover:pr-8',
  },
  lg: {
    pill: 'text-base font-semibold px-8 py-3.5 rounded-full',
    bead: 'w-13 h-13 rounded-full',
    iconSize: 'w-5 h-5',
    expandPadding: 'group-hover:pr-10',
  },
} as const;

export function SplitButton({
  children,
  href,
  onClick,
  variant = 'midnight',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  target,
  rel,
}: SplitButtonProps) {
  const v = VARIANT_CONFIGS[variant];
  const s = SIZE_CONFIGS[size];

  const defaultIcon = <ArrowUpRight className={s.iconSize} />;
  const renderedIcon = loading ? (
    <Loader2 className={`${s.iconSize} animate-spin`} />
  ) : (
    icon || defaultIcon
  );

  const innerContent = (
    <>
      <span
        className={`inline-flex items-center transition-all duration-300 select-none ${v.pill} ${s.pill} ${s.expandPadding}`}
      >
        {children}
      </span>
      <span
        className={`inline-flex items-center justify-center transition-all duration-300 select-none ${v.bead} ${s.bead} group-hover:rotate-45 group-hover:scale-105`}
      >
        {renderedIcon}
      </span>
    </>
  );

  const containerClasses = `group inline-flex items-center gap-1 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`;

  if (href) {
    if (href.startsWith('#') || href.startsWith('http')) {
      return (
        <a
          href={href}
          target={target}
          rel={rel}
          className={containerClasses}
          onClick={onClick}
        >
          {innerContent}
        </a>
      );
    }

    return (
      <Link href={href} className={containerClasses} onClick={onClick}>
        {innerContent}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={containerClasses}
    >
      {innerContent}
    </button>
  );
}
