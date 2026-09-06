import { 
  AbsoluteFill, 
  useCurrentFrame, 
  interpolate, 
  spring,
  useVideoConfig,
  Easing,
} from "remotion";
import React from "react";

export type ZoomSpinVortexTransitionProps = {
  SceneA: React.ReactNode;
  SceneB: React.ReactNode;
  durationInFrames?: number;
};

export const ZoomSpinVortexTransition: React.FC<ZoomSpinVortexTransitionProps> = ({ 
  SceneA, 
  SceneB, 
  durationInFrames = 30 
}) => {
  const frame = useCurrentFrame();

  // 1. DYNAMIC FOCAL ZOOM BLUR (Bell curve peaking at exact midpoint, zero tilt)
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  
  // High-velocity optical zoom blur: 0px -> 36px -> 0px
  const zoomBlur = interpolate(
    progress,
    [0, 0.5, 1],
    [0, 36, 0],
    {
      easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // 2. CONTINUOUS FORWARD DIVE SCALING (100% Level, Zero Tilt)
  const scaleA = interpolate(frame, [0, durationInFrames], [1.0, 1.38], {
    easing: Easing.bezier(0.5, 0, 0.2, 1),
    extrapolateRight: "clamp",
  });
  const scaleB = interpolate(frame, [0, durationInFrames], [0.76, 1.0], {
    easing: Easing.bezier(0.2, 0, 0.2, 1),
    extrapolateLeft: "clamp",
  });

  // 3. SEAMLESS CROSSFADE AT PEAK BLUR
  const opacityA = interpolate(frame, [durationInFrames * 0.35, durationInFrames * 0.55], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacityB = interpolate(frame, [durationInFrames * 0.45, durationInFrames * 0.68], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 4. CENTRAL OPTICAL PULSE FLASH
  const flash = interpolate(
    frame,
    [0, durationInFrames / 2, durationInFrames],
    [0, 0.85, 0],
    { easing: Easing.inOut(Easing.ease), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#020306", overflow: "hidden" }}>
      {/* SCENE A (Zooms forward into screen with velocity blur, NO TILT) */}
      <AbsoluteFill
        style={{
          transform: `scale(${scaleA})`,
          filter: `blur(${zoomBlur}px)`,
          opacity: opacityA,
          transformOrigin: "center center",
          pointerEvents: opacityA > 0 ? "auto" : "none",
        }}
      >
        {SceneA}
      </AbsoluteFill>

      {/* SCENE B (Expands forward to 1.0x with resolving blur, NO TILT) */}
      <AbsoluteFill
        style={{
          transform: `scale(${scaleB})`,
          filter: `blur(${zoomBlur}px)`,
          opacity: opacityB,
          transformOrigin: "center center",
          pointerEvents: opacityB > 0 ? "auto" : "none",
        }}
      >
        {SceneB}
      </AbsoluteFill>

      {/* OPTICAL LIGHT FLARE OVERLAY */}
      {flash > 0.01 && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            mixBlendMode: "screen",
            opacity: flash,
            background: `radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(212,175,55,0.4) 60%, rgba(255,255,255,0.8) 72%, transparent 85%)`,
            transform: `scale(${1 + flash * 0.2})`,
            filter: "blur(12px)",
          }}
        />
      )}

      {/* PERIMETER SHOCKWAVE EDGE */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: `inset 0 0 ${flash * 150}px rgba(212, 175, 55, ${flash * 0.6})`,
          pointerEvents: "none",
          zIndex: 90,
        }}
      />
    </AbsoluteFill>
  );
};
