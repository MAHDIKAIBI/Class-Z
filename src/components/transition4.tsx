import { 
  AbsoluteFill, 
  useCurrentFrame, 
  interpolate, 
  Easing,
} from "remotion";
import React from "react";

export type RackToBlackTransitionProps = {
  SceneA: React.ReactNode;
  SceneB: React.ReactNode;
  durationInFrames?: number;
};

export const RackToBlackTransition: React.FC<RackToBlackTransitionProps> = ({ 
  SceneA, 
  SceneB, 
  durationInFrames = 36
}) => {
  const frame = useCurrentFrame();

  const halfDuration = durationInFrames / 2;

  // 1. ANAMORPHIC FOCUS PULL (Heavy optical defocus with physical lens breathing)
  const opticalBlurA = interpolate(
    frame,
    [0, halfDuration],
    [0, 42],
    { easing: Easing.in(Easing.cubic), extrapolateRight: "clamp" }
  );

  const opticalBlurB = interpolate(
    frame,
    [halfDuration, durationInFrames],
    [42, 0], 
    { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 2. LENS BREATHING (Micro-zoom during focus barrel rotation)
  const scaleA = interpolate(frame, [0, halfDuration], [1, 1.04], { extrapolateRight: "clamp" });
  const scaleB = interpolate(frame, [halfDuration, durationInFrames], [1.04, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // 3. OBSIDIAN SHUTTER CONSTRICTION (S-curve dip into pure black)
  const opacityA = interpolate(
    frame,
    [0, halfDuration - 4], 
    [1, 0], 
    { easing: Easing.in(Easing.quad), extrapolateRight: "clamp" }
  );

  const opacityB = interpolate(
    frame,
    [halfDuration + 4, durationInFrames], 
    [0, 1], 
    { easing: Easing.out(Easing.quad), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 4. OBSIDIAN IRIS VIGNETTE (Tightens around the center into the void)
  const irisTighten = interpolate(
    frame,
    [0, halfDuration, durationInFrames],
    [0, 1, 0],
    { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 5. NOBLE GOLD HORIZON SPARK (A microscopic glint at the dead center of the narrative void)
  const horizonGlint = interpolate(
    frame,
    [halfDuration - 3, halfDuration, halfDuration + 3],
    [0, 0.65, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#010203", overflow: "hidden" }}>

      {/* SCENE A (Fading into the obsidian void) */}
      <AbsoluteFill style={{ 
        opacity: opacityA, 
        transform: `scale(${scaleA})`,
        filter: `blur(${opticalBlurA}px)`,
        pointerEvents: opacityA > 0 ? "auto" : "none",
        justifyContent: "center",
        alignItems: "center"
      }}>
        {SceneA}
      </AbsoluteFill>

      {/* SCENE B (Emerging from the obsidian void) */}
      <AbsoluteFill style={{ 
        opacity: opacityB, 
        transform: `scale(${scaleB})`,
        filter: `blur(${opticalBlurB}px)`,
        pointerEvents: opacityB > 0 ? "auto" : "none",
        justifyContent: "center",
        alignItems: "center"
      }}>
        {SceneB}
      </AbsoluteFill>

      {/* OVERLAY 1: OBSIDIAN IRIS VIGNETTE */}
      <AbsoluteFill style={{
        background: `radial-gradient(circle at center, transparent ${interpolate(irisTighten, [0, 1], [60, 15])}%, rgba(1, 2, 3, ${irisTighten * 0.95}) 100%)`,
        pointerEvents: "none",
        zIndex: 99
      }} />

    </AbsoluteFill>
  );
};
