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
  durationInFrames = 32 
}) => {
  const frame = useCurrentFrame();

  // 1. PHYSICAL GLASS INERTIA (Heavy luxury resistance easing)
  const glassEase = Easing.bezier(0.72, 0.0, 0.28, 1.0);

  // 2. 3D GLASS SWEEP PROGRESS (-110% to +110% across viewport)
  const sweepPercent = interpolate(frame, [0, durationInFrames], [-115, 115], {
    easing: glassEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 3. PHYSICAL 3D TILT OF THE GLASS PANE
  const rotateY = interpolate(frame, [0, durationInFrames / 2, durationInFrames], [-16, 0, 16], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rotateZ = interpolate(frame, [0, durationInFrames], [-2, 2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 4. LENS REFRACTION SHEEN (Specular light beam sweeping across the glass surface)
  const sheenOffset = interpolate(frame, [0, durationInFrames], [-100, 200]);

  // 5. SCENE REVEAL MASK (Scene B is revealed as the glass sweeps across)
  const revealProgress = interpolate(frame, [0, durationInFrames], [0, 100], {
    easing: glassEase,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 6. VOLUMETRIC OPTICAL GLOW AT THE BEVELED GLASS EDGE
  const edgeIntensity = interpolate(
    frame,
    [0, durationInFrames / 2, durationInFrames],
    [0.2, 1.0, 0.2],
    { easing: Easing.inOut(Easing.ease), extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#020305", perspective: "1800px", overflow: "hidden" }}>
      
      {/* BASE LAYER: SCENE A (Preceding scene) */}
      <AbsoluteFill style={{ zIndex: 1 }}>
        {SceneA}
      </AbsoluteFill>

      {/* REVEAL LAYER: SCENE B (Unveiled behind the moving glass mask) */}
      <AbsoluteFill style={{ 
        zIndex: 2,
        clipPath: `polygon(0% 0%, ${revealProgress}% 0%, ${revealProgress}% 100%, 0% 100%)`
      }}>
        {SceneB}
      </AbsoluteFill>

      {/* =========================================================================
          THE MONUMENTAL 8D LIQUID OBSIDIAN GLASS PANE (SWEEPS ACROSS THE FRAME)
          ========================================================================= */}
      <div style={{
        position: "absolute",
        top: "-15%",
        left: `${sweepPercent}%`,
        width: "90%",
        height: "130%",
        transformStyle: "preserve-3d",
        transform: `rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) translateZ(50px)`,
        // High-end frosted obsidian liquid glass optics
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(14, 18, 28, 0.45) 50%, rgba(2, 4, 8, 0.75) 100%)",
        backdropFilter: "blur(48px) saturate(240%) brightness(125%)",
        WebkitBackdropFilter: "blur(48px) saturate(240%) brightness(125%)",
        borderRadius: "28px",
        // Beveled 3D diamond glass edge
        border: "1.5px solid rgba(255, 255, 255, 0.35)",
        borderLeft: "3px solid rgba(255, 255, 255, 0.85)", // Leading specular edge
        borderRight: "2px solid rgba(212, 175, 55, 0.55)", // Trailing gold reflection
        boxShadow: `
          0 50px 140px rgba(0, 0, 0, 0.95),
          0 20px 60px rgba(0, 0, 0, 0.8),
          inset 2px 0 10px rgba(255, 255, 255, 0.9),
          inset -2px 0 15px rgba(212, 175, 55, 0.3),
          inset 0 0 50px rgba(255, 255, 255, 0.08)
        `,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 10
      }}>

        {/* DIAGONAL SPECULAR CAUSTIC LIGHT SHEEN */}
        <div style={{
          position: "absolute",
          inset: "-50%",
          background: `linear-gradient(115deg, transparent 35%, rgba(255, 245, 200, 0.4) 50%, transparent 65%)`,
          transform: `translateX(${sheenOffset}%)`,
          pointerEvents: "none",
          mixBlendMode: "screen",
          zIndex: 2
        }} />

        {/* BEVELED PRISMATIC HIGHLIGHT ON THE LEADING EDGE */}
        <div style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "24px",
          background: "linear-gradient(90deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 242, 168, 0.4) 50%, transparent 100%)",
          boxShadow: `0 0 ${edgeIntensity * 40}px rgba(255, 255, 255, 0.8)`,
          mixBlendMode: "screen",
          pointerEvents: "none",
          zIndex: 3
        }} />

        {/* CORNER CROSSHAIR ACCENTS (EXECUTIVE ARCHITECTURAL GLASS DETAILING) */}
        <div style={{ position: "absolute", top: "18px", left: "18px", width: "12px", height: "12px", borderTop: "2px solid rgba(255,255,255,0.7)", borderLeft: "2px solid rgba(255,255,255,0.7)" }} />
        <div style={{ position: "absolute", top: "18px", right: "18px", width: "12px", height: "12px", borderTop: "2px solid rgba(212,175,55,0.7)", borderRight: "2px solid rgba(212,175,55,0.7)" }} />
        <div style={{ position: "absolute", bottom: "18px", left: "18px", width: "12px", height: "12px", borderBottom: "2px solid rgba(255,255,255,0.7)", borderLeft: "2px solid rgba(255,255,255,0.7)" }} />
        <div style={{ position: "absolute", bottom: "18px", right: "18px", width: "12px", height: "12px", borderBottom: "2px solid rgba(212,175,55,0.7)", borderRight: "2px solid rgba(212,175,55,0.7)" }} />

      </div>

      {/* AMBIENT SOFT VIGNETTE (NO CENTER CUT LINES) */}
      <AbsoluteFill style={{
        background: "radial-gradient(circle at center, transparent 45%, rgba(2, 3, 5, 0.8) 100%)",
        mixBlendMode: "multiply",
        pointerEvents: "none",
        zIndex: 20
      }} />

    </AbsoluteFill>
  );
};
