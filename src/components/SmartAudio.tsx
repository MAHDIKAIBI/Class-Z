import React, { useMemo } from 'react';
import { Audio, useCurrentFrame, interpolate, staticFile } from 'remotion';

interface Props {
    src: string;
    durationFrames: number;
}

export const SmartAudio: React.FC<Props> = ({ src, durationFrames }) => {
    const frame = useCurrentFrame();

    // 1. Trim to duration: The parent <Sequence> inherently trims the audio to durationFrames.
    // 2. Fade in (2 frames), Fade out (4 frames)
    const volume = interpolate(
        frame,
        [0, 2, durationFrames - 4, durationFrames],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // 3. Randomize start point slightly (0 to 15 frames) to reduce repetition
    const startFrom = useMemo(() => {
        return Math.floor(Math.random() * 15);
    }, []);

    return <Audio src={staticFile(src)} volume={volume} startFrom={startFrom} onError={(e) => console.log("Media playback error caught on Audio:", e)} />;
};
