import { 
  AbsoluteFill, 
  useCurrentFrame, 
  interpolate, 
  Easing,
  staticFile,
  Audio
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
  durationInFrames = 45 // This requires a slightly longer duration to let the silence sit
}) => {
  const frame = useCurrentFrame();

  // 1. THE FOCUS PULL (Heavy Optical Blur)
  // Scene A blurs heavily into the midpoint, Scene B starts heavily blurred and sharpens
  const opticalBlurA = interpolate(
    frame,
    [0, durationInFrames / 2],
    [0, 50], // Extreme 50px blur to mimic a fully defocused cinema lens
    { easing: Easing.in(Easing.cubic), extrapolateRight: "clamp" }
  );

  const opticalBlurB = interpolate(
    frame,
    [durationInFrames / 2, durationInFrames],
    [50, 0], 
    { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 2. THE DIP TO PITCH BLACK
  // Scene A fades out slightly before the midpoint, leaving a moment of pure darkness
  const opacityA = interpolate(
    frame,
    [0, (durationInFrames / 2) - 5], 
    [1, 0], 
    { easing: Easing.in(Easing.quad), extrapolateRight: "clamp" }
  );

  // Scene B waits in the dark, then fades in
  const opacityB = interpolate(
    frame,
    [(durationInFrames / 2) + 5, durationInFrames], 
    [0, 1], 
    { easing: Easing.out(Easing.quad), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 3. MICRO-ZOOM (Lens Breathing)
  // Even though the camera isn't moving, physical lenses slightly scale the image when focus changes
  const scaleA = interpolate(frame, [0, durationInFrames / 2], [1, 1.05], { extrapolateRight: "clamp" });
  const scaleB = interpolate(frame, [durationInFrames / 2, durationInFrames], [1.05, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
      
      {/* 
        THE SUB-BASS IMPACT
        Deep, cinematic low-frequency boom.
      */}
      <Audio 
        src={staticFile("sub_bass_drop.wav")} 
        volume={(f) => interpolate(f, [0, durationInFrames / 2, durationInFrames], [0, 1, 0], { extrapolateRight: "clamp" })}
      />

      {/* SCENE A (Fading into the void) */}
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

      {/* SCENE B (Emerging from the void) */}
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

      {/* GLOBAL VIGNETTE (Constricts the edges to force the eye into the center darkness) */}
      <AbsoluteFill style={{
        boxShadow: `inset 0 0 ${interpolate(frame, [0, durationInFrames / 2, durationInFrames], [0, 400, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px rgba(0, 0, 0, 1)`,
        pointerEvents: "none",
        zIndex: 100
      }} />

    </AbsoluteFill>
  );
};
