import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { THEME_REGISTRY, ThemePreset } from './ThemeRegistry';

export const ProceduralBackground: React.FC<{ themePreset: ThemePreset; durationFrames: number }> = ({
  themePreset = 'financial_noir',
  durationFrames = 150,
}) => {
  const frame = useCurrentFrame();
  const theme = THEME_REGISTRY[themePreset] || THEME_REGISTRY.financial_noir;
  const safeDuration = Math.max(1, durationFrames);

  // Slow, sweeping volumetric spotlight across the texture
  const sweepX = interpolate(frame, [0, safeDuration], [-30, 130], { extrapolateRight: 'clamp' });
  const pulseOpacity = 0.8 + Math.sin(frame * 0.05) * 0.2;

  return (
    <AbsoluteFill
      style={{
        transform: 'translateZ(-800px) scale(2.8)',
        backgroundColor: theme.bgColor,
        overflow: 'hidden',
      }}
    >
      {/* 1. Procedural SVG Pattern Layer */}
      <AbsoluteFill
        style={{
          backgroundImage: theme.gridSvg,
          backgroundSize: theme.gridSize,
          opacity: 0.85,
        }}
      />

      {/* 2. Base Radial Color Glow */}
      <AbsoluteFill
        style={{
          background: theme.bgGradient,
          mixBlendMode: 'screen',
        }}
      />

      {/* 3. Moving Volumetric Light Sweep */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${sweepX}% 40%, ${theme.accentColor}18 0%, transparent 60%)`,
          opacity: pulseOpacity,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* 4. Film Grain Noise Shader */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      />

      {/* 5. Edge Shadow Crushing */}
      <AbsoluteFill
        style={{
          boxShadow: theme.vignetteStyle,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
