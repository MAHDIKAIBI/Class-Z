import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  staticFile as remotionStaticFile,
} from 'remotion';

const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const staticFile = (path: string) => {
  if (!path || typeof path !== 'string') return TRANSPARENT_PIXEL;
  const cleanPath = path.replace(/^\/?public\//, '');
  if (cleanPath.trim() === '' || cleanPath.endsWith('/')) return TRANSPARENT_PIXEL;
  return remotionStaticFile(cleanPath);
};

export interface ShortsGlassOutroProps {
  thumbnailSrc?: string;
  headline?: string;
  subtext?: string;
}

export const ShortsGlassOutro: React.FC<ShortsGlassOutroProps> = ({
  thumbnailSrc = 'test_thumb.png',
  headline = 'WATCH FULL VIDEO',
  subtext = '(First link in description 👇)',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const resolvedThumb = thumbnailSrc.startsWith('http') || thumbnailSrc.startsWith('data:')
    ? thumbnailSrc
    : staticFile(thumbnailSrc);

  // 1. Entrance Springs & Easing
  const entranceSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 75, mass: 0.85 },
  });

  const cardScale = interpolate(entranceSpring, [0, 1], [0.82, 1.0]);
  const cardTranslateY = interpolate(entranceSpring, [0, 1], [90, 0]);
  const cardOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });

  // 2. 3D Floating Physics Loop
  const floatRotateX = Math.sin(frame * 0.065) * 4.5;
  const floatRotateY = Math.cos(frame * 0.05) * 6.5;
  const floatTranslateY = Math.sin(frame * 0.08) * 10;

  // 3. Glass Sheen / Light Glare Pass across the card
  // Sweeps from left to right between frames 8 and 55
  const sheenProgress = interpolate(frame, [8, 55], [-120, 220], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0.0, 0.2, 1),
  });

  // 4. Headline and Subtext Reveals
  const headlineOpacity = interpolate(frame, [14, 28], [0, 1], { extrapolateRight: 'clamp' });
  const headlineBlur = interpolate(frame, [14, 28], [16, 0], { extrapolateRight: 'clamp' });
  const headlineY = interpolate(frame, [14, 28], [25, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const subtextOpacity = interpolate(frame, [22, 36], [0, 1], { extrapolateRight: 'clamp' });
  const subtextScale = 1 + Math.sin(frame * 0.16) * 0.03;

  // 5. High-End Animated Arrow Physics (Points to YouTube's Related Video pill)
  const arrowOpacity = interpolate(frame, [20, 32], [0, 1], { extrapolateRight: 'clamp' });
  const arrowBounceY = Math.sin(frame * 0.24) * 14;
  const arrowGlowPulse = 0.6 + Math.sin(frame * 0.2) * 0.4;

  // 6. Background Slow Push-In
  const bgScale = interpolate(frame, [0, 90], [1.15, 1.25], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        width,
        height,
        backgroundColor: '#030508',
        overflow: 'hidden',
        fontFamily: '"Inter", "Montserrat", system-ui, sans-serif',
      }}
    >
      {/* BACKGROUND: Heavily Blurred Cinematic Scene */}
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <Img
          src={resolvedThumb}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(45px) brightness(0.22) saturate(1.5)',
            transform: `scale(${bgScale})`,
          }}
        />
        {/* Radial Dark Gold Spotlight */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 50% 36%, rgba(226, 183, 20, 0.22) 0%, rgba(5, 7, 10, 0.75) 55%, #020406 100%)',
          }}
        />
        {/* Top & Bottom Vignettes */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 22%, transparent 75%, rgba(0,0,0,0.95) 100%)',
          }}
        />
      </AbsoluteFill>

      {/* TOP HEADER ACCENT: Channel Branding / Teaser Tag */}
      <div
        style={{
          position: 'absolute',
          top: '160px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: headlineOpacity,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 215, 0, 0.12)',
            border: '1px solid rgba(255, 215, 0, 0.35)',
            padding: '8px 24px',
            borderRadius: '999px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 25px rgba(255, 215, 0, 0.2)',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#FFD700',
              boxShadow: '0 0 10px #FFD700',
            }}
          />
          <span
            style={{
              color: '#FFD700',
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            Full Story Available
          </span>
        </div>
      </div>

      {/* CENTER: 3D FLOATING GLASS THUMBNAIL CARD */}
      <div
        style={{
          position: 'absolute',
          top: '300px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          perspective: '1200px',
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          style={{
            width: '880px',
            height: '495px',
            borderRadius: '32px',
            position: 'relative',
            opacity: cardOpacity,
            transform: `translateY(${cardTranslateY + floatTranslateY}px) scale(${cardScale}) rotateX(${floatRotateX}deg) rotateY(${floatRotateY}deg)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.05s linear',
            boxShadow:
              '0 45px 95px -15px rgba(0, 0, 0, 0.95), 0 0 60px rgba(226, 183, 20, 0.25), inset 0 0 25px rgba(255, 255, 255, 0.15)',
          }}
        >
          {/* Outer Glass Rim Border */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '32px',
              border: '2px solid rgba(255, 255, 255, 0.45)',
              zIndex: 3,
              pointerEvents: 'none',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.6)',
            }}
          />

          {/* Thumbnail Image Container */}
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '30px',
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: '#0a0d12',
            }}
          >
            <Img
              src={resolvedThumb}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />

            {/* Subtle Vignette on Thumbnail edges */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 50% 50%, transparent 60%, rgba(0,0,0,0.5) 100%)',
              }}
            />

            {/* Top-Right Badge: HD 2K */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(0, 0, 0, 0.75)',
                border: '1px solid rgba(255, 215, 0, 0.6)',
                backdropFilter: 'blur(10px)',
                padding: '6px 18px',
                borderRadius: '12px',
                color: '#FFD700',
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '0.1em',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            >
              HD 2K
            </div>

            {/* 3D GLASS SHEEN / LIGHT REFLECTION PASS */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: '200%',
                height: '100%',
                background:
                  'linear-gradient(115deg, transparent 32%, rgba(255,255,255,0.06) 42%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.06) 58%, transparent 68%)',
                transform: `translateX(${sheenProgress}%)`,
                pointerEvents: 'none',
                mixBlendMode: 'screen',
              }}
            />
          </div>
        </div>
      </div>

      {/* UNDERNEATH: URGENT HEADLINE & SUBTEXT */}
      <div
        style={{
          position: 'absolute',
          top: '880px',
          left: '60px',
          right: '60px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '20px',
          transform: `translateY(${headlineY}px)`,
          opacity: headlineOpacity,
          filter: `blur(${headlineBlur}px)`,
        }}
      >
        {/* Main Headline */}
        <h1
          style={{
            margin: 0,
            fontSize: '52px',
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            background: 'linear-gradient(180deg, #FFFFFF 30%, #E2B714 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 4px 24px rgba(226, 183, 20, 0.45))',
          }}
        >
          {headline}
        </h1>

        {/* Subtext Prompt Pill: "(First link in description 👇)" */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.07)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            padding: '16px 36px',
            borderRadius: '999px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 0 15px rgba(255,255,255,0.1)',
            opacity: subtextOpacity,
            transform: `scale(${subtextScale})`,
          }}
        >
          <span
            style={{
              color: '#FFFFFF',
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '0.03em',
            }}
          >
            {subtext}
          </span>
        </div>
      </div>

      {/* LOWER-LEFT: HIGH-END GLOWING ANIMATED ARROW */}
      {/* Calibrated to point down-left to YouTube Shorts' official "Related video" pill */}
      <div
        style={{
          position: 'absolute',
          left: '120px',
          top: '1280px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '16px',
          opacity: arrowOpacity,
          transform: `translateY(${arrowBounceY}px)`,
        }}
      >
        {/* Animated Badge Helper */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 215, 0, 0.15)',
            border: '1.5px solid #FFD700',
            padding: '10px 22px',
            borderRadius: '999px',
            boxShadow: `0 0 25px rgba(255, 215, 0, ${arrowGlowPulse})`,
            backdropFilter: 'blur(12px)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span
            style={{
              color: '#FFD700',
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Related Video
          </span>
        </div>

        {/* High-End Curved Neon Arrow Pointing Down to Link */}
        <svg
          width="130"
          height="140"
          viewBox="0 0 130 140"
          fill="none"
          style={{
            marginLeft: '30px',
            filter: `drop-shadow(0 0 12px #FFD700) drop-shadow(0 0 30px rgba(255, 215, 0, ${arrowGlowPulse}))`,
          }}
        >
          {/* Curved Path */}
          <path
            d="M 50 10 C 65 50, 50 90, 20 120"
            stroke="#FFD700"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="4 2"
          />
          {/* Arrow Head */}
          <path
            d="M 10 95 L 18 123 L 46 115"
            stroke="#FFD700"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Subtle Scanline / Film Texture Finisher */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 2px, transparent 2px, transparent 4px)',
          pointerEvents: 'none',
          mixBlendMode: 'overlay',
          opacity: 0.6,
        }}
      />
    </AbsoluteFill>
  );
};
