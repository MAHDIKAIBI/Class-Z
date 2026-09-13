import React from "react";
import { 
  AbsoluteFill, 
  useCurrentFrame, 
  useVideoConfig,
  OffthreadVideo, 
  Loop
} from "remotion";

export type CameraWallTransitionProps = {
  SceneA: React.ReactNode;
  SceneB: React.ReactNode;
  durationInFrames?: number;
  galleryVideos?: string[];
};

// Continuous Quintic Smoothest-Step Easing (Zero jerk at both endpoints)
const quintic = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const quinticVel = (t: number) => 30 * t * t * (t - 1) * (t - 1);

const studioCardMeta = [
  { label: "ARCHIVE // CLIP 01", title: "Boardroom Strategy Briefing", sub: "00:04.12 • 4K ProRes", bg: "linear-gradient(135deg, #0f172a, #1e293b)" },
  { label: "ARCHIVE // CLIP 02", title: "Financial District Exterior", sub: "00:08.50 • Aerial Drone", bg: "linear-gradient(135deg, #1e1b4b, #312e81)" },
  { label: "FUTURE // CLIP 03", title: "Senior Partner Deposition", sub: "00:15.80 • Studio B", bg: "linear-gradient(135deg, #172554, #1d4ed8)" },
  { label: "FUTURE // CLIP 04", title: "Corporate Corridor", sub: "00:21.04 • Steadicam", bg: "linear-gradient(135deg, #042f2e, #0f766e)" },
  { label: "ARCHIVE // CLIP 05", title: "Internal Audit Deposition", sub: "00:27.19 • Exhibit A", bg: "linear-gradient(135deg, #3f3f46, #18181b)" },
  { label: "FUTURE // CLIP 06", title: "Investigative Newsroom", sub: "00:34.40 • Multi-Monitor", bg: "linear-gradient(135deg, #134e4a, #042f2e)" },
  { label: "ARCHIVE // CLIP 07", title: "Whistleblower Close-Up", sub: "00:41.15 • Macro 85mm", bg: "linear-gradient(135deg, #4c1d95, #2e1065)" },
  { label: "FUTURE // CLIP 08", title: "Executive Profile Shot", sub: "00:48.00 • Slow-Mo 60fps", bg: "linear-gradient(135deg, #831843, #500724)" },
  { label: "FUTURE // CLIP 09", title: "Forensic Evidence Chart", sub: "00:54.20 • Wireframe", bg: "linear-gradient(135deg, #1e3a8a, #172554)" },
  { label: "FUTURE // CLIP 10", title: "Production Review Panel", sub: "01:02.10 • Control Room", bg: "linear-gradient(135deg, #0f172a, #020617)" },
];

// Procedural fallback card when not enough past or future footage exists yet
const FallbackStudioCard: React.FC<{ index: number; label?: string; width: number }> = ({ index, label, width }) => {
  const meta = studioCardMeta[index % studioCardMeta.length];
  const badgeFont = Math.max(12, Math.round(width * 0.0075));
  const titleFont = Math.max(18, Math.round(width * 0.013));
  const subFont = Math.max(11, Math.round(width * 0.0075));
  const cardPad = Math.max(16, Math.round(width * 0.016));

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: meta.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: `${cardPad}px`,
        boxSizing: "border-box",
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <span
        style={{
          fontSize: `${badgeFont}px`,
          background: "rgba(255,255,255,0.14)",
          color: "#f1f5f9",
          padding: "6px 12px",
          borderRadius: "6px",
          width: "fit-content",
          fontFamily: "monospace",
          fontWeight: 700,
          letterSpacing: "0.5px",
        }}
      >
        {label || meta.label}
      </span>
      <div>
        <div style={{ color: "#ffffff", fontWeight: 800, fontSize: `${titleFont}px`, letterSpacing: "-0.5px" }}>
          {meta.title}
        </div>
        <div style={{ color: "#94a3b8", fontSize: `${subFont}px`, fontFamily: "monospace", marginTop: "6px" }}>
          {meta.sub}
        </div>
      </div>
    </div>
  );
};

