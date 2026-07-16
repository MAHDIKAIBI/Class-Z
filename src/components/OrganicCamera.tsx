import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import React from "react";

export const OrganicCamera: React.FC<{ seed: string, children: React.ReactNode }> = ({ seed, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // 1. FIXED FREQUENCIES (Consistent weight across all shots)
  const freqX = 0.007;
  const freqY = 0.006;
  const freqRot = 0.004;

  // 2. UNIQUE PHASE OFFSETS (Unique starting point per shot)
  const phaseX = random(`${seed}-px`) * 1000;
  const phaseY = random(`${seed}-py`) * 1000;
  const phaseRot = random(`${seed}-prot`) * 1000;

  // 3. DRIFT & ROTATION CALCULATIONS
  const driftX = Math.sin((frame + phaseX) * freqX) * 8;       // Max ±8px
  const driftY = Math.cos((frame + phaseY) * freqY) * 6;       // Max ±6px
  const driftRot = Math.sin((frame + phaseRot) * freqRot) * 0.15; // Max ±0.15°

  // 4. EASED MICRO ZOOM (100% to 103%)
  const progress = frame / durationInFrames;
  const easedProgress = Easing.out(Easing.cubic)(progress);
  const microZoom = interpolate(easedProgress, [0, 1], [1.0, 1.03], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#000" }}>
      <AbsoluteFill
        style={{
          transformOrigin: "center center",
          // CRITICAL: Translate and rotate happen first, scale goes last.
          transform: `translate(${driftX}px, ${driftY}px) rotate(${driftRot}deg) scale(${microZoom})`,
          willChange: "transform",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
