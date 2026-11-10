import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface BlueprintCanvasProps {
  accentColor?: string;
  subHeader?: string;
  gridOpacity?: number;
  showScanlines?: boolean;
  children?: React.ReactNode;
}

export const BlueprintCanvas: React.FC<BlueprintCanvasProps> = ({
  accentColor = '#00F0FF',
  subHeader,
  gridOpacity = 1.0,
  showScanlines = true,
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Subtle organic camera drift (1.0 -> 1.03 scale)
  const driftScale = interpolate(frame, [0, durationInFrames || 180], [1.0, 1.025], {
    extrapolateRight: 'clamp',
  });
  const driftY = interpolate(frame, [0, durationInFrames || 180], [0, -6], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030712',
        overflow: 'hidden',
        perspective: 1200,
      }}
    >
      {/* 1. Master Deep Gradient Background */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, #0B132B 0%, #060B18 55%, #020409 100%)',
        }}
      />

      {/* 2. Technical Blueprint Dual Grid (Minor 40px + Major 200px) */}
      <AbsoluteFill
        style={{
          opacity: gridOpacity,
          transform: `scale(${driftScale}) translateY(${driftY}px)`,
          transformOrigin: 'center center',
          pointerEvents: 'none',
        }}
      >
        <svg
          width="100%"
          height="100%"
          style={{ position: 'absolute', inset: 0 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Minor 40px grid */}
            <pattern
              id="blueprint-minor-grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(56, 189, 248, 0.05)"
                strokeWidth="1"
              />
            </pattern>
            {/* Major 200px grid with corner crosshairs */}
            <pattern
              id="blueprint-major-grid"
              width="200"
              height="200"
              patternUnits="userSpaceOnUse"
            >
              <rect width="200" height="200" fill="url(#blueprint-minor-grid)" />
              <path
                d="M 200 0 L 0 0 0 200"
                fill="none"
                stroke="rgba(56, 189, 248, 0.14)"
                strokeWidth="1.5"
              />
              {/* Corner crosshairs */}
              <path
                d="M 10 0 L -10 0 M 0 10 L 0 -10"
                stroke="rgba(56, 189, 248, 0.3)"
                strokeWidth="1.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#blueprint-major-grid)" />
        </svg>
      </AbsoluteFill>

      {/* 3. Subtle Technical Blueprint Vignette & Lens Curvature */}
      <AbsoluteFill
        style={{
          boxShadow: 'inset 0 0 180px rgba(0, 0, 0, 0.88), inset 0 0 60px rgba(2, 6, 23, 0.95)',
          pointerEvents: 'none',
        }}
      />

      {/* 4. CRT Horizontal Scanlines Overlay */}
      {showScanlines && (
        <AbsoluteFill
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.12) 0px, rgba(0, 0, 0, 0.12) 1px, transparent 1px, transparent 3px)',
            pointerEvents: 'none',
            opacity: 0.8,
          }}
        />
      )}

      {/* 5. Minimal Engineering Corner Badges */}
      <div
        style={{
          position: 'absolute',
          top: 36,
          left: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: 'monospace',
          fontSize: 13,
          color: 'rgba(230, 213, 184, 0.5)',
          letterSpacing: 2,
          textTransform: 'uppercase',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: accentColor,
            boxShadow: `0 0 10px ${accentColor}`,
          }}
        />
        <span>[SYS.BLUEPRINT // ARCHITECTURE]</span>
      </div>

      {subHeader && (
        <div
          style={{
            position: 'absolute',
            top: 36,
            right: 48,
            fontFamily: 'monospace',
            fontSize: 13,
            color: 'rgba(230, 213, 184, 0.4)',
            letterSpacing: 2,
            textTransform: 'uppercase',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {subHeader}
        </div>
      )}

      {/* 6. Active Canvas Children */}
      <AbsoluteFill
        style={{
          transform: `scale(${driftScale}) translateY(${driftY}px)`,
          transformOrigin: 'center center',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
