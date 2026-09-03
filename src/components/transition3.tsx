import { 
  AbsoluteFill, 
  useCurrentFrame, 
  interpolate, 
  Easing,
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
  durationInFrames = 24 
}) => {
  const frame = useCurrentFrame();

  // 1. 35MM KODAK GOLD FILM BURN EXPOSURE (Organic Bell Curve)
  const burnIntensity = interpolate(
    frame,
    [0, durationInFrames * 0.48, durationInFrames],
    [0, 1, 0],
    { easing: Easing.inOut(Easing.exp), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 2. OPTICAL HEAT BLUR (Subtle lens melting)
  const opticalBlur = interpolate(
    frame,
    [0, durationInFrames * 0.48, durationInFrames],
    [0, 24, 0],
    { easing: Easing.inOut(Easing.ease), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 3. CINEMATIC PUSH-THROUGH (Forward momentum)
  const scaleA = interpolate(frame, [0, durationInFrames], [1, 1.08], { extrapolateRight: "clamp" });
  const scaleB = interpolate(frame, [0, durationInFrames], [1.08, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // 4. CROSSFADE ROUTING (Hidden right at the peak of the golden solar bloom)
  const opacityA = interpolate(frame, [0, durationInFrames * 0.52], [1, 0], { extrapolateRight: "clamp" });
  const opacityB = interpolate(frame, [durationInFrames * 0.46, durationInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // 5. ASYMMETRIC LIGHT LEAK TRAVELLING ACROSS FRAME
  const leakSweepX = interpolate(frame, [0, durationInFrames], [-20, 120]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#020305", overflow: "hidden" }}>
      
      {/* THE CAMERA RIG */}
      <AbsoluteFill style={{
        filter: `blur(${opticalBlur}px)`,
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

      {/* OVERLAY 1: 35MM CELLULOID GOLD LIGHT LEAK (Sweeps across frame) */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at ${leakSweepX}% 40%, rgba(255, 242, 168, ${burnIntensity * 0.9}) 0%, rgba(226, 183, 20, ${burnIntensity * 0.6}) 30%, rgba(170, 133, 41, ${burnIntensity * 0.25}) 55%, transparent 80%)`,
        mixBlendMode: "screen",
        pointerEvents: "none",
        zIndex: 100
      }} />

      {/* OVERLAY 2: SOLAR HALATION CORE (Ivory/Champagne Specular Ignition) */}
      <AbsoluteFill style={{
        background: `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, ${burnIntensity * 0.95}) 0%, rgba(255, 223, 115, ${burnIntensity * 0.5}) 30%, transparent 65%)`,
        mixBlendMode: "color-dodge",
        pointerEvents: "none",
        zIndex: 101
      }} />

      {/* OVERLAY 3: FILM HALATION EDGE BLEED */}
      <AbsoluteFill style={{
        background: `linear-gradient(135deg, rgba(212, 175, 55, ${burnIntensity * 0.4}) 0%, transparent 40%, transparent 60%, rgba(212, 175, 55, ${burnIntensity * 0.4}) 100%)`,
        mixBlendMode: "screen",
        pointerEvents: "none",
        zIndex: 102
      }} />
      
      {/* OVERLAY 4: DEEP BLACK CINEMATIC VIGNETTE */}
      <AbsoluteFill style={{
        boxShadow: `inset 0 0 ${burnIntensity * 400}px rgba(2, 3, 5, ${burnIntensity * 0.9})`,
        pointerEvents: "none",
        zIndex: 103
      }} />

    </AbsoluteFill>
  );
};
