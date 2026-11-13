import React, { useEffect, useRef, useState } from 'react';
import {
  continueRender,
  delayRender,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export type MediaVisualKind = 'photo' | 'cutout' | 'document' | 'transparent_png';

export interface AnalyzedMediaResult {
  resolvedSrc: string;
  kind: MediaVisualKind;
  aspect: number;
  dominantAccent: string;
}

const TRANSPARENT_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const _mediaCache = new Map<string, AnalyzedMediaResult>();

const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

const cropOpaqueBounds = (
  srcCanvas: HTMLCanvasElement,
  data: Uint8ClampedArray,
  w: number,
  h: number,
  marginPx = 6
): { dataUrl: string; aspect: number } | null => {
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX <= minX + 4 || maxY <= minY + 4) return null;

  const sx = Math.max(0, minX - marginPx);
  const sy = Math.max(0, minY - marginPx);
  const ex = Math.min(w - 1, maxX + marginPx);
  const ey = Math.min(h - 1, maxY + marginPx);
  const cw = ex - sx + 1;
  const ch = ey - sy + 1;

  const trimmed = document.createElement('canvas');
  trimmed.width = cw;
  trimmed.height = ch;
  const tctx = trimmed.getContext('2d');
  if (!tctx) return null;
  tctx.drawImage(srcCanvas, sx, sy, cw, ch, 0, 0, cw, ch);
  return {
    dataUrl: trimmed.toDataURL('image/png'),
    aspect: cw / Math.max(1, ch),
  };
};

