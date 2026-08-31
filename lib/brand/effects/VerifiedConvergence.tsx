'use client';

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { BRAND } from '../tokens';

export interface VerifiedConvergenceProps {
  amount?: number;
  utr?: string;
  bank?: string;
  className?: string;
}

export function VerifiedConvergence({
  amount = 499,
  utr = '623849102834',
  bank = 'Kotak 811',
  className = '',
}: VerifiedConvergenceProps) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`relative w-full p-5 sm:p-6 rounded-3xl bg-white border border-emerald-500/30 shadow-md text-center space-y-3.5 overflow-hidden ${className}`}
    >
      {/* Background Radial Glow */}
      <div
        className="absolute inset-0 pointer-events-none -z-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(112, 248, 24, 0.15) 0%, rgba(0, 210, 255, 0.08) 40%, transparent 70%)',
        }}
      />

      {/* Pulsing Verified Circle Icon */}
      <div className="relative inline-flex items-center justify-center">
        <motion.div
          className="absolute w-16 h-16 rounded-full bg-emerald-500/15"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-brand-cyan to-brand-lime text-white flex items-center justify-center shadow-sm relative z-10">
          <CheckCircle2 className="w-6 h-6 text-white stroke-[2.5]" />
        </div>
      </div>

      {/* Headlines */}
      <div className="space-y-1 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-bold text-[10.5px] uppercase border border-emerald-200">
          <ShieldCheck className="w-3 h-3" />
          <span>Payment Verified Instantly</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-brand-navy tracking-tight pt-0.5">
          ₹{Number(amount).toFixed(2)} Received
        </h3>
        <p className="text-[11px] text-slate-500">
          Funds credited directly to your bank account via UPI.
        </p>
      </div>

      {/* Transaction Details Spec Box */}
      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-left grid grid-cols-2 gap-2 text-xs font-mono relative z-10">
        <div>
          <span className="text-[9.5px] text-slate-400 block uppercase">Bank Source</span>
          <span className="font-bold text-brand-navy truncate block">{bank}</span>
        </div>
        <div>
          <span className="text-[9.5px] text-slate-400 block uppercase">12-Digit UTR</span>
          <span className="font-bold text-brand-navy tracking-wider truncate block">{utr}</span>
        </div>
        <div>
          <span className="text-[9.5px] text-slate-400 block uppercase">Gateway Fee</span>
          <span className="font-bold text-emerald-600">₹0 (0% Cut)</span>
        </div>
        <div>
          <span className="text-[9.5px] text-slate-400 block uppercase">Settlement</span>
          <span className="font-bold text-brand-blue">Instant T+0</span>
        </div>
      </div>
    </motion.div>
  );
}
