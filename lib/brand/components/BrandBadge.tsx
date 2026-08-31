'use client';

import React from 'react';
import { ShieldCheck, Percent, CheckCircle2, Zap, ArrowUpRight } from 'lucide-react';
import { BRAND } from '../tokens';

export interface BrandBadgeProps {
  type?: 'triad' | 'pillar' | 'verified' | 'zeroFee' | 'custom';
  pillar?: 'trust' | 'speed' | 'growth' | 'reliability';
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export function BrandBadge({
  type = 'triad',
  pillar = 'trust',
  children,
  className = '',
  size = 'md',
}: BrandBadgeProps) {
  const sizeClasses =
    size === 'sm' ? 'px-2.5 py-1 text-[10px]' : 'px-3.5 py-1.5 text-xs';

  // 1. Official TRIAD Pill: VERIFY • MATCH • CONFIRM
  if (type === 'triad') {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full bg-white border border-border shadow-brand-subtle font-mono font-bold tracking-wider text-brand-navy ${sizeClasses} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-brand-lime animate-pulse"></span>
        <span>VERIFY</span>
        <span className="text-muted-light">•</span>
        <span>MATCH</span>
        <span className="text-muted-light">•</span>
        <span>CONFIRM</span>
        <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan"></span>
      </div>
    );
  }

  // 2. Verified Trust Seal
  if (type === 'verified') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-bold ${sizeClasses} ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Verified by Upilerify</span>
      </div>
    );
  }

  // 3. Zero Fee Badge
  if (type === 'zeroFee') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 text-brand-blue border border-brand-blue/20 font-bold ${sizeClasses} ${className}`}
      >
        <Percent className="w-3.5 h-3.5 shrink-0" />
        <span>0% Gateway Fees · Direct Bank Settlement</span>
      </div>
    );
  }

  // 4. Specific Pillar Badge
  if (type === 'pillar') {
    const p = BRAND.pillars[pillar];
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full ${p.bgClass} ${p.textClass} border ${p.borderClass} font-semibold font-mono ${sizeClasses} ${className}`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: p.color }}
        ></span>
        <span>{p.label}: {p.desc}</span>
      </div>
    );
  }

  // 5. Custom Badge
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-brand-surface text-brand-navy-muted border border-border font-medium ${sizeClasses} ${className}`}
    >
      {children}
    </div>
  );
}
