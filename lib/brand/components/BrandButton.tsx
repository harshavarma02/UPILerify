'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface BrandButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'midnight' | 'flow' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const VARIANT_STYLES = {
  midnight:
    'bg-[#0A0F1D] hover:bg-slate-900 text-white border border-[#0A0F1D] font-bold shadow-md hover:shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]',
  flow:
    'bg-gradient-flow-action text-brand-navy font-extrabold shadow-brand-glow-cyan hover:opacity-95 transition-all hover:scale-[1.01] active:scale-[0.99]',
  outline:
    'bg-slate-50 hover:bg-slate-100 text-[#0A0F1D] border border-slate-200 hover:border-slate-300 font-bold shadow-xs transition-all hover:scale-[1.01] active:bg-slate-200 active:scale-[0.99]',
  ghost:
    'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-[#0A0F1D] font-semibold transition-colors active:bg-slate-200',
} as const;

const SIZE_STYLES = {
  sm: 'px-3.5 py-1.5 text-xs rounded-xl gap-1.5',
  md: 'px-5 py-2.5 text-xs sm:text-sm rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-sm sm:text-base rounded-2xl gap-2.5',
} as const;

export function BrandButton({
  variant = 'midnight',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}: BrandButtonProps) {
  const variantClass = VARIANT_STYLES[variant];
  const sizeClass = SIZE_STYLES[size];
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`inline-flex items-center justify-center cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <span className="shrink-0">{icon}</span>
      )}
    </button>
  );
}
