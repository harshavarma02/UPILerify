'use client';

import React from 'react';

export interface FlowArcProps {
  variant?: 'hero' | 'card' | 'wave' | 'mesh';
  className?: string;
}

export function FlowArc({ variant = 'hero', className = '' }: FlowArcProps) {
  // 1. Level 3 Hero Arc: Large cropped U-trajectory background
  if (variant === 'hero') {
    return (
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] pointer-events-none overflow-hidden -z-10 ${className}`}
      >
        <svg
          viewBox="0 0 1000 600"
          className="w-full h-full stroke-slate-200 fill-none opacity-80"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="heroRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#70F818" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#00D2FF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0066FF" stopOpacity="0.7" />
            </linearGradient>

            <linearGradient id="faintDashedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#00D2FF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#70F818" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Background Concentric Guide Arcs */}
          <path
            d="M 100 150 C 100 450, 400 550, 500 550 C 600 550, 900 450, 900 150"
            stroke="url(#faintDashedGrad)"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />

          <path
            d="M 200 120 C 200 380, 420 470, 500 470 C 580 470, 800 380, 800 120"
            stroke="rgba(226, 232, 240, 0.9)"
            strokeWidth="1"
          />

          {/* Primary U-Flow Trajectory (The signature ribbon arc) */}
          <path
            d="M 250 80 C 250 320, 430 420, 500 420 C 570 420, 750 320, 750 80"
            stroke="url(#heroRibbonGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Dynamic Node Pulse Points */}
          <circle cx="500" cy="420" r="5" className="fill-[#70F818]" />
          <circle cx="500" cy="420" r="10" className="fill-[#70F818]/20 animate-ping" />
          
          <circle cx="250" cy="80" r="4" className="fill-[#00D2FF]" />
          <circle cx="750" cy="80" r="4" className="fill-[#0066FF]" />
        </svg>
      </div>
    );
  }

  // 2. Level 2 Card Arc: Subtle corner accent for cards
  if (variant === 'card') {
    return (
      <svg
        viewBox="0 0 160 160"
        className={`absolute -bottom-4 -right-4 w-28 h-28 pointer-events-none fill-none stroke-border/70 ${className}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 10 150 C 10 70, 70 10, 150 10"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d="M 30 150 C 30 90, 90 30, 150 30"
          stroke="rgba(0, 210, 255, 0.25)"
          strokeWidth="1.5"
        />
        <circle cx="150" cy="30" r="3" className="fill-brand-cyan" />
      </svg>
    );
  }

  // 3. Section Wave
  if (variant === 'wave') {
    return (
      <div className={`w-full overflow-hidden pointer-events-none ${className}`}>
        <svg
          viewBox="0 0 1200 80"
          className="w-full h-12 stroke-border fill-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 0 40 Q 300 0, 600 40 T 1200 40"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="stroke-brand-cyan/20"
          />
        </svg>
      </div>
    );
  }

  // 4. Mesh Lattice
  return (
    <div
      className={`absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60 -z-10 ${className}`}
    />
  );
}
