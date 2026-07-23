import React from 'react';
import { AbsoluteFill, useVideoConfig, Sequence } from 'remotion';
import { KineticStack } from './KineticStack';

// Import the ACTUAL per-word standalone components (Desktop vault)
import { GlassPillCaption as GlassPillCaptionVault } from './GlassPillCaption';
import { CinematicDocumentaryCaption } from './CinematicDocumentaryCaption';
import { HighlightReelCaption as HighlightReelCaptionVault } from './HighlightReelCaption';
import { LiquidMirrorCaption as LiquidMirrorCaptionVault } from './LiquidMirrorCaption';
import { PremiumLeftSpatial } from './PremiumLeftSpatial';
import { PremiumRightSpatial } from './PremiumRightSpatial';


// ==========================================
// MAIN CAPTION DIRECTOR
// Routes Gemini's caption_preset to the correct
// per-word standalone component from the Desktop vault.
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
    const sceneStartMs = scene.timing?.start_ms || 0;
    
    // ==========================================
    // PRESET: HeroKineticCaption — violent Z-axis slam for first 1-3 words (hook)
    // This preset does NOT use per-word timing. It takes raw words and slams them.
    // ==========================================
    if (preset === 'HeroKineticCaption') {
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
    // ALL OTHER PRESETS: Per-word timing via standalone components
    // Chunks words into groups of ≤5, wraps each in a timed Sequence,
    // builds per-word script arrays with frame offsets relative to chunk start.
    // ==========================================
    return (
        <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
            {buildTimedChunksWithScript(words, sceneStartMs, fps, preset)}
        </AbsoluteFill>
    );
};


// ==========================================
// TIMING UTILITY — builds timed Sequence chunks from WhisperX words
// and passes per-word script arrays to the standalone components.
// ==========================================
interface WordChunk {
    words: any[];
    start_ms: number;
    end_ms: number;
}

function buildTimedChunksWithScript(
    words: any[], 
    sceneStartMs: number, 
    fps: number, 
    preset: string
) {
    // 1. Group words into chunks of ≤5, breaking on punctuation
    const chunks: WordChunk[] = [];
    let cur: any[] = [];
    
    for (let i = 0; i < words.length; i++) {
        cur.push(words[i]);
        if (cur.length >= 5 || /[.!?]/.test(words[i].word) || i === words.length - 1) {
            chunks.push({
                words: cur,
                start_ms: cur[0].start_ms,
                end_ms: cur[cur.length - 1].end_ms
            });
            cur = [];
        }
    }
    
    // 2. For each chunk, create a timed Sequence with per-word script
    return chunks.map((chunk, i) => {
        const sFrame = Math.max(0, Math.round(((chunk.start_ms - sceneStartMs) / 1000) * fps));
        const dFrames = Math.max(1, Math.round(((chunk.end_ms - chunk.start_ms) / 1000) * fps) + 8);
        
        // Build per-word script with timing relative to chunk start (frame 0 = chunk start)
        const script = chunk.words.map((w: any) => ({
            word: w.word,
            start: Math.max(0, Math.round(((w.start_ms - chunk.start_ms) / 1000) * fps)),
            end: Math.max(1, Math.round(((w.end_ms - chunk.start_ms) / 1000) * fps)),
            // HighlightReelCaption needs isHighlight on each word
            isHighlight: w.isHighlight || false
        }));
        
        // Auto-detect power words for HighlightReelCaption
        if (preset === 'HighlightReelCaption') {
            const powerWords = [
                'million', 'billion', 'percent', 'guaranteed', 'exclusive', 
                'revolutionary', 'legendary', 'record', 'fastest', 'cheapest', 
                'biggest', 'massive', 'insane', 'incredible', 'unbelievable',
                'dominate', 'destroy', 'crushing', 'unstoppable'
            ];
            script.forEach((item: any) => {
                if (!item.isHighlight) {
                    item.isHighlight = powerWords.some(
                        (pw: string) => item.word.toLowerCase().includes(pw)
                    );
                }
            });
        }
        
        return (
            <Sequence key={i} from={sFrame} durationInFrames={dFrames}>
                {renderPresetComponent(preset, script)}
            </Sequence>
        );
    });
}


// ==========================================
// COMPONENT ROUTER — maps preset name to standalone component
// ==========================================
function renderPresetComponent(preset: string, script: any[]) {
    switch (preset) {
        // Per-word neon green glow on isHighlight words
        case 'HighlightReelCaption':
            return <HighlightReelCaptionVault script={script} />;
        
        // Per-word volumetric Y-axis blur reveal, anchored left
        case 'PremiumLeftSpatial':
            return <PremiumLeftSpatial script={script} />;
        
        // Per-word volumetric Y-axis blur reveal, anchored right
        case 'PremiumRightSpatial':
            return <PremiumRightSpatial script={script} />;
        
        // Per-word swell (high damping, low stiffness), sweeping glare
        case 'LiquidMirrorCaption':
            return <LiquidMirrorCaptionVault script={script} />;
        
        // Per-word gold (#E2B714) color shift, serif typography
        case 'CinematicDocumentaryCaption':
            return <CinematicDocumentaryCaption script={script} />;
        
        // Per-word white glow, frosted glass pill container
        case 'GlassPillCaption':
        default:
            return <GlassPillCaptionVault script={script} />;
    }
}