// Video Card Item with Loop Enabled
const StudioVideoItem: React.FC<{ 
  src?: string; 
  index: number; 
  label?: string; 
  durationInFrames: number;
  width: number;
}> = ({ 
  src, 
  index, 
  label, 
  durationInFrames,
  width
}) => {
  if (!src) {
    return <FallbackStudioCard index={index} label={label} width={width} />;
  }

  const lower = src.toLowerCase();
  const isVideo = lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".webm");
  const badgeFont = Math.max(12, Math.round(width * 0.0075));

  if (isVideo) {
    return (
      <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", backgroundColor: "#000" }}>
        <Loop durationInFrames={Math.min(90, durationInFrames * 2)}>
          <OffthreadVideo
            src={src}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Loop>
        {label && (
          <div style={{ position: "absolute", top: 16, left: 16, zIndex: 10 }}>
            <span style={{ fontSize: `${badgeFont}px`, background: "rgba(0,0,0,0.70)", color: "#fff", padding: "6px 12px", borderRadius: "6px", fontFamily: "monospace", fontWeight: 700 }}>
              {label}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", backgroundColor: "#000" }}>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {label && (
        <div style={{ position: "absolute", top: 16, left: 16, zIndex: 10 }}>
          <span style={{ fontSize: `${badgeFont}px`, background: "rgba(0,0,0,0.70)", color: "#fff", padding: "6px 12px", borderRadius: "6px", fontFamily: "monospace", fontWeight: 700 }}>
            {label}
          </span>
        </div>
      )}
    </div>
  );
};

