import { useState, useEffect } from 'react';
import { staticFile, delayRender, continueRender } from 'remotion';

// Global cache so we only probe once per type across the entire render!
const maxCountCache: Record<string, number> = {};

export const useDynamicSfx = (type: string, globalIndex: number) => {
    const [resolvedPath, setResolvedPath] = useState<string | null>(null);
    const [handle] = useState(() => delayRender("Probing SFX count for " + type));

    useEffect(() => {
        let isCancelled = false;

        const probeFiles = async () => {
            // Map the type to the filename prefix
            let prefix = "general";
            if (type === "money") prefix = "money";
            if (type === "year") prefix = "year";
            if (type === "hp") prefix = "horsepower";
            if (type === "percent") prefix = "general"; // user didn't specify percent.wav, fallback to general
            if (type === "loss" || type === "gain") prefix = "general";
            if (type === "duration") prefix = "general";
            if (type === "impact") prefix = "impact";

            if (maxCountCache[prefix] === undefined) {
                let count = 1;
                while (count < 50) { // hard cap at 50 to prevent infinite loops just in case
                    const suffix = count === 1 ? '' : count;
                    const testUrl = staticFile(`audio/AnimatedNumber sfx/${prefix}${suffix}.wav`);
                    try {
                        const res = await fetch(testUrl, { method: 'HEAD' });
                        if (res.ok) {
                            count++;
                        } else {
                            break;
                        }
                    } catch (e) {
                        break;
                    }
                }
                maxCountCache[prefix] = count - 1;
            }

            if (isCancelled) return;

            const totalFiles = maxCountCache[prefix];
            if (totalFiles === 0) {
                setResolvedPath(null);
            } else {
                // Determine cyclic index (0-based)
                const cyclicIndex = globalIndex % totalFiles;
                // Add 1 to get the suffix number (1 gets '', 2 gets '2', etc.)
                const fileNumber = cyclicIndex + 1;
                const suffix = fileNumber === 1 ? '' : fileNumber.toString();
                setResolvedPath(`audio/AnimatedNumber sfx/${prefix}${suffix}.wav`);
            }
            continueRender(handle);
        };

        probeFiles();

        return () => {
            isCancelled = true;
        };
    }, [type, globalIndex, handle]);

    return resolvedPath;
};
