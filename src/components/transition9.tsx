import { 
  AbsoluteFill, 
  useCurrentFrame, 
  interpolate, 
  random,
} from "remotion";
import React from "react";

export type GlitchDataTearTransitionProps = {
  SceneA: React.ReactNode;
  SceneB: React.ReactNode;
  durationInFrames?: number;
};

export const GlitchDataTearTransition: React.FC<GlitchDataTearTransitionProps> = ({ 
  SceneA, 
  SceneB, 
  durationInFrames = 25 
}) => {
  const frame = useCurrentFrame();

  const midpoint = Math.floor(durationInFrames / 2);
  const isPastMidpoint = frame >= midpoint;

  // Glitch active window: midpoint - 5 to midpoint + 6
  const glitchStart = midpoint - 6;
  const glitchEnd = midpoint + 6;
  const isGlitchActive = frame >= glitchStart && frame <= glitchEnd;

  // Pseudo-random offsets based on frame
  const tearOffset1 = isGlitchActive ? (random(`tear1-${frame}`) - 0.5) * 80 : 0;
  const tearOffset2 = isGlitchActive ? (random(`tear2-${frame}`) - 0.5) * 110 : 0;
  const tearOffset3 = isGlitchActive ? (random(`tear3-${frame}`) - 0.5) * 60 : 0;

  const rgbSplit = isGlitchActive ? 12 : 0;

  // Phosphor flash right at midpoint
  const flash = frame === midpoint || frame === midpoint + 1 ? 0.35 : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#020305", overflow: "hidden" }}>
      {/* ── BASE SCENE (Before or after cut) ───────────────────────────── */}
      <AbsoluteFill
        style={{
          transform: `translateX(${tearOffset1 * 0.2}px)`,
          filter: isGlitchActive ? "contrast(1.3) brightness(1.1)" : "none",
        }}
      >
        {!isPastMidpoint ? SceneA : SceneB}
      </AbsoluteFill>

      {/* ── HORIZONTAL GLITCH DISPLACEMENT SLICES ──────────────────────── */}
      {isGlitchActive && (
        <>
          {/* Slice 1 (Top Band: 18% to 32%) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: "inset(18% 0% 68% 0%)",
              WebkitClipPath: "inset(18% 0% 68% 0%)",
              transform: `translateX(${tearOffset1}px)`,
              zIndex: 30,
            }}
          >
            <AbsoluteFill>{!isPastMidpoint ? SceneA : SceneB}</AbsoluteFill>
          </div>

          {/* Slice 2 (Mid Band: 44% to 58%) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: "inset(44% 0% 42% 0%)",
              WebkitClipPath: "inset(44% 0% 42% 0%)",
              transform: `translateX(${tearOffset2}px)`,
              zIndex: 31,
            }}
          >
            <AbsoluteFill>{!isPastMidpoint ? SceneA : SceneB}</AbsoluteFill>
          </div>

          {/* Slice 3 (Bottom Band: 72% to 84%) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: "inset(72% 0% 16% 0%)",
              WebkitClipPath: "inset(72% 0% 16% 0%)",
              transform: `translateX(${tearOffset3}px)`,
              zIndex: 32,
            }}
          >
            <AbsoluteFill>{!isPastMidpoint ? SceneA : SceneB}</AbsoluteFill>
          </div>

          {/* ── RGB CHANNEL SPLIT OVERLAYS ──────────────────────────────── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              mixBlendMode: "screen",
              transform: `translateX(${rgbSplit}px)`,
              filter: "drop-shadow(0 0 8px rgba(255, 30, 70, 0.7))",
              opacity: 0.4,
              zIndex: 40,
            }}
          >
            {!isPastMidpoint ? SceneA : SceneB}
          </div>

          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              mixBlendMode: "screen",
              transform: `translateX(${-rgbSplit}px)`,
              filter: "drop-shadow(0 0 8px rgba(0, 240, 255, 0.7))",
              opacity: 0.4,
              zIndex: 41,
            }}
          >
            {!isPastMidpoint ? SceneA : SceneB}
          </div>

          {/* ── CRT SCANLINES OVERLAY ──────────────────────────────────── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage: "repeating-linear-gradient(to bottom, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 2px, transparent 2px, transparent 4px)",
              zIndex: 50,
              opacity: 0.6,
            }}
          />

          {/* ── TECHNICAL TELEMETRY TELETYPE TAG ────────────────────────── */}
          <div
            style={{
              position: "absolute",
              top: 30,
              left: 40,
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: 800,
              color: "#38BDF8",
              backgroundColor: "rgba(3, 7, 18, 0.9)",
              padding: "4px 12px",
              border: "1px solid rgba(56, 189, 248, 0.6)",
              letterSpacing: "2px",
              zIndex: 60,
            }}
          >
            SYNC_CORRUPT // STREAM_REKEY_0x89
          </div>
        </>
      )}

      {/* PHOSPHOR / EXPOSURE FLASH AT CUT MOMENT */}
      {flash > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: "#38BDF8",
            mixBlendMode: "overlay",
            opacity: flash,
            pointerEvents: "none",
            zIndex: 100,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
