import { 
  AbsoluteFill, 
  useCurrentFrame, 
  interpolate, 
  Easing,
} from "remotion";
import React from "react";

export type SpatialWhipTransitionProps = {
  SceneA: React.ReactNode;
  SceneB: React.ReactNode;
  durationInFrames?: number;
  direction?: "left" | "right";
};

/**
 * FILMIC LATERAL GLIDE (Transition 2 - Redesigned)
 * Replaces violent 180-degree whip-pan with a luxury 35mm cinematic slide.
 * Uses optical shutter velocity blur, subtle anamorphic lens streak, and 
 * smooth ease-in-out momentum without disorienting backflips.
 */
export const SpatialWhipTransition: React.FC<SpatialWhipTransitionProps> = ({ 
  SceneA, 
  SceneB, 
  durationInFrames = 30,
  direction = "right"
}) => {
  const frame = useCurrentFrame();

  // 1. SILKY CINEMATIC EASING CURVE
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dirSign = direction === "right" ? 1 : -1;

  // 2. LATERAL TRANSLATION (Smooth 35mm tracking glide)
  // Scene A glides gently outward (-28%), Scene B glides gracefully in (+28% -> 0%)
  const transXA = interpolate(progress, [0, 1], [0, -28 * dirSign]);
  const transXB = interpolate(progress, [0, 1], [28 * dirSign, 0]);

  // 3. SUBTLE SCALE BREATHING (Adds depth without nausea)
  const scaleA = interpolate(progress, [0, 1], [1.0, 1.03]);
  const scaleB = interpolate(progress, [0, 1], [1.04, 1.0]);

  // 4. OPTICAL 35MM SHUTTER MOTION BLUR (Smooth bell curve, capped at 14px)
  const shutterBlur = interpolate(
    progress,
    [0, 0.5, 1],
    [0, 14, 0],
    { easing: Easing.inOut(Easing.ease), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 5. SEAMLESS OVERLAPPING CROSSFADE
  const opacityA = interpolate(progress, [0.35, 0.65], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacityB = interpolate(progress, [0.35, 0.65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 6. DELICATE ANAMORPHIC LIGHT STREAK AT MIDPOINT
  const streakOpacity = interpolate(
    progress,
    [0.3, 0.5, 0.7],
    [0, 0.28, 0],
    { easing: Easing.inOut(Easing.ease), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#020306", overflow: "hidden" }}>
      {/* SCENE A (Glides smoothly out with subtle motion blur) */}
      <AbsoluteFill
        style={{
          transform: `translateX(${transXA}%) scale(${scaleA})`,
          filter: shutterBlur > 0.5 ? `blur(${shutterBlur}px)` : "none",
          opacity: opacityA,
          pointerEvents: opacityA > 0 ? "auto" : "none",
        }}
      >
        {SceneA}
      </AbsoluteFill>

      {/* SCENE B (Glides smoothly in with matching momentum) */}
      <AbsoluteFill
        style={{
          transform: `translateX(${transXB}%) scale(${scaleB})`,
          filter: shutterBlur > 0.5 ? `blur(${shutterBlur}px)` : "none",
          opacity: opacityB,
          pointerEvents: opacityB > 0 ? "auto" : "none",
        }}
      >
        {SceneB}
      </AbsoluteFill>

      {/* SUBTLE HORIZONTAL ANAMORPHIC STREAK */}
      {streakOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            mixBlendMode: "screen",
            opacity: streakOpacity,
            background: `linear-gradient(${direction === "right" ? "90deg" : "-90deg"}, transparent 10%, rgba(200, 230, 255, 0.8) 50%, transparent 90%)`,
            filter: "blur(4px)",
          }}
        />
      )}

      {/* DELICATE EDGE VIGNETTE ACCENT */}
      {streakOpacity > 0.01 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            boxShadow: `inset 0 0 100px rgba(0, 0, 0, ${streakOpacity * 0.6})`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

