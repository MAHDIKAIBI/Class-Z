import React from 'react';
import { AbsoluteFill, useVideoConfig, Sequence } from 'remotion';
import { GlassPillCaption } from './GlassPillCaption';
import { CinematicDocumentaryCaption } from './CinematicDocumentaryCaption';
import { HighlightReelCaption } from './HighlightReelCaption';
import { LiquidMirrorCaption } from './LiquidMirrorCaption';
import { PremiumLeftSpatial } from './PremiumLeftSpatial';
import { PremiumRightSpatial } from './PremiumRightSpatial';
import { KineticStack } from './KineticStack';

// ==========================================
// TIMING UTILITY
// ==========================================
export type WordTiming = {
    word: string;
    start: number;
    end: number;
};

interface TimedChunk {
    words: any[];
    start_ms: number;
    end_ms: number;
}

function buildTimedChunks(words: any[]): TimedChunk[] {
    const chunks: TimedChunk[] = [];
    let cur: any[] = [];
    
    for (let i = 0; i < words.length; i++) {
        let w = words[i];
        
        // Merge WhisperX split contractions (e.g. "you", "'re")
        if (cur.length > 0 && /^[.,!?;:'’]/.test(w.word)) {
            cur[cur.length - 1].word += w.word;
            cur[cur.length - 1].end_ms = w.end_ms;
        } else {
            cur.push({...w});
        }
        
        if (cur.length >= 6 || /[.!?]/.test(w.word) || i === words.length - 1) {
            chunks.push({
                words: cur,
                start_ms: cur[0].start_ms,
                end_ms: cur[cur.length - 1].end_ms
            });
            cur = [];
        }
    }
    return chunks;
}

// ==========================================
// MAIN CAPTION DIRECTOR
// Routes Gemini's caption_preset to the correct
// per-word standalone component from the Desktop vault.
// ==========================================
export const CaptionDirector = ({ scene }: any) => {
    const { fps } = useVideoConfig();
    
    if (!scene) return null;
    
    const preset = scene.caption_preset || scene.visual?.caption_preset || 'GlassPillCaption';
    if (preset === 'none') return null;
    
    const words = scene.words || [];
    if (words.length === 0) return null;
    
    const sceneStartMs = scene.timing?.start_ms || 0;
    const durationFrames = Math.max(1, Math.round(((scene.timing?.duration_ms || 3000) / 1000) * fps));
    
    // HeroKineticPunch preset
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
    
    const chunks = buildTimedChunks(words);
    
    return (
        <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
            {chunks.map((chunk, i) => {
                const chunkStartFrame = Math.max(0, Math.round(((chunk.start_ms - sceneStartMs) / 1000) * fps));
                // Add a small 10-frame pad to chunk duration so text settles smoothly before unmounting
                const chunkDurationFrames = Math.max(1, Math.round(((chunk.end_ms - chunk.start_ms) / 1000) * fps) + 15);
                
                // Map to WordTiming relative to the chunk's start frame
                const script: WordTiming[] = chunk.words.map((w) => ({
                    word: w.word,
                    start: Math.max(0, Math.round(((w.start_ms - chunk.start_ms) / 1000) * fps)),
                    end: Math.max(0, Math.round(((w.end_ms - chunk.start_ms) / 1000) * fps))
                }));
                
                let CaptionComponent = <GlassPillCaption script={script} />;
                
                if (preset === 'HighlightReelCaption') CaptionComponent = <HighlightReelCaption script={script} />;
                else if (preset === 'PremiumLeftSpatial') CaptionComponent = <PremiumLeftSpatial script={script} />;
                else if (preset === 'PremiumRightSpatial') CaptionComponent = <PremiumRightSpatial script={script} />;
                else if (preset === 'LiquidMirrorCaption') CaptionComponent = <LiquidMirrorCaption script={script} />;
                else if (preset === 'CinematicDocumentaryCaption') CaptionComponent = <CinematicDocumentaryCaption script={script} />;

                return (
                    <Sequence key={i} from={chunkStartFrame} durationInFrames={chunkDurationFrames}>
                        {CaptionComponent}
                    </Sequence>
                );
            })}
        </AbsoluteFill>
    );
};
