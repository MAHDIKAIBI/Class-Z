import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  OffthreadVideo,
  staticFile as remotionStaticFile,
} from 'remotion';
import { SafeImage as Img } from './SafeImage';
import React, { useMemo } from 'react';
import { CinematicTextureWrapper } from './CinematicTextureWrapper';
import { DynamicIslandNotch, LiquidGlassShowcaseCard } from './AppleGlassMedia';

const TRANSPARENT_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const staticFile = (path: string) => {
  if (!path || typeof path !== 'string') return TRANSPARENT_PIXEL;
  if (/^(https?:|data:|blob:)/i.test(path.trim())) return path.trim();
  let cleanPath = path.replace(/^\/?public\//, '');
  if (cleanPath.trim() === '' || cleanPath.endsWith('/')) return TRANSPARENT_PIXEL;
  try {
    cleanPath = decodeURIComponent(cleanPath);
  } catch {
    // ignore malformed URI sequence
  }
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
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: configDuration } = useVideoConfig();
  const effectiveDuration = durationInFrames || configDuration || 120;

  const validAssets = useMemo(() => {
    return (assets || []).filter(
      (a) => a && a.url && typeof a.url === 'string' && a.url.trim() !== ''
    );
  }, [assets]);

  const bgExt = bgVideoUrl?.split('.').pop()?.toLowerCase() || '';
  const bgIsVideo = ['mp4', 'mov', 'webm'].includes(bgExt);

  // Strict monotonic entrance timing locked to Whisper triggers + guaranteed reading runway
  const triggers = useMemo(() => {
    const total = validAssets.length;
    if (total === 0) return [];

    const minEntranceFrame = Math.min(10, Math.max(5, Math.round(fps * 0.24)));
    const minRunwayFrames = Math.max(28, Math.round(fps * 1.6));
    const maxLastTriggerFrame = Math.max(
      minEntranceFrame + (total - 1) * 10,
      effectiveDuration - minRunwayFrames
    );

    const rawTriggers = validAssets.map((asset) => {
      if (typeof asset.trigger_start_ms === 'number' && asset.trigger_start_ms > 0) {
        return Math.round(((asset.trigger_start_ms - sceneStartMs) / 1000) * fps);
      }
      if (typeof asset.trigger_frame === 'number' && asset.trigger_frame > 0 && asset.trigger_frame < 9000) {
        return asset.trigger_frame;
      }
      if (sceneWords && sceneWords.length > 0) {
        const cleanTitleWords = (asset.title || '')
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 2);

        const matchedWord = sceneWords.find((w: any) => {
          const cw = (w.word || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanTitleWords.some((tw) => cw.includes(tw) || tw.includes(cw));
        });

        if (matchedWord && typeof matchedWord.start_ms === 'number') {
          return Math.round(((matchedWord.start_ms - sceneStartMs) / 1000) * fps);
        }
      }
      return -1;
    });

    const resolvedTriggers: number[] = [];
    const defaultStagger = Math.max(
      12,
      Math.min(22, Math.floor((maxLastTriggerFrame - minEntranceFrame) / Math.max(1, total - 1)))
    );

    for (let i = 0; i < total; i++) {
      if (i === 0) {
        const raw0 = rawTriggers[0];
        const c0 =
          raw0 > 0
            ? Math.max(minEntranceFrame, Math.min(minEntranceFrame + 6, raw0))
            : minEntranceFrame;
        resolvedTriggers.push(c0);
      } else {
        const prev = resolvedTriggers[i - 1];
        const raw = rawTriggers[i];
        const minAllowed = prev + 12;
        let target = raw > 0 ? Math.max(minAllowed, raw) : prev + defaultStagger;

        const remainingSlots = total - 1 - i;
        const slotCeiling = maxLastTriggerFrame - remainingSlots * 10;
        if (target > slotCeiling) {
          target = Math.max(minAllowed, slotCeiling);
        }
        resolvedTriggers.push(target);
      }
    }

    return resolvedTriggers;
  }, [validAssets, sceneWords, sceneStartMs, effectiveDuration, fps]);

  // Background only fallback
  if (validAssets.length === 0) {
    return (
      <CinematicTextureWrapper
        backgroundLayer={
          <AbsoluteFill style={{ transform: 'scale(1.08) translateZ(0)', zIndex: 0 }}>
            {bgIsVideo ? (
              <OffthreadVideo
                src={staticFile(bgVideoUrl)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => console.log('Media playback error caught on Video:', e)}
              />
            ) : bgVideoUrl ? (
              <Img
                src={staticFile(bgVideoUrl)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', backgroundColor: '#05070D' }} />
            )}
          </AbsoluteFill>
        }
      >
        <AbsoluteFill />
      </CinematicTextureWrapper>
    );
  }

  const firstTrigger = triggers[0] ?? 7;
  const lastTrigger = triggers[triggers.length - 1] ?? firstTrigger;

  const blurOpacity = interpolate(frame, [Math.max(0, firstTrigger - 7), firstTrigger + 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Compute notch Siri pulse intensity peaking right as each card pops out of Dynamic Island
  let activePulse = 0;
  for (let i = 0; i < triggers.length; i++) {
    const dt = frame - triggers[i];
    if (dt >= -4 && dt <= 24) {
      const bell = Math.exp(-Math.pow((dt - 4) / 7.5, 2));
      if (bell > activePulse) activePulse = bell;
    }
  }

  const count = validAssets.length;
  const subtleAmbientHue = (frame * 1.4) % 360;

  return (
    <CinematicTextureWrapper
      backgroundLayer={
        <AbsoluteFill>
          {/* Base Video or Ambient Photo */}
          <AbsoluteFill style={{ transform: 'scale(1.08) translateZ(0)', zIndex: 0 }}>
            {bgIsVideo ? (
              <OffthreadVideo
                src={staticFile(bgVideoUrl)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => console.log('Media playback error caught on Video:', e)}
              />
            ) : bgVideoUrl ? (
              <Img
                src={staticFile(bgVideoUrl)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background:
                    'radial-gradient(ellipse at 50% 25%, #0F172A 0%, #05070D 62%, #020306 100%)',
                }}
              />
            )}
          </AbsoluteFill>

          {/* Smoked iOS Frosted Ambient Blur Overlay */}
          <AbsoluteFill
            style={{
              backgroundColor: `rgba(5, 7, 13, ${blurOpacity * 0.56})`,
              backdropFilter: `blur(${blurOpacity * 34}px) saturate(145%)`,
              WebkitBackdropFilter: `blur(${blurOpacity * 34}px) saturate(145%)`,
              opacity: blurOpacity,
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />

          {/* Subtle Apple Intelligence Atmospheric Aurora Wash */}
          <AbsoluteFill
            style={{
              background: `radial-gradient(ellipse 68% 48% at 50% ${14 + Math.sin(frame * 0.03) * 4}%, rgba(99,102,241,${0.14 * blurOpacity}) 0%, rgba(56,189,248,${0.09 * blurOpacity}) 38%, rgba(236,72,153,${0.05 * blurOpacity}) 65%, transparent 82%)`,
              filter: `hue-rotate(${Math.sin(subtleAmbientHue * 0.02) * 14}deg)`,
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />

          {/* Soft Depth Vignette */}
          <AbsoluteFill
            style={{
              background:
                'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(2,4,9,0.78) 100%)',
              zIndex: 3,
              pointerEvents: 'none',
            }}
          />
        </AbsoluteFill>
      }
    >
      <AbsoluteFill
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, sans-serif',
        }}
      >
        {/* Top-Center iOS Dynamic Island Siri Notch Portal (Zero /debug text) */}
        <DynamicIslandNotch
          firstTrigger={firstTrigger}
          lastTrigger={lastTrigger}
          activePulse={activePulse}
        />

        {/* ── LIQUID GLASS CARD STAGE (Popping cleanly from the Notch) ── */}
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            padding: 'clamp(72px, 7vh, 98px) clamp(32px, 3vw, 68px) clamp(44px, 5vh, 68px)',
            boxSizing: 'border-box',
          }}
        >
          {/* LAYOUT 1: HERO SPOTLIGHT */}
          {count === 1 && (
            <div
              style={{
                width: 'min(72vw, 1560px)',
                height: 'min(76vh, 960px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LiquidGlassShowcaseCard
                src={staticFile(validAssets[0].url)}
                title={validAssets[0].title}
                subtitle={validAssets[0].subtitle}
                triggerFrame={triggers[0] ?? 7}
                originOffsetX={0}
                tiltDegY={0}
                index={0}
              />
            </div>
          )}

          {/* LAYOUT 2: DUAL APPLE KEYNOTE SHOOTOUT (Bursts symmetrically from Dynamic Island) */}
          {count === 2 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'stretch',
                gap: 'clamp(28px, 2.8vw, 52px)',
                width: '100%',
                maxWidth: '2160px',
                height: 'min(70vh, 880px)',
                boxSizing: 'border-box',
              }}
            >
              {validAssets.map((asset, idx) => (
                <div key={idx} style={{ flex: 1, minWidth: 0, height: '100%' }}>
                  <LiquidGlassShowcaseCard
                    src={staticFile(asset.url)}
                    title={asset.title}
                    subtitle={asset.subtitle}
                    triggerFrame={triggers[idx] ?? 7}
                    originOffsetX={idx === 0 ? 560 : -560}
                    tiltDegY={idx === 0 ? 1.8 : -1.8}
                    index={idx}
                  />
                </div>
              ))}
            </div>
          )}

          {/* LAYOUT 3: TRIPLE OR QUAD SPATIAL DOCK */}
          {count >= 3 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'stretch',
                gap: count >= 4 ? 'clamp(16px, 1.5vw, 28px)' : 'clamp(22px, 2.1vw, 38px)',
                width: '100%',
                maxWidth: count >= 4 ? '2380px' : '2280px',
                height: count >= 4 ? 'min(68vh, 800px)' : 'min(72vh, 860px)',
                boxSizing: 'border-box',
              }}
            >
              {validAssets.map((asset, idx) => {
                const mid = (validAssets.length - 1) / 2;
                const originOffsetX = (mid - idx) * (count >= 4 ? 360 : 440);
                const tiltDegY = (idx - mid) * -1.4;
                return (
                  <div key={idx} style={{ flex: 1, minWidth: 0, height: '100%' }}>
                    <LiquidGlassShowcaseCard
                      src={staticFile(asset.url)}
                      title={asset.title}
                      subtitle={asset.subtitle}
                      triggerFrame={triggers[idx] ?? 7}
                      originOffsetX={originOffsetX}
                      tiltDegY={tiltDegY}
                      compact={true}
                      index={idx}
                    />
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
