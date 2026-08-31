/**
 * UPILERIFY PATTERNS & GEOMETRY BIBLE
 * Deconstructed mathematical primitives derived from the 3D U-Ribbon Logo.
 * Arcs, Signal Paths, Node Coordinates, and Flow Geometry.
 */

export const BRAND_GEOMETRY = {
  // SVG Path Strings for U-Flow Arcs
  paths: {
    // 1. Primary U-Flow Curve (Normalized 0-100 coordinate space)
    uCurve: 'M 15,10 C 15,65 35,90 50,90 C 65,90 85,65 85,10',
    
    // 2. Ascending Arrow Shard (The checkmark/arrow trajectory)
    arrowShard: 'M 50,90 C 65,90 85,65 85,10 L 95,25 L 85,25 Z',
    
    // 3. Smooth S-Wave Connection
    sWave: 'M 0,50 C 25,20 75,80 100,50',
    
    // 4. Multi-Node Trajectory (4 Steps: Scan -> Alert -> Parse -> Settle)
    nodePath: 'M 10,50 L 35,50 L 65,50 L 90,50',
  },

  // Color Stops for SVG Gradients
  svgGradients: {
    ribbon: [
      { offset: '0%', color: '#70F818', opacity: 1 },
      { offset: '40%', color: '#00D2FF', opacity: 1 },
      { offset: '100%', color: '#0066FF', opacity: 1 },
    ],
    action: [
      { offset: '0%', color: '#00D2FF', opacity: 1 },
      { offset: '100%', color: '#70F818', opacity: 1 },
    ],
    faintAtmosphere: [
      { offset: '0%', color: 'rgba(0, 210, 255, 0.08)', opacity: 1 },
      { offset: '50%', color: 'rgba(112, 248, 24, 0.04)', opacity: 1 },
      { offset: '100%', color: 'transparent', opacity: 0 },
    ],
  },
} as const;
