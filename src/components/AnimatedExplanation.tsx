import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { BlueprintCanvas } from './BlueprintCanvas';
import { CreamVectorIcon, CustomCellTowerSvg } from './IconRegistry';

export interface ExplanationStep {
  step_index: number;
  trigger_word: string;
  trigger_start_ms: number;
  action: string;
  icon_key: string;
  label_text?: string;
}

export interface ExplanationPayload {
  blueprint_mode:
    | 'network_grid_propagation'
    | 'sequential_slot_replace'
    | 'split_screen_interaction'
    | 'step_by_step_pipeline';
  accentColor?: string;
  accent_color?: string;
  steps: ExplanationStep[];
}

export interface AnimatedExplanationProps {
  payload?: ExplanationPayload;
  sceneStartMs?: number;
  durationInFrames?: number;
}

// ============================================================================
// BLUEPRINT 1: NETWORK GRID PROPAGATION (Matching 1.mp4 Cellular Honeycomb)
// ============================================================================
const NetworkGridPropagation: React.FC<{
  steps: ExplanationStep[];
  sceneStartMs: number;
  accentColor: string;
}> = ({ steps, sceneStartMs, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Convert step millisecond timestamps to local video frames
  const stepFrames = useMemo(() => {
    return steps.map((s, idx) => {
      const rawFrame = Math.round(((s.trigger_start_ms - sceneStartMs) / 1000) * fps);
      // Guarantee first step starts early (frame 6-10), subsequent steps monotonic
      return Math.max(idx * 15 + 8, rawFrame);
    });
  }, [steps, sceneStartMs, fps]);

  const fStep1 = stepFrames[0] ?? 8;
  const fStep2 = stepFrames[1] ?? 40;
  const fStep3 = stepFrames[2] ?? 80;
  const fStep4 = stepFrames[3] ?? 120;

  // 1. Center Tower Spring Entrance
  const centerTowerScale = spring({
    frame: frame - fStep1,
    fps,
    config: { damping: 14, stiffness: 160 },
  });

  // Radio Wave Rings Pulsing from Center Tower
  const waveCycle = (frame - fStep1) % 45;
  const wave1R = interpolate(waveCycle, [0, 45], [20, 140]);
  const wave1Opacity = interpolate(waveCycle, [0, 30, 45], [0.8, 0.4, 0]);

  const wave2Cycle = (frame - fStep1 + 22) % 45;
  const wave2R = interpolate(wave2Cycle, [0, 45], [20, 140]);
  const wave2Opacity = interpolate(wave2Cycle, [0, 30, 45], [0.8, 0.4, 0]);

  // 2. Dashed Hexagonal Honeycomb Draw In
  const hexDrawProgress = spring({
    frame: frame - fStep2,
    fps,
    config: { damping: 18, stiffness: 100 },
  });
  const hexStrokeOffset = interpolate(hexDrawProgress, [0, 1], [600, 0]);

  // 3. Surrounding Towers Pop In
  const surroundingTowerScale = spring({
    frame: frame - fStep3,
    fps,
    config: { damping: 13, stiffness: 170 },
  });

  // 4. Packet/Handset Transfer from Center to Right Cell
  const transferProgress = spring({
    frame: frame - fStep4,
    fps,
    config: { damping: 16, stiffness: 90 },
  });
  const handsetX = interpolate(transferProgress, [0, 1], [0, 260]);
  const handsetY = interpolate(transferProgress, [0, 0.5, 1], [0, -40, 0]);
  const handoffActive = transferProgress > 0.65;

  return (
    <div style={{ position: 'relative', width: 960, height: 540 }}>
      {/* SVG Dashed Honeycomb Grid Overlay */}
      <svg
        width="100%"
        height="100%"
        viewBox="-480 -270 960 540"
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      >
        <g
          stroke="rgba(230, 213, 184, 0.6)"
          strokeWidth="3.5"
          strokeDasharray="14 10"
          strokeDashoffset={hexStrokeOffset}
          fill="none"
        >
          {/* Center Cell Hexagon */}
          <polygon points="0,-140 120,-70 120,70 0,140 -120,70 -120,-70" />
          {/* Left Cell */}
          <polygon points="-240,-140 -120,-70 -120,70 -240,140 -360,70 -360,-70" />
          {/* Right Cell */}
          <polygon points="240,-140 360,-70 360,70 240,140 120,70 120,-70" />
          {/* Top-Center Cell */}
          <polygon points="0,-350 120,-280 120,-140 0,-70 -120,-140 -120,-280" />
          {/* Bottom-Center Cell */}
          <polygon points="0,70 120,140 120,280 0,350 -120,280 -120,140" />
        </g>

        {/* Concentric Radio Waves from Center Tower */}
        {frame >= fStep1 && !handoffActive && (
          <>
            <circle
              cx="0"
              cy="-40"
              r={wave1R}
              stroke={accentColor}
              strokeWidth="2.5"
              fill="none"
              opacity={wave1Opacity}
            />
            <circle
              cx="0"
              cy="-40"
              r={wave2R}
              stroke={accentColor}
              strokeWidth="2.5"
              fill="none"
              opacity={wave2Opacity}
            />
          </>
        )}

        {/* Radio Waves Switched to Right Tower on Handoff */}
        {handoffActive && (
          <circle
            cx="240"
            cy="-40"
            r={wave1R}
            stroke="#00FF66"
            strokeWidth="3"
            fill="none"
            opacity={wave1Opacity}
          />
        )}
      </svg>

      {/* Surrounding Tower: Left Cell */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '25%',
          transform: `translate(-50%, -50%) scale(${surroundingTowerScale})`,
          opacity: surroundingTowerScale,
        }}
      >
        <CreamVectorIcon iconKey="radio-tower" size={130} />
      </div>

      {/* Surrounding Tower: Right Cell */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '75%',
          transform: `translate(-50%, -50%) scale(${surroundingTowerScale})`,
          opacity: surroundingTowerScale,
        }}
      >
        <CreamVectorIcon
          iconKey="radio-tower"
          size={130}
          accentColor={handoffActive ? '#00FF66' : accentColor}
        />
      </div>

      {/* Center Main Tower */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${centerTowerScale})`,
          opacity: centerTowerScale,
          zIndex: 5,
        }}
      >
        <CreamVectorIcon
          iconKey="radio-tower"
          size={150}
          label={steps[0]?.label_text || 'CELL 01'}
          accentColor={accentColor}
        />
      </div>

      {/* Moving Handset / Packet Crossing Cell Boundary */}
      {frame >= fStep4 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${handsetX}px), calc(-50% + ${handsetY}px)) scale(${transferProgress})`,
            zIndex: 10,
          }}
        >
          <CreamVectorIcon
            iconKey="phone-call"
            size={70}
            label="HANDOFF"
            accentColor="#00FF66"
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// BLUEPRINT 2: SEQUENTIAL SLOT REPLACE (Matching pc.mp4 Odometer & Drop)
// ============================================================================
const SequentialSlotReplace: React.FC<{
  steps: ExplanationStep[];
  sceneStartMs: number;
  accentColor: string;
}> = ({ steps, sceneStartMs, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Convert step timestamps to local frames
  const stepFrames = useMemo(() => {
    return steps.map((s, idx) => {
      const rawFrame = Math.round(((s.trigger_start_ms - sceneStartMs) / 1000) * fps);
      return Math.max(idx * 20 + 8, rawFrame);
    });
  }, [steps, sceneStartMs, fps]);

  // Determine current active step index
  let activeIndex = 0;
  for (let i = 0; i < stepFrames.length; i++) {
    if (frame >= (stepFrames[i] ?? 0)) {
      activeIndex = i;
    }
  }

  const currentStep = steps[activeIndex] || steps[0];
  const stepStartFrame = stepFrames[activeIndex] ?? 8;
  const framesSinceDrop = frame - stepStartFrame;

  // Vertical Slot-Machine Drop with spring slam
  const dropSpring = spring({
    frame: framesSinceDrop,
    fps,
    config: { damping: 13, stiffness: 210 },
  });

  const slotY = interpolate(dropSpring, [0, 1], [-90, 0]);
  const motionBlur = interpolate(dropSpring, [0, 0.4, 1], [8, 3, 0]);

  // Simulated live odometer numbers
  const odometerNumber = Math.min(
    999999,
    690000 + Math.floor(frame * 137) % 10000
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
      }}
    >
      {/* Rolling Odometer Number Display (Matching pc.mp4 690069) */}
      <div
        style={{
          fontFamily: '"JetBrains Mono", "Courier New", monospace',
          fontSize: 34,
          fontWeight: 900,
          color: accentColor,
          letterSpacing: 4,
          backgroundColor: 'rgba(2, 6, 23, 0.85)',
          border: `2px solid ${accentColor}`,
          padding: '6px 24px',
          borderRadius: 8,
          boxShadow: `0 0 20px rgba(0, 240, 255, 0.25)`,
        }}
      >
        #{String(odometerNumber).padStart(6, '0')}
      </div>

      {/* Central Vector Slot-Machine Viewport */}
      <div
        style={{
          width: 320,
          height: 240,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          key={`slot-${activeIndex}`}
          style={{
            transform: `translateY(${slotY}px)`,
            filter: `blur(${motionBlur}px)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <CreamVectorIcon
            iconKey={currentStep?.icon_key || 'home'}
            size={140}
            label={currentStep?.label_text || currentStep?.trigger_word}
            accentColor={accentColor}
          />
        </div>
      </div>

      {/* Step Sequence Breadcrumbs Indicator */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        {steps.map((s, idx) => (
          <div
            key={`dot-${idx}`}
            style={{
              width: idx === activeIndex ? 28 : 10,
              height: 8,
              borderRadius: 4,
              backgroundColor: idx === activeIndex ? accentColor : 'rgba(230, 213, 184, 0.25)',
              transition: 'all 0.2s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// BLUEPRINT 3: SPLIT SCREEN INTERACTION (Matching pc.mp4 Caller & Target)
// ============================================================================
const SplitScreenInteraction: React.FC<{
  steps: ExplanationStep[];
  sceneStartMs: number;
  accentColor: string;
}> = ({ steps, sceneStartMs, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stepFrames = useMemo(() => {
    return steps.map((s, idx) => {
      const rawFrame = Math.round(((s.trigger_start_ms - sceneStartMs) / 1000) * fps);
      return Math.max(idx * 25 + 8, rawFrame);
    });
  }, [steps, sceneStartMs, fps]);

  const fStep1 = stepFrames[0] ?? 8;
  const fZoomStep = stepFrames[stepFrames.length - 1] ?? 80;

  // Pulsing transmission waves across the seam
  const waveCycle = (frame - fStep1) % 40;
  const waveR = interpolate(waveCycle, [0, 40], [20, 200]);
  const waveOpacity = interpolate(waveCycle, [0, 25, 40], [0.9, 0.4, 0]);

  // Punchline Zoom-in on Right Target Window
  const isZooming = frame >= fZoomStep;
  const zoomSpring = spring({
    frame: frame - fZoomStep,
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const rightScale = isZooming ? interpolate(zoomSpring, [0, 1], [1.0, 1.65]) : 1.0;

  const leftStep = steps[0];
  const rightStep = steps[1] || steps[0];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 80px',
        boxSizing: 'border-box',
      }}
    >
      {/* Left Column: Caller / Originator */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Transmission Radiating Rings */}
        <svg
          width="400"
          height="400"
          viewBox="-200 -200 400 400"
          style={{ position: 'absolute', pointerEvents: 'none' }}
        >
          <circle
            cx="0"
            cy="0"
            r={waveR}
            stroke={accentColor}
            strokeWidth="3"
            fill="none"
            opacity={waveOpacity}
          />
        </svg>

        <CreamVectorIcon
          iconKey={leftStep?.icon_key || 'phone-call'}
          size={140}
          label={leftStep?.label_text || 'TRANSMITTER'}
          accentColor={accentColor}
        />
      </div>

      {/* Center Vertical Seam & Dividing Neon Ray */}
      <div
        style={{
          width: 3,
          height: '70%',
          backgroundColor: 'rgba(56, 189, 248, 0.3)',
          boxShadow: `0 0 16px ${accentColor}`,
          position: 'relative',
        }}
      />

      {/* Right Column: Receiver / Building Target */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${rightScale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.1s ease',
        }}
      >
        <CreamVectorIcon
          iconKey={rightStep?.icon_key || 'building-2'}
          size={140}
          label={rightStep?.label_text || 'RECEIVER'}
          accentColor={isZooming ? '#00FF66' : accentColor}
        />
      </div>
    </div>
  );
};

// ============================================================================
// BLUEPRINT 4: STEP-BY-STEP PIPELINE (Signal Flow / Multi-Stage Drivetrain)
// ============================================================================
const StepByStepPipeline: React.FC<{
  steps: ExplanationStep[];
  sceneStartMs: number;
  accentColor: string;
}> = ({ steps, sceneStartMs, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stepFrames = useMemo(() => {
    return steps.map((s, idx) => {
      const rawFrame = Math.round(((s.trigger_start_ms - sceneStartMs) / 1000) * fps);
      return Math.max(idx * 22 + 8, rawFrame);
    });
  }, [steps, sceneStartMs, fps]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 36,
        width: '90%',
      }}
    >
      {steps.slice(0, 4).map((step, idx) => {
        const sFrame = stepFrames[idx] ?? 8;
        const isActive = frame >= sFrame;
        const popSpring = spring({
          frame: frame - sFrame,
          fps,
          config: { damping: 13, stiffness: 180 },
        });

        const scale = isActive ? interpolate(popSpring, [0, 1], [0.85, 1.0]) : 0.85;
        const opacity = isActive ? 1.0 : 0.35;

        return (
          <React.Fragment key={`pipe-step-${idx}`}>
            {/* Pipeline Stage Card */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                transform: `scale(${scale})`,
                opacity,
                padding: '24px 28px',
                borderRadius: 14,
                backgroundColor: isActive ? 'rgba(11, 23, 44, 0.85)' : 'rgba(5, 10, 20, 0.4)',
                border: `2px solid ${isActive ? accentColor : 'rgba(56, 189, 248, 0.15)'}`,
                boxShadow: isActive ? `0 0 25px rgba(0, 240, 255, 0.2)` : 'none',
              }}
            >
              <CreamVectorIcon
                iconKey={step.icon_key}
                size={95}
                label={step.label_text || `STAGE 0${idx + 1}`}
                accentColor={accentColor}
              />
            </div>

            {/* Connection Flow Arrow to Next Stage */}
            {idx < steps.length - 1 && (
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 28,
                  fontWeight: 900,
                  color: isActive ? accentColor : 'rgba(230, 213, 184, 0.25)',
                  transform: 'scaleX(1.3)',
                }}
              >
                ➔
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================================================
// MASTER COMPONENT: <AnimatedExplanation />
// ============================================================================
export const AnimatedExplanation: React.FC<AnimatedExplanationProps> = ({
  payload,
  sceneStartMs = 0,
}) => {
  const mode = payload?.blueprint_mode || 'sequential_slot_replace';
  const accent = payload?.accentColor || payload?.accent_color || '#E5C07B';
  const steps = payload?.steps && payload.steps.length > 0 ? payload.steps : [];

  return (
    <BlueprintCanvas accentColor={accent} subHeader={`MODE: ${mode.toUpperCase()}`}>
      {mode === 'network_grid_propagation' ? (
        <NetworkGridPropagation
          steps={steps}
          sceneStartMs={sceneStartMs}
          accentColor={accent}
        />
      ) : mode === 'split_screen_interaction' ? (
        <SplitScreenInteraction
          steps={steps}
          sceneStartMs={sceneStartMs}
          accentColor={accent}
        />
      ) : mode === 'step_by_step_pipeline' ? (
        <StepByStepPipeline
          steps={steps}
          sceneStartMs={sceneStartMs}
          accentColor={accent}
        />
      ) : (
        <SequentialSlotReplace
          steps={steps}
          sceneStartMs={sceneStartMs}
          accentColor={accent}
        />
      )}
    </BlueprintCanvas>
  );
};
