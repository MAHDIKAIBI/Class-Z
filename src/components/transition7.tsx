import { 
  AbsoluteFill, 
  useCurrentFrame, 
  interpolate, 
  Easing,
} from "remotion";
import React from "react";

export type ZoomSpinVortexTransitionProps = {
  SceneA: React.ReactNode;
  SceneB: React.ReactNode;
  durationInFrames?: number;
};

/**
 * VERTIGO DOLLY PUSH (Transition 7 - Redesigned)
 * Replaces aggressive rotational zoom-spin and shockwaves with a pure
 * Hitchcock-style Vertigo dolly zoom. Smooth focal push (1.0x -> 1.18x) into 
 * Scene A, seamless optical crossfade, and a settling pull-out (1.12x -> 1.0x)
 * into Scene B with soft depth-of-field racking.
 */
export const ZoomSpinVortexTransition: React.FC<ZoomSpinVortexTransitionProps> = ({ 
  SceneA, 
  SceneB, 
  durationInFrames = 30 
}) => {
  const frame = useCurrentFrame();

  // 1. SMOOTH CINEMATIC EASING CURVE
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 2. CONTROLLED VERTIGO DOLLY ZOOM (Zero spin, cinematic scale momentum)
  const scaleA = interpolate(progress, [0, 1], [1.0, 1.18]);
  const scaleB = interpolate(progress, [0, 1], [1.12, 1.0]);

  // 3. OPTICAL DEPTH DEFOCUS (Soft, subtle rack focus - max 8px)
  const blurA = interpolate(progress, [0.2, 0.7], [0, 8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const blurB = interpolate(progress, [0.3, 0.8], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 4. SEAMLESS OVERLAPPING CROSSFADE
  const opacityA = interpolate(progress, [0.35, 0.65], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacityB = interpolate(progress, [0.35, 0.65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 5. SUBTLE OPTICAL FOCAL FLARE (Gentle central glow at transition apex)
  const opticalGlow = interpolate(
    progress,
    [0.3, 0.5, 0.7],
    [0, 0.22, 0],
    { easing: Easing.inOut(Easing.ease), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#020306", overflow: "hidden" }}>
      {/* SCENE A (Pushes forward gently into camera with soft focal rack) */}
      <AbsoluteFill
        style={{
          transform: `scale(${scaleA})`,
          filter: blurA > 0.5 ? `blur(${blurA}px)` : "none",
          opacity: opacityA,
          transformOrigin: "center center",
          pointerEvents: opacityA > 0 ? "auto" : "none",
        }}
      >
        {SceneA}
      </AbsoluteFill>

      {/* SCENE B (Pulls back gently to 1.0x as focus resolves) */}
      <AbsoluteFill
        style={{
          transform: `scale(${scaleB})`,
          filter: blurB > 0.5 ? `blur(${blurB}px)` : "none",
          opacity: opacityB,
          transformOrigin: "center center",
          pointerEvents: opacityB > 0 ? "auto" : "none",
        }}
      >
        {SceneB}
      </AbsoluteFill>

      {/* DELICATE OPTICAL CENTER GLOW AT APEX */}
      {opticalGlow > 0.01 && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            mixBlendMode: "screen",
            opacity: opticalGlow,
            background: "radial-gradient(ellipse at 50% 50%, rgba(255, 230, 180, 0.6) 0%, rgba(220, 180, 100, 0.2) 40%, transparent 70%)",
            filter: "blur(10px)",
          }}
        />
      )}

      {/* CINEMATIC PERIMETER VIGNETTE */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: `inset 0 0 120px rgba(0, 0, 0, ${0.4 + opticalGlow * 0.4})`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

