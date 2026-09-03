import { 
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig, 
  spring, 
  interpolate, 
  Img, 
  OffthreadVideo,
  staticFile as remotionStaticFile
} from "remotion";
import React from "react";
import { CinematicTextureWrapper } from './CinematicTextureWrapper';

const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const staticFile = (path: string) => {
    if (!path || typeof path !== 'string') return TRANSPARENT_PIXEL;
    let cleanPath = path.replace(/^\/?public\//, '');
    if (cleanPath.trim() === '' || cleanPath.endsWith('/')) return TRANSPARENT_PIXEL;
    try { cleanPath = decodeURIComponent(cleanPath); } catch(e) {}
    return remotionStaticFile(cleanPath);
};

export interface GridAsset {
  url: string;        // local path to downloaded asset (resolved via staticFile)
  title: string;
  subtitle: string;
  trigger_frame: number;
}

export interface DynamicLiquidGridProps {
  bgVideoUrl: string; // local path to background video
  assets: GridAsset[];
}

export const DynamicLiquidGrid: React.FC<DynamicLiquidGridProps> = ({ bgVideoUrl, assets }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // DYNAMIC SPRING ENGINE (100% crash-proof)
  const trigger1 = assets[1]?.trigger_frame ?? 9999;
  const trigger2 = assets[2]?.trigger_frame ?? 9999;

  const spring1 = spring({ frame: Math.max(0, frame - trigger1), fps, config: { damping: 28, stiffness: 90, mass: 1 } });
  const spring2 = spring({ frame: Math.max(0, frame - trigger2), fps, config: { damping: 28, stiffness: 90, mass: 1 } });

  // FLUID WIDTH MATH (100 -> 50/50 -> 33/33/33)
  const w0 = interpolate(spring1, [0, 1], [100, 50]) - interpolate(spring2, [0, 1], [0, 16.66]);
  const w1 = interpolate(spring1, [0, 1], [0, 50]) - interpolate(spring2, [0, 1], [0, 16.66]);
  const w2 = interpolate(spring2, [0, 1], [0, 33.33]);
  const widths = [w0, w1, w2];

  // DYNAMIC BACKGROUND BLUR
  const firstTrigger = assets[0]?.trigger_frame ?? 0;
  const blurOpacity = interpolate(frame, [firstTrigger - 10, firstTrigger], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const liquidGlassStyle: React.CSSProperties = {
    background: "linear-gradient(155deg, rgba(14, 17, 24, 0.85) 0%, rgba(4, 5, 8, 0.95) 100%)",
    backdropFilter: "blur(40px) saturate(1.4)",
    WebkitBackdropFilter: "blur(40px) saturate(1.4)",
    border: "1px solid rgba(212, 175, 55, 0.25)",
    borderTop: "2px solid rgba(212, 175, 55, 0.8)",
    boxShadow: "0 50px 100px rgba(0,0,0,0.9), inset 0 2px 20px rgba(212, 175, 55, 0.1)",
    borderRadius: "16px",
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  };

  // Detect if background is video or image
  const bgExt = bgVideoUrl?.split('.').pop()?.toLowerCase() || '';
  const bgIsVideo = ['mp4', 'mov', 'webm'].includes(bgExt);

  return (
    <CinematicTextureWrapper
      backgroundLayer={
        <AbsoluteFill>
          <AbsoluteFill style={{ transform: "scale(1.1) translateZ(0)", zIndex: 0 }}>
            {bgIsVideo ? (
              <OffthreadVideo src={staticFile(bgVideoUrl)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <>
                {bgVideoUrl ? <Img src={staticFile(bgVideoUrl)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", backgroundColor: "#05070A" }} />}
              </>
            )}
          </AbsoluteFill>

          {/* Vignetted Darkener */}
          <AbsoluteFill style={{ 
              backgroundColor: `rgba(2, 3, 5, ${blurOpacity * 0.55})`,
              backdropFilter: "blur(30px) saturate(1.2)",
              WebkitBackdropFilter: "blur(30px) saturate(1.2)",
              opacity: blurOpacity,
              zIndex: 1,
              pointerEvents: "none"
          }} />
        </AbsoluteFill>
      }
    >
      <AbsoluteFill style={{ backgroundColor: "transparent", fontFamily: '"Inter", "SF Pro Display", sans-serif' }}>

      {/* DYNAMIC GRID CONTAINER */}
      <div style={{
        position: "absolute",
        top: "12%",
        left: "5%",
        width: "90%",
        height: "68%",
        display: "flex",
        gap: "28px",
        zIndex: 10
      }}>
        {assets.map((asset, i) => {
          const currentWidth = widths[i];
          if (currentWidth < 1) return null;

          const localCardFrame = Math.max(0, frame - asset.trigger_frame);
          const cardEntrance = spring({ frame: localCardFrame, fps, config: { damping: 200, stiffness: 45, mass: 1.2 } });
          const cardScale = interpolate(cardEntrance, [0, 1], [0.92, 1]);
          const cardOpacity = interpolate(localCardFrame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
          const cardBlur = interpolate(localCardFrame, [0, 15], [14, 0], { extrapolateRight: "clamp" });

          // Gilded light sweep across card
          const sheenX = interpolate(localCardFrame, [5, 45], [-100, 200], { extrapolateRight: "clamp" });

          return (
            <div 
              key={i} 
              style={{ 
                ...liquidGlassStyle, 
                width: `${currentWidth}%`, 
                opacity: cardOpacity, 
                filter: `blur(${cardBlur}px)`,
                transform: `scale(${cardScale})` 
              }}
            >
              {/* Precision Corner Crosshair Accent */}
              <div style={{ position: "absolute", top: "10px", left: "10px", width: "10px", height: "10px", borderTop: "2px solid #D4AF37", borderLeft: "2px solid #D4AF37", opacity: 0.8, zIndex: 10 }} />
              <div style={{ position: "absolute", top: "10px", right: "10px", width: "10px", height: "10px", borderTop: "2px solid #D4AF37", borderRight: "2px solid #D4AF37", opacity: 0.8, zIndex: 10 }} />

              {/* Module Header Pill */}
              <div style={{
                position: "absolute",
                top: "16px",
                left: "24px",
                right: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                zIndex: 10,
                borderBottom: "1px solid rgba(212, 175, 55, 0.15)",
                paddingBottom: "8px"
              }}>
                <span style={{ fontFamily: '"Inter", monospace', fontSize: "11px", letterSpacing: "3px", color: "#D4AF37", fontWeight: 600 }}>
                  EXHIBIT [0{i + 1}]
                </span>
                <span style={{ fontFamily: '"Inter", sans-serif', fontSize: "10px", letterSpacing: "1px", color: "rgba(255,255,255,0.4)" }}>
                  CONFIDENTIAL ARCHIVE
                </span>
              </div>

              {/* Asset Media Image */}
              <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
                {asset.url ? (
                  <Img src={staticFile(asset.url)} style={{ width: "100%", height: "100%", objectFit: "cover", zIndex: 1, filter: "contrast(1.1) saturate(1.1)" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", backgroundColor: "#06080C", zIndex: 1 }} />
                )}

                {/* Animated Light Sweep Sheen */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(115deg, transparent ${sheenX - 30}%, rgba(255, 223, 115, 0.25) ${sheenX}%, transparent ${sheenX + 30}%)`,
                  pointerEvents: "none",
                  zIndex: 2
                }} />

                {/* Bottom Shadow Gradient */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(3, 4, 6, 0.96) 0%, rgba(3, 4, 6, 0.4) 40%, transparent 70%)",
                  zIndex: 3
                }} />
              </div>
              
              {/* Luxury Text HUD */}
              <div style={{
                position: "absolute", 
                bottom: 0, 
                width: "100%", 
                padding: "28px 30px 24px 30px",
                zIndex: 5,
                boxSizing: "border-box"
              }}>
                <p style={{ 
                  color: "#D4AF37", 
                  fontSize: "12px", 
                  fontWeight: 600, 
                  letterSpacing: "4px", 
                  textTransform: "uppercase", 
                  margin: "0 0 6px 0",
                  fontFamily: '"Inter", sans-serif'
                }}>
                  {asset.subtitle}
                </p>
                <h2 style={{ 
                  color: "#FFFFFF", 
                  fontSize: "32px", 
                  fontWeight: 700, 
                  margin: 0, 
                  letterSpacing: "0.5px",
                  fontFamily: '"Playfair Display", "Cinzel", Georgia, serif',
                  textShadow: "0 6px 20px rgba(0,0,0,0.9)",
                  lineHeight: 1.15
                }}>
                  {asset.title}
                </h2>
                
                {/* 1px Golden Bottom Accent Line */}
                <div style={{
                  width: "100%",
                  height: "1px",
                  background: "linear-gradient(90deg, #D4AF37 0%, transparent 70%)",
                  marginTop: "14px",
                  opacity: 0.8
                }} />
              </div>
            </div>
          );
        })}
      </div>
      </AbsoluteFill>
    </CinematicTextureWrapper>
  );
};
