import React from 'react';
import { AbsoluteFill, Video, staticFile as remotionStaticFile } from 'remotion';

const staticFile = (path: string) => {
    let cleanPath = path.startsWith('public/') ? path.slice(7) : path;
    return remotionStaticFile(cleanPath);
};

export interface CinematicTextureWrapperProps {
  /** The deep background layer (e.g. KenBurnsMedia, plain Video, or MapScene) */
  backgroundLayer: React.ReactNode;
  
  /** The foreground UI elements (Monolith Text, Data HUDs, Topic Reveals) */
  children?: React.ReactNode;
  
  /** The URL to the slow floating embers/dust MP4 loop */
  particleSrc?: string;
  
  /** The URL to the 35mm film grain MP4 loop. If omitted, uses mathematical SVG noise. */
  grainSrc?: string;
}

/**
 * The Elite Cinematic Texture Stack (Depth-Sorted Compositing Wrapper)
 * 
 * Z-Index Architecture:
 * 0: Raw Background Footage (Provided via backgroundLayer prop)
 * 1: Pass A - Midtone Color Grade (Teal -> Amber, Soft-Light, 40%)
 * 2: Pass B - Shadow Crush (Midnight Blue, Multiply, 35%)
 * 3: Pass C - Edge Vignette (Radial Gradient, 70%)
 * 4: Heavy Background Grain (Overlay, 12%)
 * 5: Depth-Sorted Particles (Screen, 80%)
 * 10: Foreground UI (Children) -> Clean, bright, mathematically sharp
 * 999: Secret Sauce Global Micro-Grain (Overlay, 3%)
 */
export const CinematicTextureWrapper: React.FC<CinematicTextureWrapperProps> = ({
  backgroundLayer,
  children,
  particleSrc,
  grainSrc,
}) => {
  // Mathematical SVG Noise Fallback for perfect performance if no MP4 is provided
  const actualGrainSrc = grainSrc || staticFile('assets/grain.mp4');
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#020202', overflow: 'hidden' }}>
      
      {/* ==========================================
          LAYER 0: RAW BACKGROUND FOOTAGE (Z-INDEX 0)
          ========================================== */}
      <AbsoluteFill style={{ zIndex: 0 }}>
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
          pointerEvents: 'none'
        }} 
      />

      {/* Pass B: The Shadow Crush (Grounding the footage) */}
      <AbsoluteFill 
        style={{ 
          zIndex: 2, 
          backgroundColor: 'rgba(3, 7, 14, 0.35)',
          mixBlendMode: 'multiply',
          pointerEvents: 'none'
        }} 
      />


      {/* ==========================================
          LAYER 2: THE EDGE VIGNETTE (Z-INDEX 3)
          ========================================== */}
      <AbsoluteFill 
        style={{ 
          zIndex: 3, 
          background: 'radial-gradient(circle, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)',
          pointerEvents: 'none'
        }} 
      />


      {/* ==========================================
          LAYER 3: BACKGROUND HEAVY GRAIN (Z-INDEX 4)
          ========================================== */}
      {/* This grain sits UNDER the particles and UI to bind the footage and grade */}
      <AbsoluteFill 
        style={{ 
          zIndex: 4, 
          opacity: 0.12, // 12% heavy grain for the background
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
          backgroundImage: 'none',
          backgroundSize: '200px 200px', // Prevents stretching of the SVG noise
        }} 
      >
        <Video src={actualGrainSrc} muted loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>


      {/* ==========================================
          LAYER 4: DEPTH-SORTED PARTICLES (Z-INDEX 5)
          ========================================== */}
      {particleSrc && (
        <AbsoluteFill 
          style={{ 
            zIndex: 5, 
            mixBlendMode: 'screen', // Drops out the blacks, keeps only the glowing embers
            opacity: 0.8,
            pointerEvents: 'none'
          }}
        >
          <Video src={particleSrc} muted loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
      )}


      {/* ==========================================
          LAYER 5: THE FOREGROUND UI (Z-INDEX 10)
          ========================================== */}
      {/* 
        This is where the Monolith Text, Topic Reveals, and Grids are injected.
        Because this is Z-Index 10, it bypasses the heavy grade, shadow crush, and vignette.
        It will look perfectly bright and razor-sharp against the moody background. 
      */}
      <AbsoluteFill style={{ zIndex: 10 }}>
        {children}
      </AbsoluteFill>


      {/* ==========================================
          LAYER 6: THE SECRET SAUCE GLOBAL MICRO-GRAIN (Z-INDEX 999)
          ========================================== */}
      {/* 
        This is the 3% ultra-light grain that sits over absolutely everything (even the UI).
        It prevents the UI from looking like a cheap digital sticker by subtly dithering the pixels,
        creating the optical illusion that the text was physically photographed by a real lens. 
      */}
      <AbsoluteFill 
        style={{ 
          zIndex: 999, 
          opacity: 0.03, // Barely visible, but psychologically powerful
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
          backgroundImage: 'none',
          backgroundSize: '200px 200px',
        }} 
      >
        <Video src={actualGrainSrc} muted loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>

    </AbsoluteFill>
  );
};
