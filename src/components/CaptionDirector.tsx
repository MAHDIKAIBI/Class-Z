import React, { useMemo } from 'react';
import { AbsoluteFill, useVideoConfig, Sequence, interpolate, useCurrentFrame, spring } from 'remotion';
import { AnimatedNumber } from './AnimatedNumber';
import { AnimatedWord } from './AnimatedWord';
import { KineticStack } from './KineticStack';

// ==========================================
// INTERNAL CAPTION RENDERERS
// ==========================================

/** Glass Pill — clean neutral information delivery with frosted glass background */
const GlassPillCaption: React.FC<{ text: string }> = ({ text }) => {
    const frame = useCurrentFrame();
    const opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
    
    return (
        <div style={{
            position: 'absolute', 
            bottom: '8%', left: '50%', transform: 'translate(-50%, 0)', 
            display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
            justifyContent: 'center', width: '80%', gap: '8px',
            opacity,
            zIndex: 100
        }}>
            <span style={{
                display: 'inline-block',
                fontFamily: '"Inter", "Geist", system-ui, sans-serif',
                fontSize: '46px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                padding: '14px 32px',
                textShadow: '0px 2px 4px rgba(0,0,0,0.9), 0px 4px 15px rgba(0,0,0,0.8)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
                {text}
            </span>
        </div>
    );
};

/** Cinematic Documentary — serif typography with cinematic gold highlights */
const CinematicDocCaption: React.FC<{ text: string }> = ({ text }) => {
    const frame = useCurrentFrame();
    const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
    const slideY = interpolate(frame, [0, 12], [30, 0], { extrapolateRight: 'clamp' });
    
    return (
        <div style={{
            position: 'absolute', 
            bottom: '10%', left: '50%', 
            transform: `translate(-50%, ${slideY}px)`, 
            width: '75%',
            textAlign: 'center',
            opacity,
            zIndex: 100
        }}>
            <span style={{
                display: 'inline',
                fontFamily: '"Playfair Display", "Georgia", serif',
                fontSize: '52px',
                fontWeight: 500,
                fontStyle: 'italic',
                color: '#F5E6C8',
                textShadow: '0px 2px 6px rgba(0,0,0,0.95), 0px 0px 40px rgba(212,175,55,0.3)',
                lineHeight: 1.3,
                letterSpacing: '-0.5px',
            }}>
                {text}
            </span>
            {/* Gold underline accent */}
            <div style={{
                margin: '12px auto 0', width: '60px', height: '2px',
                background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
            }} />
        </div>
    );
};

/** Premium Spatial — 84px editorial text anchored left or right */
const SpatialCaption: React.FC<{ text: string, side: 'left' | 'right' }> = ({ text, side }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const slideProgress = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
    const slideX = interpolate(slideProgress, [0, 1], [side === 'left' ? -200 : 200, 0]);
    const opacity = interpolate(slideProgress, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });
    
    return (
        <div style={{
            position: 'absolute', 
            top: '50%', 
            [side]: '6%',
            transform: `translateY(-50%) translateX(${slideX}px)`, 
            width: '42%',
            textAlign: side,
            opacity,
            zIndex: 100
        }}>
            <span style={{
                display: 'inline',
                fontFamily: '"Inter", "Geist", system-ui, sans-serif',
                fontSize: '84px',
                fontWeight: 800,
                color: '#FFFFFF',
                textShadow: '0px 4px 20px rgba(0,0,0,0.9), 0px 0px 60px rgba(0,0,0,0.5)',
                lineHeight: 1.0,
                letterSpacing: '-3px',
                textTransform: 'uppercase' as any,
            }}>
                {text}
            </span>
        </div>
    );
};

/** Liquid Mirror — luxurious fluid glassmorphism with prismatic edge */
const LiquidMirrorCaption: React.FC<{ text: string }> = ({ text }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const entranceProgress = spring({ frame, fps, config: { damping: 16, stiffness: 60, mass: 1.4 } });
    const scale = interpolate(entranceProgress, [0, 1], [0.85, 1]);
    const opacity = interpolate(entranceProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' });
    // Subtle prismatic hue shift
    const hueShift = interpolate(frame, [0, 90], [0, 30]);
    
    return (
        <div style={{
            position: 'absolute', 
            bottom: '8%', left: '50%', 
            transform: `translate(-50%, 0) scale(${scale})`, 
            opacity,
            zIndex: 100
        }}>
            <div style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05), rgba(200,180,255,0.1))`,
                backdropFilter: `blur(50px) saturate(200%) hue-rotate(${hueShift}deg)`,
                WebkitBackdropFilter: `blur(50px) saturate(200%) hue-rotate(${hueShift}deg)`,
                border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: '24px',
                padding: '20px 40px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 10px rgba(255,255,255,0.4)',
            }}>
                <span style={{
                    fontFamily: '"Inter", "Geist", system-ui, sans-serif',
                    fontSize: '48px',
                    fontWeight: 500,
                    color: '#FFFFFF',
                    textShadow: '0px 2px 8px rgba(0,0,0,0.7)',
                    letterSpacing: '-0.5px',
                }}>
                    {text}
                </span>
            </div>
        </div>
    );
};

/** Highlight Reel — standard captions but with power words popping in gold/accent */
const HighlightReelCaption: React.FC<{ text: string, words?: any[] }> = ({ text, words }) => {
    const frame = useCurrentFrame();
    const opacity = interpolate(frame, [0, 5], [0, 1], { extrapolateRight: 'clamp' });
    
    // Split text into words and check for highlight flags
    const wordList = text.split(' ');
    
    return (
        <div style={{
            position: 'absolute', 
            bottom: '8%', left: '50%', transform: 'translate(-50%, 0)', 
            display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
            justifyContent: 'center', width: '80%', gap: '10px',
            opacity,
            zIndex: 100
        }}>
            {wordList.map((w, i) => {
                // Check if this word is flagged as highlight in the words array
                const wordData = words?.find((wd: any) => wd.word?.toLowerCase() === w.toLowerCase());
                const isHighlight = wordData?.isHighlight || false;
                // Also auto-detect power words
                const powerWords = ['million', 'billion', 'percent', 'guaranteed', 'exclusive', 'revolutionary', 'legendary', 'record', 'fastest', 'cheapest', 'biggest'];
                const autoHighlight = powerWords.some(pw => w.toLowerCase().includes(pw));
                const highlighted = isHighlight || autoHighlight;
                
                return (
                    <span key={i} style={{
                        display: 'inline-block',
                        fontFamily: '"Inter", "Geist", system-ui, sans-serif',
                        fontSize: highlighted ? '54px' : '46px',
                        fontWeight: highlighted ? 900 : 600,
                        color: highlighted ? '#FFD54A' : '#FFFFFF',
                        textShadow: highlighted 
                            ? '0px 0px 20px rgba(255,213,74,0.6), 0px 2px 4px rgba(0,0,0,0.9)' 
                            : '0px 2px 4px rgba(0,0,0,0.9), 0px 4px 15px rgba(0,0,0,0.8)',
                        transform: highlighted ? 'scale(1.1)' : 'none',
                        transition: 'all 0.15s ease',
                    }}>
                        {w}
                    </span>
                );
            })}
        </div>
    );
};


// ==========================================
// MAIN CAPTION DIRECTOR
// ==========================================
export const CaptionDirector = ({ scene }: any) => {
    const { fps } = useVideoConfig();
    
    if (!scene) return null;
    
    // Read caption_preset from Gemini's output (lives in both scene and visual)
    const preset = scene.caption_preset || scene.visual?.caption_preset || 'GlassPillCaption';
    
    if (preset === 'none') return null;
    
    const words = scene.words || [];
    if (words.length === 0) return null;
    
    const durationFrames = Math.max(1, Math.round(((scene.timing?.duration_ms || 3000) / 1000) * fps));
    const fullText = scene.voiceover_text || words.map((w: any) => w.word).join(" ");
    const sceneStartMs = scene.timing?.start_ms || 0;
    
    // ==========================================
    // PRESET: HeroKineticCaption — violent Z-axis slam for first 1-3 words (hook)
    // ==========================================
    if (preset === 'HeroKineticCaption') {
        // Only take the first 3 words for the slam
        const hookWords = words.slice(0, 3).map((w: any) => w.word);
        return (
            <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
                <KineticStack 
                    words={hookWords}
                    side="left"
                    layoutType="A"
                    durationFrames={durationFrames}
                />
            </AbsoluteFill>
        );
    }
    
    // ==========================================
    // PRESET: HighlightReelCaption — standard with power words in gold
    // ==========================================
    if (preset === 'HighlightReelCaption') {
        return (
            <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
                {buildTimedChunks(words, sceneStartMs, fps, (chunk) => (
                    <HighlightReelCaption text={chunk.text} words={chunk.words} />
                ))}
            </AbsoluteFill>
        );
    }
    
    // ==========================================
    // PRESET: PremiumLeftSpatial — 84px editorial text anchored left
    // ==========================================
    if (preset === 'PremiumLeftSpatial') {
        return (
            <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
                {buildTimedChunks(words, sceneStartMs, fps, (chunk) => (
                    <SpatialCaption text={chunk.text} side="left" />
                ))}
            </AbsoluteFill>
        );
    }
    
    // ==========================================
    // PRESET: PremiumRightSpatial — mirror of left
    // ==========================================
    if (preset === 'PremiumRightSpatial') {
        return (
            <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
                {buildTimedChunks(words, sceneStartMs, fps, (chunk) => (
                    <SpatialCaption text={chunk.text} side="right" />
                ))}
            </AbsoluteFill>
        );
    }
    
    // ==========================================
    // PRESET: LiquidMirrorCaption — luxurious fluid glassmorphism
    // ==========================================
    if (preset === 'LiquidMirrorCaption') {
        return (
            <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
                {buildTimedChunks(words, sceneStartMs, fps, (chunk) => (
                    <LiquidMirrorCaption text={chunk.text} />
                ))}
            </AbsoluteFill>
        );
    }
    
    // ==========================================
    // PRESET: CinematicDocumentaryCaption — serif typography with gold
    // ==========================================
    if (preset === 'CinematicDocumentaryCaption') {
        return (
            <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
                {buildTimedChunks(words, sceneStartMs, fps, (chunk) => (
                    <CinematicDocCaption text={chunk.text} />
                ))}
            </AbsoluteFill>
        );
    }
    
    // ==========================================
    // DEFAULT / GlassPillCaption — clean frosted glass pill
    // ==========================================
    return (
        <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
            {buildTimedChunks(words, sceneStartMs, fps, (chunk) => (
                <GlassPillCaption text={chunk.text} />
            ))}
        </AbsoluteFill>
    );
};


// ==========================================
// TIMING UTILITY — builds timed Sequence chunks from WhisperX words
// ==========================================
interface TimedChunk {
    text: string;
    words: any[];
    start_ms: number;
    end_ms: number;
}

function buildTimedChunks(
    words: any[], 
    sceneStartMs: number, 
    fps: number, 
    renderFn: (chunk: TimedChunk) => React.ReactNode
) {
    const chunks: TimedChunk[] = [];
    let cur: any[] = [];
    
    for (let i = 0; i < words.length; i++) {
        cur.push(words[i]);
        if (cur.length >= 5 || /[.!?]/.test(words[i].word) || i === words.length - 1) {
            chunks.push({
                text: cur.map(w => w.word).join(" "),
                words: cur,
                start_ms: cur[0].start_ms,
                end_ms: cur[cur.length - 1].end_ms
            });
            cur = [];
        }
    }
    
    return chunks.map((chunk, i) => {
        const sFrame = Math.max(0, Math.round(((chunk.start_ms - sceneStartMs) / 1000) * fps));
        const dFrames = Math.max(1, Math.round(((chunk.end_ms - chunk.start_ms) / 1000) * fps) + 8);
        return (
            <Sequence key={i} from={sFrame} durationInFrames={dFrames}>
                {renderFn(chunk)}
            </Sequence>
        );
    });
}
