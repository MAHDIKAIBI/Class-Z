import React from 'react';
import { AbsoluteFill, OffthreadVideo, useCurrentFrame, staticFile as remotionStaticFile } from 'remotion';

/**
 * The Elite Cinematic Texture Stack (Depth-Sorted Compositing Wrapper)
 *
 * Z-Index Architecture:
 * 0:  Raw Background Footage (Provided via backgroundLayer prop)
 * 1:  Pass A - Midtone Color Grade (Teal -> Amber, Soft-Light, 40%)
 * 2:  Pass B - Shadow Crush (Midnight Blue, Multiply, 35%)
 * 3:  Pass C - Edge Vignette (Radial Gradient, 70%)
 * 4:  Film Grain - Pure CSS animated SVG noise (NO VIDEO FILE, NO delayRender)
 * 5:  Depth-Sorted Particles (Screen, 80%) — only rendered when particleSrc is provided
 * 10: Foreground UI (Children) -> Clean, bright, mathematically sharp
 *
 * CRITICAL: Film grain is implemented as an animated CSS SVG filter.
 * This eliminates the grain.mp4 <Video> component and its delayRender() timeout entirely.
 */

export interface CinematicTextureWrapperProps {
  /** The deep background layer (e.g. KenBurnsMedia, plain Video, or MapScene) */
  backgroundLayer: React.ReactNode;
  /** The foreground UI elements (Monolith Text, Data HUDs, Topic Reveals) */
  children?: React.ReactNode;
  /** The URL to the slow floating embers/dust MP4 loop */
  particleSrc?: string;
  /** DEPRECATED: No longer used. Grain is now pure CSS. Kept for API compatibility. */
  grainSrc?: string;
}

// Inline SVG turbulence filter — generates photographic film grain mathematically.
// This is a base64-encoded SVG so it can be used as a CSS background-image.
// The `seed` changes per-frame to animate the grain texture.
const buildGrainDataUri = (seed: number): string => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'>
    <filter id='grain'>
      <feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' seed='${seed}' stitchTiles='stitch'/>
      <feColorMatrix type='saturate' values='0'/>
    </filter>
    <rect width='256' height='256' filter='url(#grain)' opacity='1'/>
  </svg>`;
  // btoa is available in both browser and Node/Chromium contexts
  return `url("data:image/svg+xml;base64,${btoa(svg)}")`;
};

export const CinematicTextureWrapper: React.FC<CinematicTextureWrapperProps> = ({
  backgroundLayer,
  children,
  particleSrc,
  // grainSrc intentionally ignored — grain is now CSS-only
}) => {
  // Animate grain by cycling the SVG seed value every frame
  const frame = useCurrentFrame();
  const grainSeed = (frame % 256) + 1; // 1-256, never 0
  const grainBg = buildGrainDataUri(grainSeed);

  return (
    <AbsoluteFill style={{ backgroundColor: '#020202', overflow: 'hidden' }}>

      {/* ==========================================
          LAYER 0: RAW BACKGROUND FOOTAGE (Z-INDEX 0)
          ========================================== */}
      <AbsoluteFill style={{ zIndex: 0, filter: 'contrast(1.05) saturate(1.15)' }}>
        {backgroundLayer}
      </AbsoluteFill>


      {/* ==========================================
          LAYER 1: CINEMATIC DUAL-PASS LUT (Z-INDEX 1 & 2)
          ========================================== */}

      {/* Pass A: The Midtone Tint (Hollywood Teal/Orange) */}
      <AbsoluteFill
        style={{
          zIndex: 1,
          background: 'linear-gradient(135deg, rgba(10, 46, 63, 0.4) 0%, rgba(216, 122, 34, 0.4) 100%)',
          mixBlendMode: 'soft-light',
          pointerEvents: 'none',
        }}
      />

      {/* Pass B: The Shadow Crush (Grounding the footage) */}
      <AbsoluteFill
        style={{
          zIndex: 2,
          backgroundColor: 'rgba(3, 7, 14, 0.35)',
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
      />


      {/* ==========================================
          LAYER 2: THE EDGE VIGNETTE (Z-INDEX 3)
          ========================================== */}
      <AbsoluteFill
        style={{
          zIndex: 3,
          background: 'radial-gradient(circle, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ==========================================
          LAYER 3: FILM GRAIN (Z-INDEX 4)
          ========================================== */}
      <AbsoluteFill
        style={{
          zIndex: 4,
          backgroundImage: grainBg,
          mixBlendMode: 'overlay',
          opacity: 0.15,
          pointerEvents: 'none',
        }}
      />





      {/* ==========================================
          LAYER 4: DEPTH-SORTED PARTICLES (Z-INDEX 5)
          Only rendered when particleSrc is explicitly provided.
          ========================================== */}
      {particleSrc && (
        <AbsoluteFill
          style={{
            zIndex: 5,
            mixBlendMode: 'screen',
            opacity: 0.8,
            pointerEvents: 'none',
          }}
        >
          <OffthreadVideo src={particleSrc} muted loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
      )}


      {/* ==========================================
          LAYER 5: THE FOREGROUND UI (Z-INDEX 10)
          ========================================== */}
      <AbsoluteFill style={{ zIndex: 10 }}>
        {children}
      </AbsoluteFill>

    </AbsoluteFill>
  );
};
