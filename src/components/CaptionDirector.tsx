import React, { useMemo } from 'react';
import { AbsoluteFill, useVideoConfig, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { AnimatedNumber } from './AnimatedNumber';
import { detectHeroNumber, detectHeroWord, HeroMatch } from './HeroDetector';
import { AnimatedWord } from './AnimatedWord';
import { KineticStack } from './KineticStack';

interface Word {
    word: string;
    start_ms: number;
    end_ms: number;
}

interface Props {
    words: Word[];
}

const BottomCaption: React.FC<{ text: string }> = ({ text }) => {
    const frame = useCurrentFrame();
    const opacity = interpolate(frame, [0, 5], [0, 1], { extrapolateRight: 'clamp' });
    
    return (
        <div style={{
            position: 'absolute', 
            bottom: '8%', left: '50%', transform: 'translate(-50%, 0)', 
            display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
            justifyContent: 'center', width: '80%', gap: '15px',
            opacity: opacity,
            zIndex: 100
        }}>
            <span style={{
                display: 'inline-block',
                fontFamily: '"Inter", sans-serif',
                fontSize: '48px',
                fontWeight: 600,
                color: '#FFFFFF',
                textShadow: '0px 2px 4px rgba(0,0,0,0.9), 0px 4px 15px rgba(0,0,0,0.8), 0px 0px 30px rgba(0,0,0,0.5)',
            }}>
                {text}
            </span>
        </div>
    );
};

export const CaptionDirector = ({ words, sceneIndex, variants, sceneStartMs }: any) => {
    const { fps } = useVideoConfig();

    const chunks = useMemo(() => {
        const result = [];
        let currentChunk: Word[] = [];
        let lastHeroTime = -10000;

        // Keep track of counts across the video for the cyclic audio logic
        const typeCounts: Record<string, number> = {};
        let hasTriggeredKineticThisScene = false;

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
                let bottomText = chunkText;
                
                let isKinetic = false;
                let kineticSide: 'left' | 'right' | null = null;
                let kineticLayout: 'A' | 'B' | 'C' | null = null;

                const windowNum = Math.floor(start_ms / 15000);
                const offset = start_ms % 15000;
                const isEligibleKinetic = offset < 6000 && !hasTriggeredKineticThisScene && currentChunk.length >= 2 && currentChunk.length <= 5;

                if (isEligibleKinetic) {
                    isKinetic = true;
                    kineticSide = windowNum % 2 === 0 ? 'left' : 'right';
                    const layouts: ('A'|'B'|'C')[] = ['A', 'B', 'C'];
                    kineticLayout = layouts[windowNum % 3];
                    hasTriggeredKineticThisScene = true;
                    bottomText = ""; // Disable standard caption
                } else if (start_ms - lastHeroTime >= 2500) {
                    const match = detectHeroNumber(chunkText);
                    if (match) {
                        const currentCount = typeCounts[match.type] || 0;
                        typeCounts[match.type] = currentCount + 1;

                        heroInfo = { ...match, globalIndex: currentCount };
                        lastHeroTime = start_ms;
                        
                        // Only keep text AFTER the Hero Match
                        const matchIndex = chunkText.toLowerCase().indexOf(match.value.toLowerCase());
                        if (matchIndex !== -1) {
                            bottomText = chunkText.substring(matchIndex + match.value.length).replace(/^[.,!?;:]\s*/, '').trim();
                        } else {
                            bottomText = "";
                        }
                    } else {
                        const wordMatch = detectHeroWord(chunkText);
                        if (wordMatch) {
                            const currentCount = typeCounts['impact'] || 0;
                            typeCounts['impact'] = currentCount + 1;
                            
                            heroInfo = { ...wordMatch, globalIndex: currentCount };
                            isHeroWord = true;
                            lastHeroTime = start_ms;
                            
                            // Only keep text AFTER the Hero Match
                            const matchIndex = chunkText.toLowerCase().indexOf(wordMatch.value.toLowerCase());
                            if (matchIndex !== -1) {
                                bottomText = chunkText.substring(matchIndex + wordMatch.value.length).replace(/^[.,!?;:]\s*/, '').trim();
                            } else {
                                bottomText = "";
                            }
                        }
                    }
                }

                result.push({
                    words: currentChunk,
                    start_ms,
                    end_ms,
                    chunkText,
                    bottomText,
                    heroInfo,
                    isHeroWord,
                    isKinetic,
                    kineticSide,
                    kineticLayout
                });

                currentChunk = [];
            }
        }
        return result;
    }, [words]);

    const preRollMs = 100;

    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
            <style>
               {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap');`}
            </style>
            
            {chunks.map((chunk, i) => {
                const relativeStartMs = chunk.start_ms - (sceneStartMs || 0) - preRollMs;
                const startFrame = (relativeStartMs / 1000) * fps;
                const durationFrames = ((chunk.end_ms - chunk.start_ms + preRollMs) / 1000) * fps;
                
                return (
                    <Sequence key={i} from={Math.max(0, startFrame)} durationInFrames={Math.max(1, durationFrames)}>
                        {chunk.isKinetic ? (
                            <Sequence from={0} durationInFrames={durationFrames}>
                                <KineticStack 
                                    words={chunk.words.map((w: any) => w.word)}
                                    side={chunk.kineticSide}
                                    layoutType={chunk.kineticLayout}
                                    durationFrames={durationFrames}
                                />
                            </Sequence>
                        ) : (
                            <>
                                {chunk.bottomText && <BottomCaption text={chunk.bottomText} />}
                                {chunk.heroInfo && !chunk.isHeroWord && (
                                    <Sequence from={0} durationInFrames={durationFrames}>
                                        <AnimatedNumber 
                                            numericValue={chunk.heroInfo.numericValue || 0} 
                                            type={chunk.heroInfo.type} 
                                            durationFrames={durationFrames}
                                            globalIndex={chunk.heroInfo.globalIndex || 0}
                                        />
                                    </Sequence>
                                )}
                                {chunk.heroInfo && chunk.isHeroWord && (
                                    <Sequence from={0} durationInFrames={durationFrames}>
                                        <AnimatedWord 
                                            word={chunk.heroInfo.value}
                                            globalIndex={chunk.heroInfo.globalIndex || 0}
                                            durationFrames={durationFrames}
                                            category={chunk.heroInfo.category}
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
