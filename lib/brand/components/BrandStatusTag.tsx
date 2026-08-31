'use client';

import React from 'react';
import { CheckCircle2, Clock, RefreshCw, XCircle, AlertCircle } from 'lucide-react';

export type TransactionStatus =
  | 'VERIFIED'
  | 'PAID'
  | 'PENDING'
  | 'AWAITING_PAYMENT'
  | 'PROCESSING'
  | 'SYNCING'
  | 'FAILED'
  | 'EXPIRED';

export interface BrandStatusTagProps {
  status: TransactionStatus | string;
  label?: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export function BrandStatusTag({
  status,
  label,
  size = 'md',
  pulse = false,
  className = '',
}: BrandStatusTagProps) {
  const normStatus = status.toUpperCase();
  const displayLabel = label || normStatus;
  const sizeClass =
    size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  if (normStatus === 'VERIFIED' || normStatus === 'PAID') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-mono font-bold uppercase bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 ${sizeClass} ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        {pulse && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
        <span>{displayLabel}</span>
      </span>
    );
  }

  if (normStatus === 'PENDING' || normStatus === 'AWAITING_PAYMENT') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-mono font-bold uppercase bg-amber-500/10 text-amber-700 border border-amber-500/20 ${sizeClass} ${className}`}
      >
        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        {pulse && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
        <span>{displayLabel}</span>
      </span>
    );
  }

  if (normStatus === 'PROCESSING' || normStatus === 'SYNCING') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-mono font-bold uppercase bg-brand-cyan/10 text-brand-blue border border-brand-cyan/30 ${sizeClass} ${className}`}
      >
        <RefreshCw className="w-3.5 h-3.5 text-brand-cyan animate-spin shrink-0" />
        <span>{displayLabel}</span>
      </span>
    );
  }

  // FAILED / EXPIRED
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-bold uppercase bg-rose-500/10 text-rose-700 border border-rose-500/20 ${sizeClass} ${className}`}
    >
      <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
      <span>{displayLabel}</span>
    </span>
  );
}
