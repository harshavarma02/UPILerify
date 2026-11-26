'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Smartphone } from 'lucide-react';
import { BRAND } from '@/lib/brand/tokens';
import { buildUpiAppLinks, type UpiAppId, type UpiIntentParams } from '@/lib/payments/upiIntent';

interface UpiAppButtonsProps {
  params: UpiIntentParams;
  compact?: boolean;
}

function UpiAppIcon({ id }: { id: Exclude<UpiAppId, 'generic'> }) {
  switch (id) {
    case 'gpay':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M21.6 12.23c0-.7-.06-1.4-.19-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.99-4.3 2.99-7.36Z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.7 0 4.96-.9 6.61-2.41l-3.23-2.5c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.08v2.58A10 10 0 0 0 12 22Z"
          />
          <path
            fill="#FBBC05"
            d="M6.41 13.93A6.01 6.01 0 0 1 6.1 12c0-.67.12-1.32.31-1.93V7.49H3.08A10 10 0 0 0 2 12c0 1.61.39 3.14 1.08 4.51l3.33-2.58Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.95 2.97 14.7 2 12 2a10 10 0 0 0-8.92 5.49l3.33 2.58C7.2 7.71 9.4 5.95 12 5.95Z"
          />
        </svg>
      );
    case 'phonepe':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="#5F259F" />
          <path
            fill="#FFFFFF"
            d="M14.7 8.4h-2.1L10.3 6 9 7.2l1.2 1.2H8.1v1.7h1.4v4.2c0 1.6.9 2.6 2.5 2.6.8 0 1.5-.2 2-.6v1.5h1.8V10.1h.9V8.4h-2Zm-1.1 5.8c-.3.5-.8.8-1.4.8-.7 0-1.1-.4-1.1-1.2v-3.7h2.5v4.1Z"
          />
        </svg>
      );
    case 'paytm':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
          <rect x="2" y="4" width="20" height="16" rx="4" fill="#00BAF2" />
          <path
            fill="#002E6E"
            d="M6.2 15.2V8.8h2.6c1.5 0 2.4.8 2.4 2.1 0 1.4-.9 2.2-2.4 2.2H7.8v2.1H6.2Zm1.6-3.4h.9c.6 0 1-.3 1-.9s-.4-.9-1-.9h-.9v1.8Zm4.2 3.4V8.8h1.6v2.5h2.3V8.8h1.6v6.4h-1.6v-2.6h-2.3v2.6H12Z"
          />
        </svg>
      );
  }
}

export function UpiAppButtons({ params, compact = false }: UpiAppButtonsProps) {
  const { apps, fallbackUri } = buildUpiAppLinks(params);
  const [fallbackHint, setFallbackHint] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'upi' | 'amount' | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleSpecificAppLaunch = (appName: string) => {
    setFallbackHint(null);
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);

    // If the browser stays active after launching a custom scheme, offer universal fallback guidance.
    fallbackTimerRef.current = setTimeout(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        setFallbackHint(`${appName} didn't open? Tap "Any UPI App" below or scan the QR code.`);
      }
    }, 1200);
  };

  const copyValue = async (field: 'upi' | 'amount', value: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // Clipboard writes may be blocked in restricted browser contexts.
    }
  };

  return (
    <div className="space-y-3">
      {/* Dedicated 1-tap deep links for major UPI apps on mobile */}
      <div className="grid grid-cols-3 gap-2">
        {apps.map((app) => (
          <a
            key={app.id}
            href={app.uri}
            onClick={() => handleSpecificAppLaunch(app.name)}
            aria-label={`Pay with ${app.name}`}
            className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl border border-slate-200 bg-white hover:border-[#0066FF]/40 hover:bg-slate-50 shadow-xs transition-all duration-150 cursor-pointer"
          >
            <UpiAppIcon id={app.id} />
            <span className="text-[11px] font-bold tracking-tight" style={{ color: BRAND.colors.navy }}>
              {app.name}
            </span>
          </a>
        ))}
      </div>

      {/* Universal fallback intent button */}
      <a
        href={fallbackUri}
        className={`w-full py-3.5 px-4 rounded-2xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 transition-all duration-200 cursor-pointer ${
          compact
            ? 'bg-[#0A0F1D]/80 hover:bg-[#0066FF]'
            : 'bg-[#0A0F1D] hover:bg-[#0066FF]'
        }`}
      >
        <Smartphone className="w-4 h-4" style={{ color: BRAND.colors.cyan }} />
        <span>{compact ? 'Pay Again with Any UPI App' : 'Pay with Any UPI App'}</span>
      </a>

      {fallbackHint && (
        <p role="status" className="text-[11px] text-center text-slate-500">
          {fallbackHint}
        </p>
      )}

      {!compact && (
        <div className="flex items-center justify-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => copyValue('upi', params.merchantUpiId)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-[11px] font-mono text-slate-600 transition-colors cursor-pointer"
          >
            {copiedField === 'upi' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copiedField === 'upi' ? 'Copied UPI ID' : params.merchantUpiId}</span>
          </button>
          <button
            type="button"
            onClick={() => copyValue('amount', params.amount.toFixed(2))}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-[11px] font-mono text-slate-600 transition-colors cursor-pointer"
          >
            {copiedField === 'amount' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copiedField === 'amount' ? 'Copied Amount' : `₹${params.amount.toFixed(2)}`}</span>
          </button>
        </div>
      )}
    </div>
  );
}
