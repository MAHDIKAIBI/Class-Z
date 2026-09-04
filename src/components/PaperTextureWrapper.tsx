import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

/**
 * PaperTextureWrapper — High-End Tactile Paper & Grain Finisher
 * Gives flat digital stickman drawings a warm, tangible, stop-motion look:
 * - Subtle paper grain noise
 * - Warm vignette framing
 * - 12fps noise shift (living paper feel)
 */
export const PaperTextureWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();

  // Shift seed every 3 frames for a natural 10fps stop-motion texture
  const seed = (Math.floor(frame / 3) * 17) % 100;

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {/* Underlying 2K Video Stage */}
      {children}

      {/* SVG Procedural Paper Grain Overlay */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: 0.035,
          mixBlendMode: 'multiply',
          zIndex: 90,
        }}
      >
        <filter id="paperNoise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            seed={seed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#paperNoise)" />
      </svg>

      {/* Editorial Warm Vignette & 2K Border Frame */}
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          boxShadow: 'inset 0 0 160px rgba(15, 23, 42, 0.05)',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          zIndex: 95,
        }}
      />
    </AbsoluteFill>
  );
};
