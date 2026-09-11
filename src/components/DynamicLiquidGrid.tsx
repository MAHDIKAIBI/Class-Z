import { 
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig, 
  spring, 
  interpolate, 
  Img, 
  OffthreadVideo,
  Sequence,
  staticFile as remotionStaticFile
} from "remotion";
import React, { useMemo } from "react";
import { CinematicTextureWrapper } from './CinematicTextureWrapper';
import { SmartAudio } from './SmartAudio';

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
  // Never pops at frame 0, never sends items to 9999.
  // ──────────────────────────────────────────────────────────────────────────
  const triggers = useMemo(() => {
    const total = validAssets.length;
    if (total === 0) return [];

    // Min floor frame: 12 frames into the scene so background establishes cleanly
    const minEntranceFrame = Math.min(15, Math.max(10, Math.round(fps * 0.4)));

    return validAssets.map((asset, idx) => {
      // 1. Explicit trigger_start_ms from scene metadata
      if (typeof asset.trigger_start_ms === 'number' && asset.trigger_start_ms > 0) {
        const computed = Math.round(((asset.trigger_start_ms - sceneStartMs) / 1000) * fps);
        return Math.max(minEntranceFrame, computed);
      }

      // 2. Explicit trigger_frame (if valid and not the broken 9999 / 0 fallback)
      if (typeof asset.trigger_frame === 'number' && asset.trigger_frame > 0 && asset.trigger_frame < 9000) {
        return Math.max(minEntranceFrame, asset.trigger_frame);
      }

      // 3. Spoken word alignment via WhisperX timestamps
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
          const computed = Math.round(((matchedWord.start_ms - sceneStartMs) / 1000) * fps);
          return Math.max(minEntranceFrame, computed);
        }

        // Cadence fallback across spoken words
        if (idx === 0) {
          const firstWordMs = sceneWords[0]?.start_ms;
          if (typeof firstWordMs === 'number') {
            return Math.max(minEntranceFrame, Math.round(((firstWordMs - sceneStartMs) / 1000) * fps));
          }
          return minEntranceFrame;
        }

        const targetWordIdx = Math.min(
          sceneWords.length - 1,
          Math.floor((idx / total) * sceneWords.length)
        );
        const word = sceneWords[targetWordIdx];
        if (word && typeof word.start_ms === 'number') {
          const computed = Math.round(((word.start_ms - sceneStartMs) / 1000) * fps);
          return Math.max(minEntranceFrame + (idx * 14), computed);
        }
      }

      // 4. Default graceful stagger across scene duration
      if (idx === 0) return minEntranceFrame;
      const usableFrames = Math.max(30, effectiveDuration - minEntranceFrame - 15);
      const step = usableFrames / total;
      return Math.round(minEntranceFrame + (idx * step));
    });
  }, [validAssets, sceneWords, sceneStartMs, effectiveDuration, fps]);

  // Fallback: If no assets downloaded, show clean background
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

  // Dynamic Background Blur (Starts sharp, blurs when first card appears)
  const firstTrigger = triggers[0] ?? 12;
  const blurOpacity = interpolate(frame, [firstTrigger - 10, firstTrigger], [0, 1], { 
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
              backgroundColor: `rgba(4, 6, 12, ${blurOpacity * 0.55})`,
              backdropFilter: `blur(${blurOpacity * 30}px) saturate(140%)`,
              WebkitBackdropFilter: `blur(${blurOpacity * 30}px) saturate(140%)`,
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
        
        {/* ── AUDIO SFX LAYERS ── */}
        {validAssets.map((_, idx) => {
          const cardTrigger = triggers[idx] ?? 12;
          const sfxSrc = idx === 0 
            ? "audio/sfx/transitions/transition1.wav" 
            : "audio/sfx/transitions/transition4.wav";

          return (
            <Sequence key={`sfx-${idx}`} from={cardTrigger} durationInFrames={45}>
              <SmartAudio src={sfxSrc} durationFrames={45} baseVolume={0.3} />
            </Sequence>
          );
        })}

        {/* ── CARD STAGE ── */}
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
          
          {/* LAYOUT 1: SINGLE CARD (Solo Spotlight) */}
          {count === 1 && (() => {
            const asset = validAssets[0];
            const trigger = triggers[0] ?? 12;
            const entrance = spring({
              frame: Math.max(0, frame - trigger),
              fps,
              config: { damping: 20, stiffness: 90, mass: 1 }
            });
            const opacity = interpolate(entrance, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
            const scale = interpolate(entrance, [0, 1], [0.94, 1]);
            const translateY = interpolate(entrance, [0, 1], [35, 0]);

            return (
              <div
                style={{
                  position: "relative",
                  width: "440px",
                  height: "520px",
                  opacity,
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  background: "linear-gradient(160deg, rgba(20,26,40,0.92) 0%, rgba(7,9,14,0.98) 100%)",
                  backdropFilter: "blur(48px) saturate(150%)",
                  WebkitBackdropFilter: "blur(48px) saturate(150%)",
                  border: "1px solid rgba(212,175,55,0.18)",
                  borderTop: "1px solid rgba(212,175,55,0.48)",
                  borderRadius: "22px",
                  overflow: "hidden",
                  boxShadow: "0 30px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,0,0,0.3)",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                {/* Top hairline glow */}
                <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: "1px", background: "linear-gradient(to right, transparent, rgba(212,175,55,0.6), transparent)", pointerEvents: "none", zIndex: 4 }} />

                {/* Ambient blurred asset layer */}
                <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0, pointerEvents: "none" }}>
                  <Img 
                    src={staticFile(asset.url)} 
                    style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(0.28) saturate(1.4)", transform: "scale(1.2)" }} 
                  />
                </div>

                {/* Hero uncropped product image */}
                <div style={{ flex: 1, position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "28px", background: "radial-gradient(circle at 50% 50%, rgba(212,175,55,0.04) 0%, transparent 70%)" }}>
                  <Img
                    src={staticFile(asset.url)}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.85))"
                    }}
                  />
                </div>

                {/* Clean Bottom Text */}
                <div style={{ position: "relative", zIndex: 2, padding: "18px 24px 24px", background: "linear-gradient(to top, rgba(4,6,10,0.98) 0%, rgba(4,6,10,0.7) 65%, transparent 100%)" }}>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.4px", lineHeight: 1.15 }}>
                    {asset.title}
                  </div>
                  {asset.subtitle && (
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "rgba(212,175,55,0.85)", letterSpacing: "0.5px", marginTop: "4px" }}>
                      {asset.subtitle}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* LAYOUT 2: DUAL CARDS (Side by Side) */}
          {count === 2 && (
            <div style={{ display: "flex", gap: "36px", width: "1020px", height: "480px" }}>
              {validAssets.map((asset, idx) => {
                const trigger = triggers[idx] ?? 12;
                const entrance = spring({
                  frame: Math.max(0, frame - trigger),
                  fps,
                  config: { damping: 20, stiffness: 90, mass: 1 }
                });
                const opacity = interpolate(entrance, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
                const scale = interpolate(entrance, [0, 1], [0.94, 1]);
                const slideX = interpolate(entrance, [0, 1], [idx === 0 ? -35 : 35, 0]);

                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      position: "relative",
                      opacity,
                      transform: `translateX(${slideX}px) scale(${scale})`,
                      background: "linear-gradient(160deg, rgba(20,26,40,0.92) 0%, rgba(7,9,14,0.98) 100%)",
                      backdropFilter: "blur(48px) saturate(150%)",
                      WebkitBackdropFilter: "blur(48px) saturate(150%)",
                      border: "1px solid rgba(212,175,55,0.18)",
                      borderTop: "1px solid rgba(212,175,55,0.48)",
                      borderRadius: "20px",
                      overflow: "hidden",
                      boxShadow: "0 28px 70px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,0,0,0.3)",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: "1px", background: "linear-gradient(to right, transparent, rgba(212,175,55,0.55), transparent)", pointerEvents: "none", zIndex: 4 }} />

                    {/* Ambient layer */}
                    <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0, pointerEvents: "none" }}>
                      <Img 
                        src={staticFile(asset.url)} 
                        style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(0.28) saturate(1.4)", transform: "scale(1.2)" }} 
                      />
                    </div>

                    {/* Hero Image */}
                    <div style={{ flex: 1, position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "radial-gradient(circle at 50% 50%, rgba(212,175,55,0.03) 0%, transparent 70%)" }}>
                      <Img
                        src={staticFile(asset.url)}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                          filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.85))"
                        }}
                      />
                    </div>

                    {/* Clean Text */}
                    <div style={{ position: "relative", zIndex: 2, padding: "16px 22px 20px", background: "linear-gradient(to top, rgba(4,6,10,0.98) 0%, rgba(4,6,10,0.65) 65%, transparent 100%)" }}>
                      <div style={{ fontSize: "21px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.3px", lineHeight: 1.15 }}>
                        {asset.title}
                      </div>
                      {asset.subtitle && (
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(212,175,55,0.85)", letterSpacing: "0.5px", marginTop: "3px" }}>
                          {asset.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* LAYOUT 3: TRIPLE OR QUAD CARDS (Multi-Item Rack) */}
          {count >= 3 && (
            <div style={{ display: "flex", gap: count >= 4 ? "18px" : "26px", width: count >= 4 ? "1480px" : "1280px", height: "460px" }}>
              {validAssets.map((asset, idx) => {
                const trigger = triggers[idx] ?? 12;
                const entrance = spring({
                  frame: Math.max(0, frame - trigger),
                  fps,
                  config: { damping: 20, stiffness: 90, mass: 1 }
                });
                const opacity = interpolate(entrance, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
                const scale = interpolate(entrance, [0, 1], [0.94, 1]);
                const translateY = interpolate(entrance, [0, 1], [30, 0]);

                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      position: "relative",
                      opacity,
                      transform: `translateY(${translateY}px) scale(${scale})`,
                      background: "linear-gradient(160deg, rgba(20,26,40,0.92) 0%, rgba(7,9,14,0.98) 100%)",
                      backdropFilter: "blur(48px) saturate(150%)",
                      WebkitBackdropFilter: "blur(48px) saturate(150%)",
                      border: "1px solid rgba(212,175,55,0.16)",
                      borderTop: "1px solid rgba(212,175,55,0.45)",
                      borderRadius: "18px",
                      overflow: "hidden",
                      boxShadow: "0 24px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,0,0,0.3)",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: "1px", background: "linear-gradient(to right, transparent, rgba(212,175,55,0.5), transparent)", pointerEvents: "none", zIndex: 4 }} />

                    {/* Ambient layer */}
                    <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0, pointerEvents: "none" }}>
                      <Img 
                        src={staticFile(asset.url)} 
                        style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(35px) brightness(0.28) saturate(1.4)", transform: "scale(1.2)" }} 
                      />
                    </div>

                    {/* Hero Image */}
                    <div style={{ flex: 1, position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "18px", background: "radial-gradient(circle at 50% 50%, rgba(212,175,55,0.03) 0%, transparent 70%)" }}>
                      <Img
                        src={staticFile(asset.url)}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                          filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.85))"
                        }}
                      />
                    </div>

                    {/* Clean Text */}
                    <div style={{ position: "relative", zIndex: 2, padding: "14px 18px 18px", background: "linear-gradient(to top, rgba(4,6,10,0.98) 0%, rgba(4,6,10,0.65) 65%, transparent 100%)" }}>
                      <div style={{ fontSize: count >= 4 ? "17px" : "19px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.3px", lineHeight: 1.15 }}>
                        {asset.title}
                      </div>
                      {asset.subtitle && (
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(212,175,55,0.85)", letterSpacing: "0.4px", marginTop: "3px" }}>
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
