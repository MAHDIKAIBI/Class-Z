import { 
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig, 
  interpolate, 
  Easing, 
  spring, 
  Img, 
  staticFile as remotionStaticFile 
} from "remotion";
import React from "react";

const staticFile = (path: string) => {
    if (!path) return '';
    let cleanPath = path;
    if (cleanPath.startsWith('public/')) {
        cleanPath = cleanPath.slice(7);
    } else if (cleanPath.startsWith('/public/')) {
        cleanPath = cleanPath.slice(8);
    }
    try { cleanPath = decodeURIComponent(cleanPath); } catch(e) {}
    return remotionStaticFile(cleanPath);
};

// ============================================================================
// 1. ELITE CSS 3D BAR (Neon Core + Dark Glass Shell)
// ============================================================================
const Cinematic3DBar: React.FC<{
  height: number;
  maxHeight: number;
  color: string;
  opacity: number;
}> = ({ height, maxHeight, color, opacity }) => {
  const barHeight = Math.max(2, (height / maxHeight) * 380);
  
  return (
    <div style={{
      width: "160px",
      height: `${barHeight}px`,
      position: "relative",
      transformStyle: "preserve-3d",
      opacity,
      transition: "none",
    }}>
      {/* Front Face: Dark Glass Shell + Neon Core */}
      <div style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        background: `linear-gradient(180deg, rgba(10,15,20,0.9) 0%, rgba(5,5,10,0.95) 100%)`,
        border: `1px solid ${color}40`,
        boxShadow: `inset 0 0 20px rgba(0,0,0,0.8), 0 20px 50px rgba(0,0,0,0.9)`,
        borderRadius: "4px 4px 0 0",
        transform: "translateZ(40px)",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
      }}>
        {/* The Internal Glowing Core */}
        <div style={{
          width: "40%",
          height: "100%",
          background: `linear-gradient(180deg, ${color} 0%, ${color}40 100%)`,
          boxShadow: `0 0 40px ${color}, 0 0 80px ${color}80`,
          opacity: 0.85
        }} />
        {/* Glass reflection sweep */}
        <div style={{
          position: "absolute",
          top: 0,
          left: "-50%",
          width: "200%",
          height: "100%",
          background: "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 55%, transparent 60%)",
          mixBlendMode: "overlay"
        }} />
      </div>

      {/* Right Face: Dimensional Shadow */}
      <div style={{
        position: "absolute",
        width: "80px",
        height: "100%",
        background: `linear-gradient(180deg, ${color}30 0%, rgba(0,0,0,0.9) 100%)`,
        borderRight: `1px solid ${color}20`,
        right: 0,
        transformOrigin: "right center",
        transform: "rotateY(90deg)",
        borderRadius: "0 4px 0 0",
      }} />

      {/* Top Face: The Hot Emitter */}
      <div style={{
        position: "absolute",
        width: "100%",
        height: "80px",
        background: color,
        top: 0,
        transformOrigin: "top center",
        transform: "rotateX(90deg)",
        borderRadius: "4px",
        boxShadow: `0 0 50px ${color}, 0 0 100px ${color}`,
        border: "2px solid #ffffff",
      }} />
    </div>
  );
};

// ============================================================================
// 2. KINETIC CYBER-GRID (Animated Forward Momentum)
// ============================================================================
const HolographicFloor: React.FC<{ frame: number }> = ({ frame }) => {
  // Move grid forward over time to simulate camera pushing in
  const drift = (frame * 2) % 100;
  
  return (
    <div style={{
      position: "absolute",
      width: "200%",
      height: "200%",
      bottom: "-50%",
      left: "-50%",
      transform: "perspective(800px) rotateX(75deg)",
      transformOrigin: "center center",
      backgroundImage: `
        linear-gradient(to right, rgba(255,255,255,0.03) 2px, transparent 2px),
        linear-gradient(to bottom, rgba(255,255,255,0.03) 2px, transparent 2px)
      `,
      backgroundSize: "100px 100px",
      backgroundPosition: `0px ${drift}px`,
      // Mask edges so it fades into the darkness perfectly
      WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 60%)",
    }} />
  );
};

