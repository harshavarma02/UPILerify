'use client';

import React from 'react';
import { BrandWatermark } from './BrandWatermark';
import { BrandEdgeSilhouette } from './BrandEdgeSilhouette';
import { AmbientGlow } from './AmbientGlow';
import { FlowArc } from './FlowArc';

export interface BrandBackgroundProps {
  variant?: 'light-tactile' | 'minimal' | 'glass';
  watermarkPosition?: 'hero-right' | 'center' | 'bottom-left' | 'dual' | 'ambient';
  watermarkOpacity?: number;
  showEdgeSilhouette?: boolean;
  edgePosition?: 'top-right-bleed' | 'right-spine' | 'bottom-left-bleed' | 'dual-bleed';
  edgeOpacity?: number;
  showGrid?: boolean;
  showArcs?: boolean;
  showGlow?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * BrandBackground
 * Unified atmospheric continuous background environment for Upilerify.
 * Flows seamlessly from Hero across all sections without awkward seams or cuts.
 */
export function BrandBackground({
  variant = 'light-tactile',
  watermarkPosition = 'dual',
  watermarkOpacity = 0.04,
  showEdgeSilhouette = true,
  edgePosition = 'top-right-bleed',
  edgeOpacity = 0.1,
  showGrid = true,
  showArcs = true,
  showGlow = true,
  children,
  className = '',
}: BrandBackgroundProps) {
  return (
    <div
      className={`relative w-full min-h-screen bg-[#F8FAFC] text-[#0A0F1D] selection:bg-[#00D2FF]/20 selection:text-[#0066FF] overflow-x-clip ${className}`}
      style={{
        background:
          'radial-gradient(ellipse 90% 45% at 50% 0%, rgba(0, 210, 255, 0.08) 0%, rgba(112, 248, 24, 0.04) 30%, transparent 70%), linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 15%, #F8FAFC 85%, #F1F5F9 100%)',
      }}
    >
      {/* Continuous Ambient Glow Cones */}
      {showGlow && <AmbientGlow position="hero" />}

      {/* Precision Micro-Dot Matrix */}
      {showGrid && (
        <div
          className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none -z-10 opacity-60"
          aria-hidden="true"
        />
      )}

      {/* Deconstructed Flow Arcs */}
      {showArcs && <FlowArc variant="hero" />}

      {/* Edge Sculptural Silhouette */}
      {showEdgeSilhouette && (
        <BrandEdgeSilhouette
          position={edgePosition}
          opacity={edgeOpacity}
          glow
        />
      )}

      {/* Floating 3D U-Ribbon Watermark */}
      <BrandWatermark
        position={watermarkPosition}
        opacity={watermarkOpacity}
      />

      {/* Content Layer */}
      {children}
    </div>
  );
}
