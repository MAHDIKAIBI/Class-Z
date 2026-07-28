import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import React, { useMemo } from "react";

export type WordTiming = {
  word: string;
  start: number;
  end: number;
  isHighlight?: boolean;
};

const ACCENT_PALETTE = [
  "#FF8C42", "#C77DFF", "#00D4FF", "#FF3D71", "#FFD93D", 
  "#6BFFA8", "#FF6B6B", "#FFA07A", "#B5EAD7", "#FFE66D"
];

const FUNCTION_WORDS = new Set([
  "the","a","an","is","are","was","were","be","been","being",
  "to","of","and","in","for","on","with","as","at","by","from",
  "or","but","not","it","he","she","they","we","you","i",
  "my","your","his","her","its","our","their","that","this","which",
  "have","has","had","do","does","did","will","would","could","should",
  "may","might","can","up","out","so","if","about","than","then","just"
]);

function findStressedWordIndex(words: WordTiming[]): number {
  if (words.length === 0) return -1;
  if (words.length === 1) return 0;
  let bestIdx = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < words.length; i++) {
    const clean = words[i].word.toLowerCase().replace(/[^a-z]/g, "");
    if (FUNCTION_WORDS.has(clean) && words.length > 2) continue;
    const score = (words[i].end - words[i].start) * 0.6 + clean.length * 4;
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }
  return bestIdx >= 0 ? bestIdx : 0;
}

function groupWordsIntoLines(words: WordTiming[]): WordTiming[][] {
  const lines: WordTiming[][] = [];
  let currentLine: WordTiming[] = [];
  let currentLen = 0;
  for (const w of words) {
    const clean = w.word.replace(/[^a-zA-Z]/g, "");
    if (currentLine.length > 0 && (currentLen + clean.length > 18 || currentLine.length >= 3)) {
      lines.push(currentLine);
      currentLine = [w];
      currentLen = clean.length;
    } else {
      currentLine.push(w);
      currentLen += clean.length;
    }
  }
  if (currentLine.length > 0) lines.push(currentLine);
  return lines;
}

function lineFontSize(line: WordTiming[]): number {
  const len = line.reduce((acc, w) => acc + w.word.replace(/[^a-zA-Z]/g, "").length, 0);
  if (len > 18) return 60;
  if (len > 14) return 75;
  if (len > 10) return 90;
  return 110;
}

const MAX_ROWS = 4;

interface Props { script: WordTiming[]; chunkIndex?: number; }

export const PremiumRightSpatial: React.FC<Props> = ({ script, chunkIndex = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = useMemo(() => groupWordsIntoLines(script || []), [script]);
  if (!lines.length) return null;

  const accentColor = ACCENT_PALETTE[chunkIndex % ACCENT_PALETTE.length];
  const stressedIdx = findStressedWordIndex(script);

  let latestTriggeredIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (frame >= lines[i][0].start) latestTriggeredIdx = i;
  }
  if (latestTriggeredIdx < 0) return null;

  const windowEnd = latestTriggeredIdx;
  const windowStart = Math.max(0, windowEnd - MAX_ROWS + 1);
  
  // Perpetual 3D drift container
  // For Right: scale up slightly, drift left slightly
  const containerElapsed = Math.max(0, frame - lines[0][0].start);
  const driftScale = interpolate(containerElapsed, [0, 150], [1, 1.08], { extrapolateRight: "clamp" });
  const driftX = interpolate(containerElapsed, [0, 150], [0, -40], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        right: "5%",
        top: "50%",
        transform: `translateY(-50%) perspective(1000px) rotateY(-10deg) scale(${driftScale}) translateX(${driftX}px)`,
        transformOrigin: "right center",
        width: "45%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end", // Right aligned
        gap: "4px",
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      {lines.map((line, lineIndex) => {
        const hasTriggered = frame >= line[0].start;
        const inWindow = lineIndex >= windowStart && lineIndex <= windowEnd;
        if (!hasTriggered || !inWindow) return null;

        const elapsed = Math.max(0, frame - line[0].start);
        const revealSpring = spring({ frame: elapsed, fps, config: { damping: 18, stiffness: 300, mass: 1.2 } });
        
        const opacity = interpolate(revealSpring, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
        const xShift = interpolate(revealSpring, [0, 1], [30, 0]);
        const blur = interpolate(revealSpring, [0, 1], [15, 0], { extrapolateRight: "clamp" });
        const fontSize = lineFontSize(line);

        return (
          <div
            key={lineIndex}
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: "14px",
              opacity,
              transform: `translateX(${xShift}px)`,
              filter: `blur(${blur}px)`,
            }}
          >
            {line.map((item, wordIdx) => {
              // Find global index to check if it's the stressed word
              const globalIdx = script.findIndex(s => s === item);
              const isStressed = globalIdx === stressedIdx;

              // Sub-word spring for sequential word pop within the line
              const wordElapsed = Math.max(0, frame - item.start);
              const wordSpring = spring({ frame: wordElapsed, fps, config: { damping: 20, stiffness: 400 } });
              const wordY = interpolate(wordSpring, [0, 1], [15, 0]);

              return (
                <span
                  key={wordIdx}
                  style={{
                    color: isStressed ? accentColor : "#FFFFFF",
                    fontSize: `${fontSize}px`,
                    fontFamily: '"Inter", "Geist", system-ui, sans-serif',
                    fontWeight: 900,
                    textTransform: "uppercase",
                    lineHeight: 0.95,
                    letterSpacing: "-3.5px",
                    transform: `translateY(${wordY}px)`,
                    opacity: wordElapsed > 0 ? 1 : 0.001, // hide until its exact start frame
                    textShadow: isStressed 
                      ? `0 0 35px ${accentColor}, -3px 4px 0px rgba(0,0,0,1), -6px 8px 15px rgba(0,0,0,0.9)`
                      : `-3px 4px 0px rgba(0,0,0,1), -6px 8px 15px rgba(0,0,0,0.9)`, // Notice shadows go left for Right Spatial
                  }}
                >
                  {item.word}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};