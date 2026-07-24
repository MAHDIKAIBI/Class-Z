import { 
  AbsoluteFill, 
  useCurrentFrame, 
  interpolate, 
  Easing,
  Audio,
  staticFile
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

  // 1. THE PHYSICS ENGINE
  const crashEase = Easing.bezier(0.9, 0, 0.1, 1);

  const cameraZ = interpolate(frame, [0, durationInFrames], [0, -4000], {
    easing: crashEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 2. TRUE VELOCITY MOTION BLUR
  const prevFrame = Math.max(0, frame - 1);
  const prevCameraZ = interpolate(prevFrame, [0, durationInFrames], [0, -4000], {
    easing: crashEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const depthVelocity = Math.abs(cameraZ - prevCameraZ);
  const opticalBlur = Math.min(depthVelocity * 0.12, 60);

  // 3. CINEMATIC LENS BURN
  const exposureFlash = interpolate(
    frame,
    [0, durationInFrames / 2, durationInFrames],
    [0, 0.45, 0],
    { easing: Easing.triangle, extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 4. OPACITY ROUTING
  const opacityA = interpolate(frame, [0, durationInFrames * 0.45], [1, 0], { extrapolateRight: "clamp" });
  const opacityB = interpolate(frame, [durationInFrames * 0.35, durationInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // 5. SCALE DISTORTION (Warp Effect)
  const zScaleWarp = interpolate(depthVelocity, [0, 500], [1, 1.4], { extrapolateRight: "clamp" });
  
  // 6. AUDIO DYNAMICS
  const sfxVolume = interpolate(depthVelocity, [0, 500], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#020202", perspective: "1500px", overflow: "hidden" }}>
      
      {/* LOCAL SFX */}
      <Audio 
        src={staticFile("crash.wav")}
        volume={sfxVolume}
      />

      {/* THE 3D MOVEMENT RIG */}
      <AbsoluteFill style={{
        filter: `blur(${opticalBlur}px)`,
        justifyContent: "center",
        alignItems: "center"
      }}>
        
        {/* SCENE A (Origin Point) */}
        <AbsoluteFill style={{ 
          opacity: opacityA, 
          transform: `translate3d(0px, 0px, ${-cameraZ}px) scaleZ(${zScaleWarp})`,
          pointerEvents: opacityA > 0 ? "auto" : "none" 
        }}>
          {SceneA}
        </AbsoluteFill>

        {/* SCENE B (Destination Point) */}
        <AbsoluteFill style={{ 
          opacity: opacityB, 
          transform: `translate3d(0px, 0px, ${-4000 - cameraZ}px) scaleZ(${zScaleWarp})`,
          pointerEvents: opacityB > 0 ? "auto" : "none" 
        }}>
          {SceneB}
        </AbsoluteFill>
        
      </AbsoluteFill>

      {/* OVERLAY: OPTICAL EXPOSURE FLASH */}
      <AbsoluteFill style={{
        backgroundColor: "#ffffff",
        opacity: exposureFlash,
        mixBlendMode: "overlay",
        pointerEvents: "none",
        zIndex: 100
      }} />
      
      {/* OVERLAY: CHROMATIC ABERRATION DIRT */}
      <div style={{
        position: "absolute", inset: 0,
        boxShadow: `inset 0 0 ${exposureFlash * 500}px rgba(255, 40, 80, ${exposureFlash * 0.15})`,
        pointerEvents: "none",
        zIndex: 101
      }} />

    </AbsoluteFill>
  );
};
