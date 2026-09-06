import { 
  AbsoluteFill, 
  useCurrentFrame, 
  interpolate, 
  Easing,
} from "remotion";
import React from "react";

export type PrismDispersionTransitionProps = {
  SceneA: React.ReactNode;
  SceneB: React.ReactNode;
  durationInFrames?: number;
};

export const PrismDispersionTransition: React.FC<PrismDispersionTransitionProps> = ({ 
  SceneA, 
  SceneB, 
  durationInFrames = 30 
}) => {
  const frame = useCurrentFrame();

  // 1. DIAGONAL SWEEP PROGRESS (Top-Left to Bottom-Right)
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.bezier(0.45, 0.0, 0.15, 1.0),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // At progress 0: cutX = -30. At progress 0.5: cutX = 50. At progress 1: cutX = 130
  const cutX = interpolate(progress, [0, 1], [-30, 130]);
  const xTop = cutX + 22;
  const xBottom = cutX - 22;

  // 2. CHROMATIC ABERRATION DISPERSION INTENSITY (Peaks at midpoint)
  const dispersion = interpolate(
    progress,
    [0, 0.5, 1],
    [0, 18, 0],
    { easing: Easing.inOut(Easing.ease), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 3. REFRACTION LENS SCALE
  const scaleA = interpolate(progress, [0, 1], [1.0, 1.04]);
  const scaleB = interpolate(progress, [0, 1], [1.05, 1.0]);

  // 4. SPECULAR GLASS EDGE FLASH
  const edgeGlint = interpolate(
    progress,
    [0.3, 0.5, 0.7],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#020305", overflow: "hidden" }}>
      {/* SCENE B (Revealed behind the diagonal glass wipe) */}
      <AbsoluteFill style={{ transform: `scale(${scaleB})` }}>
        {SceneB}
      </AbsoluteFill>

      {/* SCENE A (Diagonal clipped wipe) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `polygon(0% 0%, ${xTop}% 0%, ${xBottom}% 100%, 0% 100%)`,
          WebkitClipPath: `polygon(0% 0%, ${xTop}% 0%, ${xBottom}% 100%, 0% 100%)`,
          transform: `scale(${scaleA})`,
        }}
      >
        <AbsoluteFill>{SceneA}</AbsoluteFill>
      </div>

      {/* CHROMATIC ABERRATION SPLIT LAYERS (Along the glass refraction edge) */}
      {dispersion > 1 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            mixBlendMode: "screen",
            opacity: dispersion / 18,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `polygon(0% 0%, ${xTop + 3}% 0%, ${xBottom + 3}% 100%, 0% 100%)`,
              transform: `translate(${dispersion}px, 0)`,
              filter: "drop-shadow(0 0 12px rgba(255, 30, 70, 0.8))",
              opacity: 0.35,
            }}
          >
            {SceneB}
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `polygon(0% 0%, ${xTop - 3}% 0%, ${xBottom - 3}% 100%, 0% 100%)`,
              transform: `translate(${-dispersion}px, 0)`,
              filter: "drop-shadow(0 0 12px rgba(0, 220, 255, 0.8))",
              opacity: 0.35,
            }}
          >
            {SceneB}
          </div>
        </div>
      )}

      {/* MATHEMATICALLY LOCKED PRISMATIC GLASS BLADE LINE */}
      {edgeGlint > 0.01 && (
        <svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 80,
          }}
        >
          <defs>
            <linearGradient id="prismGlintGrad" x1={xTop * 10} y1="0" x2={xBottom * 10} y2="1000" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="20%" stopColor="#FFFFFF" stopOpacity={edgeGlint} />
              <stop offset="50%" stopColor="#D4AF37" stopOpacity={edgeGlint} />
              <stop offset="80%" stopColor="#FFFFFF" stopOpacity={edgeGlint} />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <filter id="prismGlow">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <line
            x1={xTop * 10}
            y1={0}
            x2={xBottom * 10}
            y2={1000}
            stroke="url(#prismGlintGrad)"
            strokeWidth="10"
            filter="url(#prismGlow)"
          />
        </svg>
      )}

      {/* AMBIENT SPECULAR LENS WASH */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          mixBlendMode: "overlay",
          opacity: edgeGlint * 0.45,
          background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%)",
        }}
      />
    </AbsoluteFill>
  );
};
