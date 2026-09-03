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

export const SpatialWhipTransition: React.FC<SpatialWhipTransitionProps> = ({ 
  SceneA, 
  SceneB, 
  durationInFrames = 30,
  direction = "right"
}) => {
  const frame = useCurrentFrame();

  // 1. HEAVY CINEMATIC BEZIER CURVE (Inertial hold, violent acceleration, smooth settle)
  const whipEase = Easing.bezier(0.65, 0.0, 0.35, 1.0);
  const targetAngle = direction === "right" ? 180 : -180;

  // 2. CAMERA Y-AXIS PAN ROTATION
  const cameraPanY = interpolate(frame, [0, durationInFrames], [0, targetAngle], {
    easing: whipEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 3. VELOCITY COMPUTATION
  const prevFrame = Math.max(0, frame - 1);
  const prevCameraPanY = interpolate(prevFrame, [0, durationInFrames], [0, targetAngle], {
    easing: whipEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rotationalVelocity = Math.abs(cameraPanY - prevCameraPanY);
  const opticalBlur = Math.min(rotationalVelocity * 2.2, 50);

  // 4. CAMERA PULLBACK (Focal compression during whip swing)
  const cameraPullbackZ = interpolate(
    frame,
    [0, durationInFrames / 2, durationInFrames],
    [0, -350, 0],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 5. MIDPOINT SCENE FLIP
  const isPastMidpoint = frame >= durationInFrames / 2;

  // 6. ANAMORPHIC LIGHT STREAK AT PEAK VELOCITY
  const whipFlash = interpolate(
    frame,
    [durationInFrames * 0.25, durationInFrames * 0.5, durationInFrames * 0.75],
    [0, 1, 0],
    { easing: Easing.inOut(Easing.ease), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#020305", perspective: "1800px", overflow: "hidden" }}>
      
      {/* THE 3D ROTATION RIG */}
      <AbsoluteFill style={{
        transformStyle: "preserve-3d",
        transform: `translateZ(${cameraPullbackZ}px) rotateY(${-cameraPanY}deg)`,
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


      {/* OVERLAY 2: CINEMATIC PERIMETER VIGNETTE */}
      <AbsoluteFill style={{
        background: "radial-gradient(circle at center, transparent 35%, rgba(2, 3, 5, 0.8) 100%)",
        mixBlendMode: "multiply",
        pointerEvents: "none",
        zIndex: 100
      }} />

    </AbsoluteFill>
  );
};
