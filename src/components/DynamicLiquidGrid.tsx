import { 
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig, 
  spring, 
  interpolate, 
  OffthreadVideo,
  Sequence,
  staticFile as remotionStaticFile
} from "remotion";
import { SafeImage as Img } from './SafeImage';
import React, { useMemo } from "react";
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
  url: string;
  title: string;
  subtitle?: string;
  trigger_start_ms?: number;
  trigger_frame?: number;
}

export interface DynamicLiquidGridProps {
  bgVideoUrl: string;
  assets: GridAsset[];
  sceneWords?: any[];
  sceneStartMs?: number;
  durationInFrames?: number;
}

export const DynamicLiquidGrid: React.FC<DynamicLiquidGridProps> = ({ 
  bgVideoUrl, 
  assets,
  sceneWords,
  sceneStartMs = 0,
  durationInFrames
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: configDuration } = useVideoConfig();
  const effectiveDuration = durationInFrames || configDuration || 120;

  // Filter valid assets with usable URLs
  const validAssets = useMemo(() => {
    return (assets || []).filter(a => a && a.url && typeof a.url === 'string' && a.url.trim() !== '');
  }, [assets]);

  // Detect background type
  const bgExt = bgVideoUrl?.split('.').pop()?.toLowerCase() || '';
  const bgIsVideo = ['mp4', 'mov', 'webm'].includes(bgExt);

  // ──────────────────────────────────────────────────────────────────────────
  // BULLETPROOF TIMING & SYNCHRONIZATION ENGINE
  // Strict monotonic order (Card 1 -> Card 2 -> Card 3)
  // Early entry + guaranteed exit runway (no microsecond vanishing)
  // ──────────────────────────────────────────────────────────────────────────
  const triggers = useMemo(() => {
    const total = validAssets.length;
    if (total === 0) return [];

    // Guarantee early entrance: First card arrives at 8-12 frames (0.25 - 0.4s)
    const minEntranceFrame = Math.min(12, Math.max(6, Math.round(fps * 0.3)));

    // Minimum runway: All cards must be locked on screen for at least 1.8s before cut
    const minRunwayFrames = Math.max(30, Math.round(fps * 1.8));
    const maxLastTriggerFrame = Math.max(
      minEntranceFrame + (total - 1) * 12,
      effectiveDuration - minRunwayFrames
    );

    // Step 1: Collect raw desired trigger frame for each asset
    const rawTriggers = validAssets.map((asset) => {
      // 1. Explicit trigger_start_ms
      if (typeof asset.trigger_start_ms === 'number' && asset.trigger_start_ms > 0) {
        return Math.round(((asset.trigger_start_ms - sceneStartMs) / 1000) * fps);
      }

      // 2. Explicit trigger_frame
      if (typeof asset.trigger_frame === 'number' && asset.trigger_frame > 0 && asset.trigger_frame < 9000) {
        return asset.trigger_frame;
      }

      // 3. Spoken word alignment via Whisper timestamps
      if (sceneWords && sceneWords.length > 0) {
        const cleanTitleWords = (asset.title || '')
          .toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 2);

        const matchedWord = sceneWords.find((w: any) => {
          const cw = (w.word || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanTitleWords.some(tw => cw.includes(tw) || tw.includes(cw));
        });

        if (matchedWord && typeof matchedWord.start_ms === 'number') {
          return Math.round(((matchedWord.start_ms - sceneStartMs) / 1000) * fps);
        }
      }

      return -1;
    });

    // Step 2: Resolve strictly monotonic left-to-right cadence
    const resolvedTriggers: number[] = [];
    const defaultStagger = Math.max(
      14,
      Math.min(24, Math.floor((maxLastTriggerFrame - minEntranceFrame) / Math.max(1, total - 1)))
    );

    for (let i = 0; i < total; i++) {
      if (i === 0) {
        const raw0 = rawTriggers[0];
        // Card 1 ALWAYS enters early so the canvas is immediately anchored
        const c0 = raw0 > 0 ? Math.max(minEntranceFrame, Math.min(minEntranceFrame + 8, raw0)) : minEntranceFrame;
        resolvedTriggers.push(c0);
      } else {
        const prev = resolvedTriggers[i - 1];
        const raw = rawTriggers[i];
        const minAllowed = prev + 14; // Strict minimum 14-frame stagger gap

        let target = raw > 0 ? Math.max(minAllowed, raw) : (prev + defaultStagger);

        // Cap against slot ceiling so we NEVER violate exit runway
        const remainingSlots = (total - 1) - i;
        const slotCeiling = maxLastTriggerFrame - (remainingSlots * 12);
        if (target > slotCeiling) {
          target = Math.max(minAllowed, slotCeiling);
        }
        resolvedTriggers.push(target);
      }
    }

    return resolvedTriggers;
  }, [validAssets, sceneWords, sceneStartMs, effectiveDuration, fps]);

  // Fallback: If no assets, render clean background
  if (validAssets.length === 0) {
    return (
      <CinematicTextureWrapper
        backgroundLayer={
          <AbsoluteFill style={{ transform: "scale(1.1) translateZ(0)", zIndex: 0 }}>
            {bgIsVideo ? (
              <OffthreadVideo 
                src={staticFile(bgVideoUrl)} 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                onError={(e) => console.log("Media playback error caught on Video:", e)} 
              />
            ) : (
              <>
                {bgVideoUrl ? (
                  <Img src={staticFile(bgVideoUrl)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", backgroundColor: "#060911" }} />
                )}
              </>
            )}
          </AbsoluteFill>
        }
      >
        <AbsoluteFill />
      </CinematicTextureWrapper>
    );
  }

  // Dynamic Background Blur (Starts sharp, smoothly blurs when first card appears)
  const firstTrigger = triggers[0] ?? 8;
  const blurOpacity = interpolate(frame, [firstTrigger - 8, firstTrigger], [0, 1], { 
    extrapolateLeft: "clamp", 
    extrapolateRight: "clamp" 
  });

  const count = validAssets.length;

  return (
    <CinematicTextureWrapper
      backgroundLayer={
        <AbsoluteFill>
          {/* Base Video or Image plate */}
          <AbsoluteFill style={{ transform: "scale(1.08) translateZ(0)", zIndex: 0 }}>
            {bgIsVideo ? (
              <OffthreadVideo 
                src={staticFile(bgVideoUrl)} 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                onError={(e) => console.log("Media playback error caught on Video:", e)} 
              />
            ) : (
              <>
                {bgVideoUrl ? (
                  <Img src={staticFile(bgVideoUrl)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", backgroundColor: "#060911" }} />
                )}
              </>
            )}
          </AbsoluteFill>

          {/* Cinematic Dark Focus & Blur overlay */}
          <AbsoluteFill 
            style={{ 
              backgroundColor: `rgba(4, 6, 12, ${blurOpacity * 0.65})`,
              backdropFilter: `blur(${blurOpacity * 32}px) saturate(140%)`,
              WebkitBackdropFilter: `blur(${blurOpacity * 32}px) saturate(140%)`,
              opacity: blurOpacity,
              zIndex: 1,
              pointerEvents: "none"
            }} 
          />

          {/* Vignette Shadow Edge */}
          <AbsoluteFill 
            style={{
              background: "radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.85) 100%)",
              zIndex: 2,
              pointerEvents: "none"
            }} 
          />
        </AbsoluteFill>
      }
    >
      <AbsoluteFill style={{ fontFamily: '"Inter", "Geist", system-ui, sans-serif' }}>

        {/* ── CARD STAGE (Dominates 2560x1333 canvas with cinematic presence) ── */}
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, padding: "clamp(12px, 2vw, 40px)", boxSizing: "border-box" }}>
          
          {/* LAYOUT 1: SINGLE CARD (Solo Spotlight - Fluid Responsive) */}
          {count === 1 && (() => {
            const asset = validAssets[0];
            const trigger = triggers[0] ?? 8;
            const entrance = spring({
              frame: Math.max(0, frame - trigger),
              fps,
              config: { damping: 18, stiffness: 95, mass: 0.85 }
            });
            const opacity = interpolate(entrance, [0, 0.35], [0, 1], { extrapolateRight: "clamp" });
            const scale = interpolate(entrance, [0, 1], [0.92, 1.0]);
            const translateY = interpolate(entrance, [0, 1], [40, 0]);

            return (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: "860px",
                  maxHeight: "82vh",
                  aspectRatio: "860 / 940",
                  boxSizing: "border-box",
                  opacity,
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  background: "linear-gradient(165deg, rgba(22, 28, 44, 0.94) 0%, rgba(8, 11, 18, 0.98) 100%)",
                  backdropFilter: "blur(48px) saturate(160%)",
                  WebkitBackdropFilter: "blur(48px) saturate(160%)",
                  border: "1.5px solid rgba(212, 175, 55, 0.28)",
                  borderTop: "2px solid rgba(212, 175, 55, 0.7)",
                  borderRadius: "28px",
                  overflow: "hidden",
                  boxShadow: "0 35px 90px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.15)",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                {/* Scanning Laser Hairline Glow */}
                <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "2px", background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.9), transparent)", pointerEvents: "none", zIndex: 4 }} />

                {/* Spec Tag Pill */}
                <div style={{
                  position: "absolute",
                  top: "24px",
                  left: "28px",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  background: "rgba(212, 175, 55, 0.12)",
                  border: "1px solid rgba(212, 175, 55, 0.35)",
                  color: "#D4AF37",
                  fontSize: "13px",
                  fontWeight: 800,
                  letterSpacing: "1.5px",
                  fontFamily: '"JetBrains Mono", "Courier New", monospace',
                  zIndex: 5,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
                }}>
                  SPEC // 01
                </div>

                {/* Ambient Asset Bloom */}
                <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0, pointerEvents: "none" }}>
                  <Img 
                    src={staticFile(asset.url)} 
                    style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(45px) brightness(0.25) saturate(1.4)", transform: "scale(1.2)" }} 
                  />
                </div>

                {/* Hero Uncropped Product Container */}
                <div style={{ flex: 1, position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 40px 24px" }}>
                  <div style={{ position: "absolute", width: "70%", height: "70%", background: "radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
                  <Img
                    src={staticFile(asset.url)}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      filter: "drop-shadow(0 25px 45px rgba(0,0,0,0.92)) drop-shadow(0 0 25px rgba(212,175,55,0.12))"
                    }}
                  />
                </div>

                {/* Clean Bottom Text Bar */}
                <div style={{ position: "relative", zIndex: 2, padding: "clamp(16px, 1.8vw, 26px) clamp(20px, 2.2vw, 36px) clamp(20px, 2.2vw, 34px)", background: "linear-gradient(to top, rgba(4,6,10,0.98) 0%, rgba(4,6,10,0.85) 65%, transparent 100%)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "clamp(22px, 2.2vw, 38px)", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.5px", lineHeight: 1.15, textTransform: "uppercase" }}>
                    {asset.title}
                  </div>
                  {asset.subtitle && (
                    <div style={{ fontSize: "clamp(13px, 1.2vw, 20px)", fontWeight: 700, color: "#D4AF37", letterSpacing: "0.5px", marginTop: "6px" }}>
                      {asset.subtitle}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* LAYOUT 2: DUAL CARDS (Side by Side Shootout - Dynamic Fluid Layout) */}
          {count === 2 && (
            <div style={{ 
              display: "flex", 
              gap: "clamp(16px, 2.5vw, 48px)", 
              width: "100%", 
              maxWidth: "1920px", 
              maxHeight: "82vh", 
              aspectRatio: "1920 / 860", 
              boxSizing: "border-box" 
            }}>
              {validAssets.map((asset, idx) => {
                const trigger = triggers[idx] ?? 8;
                const entrance = spring({
                  frame: Math.max(0, frame - trigger),
                  fps,
                  config: { damping: 18, stiffness: 95, mass: 0.85 }
                });
                const opacity = interpolate(entrance, [0, 0.35], [0, 1], { extrapolateRight: "clamp" });
                const scale = interpolate(entrance, [0, 1], [0.92, 1.0]);
                const slideX = interpolate(entrance, [0, 1], [idx === 0 ? -45 : 45, 0]);

                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      boxSizing: "border-box",
                      position: "relative",
                      opacity,
                      transform: `translateX(${slideX}px) scale(${scale})`,
                      background: "linear-gradient(165deg, rgba(22, 28, 44, 0.94) 0%, rgba(8, 11, 18, 0.98) 100%)",
                      backdropFilter: "blur(48px) saturate(160%)",
                      WebkitBackdropFilter: "blur(48px) saturate(160%)",
                      border: "1.5px solid rgba(212, 175, 55, 0.28)",
                      borderTop: "2px solid rgba(212, 175, 55, 0.7)",
                      borderRadius: "26px",
                      overflow: "hidden",
                      boxShadow: "0 35px 90px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.15)",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    {/* Scanning Laser Hairline Glow */}
                    <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "2px", background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.85), transparent)", pointerEvents: "none", zIndex: 4 }} />

                    {/* Spec Tag Pill */}
                    <div style={{
                      position: "absolute",
                      top: "22px",
                      left: "26px",
                      padding: "5px 13px",
                      borderRadius: "6px",
                      background: "rgba(212, 175, 55, 0.12)",
                      border: "1px solid rgba(212, 175, 55, 0.35)",
                      color: "#D4AF37",
                      fontSize: "12px",
                      fontWeight: 800,
                      letterSpacing: "1.5px",
                      fontFamily: '"JetBrains Mono", "Courier New", monospace',
                      zIndex: 5,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
                    }}>
                      {`SPEC // 0${idx + 1}`}
                    </div>

                    {/* Ambient Asset Bloom */}
                    <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0, pointerEvents: "none" }}>
                      <Img 
                        src={staticFile(asset.url)} 
                        style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(45px) brightness(0.25) saturate(1.4)", transform: "scale(1.2)" }} 
                      />
                    </div>

                    {/* Hero Uncropped Product Container */}
                    <div style={{ flex: 1, position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "44px 36px 20px" }}>
                      <div style={{ position: "absolute", width: "70%", height: "70%", background: "radial-gradient(circle, rgba(212,175,55,0.09) 0%, transparent 70%)", filter: "blur(35px)", pointerEvents: "none" }} />
                      <Img
                        src={staticFile(asset.url)}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                          filter: "drop-shadow(0 25px 45px rgba(0,0,0,0.92)) drop-shadow(0 0 25px rgba(212,175,55,0.1))"
                        }}
                      />
                    </div>

                    {/* Clean Bottom Text Bar */}
                    <div style={{ position: "relative", zIndex: 2, padding: "clamp(14px, 1.5vw, 24px) clamp(18px, 1.8vw, 32px) clamp(18px, 1.8vw, 30px)", background: "linear-gradient(to top, rgba(4,6,10,0.98) 0%, rgba(4,6,10,0.85) 65%, transparent 100%)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: "clamp(18px, 1.8vw, 36px)", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.5px", lineHeight: 1.15, textTransform: "uppercase" }}>
                        {asset.title}
                      </div>
                      {asset.subtitle && (
                        <div style={{ fontSize: "clamp(11px, 1.0vw, 19px)", fontWeight: 700, color: "#D4AF37", letterSpacing: "0.5px", marginTop: "5px" }}>
                          {asset.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* LAYOUT 3: TRIPLE OR QUAD CARDS (Multi-Rack - Dynamic Fluid Layout) */}
          {count >= 3 && (
            <div style={{ 
              display: "flex", 
              gap: count >= 4 ? "clamp(12px, 1.4vw, 24px)" : "clamp(16px, 2vw, 36px)", 
              width: "100%", 
              maxWidth: count >= 4 ? "2360px" : "2280px", 
              maxHeight: "82vh", 
              aspectRatio: count >= 4 ? "2360 / 740" : "2280 / 800", 
              boxSizing: "border-box" 
            }}>
              {validAssets.map((asset, idx) => {
                const trigger = triggers[idx] ?? 8;
                const entrance = spring({
                  frame: Math.max(0, frame - trigger),
                  fps,
                  config: { damping: 18, stiffness: 95, mass: 0.85 }
                });
                const opacity = interpolate(entrance, [0, 0.35], [0, 1], { extrapolateRight: "clamp" });
                const scale = interpolate(entrance, [0, 1], [0.92, 1.0]);
                const translateY = interpolate(entrance, [0, 1], [35, 0]);

                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      boxSizing: "border-box",
                      position: "relative",
                      opacity,
                      transform: `translateY(${translateY}px) scale(${scale})`,
                      background: "linear-gradient(165deg, rgba(22, 28, 44, 0.94) 0%, rgba(8, 11, 18, 0.98) 100%)",
                      backdropFilter: "blur(48px) saturate(160%)",
                      WebkitBackdropFilter: "blur(48px) saturate(160%)",
                      border: "1.5px solid rgba(212, 175, 55, 0.25)",
                      borderTop: "2px solid rgba(212, 175, 55, 0.65)",
                      borderRadius: "22px",
                      overflow: "hidden",
                      boxShadow: "0 30px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.12)",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    {/* Scanning Laser Hairline Glow */}
                    <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "2px", background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.8), transparent)", pointerEvents: "none", zIndex: 4 }} />

                    {/* Spec Tag Pill */}
                    <div style={{
                      position: "absolute",
                      top: "18px",
                      left: "20px",
                      padding: "4px 10px",
                      borderRadius: "5px",
                      background: "rgba(212, 175, 55, 0.12)",
                      border: "1px solid rgba(212, 175, 55, 0.35)",
                      color: "#D4AF37",
                      fontSize: "11px",
                      fontWeight: 800,
                      letterSpacing: "1.2px",
                      fontFamily: '"JetBrains Mono", "Courier New", monospace',
                      zIndex: 5
                    }}>
                      {`SPEC // 0${idx + 1}`}
                    </div>

                    {/* Ambient Asset Bloom */}
                    <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0, pointerEvents: "none" }}>
                      <Img 
                        src={staticFile(asset.url)} 
                        style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(0.25) saturate(1.4)", transform: "scale(1.2)" }} 
                        />
                    </div>

                    {/* Hero Uncropped Product Container */}
                    <div style={{ flex: 1, position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: count >= 4 ? "30px 20px 14px" : "36px 24px 18px" }}>
                      <div style={{ position: "absolute", width: "70%", height: "70%", background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
                      <Img
                        src={staticFile(asset.url)}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                          filter: "drop-shadow(0 20px 35px rgba(0,0,0,0.92)) drop-shadow(0 0 20px rgba(212,175,55,0.08))"
                        }}
                      />
                    </div>

                    {/* Clean Bottom Text Bar */}
                    <div style={{ 
                      position: "relative", 
                      zIndex: 2, 
                      padding: count >= 4 ? "clamp(10px, 1vw, 18px) clamp(12px, 1.2vw, 22px)" : "clamp(12px, 1.2vw, 22px) clamp(16px, 1.5vw, 28px)", 
                      background: "linear-gradient(to top, rgba(4,6,10,0.98) 0%, rgba(4,6,10,0.85) 65%, transparent 100%)",
                      borderTop: "1px solid rgba(255,255,255,0.06)"
                    }}>
                      <div style={{ 
                        fontSize: count >= 4 ? "clamp(14px, 1.3vw, 24px)" : "clamp(16px, 1.6vw, 30px)", 
                        fontWeight: 900, 
                        color: "#FFFFFF", 
                        letterSpacing: "-0.4px", 
                        lineHeight: 1.15,
                        textTransform: "uppercase"
                      }}>
                        {asset.title}
                      </div>
                      {asset.subtitle && (
                        <div style={{ 
                          fontSize: count >= 4 ? "clamp(10px, 0.8vw, 15px)" : "clamp(11px, 0.9vw, 17px)", 
                          fontWeight: 700, 
                          color: "#D4AF37", 
                          letterSpacing: "0.5px", 
                          marginTop: "4px" 
                        }}>
                          {asset.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AbsoluteFill>
      </AbsoluteFill>
    </CinematicTextureWrapper>
  );
};
