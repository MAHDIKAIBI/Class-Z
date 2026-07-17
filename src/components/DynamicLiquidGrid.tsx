import { 
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig, 
  spring, 
  interpolate, 
  Img, 
  Video,
  staticFile as remotionStaticFile
} from "remotion";
import React from "react";

const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const staticFile = (path: string) => {
    if (!path || typeof path !== 'string') return TRANSPARENT_PIXEL;
    const cleanPath = path.startsWith('public/') ? path.slice(7) : path;
    if (cleanPath.trim() === '' || cleanPath.endsWith('/')) return TRANSPARENT_PIXEL;
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
  // If an asset doesn't exist, its trigger defaults to frame 9999 (never fires)
  const trigger1 = assets[1]?.trigger_frame ?? 9999;
  const trigger2 = assets[2]?.trigger_frame ?? 9999;

  const spring1 = spring({ frame: Math.max(0, frame - trigger1), fps, config: { damping: 14, stiffness: 90, mass: 1.2 } });
  const spring2 = spring({ frame: Math.max(0, frame - trigger2), fps, config: { damping: 14, stiffness: 90, mass: 1.2 } });

  // FLUID WIDTH MATH (100 -> 50/50 -> 33/33/33)
  const w0 = interpolate(spring1, [0, 1], [100, 50]) - interpolate(spring2, [0, 1], [0, 16.66]);
  const w1 = interpolate(spring1, [0, 1], [0, 50]) - interpolate(spring2, [0, 1], [0, 16.66]);
  const w2 = interpolate(spring2, [0, 1], [0, 33.33]);
  const widths = [w0, w1, w2];

  const liquidGlassStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05))",
    backdropFilter: "blur(40px) saturate(200%) brightness(120%)",
    WebkitBackdropFilter: "blur(40px) saturate(200%) brightness(120%)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "0 40px 80px rgba(0,0,0,0.6), inset 0 2px 15px rgba(255,255,255,0.6), inset 0 -2px 10px rgba(0,0,0,0.1)",
    borderRadius: "32px",
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
    <AbsoluteFill style={{ backgroundColor: "transparent", fontFamily: '"Geist", "Inter", system-ui, sans-serif' }}>
      
      {/* BACKGROUND LAYER (Blurred cinematic backdrop) */}
      <AbsoluteFill style={{ filter: "blur(40px) brightness(0.6)", transform: "scale(1.1)", zIndex: 0 }}>
        {bgIsVideo ? (
          <Video src={staticFile(bgVideoUrl)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Img src={staticFile(bgVideoUrl)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </AbsoluteFill>

      {/* DYNAMIC GRID CONTAINER */}
      <div style={{
        position: "absolute",
        top: "10%",
        left: "5%",
        width: "90%",
        height: "65%",
        display: "flex",
        gap: "24px",
        zIndex: 10
      }}>
        {assets.map((asset, i) => {
          const currentWidth = widths[i];
          if (currentWidth < 1) return null;

          const cardEntrance = spring({ frame: Math.max(0, frame - asset.trigger_frame), fps, config: { damping: 12, stiffness: 100 } });
          const cardScale = interpolate(cardEntrance, [0, 1], [0.8, 1]);
          const cardOpacity = interpolate(cardEntrance, [0, 0.5], [0, 1]);

          return (
            <div key={i} style={{ ...liquidGlassStyle, width: `${currentWidth}%`, opacity: cardOpacity, transform: `scale(${cardScale})` }}>
              
              {/* Top Glare */}
              <div style={{ position: "absolute", top: 0, width: "100%", height: "40%", background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)", zIndex: 2, pointerEvents: "none" }} />

              {/* Asset Image */}
              <Img src={staticFile(asset.url)} style={{ width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }} />
              
              {/* Text HUD */}
              <div style={{
                position: "absolute", bottom: 0, width: "100%", padding: "40px 30px",
                background: "linear-gradient(to top, rgba(0,0,0,0.95), transparent)", zIndex: 3
              }}>
                <h2 style={{ color: "#fff", fontSize: "36px", fontWeight: 800, margin: "0 0 8px 0", letterSpacing: "-1px" }}>{asset.title}</h2>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "20px", fontWeight: 500, margin: 0 }}>{asset.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
