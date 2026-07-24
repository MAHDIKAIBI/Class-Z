import { 
  AbsoluteFill, 
  useCurrentFrame, 
  interpolate, 
  Easing,
  Audio,
  staticFile
} from "remotion";
import React from "react";

export type SpatialWhipTransitionProps = {
  SceneA: React.ReactNode;
  SceneB: React.ReactNode;
  durationInFrames?: number;
  direction?: "left" | "right";
};

export const SpatialWhipTransition: React.FC<SpatialWhipTransitionProps> = ({ 
  SceneA, 
  SceneB, 
  durationInFrames = 30,
  direction = "right"
}) => {
  const frame = useCurrentFrame();

  // 1. HEAVY BEZIER CURVE (Holds steady, snaps violently, cushions into landing)
  const whipEase = Easing.bezier(0.5, 0.0, 0.5, 1.0);
  const targetAngle = direction === "right" ? 180 : -180;

  // 2. CAMERA Y-AXIS ROTATION
  const cameraPanY = interpolate(frame, [0, durationInFrames], [0, targetAngle], {
    easing: whipEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 3. VELOCITY-BASED HORIZONTAL MOTION BLUR
  const prevFrame = Math.max(0, frame - 1);
  const prevCameraPanY = interpolate(prevFrame, [0, durationInFrames], [0, targetAngle], {
    easing: whipEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rotationalVelocity = Math.abs(cameraPanY - prevCameraPanY);
  // Maxes out at 55px blur to maintain browser stability at high speed
  const opticalBlur = Math.min(rotationalVelocity * 2.4, 55);

  // 4. MIDPOINT ASSET SWAP
  // At frame midpoint (90 degrees turn), Scene A unmounts and Scene B takes over in 3D space
  const isPastMidpoint = frame >= durationInFrames / 2;

  // 5. ANAMORPHIC LIGHT STREAK AT PEAK VELOCITY
  const whipFlash = interpolate(
    frame,
    [0, durationInFrames / 2, durationInFrames],
    [0, 0.7, 0],
    { easing: Easing.triangle, extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 6. AUDIO DYNAMICS
  // Volume naturally peaks when rotational velocity is highest
  const sfxVolume = interpolate(rotationalVelocity, [0, 45], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#020202", perspective: "1500px", overflow: "hidden" }}>
      
      {/* DYNAMIC SFX: Sharp Whip Pan Swish */}
      <Audio 
        src={staticFile("whip.wav")}
        volume={sfxVolume}
      />

      {/* THE 3D ROTATION RIG */}
      <AbsoluteFill style={{
        transformStyle: "preserve-3d",
        transform: `rotateY(${-cameraPanY}deg)`,
        filter: `blur(${opticalBlur}px)`,
        justifyContent: "center",
        alignItems: "center"
      }}>
        
        {/* SCENE A (Positioned at 0 degrees) */}
        <AbsoluteFill style={{ 
          opacity: !isPastMidpoint ? 1 : 0, 
          transform: "translateZ(0px)",
          pointerEvents: !isPastMidpoint ? "auto" : "none" 
        }}>
          {SceneA}
        </AbsoluteFill>

        {/* SCENE B (Mounted at 180 degrees behind Scene A) */}
        <AbsoluteFill style={{ 
          opacity: isPastMidpoint ? 1 : 0, 
          transform: `rotateY(${targetAngle}deg) translateZ(0px)`,
          pointerEvents: isPastMidpoint ? "auto" : "none" 
        }}>
          {SceneB}
        </AbsoluteFill>
        
      </AbsoluteFill>

      {/* OVERLAY: HORIZONTAL ANAMORPHIC STREAK */}
      <AbsoluteFill style={{
        background: `linear-gradient(${direction === "right" ? "90deg" : "-90deg"}, transparent 20%, rgba(255,255,255,${whipFlash}) 50%, transparent 80%)`,
        pointerEvents: "none",
        zIndex: 100
      }} />

      {/* CHROMATIC BORDER FLASH DURING PEAK PAN */}
      <div style={{
        position: "absolute",
        inset: 0,
        boxShadow: `inset 0 0 ${whipFlash * 200}px rgba(0, 255, 204, ${whipFlash * 0.4})`,
        pointerEvents: "none",
        zIndex: 101
      }} />

    </AbsoluteFill>
  );
};
