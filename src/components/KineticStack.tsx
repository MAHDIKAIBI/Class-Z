import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';

export const KineticStack: React.FC<{
    words: string[];
    side: 'left' | 'right';
    layoutType: 'A' | 'B' | 'C';
    durationFrames: number;
}> = ({ words, side = 'left', layoutType = 'A' }) => {
    const frame = useCurrentFrame();

    // Group words into lines based on layout
    const lines: { text: string, globalIndex: number }[][] = [];

    if (layoutType === 'A') {
        for (let i = 0; i < words.length; i++) {
            lines.push([{ text: words[i], globalIndex: i }]);
        }
    } else if (layoutType === 'B') {
        for (let i = 0; i < words.length; i += 2) {
            const line = [{ text: words[i], globalIndex: i }];
            if (i + 1 < words.length) {
                line.push({ text: words[i + 1], globalIndex: i + 1 });
            }
            lines.push(line);
        }
    } else if (layoutType === 'C') {
        if (words.length > 0) lines.push([{ text: words[0], globalIndex: 0 }]);
        if (words.length > 1) {
            const line2 = [{ text: words[1], globalIndex: 1 }];
            if (words.length > 2) line2.push({ text: words[2], globalIndex: 2 });
            lines.push(line2);
        }
        if (words.length > 3) lines.push([{ text: words[3], globalIndex: 3 }]);
        if (words.length > 4) lines.push([{ text: words[4], globalIndex: 4 }]);
    }

    // Base font size 170. Reduce if a word is very long.
    const maxWordLength = Math.max(...words.map(w => w.length));
    const fontSize = maxWordLength > 8 ? 120 : 170;

    return (
        <AbsoluteFill style={{
            justifyContent: 'center',
            alignItems: side === 'left' ? 'flex-start' : 'flex-end',
            paddingLeft: side === 'left' ? '80px' : '0px',
            paddingRight: side === 'right' ? '80px' : '0px',
            top: '-5%', // Shift up slightly to be around 45% screen height
            zIndex: 100 // Ensure it's above other elements
        }}>
            <link href="https://fonts.googleapis.com/css2?family=Anton&display=swap" rel="stylesheet" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: side === 'left' ? 'flex-start' : 'flex-end' }}>
                {lines.map((line, lineIndex) => (
                    <div key={lineIndex} style={{ display: 'flex', flexDirection: 'row', gap: '30px' }}>
                        {line.map((w) => {
                            const delay = w.globalIndex * 3; // 3 frames offset
                            const startFrame = delay;
                            
                            const progress = interpolate(frame - startFrame, [0, 8], [0, 1], {
                                extrapolateLeft: 'clamp',
                                extrapolateRight: 'clamp',
                                easing: Easing.out(Easing.cubic)
                            });

                            const slideX = interpolate(progress, [0, 1], [side === 'left' ? -120 : 120, 0]);
                            const opacity = progress;
                            const scale = interpolate(progress, [0, 1], [0.95, 1]);

                            return (
                                <span key={w.globalIndex} style={{
                                    fontFamily: '"Anton", "Impact", sans-serif',
                                    fontSize: `${fontSize}px`,
                                    color: 'white',
                                    textShadow: '0 4px 10px rgba(0,0,0,0.5)',
                                    transform: `translateX(${slideX}px) scale(${scale})`,
                                    opacity: opacity,
                                    lineHeight: '0.9',
                                    textTransform: 'uppercase',
                                    display: 'inline-block' // needed for transform to work correctly
                                }}>
                                    {w.text}
                                </span>
                            );
                        })}
                    </div>
                ))}
            </div>
        </AbsoluteFill>
    );
};
