import React, { useMemo } from 'react';
import { AbsoluteFill, useVideoConfig, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { AnimatedNumber } from './AnimatedNumber';
import { detectHeroNumber, detectHeroWord, HeroMatch } from './HeroDetector';
import { AnimatedWord } from './AnimatedWord';
import { KineticStack } from './KineticStack';

import { CinematicDocumentaryCaption } from './CinematicDocumentaryCaption';
import { GlassPillCaption } from './GlassPillCaption';
import { HighlightReelCaption } from './HighlightReelCaption';
import { LiquidMirrorCaption } from './LiquidMirrorCaption';
import { PremiumLeftSpatial } from './PremiumLeftSpatial';
import { PremiumRightSpatial } from './PremiumRightSpatial';

interface Word {
    word: string;
    start_ms: number;
    end_ms: number;
}

interface Props {
    words: Word[];
}

export const CaptionDirector = ({ words, sceneIndex, variants, sceneStartMs }: any) => {
    const { fps } = useVideoConfig();

    const chunks = useMemo(() => {
        const result = [];
        let currentChunk: Word[] = [];
        let lastHeroTime = -10000;

        const typeCounts: Record<string, number> = {};

        for (let i = 0; i < words.length; i++) {
            currentChunk.push(words[i]);
            
            const lastWord = words[i].word;
            const isEndOfSentence = /[.!?]/.test(lastWord);
            
            if (currentChunk.length >= 3 || isEndOfSentence || i === words.length - 1) {
                const start_ms = currentChunk[0].start_ms;
                const end_ms = currentChunk[currentChunk.length - 1].end_ms;
                const chunkText = currentChunk.map(w => w.word).join(" ");

                let heroInfo: HeroMatch | null = null;
                let isHeroWord = false;
                
                // Let the engine detect if there is a number or impact word
                if (start_ms - lastHeroTime >= 2500) {
                    const match = detectHeroNumber(chunkText);
                    if (match) {
                        const currentCount = typeCounts[match.type] || 0;
                        typeCounts[match.type] = currentCount + 1;

                        let exact_start_ms = start_ms;
                        const matchLower = match.value.toLowerCase();
                        for (const w of currentChunk) {
                            if (matchLower.includes(w.word.toLowerCase()) || w.word.toLowerCase().includes(matchLower)) {
                                exact_start_ms = w.start_ms;
                                break;
                            }
                        }

                        heroInfo = { ...match, globalIndex: currentCount, exact_start_ms };
                        lastHeroTime = exact_start_ms;
                    } else {
                        const wordMatch = detectHeroWord(chunkText);
                        if (wordMatch) {
                            const currentCount = typeCounts['impact'] || 0;
                            typeCounts['impact'] = currentCount + 1;
                            
                            let exact_start_ms = start_ms;
                            const matchLower = wordMatch.value.toLowerCase();
                            for (const w of currentChunk) {
                                if (matchLower.includes(w.word.toLowerCase()) || w.word.toLowerCase().includes(matchLower)) {
                                    exact_start_ms = w.start_ms;
                                    break;
                                }
                            }
                            
                            heroInfo = { ...wordMatch, globalIndex: currentCount, exact_start_ms };
                            isHeroWord = true;
                            lastHeroTime = exact_start_ms;
                        }
                    }
                }

                result.push({
                    words: currentChunk,
                    start_ms,
                    end_ms,
                    chunkText,
                    heroInfo,
                    isHeroWord
                });

                currentChunk = [];
            }
        }
        return result;
    }, [words]);

    const preRollMs = 100;
    const preset = (variants?.captionPreset || 'GlassPill').toLowerCase();
    
    // Support mapping HeroKineticCaption to KineticStack
    const isHeroKinetic = preset.includes('herokinetic');

    return (
        <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 100 }}>
            <style>
               {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap');`}
            </style>
            
            {chunks.map((chunk, i) => {
                const relativeStartMs = chunk.start_ms - (sceneStartMs || 0) - preRollMs;
                const startFrame = (relativeStartMs / 1000) * fps;
                const durationFrames = ((chunk.end_ms - chunk.start_ms + preRollMs) / 1000) * fps;
                
                const heroOffsetFrames = chunk.heroInfo ? Math.max(0, ((chunk.heroInfo.exact_start_ms - chunk.start_ms) / 1000) * fps) : 0;
                const heroDurationFrames = Math.max(1, durationFrames - heroOffsetFrames);
                
                const mappedScript = chunk.words.map((w: any) => {
                    const wordStartFrame = ((w.start_ms - chunk.start_ms) / 1000) * fps;
                    const wordEndFrame = ((w.end_ms - chunk.start_ms) / 1000) * fps;
                    let isHighlight = false;
                    if (chunk.isHeroWord && chunk.heroInfo && chunk.heroInfo.value.toLowerCase().includes(w.word.toLowerCase())) {
                        isHighlight = true;
                    }
                    return {
                        word: w.word,
                        start: Math.max(0, wordStartFrame),
                        end: Math.max(0, wordEndFrame),
                        isHighlight
                    };
                });

                let CaptionComponent = <GlassPillCaption script={mappedScript} />;
                if (preset.includes('cinematic') || preset.includes('documentary')) {
                    CaptionComponent = <CinematicDocumentaryCaption script={mappedScript} />;
                } else if (preset.includes('highlight')) {
                    CaptionComponent = <HighlightReelCaption script={mappedScript} />;
                } else if (preset.includes('liquid') || preset.includes('mirror')) {
                    CaptionComponent = <LiquidMirrorCaption script={mappedScript} />;
                } else if (preset.includes('left')) {
                    CaptionComponent = <PremiumLeftSpatial script={mappedScript} />;
                } else if (preset.includes('right')) {
                    CaptionComponent = <PremiumRightSpatial script={mappedScript} />;
                }
                
                return (
                    <Sequence key={i} from={Math.max(0, startFrame)} durationInFrames={Math.max(1, durationFrames)}>
                        {isHeroKinetic ? (
                            <Sequence from={0} durationInFrames={durationFrames}>
                                <KineticStack 
                                    words={chunk.words.map((w: any) => w.word)}
                                    side={i % 2 === 0 ? 'left' : 'right'}
                                    layoutType={i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C'}
                                    durationFrames={durationFrames}
                                />
                            </Sequence>
                        ) : (
                            <>
                                {CaptionComponent}
                                {chunk.heroInfo && !chunk.isHeroWord && (
                                    <Sequence from={heroOffsetFrames} durationInFrames={heroDurationFrames}>
                                        <AnimatedNumber 
                                            numericValue={chunk.heroInfo.numericValue || 0} 
                                            type={chunk.heroInfo.type} 
                                            durationFrames={heroDurationFrames}
                                            globalIndex={chunk.heroInfo.globalIndex || 0}
                                        />
                                    </Sequence>
                                )}
                            </>
                        )}
                    </Sequence>
                );
            })}
            
        </AbsoluteFill>
    );
};
