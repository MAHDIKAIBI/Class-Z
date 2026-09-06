import { 
  AbsoluteFill, 
  useCurrentFrame, 
  interpolate, 
  spring,
  useVideoConfig,
} from "remotion";
import React from "react";

export type ParallaxSlideTransitionProps = {
  SceneA: React.ReactNode;
  SceneB: React.ReactNode;
  durationInFrames?: number;
};

export const ParallaxSlideTransition: React.FC<ParallaxSlideTransitionProps> = ({ 
  SceneA, 
  SceneB, 
  durationInFrames = 30 
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 4 Architectural Horizontal Strips
  const STRIP_COUNT = 4;
  const stripHeightPercent = 100 / STRIP_COUNT;

  // Scene B base zoom-in
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scaleB = interpolate(progress, [0, 1], [0.93, 1.0]);
  const blurB = interpolate(progress, [0, 0.5, 1], [15, 6, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#020202", overflow: "hidden" }}>
      {/* SCENE B (Underneath, revealed as the slabs slide apart) */}
      <AbsoluteFill
        style={{
          transform: `scale(${scaleB})`,
          filter: `blur(${blurB}px)`,
        }}
      >
        {SceneB}
      </AbsoluteFill>

      {/* SCENE A (Sliced into 4 staggered horizontal shutter slabs) */}
      {Array.from({ length: STRIP_COUNT }).map((_, idx) => {
        // Staggered delays: 0, 2, 4, 6 frames
        const delayFrames = idx * 2.5;
        const relFrame = Math.max(0, frame - delayFrames);
        const stripProgress = spring({
          frame: relFrame,
          fps,
          config: { damping: 180, stiffness: 45 },
        });

        const isMovingLeft = idx % 2 === 0;
        const slideX = interpolate(stripProgress, [0, 1], [0, isMovingLeft ? -105 : 105]);
        const motionBlur = interpolate(stripProgress, [0, 0.45, 0.6, 1], [0, 24, 24, 0]);
        const opacity = interpolate(stripProgress, [0.75, 1], [1, 0], { extrapolateRight: "clamp" });

        const topPercent = idx * stripHeightPercent;
        const bottomPercent = 100 - (idx + 1) * stripHeightPercent;

        if (stripProgress >= 0.999) return null;

        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `inset(${topPercent}% 0% ${bottomPercent}% 0%)`,
              WebkitClipPath: `inset(${topPercent}% 0% ${bottomPercent}% 0%)`,
              transform: `translateX(${slideX}%)`,
              filter: `blur(${motionBlur}px)`,
              opacity,
              zIndex: 20 + idx,
            }}
          >
            {/* The actual Scene A content inside clipped viewport */}
            <AbsoluteFill>{SceneA}</AbsoluteFill>

            {/* 1px Golden Seam Divider at bottom of strip */}
            {idx < STRIP_COUNT - 1 && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: `calc(${topPercent + stripHeightPercent}% - 1px)`,
                  height: 2,
                  background: "linear-gradient(90deg, transparent 0%, #D4AF37 30%, #F5D77F 50%, #D4AF37 70%, transparent 100%)",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.9), 0 0 10px rgba(212,175,55,0.6)",
                  zIndex: 10,
                }}
              />
            )}
          </div>
        );
      })}

      {/* SUBTLE CENTER FLASH ON APEX */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          mixBlendMode: "overlay",
          opacity: interpolate(frame, [10, 16, 24], [0, 0.4, 0]),
          background: "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.6) 0%, transparent 70%)",
        }}
      />
    </AbsoluteFill>
  );
};
