'use client';

import React from 'react';
import { BrandMarkSvg } from '../vectors/BrandMarkSvg';

export interface BrandEdgeSilhouetteProps {
  position?: 'top-right-bleed' | 'right-spine' | 'bottom-left-bleed' | 'dual-bleed';
  opacity?: number;
  glow?: boolean;
  float?: boolean;
  className?: string;
}

/**
 * BrandEdgeSilhouette
 * Elite edge-anchored brand element inspired by Linear/Stripe/Apple aesthetics.
 * Anchors the oversized 3D U-Ribbon mark along the viewport or container rim,
 * creating an iconic sculptural presence that eliminates flat/boring white canvases.
 */
export function BrandEdgeSilhouette({
  position = 'top-right-bleed',
  opacity = 0.12,
  glow = true,
  float = false,
  className = '',
}: BrandEdgeSilhouetteProps) {
  const floatClass = float ? 'animate-pulse duration-1000' : '';

  if (position === 'top-right-bleed') {
    return (
      <div
        className={`absolute -top-16 -right-20 sm:-top-24 sm:-right-24 md:-top-28 md:-right-20 lg:-top-32 lg:-right-16 w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] md:w-[620px] md:h-[620px] lg:w-[760px] lg:h-[760px] pointer-events-none select-none -z-10 overflow-visible ${className}`}
        aria-hidden="true"
      >
        {/* Ambient Chromatic Halo behind the edge mark */}
        {glow && (
          <div
            className="absolute inset-0 rounded-full blur-3xl -z-10 opacity-70"
            style={{
              background:
                'radial-gradient(circle at 60% 40%, rgba(0, 210, 255, 0.22) 0%, rgba(112, 248, 24, 0.14) 40%, rgba(0, 102, 255, 0.08) 65%, transparent 85%)',
            }}
          />
        )}

        {/* The 3D U-Ribbon Mark Bleeding from the Top-Right Edge */}
        <div
          className={`relative w-full h-full transform rotate-[16deg] translate-x-12 -translate-y-8 ${floatClass}`}
          style={{ opacity }}
        >
          <BrandMarkSvg size="100%" />
        </div>

        {/* Faint Concentric Alignment Ring */}
        <svg
          viewBox="0 0 800 800"
          className="absolute inset-0 w-full h-full stroke-slate-300/40 fill-none -z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="450" cy="350" r="320" strokeDasharray="6 6" strokeWidth="1.5" />
          <circle cx="450" cy="350" r="240" strokeWidth="1" />
          <circle cx="450" cy="350" r="160" strokeDasharray="3 3" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  if (position === 'right-spine') {
    return (
      <div
        className={`absolute top-1/3 -right-24 md:-right-28 lg:-right-32 w-[320px] h-[320px] md:w-[500px] md:h-[500px] pointer-events-none select-none -z-10 overflow-visible ${className}`}
        aria-hidden="true"
      >
        {glow && (
          <div
            className="absolute inset-0 rounded-full blur-3xl -z-10 opacity-60"
            style={{
              background:
                'radial-gradient(circle, rgba(0, 210, 255, 0.18) 0%, rgba(112, 248, 24, 0.08) 50%, transparent 80%)',
            }}
          />
        )}
        <div
          className={`relative w-full h-full transform -rotate-[12deg] translate-x-16 ${floatClass}`}
          style={{ opacity }}
        >
          <BrandMarkSvg size="100%" />
        </div>
      </div>
    );
  }

  if (position === 'bottom-left-bleed') {
    return (
      <div
        className={`absolute bottom-8 left-0 md:bottom-16 md:left-2 w-[320px] h-[320px] md:w-[480px] md:h-[480px] pointer-events-none select-none -z-10 overflow-hidden ${className}`}
        aria-hidden="true"
      >
        {glow && (
          <div
            className="absolute inset-0 rounded-full blur-3xl -z-10 opacity-55"
            style={{
              background:
                'radial-gradient(circle at 40% 60%, rgba(112, 248, 24, 0.16) 0%, rgba(0, 210, 255, 0.12) 45%, transparent 80%)',
            }}
          />
        )}
        <div
          className={`relative w-full h-full transform -rotate-[22deg] -translate-x-8 ${floatClass}`}
          style={{ opacity }}
        >
          <BrandMarkSvg size="100%" />
        </div>
      </div>
    );
  }

  // Dual Bleed (Top-Right Hero + Bottom-Left Horizon)
  return (
    <>
      <BrandEdgeSilhouette
        position="top-right-bleed"
        opacity={opacity}
        glow={glow}
        float={float}
      />
      <BrandEdgeSilhouette
        position="bottom-left-bleed"
        opacity={opacity * 0.8}
        glow={glow}
        float={float}
      />
    </>
  );
}
