import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate, random as seededRandom } from 'remotion';
import React from 'react';
import { useCamera } from '../index';
import { BiometricScanRing } from './BiometricScanRing';
import { Dynamic3DComparison } from './Dynamic3DComparison';
import { GlassStatGrid } from './GlassStatGrid';
import { AnimatedNumber } from './AnimatedNumber';

// -----------------------------------------------------
// 1. DATA TICK ENGINE (Advanced Number Animators)
// -----------------------------------------------------
const NumberAnimator = ({ target, style, frame, fps, delay = 0 }: any) => {
    const activeFrame = Math.max(0, frame - delay);
    const targetNum = Number(target) || 0;
    
    if (style === 'slot_machine') {
        const progress = spring({ frame: activeFrame, fps, config: { damping: 100, stiffness: 20 } });
        const val = interpolate(progress, [0, 1], [0, targetNum]);
        const display = progress < 0.95 ? Math.floor(val + (Math.random() * 999)) : targetNum;
        return <span>{display.toLocaleString()}</span>;
    } 
    
    if (style === 'digital_terminal') {
        const progress = interpolate(activeFrame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
        if (progress < 1) {
            const gibberish = Array(target.toString().length).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
            return <span>{gibberish}</span>;
        }
        return <span>{targetNum.toLocaleString()}</span>;
    }

    const val = Math.floor(interpolate(activeFrame, [0, 45], [0, targetNum], { extrapolateRight: 'clamp' }));
    return <span>{val.toLocaleString()}</span>;
};

// -----------------------------------------------------
// 2. PHYSICAL INTEGRATION ENGINE
// -----------------------------------------------------
const PhysicalIntegrator = ({ mode, children, zDepth }: any) => {
    const camera = useCamera();
    
    const pMult = Math.max(0.1, 1 - (zDepth / 100));
    const parallaxX = camera.xPan * pMult;
    const parallaxY = camera.yPan * pMult;
    const parallaxScale = 1.0 + ((camera.zScale - 1.0) * pMult);
    
    let transform = `translate3d(${parallaxX}px, ${parallaxY}px, ${zDepth}px) scale(${parallaxScale})`;
    let filter = 'drop-shadow(0 20px 40px rgba(0,0,0,0.8))';

    if (mode === 'glass_projection') {
        transform += ` rotateX(15deg) rotateY(-10deg)`;
        filter = 'drop-shadow(0 0 20px rgba(0,255,255,0.4)) contrast(120%)';
    } else if (mode === 'attach_to_desk') {
        transform += ` translateY(300px) rotateX(60deg) rotateZ(-10deg)`;
        filter = 'drop-shadow(0 50px 30px rgba(0,0,0,0.9))';
    } else if (mode === 'stick_to_wall') {
        transform = `translate3d(${parallaxX * 0.2}px, ${parallaxY * 0.2}px, -200px) scale(${parallaxScale * 0.8})`;
    } else if (mode === 'hud_scanner') {
        transform = `scale(${camera.zScale})`; 
        filter = 'drop-shadow(0 0 10px rgba(0,255,0,0.5))';
    }

    return (
        <AbsoluteFill style={{ 
            pointerEvents: 'none', 
            justifyContent: 'center', 
            alignItems: 'center',
            perspective: '1000px',
            zIndex: zDepth > 0 ? 50 : 5
        }}>
            <div style={{ transform, filter, transformStyle: 'preserve-3d', transition: 'all 0.1s' }}>
                {children}
            </div>
        </AbsoluteFill>
    );
};

// -----------------------------------------------------
// 3. GRAPHIC MODULES
// -----------------------------------------------------
const CinematicGraph = ({ dataPoints, styleVariant, frame, fps, color }: any) => {
    if (!dataPoints || dataPoints.length === 0) return null;
    const maxVal = Math.max(...dataPoints.map((dp: any) => {
        const match = dp.value.match(/[\d.,]+/);
        return match ? parseFloat(match[0].replace(/,/g, '')) : 10;
    }), 1);

    return (
        <div style={{ 
            display: 'flex', alignItems: 'flex-end', gap: '30px', height: '450px', 
            padding: '40px 60px', borderRadius: '24px',
            background: 'linear-gradient(145deg, rgba(15,20,30,0.85) 0%, rgba(5,10,15,0.95) 100%)', 
            backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: `0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)`
        }}>
            {dataPoints.map((dp: any, idx: number) => {
                const match = dp.value.match(/[\d.,]+/);
                const numericVal = match ? parseFloat(match[0].replace(/,/g, '')) : 0;
                const prefix = dp.value.replace(/[\d.,]+.*/, '');
                const suffix = dp.value.replace(/.*?[\d.,]+/, '');
                
                const targetHeight = (numericVal / maxVal) * 300; 
                const barProgress = spring({ frame: Math.max(0, frame - (idx * 5)), fps, config: { damping: 14 } });
                const currentHeight = Math.max(barProgress * targetHeight, 4);

                return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', flex: 1, minWidth: '100px' }}>
                        <div style={{ 
                            color: '#FFF', fontFamily: '"Inter", "Roboto", sans-serif', fontSize: '36px', 
                            fontWeight: '800', textShadow: `0 4px 15px rgba(0,0,0,0.5)`,
                            opacity: barProgress
                        }}>
                            {prefix}{numericVal > 0 ? <NumberAnimator target={numericVal} style="slot_machine" frame={frame} fps={fps} delay={idx * 5} /> : dp.value}{suffix}
                        </div>
                        <div style={{ 
                            width: '100%', height: `${currentHeight}px`, 
                            background: `linear-gradient(180deg, ${color} 0%, ${color}20 100%)`, 
                            boxShadow: `0 0 40px ${color}60`, borderRadius: '8px',
                            borderTop: `2px solid #FFF`, position: 'relative', overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                                transform: `translateX(${(frame % 60) * 10 - 200}%)`
                            }} />
                        </div>
                        <span style={{ 
                            color: 'rgba(255,255,255,0.7)', fontFamily: '"Inter", "Roboto", sans-serif', 
                            fontSize: '18px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600,
                            textAlign: 'center'
                        }}>
                            {dp.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

const KPICards = ({ dataPoints, frame, fps, color }: any) => {
    return (
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', width: '1200px', justifyContent: 'center' }}>
            {dataPoints.map((dp: any, idx: number) => {
                const pop = spring({ frame: Math.max(0, frame - (idx * 10)), fps, config: { damping: 12 } });
                const match = dp.value.match(/[\d.,]+/);
                const numericVal = match ? parseFloat(match[0].replace(/,/g, '')) : 0;
                const prefix = dp.value.replace(/[\d.,]+.*/, '');
                const suffix = dp.value.replace(/.*?[\d.,]+/, '');

                return (
                    <div key={idx} style={{ 
                        transform: `scale(${pop}) translateY(${interpolate(pop, [0, 1], [50, 0])}px)`, opacity: pop,
                        background: 'linear-gradient(135deg, rgba(25,30,40,0.8) 0%, rgba(10,15,20,0.95) 100%)',
                        backdropFilter: 'blur(20px)', padding: '50px', borderRadius: '24px', 
                        border: '1px solid rgba(255,255,255,0.1)', borderTop: `1px solid rgba(255,255,255,0.3)`,
                        boxShadow: `0 30px 60px rgba(0,0,0,0.6), inset 0 0 40px ${color}10`,
                        minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '15px'
                    }}>
                        <div style={{ width: '40px', height: '4px', background: color, borderRadius: '2px', marginBottom: '10px' }} />
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontFamily: '"Inter", sans-serif', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 600 }}>{dp.label}</span>
                        <span style={{ color: '#FFF', fontFamily: '"Inter", sans-serif', fontSize: '64px', fontWeight: '900', textShadow: `0 10px 30px rgba(0,0,0,0.5)`, display: 'flex', alignItems: 'baseline' }}>
                            {prefix}{numericVal > 0 ? <NumberAnimator target={numericVal} style="digital_terminal" frame={frame} fps={fps} /> : dp.value}<span style={{ fontSize: '32px', marginLeft: '5px', color: 'rgba(255,255,255,0.5)' }}>{suffix}</span>
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

const HolographicBlueprint = ({ dataPoints, frame, fps, color }: any) => {
    return (
        <div style={{ 
            padding: '50px 60px', border: `1px solid rgba(255,255,255,0.2)`, 
            background: `repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px), 
                         repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px),
                         linear-gradient(135deg, rgba(10,15,30,0.9), rgba(5,5,15,0.95))`,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 40px 80px rgba(0,0,0,0.8), inset 0 0 100px ${color}20`, borderRadius: '24px', width: '1000px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: `1px solid rgba(255,255,255,0.1)`, paddingBottom: '30px' }}>
                <h2 style={{ color: '#FFF', fontFamily: '"Inter", sans-serif', textTransform: 'uppercase', fontSize: '36px', letterSpacing: '6px', margin: 0, fontWeight: 300 }}>
                    Technical <span style={{ fontWeight: 800, color }}>Analysis</span>
                </h2>
                <div style={{ width: '60px', height: '60px', border: `2px solid ${color}`, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ width: '20px', height: '20px', background: color, borderRadius: '50%', opacity: Math.sin(frame * 0.1) * 0.5 + 0.5 }} />
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                {dataPoints.map((dp: any, idx: number) => {
                    const labelStr = String(dp.label || '');
                    const valStr = String(dp.value || '');
                    const charsToShow = Math.floor(interpolate(frame - (idx * 10), [0, 20], [0, valStr.length + labelStr.length], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }));
                    const fullText = `${labelStr}: ${valStr}`;
                    const visibleText = fullText.substring(0, charsToShow);
                    return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: '"Inter", sans-serif', fontSize: '16px', letterSpacing: '3px', textTransform: 'uppercase' }}>{labelStr}</span>
                            <span style={{ color: '#FFF', fontFamily: '"JetBrains Mono", "Courier New", monospace', fontSize: '28px', fontWeight: 600, textShadow: `0 0 20px ${color}80` }}>
                                {valStr.substring(0, Math.floor(interpolate(frame - (idx*10), [0, 20], [0, valStr.length], {extrapolateRight: 'clamp'})))}
                                {charsToShow < fullText.length && charsToShow > 0 && <span style={{ backgroundColor: color, color: '#000' }}>_</span>}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const StockTerminal = ({ dataPoints, frame, fps, color }: any) => {
    return (
        <div style={{ 
            fontFamily: '"JetBrains Mono", "Courier New", monospace', 
            background: 'rgba(10,12,16,0.95)', padding: '40px', borderRadius: '16px',
            border: `1px solid rgba(255,255,255,0.1)`, borderTop: `4px solid ${color}`,
            boxShadow: `0 40px 100px rgba(0,0,0,0.9), inset 0 0 60px rgba(0,0,0,0.5)`, 
            width: '800px', backdropFilter: 'blur(30px)'
        }}>
            <div style={{ borderBottom: `1px solid rgba(255,255,255,0.1)`, paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.4)', fontSize: '16px', letterSpacing: '2px' }}>
                <span>SYS_TERMINAL_V9 // LIVE_FEED</span>
                <span>{frame % 60 < 30 ? '█' : ' '}</span>
            </div>
            {dataPoints.map((dp: any, idx: number) => {
                const show = frame > idx * 8;
                if (!show) return null;
                const match = dp.value.match(/[\d.,]+/);
                const numericVal = match ? parseFloat(match[0].replace(/,/g, '')) : 0;
                const isPositive = numericVal > 0 || dp.value.includes('+');
                const isNegative = numericVal < 0 || dp.value.includes('-');
                const valColor = isPositive ? '#00FF66' : isNegative ? '#FF3366' : '#FFF';
                
                return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '24px', margin: '15px 0', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                        <span style={{ color: '#FFF' }}><span style={{ color, marginRight: '15px' }}>&gt;</span>{dp.label}</span>
                        <span style={{ color: valColor, fontWeight: 700, textShadow: `0 0 20px ${valColor}60` }}>
                           {dp.value}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

// -----------------------------------------------------
// 4. GRAPHIC DIRECTOR
// -----------------------------------------------------
export const MotionGraphicsRouter = ({ graphics, sceneIndex = 0, durationInFrames = 150 }: any) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!graphics || !graphics.graphics_type || typeof graphics.graphics_type !== 'string' || graphics.graphics_type.toLowerCase() === 'none') {
    return null;
  }

  const type = graphics.graphics_type.toLowerCase();

  const startFrame = graphics.trigger_frame ?? 0;

  // NATIVE ROUTES for custom data components
  if (type === 'animatednumber' || type === 'animated_number') {
      // -----------------------------------------------------------------------
      // FIELD-NAME NORMALIZER
      // Director prompt emits `value` (raw number, occasionally a loose string)
      // + `number_type`. The component expects `numericValue` + `type`. We also
      // tolerate a couple of alternate shapes the model occasionally drifts to,
      // same defensive pattern as the Dynamic3DComparison normalizer below.
      // -----------------------------------------------------------------------
      const rawVal = graphics.value ?? graphics.numericValue ?? graphics.amount ?? 0;
      const numericValue = (typeof rawVal === 'number' && isFinite(rawVal))
          ? rawVal
          : (parseFloat(String(rawVal).replace(/[^0-9.\-]/g, '')) || 0);
      const numberType = (graphics.number_type || graphics.type || graphics.numberType || 'generic').toLowerCase();
      const safeDuration = Math.max(1, durationInFrames - startFrame);

      // AnimatedNumber has no start/end window of its own (unlike BiometricScanRing/
      // GlassStatGrid) — it just trusts frame 0 = "appear now". Wrapping it in a
      // Sequence is what actually makes trigger_frame do anything, and gives it a
      // clean auto hard-cut when the Sequence's duration runs out.
      return (
          <Sequence from={startFrame} durationInFrames={safeDuration} layout="none">
              <AnimatedNumber
                  numericValue={numericValue}
                  type={numberType}
                  durationFrames={safeDuration}
                  globalIndex={sceneIndex}
                  prefix={graphics.prefix}
                  suffix={graphics.suffix}
              />
          </Sequence>
      );
  }

  if (type === 'biometricscanring' || type === 'biometric_scan_ring') {
      return (
          <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
              <BiometricScanRing 
                  start={startFrame} 
                  end={durationInFrames} 
                  targetPercentage={graphics.targetPercentage || 0}
                  label={graphics.label || 'METRIC'}
                  brandColor={graphics.brandColor || '#00FF66'}
              />
          </AbsoluteFill>
      );
  }

  if (type === 'dynamic3dcomparison' || type === 'dynamic_3d_comparison') {
      // -----------------------------------------------------------------------
      // ROBUST SCHEMA NORMALIZER
      // The AI may produce several incompatible item shapes. We handle all of them:
      //   Schema A (correct): { title, subtitle, value (number), color, start, end }
      //   Schema B (AI v1):   { label, value (string like "675K MILES") }
      //   Schema C (AI v2):   { name, stat (string like "ORIGINAL" / "800K") }
      // We also guard against NaN / non-finite values that crash interpolate().
      // -----------------------------------------------------------------------
      const extractNumericValue = (raw: any): number => {
          if (typeof raw === 'number' && isFinite(raw) && raw > 0) return raw;
          if (typeof raw !== 'string') return 1;
          // Remove commas, spaces, and trailing text — grab the first number-like token
          const stripped = raw.replace(/,/g, '').replace(/k/gi, '000');
          const match = stripped.match(/(\d+\.?\d*)/);
          if (match) {
              const n = parseFloat(match[1]);
              if (isFinite(n) && n > 0) return n;
          }
          return 1; // non-parseable strings (e.g. "ORIGINAL") get value=1 so bars render
      };

      const normalizeItem = (raw: any, defaultColor: string, startOffset: number): any => {
          if (!raw) return { title: '', subtitle: '', value: 1, color: defaultColor, start: startFrame + startOffset, end: durationInFrames };
          // Determine the display title and subtitle from whichever fields exist
          const title    = raw.title    ?? raw.label ?? raw.name   ?? '';
          const subtitle = raw.subtitle ?? raw.stat  ?? raw.value  ?? '';
          // Numeric value: prefer raw.value if numeric, otherwise parse stat or label
          const numericValue = extractNumericValue(raw.value ?? raw.stat ?? raw.label ?? 1);
          return {
              title,
              subtitle: typeof subtitle === 'string' ? subtitle : String(subtitle),
              value:     numericValue,
              color:     raw.color       ?? defaultColor,
              imageUrl:  raw.imageUrl    ?? raw.local_path ?? undefined,
              start:     raw.start       ?? startFrame + startOffset,
              end:       raw.end         ?? durationInFrames,
          };
      };

      const patchedItemA = normalizeItem(graphics.itemA, '#ff1a40', 0);
      const patchedItemB = normalizeItem(graphics.itemB, '#00e6b8', 15);

      return (
          <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
              <Dynamic3DComparison 
                  unit={graphics.unit || ''}
                  itemA={patchedItemA}
                  itemB={patchedItemB}
              />
          </AbsoluteFill>
      );
  }

  if (type === 'glassstatgrid' || type === 'glass_stat_grid') {
      return (
          <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
              <GlassStatGrid 
                  start={startFrame}
                  end={durationInFrames}
                  stats={graphics.stats || []}
              />
          </AbsoluteFill>
      );
  }

  // FALLBACK GENERIC ROUTER FOR LEGACY COMPONENTS
  let g = { ...graphics };
  if (!g.data_points) {
      // If it missed the exact type match but still lacks data_points, we gracefully exit 
      // rather than crashing CinematicGraph
      return null;
  }

  if (!g.data_points || g.data_points.length === 0) return null;

  const seed = sceneIndex + (g.data_points.length * 7);
  const random = (offset: number) => seededRandom(seed + offset);
  const choice = (arr: any[]) => arr[Math.floor(random(0) * arr.length)];

  const colors = ['#FFFFFF', '#000000'];
  const themeColor = choice(colors);

  const modes = ['float', 'glass_projection', 'attach_to_desk', 'stick_to_wall', 'hud_scanner'];
  const integrationMode = g.integration_mode || choice(modes);

  const zDepth = integrationMode === 'stick_to_wall' ? -200 : 
                 integrationMode === 'glass_projection' ? 150 : 50;

  let GraphicComponent = CinematicGraph;
  if (type.includes('blueprint') || type.includes('specs') || type.includes('diagram')) {
      GraphicComponent = HolographicBlueprint;
  } else if (type.includes('kpi') || type.includes('quote') || type.includes('comparison') || type.includes('counter')) {
      GraphicComponent = KPICards;
  } else if (type.includes('terminal') || type.includes('hud') || type.includes('radar')) {
      GraphicComponent = StockTerminal;
  }

  return (
      <PhysicalIntegrator mode={integrationMode} zDepth={zDepth}>
          <GraphicComponent 
              dataPoints={g.data_points} 
              frame={frame + 20} 
              fps={fps} 
              color={themeColor} 
              styleVariant={g.visual_style} 
          />
      </PhysicalIntegrator>
  );
};