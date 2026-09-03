import { 
  AbsoluteFill, 
  useCurrentFrame, 
  interpolate, 
  Easing,
} from "remotion";
import React from "react";

export type ZCrashTransitionProps = {
  SceneA: React.ReactNode;
  SceneB: React.ReactNode;
  durationInFrames?: number;
};

export const ZAxisCrashTransition: React.FC<ZCrashTransitionProps> = ({ 
  SceneA, 
  SceneB, 
  durationInFrames = 30 
}) => {
  const frame = useCurrentFrame();

  // 1. CINEMATIC INERTIA PHYSICS (Heavy acceleration, smooth cushion)
  const crashEase = Easing.bezier(0.85, 0.0, 0.15, 1.0);

  const cameraZ = interpolate(frame, [0, durationInFrames], [0, -4500], {
    easing: crashEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Velocity derivation for optical blur
  const prevFrame = Math.max(0, frame - 1);
  const prevCameraZ = interpolate(prevFrame, [0, durationInFrames], [0, -4500], {
    easing: crashEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const depthVelocity = Math.abs(cameraZ - prevCameraZ);
  const opticalBlur = Math.min(depthVelocity * 0.11, 48);

  // 2. HANDHELD CAMERA INERTIA (Subtle dynamic tilt during high-G acceleration)
  const cameraRoll = interpolate(frame, [0, durationInFrames / 2, durationInFrames], [0, -1.8, 0], {
    easing: Easing.inOut(Easing.ease),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 3. ANAMORPHIC GOLDEN IRIS FLARE (Replaces generic white flash)
  const flareIntensity = interpolate(
    frame,
    [durationInFrames * 0.3, durationInFrames * 0.5, durationInFrames * 0.7],
    [0, 1, 0],
    { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 4. SCENE OPACITY MAPPING (Seamless crossfade right behind the optical flare peak)
  const opacityA = interpolate(frame, [0, durationInFrames * 0.52], [1, 0], { extrapolateRight: "clamp" });
  const opacityB = interpolate(frame, [durationInFrames * 0.48, durationInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // 5. SCALE WARP DISTORTION
  const zScaleWarp = interpolate(depthVelocity, [0, 500], [1, 1.35], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#020305", perspective: "1600px", overflow: "hidden" }}>
      
      {/* THE 3D MOVEMENT RIG */}
      <AbsoluteFill style={{
        filter: `blur(${opticalBlur}px)`,
        transform: `rotateZ(${cameraRoll}deg)`,
        justifyContent: "center",
        alignItems: "center"
      }}>
        
        {/* SCENE A (Origin Point plunging toward viewer) */}
        <AbsoluteFill style={{ 
          opacity: opacityA, 
          transform: `translate3d(0px, 0px, ${-cameraZ}px) scaleZ(${zScaleWarp})`,
          pointerEvents: opacityA > 0 ? "auto" : "none" 
        }}>
          {SceneA}
        </AbsoluteFill>

        {/* SCENE B (Destination Point arriving from deep Z-space) */}
        <AbsoluteFill style={{ 
          opacity: opacityB, 
          transform: `translate3d(0px, 0px, ${-4500 - cameraZ}px) scaleZ(${zScaleWarp})`,
          pointerEvents: opacityB > 0 ? "auto" : "none" 
        }}>
          {SceneB}
        </AbsoluteFill>
        
      </AbsoluteFill>

      {/* OVERLAY 1: LUXURY GOLD HORIZONTAL ANAMORPHIC STREAK */}
      <AbsoluteFill style={{
        background: `linear-gradient(90deg, transparent 10%, rgba(255, 242, 168, ${flareIntensity * 0.95}) 50%, transparent 90%)`,
        height: "6px",
        top: "50%",
        transform: "translateY(-50%)",
        boxShadow: `0 0 ${flareIntensity * 80}px rgba(212, 175, 55, ${flareIntensity})`,
        mixBlendMode: "screen",
        pointerEvents: "none",
        zIndex: 99
      }} />

      {/* OVERLAY 2: VOLUMETRIC GOLD IRIS BURST */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at center, rgba(255, 255, 255, ${flareIntensity * 0.9}) 0%, rgba(255, 223, 115, ${flareIntensity * 0.6}) 25%, rgba(212, 175, 55, ${flareIntensity * 0.25}) 50%, transparent 75%)`,
        mixBlendMode: "screen",
        pointerEvents: "none",
        zIndex: 100
      }} />

      {/* OVERLAY 3: CINEMATIC PERIMETER VIGNETTE */}
      <AbsoluteFill style={{
        background: "radial-gradient(circle at center, transparent 40%, rgba(2, 3, 5, 0.85) 100%)",
        mixBlendMode: "multiply",
        pointerEvents: "none",
        zIndex: 101
      }} />

    </AbsoluteFill>
  );
};