export const CameraWallTransition: React.FC<CameraWallTransitionProps> = ({
  SceneA,
  SceneB,
  durationInFrames = 60,
  galleryVideos = [],
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = Math.min(1, Math.max(0, frame / durationInFrames));

  // Dynamic Resolution-Aware Sizing:
  // Studio white gutters are ~3.5% of width (90px on 2560p, 67px on 1920p)
  const studioGap = Math.round(width * 0.035);
  const studioPadding = Math.round(width * 0.020);
  const maxRadius = Math.round(width * 0.035); // Plush rounded squircle curvature (~90px on 2560p)
  const activeBorderWidth = Math.max(4, Math.round(width * 0.0035)); // High-visibility colored docking ring (~9px on 2560p)

  // 4x3 Grid Matrix spans 240% width and 180% height
  const gridMatrixWidth = width * 2.40;
  const gridMatrixHeight = height * 1.80;
  const cardWidth = (gridMatrixWidth - 3 * studioGap - 2 * studioPadding) / 4;
  const cardHeight = (gridMatrixHeight - 2 * studioGap - 2 * studioPadding) / 3;

  // Scale calibration:
  // Phase 2 Hold: Card occupies ~52% of viewport width (matches approved simulator framing)
  const wideScale = (width * 0.52) / cardWidth;

  // Phase 1 Start / Phase 4 End: Card covers 100% of viewport with 1.5% bleed protection
  const scaleToFillWidth = (width / cardWidth) * 1.015;
  const scaleToFillHeight = (height / cardHeight) * 1.015;
  const fullScale = Math.max(scaleToFillWidth, scaleToFillHeight);

  // Lateral Pan Centering:
  // Column 1 (Card 5) center is at -30% of viewport width -> offset camera by +30%
  // Column 2 (Card 6) center is at +30% of viewport width -> offset camera by -30%
  const startX = 30.0;
  const endX = -30.0;

  let scale = fullScale;
  let camX = startX;
  let motionBlur = 0;
  let radiusA = 0;
  let radiusB = maxRadius;
  let borderWidthA = 0;
  let borderWidthB = activeBorderWidth;

  // 4-Phase Choreography:
  // Phase 1 (0.00 - 0.25): Zoom Out from Scene A to Grid View
  // Phase 2 (0.25 - 0.45): "Stop for a sec" (Hold steady on the 12-card studio wall)
  // Phase 3 (0.45 - 0.75): Lateral pan across the studio wall to center Scene B
  // Phase 4 (0.75 - 1.00): Zoom in to Fill Scene B 100% borderless edge-to-edge
  if (t <= 0.25) {
    const subT = t / 0.25;
    const u = quintic(subT);
    scale = fullScale - (fullScale - wideScale) * u;
    camX = startX;
    radiusA = u * maxRadius;
    borderWidthA = u * activeBorderWidth;
    radiusB = maxRadius;
    borderWidthB = activeBorderWidth;
    motionBlur = 0;
  } else if (t <= 0.45) {
    // Phase 2: Hold steady on the grid
    scale = wideScale;
    camX = startX;
    radiusA = maxRadius;
    radiusB = maxRadius;
    borderWidthA = activeBorderWidth;
    borderWidthB = activeBorderWidth;
    motionBlur = 0;
  } else if (t <= 0.75) {
    // Phase 3: Lateral pan from Card 5 to center Card 6
    const subT = (t - 0.45) / 0.30;
    const u = quintic(subT);
    const vel = quinticVel(subT);
    scale = wideScale;
    camX = startX + (endX - startX) * u;
    radiusA = maxRadius;
    radiusB = maxRadius;
    borderWidthA = activeBorderWidth;
    borderWidthB = activeBorderWidth;
    motionBlur = (vel / 1.875) * (width * 0.0035);
  } else {
    // Phase 4: Zoom into Card 6 until it fills the screen
    const subT = (t - 0.75) / 0.25;
    const u = quintic(subT);
    scale = wideScale + (fullScale - wideScale) * u;
    camX = endX;
    radiusA = maxRadius;
    radiusB = (1 - u) * maxRadius;
    borderWidthA = activeBorderWidth;
    borderWidthB = (1 - u) * activeBorderWidth;
    motionBlur = 0;
  }

  // Surrounding footage lookup helper
  const getVideo = (i: number) => galleryVideos[i] || undefined;

  const cardBaseStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    borderRadius: `${maxRadius}px`,
    overflow: "hidden",
    boxShadow: "0 35px 75px rgba(0,0,0,0.22)",
    backgroundColor: "#0f172a",
    boxSizing: "border-box",
    border: "1px solid rgba(255, 255, 255, 0.10)",
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#ffffff",
        overflow: "hidden",
        perspective: 1400,
      }}
    >
      {/* Camera Rig */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          left: 0,
          top: 0,
          transform: `scale(${scale}) translate3d(${camX}%, 0px, 0px)`,
          filter: motionBlur > 0.5 ? `blur(${motionBlur.toFixed(2)}px)` : "none",
          willChange: "transform, filter",
          transformOrigin: "50% 50%",
        }}
      >
        {/* 4x3 Grid Matrix of 12 Cards with generous white studio gutters */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "240%",
            height: "180%",
            transform: "translate(-50%, -50%)",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gridTemplateRows: "repeat(3, 1fr)",
            gap: `${studioGap}px`,
            padding: `${studioPadding}px`,
            boxSizing: "border-box",
          }}
        >
          {/* ROW 0 */}
          <div style={cardBaseStyle}>
            <StudioVideoItem src={getVideo(0)} index={0} label="ARCHIVE // CLIP 01" durationInFrames={durationInFrames} width={width} />
          </div>
          <div style={cardBaseStyle}>
            <StudioVideoItem src={getVideo(1)} index={1} label="ARCHIVE // CLIP 02" durationInFrames={durationInFrames} width={width} />
          </div>
          <div style={cardBaseStyle}>
            <StudioVideoItem src={getVideo(2)} index={2} label="FUTURE // CLIP 03" durationInFrames={durationInFrames} width={width} />
          </div>
          <div style={cardBaseStyle}>
            <StudioVideoItem src={getVideo(3)} index={3} label="FUTURE // CLIP 04" durationInFrames={durationInFrames} width={width} />
          </div>

          {/* ROW 1: Card 4 -> Card 5 (Scene A) -> Card 6 (Scene B) -> Card 7 */}
          <div style={cardBaseStyle}>
            <StudioVideoItem src={getVideo(4)} index={4} label="ARCHIVE // CLIP 05" durationInFrames={durationInFrames} width={width} />
          </div>

          {/* Card 5: ACTIVE OUTGOING SCENE A */}
          <div
            style={{
              ...cardBaseStyle,
              borderRadius: `${radiusA}px`,
              border: `${borderWidthA}px solid #f59e0b`,
              boxShadow: "0 40px 95px rgba(0,0,0,0.32)",
              zIndex: 20,
            }}
          >
            <AbsoluteFill style={{ overflow: "hidden", borderRadius: `${Math.max(0, radiusA - 2)}px` }}>
              {SceneA}
            </AbsoluteFill>
          </div>

          {/* Card 6: ACTIVE INCOMING SCENE B */}
          <div
            style={{
              ...cardBaseStyle,
              borderRadius: `${radiusB}px`,
              border: `${borderWidthB}px solid #10b981`,
              boxShadow: "0 40px 95px rgba(0,0,0,0.32)",
              zIndex: 20,
            }}
          >
            <AbsoluteFill style={{ overflow: "hidden", borderRadius: `${Math.max(0, radiusB - 2)}px` }}>
              {SceneB}
            </AbsoluteFill>
          </div>

          <div style={cardBaseStyle}>
            <StudioVideoItem src={getVideo(5)} index={5} label="FUTURE // CLIP 06" durationInFrames={durationInFrames} width={width} />
          </div>

          {/* ROW 2 */}
          <div style={cardBaseStyle}>
            <StudioVideoItem src={getVideo(6)} index={6} label="ARCHIVE // CLIP 07" durationInFrames={durationInFrames} width={width} />
          </div>
          <div style={cardBaseStyle}>
            <StudioVideoItem src={getVideo(7)} index={7} label="FUTURE // CLIP 08" durationInFrames={durationInFrames} width={width} />
          </div>
          <div style={cardBaseStyle}>
            <StudioVideoItem src={getVideo(8)} index={8} label="FUTURE // CLIP 09" durationInFrames={durationInFrames} width={width} />
          </div>
          <div style={cardBaseStyle}>
            <StudioVideoItem src={getVideo(9)} index={9} label="FUTURE // CLIP 10" durationInFrames={durationInFrames} width={width} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
