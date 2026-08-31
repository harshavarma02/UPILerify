'use client';

import React from 'react';
import { motion } from 'motion/react';

export interface AmbientGlowProps {
  position?: 'hero' | 'center' | 'bottom' | 'subtle';
  animated?: boolean;
  className?: string;
}

export function AmbientGlow({
  position = 'hero',
  animated = false,
  className = '',
}: AmbientGlowProps) {
  if (position === 'hero') {
    return (
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[560px] pointer-events-none overflow-hidden -z-10 ${className}`}
      >
        {/* Soft Radial Ambient Canvas Depth */}
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] rounded-full opacity-70 blur-3xl pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0, 210, 255, 0.08) 0%, rgba(112, 248, 24, 0.04) 45%, transparent 75%)',
          }}
        />

        {/* Soft Left Blue/Cyan Cone */}
        <div
          className="absolute -top-24 left-[15%] w-[520px] h-[340px] rounded-full blur-3xl opacity-50 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(0, 102, 255, 0.06) 0%, rgba(0, 210, 255, 0.03) 60%, transparent 80%)',
          }}
        />

        {/* Soft Right Lime Cone */}
        <div
          className="absolute -top-20 right-[15%] w-[460px] h-[300px] rounded-full blur-3xl opacity-45 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(112, 248, 24, 0.06) 0%, rgba(0, 210, 255, 0.02) 60%, transparent 80%)',
          }}
        />
      </div>
    );
  }

  if (position === 'center') {
    return (
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden -z-10 ${className}`}
      >
        <div
          className="w-[600px] h-[400px] rounded-full blur-3xl opacity-50"
          style={{
            background:
              'radial-gradient(circle, rgba(0, 210, 255, 0.07) 0%, rgba(112, 248, 24, 0.03) 50%, transparent 75%)',
          }}
        />
      </div>
    );
  }

  // Subtle / default
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden -z-10 ${className}`}
      style={{
        background:
          'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(0, 210, 255, 0.04) 0%, rgba(112, 248, 24, 0.02) 40%, transparent 70%)',
      }}
    />
  );
}
