import { RAW_SVG_STRINGS } from './vectors/rawVectors';

/**
 * UPILERIFY ASSET REGISTRY
 * Centralized paths, raw SVGs, and metadata for all official branding graphics, marks, and icons.
 */
export const BRAND_ASSETS = {
  logos: {
    // Primary Black Font Logo for Pure White Themes
    horizontalBlack: '/UPIlerify logo-black font.png',
    
    // White Font Logo for Dark Overlays / Banners
    horizontalWhite: '/UPIlerify logo-White font.png',
    
    // Master Brand Sheet
    brandSheet: '/UPIlerify Branding of logo.png',

    // Standalone 1:1 Vector SVGs
    svgBlack: '/UPIlerify-logo-black.svg',
    svgWhite: '/UPIlerify-logo-white.svg',
    svgMark: '/UPIlerify-mark.svg',
    svgWordmarkBlack: '/UPIlerify-wordmark-black.svg',
    svgWordmarkWhite: '/UPIlerify-wordmark-white.svg',
  },
  vectors: {
    mark: RAW_SVG_STRINGS.mark,
    logoBlack: RAW_SVG_STRINGS.logoBlack,
    logoWhite: RAW_SVG_STRINGS.logoWhite,
    wordmarkBlack: RAW_SVG_STRINGS.wordmarkBlack,
    wordmarkWhite: RAW_SVG_STRINGS.wordmarkWhite,
  },
  meta: {
    name: 'Upilerify',
    altText: 'Upilerify — Zero-Fee, Mailbox-Verified UPI Verification Engine',
    dimensions: {
      horizontal: { width: 180, height: 48 },
      icon: { width: 44, height: 44 },
      badge: { width: 120, height: 32 },
    },
  },
} as const;