// ============================================================================
// 3. THE MAGNATES MEDIA ARENA (Full Orchestration)
// ============================================================================
export type Bar3DItem = {
  title: string;
  subtitle: string;
  value: number;
  color: string;
  imageUrl?: string;
  start: number;
  end: number;
};

export type Comparison3DProps = {
  unit: string;
  itemA: Bar3DItem;
  itemB: Bar3DItem;
};

export const Dynamic3DComparison: React.FC<Comparison3DProps> = ({ unit, itemA, itemB }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Continuous Camera Drone Drift
  const camScale = interpolate(frame, [0, durationInFrames], [1, 1.08], { extrapolateRight: "clamp" });
  const camPanY = interpolate(frame, [0, durationInFrames], [10, -10], { extrapolateRight: "clamp" });

  const MAX_3D_HEIGHT = 24; 
  // Safety: ensure both values are finite positive numbers before any math
  const safeA = (typeof itemA.value === 'number' && isFinite(itemA.value) && itemA.value > 0) ? itemA.value : 1;
  const safeB = (typeof itemB.value === 'number' && isFinite(itemB.value) && itemB.value > 0) ? itemB.value : 1;
  const maxValue = Math.max(safeA, safeB, 1); // never 0
  const targetHeightA = (safeA / maxValue) * MAX_3D_HEIGHT;
  const targetHeightB = (safeB / maxValue) * MAX_3D_HEIGHT;

  // ================= ITEM A LOGIC =================
  const isActiveA = frame >= itemA.start && frame < itemA.end;
  const springA = spring({ frame: isActiveA ? frame - itemA.start : 0, fps, config: { damping: 16, stiffness: 100 } });
  const heightA = interpolate(springA, [0, 1], [0.1, targetHeightA]);
  const opacityA = isActiveA ? interpolate(springA, [0, 0.3], [0, 1]) : 0;
  const durationA = Math.max(2, (itemA.end - itemA.start) - 30);
  const displayValueA = interpolate(frame - itemA.start, [10, Math.max(11, durationA)], [0, safeA], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  // ================= ITEM B LOGIC =================
  const isActiveB = frame >= itemB.start && frame < itemB.end;
  const springB = spring({ frame: isActiveB ? frame - itemB.start : 0, fps, config: { damping: 16, stiffness: 100 } });
  const heightB = interpolate(springB, [0, 1], [0.1, targetHeightB]);
  const opacityB = isActiveB ? interpolate(springB, [0, 0.3], [0, 1]) : 0;
  const durationB = Math.max(2, (itemB.end - itemB.start) - 30);
  const displayValueB = interpolate(frame - itemB.start, [10, Math.max(11, durationB)], [0, safeB], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ background: "transparent", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      
      {/* GLOBAL DRONE CAMERA WRAPPER */}
      <AbsoluteFill style={{ transform: `scale(${camScale}) translateY(${camPanY}px)`, transformOrigin: "center center" }}>
        
        {/* THE ARENA FLOOR */}
        <div style={{ position: "absolute", inset: 0, perspective: "1200px", perspectiveOrigin: "50% 40%", zIndex: 0 }}>
          <HolographicFloor frame={frame} />
          
          {/* Central 3D Container */}
          <div style={{
            position: "absolute",
            bottom: "32%",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "180px",
            alignItems: "flex-end",
            transformStyle: "preserve-3d",
            perspective: "1000px",
          }}>
            {/* PILLAR A */}
            <div style={{ transform: "rotateY(-20deg) rotateX(10deg)", transformStyle: "preserve-3d" }}>
              <Cinematic3DBar height={heightA} maxHeight={MAX_3D_HEIGHT} color={itemA.color} opacity={opacityA} />
              {/* Ultra-realistic floor cast light */}
              <div style={{
                position: "absolute", bottom: "-30px", left: "-50%", width: "200%", height: "60px",
                background: `radial-gradient(ellipse, ${itemA.color}80 0%, transparent 60%)`,
                filter: "blur(15px)", opacity: opacityA, transform: "rotateX(75deg)"
              }} />
            </div>

            {/* PILLAR B */}
            <div style={{ transform: "rotateY(-20deg) rotateX(10deg)", transformStyle: "preserve-3d" }}>
              <Cinematic3DBar height={heightB} maxHeight={MAX_3D_HEIGHT} color={itemB.color} opacity={opacityB} />
              {/* Ultra-realistic floor cast light */}
              <div style={{
                position: "absolute", bottom: "-30px", left: "-50%", width: "200%", height: "60px",
                background: `radial-gradient(ellipse, ${itemB.color}80 0%, transparent 60%)`,
                filter: "blur(15px)", opacity: opacityB, transform: "rotateX(75deg)"
              }} />
            </div>
          </div>
        </div>
      </AbsoluteFill>

      {/* FOREGROUND: PREMIUM GLASS HUD */}
      <div style={{ position: "absolute", bottom: "8%", display: "flex", gap: "60px", zIndex: 10 }}>
        
        {[
          { item: itemA, opac: opacityA, val: displayValueA },
          { item: itemB, opac: opacityB, val: displayValueB }
        ].map((card, idx) => {
          // Continuous micro-floating for the UI cards
          const floatY = Math.sin((frame + idx * 30) * 0.05) * 8;
          // Animated light glare across the glass
          const glarePos = ((frame * 2 + idx * 50) % 300) - 100;

          return (
            <div key={idx} style={{
              position: "relative",
              background: "linear-gradient(145deg, rgba(15, 18, 25, 0.75) 0%, rgba(5, 7, 10, 0.95) 100%)",
              backdropFilter: "blur(40px) saturate(150%)",
              WebkitBackdropFilter: "blur(40px) saturate(150%)",
              border: `1px solid ${card.item.color}50`,
              borderTop: `1px solid ${card.item.color}90`, // Heavy top rim light
              borderRadius: "24px",
              padding: "35px 45px",
              boxShadow: `0 40px 80px rgba(0,0,0,0.9), inset 0 0 40px ${card.item.color}15`,
              opacity: card.opac,
              transform: `translateY(${interpolate(card.opac, [0, 1], [40, 0]) + floatY}px)`,
              fontFamily: '"Geist", "Inter", system-ui, sans-serif',
              minWidth: "360px",
              flexShrink: 0,
              overflow: "hidden" // Contains the glare
            }}>
              {/* Animated Glare Sweep */}
              <div style={{
                position: "absolute", top: 0, bottom: 0, width: "150%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
                transform: `translateX(${glarePos}%) skewX(-30deg)`,
                pointerEvents: "none", zIndex: 0
              }} />

              <div style={{ position: "relative", zIndex: 1 }}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "14px", letterSpacing: "4px", textTransform: "uppercase", fontWeight: 700 }}>
                  {card.item.subtitle}
                </p>
                <h2 style={{ color: "white", margin: "10px 0 25px 0", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px", textShadow: "0 5px 15px rgba(0,0,0,0.5)" }}>
                  {card.item.title}
                </h2>

                {card.item.imageUrl && (
                  <div style={{ width: "100%", height: "160px", borderRadius: "16px", overflow: "hidden", marginBottom: "25px", border: `1px solid rgba(255,255,255,0.1)`, position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, rgba(5,5,8,1), transparent 80%)`, zIndex: 1 }} />
                    <Img src={card.item.imageUrl ? staticFile(card.item.imageUrl) : "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.1) saturate(1.2)" }} />
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                  <span style={{ 
                    color: card.item.color, 
                    fontSize: "64px", 
                    fontWeight: "900", 
                    fontVariantNumeric: "tabular-nums", 
                    // Color-Dodge emulation for intense HDR glow
                    textShadow: `0 0 30px ${card.item.color}, 0 0 60px ${card.item.color}80, 0 5px 10px rgba(0,0,0,0.8)`, 
                    lineHeight: 1 
                  }}>
                    {Math.floor(card.val).toLocaleString()}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "24px", fontWeight: "700", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
                    {unit}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* GLOBAL VIGNETTE & COLOR GRADING TO TIE IT ALL TOGETHER */}
      <AbsoluteFill style={{
        boxShadow: "inset 0 0 300px rgba(0,0,0,0.9)",
        pointerEvents: "none",
        zIndex: 20
      }} />
    </AbsoluteFill>
  );
};