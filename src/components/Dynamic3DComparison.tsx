import { 
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig, 
  interpolate, 
  Easing, 
  spring, 
  staticFile as remotionStaticFile 
} from "remotion";
import { SafeImage as Img } from './SafeImage';
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
  displayValue: number;
  unit: string;
  barColor?: string;
}> = ({ height, maxHeight, opacity, side, displayValue, unit, barColor = "#D4AF37" }) => {
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
      {/* Floating Apex Stat Capsule */}
      <div style={{
        position: "absolute",
        top: "-80px",
        left: "50%",
        transform: "translateX(-50%) translateZ(70px)",
        textAlign: "center",
        whiteSpace: "nowrap",
        background: "rgba(8, 11, 18, 0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "6px 22px 8px",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: `0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px ${barColor}40`,
      }}>
        <span style={{
          fontSize: "48px",
          fontWeight: 900,
          color: "#FFFFFF",
          fontFamily: '"Inter", sans-serif',
          fontVariantNumeric: "tabular-nums",
          textShadow: `0 0 25px ${barColor}`,
        }}>
          {Math.round(displayValue).toLocaleString()}
        </span>
        {unit && (
          <span style={{
            fontSize: "18px",
            fontWeight: 700,
            color: barColor,
            marginLeft: "4px",
          }}>
            {unit}
          </span>
        )}
      </div>

      {/* Front Face: High-Gloss Obsidian Monolith */}
      <div style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        background: `linear-gradient(180deg, rgba(24, 28, 36, 0.95) 0%, rgba(6, 7, 10, 0.98) 100%)`,
        borderLeft: `1px solid ${barColor}50`,
        borderRight: `1px solid rgba(0, 0, 0, 0.9)`,
        boxShadow: `inset 0 2px 15px ${barColor}25, 0 50px 120px rgba(0,0,0,0.95)`,
        transform: "translateZ(50px)",
        borderRadius: "4px 4px 0 0",
        overflow: "hidden"
      }}>
        {/* Subtle Micro-Grid Texture */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `radial-gradient(${barColor}15 1px, transparent 1px)`,
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
          background: `linear-gradient(180deg, #FFFFFF 0%, ${barColor} 60%, transparent 100%)`,
          boxShadow: `0 0 12px ${barColor}`
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
        borderRight: `1px solid ${barColor}25`
      }} />

      {/* Top Face: Liquid Cap Emitter */}
      <div style={{
        position: "absolute",
        width: "100%",
        height: "100px",
        background: `linear-gradient(135deg, #FFFFFF 0%, ${barColor} 50%, rgba(0,0,0,0.8) 100%)`,
        top: 0,
        transformOrigin: "top center",
        transform: "rotateX(90deg)",
        border: "1px solid rgba(255,255,255,0.6)",
        boxShadow: `inset 0 0 25px rgba(255,255,255,0.7), 0 0 60px ${barColor}90`,
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
            <div style={{ width: i % 2 === 0 ? "10px" : "5px", height: "1px", backgroundColor: barColor }} />
            {i % 4 === 0 && <span style={{ fontSize: "7px", color: `${barColor}cc`, fontFamily: "monospace" }}>{100 - i * 10}%</span>}
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
  const extractNum = (raw: any): number => {
    if (typeof raw === 'number' && isFinite(raw) && raw > 0) return raw;
    if (typeof raw === 'string') {
      const stripped = raw.replace(/,/g, '').replace(/k/gi, '000').replace(/m/gi, '000000').replace(/b/gi, '000000000');
      const match = stripped.match(/(\d+\.?\d*)/);
      if (match) {
        const n = parseFloat(match[1]);
        if (isFinite(n) && n > 0) return n;
      }
    }
    return 100;
  };

  const safeA = extractNum(itemA.value);
  const safeB = extractNum(itemB.value);
  const maxValue = Math.max(safeA, safeB, 1); 
  const targetHeightA = (safeA / maxValue) * MAX_3D_HEIGHT;
  const targetHeightB = (safeB / maxValue) * MAX_3D_HEIGHT;

  // ================= ITEM A LOGIC =================
  const isActiveA = frame >= itemA.start && frame < itemA.end;
  const localFrameA = isActiveA ? frame - itemA.start : 0;
  const springA = spring({ frame: localFrameA, fps, config: { damping: 200, stiffness: 45, mass: 1.2 } });
  const heightA = interpolate(springA, [0, 1], [0.1, targetHeightA]);
  const opacityA = isActiveA ? interpolate(localFrameA, [0, 8], [0, 1], { extrapolateRight: 'clamp' }) : 0;
  const blurA = isActiveA ? interpolate(localFrameA, [0, 8], [10, 0], { extrapolateRight: 'clamp' }) : 10;
  
  // Snappy 8-frame quartic ease-out landing (locks immediately, zero voiceover lag)
  const countProgressA = Math.min(1, Math.max(0, localFrameA / 8));
  const countEaseA = 1 - Math.pow(1 - countProgressA, 4);
  const displayValueA = countProgressA >= 1 ? safeA : safeA * countEaseA;

  // ================= ITEM B LOGIC =================
  const isActiveB = frame >= itemB.start && frame < itemB.end;
  const localFrameB = isActiveB ? frame - itemB.start : 0;
  const springB = spring({ frame: localFrameB, fps, config: { damping: 200, stiffness: 45, mass: 1.2 } });
  const heightB = interpolate(springB, [0, 1], [0.1, targetHeightB]);
  const opacityB = isActiveB ? interpolate(localFrameB, [0, 8], [0, 1], { extrapolateRight: 'clamp' }) : 0;
  const blurB = isActiveB ? interpolate(localFrameB, [0, 8], [10, 0], { extrapolateRight: 'clamp' }) : 10;
  
  const countProgressB = Math.min(1, Math.max(0, localFrameB / 8));
  const countEaseB = 1 - Math.pow(1 - countProgressB, 4);
  const displayValueB = countProgressB >= 1 ? safeB : safeB * countEaseB;

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
              <Cinematic3DBar height={heightA} maxHeight={MAX_3D_HEIGHT} opacity={opacityA} side="left" displayValue={displayValueA} unit={unit} barColor={itemA.color || GOLD_ACCENT} />
              <div style={{
                position: "absolute", bottom: "-35px", left: "-50%", width: "200%", height: "80px",
                background: `radial-gradient(ellipse, ${itemA.color || GOLD_ACCENT}99 0%, transparent 60%)`,
                filter: "blur(25px)", opacity: opacityA * 0.5, transform: "rotateX(75deg)"
              }} />
            </div>

            {/* PILLAR B */}
            <div style={{ transform: "rotateY(-24deg) rotateX(14deg)", transformStyle: "preserve-3d", filter: `blur(${blurB}px)` }}>
              <Cinematic3DBar height={heightB} maxHeight={MAX_3D_HEIGHT} opacity={opacityB} side="right" displayValue={displayValueB} unit={unit} barColor={itemB.color || "#00F0FF"} />
              <div style={{
                position: "absolute", bottom: "-35px", left: "-50%", width: "200%", height: "80px",
                background: `radial-gradient(ellipse, ${itemB.color || "#00F0FF"}99 0%, transparent 60%)`,
                filter: "blur(25px)", opacity: opacityB * 0.5, transform: "rotateX(75deg)"
              }} />
            </div>
          </div>

          {/* Caliper Delta Bridge Across Pillars */}
          <div style={{
            position: "absolute",
            bottom: "48%",
            left: "50%",
            transform: "translateX(-50%) translateZ(80px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            opacity: Math.min(opacityA, opacityB),
          }}>
            <div style={{
              background: "rgba(6, 8, 12, 0.92)",
              border: `1px solid ${GOLD_ACCENT}`,
              padding: "8px 20px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: 800,
              color: "#FFDF73",
              fontFamily: "'JetBrains Mono', monospace",
              boxShadow: "0 0 25px rgba(212, 175, 55, 0.4)",
              letterSpacing: "1px",
            }}>
              DELTA: {safeA >= safeB ? '+' : '-'}{Math.abs(safeA - safeB).toLocaleString()}{unit ? ` ${unit}` : ''} ({percentDelta > 0 ? `+${percentDelta}%` : `${percentDelta}%`})
            </div>
            <div style={{
              width: "320px",
              height: "2px",
              background: "linear-gradient(90deg, transparent, #D4AF37 30%, #D4AF37 70%, transparent)",
              boxShadow: "0 0 15px #D4AF37",
            }} />
          </div>
        </div>
      </AbsoluteFill>

      {/* FOREGROUND: LUXURY DOSSIER COMPARISON CARDS (ZERO SUBTITLES, TIGHT TABULAR KERNING) */}
      <div style={{ position: "absolute", bottom: "7%", display: "flex", gap: "50px", alignItems: "center", zIndex: 20 }}>
        
        {[
          { item: itemA, opac: opacityA, val: displayValueA, blur: blurA, localFrame: localFrameA, label: "EXHIBIT [A]" },
          { item: itemB, opac: opacityB, val: displayValueB, blur: blurB, localFrame: localFrameB, label: "EXHIBIT [B]" }
        ].map((card, idx) => {
          return (
            <div key={idx} style={{
              position: "relative",
              background: "linear-gradient(155deg, rgba(8, 10, 14, 0.92) 0%, rgba(2, 3, 5, 0.98) 100%)",
              backdropFilter: "blur(40px) saturate(1.4)",
              WebkitBackdropFilter: "blur(40px) saturate(1.4)",
              border: `1px solid rgba(212, 175, 55, 0.2)`,
              borderTop: `2px solid ${card.item.color || GOLD_ACCENT}`,
              borderRadius: "10px",
              padding: "28px 40px",
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
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ 
                      fontFamily: '"Inter", monospace', 
                      color: card.item.color || GOLD_ACCENT, 
                      fontSize: "11px", 
                      letterSpacing: "3px", 
                      fontWeight: 600 
                  }}>
                    {card.label}
                  </span>
                </div>

                <h2 style={{ 
                    fontFamily: '"Playfair Display", "Cinzel", Georgia, serif', 
                    color: "#FFFFFF", 
                    margin: "4px 0 16px 0", 
                    fontSize: "28px", 
                    fontWeight: "700", 
                    letterSpacing: "1px", 
                    textShadow: "0 8px 25px rgba(0,0,0,0.9)" 
                }}>
                  {card.item.title}
                </h2>

                {card.item.imageUrl && (
                  <div style={{ width: "100%", height: "140px", borderRadius: "6px", overflow: "hidden", marginBottom: "18px", border: `1px solid rgba(212, 175, 55, 0.15)`, position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, rgba(5,5,8,0.9), transparent 60%)`, zIndex: 1 }} />
                    <Img src={card.item.imageUrl ? staticFile(card.item.imageUrl) : "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.1) saturate(1.1)" }} />
                  </div>
                )}

                {/* Primary Number Readout - Fixed Tabular Kerning, No Expanding Tracking */}
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "8px" }}>
                  <span style={{ 
                    fontFamily: '"Inter", "-apple-system", sans-serif',
                    fontSize: "64px", 
                    fontWeight: "700", 
                    fontVariantNumeric: "tabular-nums", 
                    letterSpacing: "-1px",
                    background: "linear-gradient(180deg, #FFFFFF 20%, #E2B714 80%, #AA8529 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: `drop-shadow(0 8px 30px rgba(0,0,0,1))`, 
                    lineHeight: 1 
                  }}>
                    {Math.round(card.val).toLocaleString()}
                  </span>
                  <span style={{ 
                      fontFamily: '"Inter", sans-serif',
                      color: card.item.color || GOLD_ACCENT, 
                      fontSize: "22px", 
                      fontWeight: "600" 
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
