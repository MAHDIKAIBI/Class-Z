import { 
  AbsoluteFill, 
  useCurrentFrame, 
  interpolate, 
  Easing,
} from "remotion";
import React from "react";

export type CinematicMatchCutTransitionProps = {
  SceneA: React.ReactNode;
  SceneB: React.ReactNode;
  durationInFrames?: number;
};

/**
 * FOCAL ANCHOR MORPH CUT (Transition 10 - Redesigned)
 * Replaces aggressive macro dive and explosive shockwaves with an elegant
 * focal anchor match cut. Subtle center push (1.0x -> 1.12x), gentle optical
 * defocus, smooth crossfade, and an anamorphic lens streak at the cut point.
 */
export const CinematicMatchCutTransition: React.FC<CinematicMatchCutTransitionProps> = ({ 
  SceneA, 
  SceneB, 
  durationInFrames = 30 
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 1. GENTLE FOCAL DRIFT (Anchors the subject without disorientation)
  const scaleA = interpolate(progress, [0, 1], [1.0, 1.12]);
  const scaleB = interpolate(progress, [0, 1], [1.08, 1.0]);

  // 2. SOFT OPTICAL DEFOCUS AT CUT POINT
  const blur = interpolate(
    progress,
    [0, 0.5, 1],
    [0, 7, 0],
    { easing: Easing.inOut(Easing.ease), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 3. SEAMLESS OVERLAPPING CROSSFADE
  const opacityA = interpolate(progress, [0.35, 0.65], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacityB = interpolate(progress, [0.35, 0.65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 4. DELICATE HORIZONTAL ANAMORPHIC FLARE AT APEX
  const flareOpacity = interpolate(
    progress,
    [0.35, 0.5, 0.65],
    [0, 0.32, 0],
    { easing: Easing.inOut(Easing.ease), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#020306", overflow: "hidden" }}>
      {/* SCENE A (Gently drifts forward, keeping subject anchored) */}
      <AbsoluteFill
        style={{
          transform: `scale(${scaleA})`,
          filter: blur > 0.5 ? `blur(${blur}px)` : "none",
          opacity: opacityA,
          transformOrigin: "50% 50%",
          pointerEvents: opacityA > 0 ? "auto" : "none",
        }}
      >
        {SceneA}
      </AbsoluteFill>

      {/* SCENE B (Resolves smoothly into anchor position) */}
      <AbsoluteFill
        style={{
          transform: `scale(${scaleB})`,
          filter: blur > 0.5 ? `blur(${blur}px)` : "none",
          opacity: opacityB,
          transformOrigin: "50% 50%",
          pointerEvents: opacityB > 0 ? "auto" : "none",
        }}
      >
        {SceneB}
      </AbsoluteFill>

      {/* SUBTLE HORIZONTAL ANAMORPHIC STREAK AT CUT POINT */}
      {flareOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            mixBlendMode: "screen",
            opacity: flareOpacity,
            background: "linear-gradient(90deg, transparent 15%, rgba(200, 230, 255, 0.8) 50%, transparent 85%)",
            transform: "scaleY(0.18)",
            filter: "blur(6px)",
          }}
        />
      )}

      {/* SOFT OPTICAL GLOW CORE */}
      {flareOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            mixBlendMode: "screen",
            opacity: flareOpacity * 0.7,
            background: "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.9) 0%, rgba(212, 175, 55, 0.4) 30%, transparent 65%)",
            filter: "blur(10px)",
          }}
        />
      )}

      {/* PERIMETER DEPTH VIGNETTE */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: `inset 0 0 100px rgba(0, 0, 0, ${0.4 + flareOpacity * 0.5})`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

