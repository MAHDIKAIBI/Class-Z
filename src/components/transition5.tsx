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

export const LumaDissolveTransition: React.FC<LumaDissolveTransitionProps> = ({ 
  SceneA, 
  SceneB, 
  durationInFrames = 30 
}) => {
  const frame = useCurrentFrame();

  // 1. PROGRESSIVE SMOOTH EASING
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 2. SCALE BREATHING & FORWARD MOMENTUM
  const scaleA = interpolate(progress, [0, 1], [1.0, 1.06]);
  const scaleB = interpolate(progress, [0, 1], [1.08, 1.0]);

  // 3. OPTICAL DEPTH DEFOCUS
  const blurA = interpolate(progress, [0, 0.7, 1], [0, 8, 20]);
  const blurB = interpolate(progress, [0, 0.4, 1], [18, 6, 0]);

  // 4. LUMA MASK THRESHOLD (Center outward radial burn wipe)
  const maskRadius = interpolate(progress, [0.1, 0.9], [0, 130], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 5. EMULSION BURN & GOLDEN GLOW ON EDGES
  const burnGlow = interpolate(progress, [0.25, 0.5, 0.75], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacityA = interpolate(progress, [0.75, 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#020305", overflow: "hidden" }}>
      {/* SCENE B (Underneath, revealed as hole expands) */}
      <AbsoluteFill
        style={{
          transform: `scale(${scaleB})`,
          filter: `blur(${blurB}px)`,
        }}
      >
        {SceneB}
      </AbsoluteFill>

      {/* SCENE A (On top, with hole burning through center) */}
      <AbsoluteFill
        style={{
          transform: `scale(${scaleA})`,
          filter: `blur(${blurA}px)`,
          opacity: opacityA,
          maskImage: `radial-gradient(circle at 50% 50%, transparent ${maskRadius}%, black ${maskRadius + 14}%)`,
          WebkitMaskImage: `radial-gradient(circle at 50% 50%, transparent ${maskRadius}%, black ${maskRadius + 14}%)`,
        }}
      >
        {SceneA}
      </AbsoluteFill>

      {/* GOLDEN EMULSION BURN FILAMENT (Edge highlight where Scene A melts into Scene B) */}
      {burnGlow > 0.01 && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            mixBlendMode: "screen",
            opacity: burnGlow,
            background: `radial-gradient(circle at 50% 50%, transparent ${Math.max(0, maskRadius - 6)}%, rgba(245, 215, 127, 0.9) ${maskRadius}%, rgba(212, 175, 55, 0.5) ${maskRadius + 10}%, transparent ${maskRadius + 18}%)`,
            filter: "blur(6px)",
          }}
        />
      )}

      {/* AMBIENT WARMTH BLEED (Center solarization) */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          mixBlendMode: "overlay",
          opacity: burnGlow * 0.7,
          background: "radial-gradient(circle at 50% 50%, #FFD700 0%, #D4AF37 35%, transparent 70%)",
        }}
      />
    </AbsoluteFill>
  );
};
