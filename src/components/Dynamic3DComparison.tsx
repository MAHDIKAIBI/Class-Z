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

// Old Money Palette: Rich Gold
const GOLD_ACCENT = "#D4AF37";
const GOLD_HIGHLIGHT = "#FFDF73";

// ============================================================================
// 1. EXECUTIVE 3D MONOLITH WITH ILLUMINATED CORE & LASER CALIPER
// ============================================================================
const Cinematic3DBar: React.FC<{
  height: number;
  maxHeight: number;
  opacity: number;
  side: 'left' | 'right';
}> = ({ height, maxHeight, opacity, side }) => {
  const barHeight = Math.max(8, (height / maxHeight) * 420);
  
  return (
    <div style={{
      width: "190px",
      height: `${barHeight}px`,
      position: "relative",
      transformStyle: "preserve-3d",
      opacity,
      transition: "none",
    }}>
      {/* Front Face: High-Gloss Obsidian Monolith */}
      <div style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        background: `linear-gradient(180deg, rgba(24, 28, 36, 0.95) 0%, rgba(6, 7, 10, 0.98) 100%)`,
        borderLeft: `1px solid rgba(212, 175, 55, 0.3)`,
        borderRight: `1px solid rgba(0, 0, 0, 0.9)`,
        boxShadow: `inset 0 2px 15px rgba(212, 175, 55, 0.15), 0 50px 120px rgba(0,0,0,0.95)`,
        transform: "translateZ(50px)",
        borderRadius: "4px 4px 0 0",
        overflow: "hidden"
      }}>
        {/* Subtle Micro-Grid Texture */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: 'radial-gradient(rgba(212, 175, 55, 0.08) 1px, transparent 1px)',
          backgroundSize: '6px 6px',
          opacity: 0.6
        }}/>
        
        {/* Vertical Core Laser Light Line */}
        <div style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "50%",
          width: "2px",
          transform: "translateX(-50%)",
          background: "linear-gradient(180deg, rgba(255,223,115,0.8) 0%, rgba(212,175,55,0.2) 100%)",
          boxShadow: "0 0 12px rgba(212, 175, 55, 0.8)"
        }} />
      </div>

      {/* Right Face: Dimensional Dark Titanium Depth */}
      <div style={{
        position: "absolute",
        width: "100px",
        height: "100%",
        background: `linear-gradient(180deg, rgba(12, 14, 18, 0.98) 0%, rgba(2, 2, 4, 1) 100%)`,
        right: 0,
        transformOrigin: "right center",
        transform: "rotateY(90deg)",
        borderRight: "1px solid rgba(212, 175, 55, 0.15)"
      }} />

      {/* Top Face: Liquid Gold Cap Emitter */}
      <div style={{
        position: "absolute",
        width: "100%",
        height: "100px",
        background: `linear-gradient(135deg, #FFF2A8 0%, #D4AF37 50%, #8A7322 100%)`,
        top: 0,
        transformOrigin: "top center",
        transform: "rotateX(90deg)",
        border: "1px solid #FFF2A8",
        boxShadow: `inset 0 0 25px rgba(255,255,255,0.7), 0 0 60px rgba(212, 175, 55, 0.6)`,
        borderRadius: "4px"
      }} />

      {/* Caliper Laser Measurement Scale (Floating along the side) */}
      <div style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        [side === 'left' ? 'left' : 'right']: "-35px",
        width: "20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "5px 0",
        opacity: 0.7
      }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: i % 2 === 0 ? "10px" : "5px", height: "1px", backgroundColor: "#D4AF37" }} />
            {i % 4 === 0 && <span style={{ fontSize: "7px", color: "rgba(212, 175, 55, 0.8)", fontFamily: "monospace" }}>{100 - i * 10}%</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 2. LUXURY STUDIO ARENA FLOOR (Mirrored Glass with Radar Rings)
// ============================================================================
const HolographicFloor: React.FC<{ frame: number }> = ({ frame }) => {
  return (
    <div style={{
      position: "absolute",
      width: "220%",
      height: "220%",
      bottom: "-60%",
      left: "-60%",
      transform: "perspective(1200px) rotateX(82deg)",
      transformOrigin: "center center",
      background: "radial-gradient(circle at center, rgba(16, 20, 26, 1) 0%, rgba(2, 3, 5, 1) 70%)",
      boxShadow: "inset 0 0 240px rgba(0,0,0,1)"
    }}>
      {/* Concentric Golden Radar Circles */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "900px",
        height: "900px",
        border: "1px solid rgba(212, 175, 55, 0.15)",
        borderRadius: "50%",
        boxShadow: "0 0 80px rgba(212, 175, 55, 0.05)"
      }}>
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          border: "1px dashed rgba(212, 175, 55, 0.2)",
          borderRadius: "50%"
        }} />
      </div>

      <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(212,175,55,0.03) 0%, transparent 50%)",
          filter: "blur(25px)"
      }} />
    </div>
  );
};

