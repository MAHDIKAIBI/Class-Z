export type HeroType = 'money' | 'year' | 'percent' | 'hp' | 'duration' | 'loss' | 'gain' | 'generic' | 'impact';

export interface HeroMatch {
    type: HeroType;
    value: string; 
    numericValue?: number; // make optional since HeroWords don't have this
    globalIndex?: number; // added to track the cycle
    category?: string; // added to style HeroWords
}

export const detectHeroNumber = (text: string): HeroMatch | null => {
    // Helper to extract true numeric value
    const parseNumber = (numStr: string, suffixStr: string = "") => {
        let val = parseFloat(numStr.replace(/,/g, ''));
        const s = suffixStr.trim().toLowerCase();
        if (s === 'million' || s === 'm') val *= 1000000;
        else if (s === 'billion' || s === 'b') val *= 1000000000;
        else if (s === 'thousand' || s === 'k') val *= 1000;
        return val;
    };

    const moneyMatch = text.match(/\$(\d+(?:[.,]\d+)?)\s?(Million|Billion|Thousand|M|B|K)?/i);
    if (moneyMatch) return { type: 'money', value: moneyMatch[0], numericValue: parseNumber(moneyMatch[1], moneyMatch[2]) };

    const percentMatch = text.match(/([\d.,]+)\s?%/);
    if (percentMatch) return { type: 'percent', value: percentMatch[0], numericValue: parseFloat(percentMatch[1]) };

    const hpMatch = text.match(/([\d.,]+)\s?HP/i);
    if (hpMatch) return { type: 'hp', value: hpMatch[0], numericValue: parseFloat(hpMatch[1]) };

    const durationMatch = text.match(/([\d.,]+)\s?(Seconds?)/i);
    if (durationMatch) return { type: 'duration', value: durationMatch[0], numericValue: parseFloat(durationMatch[1]) };

    const yearMatch = text.match(/\b(19\d{2}|20[0-2]\d)\b/);
    if (yearMatch) return { type: 'year', value: yearMatch[0], numericValue: parseInt(yearMatch[1], 10) };

    const genericMatch = text.match(/\b(\d+(?:\.\d+)?[KMB]?)\b/i);
    if (genericMatch) {
        const val = genericMatch[1];
        const numPart = val.replace(/[KMB]/i, '');
        const suffixPart = val.match(/[KMB]/i) ? val.match(/[KMB]/i)![0] : "";
        const trueValue = parseNumber(numPart, suffixPart);
        if (trueValue >= 10 || suffixPart) {
            return { type: 'generic', value: genericMatch[0], numericValue: trueValue };
        }
    }

    return null;
};

