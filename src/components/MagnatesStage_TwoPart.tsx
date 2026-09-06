import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile, Sequence, Easing, OffthreadVideo, Audio, random } from 'remotion';

// ============================================================================
// AUDIO ENVELOPE HANDLER
// ============================================================================
const EnvelopedSFX: React.FC<{
  src?: string;
  startFrame: number;
  peakVolume?: number;
  sustainFrames?: number;
}> = ({ src, startFrame, peakVolume = 1, sustainFrames = 30 }) => {
  const frame = useCurrentFrame();
  if (!src) return null;
  const assetSrc = getAsset(src);
  if (!assetSrc) return null;

  const rel = frame - startFrame;
  const vol = interpolate(
    rel,
    [0, 4, sustainFrames, sustainFrames + 12],
    [0, peakVolume, peakVolume, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <Sequence from={startFrame}>
      <Audio src={assetSrc} volume={vol} />
    </Sequence>
  );
};

const getAsset = (path: string) => {
  if (!path || typeof path !== 'string') return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  return staticFile(path.replace(/^\/?public\//, ''));
};
const msToFrames = (ms: number, fps: number) => Math.floor((ms / 1000) * fps);

const isVideo = (path?: string | null) =>
  typeof path === 'string' &&
  (path.toLowerCase().endsWith('.mp4') || path.toLowerCase().endsWith('.webm'));

const RainParticle: React.FC<{ src: string; seed: number; durationFrames: number; fps: number }> = ({ src, seed, fps }) => {
  const frame = useCurrentFrame();
  const startDelay = Math.floor(random(seed) * fps * 2);
  const fallDuration = fps * 15 + Math.floor(random(seed + 1) * fps * 5);
  const relFrame = (frame + startDelay) % fallDuration;

  const x = random(seed + 2) * 100;
  const y = interpolate(relFrame, [0, fallDuration], [120, -20]);
  const s = interpolate(random(seed + 3), [0, 1], [0.3, 1.2]);

  const zDepth = random(seed + 4);
  const blur = zDepth > 0.8 ? 12 : (zDepth < 0.2 ? 2 : 5);
  const opacity = interpolate(relFrame, [0, 15, fallDuration - 15, fallDuration], [0, 0.6, 0.6, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: `scale(${s}) translateZ(${interpolate(zDepth, [0, 1], [-400, 200])}px)`,
        opacity,
        filter: `blur(${blur}px)`,
        zIndex: zDepth > 0.5 ? 5 : 40,
      }}
    >
      <Img src={getAsset(src)} style={{ width: 80, height: 80, objectFit: 'contain' }} />
    </div>
  );
};

// ============================================================================
// OLD MONEY THEME MATRIX
// ============================================================================
const THEME_ACCENTS: Record<string, { primary: string; secondary: string; glow: string }> = {
  gold: { primary: '#D4AF37', secondary: '#F5D77F', glow: 'rgba(212,175,55,0.4)' },
  neon_green: { primary: '#10B981', secondary: '#34D399', glow: 'rgba(16,185,129,0.4)' },
  electric_blue: { primary: '#3B82F6', secondary: '#93C5FD', glow: 'rgba(59,130,246,0.4)' },
  crimson: { primary: '#E63946', secondary: '#F87171', glow: 'rgba(230,57,70,0.4)' },
  purple: { primary: '#A855F7', secondary: '#D8B4FE', glow: 'rgba(168,85,247,0.4)' },
  white: { primary: '#F8FAFC', secondary: '#E2E8F0', glow: 'rgba(248,250,252,0.35)' },
};

// ============================================================================
// 1. PROCEDURAL FILM GRAIN
// ============================================================================
const FilmGrainOverlay: React.FC<{ opacity?: number }> = ({ opacity = 0.085 }) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 95,
        opacity,
        mixBlendMode: 'overlay',
      }}
    >
      <svg width="100%" height="100%">
        <filter id="magnatesGrainFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#magnatesGrainFilter)" />
      </svg>
    </div>
  );
};

