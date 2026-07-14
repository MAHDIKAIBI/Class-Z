import React, { useMemo } from 'react';
import { useCurrentFrame, Easing, interpolate, random } from 'remotion';

type Preset = 'push_in' | 'pull_out' | 'pan_left' | 'pan_right' | 'pan_up' | 'pan_down' | 'push_left' | 'push_right' | 'none';

export const SmartMotion: React.FC<{
    children: React.ReactNode;
    durationFrames: number;
    sceneId: string | number;
}> = ({ children, durationFrames, sceneId }) => {
    const frame = useCurrentFrame();

    const safeFrame = Math.min(Math.max(0, frame), durationFrames);

    const { preset, speedMultiplier, rotationAmount } = useMemo(() => {
        const r = random(String(sceneId) + "preset");
        
        // Speed modifier: Randomly pick 0.85x, 1.0x, or 1.1x
        const speedRnd = random(String(sceneId) + "speed");
        const speedMultiplier = speedRnd < 0.33 ? 0.85 : speedRnd < 0.66 ? 1.0 : 1.1;

        // Rotation: 60% chance to have a slight rotation drift (between -2 and 2 degrees)
        const rotRnd = random(String(sceneId) + "rot");
        const rotationAmount = rotRnd < 0.6 ? (random(String(sceneId) + "rotAmt") * 4 - 2) : 0; 

        let selected: Preset = 'none';

        if (r < 0.25) selected = 'push_in';
        else if (r < 0.40) selected = 'pull_out';
        else if (r < 0.52) selected = 'pan_left';
        else if (r < 0.64) selected = 'pan_right';
        else if (r < 0.72) selected = 'pan_up';
        else if (r < 0.80) selected = 'pan_down';
        else if (r < 0.88) selected = 'push_left';
        else if (r < 0.96) selected = 'push_right';
        else selected = 'none'; // 4% chance of purely nothing (except maybe rotation)

        return { preset: selected, speedMultiplier, rotationAmount };
    }, [sceneId]);

    // Cubic ease-out that feels extremely organic and premium.
    const progress = interpolate(safeFrame, [0, durationFrames], [0, 1], {
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    // Max limits:
    const maxPush = 1.0 + (0.09 * speedMultiplier); // Never exceeds 109% (1.099 at most)
    const maxPan = 60 * speedMultiplier; 
    const maxPanSmall = 40 * speedMultiplier;

    let scale = 1.0;
    let x = 0;
    let y = 0;
    let rotate = progress * rotationAmount;

    switch (preset) {
        case 'push_in':
            scale = 1.0 + (progress * (maxPush - 1.0));
            break;
        case 'pull_out':
            scale = maxPush - (progress * (maxPush - 1.0));
            break;
        case 'pan_left':
            scale = 1.06; // Needs slight scale to avoid edge clipping
            x = -(progress * maxPan);
            break;
        case 'pan_right':
            scale = 1.06;
            x = (progress * maxPan);
            break;
        case 'pan_up':
            scale = 1.06;
            y = -(progress * maxPanSmall);
            break;
        case 'pan_down':
            scale = 1.06;
            y = (progress * maxPanSmall);
            break;
        case 'push_left':
            scale = 1.0 + (progress * (maxPush - 1.0));
            x = -(progress * maxPanSmall);
            break;
        case 'push_right':
            scale = 1.0 + (progress * (maxPush - 1.0));
            x = (progress * maxPanSmall);
            break;
        case 'none':
            scale = 1.0;
            break;
    }

    return (
        <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            transform: `scale(${scale}) translate(${x}px, ${y}px) rotate(${rotate}deg)`,
            transformOrigin: 'center center',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            willChange: 'transform'
        }}>
            {children}
        </div>
    );
};