export const HERO_DICTIONARY: Record<string, string[]> = {
    "Danger": [
        "FAILED", "FAILURE", "BROKE", "BROKEN", "BANKRUPT", "COLLAPSED", "DESTROYED", "RUINED", "CRASHED", "DISASTER",
        "DANGEROUS", "DANGER", "WARNING", "RISK", "RISKY", "EXPLODED", "EXPLOSION", "FIRED", "BANNED", "ILLEGAL", "SCAM",
        "FRAUD", "FAKE", "DEFECT", "DEFECTIVE", "RECALL", "RECALLED", "MELTDOWN", "DEAD", "KILLED", "LOST", "LOSS",
        "WORSE", "WORST", "WEAKEST"
    ],
    "Success": [
        "SUCCESS", "WINNER", "VICTORY", "BEST", "ULTIMATE", "LEGENDARY", "ICONIC", "REVOLUTIONARY", "GENIUS", "SMART",
        "POWERFUL", "PERFECT", "UNSTOPPABLE", "DOMINANT", "INCREDIBLE", "AMAZING", "EXCELLENT", "ELITE", "PREMIUM",
        "SUPERIOR", "BETTER", "STRONGEST", "FLAWLESS"
    ],
    "Luxury": [
        "MILLIONAIRE", "BILLIONAIRE", "PROFIT", "PROFITS", "REVENUE", "WEALTH", "FORTUNE", "LUXURY",
        "EXPENSIVE", "CHEAP", "PRICELESS", "VALUABLE", "INVESTMENT", "DIVIDEND", "RICH", "POOR", "CASH", "MONEY", "GOLD",
        "EXCLUSIVE", "LIMITED", "RARE", "UNIQUE", "MASTERPIECE", "HANDMADE", "CUSTOM", "PRIVATE", "VIP", "FIRST CLASS", 
        "PRESTIGE", "SIGNATURE", "FLAGSHIP"
    ],
    "General": [
        "FAST", "FASTEST", "SLOW", "SLOWEST", "RAPID", "INSTANT", "QUICK", "POWER", "HORSEPOWER", "TORQUE", "BOOST",
        "TURBO", "ACCELERATION", "TOP SPEED", "EXTREME", "AI", "AUTOMATIC",
        "AUTONOMOUS", "DIGITAL", "ADVANCED", "NEXT-GEN", "BREAKTHROUGH", "PATENTED", "INNOVATION", "REVOLUTION", "FUTURE",
        "WIRELESS", "INTELLIGENT", "SHOCKING", "UNBELIEVABLE", "INSANE", "CRAZY", "IMPOSSIBLE", "SECRET", "TRUTH",
        "HIDDEN", "EXPOSED", "DISCOVERED", "REVEALED", "UNKNOWN", "MYSTERY", "SURPRISING", "UNEXPECTED",
        "PRECISE", "ACCURATE", "RELIABLE", "DURABLE", "STRONG", "SOLID", "STABLE", "SMOOTH", "SILENT",
        "BIGGEST", "SMALLEST", "CHEAPER", "FASTER", "SLOWER", "LIGHTER", "HEAVIER",
        "FIRST", "LAST", "FINAL", "EARLY", "LATE", "MODERN", "CLASSIC", "ORIGINAL", "NEW", "NEWEST", "LATEST", "ANCIENT",
        "COMPANY", "CEO", "FOUNDER", "STARTUP", "CORPORATION", "BRAND", "BUSINESS", "MARKET", "INDUSTRY", "MONOPOLY",
        "COMPETITOR", "V8", "V10", "V12", "AMG", "M", "RS", "GT", "HYPERCAR", "SUPERCAR", "ENGINE", "TRANSMISSION", "AWD",
        "RWD", "FWD", "HYBRID", "ELECTRIC", "DIESEL", "PETROL", "JET", "COCKPIT", "PILOT", "TAKEOFF", "LANDING",
        "AIRCRAFT", "BOEING", "AIRBUS", "GULFSTREAM", "FALCON", "CESSNA", "OLED", "MINI-LED", "4K", "8K", "HDR", "SSD",
        "RTX", "CPU", "GPU", "PROCESSOR", "BATTERY", "CHARGING", "USB-C", "MIDI", "SYNTH", "KEYBOARD", "PIANO", "DAW",
        "VST", "PLUGIN", "AUDIO", "LATENCY", "VELOCITY", "SOLAR", "INVERTER", "LITHIUM", "EFFICIENT", "RENEWABLE",
        "OFF-GRID", "GRID", "POWERWALL", "ESPRESSO", "LATTE", "CAPPUCCINO", "BARISTA", "BREW", "GRINDER", "CREMA",
        "STEAM", "MILK", "PRESSURE"
    ]
};

export function detectHeroWord(chunkText: string): HeroMatch | null {
    // Flatten dictionary for sorting, keeping track of category
    const flatDict: { word: string, category: string }[] = [];
    for (const [category, words] of Object.entries(HERO_DICTIONARY)) {
        for (const word of words) {
            flatDict.push({ word, category });
        }
    }

    // Sort dictionary by length descending to match longest phrase first (e.g. "TOP SPEED" before "TOP")
    flatDict.sort((a, b) => b.word.length - a.word.length);

    for (const item of flatDict) {
        const regex = new RegExp(`\\b${item.word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        const match = chunkText.match(regex);
        if (match) {
            return {
                value: match[0],
                type: 'impact',
                category: item.category // We piggyback the style category onto the match object
            };
        }
    }

    return null;
}