// ============================================================================
// 2. VOLUMETRIC INVESTIGATION SPOTLIGHT & DARK TABLE SURFACE
// ============================================================================
const InvestigationSpotlight: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {/* Overhead dramatic spotlight cone shining down onto the desk */}
      <div
        style={{
          position: 'absolute',
          top: '-25%',
          left: '15%',
          right: '15%',
          height: '110%',
          background: `radial-gradient(ellipse at 50% 30%, rgba(245, 215, 127, 0.16) 0%, rgba(212, 175, 55, 0.06) 45%, transparent 75%)`,
          filter: 'blur(40px)',
          mixBlendMode: 'screen',
        }}
      />
      {/* Harsh diagonal investigation desk lamp spill */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-20%',
          width: '140%',
          height: '140%',
          background: `linear-gradient(125deg, rgba(255,255,255,0.04) 0%, rgba(212,175,55,0.03) 40%, transparent 65%)`,
          filter: 'blur(30px)',
          mixBlendMode: 'overlay',
        }}
      />
      {/* Deep Noir Perimeter Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(2, 4, 8, 0.75) 70%, #000000 100%)',
        }}
      />
    </div>
  );
};

// ============================================================================
// 3. ANAMORPHIC GOLDEN FLARE (Transition Peak)
// ============================================================================
const AnamorphicFlareSweep: React.FC<{ progress: number; accentColor: string }> = ({
  progress,
  accentColor,
}) => {
  const opacity = interpolate(progress, [0.32, 0.48, 0.52, 0.72], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scaleX = interpolate(progress, [0.3, 0.5, 0.75], [0.4, 2.8, 3.8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sweepY = interpolate(progress, [0.3, 0.7], [46, 54], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (opacity <= 0.01) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: `${sweepY}%`,
        left: '-10%',
        right: '-10%',
        height: 8,
        pointerEvents: 'none',
        zIndex: 90,
        opacity,
        transform: `scaleX(${scaleX})`,
        mixBlendMode: 'screen',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: `linear-gradient(90deg, transparent 0%, ${accentColor}60 20%, #FFFFFF 50%, ${accentColor}60 80%, transparent 100%)`,
          boxShadow: `0 0 30px #FFFFFF, 0 0 80px ${accentColor}, 0 0 160px ${accentColor}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -35,
          left: '20%',
          right: '20%',
          height: 80,
          background: `radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.7) 0%, ${accentColor}40 45%, transparent 75%)`,
          filter: 'blur(10px)',
        }}
      />
    </div>
  );
};

// ============================================================================
// 4. FLOATING DUST PARTICLES
// ============================================================================
const FloatingAtmosphere: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const frame = useCurrentFrame();

  const particles = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => {
      const seed = i * 231.1 + 19;
      return {
        x: (seed * 9.1) % 100,
        startY: (seed * 13.7) % 100,
        size: 2.5 + ((seed * 1.5) % 4),
        speed: 0.15 + ((seed * 0.1) % 0.35),
        wobbleFreq: 0.01 + ((seed * 0.002) % 0.02),
        wobbleAmp: 10 + ((seed * 1.2) % 15),
      };
    });
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40, overflow: 'hidden' }}>
      {particles.map((p, i) => {
        const yOffset = (frame * p.speed * -1) % 100;
        const wobble = Math.sin(frame * p.wobbleFreq) * p.wobbleAmp;
        const currentY = (p.startY + yOffset + 100) % 100;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `calc(${p.x}% + ${wobble}px)`,
              top: `${currentY}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: accentColor,
              boxShadow: `0 0 8px ${accentColor}`,
              opacity: 0.45,
              mixBlendMode: 'screen',
            }}
          />
        );
      })}
    </div>
  );
};

// ============================================================================
// 5. FORENSIC EVIDENCE PHOTOGRAPH / DOSSIER SLATE (MACRO)
// ============================================================================
const EvidencePhotograph: React.FC<{
  src: string;
  tag: string;
  subtag?: string;
  width: number;
  height: number;
  accentColor: string;
  cornerCrosshairs?: boolean;
}> = ({ src, tag, subtag, width, height, accentColor, cornerCrosshairs = true }) => {
  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        backgroundColor: '#0c0f17',
        borderRadius: 4,
        padding: '16px 16px 40px 16px',
        boxSizing: 'border-box',
        boxShadow: `
          0 50px 100px rgba(0, 0, 0, 0.95),
          0 20px 40px rgba(0, 0, 0, 0.8),
          0 0 1px rgba(255, 255, 255, 0.2),
          0 0 30px ${accentColor}18
        `,
        border: `1px solid rgba(255, 255, 255, 0.12)`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Corner Crosshairs (+) */}
      {cornerCrosshairs && (
        <>
          <span style={{ position: 'absolute', top: 6, left: 8, color: `${accentColor}99`, fontSize: 10, fontFamily: 'monospace' }}>+</span>
          <span style={{ position: 'absolute', top: 6, right: 8, color: `${accentColor}99`, fontSize: 10, fontFamily: 'monospace' }}>+</span>
          <span style={{ position: 'absolute', bottom: 6, left: 8, color: `${accentColor}99`, fontSize: 10, fontFamily: 'monospace' }}>+</span>
          <span style={{ position: 'absolute', bottom: 6, right: 8, color: `${accentColor}99`, fontSize: 10, fontFamily: 'monospace' }}>+</span>
        </>
      )}

      {/* Top Header Bar with Evidence Tag */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
          borderBottom: `1px solid rgba(255, 255, 255, 0.08)`,
          paddingBottom: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: accentColor, boxShadow: `0 0 6px ${accentColor}` }} />
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              fontWeight: 700,
              color: accentColor,
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            {tag}
          </span>
        </div>
        {subtag && (
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 10,
              color: 'rgba(255, 255, 255, 0.5)',
              letterSpacing: '1px',
            }}
          >
            {subtag}
          </span>
        )}
      </div>

      {/* Main Photographic Area */}
      <div
        style={{
          flex: 1,
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#040608',
          border: '1px solid rgba(0, 0, 0, 0.8)',
        }}
      >
        <Img
          src={getAsset(src)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'contrast(1.15) brightness(0.95)',
          }}
        />

        {/* Specular Diagonal Sheen across photo */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 40%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        {/* Subtle grid watermark */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Bottom Bar — Barcode & Classification ID */}
      <div
        style={{
          marginTop: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 9,
            color: 'rgba(255, 255, 255, 0.4)',
            letterSpacing: '3px',
          }}
        >
          CONFIDENTIAL EVIDENCE // DEPT 09
        </span>
        {/* Procedural Barcode */}
        <div style={{ display: 'flex', gap: 2, height: 12, opacity: 0.6 }}>
          {[3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3].map((w, bi) => (
            <div key={bi} style={{ width: w, height: '100%', backgroundColor: accentColor }} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 6. PROCEDURAL CLASSIFIED EVIDENCE 1: REDACTED DOSSIER MEMORANDUM
// ============================================================================
export const RedactedMemoEvidence: React.FC<{
  accentColor: string;
  width: number;
  height: number;
}> = ({ accentColor, width, height }) => {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#0a0d14',
        borderRadius: 4,
        padding: '16px 20px',
        boxSizing: 'border-box',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: `0 40px 80px rgba(0,0,0,0.95), 0 0 25px ${accentColor}18`,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'monospace',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: 6,
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 10, color: accentColor, letterSpacing: '2px', fontWeight: 700 }}>
          DOSSIER MEMO // DEPT 04
        </span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>
          REF: #883-TX
        </span>
      </div>

      {/* Redacted Stamp */}
      <div
        style={{
          position: 'absolute',
          top: 36,
          right: 18,
          border: '2px solid rgba(230, 57, 70, 0.85)',
          color: 'rgba(230, 57, 70, 0.95)',
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: '3px',
          padding: '2px 8px',
          transform: 'rotate(-8deg)',
          borderRadius: 2,
          boxShadow: '0 0 10px rgba(230, 57, 70, 0.3)',
        }}
      >
        DECLASSIFIED
      </div>

      {/* Body text with realistic redaction bars */}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>SUBJECT:</span>
          <div style={{ width: 85, height: 11, backgroundColor: '#FFFFFF', opacity: 0.85 }} />
          <span>CONFIRMED</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span>ACCOUNT:</span>
          <span>CHASE-</span>
          <div style={{ width: 110, height: 11, backgroundColor: '#FFFFFF', opacity: 0.85 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span>OFFSHORE:</span>
          <div style={{ width: 130, height: 11, backgroundColor: '#FFFFFF', opacity: 0.85 }} />
          <span>$42.5M</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <div style={{ width: 75, height: 11, backgroundColor: '#FFFFFF', opacity: 0.85 }} />
          <span>AUTHORIZED LEVEL 5</span>
        </div>
      </div>

      {/* Footer fingerprint / barcode */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 8,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>
          ARCHIVE COPY // DO NOT DUPLICATE
        </span>
        <div style={{ display: 'flex', gap: 2, height: 10, opacity: 0.4 }}>
          {[2, 1, 3, 1, 2, 4, 1, 2].map((w, i) => (
            <div key={i} style={{ width: w, height: '100%', backgroundColor: accentColor }} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 7. PROCEDURAL CLASSIFIED EVIDENCE 2: FORENSIC FINANCIAL AUDIT GRAPH
// ============================================================================
export const FinancialAuditGraphEvidence: React.FC<{
  accentColor: string;
  width: number;
  height: number;
}> = ({ accentColor, width, height }) => {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#080b12',
        borderRadius: 4,
        padding: '16px 20px',
        boxSizing: 'border-box',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: `0 40px 80px rgba(0,0,0,0.95), 0 0 25px ${accentColor}18`,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'monospace',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: 6,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 10, color: accentColor, letterSpacing: '2px', fontWeight: 700 }}>
          FORENSIC AUDIT // CAPITAL FLOW
        </span>
        <span style={{ fontSize: 10, color: '#10B981', fontWeight: 800 }}>
          ▼ -84.2%
        </span>
      </div>

      {/* SVG Financial Crash / Spike Graph */}
      <div style={{ flex: 1, position: 'relative', width: '100%' }}>
        <svg width="100%" height="100%" viewBox="0 0 300 160" preserveAspectRatio="none">
          {/* Horizontal grid lines */}
          <line x1="0" y1="40" x2="300" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <line x1="0" y1="80" x2="300" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <line x1="0" y1="120" x2="300" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

          {/* Area Fill */}
          <defs>
            <linearGradient id="auditFillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <polygon
            points="0,60 50,50 110,85 160,35 220,120 280,145 300,150 300,160 0,160"
            fill="url(#auditFillGrad)"
          />

          {/* Graph Line */}
          <polyline
            points="0,60 50,50 110,85 160,35 220,120 280,145 300,150"
            fill="none"
            stroke={accentColor}
            strokeWidth="3"
            filter="drop-shadow(0 0 6px rgba(212,175,55,0.8))"
          />

          {/* Target crosshair at peak/drop point */}
          <circle cx="220" cy="120" r="4" fill="#FFFFFF" stroke={accentColor} strokeWidth="2" />
        </svg>

        {/* Data callout tag */}
        <div
          style={{
            position: 'absolute',
            top: 75,
            right: 20,
            backgroundColor: 'rgba(230, 57, 70, 0.2)',
            border: '1px solid rgba(230, 57, 70, 0.6)',
            padding: '3px 8px',
            borderRadius: 2,
            fontSize: 9,
            color: '#F87171',
            fontWeight: 700,
          }}
        >
          CRITICAL DEFICIT
        </div>
      </div>

      {/* Footer Metrics */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
        <span>Q1 ASSETS: $420M</span>
        <span>NET LOSS: -$1.8B</span>
      </div>
    </div>
  );
};

// ============================================================================
// 8. PROCEDURAL CLASSIFIED EVIDENCE 3: BIOMETRIC RECON WIREFRAME
// ============================================================================
export const BiometricWireframeEvidence: React.FC<{
  accentColor: string;
  width: number;
  height: number;
}> = ({ accentColor, width, height }) => {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#070a10',
        borderRadius: 4,
        padding: '16px 20px',
        boxSizing: 'border-box',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: `0 40px 80px rgba(0,0,0,0.95), 0 0 25px ${accentColor}18`,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'monospace',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: 6,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 10, color: accentColor, letterSpacing: '2px', fontWeight: 700 }}>
          BIOMETRIC RECON // SCAN 09
        </span>
        <span style={{ fontSize: 10, color: '#38BDF8', fontWeight: 700 }}>
          MATCH 99.8%
        </span>
      </div>

      {/* SVG Fingerprint / Wireframe Mesh */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="200" height="120" viewBox="0 0 200 120" fill="none">
          {/* Concentric biometric scan arcs */}
          <path d="M 35,60 A 65,40 0 0,1 165,60" stroke={`${accentColor}40`} strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 50,60 A 50,30 0 0,1 150,60" stroke={`${accentColor}70`} strokeWidth="1.5" />
          <path d="M 65,60 A 35,20 0 0,1 135,60" stroke={accentColor} strokeWidth="2" />
          <path d="M 80,60 A 20,10 0 0,1 120,60" stroke="#FFFFFF" strokeWidth="2" />
          {/* Reticle */}
          <circle cx="100" cy="60" r="4" fill={accentColor} />
          <line x1="100" y1="15" x2="100" y2="105" stroke="rgba(255,255,255,0.15)" />
          <line x1="20" y1="60" x2="180" y2="60" stroke="rgba(255,255,255,0.15)" />
          {/* Corner brackets */}
          <path d="M 15,25 L 15,15 L 25,15" stroke={accentColor} strokeWidth="2" />
          <path d="M 185,25 L 185,15 L 175,15" stroke={accentColor} strokeWidth="2" />
          <path d="M 15,95 L 15,105 L 25,105" stroke={accentColor} strokeWidth="2" />
          <path d="M 185,95 L 185,105 L 175,105" stroke={accentColor} strokeWidth="2" />
        </svg>

        {/* Laser Scanning Line */}
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: '10%',
            right: '10%',
            height: 2,
            backgroundColor: '#38BDF8',
            boxShadow: '0 0 10px #38BDF8, 0 0 20px #38BDF8',
            opacity: 0.85,
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
        <span>IDENTITY: CONFIRMED</span>
        <span>GEO: 34.0522° N, 118.2437° W</span>
      </div>
    </div>
  );
};
export const MagnatesStage_TwoPart: React.FC<{
  payload: any;
  durationInFrames: number;
}> = ({ payload, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const msTof = (ms: number) => msToFrames(ms, fps);

  const p1 = payload.part_1 || {};
  const p2 = payload.part_2 || {};
  const tr = payload.transition || {};

  const bgPath1 = p1.background?.local_path || null;
  const bgPath2 = p2.background?.local_path || bgPath1;
  const rain = p1.raining_particles || {};

  const rawGridColor = p2.background?.grid_color || 'gold';
  const theme = THEME_ACCENTS[rawGridColor] || THEME_ACCENTS.gold;
  const accentColor = (typeof rawGridColor === 'string' && (rawGridColor.startsWith('#') || rawGridColor.startsWith('rgb')))
    ? rawGridColor
    : theme.primary;

  const hero = p1.hero || {};
  const orbitsRaw = Array.isArray(p1.orbit_helpers)
    ? p1.orbit_helpers
    : p1.orbit_helpers
    ? [p1.orbit_helpers]
    : [];
  const orbitsCount =
    p1.orbit_helpers && !Array.isArray(p1.orbit_helpers)
      ? p1.orbit_helpers.count || 3
      : orbitsRaw.length;
  const orbits =
    orbitsRaw.length === 1 && orbitsCount > 1
      ? Array.from({ length: orbitsCount }).map((_, i) => ({
          ...orbitsRaw[0],
          trigger_start_ms: (orbitsRaw[0].trigger_start_ms || 0) + i * 200,
        }))
      : orbitsRaw;

  const subject = p2.subject || {};
  const typography = p2.typography || {};

  // Timing keyframes (matching original orchestrator payload defaults)
  const heroFrame = msTof(hero.trigger_start_ms !== undefined ? hero.trigger_start_ms : 1000);
  const whipFrame = msTof(tr.trigger_start_ms !== undefined ? tr.trigger_start_ms : 4000);
  const subjectFrame = msTof(subject.trigger_start_ms !== undefined ? subject.trigger_start_ms : 4200);
  const typoFrame = msTof(typography.trigger_start_ms !== undefined ? typography.trigger_start_ms : 4500);

  // ═══════════════════════════════════════════════════════════════════════════
  // CINEMATIC TRANSITION PHYSICS (THE WHIP & DIVE)
  // ═══════════════════════════════════════════════════════════════════════════
  const whipRel = Math.max(0, frame - whipFrame);
  const whipProgress = spring({
    frame: whipRel,
    fps,
    config: { damping: 200, stiffness: 45 },
  });

  const isWhipRight = tr.direction !== 'left';

  // Lateral swipe distance
  const whipPanX1 = interpolate(whipProgress, [0, 1], [0, isWhipRight ? -1600 : 1600]);
  const whipPanX2 = interpolate(whipProgress, [0, 1], [isWhipRight ? 1600 : -1600, 0]);

  // Dynamic 3D Camera tilt and zoom
  const camWhipZ = interpolate(whipProgress, [0, 0.48, 1], [0, -600, 0]);
  const camBankY = interpolate(whipProgress, [0, 0.5, 1], [0, isWhipRight ? -18 : 18, 0]);

  // Motion Blur & Opacity Crossfade
  const whipBlur = interpolate(whipProgress, [0, 0.45, 0.55, 1], [0, 42, 42, 0]);
  const opacityP1 = interpolate(whipProgress, [0, 0.48, 0.65], [1, 0.6, 0], { extrapolateRight: 'clamp' });
  const opacityP2 = interpolate(whipProgress, [0.38, 0.52, 1], [0, 0.6, 1], { extrapolateLeft: 'clamp' });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 1: MACRO DOCUMENT SCAN MOTION
  // ═══════════════════════════════════════════════════════════════════════════
  const heroRel = Math.max(0, frame - heroFrame);
  const heroSpring = spring({ frame: heroRel, fps, config: { damping: 180, stiffness: 35 } });
  const heroScale = interpolate(heroSpring, [0, 1], [0.85, 1.0]);
  const heroOpacity = interpolate(heroSpring, [0, 0.7], [0, 1], { extrapolateRight: 'clamp' });
  const heroBlur = interpolate(heroSpring, [0, 0.7, 1], [30, 6, 0]);

  // Continuous Majestic Macro Push-In
  const macroPushZ = interpolate(frame, [0, whipFrame], [0, 180], {
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    extrapolateRight: 'clamp',
  });
  const macroScanX = interpolate(frame, [0, whipFrame], [0, -40], { extrapolateRight: 'clamp' });
  const macroScanY = interpolate(frame, [0, whipFrame], [0, 25], { extrapolateRight: 'clamp' });

  // ═══════════════════════════════════════════════════════════════════════════
  // PART 2: THE SUBJECT & MASTER DOSSIER TYPOGRAPHY
  // ═══════════════════════════════════════════════════════════════════════════
  const subjRel = Math.max(0, frame - subjectFrame);
  const subjSpring = spring({ frame: subjRel, fps, config: { damping: 180, stiffness: 35 } });
  const subjScale = interpolate(subjSpring, [0, 1], [0.9, 1.0]);
  const subjOpacity = interpolate(subjSpring, [0, 0.7], [0, 1], { extrapolateRight: 'clamp' });
  const subjBlur = interpolate(subjSpring, [0, 0.7, 1], [25, 5, 0]);

  const subjIsLeft = (subject.position || 'left').toLowerCase() === 'left';

  const typoText = typography.text || '';
  const typoRel = Math.max(0, frame - typoFrame);
  const typoSpring = spring({ frame: typoRel, fps, config: { damping: 160, stiffness: 38 } });
  const typoOpacity = interpolate(typoSpring, [0, 0.7], [0, 1], { extrapolateRight: 'clamp' });
  const typoBlur = interpolate(typoSpring, [0, 0.7, 1], [28, 6, 0]);
  const typoTracking = interpolate(typoRel, [0, 140], [4, 18], { extrapolateRight: 'clamp' });
  const ruleWidth = interpolate(typoSpring, [0, 1], [0, 100]);

  // Adaptive font sizing for 2K resolution
  const dynamicFontSize = useMemo(() => {
    const len = typoText.length;
    if (len <= 8) return 130;
    if (len <= 15) return 108;
    if (len <= 24) return 86;
    return 70;
  }, [typoText]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#030508', overflow: 'hidden' }}>
      {/* ── AUDIO SFX LAYERS ────────────────────────────────────────────── */}
      <EnvelopedSFX src={p1.background?.local_sfx_path} startFrame={0} peakVolume={0.35} />
      <EnvelopedSFX src={hero.local_sfx_path} startFrame={heroFrame} peakVolume={0.8} />
      <EnvelopedSFX src={tr.local_sfx_path} startFrame={whipFrame} peakVolume={1.0} />
      <EnvelopedSFX src={subject.local_sfx_path} startFrame={subjectFrame} peakVolume={0.8} />
      <EnvelopedSFX
        src={typography.local_sfx_path}
        startFrame={typoFrame}
        peakVolume={0.7}
        sustainFrames={Math.max(40, typoText.length * 3)}
      />

      {/* ── GLOBAL REALISM & ATMOSPHERE ─────────────────────────────────── */}
      <FilmGrainOverlay opacity={0.08} />
      <InvestigationSpotlight accentColor={accentColor} />
      <FloatingAtmosphere accentColor={accentColor} />
      <AnamorphicFlareSweep progress={whipProgress} accentColor={accentColor} />

      {/* ════════════════════════════════════════════════════════════════════
          PART 1: THE MACRO INVESTIGATION EVIDENCE DESK
          ════════════════════════════════════════════════════════════════════ */}
      {frame < whipFrame + 50 && (
        <AbsoluteFill
          style={{
            transformStyle: 'preserve-3d',
            perspective: '1200px',
            opacity: opacityP1,
            filter: `blur(${whipBlur}px)`,
            transform: `
              translate3d(${whipPanX1 + macroScanX}px, ${macroScanY}px, ${camWhipZ + macroPushZ}px)
              rotateY(${camBankY}deg)
            `,
          }}
        >
          {/* Subtle Desk Texture Background */}
          <div
            style={{
              position: 'absolute',
              inset: '-20%',
              transform: 'translateZ(-400px)',
              background: `
                radial-gradient(ellipse at 50% 45%, #0e131d 0%, #04060a 65%, #010204 100%)
              `,
            }}
          >
            {/* Fine Grid Coordinate Lines on Desk */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `
                  linear-gradient(to right, rgba(212, 175, 55, 0.05) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(212, 175, 55, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: '120px 120px',
                maskImage: 'radial-gradient(circle at center, rgba(0,0,0,0.8) 0%, transparent 80%)',
                WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,0.8) 0%, transparent 80%)',
              }}
            />
          </div>

          {/* Deep Background Video or Image if provided */}
          {bgPath1 && (
            <div
              style={{
                position: 'absolute',
                inset: '-20%',
                transform: 'translateZ(-550px)',
                opacity: 0.35,
                pointerEvents: 'none',
              }}
            >
              {isVideo(bgPath1) ? (
                <OffthreadVideo
                  src={getAsset(bgPath1)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(12px)' }}
                  loop
                  muted
                />
              ) : (
                <Img
                  src={getAsset(bgPath1)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(12px)' }}
                />
              )}
            </div>
          )}

          {/* Raining Particles if provided */}
          {rain.local_path &&
            Array.from({ length: 45 }).map((_, i) => (
              <RainParticle
                key={i}
                src={rain.local_path}
                seed={i * 42 + 7}
                durationFrames={durationInFrames}
                fps={fps}
              />
            ))}

          {/* ── ORBIT HELPERS: SUPPORTING FORENSIC EVIDENCE CARDS ─────────── */}
          {[
            { x: -750, y: -180, z: -100, rotZ: -8, rotX: 8, blur: 2, w: 420, h: 320, tag: 'EXHIBIT 02', sub: 'FORENSIC ATTACHMENT' },
            { x: 720, y: 220, z: 240, rotZ: 6, rotX: -6, blur: 8, w: 460, h: 350, tag: 'EXHIBIT 03', sub: 'DECLASSIFIED MEMO' },
            { x: 740, y: -240, z: -180, rotZ: 12, rotX: 10, blur: 4, w: 400, h: 300, tag: 'EXHIBIT 04', sub: 'FINANCIAL AUDIT' },
          ].map((p, idx) => {
            const orb = orbits[idx] || orbits[0] || {};
            const orbStart = msTof(orb.trigger_start_ms || 700 + idx * 220);
            if (frame < orbStart) return null;

            const orbRel = frame - orbStart;
            const orbSpring = spring({ frame: orbRel, fps, config: { damping: 160, stiffness: 32 } });
            const orbScale = interpolate(orbSpring, [0, 1], [0.5, 1]);
            const orbOpac = interpolate(orbSpring, [0, 0.7], [0, 0.95], { extrapolateRight: 'clamp' });

            const floatY = Math.sin((frame + idx * 50) * 0.02) * 8;
            const floatRot = Math.cos((frame + idx * 40) * 0.015) * 2;

            // Intelligently detect if there is a unique downloaded image or if we should use procedural evidence
            const hasUniqueImage = orb.local_path && (idx === 0 || (orbits.length > 1 && orb.local_path !== orbits[0]?.local_path));

            return (
              <React.Fragment key={`orb-${idx}`}>
                <EnvelopedSFX src={orb.local_sfx_path} startFrame={orbStart} peakVolume={0.4} />
                <div
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${p.x}px)`,
                    top: `calc(50% + ${p.y}px)`,
                    transform: `
                      translate(-50%, -50%)
                      translate3d(0, ${floatY}px, ${p.z}px)
                      scale(${orbScale})
                      rotateX(${p.rotX}deg)
                      rotateZ(${p.rotZ + floatRot}deg)
                    `,
                    opacity: orbOpac,
                    filter: `blur(${p.blur}px)`,
                    zIndex: p.z > 0 ? 35 : 15,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {hasUniqueImage ? (
                    <EvidencePhotograph
                      src={orb.local_path}
                      tag={p.tag}
                      subtag={p.sub}
                      width={p.w}
                      height={p.h}
                      accentColor={accentColor}
                      cornerCrosshairs={false}
                    />
                  ) : idx === 1 ? (
                    <RedactedMemoEvidence
                      accentColor={accentColor}
                      width={p.w}
                      height={p.h}
                    />
                  ) : (
                    <FinancialAuditGraphEvidence
                      accentColor={accentColor}
                      width={p.w}
                      height={p.h}
                    />
                  )}
                </div>
              </React.Fragment>
            );
          })}

          {/* ── THE PRIMARY EVIDENCE DOSSIER PHOTOGRAPH (ZOOMED-IN HERO) ──── */}
          {hero.local_path && frame >= heroFrame && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `
                  translate(-50%, -50%)
                  scale(${heroScale})
                  rotateX(12deg)
                  rotateY(-6deg)
                  rotateZ(-1.5deg)
                  translateZ(40px)
                `,
                opacity: heroOpacity,
                filter: `blur(${heroBlur}px)`,
                zIndex: 25,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Primary Evidence Photograph Card (Large Macro Dimension) */}
              <EvidencePhotograph
                src={hero.local_path}
                tag="EXHIBIT 01 // PRIMARY EVIDENCE"
                subtag="CONFIDENTIAL CASE FILE"
                width={1120}
                height={780}
                accentColor={accentColor}
                cornerCrosshairs={true}
              />

              {/* Red/Gold Investigation Stamp Over Corner */}
              <div
                style={{
                  position: 'absolute',
                  top: -24,
                  right: -24,
                  padding: '8px 18px',
                  border: `2px solid ${accentColor}`,
                  borderRadius: 4,
                  backgroundColor: 'rgba(5, 7, 12, 0.95)',
                  transform: 'rotate(8deg)',
                  boxShadow: `0 10px 25px rgba(0,0,0,0.8), 0 0 15px ${accentColor}33`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 13,
                    fontWeight: 800,
                    color: accentColor,
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                  }}
                >
                  CLASSIFIED // VERIFIED
                </span>
              </div>
            </div>
          )}
        </AbsoluteFill>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          PART 2: THE TARGET SUBJECT & MASTER DOSSIER STATEMENT
          ════════════════════════════════════════════════════════════════════ */}
      {frame >= whipFrame - 8 && (
        <AbsoluteFill
          style={{
            transformStyle: 'preserve-3d',
            perspective: '1400px',
            opacity: opacityP2,
            filter: `blur(${whipBlur}px)`,
            transform: `
              translate3d(${whipPanX2}px, 0px, ${camWhipZ}px)
              rotateY(${-camBankY}deg)
            `,
          }}
        >
          {/* Deep Ambient Background */}
          {bgPath2 && (
            <div
              style={{
                position: 'absolute',
                inset: '-15%',
                transform: 'translateZ(-550px) scale(1.3)',
                opacity: 0.35,
                pointerEvents: 'none',
              }}
            >
              {isVideo(bgPath2) ? (
                <OffthreadVideo
                  src={getAsset(bgPath2)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px)' }}
                  loop
                  muted
                />
              ) : (
                <Img
                  src={getAsset(bgPath2)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px)' }}
                />
              )}
            </div>
          )}

          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: 'translateZ(-500px) scale(1.35)',
              background: 'radial-gradient(ellipse at 50% 40%, #0d121c 0%, #030509 75%, #000000 100%)',
            }}
          />

          {/* Golden Volumetric Rim Light behind Subject */}
          <div
            style={{
              position: 'absolute',
              left: subjIsLeft ? '28%' : '72%',
              top: '18%',
              width: 600,
              height: 800,
              transform: 'translate(-50%, 0) translateZ(-150px)',
              background: `radial-gradient(ellipse at 50% 40%, ${accentColor}30 0%, ${accentColor}06 50%, transparent 80%)`,
              filter: 'blur(50px)',
              pointerEvents: 'none',
            }}
          />

          {/* ── THE ZOOMED-IN TARGET SUBJECT PHOTOGRAPH / CUTOUT ───────────── */}
          {subject.local_path && frame >= subjectFrame && (
            <div
              style={{
                position: 'absolute',
                left: subjIsLeft ? '26%' : '74%',
                top: '50%',
                transform: `
                  translate(-50%, -50%)
                  scale(${subjScale})
                  rotateX(8deg)
                  rotateY(${subjIsLeft ? 10 : -10}deg)
                  translateZ(60px)
                `,
                opacity: subjOpacity,
                filter: `
                  blur(${subjBlur}px)
                  drop-shadow(0 50px 80px rgba(0,0,0,0.98))
                  drop-shadow(0 0 50px ${accentColor}25)
                `,
                zIndex: 25,
                transformStyle: 'preserve-3d',
              }}
            >
              <EvidencePhotograph
                src={subject.local_path}
                tag="IDENTIFIED TARGET // DOSSIER"
                subtag="CLEARANCE: OMEGA"
                width={860}
                height={640}
                accentColor={accentColor}
                cornerCrosshairs={true}
              />
            </div>
          )}

          {/* ── THE MAJESTIC DOSSIER TYPOGRAPHY ────────────────────────────── */}
          {frame >= typoFrame && (
            <div
              style={{
                position: 'absolute',
                left: subjIsLeft ? '53%' : '6%',
                top: '50%',
                width: '42%',
                transform: 'translate(0, -50%) translateZ(120px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: subjIsLeft ? 'flex-start' : 'flex-end',
                textAlign: subjIsLeft ? 'left' : 'right',
                zIndex: 35,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* 1. Dossier Classification Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 20px',
                  background: 'rgba(8, 11, 18, 0.88)',
                  border: `1px solid ${accentColor}55`,
                  borderRadius: 4,
                  backdropFilter: 'blur(16px)',
                  boxShadow: `0 12px 30px rgba(0,0,0,0.8), 0 0 20px ${accentColor}18`,
                  marginBottom: 20,
                  opacity: typoOpacity,
                  filter: `blur(${typoBlur}px)`,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: accentColor,
                    boxShadow: `0 0 8px ${accentColor}`,
                  }}
                />
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 13,
                    fontWeight: 700,
                    color: accentColor,
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                  }}
                >
                  CLASSIFIED DOSSIER // FILE #9042
                </span>
              </div>

              {/* 2. Gold Hairline Divider */}
              <div
                style={{
                  width: `${ruleWidth}%`,
                  height: 2,
                  background: `linear-gradient(${subjIsLeft ? '90deg' : '270deg'}, ${accentColor}, transparent)`,
                  marginBottom: 24,
                  opacity: typoOpacity,
                }}
              />

              {/* 3. The Majestic Metallic Headline */}
              <h1
                style={{
                  fontFamily: '"Playfair Display", "Cinzel", "Garamond", Georgia, serif',
                  fontSize: dynamicFontSize,
                  fontWeight: 900,
                  lineHeight: 1.05,
                  margin: 0,
                  letterSpacing: `${typoTracking}px`,
                  textTransform: 'uppercase',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  opacity: typoOpacity,
                  filter: `blur(${typoBlur}px)`,
                  background: `linear-gradient(135deg, #FFFFFF 0%, ${theme.secondary} 40%, ${accentColor} 75%, #6A4D12 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 25px 60px rgba(0, 0, 0, 0.99)',
                }}
              >
                {typoText}
              </h1>

              {/* 4. Forensic Metric Callout Panel */}
              <div
                style={{
                  marginTop: 28,
                  padding: '14px 22px',
                  background: 'rgba(10, 14, 22, 0.7)',
                  border: `1px solid rgba(255, 255, 255, 0.1)`,
                  borderLeft: subjIsLeft ? `3px solid ${accentColor}` : `1px solid rgba(255,255,255,0.1)`,
                  borderRight: !subjIsLeft ? `3px solid ${accentColor}` : `1px solid rgba(255,255,255,0.1)`,
                  borderRadius: 4,
                  backdropFilter: 'blur(16px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  opacity: interpolate(typoSpring, [0.4, 1], [0, 1]),
                  filter: `blur(${typoBlur}px)`,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '2px' }}>
                    STATUS
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: accentColor, letterSpacing: '2px' }}>
                    CONFIRMED MATCH
                  </span>
                </div>
                <div style={{ width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '2px' }}>
                    FORENSIC HASH
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#FFFFFF', letterSpacing: '2px', fontVariantNumeric: 'tabular-nums' }}>
                    0x84B9...92A1
                  </span>
                </div>
              </div>
            </div>
          )}
        </AbsoluteFill>
      )}

      {/* ── MASTER CINEMATIC VIGNETTE ──────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(1,2,4,0.7) 75%, #000000 100%)',
          zIndex: 85,
        }}
      />
    </AbsoluteFill>
  );
};
