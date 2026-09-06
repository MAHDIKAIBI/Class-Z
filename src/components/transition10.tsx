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

export const CinematicMatchCutTransition: React.FC<CinematicMatchCutTransitionProps> = ({ 
  SceneA, 
  SceneB, 
  durationInFrames = 30 
}) => {
  const frame = useCurrentFrame();

  const midpoint = Math.floor(durationInFrames / 2);

  // 1. SCENE A: EXPONENTIAL ZOOM DIVE INTO CENTER
  const zoomA = interpolate(
    frame,
    [0, midpoint],
    [1.0, 3.2],
    { easing: Easing.bezier(0.6, 0.0, 0.8, 1.0), extrapolateRight: "clamp" }
  );
  const blurA = interpolate(
    frame,
    [0, midpoint],
    [0, 30],
    { easing: Easing.in(Easing.cubic), extrapolateRight: "clamp" }
  );
  const opacityA = interpolate(
    frame,
    [midpoint - 3, midpoint],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 2. SCENE B: ERUPTS FROM MACRO POINT OUTWARD
  const zoomB = interpolate(
    frame,
    [midpoint, durationInFrames],
    [0.35, 1.0],
    { easing: Easing.bezier(0.1, 0.8, 0.2, 1.0), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const blurB = interpolate(
    frame,
    [midpoint, durationInFrames],
    [25, 0],
    { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacityB = interpolate(
    frame,
    [midpoint, midpoint + 4],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 3. RADIAL MATCH-CUT SHOCKWAVE EXPANSION
  const shockwaveRadius = interpolate(
    frame,
    [midpoint - 2, durationInFrames],
    [0, 140],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const shockwaveOpacity = interpolate(
    frame,
    [midpoint - 2, midpoint + 2, durationInFrames],
    [0, 0.9, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 4. CENTRAL LIGHT FLARE AT CONTACT POINT
  const centerFlare = interpolate(
    frame,
    [midpoint - 4, midpoint, midpoint + 5],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#020306", overflow: "hidden" }}>
      {/* SCENE A (Zooms into center macro vortex) */}
      <AbsoluteFill
        style={{
          transform: `scale(${zoomA})`,
          filter: `blur(${blurA}px)`,
          opacity: opacityA,
          transformOrigin: "50% 50%",
          pointerEvents: opacityA > 0 ? "auto" : "none",
        }}
      >
        {SceneA}
      </AbsoluteFill>

      {/* SCENE B (Expands from center focal origin) */}
      <AbsoluteFill
        style={{
          transform: `scale(${zoomB})`,
          filter: `blur(${blurB}px)`,
          opacity: opacityB,
          transformOrigin: "50% 50%",
          pointerEvents: opacityB > 0 ? "auto" : "none",
        }}
      >
        {SceneB}
      </AbsoluteFill>

      {/* MATCH CUT RADIAL SHOCKWAVE */}
      {shockwaveOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            mixBlendMode: "screen",
            opacity: shockwaveOpacity,
            background: `radial-gradient(circle at 50% 50%, transparent ${Math.max(0, shockwaveRadius - 20)}%, rgba(212, 175, 55, 0.7) ${shockwaveRadius}%, rgba(255, 255, 255, 0.9) ${shockwaveRadius + 3}%, transparent ${shockwaveRadius + 15}%)`,
            filter: "blur(4px)",
          }}
        />
      )}

      {/* VOLUMETRIC CENTER CORE FLARE */}
      {centerFlare > 0.01 && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            mixBlendMode: "screen",
            opacity: centerFlare,
            background: "radial-gradient(circle at 50% 50%, #FFFFFF 0%, #F5D77F 25%, #D4AF37 50%, transparent 75%)",
            filter: "blur(8px)",
          }}
        />
      )}

      {/* PERIMETER DEPTH VIGNETTE */}
      <AbsoluteFill
        style={{
          boxShadow: `inset 0 0 ${interpolate(frame, [0, midpoint, durationInFrames], [0, 300, 0])}px rgba(0, 0, 0, 0.9)`,
          pointerEvents: "none",
          zIndex: 80,
        }}
      />
    </AbsoluteFill>
  );
};
