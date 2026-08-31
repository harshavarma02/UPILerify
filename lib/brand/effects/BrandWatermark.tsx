'use client';

import React from 'react';
import { BrandMarkSvg } from '../vectors/BrandMarkSvg';

export interface BrandWatermarkProps {
  position?: 'hero-right' | 'center' | 'bottom-left' | 'dual' | 'ambient';
  opacity?: number;
  scale?: number;
  blur?: boolean;
  animated?: boolean;
  className?: string;
}

/**
 * BrandWatermark
 * Renders the official 3D U-Ribbon icon mark as an atmospheric background asset.
 * Transforms plain canvas into a tactile, high-depth fintech environment.
 */
export function BrandWatermark({
  position = 'hero-right',
  opacity = 0.07,
  scale = 1,
  blur = false,
  animated = false,
  className = '',
}: BrandWatermarkProps) {
  const blurClass = blur ? 'blur-2xl' : '';
  const animClass = animated ? 'animate-pulse duration-1000' : '';

  if (position === 'hero-right') {
    return (
      <div
        className={`absolute -top-12 -right-16 md:top-6 md:right-4 w-[380px] h-[380px] md:w-[600px] md:h-[600px] pointer-events-none select-none -z-10 overflow-hidden ${className}`}
        style={{ opacity }}
        aria-hidden="true"
      >
        <div className={`relative w-full h-full transform rotate-[12deg] ${blurClass} ${animClass}`}>
          <BrandMarkSvg size="100%" />
        </div>
      </div>
    );
  }

  if (position === 'bottom-left') {
    return (
      <div
        className={`absolute bottom-12 left-4 w-[300px] h-[300px] md:w-[450px] md:h-[450px] pointer-events-none select-none -z-10 overflow-hidden ${className}`}
        style={{ opacity }}
        aria-hidden="true"
      >
        <div className={`relative w-full h-full transform -rotate-[15deg] ${blurClass} ${animClass}`}>
          <BrandMarkSvg size="100%" />
        </div>
      </div>
    );
  }

  if (position === 'dual') {
    return (
      <>
        {/* Top-Right Large Floating Mark */}
        <div
          className="absolute top-4 right-4 md:top-8 md:right-8 w-[380px] h-[380px] md:w-[560px] md:h-[560px] pointer-events-none select-none -z-10 overflow-hidden"
          style={{ opacity }}
          aria-hidden="true"
        >
          <div className="relative w-full h-full transform rotate-[14deg]">
            <BrandMarkSvg size="100%" />
          </div>
        </div>

        {/* Mid-Left Floating Mark */}
        <div
          className="absolute top-[42%] left-2 md:left-6 w-[280px] h-[280px] md:w-[420px] md:h-[420px] pointer-events-none select-none -z-10 overflow-hidden"
          style={{ opacity: opacity * 0.85 }}
          aria-hidden="true"
        >
          <div className="relative w-full h-full transform -rotate-[18deg]">
            <BrandMarkSvg size="100%" />
          </div>
        </div>

        {/* Bottom-Right Anchor Mark (safely bounded) */}
        <div
          className="absolute bottom-16 right-6 md:bottom-24 md:right-12 w-[300px] h-[300px] md:w-[460px] md:h-[460px] pointer-events-none select-none -z-10 overflow-hidden"
          style={{ opacity: opacity * 0.75 }}
          aria-hidden="true"
        >
          <div className="relative w-full h-full transform rotate-[8deg]">
            <BrandMarkSvg size="100%" />
          </div>
        </div>
      </>
    );
  }

  // Center / ambient default
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none -z-10 overflow-hidden ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <div className={`w-[500px] h-[500px] md:w-[750px] md:h-[750px] transform rotate-[6deg] ${blurClass} ${animClass}`}>
        <BrandMarkSvg size="100%" />
      </div>
    </div>
  );
}
