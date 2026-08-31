'use client';

import React from 'react';
import { motion } from 'motion/react';
import { QrCode, Mail, Zap, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export interface SignalBeamProps {
  activeStep?: 1 | 2 | 3 | 4;
  isVerified?: boolean;
  animated?: boolean;
  className?: string;
}

const NODES = [
  { id: 1, label: '1. UPI Intent', sub: 'Dynamic QR Scan', icon: QrCode, color: '#0066FF' },
  { id: 2, label: '2. Bank Alert', sub: 'Real Bank Email', icon: Mail, color: '#00D2FF' },
  { id: 3, label: '3. Mailbox Match', sub: 'Direct UTR Regex', icon: Zap, color: '#70F818' },
  { id: 4, label: '4. Confirmed', sub: 'Signed Webhook', icon: CheckCircle2, color: '#10B981' },
] as const;

export function SignalBeam({
  activeStep = 3,
  isVerified = false,
  animated = true,
  className = '',
}: SignalBeamProps) {
  return (
    <div className={`w-full py-6 px-4 sm:px-6 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#70F818] animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider text-[#0A0F1D] uppercase">
            Real-Time Verified Flow Pipeline
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
          0% Gateway Toll · T+0 Settlement
        </span>
      </div>

      {/* 4-Node Trajectory Container */}
      <div className="relative">
        
        {/* Connecting Horizontal Pulse Beam (Desktop 4-column) */}
        <div className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-[2px] bg-slate-200 -z-0">
          {animated && (
            <motion.div
              className="h-full bg-gradient-to-r from-[#0066FF] via-[#00D2FF] to-[#70F818] rounded-full shadow-[0_0_8px_rgba(0,210,255,0.6)]"
              initial={{ width: '0%', left: '0%' }}
              animate={{
                width: isVerified ? '100%' : ['0%', '70%', '100%'],
                left: isVerified ? '0%' : ['0%', '0%', '0%'],
              }}
              transition={{
                duration: isVerified ? 0.5 : 2.8,
                repeat: isVerified ? 0 : Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </div>

        {/* 4 Nodes Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
          {NODES.map((node, idx) => {
            const Icon = node.icon;
            const isPassed = isVerified || idx + 1 <= activeStep;
            const isCurrent = !isVerified && idx + 1 === activeStep;

            return (
              <div
                key={node.id}
                className="flex flex-col items-center text-center space-y-2.5"
              >
                {/* Node Icon Box */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isPassed
                      ? 'bg-white border-2 shadow-md'
                      : 'bg-slate-50 border border-slate-200 text-slate-400'
                  }`}
                  style={{
                    borderColor: isPassed ? node.color : undefined,
                    boxShadow: isCurrent ? `0 0 16px ${node.color}35` : undefined,
                  }}
                >
                  <Icon
                    className="w-6 h-6 transition-colors"
                    style={{ color: isPassed ? node.color : '#94A3B8' }}
                  />
                </div>

                {/* Node Labels */}
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#0A0F1D]">
                    {node.label}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {node.sub}
                  </div>
                </div>

                {/* Status Indicator */}
                <div
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-all ${
                    isPassed ? 'opacity-100' : 'opacity-40 bg-slate-100 text-slate-400'
                  }`}
                  style={{
                    backgroundColor: isPassed ? `${node.color}15` : undefined,
                    color: isPassed ? node.color : undefined,
                  }}
                >
                  {isPassed ? (isVerified && idx === 3 ? 'Confirmed ✓' : `Step ${node.id} Ready`) : 'Pending'}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Verified Banner State */}
      {isVerified && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-center flex items-center justify-center gap-2 text-emerald-800 text-xs font-bold font-mono shadow-xs"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>PAYMENT VERIFIED & DIRECT SETTLEMENT CONFIRMED</span>
        </motion.div>
      )}

    </div>
  );
}