// ============================================================================
// 3. THE MAGNATES COMPARISON ARENA
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

  // Slow-Burn Drone Camera Drift
  const camScale = interpolate(frame, [0, durationInFrames], [1, 1.12], { extrapolateRight: "clamp" });
  const camPanZ = interpolate(frame, [0, durationInFrames], [0, 180], { extrapolateRight: "clamp" });

  const MAX_3D_HEIGHT = 24; 
  const safeA = (typeof itemA.value === 'number' && isFinite(itemA.value) && itemA.value > 0) ? itemA.value : 1;
  const safeB = (typeof itemB.value === 'number' && isFinite(itemB.value) && itemB.value > 0) ? itemB.value : 1;
  const maxValue = Math.max(safeA, safeB, 1); 
  const targetHeightA = (safeA / maxValue) * MAX_3D_HEIGHT;
  const targetHeightB = (safeB / maxValue) * MAX_3D_HEIGHT;

  // ================= ITEM A LOGIC =================
  const isActiveA = frame >= itemA.start && frame < itemA.end;
  const localFrameA = isActiveA ? frame - itemA.start : 0;
  const springA = spring({ frame: localFrameA, fps, config: { damping: 200, stiffness: 40 } });
  const heightA = interpolate(springA, [0, 1], [0.1, targetHeightA]);
  const opacityA = isActiveA ? interpolate(localFrameA, [0, 50], [0, 1], { extrapolateRight: 'clamp' }) : 0;
  const blurA = isActiveA ? interpolate(localFrameA, [0, 50], [16, 0], { extrapolateRight: 'clamp' }) : 16;
  
  const durationA = Math.max(2, (itemA.end - itemA.start) - 30);
  const displayValueA = interpolate(localFrameA, [10, Math.max(11, durationA)], [0, safeA], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.25, 0.1, 0.25, 1) });

  // ================= ITEM B LOGIC =================
  const isActiveB = frame >= itemB.start && frame < itemB.end;
  const localFrameB = isActiveB ? frame - itemB.start : 0;
  const springB = spring({ frame: localFrameB, fps, config: { damping: 200, stiffness: 40 } });
  const heightB = interpolate(springB, [0, 1], [0.1, targetHeightB]);
  const opacityB = isActiveB ? interpolate(localFrameB, [0, 50], [0, 1], { extrapolateRight: 'clamp' }) : 0;
  const blurB = isActiveB ? interpolate(localFrameB, [0, 50], [16, 0], { extrapolateRight: 'clamp' }) : 16;
  
  const durationB = Math.max(2, (itemB.end - itemB.start) - 30);
  const displayValueB = interpolate(localFrameB, [10, Math.max(11, durationB)], [0, safeB], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.25, 0.1, 0.25, 1) });

  // Comparison Delta Calculation
  const ratio = (Math.max(safeA, safeB) / Math.min(safeA, safeB)).toFixed(1);
  const percentDelta = Math.round(((Math.abs(safeA - safeB)) / Math.min(safeA, safeB)) * 100);

  return (
    <AbsoluteFill style={{ background: "transparent", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      
      {/* GLOBAL DRONE CAMERA WRAPPER */}
      <AbsoluteFill style={{ 
          transform: `scale(${camScale}) translateZ(${camPanZ}px)`, 
          transformOrigin: "center center",
          transformStyle: "preserve-3d"
      }}>
        
        {/* THE ARENA FLOOR */}
        <div style={{ position: "absolute", inset: 0, perspective: "1200px", perspectiveOrigin: "50% 38%", zIndex: 0 }}>
          <HolographicFloor frame={frame} />
          
          <div style={{
            position: "absolute",
            bottom: "34%",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "240px",
            alignItems: "flex-end",
            transformStyle: "preserve-3d",
            perspective: "1200px",
          }}>
            {/* PILLAR A */}
            <div style={{ transform: "rotateY(-24deg) rotateX(14deg)", transformStyle: "preserve-3d", filter: `blur(${blurA}px)` }}>
              <Cinematic3DBar height={heightA} maxHeight={MAX_3D_HEIGHT} opacity={opacityA} side="left" />
              <div style={{
                position: "absolute", bottom: "-35px", left: "-50%", width: "200%", height: "80px",
                background: `radial-gradient(ellipse, rgba(212, 175, 55, 0.6) 0%, transparent 60%)`,
                filter: "blur(25px)", opacity: opacityA * 0.5, transform: "rotateX(75deg)"
              }} />
            </div>

            {/* PILLAR B */}
            <div style={{ transform: "rotateY(-24deg) rotateX(14deg)", transformStyle: "preserve-3d", filter: `blur(${blurB}px)` }}>
              <Cinematic3DBar height={heightB} maxHeight={MAX_3D_HEIGHT} opacity={opacityB} side="right" />
              <div style={{
                position: "absolute", bottom: "-35px", left: "-50%", width: "200%", height: "80px",
                background: `radial-gradient(ellipse, rgba(212, 175, 55, 0.6) 0%, transparent 60%)`,
                filter: "blur(25px)", opacity: opacityB * 0.5, transform: "rotateX(75deg)"
              }} />
            </div>
          </div>
        </div>
      </AbsoluteFill>

      {/* FOREGROUND: LUXURY DOSSIER COMPARISON CARDS */}
      <div style={{ position: "absolute", bottom: "7%", display: "flex", gap: "50px", alignItems: "center", zIndex: 20 }}>
        
        {[
          { item: itemA, opac: opacityA, val: displayValueA, blur: blurA, localFrame: localFrameA, label: "EXHIBIT [A]" },
          { item: itemB, opac: opacityB, val: displayValueB, blur: blurB, localFrame: localFrameB, label: "EXHIBIT [B]" }
        ].map((card, idx) => {
          const trackSpacing = interpolate(card.localFrame, [0, 300], [0, 8]); 
          
          return (
            <div key={idx} style={{
              position: "relative",
              background: "linear-gradient(155deg, rgba(8, 10, 14, 0.92) 0%, rgba(2, 3, 5, 0.98) 100%)",
              backdropFilter: "blur(40px) saturate(1.4)",
              WebkitBackdropFilter: "blur(40px) saturate(1.4)",
              border: `1px solid rgba(212, 175, 55, 0.2)`,
              borderTop: `2px solid ${GOLD_ACCENT}`,
              borderRadius: "10px",
              padding: "32px 42px",
              boxShadow: `0 50px 120px rgba(0,0,0,0.95), inset 0 2px 20px rgba(212, 175, 55, 0.1)`,
              opacity: card.opac,
              filter: `blur(${card.blur}px)`,
              transform: `translateY(${interpolate(card.opac, [0, 1], [30, 0])}px)`,
              minWidth: "380px",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column"
            }}>
              {/* Precision Corner Crosshair */}
              <div style={{ position: "absolute", top: "8px", left: "8px", width: "10px", height: "10px", borderTop: "2px solid #D4AF37", borderLeft: "2px solid #D4AF37", opacity: 0.8 }} />
              <div style={{ position: "absolute", top: "8px", right: "8px", width: "10px", height: "10px", borderTop: "2px solid #D4AF37", borderRight: "2px solid #D4AF37", opacity: 0.8 }} />

              <div style={{ position: "relative", zIndex: 1, textAlign: 'center' }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ 
                      fontFamily: '"Inter", monospace', 
                      color: GOLD_ACCENT, 
                      fontSize: "11px", 
                      letterSpacing: "3px", 
                      fontWeight: 600 
                  }}>
                    {card.label}
                  </span>
                  <span style={{ 
                      fontFamily: '"Inter", sans-serif', 
                      color: "rgba(255,255,255,0.4)", 
                      fontSize: "10px", 
                      letterSpacing: "1px" 
                  }}>
                    {card.item.subtitle}
                  </span>
                </div>

                <h2 style={{ 
                    fontFamily: '"Playfair Display", "Cinzel", Georgia, serif', 
                    color: "#FFFFFF", 
                    margin: "4px 0 16px 0", 
                    fontSize: "30px", 
                    fontWeight: "700", 
                    letterSpacing: "1px", 
                    textShadow: "0 8px 25px rgba(0,0,0,0.9)" 
                }}>
                  {card.item.title}
                </h2>

                {card.item.imageUrl && (
                  <div style={{ width: "100%", height: "150px", borderRadius: "6px", overflow: "hidden", marginBottom: "20px", border: `1px solid rgba(212, 175, 55, 0.15)`, position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, rgba(5,5,8,0.9), transparent 60%)`, zIndex: 1 }} />
                    <Img src={card.item.imageUrl ? staticFile(card.item.imageUrl) : "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.1) saturate(1.1)" }} />
                  </div>
                )}

                {/* Primary Number Readout */}
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "8px" }}>
                  <span style={{ 
                    fontFamily: '"Inter", "-apple-system", sans-serif',
                    fontSize: "64px", 
                    fontWeight: "700", 
                    fontVariantNumeric: "tabular-nums", 
                    letterSpacing: `${trackSpacing}px`,
                    background: "linear-gradient(180deg, #FFFFFF 20%, #E2B714 80%, #AA8529 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: `drop-shadow(0 8px 30px rgba(0,0,0,1))`, 
                    lineHeight: 1 
                  }}>
                    {Math.floor(card.val).toLocaleString()}
                  </span>
                  <span style={{ 
                      fontFamily: '"Inter", sans-serif',
                      color: GOLD_ACCENT, 
                      fontSize: "22px", 
                      fontWeight: "500" 
                   }}>
                    {unit}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Central VS / Delta Advantage Badge */}
        <div style={{
          position: "relative",
          zIndex: 25,
          background: "linear-gradient(145deg, #181C24 0%, #06080C 100%)",
          border: "1px solid #D4AF37",
          borderRadius: "50px",
          padding: "12px 20px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.9), 0 0 25px rgba(212,175,55,0.3)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2px"
        }}>
          <span style={{ fontFamily: '"Cinzel", serif', fontSize: "14px", fontWeight: 700, color: "#FFF", letterSpacing: "2px" }}>
            VS
          </span>
          <span style={{ fontFamily: '"Inter", monospace', fontSize: "10px", fontWeight: 600, color: GOLD_ACCENT, letterSpacing: "1px" }}>
            {ratio}x DELTA
          </span>
        </div>
      </div>

      {/* GLOBAL CINEMATIC VIGNETTE */}
      <AbsoluteFill style={{
        background: "radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.85) 100%)",
        pointerEvents: "none",
        zIndex: 30
      }} />
    </AbsoluteFill>
  );
};
