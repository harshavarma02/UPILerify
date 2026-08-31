/**
 * UPILERIFY MASTER BRAND BIBLE & DESIGN TOKENS (2026 PREMIUM EDITION)
 * Single Source of Truth for Colors, Gradients, Shadows, Typography, and Motion.
 * Engineered with luxurious off-white canvas depth, multi-layered diffuse elevation,
 * and high-contrast typography (Stripe / Linear / Apple caliber).
 */

export const BRAND = {
  name: 'Upilerify',
  tagline: 'The Mailbox-Verified UPI Payment Infrastructure',
  motto: 'VERIFY • MATCH • CONFIRM',
  triad: ['VERIFY', 'MATCH', 'CONFIRM'] as const,

  colors: {
    // 1. Foundation Canvas & Surfaces (Tactile Warmth & Depth)
    // Canvas is a soft luxurious cool titanium fog, while cards are crisp floating white!
    canvas: '#F8FAFC',        // Slate 50 Cool Fog (Stops screen glare, creates physical depth)
    canvasWhite: '#FFFFFF',   // Pure White (For floating cards & elevated surfaces)
    surface: '#FFFFFF',       // Floating Card White
    surfaceSubtle: '#F1F5F9', // Slate 100 (For sub-boxes, pill backgrounds, and code areas)
    surfaceMuted: '#E2E8F0',  // Slate 200 (Dividers, borders, and hover fills)

    // 2. High-End Typography & Contrast Anchors (Refined Charcoal)
    navy: '#0A0F1D',          // Rich Charcoal Midnight (Never harsh #000, softer on eyes)
    navyMuted: '#334155',     // Slate 700 (Body text with optimal readability)
    textMuted: '#64748B',     // Slate 500 (Captions, labels, timestamps)
    textLight: '#94A3B8',     // Slate 400 (Placeholders, disabled states)

    // 3. Precision Hairline Borders
    border: 'rgba(226, 232, 240, 0.85)', // Crisp, subtle 1px border
    borderSubtle: 'rgba(15, 23, 42, 0.06)', // Micro-hairline for floating cards
    borderHover: 'rgba(203, 213, 225, 0.9)',
    borderActive: '#00D2FF',  // Speed Cyan focus border

    // 4. Flow Accents (The Brand Spectrum)
    lime: '#70F818',          // Trust & Instant Success (Electric Lime)
    limeSubtle: '#16A34A',    // High-contrast Emerald for white-canvas text
    cyan: '#00D2FF',          // Speed & Signal Flow (Aqua/Cyan)
    cyanSubtle: '#0284C7',    // Deep sky blue for secondary text
    blue: '#0066FF',          // Growth & Financial Infrastructure (Royal Blue)
    blueSubtle: '#2563EB',    // Interactive Hover Variant
  },

  gradients: {
    // 1. Signature U-Ribbon Flow Gradient
    flowRibbon: 'linear-gradient(135deg, #70F818 0%, #00D2FF 40%, #0066FF 100%)',
    
    // 2. High-Energy Action Gradient (Pills, Progress, Glowing borders)
    flowAction: 'linear-gradient(90deg, #00D2FF 0%, #70F818 100%)',
    
    // 3. Flow Headline Text Gradient
    flowText: 'linear-gradient(135deg, #0066FF 0%, #00D2FF 50%, #16A34A 100%)',
    
    // 4. Luxury Background Canvas Fade (Pure white top fading into fog slate with cyan ambient light)
    canvasAtmospheric: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(0, 210, 255, 0.08) 0%, rgba(112, 248, 24, 0.03) 40%, transparent 80%), linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 35%, #F1F5F9 100%)',
    
    // 5. Card Border Shimmer on Hover
    cardBorderGlow: 'linear-gradient(135deg, rgba(0, 210, 255, 0.3) 0%, rgba(112, 248, 24, 0.3) 100%)',
  },

  // Multi-layered, Diffused Drop Shadows (Floating Apple/Stripe feel)
  shadows: {
    // Subtle resting border elevation
    subtle: '0 0 0 1px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.03)',
    // Premium floating card
    card: '0 0 0 1px rgba(15, 23, 42, 0.05), 0 2px 4px -1px rgba(15, 23, 42, 0.02), 0 10px 24px -4px rgba(15, 23, 42, 0.05)',
    // Hover elevated state with subtle cyan-blue ambient tint
    cardHover: '0 0 0 1px rgba(0, 210, 255, 0.25), 0 4px 8px -2px rgba(15, 23, 42, 0.04), 0 24px 48px -12px rgba(0, 102, 255, 0.08)',
    // High elevation (Modals, Featured Cards)
    elevated: '0 0 0 1px rgba(15, 23, 42, 0.06), 0 20px 50px -15px rgba(15, 23, 42, 0.08)',
    // Primary CTA Button
    buttonCta: '0 1px 2px rgba(0, 0, 0, 0.08), 0 4px 14px -2px rgba(10, 15, 29, 0.3)',
    glowCyan: '0 0 35px rgba(0, 210, 255, 0.18)',
    glowLime: '0 0 25px rgba(112, 248, 24, 0.22)',
  },

  typography: {
    fontSans: '"DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontMono: '"Geist Mono", monospace',
  },

  pillars: {
    trust: {
      label: 'Trust',
      color: '#70F818',
      textClass: 'text-[#16A34A]',
      bgClass: 'bg-[#70F818]/10',
      borderClass: 'border-[#70F818]/30',
      desc: 'Direct Bank Settlement',
    },
    speed: {
      label: 'Speed',
      color: '#00D2FF',
      textClass: 'text-[#0284C7]',
      bgClass: 'bg-[#00D2FF]/10',
      borderClass: 'border-[#00D2FF]/30',
      desc: 'Sub-3s IMAP Mail Alerts',
    },
    growth: {
      label: 'Growth',
      color: '#0066FF',
      textClass: 'text-[#0066FF]',
      bgClass: 'bg-[#0066FF]/10',
      borderClass: 'border-[#0066FF]/30',
      desc: '0% Gateway Fees · 100% Margin',
    },
    reliability: {
      label: 'Reliability',
      color: '#0A0F1D',
      textClass: 'text-[#0A0F1D]',
      bgClass: 'bg-[#0A0F1D]/5',
      borderClass: 'border-[#0A0F1D]/15',
      desc: '3-Tier Collision Resolution',
    },
  },

  motion: {
    signalSpeed: '1.8s',
    pulseCadence: '2.4s',
    transitionFast: '0.15s ease',
    transitionNormal: '0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;

export type BrandTokens = typeof BRAND;
