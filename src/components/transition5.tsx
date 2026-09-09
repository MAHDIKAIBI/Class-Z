import { 
  AbsoluteFill, 
  useCurrentFrame, 
  interpolate, 
  Easing,
} from "remotion";
import React from "react";

export type LumaDissolveTransitionProps = {
  SceneA: React.ReactNode;
  SceneB: React.ReactNode;
  durationInFrames?: number;
};

/**
 * SPECTRAL HIGHLIGHT DISSOLVE (Transition 5 - Redesigned)
 * Replaces harsh circular cigarette burn holes with organic 35mm film halation.
 * Features exposure-lift highlight bleeding, optical depth softening, and a
 * warm spectral emulsion glow for seamless documentary transitions.
 */
export const LumaDissolveTransition: React.FC<LumaDissolveTransitionProps> = ({ 
  SceneA, 
  SceneB, 
  durationInFrames = 30 
}) => {
  const frame = useCurrentFrame();

  // 1. ORGANIC S-CURVE TRANSITION PROGRESS
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.bezier(0.35, 0.0, 0.25, 1.0),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 2. SUBTLE FOCAL BREATHING (1.0 -> 1.03 for A, 1.03 -> 1.0 for B)
  const scaleA = interpolate(progress, [0, 1], [1.0, 1.03]);
  const scaleB = interpolate(progress, [0, 1], [1.03, 1.0]);

  // 3. OPTICAL DEPTH DEFOCUS (Soft focus racking)
  const blurA = interpolate(progress, [0.2, 0.8], [0, 8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const blurB = interpolate(progress, [0.2, 0.8], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 4. EXPOSURE & HIGHLIGHT BLEED (Lifts midtones and highlights at apex)
  const exposureA = interpolate(progress, [0, 0.5, 1], [1.0, 1.28, 1.0], {
    easing: Easing.inOut(Easing.ease),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exposureB = interpolate(progress, [0, 0.5, 1], [1.0, 1.28, 1.0], {
    easing: Easing.inOut(Easing.ease),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 5. SMOOTH SPECTRAL CROSSFADE
  const opacityA = interpolate(progress, [0.25, 0.75], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacityB = interpolate(progress, [0.25, 0.75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 6. 35MM FILM HALATION & EMULSION WARMTH (Peaks at midpoint)
  const halationGlow = interpolate(
    progress,
    [0.2, 0.5, 0.8],
    [0, 0.35, 0],
    { easing: Easing.inOut(Easing.ease), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#020305", overflow: "hidden" }}>
      {/* SCENE B (Underneath, resolving focus as exposure normalizes) */}
      <AbsoluteFill
        style={{
          transform: `scale(${scaleB})`,
          filter: blurB > 0.5 ? `blur(${blurB}px) brightness(${exposureB})` : `brightness(${exposureB})`,
          opacity: opacityB,
          pointerEvents: opacityB > 0 ? "auto" : "none",
        }}
      >
        {SceneB}
      </AbsoluteFill>

      {/* SCENE A (On top, blooming highlights softly dissolve away) */}
      <AbsoluteFill
        style={{
          transform: `scale(${scaleA})`,
          filter: blurA > 0.5 ? `blur(${blurA}px) brightness(${exposureA})` : `brightness(${exposureA})`,
          opacity: opacityA,
          pointerEvents: opacityA > 0 ? "auto" : "none",
        }}
      >
        {SceneA}
      </AbsoluteFill>

      {/* 35MM SPECTRAL HALATION WASH (Soft golden/warm bleed) */}
      {halationGlow > 0.01 && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            mixBlendMode: "screen",
            opacity: halationGlow,
            background: "radial-gradient(ellipse at 50% 50%, rgba(255, 215, 150, 0.7) 0%, rgba(255, 160, 80, 0.3) 45%, transparent 75%)",
            filter: "blur(12px)",
          }}
        />
      )}

      {/* AMBIENT HIGHLIGHT DIFFUSION */}
      {halationGlow > 0.01 && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            mixBlendMode: "soft-light",
            opacity: halationGlow * 1.2,
            background: "linear-gradient(180deg, rgba(255, 235, 200, 0.25) 0%, transparent 60%)",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

