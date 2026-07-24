import { 
  AbsoluteFill, 
  useCurrentFrame, 
  interpolate, 
  Easing,
  staticFile,
  Audio
} from "remotion";
import React from "react";

export type ThermalFlareTransitionProps = {
  SceneA: React.ReactNode;
  SceneB: React.ReactNode;
  durationInFrames?: number;
};

export const ThermalFlareTransition: React.FC<ThermalFlareTransitionProps> = ({ 
  SceneA, 
  SceneB, 
  durationInFrames = 20 
}) => {
  const frame = useCurrentFrame();

  // 1. THERMAL EXPOSURE (The Volumetric Flash)
  // Premium exponential easing: Holds low, explodes brilliantly in the center, decays fast.
  const thermalFlash = interpolate(
    frame,
    [0, durationInFrames / 2, durationInFrames],
    [0, 1, 0],
    { easing: Easing.inOut(Easing.exp), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 2. HEAT DISTORTION BLUR
  // A clean 35px blur creates deep depth-of-field melting
  const heatBlur = interpolate(
    frame,
    [0, durationInFrames / 2, durationInFrames],
    [0, 35, 0],
    { easing: Easing.inOut(Easing.ease), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 3. CINEMATIC PUSH (Forward momentum)
  const scaleA = interpolate(frame, [0, durationInFrames], [1, 1.15], { extrapolateRight: "clamp" });
  const scaleB = interpolate(frame, [0, durationInFrames], [1, 1.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // 4. CROSSFADE ROUTING
  // Tighter crossfade right at the peak of the flash to mask the cut
  const opacityA = interpolate(frame, [0, durationInFrames * 0.55], [1, 0], { extrapolateRight: "clamp" });
  const opacityB = interpolate(frame, [durationInFrames * 0.45, durationInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#020202", overflow: "hidden" }}>
      
      {/* HIGH-END SFX INTEGRATION */}
      <Audio 
        src={staticFile("pcht.wav")} 
        volume={thermalFlash}
      />

      {/* THE CAMERA RIG */}
      <AbsoluteFill style={{
        filter: `blur(${heatBlur}px)`,
        justifyContent: "center",
        alignItems: "center"
      }}>
        
        {/* SCENE A (Origin) */}
        <AbsoluteFill style={{ 
          opacity: opacityA, 
          transform: `scale(${scaleA})`,
          pointerEvents: opacityA > 0 ? "auto" : "none" 
        }}>
          {SceneA}
        </AbsoluteFill>

        {/* SCENE B (Destination) */}
        <AbsoluteFill style={{ 
          opacity: opacityB, 
          transform: `scale(${scaleB})`,
          pointerEvents: opacityB > 0 ? "auto" : "none" 
        }}>
          {SceneB}
        </AbsoluteFill>
        
      </AbsoluteFill>

      {/* OVERLAY 1: FILM BURN LIGHT LEAK (Organic Horizontal Edge Bleed) */}
      <AbsoluteFill style={{
        background: `linear-gradient(90deg, rgba(255, 10, 10, ${thermalFlash * 0.8}) 0%, rgba(255, 80, 0, ${thermalFlash * 0.5}) 20%, transparent 50%, rgba(255, 80, 0, ${thermalFlash * 0.5}) 80%, rgba(255, 10, 10, ${thermalFlash * 0.8}) 100%)`,
        mixBlendMode: "screen",
        pointerEvents: "none",
        zIndex: 100
      }} />

      {/* OVERLAY 2: THE HOT CORE (Explosive Yellow/White Center Ignition) */}
      <AbsoluteFill style={{
        background: `radial-gradient(circle at center, rgba(255, 240, 200, ${thermalFlash}) 0%, rgba(255, 100, 0, ${thermalFlash * 0.6}) 40%, transparent 70%)`,
        mixBlendMode: "color-dodge", // Color dodge creates ultra-premium HDR light mapping
        pointerEvents: "none",
        zIndex: 101
      }} />
      
      {/* OVERLAY 3: CINEMATIC VIGNETTE (Crushes the blacks dynamically) */}
      <AbsoluteFill style={{
        boxShadow: `inset 0 0 ${thermalFlash * 600}px rgba(0, 0, 0, ${thermalFlash})`,
        pointerEvents: "none",
        zIndex: 102
      }} />

    </AbsoluteFill>
  );
};