const analyzeImageElement = (img: HTMLImageElement, origSrc: string): AnalyzedMediaResult => {
  const natW = img.naturalWidth || 1280;
  const natH = img.naturalHeight || 720;
  const aspect = natW / Math.max(1, natH);

  try {
    const maxDim = 920;
    const scale = Math.min(1, maxDim / Math.max(natW, natH));
    const w = Math.max(8, Math.round(natW * scale));
    const h = Math.max(8, Math.round(natH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return { resolvedSrc: origSrc, kind: 'photo', aspect, dominantAccent: '#60A5FA' };
    }

    ctx.drawImage(img, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const total = w * h;

    // 1. Sample 2px border perimeter + overall whiteness / accent tone
    let borderTotal = 0;
    let borderTransparent = 0;
    let borderNearWhite = 0;
    let overallNearWhite = 0;
    let accR = 0;
    let accG = 0;
    let accB = 0;
    let accWeight = 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        const minC = Math.min(r, g, b);
        const maxC = Math.max(r, g, b);
        const chroma = maxC - minC;
        const isWhite = a > 200 && minC >= 224 && chroma <= 26;

        if (isWhite) overallNearWhite++;

        if (x < 2 || x >= w - 2 || y < 2 || y >= h - 2) {
          borderTotal++;
          if (a < 210) borderTransparent++;
          else if (isWhite) borderNearWhite++;
        } else if (a > 200 && chroma > 34 && maxC > 50 && minC < 235) {
          const wt = chroma * (maxC / 255);
          accR += r * wt;
          accG += g * wt;
          accB += b * wt;
          accWeight += wt;
        }
      }
    }

    let dominantAccent = '#60A5FA';
    if (accWeight > 0) {
      const dr = clamp(Math.round(accR / accWeight), 70, 250);
      const dg = clamp(Math.round(accG / accWeight), 90, 245);
      const db = clamp(Math.round(accB / accWeight), 110, 255);
      dominantAccent = `rgb(${dr}, ${dg}, ${db})`;
    }

    const borderTransFrac = borderTransparent / Math.max(1, borderTotal);
    const borderWhiteFrac = borderNearWhite / Math.max(1, borderTotal);
    const overallWhiteFrac = overallNearWhite / Math.max(1, total);

    // Already crisp transparent PNG — trim excess transparent padding so hardware fills stage
    if (borderTransFrac >= 0.14) {
      const trimmed = cropOpaqueBounds(canvas, data, w, h, 6);
      return {
        resolvedSrc: trimmed ? trimmed.dataUrl : origSrc,
        kind: 'transparent_png',
        aspect: trimmed ? trimmed.aspect : aspect,
        dominantAccent,
      };
    }

    // Check for uniform bright white / studio backdrop cutout vs light paper document
    if (borderWhiteFrac >= 0.56) {
      const visited = new Uint8Array(total);
      const bgMask = new Uint8Array(total);
      const queue = new Int32Array(total);
      let head = 0;
      let tail = 0;

      const trySeed = (px: number) => {
        if (visited[px]) return;
        const i4 = px * 4;
        const r = data[i4];
        const g = data[i4 + 1];
        const b = data[i4 + 2];
        const a = data[i4 + 3];
        if (a < 30) {
          visited[px] = 1;
          bgMask[px] = 1;
          queue[tail++] = px;
          return;
        }
        const minC = Math.min(r, g, b);
        const maxC = Math.max(r, g, b);
        if (minC >= 224 && maxC - minC <= 26) {
          visited[px] = 1;
          bgMask[px] = 1;
          queue[tail++] = px;
        }
      };

      for (let x = 0; x < w; x++) {
        trySeed(x);
        trySeed((h - 1) * w + x);
      }
      for (let y = 1; y < h - 1; y++) {
        trySeed(y * w);
        trySeed(y * w + (w - 1));
      }

      while (head < tail) {
        const cur = queue[head++];
        const cx = cur % w;
        const cy = (cur - cx) / w;

        const neighbors: number[] = [];
        if (cx > 0) neighbors.push(cur - 1);
        if (cx + 1 < w) neighbors.push(cur + 1);
        if (cy > 0) neighbors.push(cur - w);
        if (cy + 1 < h) neighbors.push(cur + w);

        for (let ni = 0; ni < neighbors.length; ni++) {
          const nb = neighbors[ni];
          if (visited[nb]) continue;
          const j4 = nb * 4;
          const r = data[j4];
          const g = data[j4 + 1];
          const b = data[j4 + 2];
          const a = data[j4 + 3];
          const minC = Math.min(r, g, b);
          const maxC = Math.max(r, g, b);
          if (a < 30 || (minC >= 214 && maxC - minC <= 28)) {
            visited[nb] = 1;
            bgMask[nb] = 1;
            queue[tail++] = nb;
          }
        }
      }

      const bgRatio = tail / total;
      let solidNonWhiteFg = 0;
      for (let p = 0; p < total; p++) {
        if (bgMask[p]) continue;
        const i4 = p * 4;
        const minC = Math.min(data[i4], data[i4 + 1], data[i4 + 2]);
        const maxC = Math.max(data[i4], data[i4 + 1], data[i4 + 2]);
        if (minC < 208 || maxC - minC > 22) {
          solidNonWhiteFg++;
        }
      }
      const solidFgRatio = solidNonWhiteFg / total;

      // Solid physical hardware / subject cutout on studio white
      if (bgRatio >= 0.14 && bgRatio <= 0.87 && solidFgRatio >= 0.08) {
        // Punch exterior transparent background
        for (let p = 0; p < total; p++) {
          if (bgMask[p]) {
            data[p * 4 + 3] = 0;
          }
        }

        // Smooth anti-aliased fringe feathering + white-halo decontamination along cutout boundary
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const p = y * w + x;
            if (bgMask[p]) continue;

            let nearBg = 0;
            if (bgMask[p - 1]) nearBg++;
            if (bgMask[p + 1]) nearBg++;
            if (bgMask[p - w]) nearBg++;
            if (bgMask[p + w]) nearBg++;

            if (nearBg > 0) {
              const i4 = p * 4;
              const r = data[i4];
              const g = data[i4 + 1];
              const b = data[i4 + 2];
              const minC = Math.min(r, g, b);
              const maxC = Math.max(r, g, b);
              const lum = (r + g + b) / 3;
              const chroma = maxC - minC;

              if (lum >= 182 && chroma <= 32) {
                const keepAlpha = clamp((238 - lum) / 72, 0.08, 0.85);
                data[i4 + 3] = Math.round(data[i4 + 3] * keepAlpha);
                data[i4] = Math.round(r * 0.72);
                data[i4 + 1] = Math.round(g * 0.72);
                data[i4 + 2] = Math.round(b * 0.72);
              } else {
                data[i4 + 3] = Math.round(data[i4 + 3] * (nearBg >= 2 ? 0.82 : 0.92));
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const trimmed = cropOpaqueBounds(canvas, data, w, h, 6);
        return {
          resolvedSrc: trimmed ? trimmed.dataUrl : canvas.toDataURL('image/png'),
          kind: 'cutout',
          aspect: trimmed ? trimmed.aspect : aspect,
          dominantAccent,
        };
      }

      // Light paper / patent / printed document / article screenshot
      return { resolvedSrc: origSrc, kind: 'document', aspect, dominantAccent };
    }

    if (overallWhiteFrac >= 0.56) {
      return { resolvedSrc: origSrc, kind: 'document', aspect, dominantAccent };
    }

    return { resolvedSrc: origSrc, kind: 'photo', aspect, dominantAccent };
  } catch {
    return { resolvedSrc: origSrc, kind: 'photo', aspect, dominantAccent: '#60A5FA' };
  }
};

export function useStudioCutoutImage(src: string): AnalyzedMediaResult {
  const cached = src ? _mediaCache.get(src) : undefined;
  const [result, setResult] = useState<AnalyzedMediaResult>(() => {
    if (cached) return cached;
    return {
      resolvedSrc: src || TRANSPARENT_PIXEL,
      kind: 'photo',
      aspect: 16 / 9,
      dominantAccent: '#60A5FA',
    };
  });

  useEffect(() => {
    if (!src || src === TRANSPARENT_PIXEL || src.startsWith('data:')) {
      setResult({
        resolvedSrc: src || TRANSPARENT_PIXEL,
        kind: 'photo',
        aspect: 16 / 9,
        dominantAccent: '#60A5FA',
      });
      return;
    }

    const hit = _mediaCache.get(src);
    if (hit) {
      setResult(hit);
      return;
    }

    let cancelled = false;
    let done = false;
    const handle = delayRender(`AppleGlassMedia: ${src}`, { timeoutInMilliseconds: 3500 });
    const unblock = () => {
      if (!done) {
        done = true;
        continueRender(handle);
      }
    };

    const timer = setTimeout(() => {
      unblock();
    }, 1500);

    const img = new Image();
    if (/^https?:\/\//i.test(src) && !src.includes('localhost') && !src.includes('127.0.0.1')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      if (cancelled) {
        unblock();
        return;
      }
      const analyzed = analyzeImageElement(img, src);
      _mediaCache.set(src, analyzed);
      setResult(analyzed);
      clearTimeout(timer);
      unblock();
    };
    img.onerror = () => {
      if (!cancelled) {
        const fallback: AnalyzedMediaResult = {
          resolvedSrc: TRANSPARENT_PIXEL,
          kind: 'photo',
          aspect: 16 / 9,
          dominantAccent: '#60A5FA',
        };
        _mediaCache.set(src, fallback);
        setResult(fallback);
      }
      clearTimeout(timer);
      unblock();
    };
    img.src = src;

    return () => {
      cancelled = true;
      clearTimeout(timer);
      unblock();
    };
  }, [src]);

  return result;
}

/**
 * Pure iOS Dynamic Island Pill Portal with Siri Apple Intelligence Glow.
 * Zero monospace /debug labels or HUD clutter.
 */
export const DynamicIslandNotch: React.FC<{
  firstTrigger: number;
  lastTrigger: number;
  activePulse?: number;
}> = ({ firstTrigger, lastTrigger, activePulse = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Bubbly elastic drop-in from top bezel
  const dropIn = spring({
    frame: Math.max(0, frame),
    fps,
    config: { damping: 11, stiffness: 195, mass: 0.62 },
  });

  // Appear -> Throw cards -> Pinch smoothly into glowing sphere & pop-vanish cleanly (zero clipped top edge)
  const outroStart = Math.min(lastTrigger + 18, Math.max(firstTrigger + 10, (durationInFrames || 120) - 15));
  const retractProgress = interpolate(frame, [outroStart, outroStart + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const easeOutRetract = Math.pow(retractProgress, 1.45);

  const launchDropOffset = activePulse * 7;
  const translateY =
    interpolate(dropIn, [0, 1], [-86, 0]) +
    launchDropOffset -
    interpolate(easeOutRetract, [0, 1], [0, 18]);
  const capsuleOpacity =
    interpolate(dropIn, [0, 0.22], [0, 1], { extrapolateRight: 'clamp' }) *
    interpolate(retractProgress, [0.55, 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  if (capsuleOpacity <= 0.01) return null;

  // Bubbly inflation on throw, then crisp pill -> round Siri orb pinch -> pop disappear
  const prePop = interpolate(frame, [Math.max(0, firstTrigger - 8), firstTrigger + 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const siriEnergy = clamp(activePulse * 1.05 + (1 - prePop) * 0.25 + 0.18, 0.18, 1.25);
  const retractPinch = interpolate(retractProgress, [0, 0.45, 1], [1, 0.24, 0.2], {
    extrapolateRight: 'clamp',
  });
  const pillWidth = Math.max(38, Math.round((84 + dropIn * 114 + activePulse * 145) * retractPinch));
  const pillHeight = Math.round(38 + activePulse * 13);
  const retractPopScale = interpolate(retractProgress, [0, 0.28, 0.55, 1], [1, 1.1, 0.92, 0.08]);
  const bubbleScaleX = (1 - activePulse * 0.04) * retractPopScale;
  const bubbleScaleY = (1 + activePulse * 0.14) * retractPopScale;
  const angle = (frame * 3.8) % 360;

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: `translate(-50%, ${translateY}px) scale(${bubbleScaleX}, ${bubbleScaleY})`,
        opacity: capsuleOpacity,
        zIndex: 90,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Downward Liquid Siri Droplet Funnel Glow while throwing cards */}
      <div
        style={{
          position: 'absolute',
          top: '18px',
          width: `${340 + activePulse * 480}px`,
          height: `${110 + activePulse * 230}px`,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.56) 0%, rgba(168,85,247,0.38) 38%, rgba(236,72,153,0.18) 66%, transparent 82%)',
          filter: 'blur(34px)',
          opacity: clamp(0.14 + activePulse * 0.96, 0, 1) * (1 - retractProgress),
          transform: `scale(${0.8 + activePulse * 0.45})`,
          pointerEvents: 'none',
        }}
      />

      {/* Glowing Conic Siri Rim + Obsidian Capsule */}
      <div
        style={{
          position: 'relative',
          width: `${pillWidth}px`,
          height: `${pillHeight}px`,
          borderRadius: '999px',
          padding: '1.75px',
          background: `conic-gradient(from ${angle}deg, rgba(56,189,248,${0.48 + activePulse * 0.52}), rgba(129,140,248,${0.48 + activePulse * 0.52}), rgba(192,132,252,${0.46 + activePulse * 0.54}), rgba(244,114,182,${0.42 + activePulse * 0.54}), rgba(251,146,60,${0.36 + activePulse * 0.5}), rgba(56,189,248,${0.48 + activePulse * 0.52}))`,
          boxShadow: `0 12px 34px rgba(0,0,0,0.78), 0 0 ${16 + siriEnergy * 32}px rgba(129,140,248,${0.22 + activePulse * 0.48})`,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '999px',
            background: 'linear-gradient(180deg, #090B12 0%, #020306 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 2px rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: pillWidth < 72 ? 'center' : 'space-between',
            padding: pillWidth < 72 ? '0' : '0 15px',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {/* Left miniature Siri Intelligence Aura Orb */}
          <div
            style={{
              width: '18px',
              height: '18px',
              flexShrink: 0,
              borderRadius: '50%',
              background: `conic-gradient(from ${-angle * 1.4}deg, #38BDF8, #A855F7, #EC4899, #FB923C, #38BDF8)`,
              boxShadow: '0 0 12px rgba(168,85,247,0.85)',
              transform: `scale(${0.92 + Math.sin(frame * 0.22) * 0.12 + activePulse * 0.16})`,
            }}
          />

          {/* Center Minimal Kinetic Siri Wavelength Bars (Pure visual, zero text) */}
          {pillWidth >= 72 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                opacity: interpolate(retractProgress, [0, 0.32], [1, 0], { extrapolateRight: 'clamp' }),
              }}
            >
              {[0, 1, 2, 3, 4].map((bIdx) => {
                const wave =
                  0.35 +
                  0.65 *
                    Math.abs(Math.sin(frame * 0.24 + bIdx * 0.85)) *
                    (0.55 + activePulse * 0.75);
                const barH = Math.round(6 + wave * 14);
                const colors = ['#38BDF8', '#818CF8', '#C084FC', '#F472B6', '#FB923C'];
                return (
                  <div
                    key={bIdx}
                    style={{
                      width: '3.5px',
                      height: `${barH}px`,
                      borderRadius: '999px',
                      backgroundColor: colors[bIdx],
                      boxShadow: `0 0 8px ${colors[bIdx]}`,
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Right subtle optical lens ring */}
          {pillWidth >= 72 && (
            <div
              style={{
                width: '12px',
                height: '12px',
                flexShrink: 0,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #3B82F6 0%, #0F172A 65%, #020617 100%)',
                border: '1px solid rgba(255,255,255,0.16)',
                opacity: interpolate(retractProgress, [0, 0.32], [1, 0], { extrapolateRight: 'clamp' }),
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export interface LiquidGlassCardProps {
  src: string;
  title?: string;
  subtitle?: string;
  triggerFrame: number;
  originOffsetX?: number;
  tiltDegY?: number;
  width?: string | number;
  height?: string | number;
  aspectRatio?: string;
  compact?: boolean;
  index?: number;
}

/**
 * High-End Apple iOS Liquid Glass + Siri Glow Image Stage Card.
 * - Springs down and morphs fluidly from Dynamic Island squircle pill
 * - Auto-keys studio white JPG cutouts into 3D floating hardware
 * - Auto-frames full-bleed photos edge-to-edge without black letterbox bars
 * - Curates paper/patent scans inside warm frosted porcelain frames
 */
export const LiquidGlassShowcaseCard: React.FC<LiquidGlassCardProps> = ({
  src,
  title,
  subtitle,
  triggerFrame,
  originOffsetX = 0,
  tiltDegY = 0,
  width = '100%',
  height = '100%',
  aspectRatio,
  compact = false,
  index = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const analyzed = useStudioCutoutImage(src);

  const relFrame = Math.max(0, frame - triggerFrame);
  // Playful bubbly Apple spring overshoot (~5% bounce) when thrown from Dynamic Island
  const pop = spring({
    frame: relFrame,
    fps,
    config: { damping: 11.5, stiffness: 142, mass: 0.74 },
  });
  const subjectPop = spring({
    frame: Math.max(0, relFrame - 2),
    fps,
    config: { damping: 10.5, stiffness: 128, mass: 0.76 },
  });
  const captionPop = spring({
    frame: Math.max(0, relFrame - 4),
    fps,
    config: { damping: 14, stiffness: 155, mass: 0.7 },
  });

  if (frame < triggerFrame) return null;

  // Curved droplet throw trajectory + liquid stretch during notch detachment
  const launchArc = Math.sin(clamp(pop / 0.55, 0, 1) * Math.PI);
  const bubbleStretchY = 1 + launchArc * 0.16;
  const bubbleSqueezeX = 1 - launchArc * 0.08;
  const spreadProgress = Math.pow(clamp(pop, 0, 1.08), 0.76);

  const opacity = interpolate(pop, [0, 0.18], [0, 1], { extrapolateRight: 'clamp' });
  const scale = interpolate(pop, [0, 1], [0.1, 1.0]);
  const translateY = interpolate(pop, [0, 1], [-580, 0]);
  const translateX = originOffsetX * (1 - spreadProgress);
  const flightTiltY = tiltDegY * Math.max(0, 1 - pop) * 3.8;
  const flightTiltZ = (tiltDegY > 0 ? -6.5 : tiltDegY < 0 ? 6.5 : 0) * Math.max(0, 1 - pop);
  const blurPx = interpolate(pop, [0, 0.58], [18, 0], { extrapolateRight: 'clamp' });
  const morphRadius = Math.round(
    interpolate(clamp(pop, 0, 1), [0, 0.56, 1], [180, 48, compact ? 28 : 36])
  );

  // Gentle organic breathing float + diagonal glass sheen sweep after landing
  const floatY = Math.sin((frame + index * 22) * 0.045) * 4;
  const sheenX = interpolate(relFrame, [10, 42], [-120, 180], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sheenOpacity = interpolate(relFrame, [10, 24, 42], [0, 0.3, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Siri iridescent aura burns brightest during notch pop-out then settles to refined frosted rim
  const siriBurst = interpolate(relFrame, [0, 12, 34], [0.98, 1.0, 0.34], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const angle = (frame * 2.4 + index * 90) % 360;

  // Start at 1.045 so edge-to-edge full-bleed photos crop out any 2-4% dark capture margins cleanly
  const photoKenBurns = interpolate(relFrame, [0, 150], [1.045, 1.1], {
    extrapolateRight: 'clamp',
  });

  const isCutout = analyzed.kind === 'cutout' || analyzed.kind === 'transparent_png';
  const isDoc = analyzed.kind === 'document';
  const isPhoto = !isCutout && !isDoc;
  const accent = analyzed.dominantAccent || '#60A5FA';

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        aspectRatio,
        minWidth: 0,
        boxSizing: 'border-box',
        opacity,
        filter: blurPx > 0.3 ? `blur(${blurPx}px)` : undefined,
        transform: `perspective(2400px) translate3d(${translateX}px, ${translateY + floatY}px, 0) rotateY(${flightTiltY}deg) rotateZ(${flightTiltZ}deg) scale(${scale * bubbleSqueezeX}, ${scale * bubbleStretchY})`,
        transformOrigin: '50% 18%',
      }}
    >
      {/* Ambient Siri Iridescent Glow Halo Behind Card */}
      <div
        style={{
          position: 'absolute',
          inset: '-10px',
          borderRadius: `${morphRadius + 8}px`,
          background: `conic-gradient(from ${angle}deg, rgba(56,189,248,0.65), rgba(168,85,247,0.65), rgba(244,114,182,0.55), rgba(251,146,60,0.45), rgba(56,189,248,0.65))`,
          filter: 'blur(34px)',
          opacity: 0.22 + siriBurst * 0.34,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Precision Iridescent Liquid Glass Rim Wrapper */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: `${morphRadius}px`,
          padding: '1.5px',
          background: `conic-gradient(from ${angle}deg, rgba(255,255,255,${0.38 + siriBurst * 0.28}), rgba(56,189,248,${0.34 + siriBurst * 0.46}), rgba(168,85,247,${0.3 + siriBurst * 0.45}), rgba(244,114,182,${0.25 + siriBurst * 0.35}), rgba(255,255,255,0.34))`,
          boxShadow:
            '0 42px 96px -14px rgba(0,0,0,0.9), 0 12px 32px rgba(0,0,0,0.52)',
          zIndex: 1,
          boxSizing: 'border-box',
        }}
      >
        {/* Main Obsidian Smoked Liquid Glass Body */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: `${Math.max(12, morphRadius - 2)}px`,
            overflow: 'hidden',
            background:
              'linear-gradient(165deg, rgba(22, 27, 42, 0.86) 0%, rgba(10, 13, 22, 0.92) 60%, rgba(6, 8, 14, 0.96) 100%)',
            backdropFilter: 'blur(54px) saturate(185%) brightness(1.06)',
            WebkitBackdropFilter: 'blur(54px) saturate(185%) brightness(1.06)',
            boxShadow:
              'inset 0 1.5px 0 rgba(255,255,255,0.40), inset 0 -1px 0 rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Ambient Blurred Color Atmosphere Layer inside Glass */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          >
            <img
              src={analyzed.resolvedSrc}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'blur(65px) brightness(0.32) saturate(1.7)',
                transform: 'scale(1.25)',
                opacity: isDoc ? 0.25 : 0.72,
              }}
            />
          </div>

          {/* Visual Content Viewport (Edge-to-edge full bleed for Photos; Apple Hero Podium for Cutouts) */}
          <div
            style={
              isPhoto
                ? {
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    overflow: 'hidden',
                  }
                : {
                    position: 'relative',
                    flex: 1,
                    minHeight: 0,
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: isCutout
                      ? compact
                        ? '22px 24px 104px'
                        : '28px 36px 124px'
                      : compact
                      ? '16px 16px 100px'
                      : '20px 22px 118px',
                    boxSizing: 'border-box',
                  }
            }
          >
            {isCutout ? (
              <>
                {/* Directional Keynote Radial Spotlight + Fine Optical Grid Floor behind Hardware */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(ellipse 72% 58% at 50% 44%, ${accent}26 0%, rgba(129,140,248,0.14) 40%, rgba(8,11,20,0) 76%)`,
                    pointerEvents: 'none',
                  }}
                />
                {/* Anodized Liquid Glass Podium Horizon & Soft Contact Reflection */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: compact ? '96px' : '116px',
                    width: '68%',
                    height: '44px',
                    borderRadius: '50%',
                    background: `radial-gradient(ellipse at center, rgba(255,255,255,0.16) 0%, ${accent}24 38%, transparent 74%)`,
                    filter: 'blur(16px)',
                    pointerEvents: 'none',
                  }}
                />
                <img
                  src={analyzed.resolvedSrc}
                  alt={title || ''}
                  style={{
                    position: 'relative',
                    width: '86%',
                    height: '86%',
                    objectFit: 'contain',
                    transform: `translateY(${interpolate(subjectPop, [0, 1], [24, 0])}px) scale(${interpolate(subjectPop, [0, 1], [0.80, 1.0])})`,
                    filter:
                      'drop-shadow(0 34px 52px rgba(0,0,0,0.92)) drop-shadow(0 0 34px rgba(168,85,247,0.22))',
                  }}
                />
              </>
            ) : isDoc ? (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  borderRadius: compact ? '16px' : '22px',
                  overflow: 'hidden',
                  background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2F6 100%)',
                  padding: compact ? '10px' : '16px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow:
                    '0 18px 42px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.9)',
                }}
              >
                <img
                  src={analyzed.resolvedSrc}
                  alt={title || ''}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                />
              </div>
            ) : (
              <>
                <img
                  src={analyzed.resolvedSrc}
                  alt={title || ''}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${photoKenBurns})`,
                    filter: 'contrast(1.05) saturate(1.1)',
                  }}
                />
                {/* Soft edge-to-edge optical glass depth vignette */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 24%, transparent 56%, rgba(6,8,15,0.86) 100%)',
                    pointerEvents: 'none',
                  }}
                />
              </>
            )}
          </div>

          {/* Sleek Floating Apple Liquid Glass Bottom Typography Bar (Feathered mask eliminates hard blur seam) */}
          {(title || subtitle) && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 3,
                padding: compact
                  ? '38px 22px 18px'
                  : '52px 34px 24px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(6,8,15,0.0) 0%, rgba(6,8,15,0.68) 44%, rgba(4,6,12,0.95) 100%)',
                  backdropFilter: 'blur(22px)',
                  WebkitBackdropFilter: 'blur(22px)',
                  maskImage: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.75) 42%, black 76%)',
                  WebkitMaskImage:
                    'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.75) 42%, black 76%)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  opacity: interpolate(captionPop, [0, 0.35], [0, 1], { extrapolateRight: 'clamp' }),
                  transform: `translateY(${interpolate(captionPop, [0, 1], [18, 0])}px)`,
                }}
              >
                {title && (
                  <div
                    style={{
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, sans-serif',
                      fontSize: compact
                        ? 'clamp(17px, 1.45vw, 26px)'
                        : 'clamp(22px, 1.9vw, 38px)',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      letterSpacing: '-0.028em',
                      lineHeight: 1.1,
                      textShadow: '0 2px 16px rgba(0,0,0,0.65)',
                    }}
                  >
                    {title}
                  </div>
                )}
                {subtitle && (
                  <div
                    style={{
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif',
                      fontSize: compact
                        ? 'clamp(12px, 0.95vw, 17px)'
                        : 'clamp(14px, 1.15vw, 22px)',
                      fontWeight: 600,
                      color: 'rgba(186, 230, 253, 0.96)',
                      letterSpacing: '-0.005em',
                      marginTop: '5px',
                    }}
                  >
                    {subtitle}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Curved Top Liquid Glass Meniscus Reflection Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: `${Math.max(12, morphRadius - 2)}px`,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 14%, transparent 38%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.32)',
              pointerEvents: 'none',
              zIndex: 4,
            }}
          />

          {/* Diagonal Specular Glass Glint Sweep */}
          {sheenOpacity > 0.005 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(112deg, transparent 30%, rgba(255,255,255,0.28) 49%, rgba(186,230,253,0.18) 54%, transparent 72%)',
                transform: `translateX(${sheenX}%)`,
                opacity: sheenOpacity,
                pointerEvents: 'none',
                zIndex: 5,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
