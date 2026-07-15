const ADVICE_STARTERS =
    /^(the best|top agents|always|never|protect|block|dedicate|schedule|remember|aim to|make sure|don't wait|do not wait|use |start |keep |stay |listen |ask )/i;

const ADVICE_CONTAINS =
    /\b(should|must|avoid|prioriti[sz]e|protect this|like a viewing|every morning|every week|best practice)\b/i;

export function isAdviceSentence(sentence: string): boolean {
    const s = sentence.trim();
    if (s.length < 28 || s.length > 220) return false;
    if (s.includes('?')) return false;
    return ADVICE_STARTERS.test(s) || ADVICE_CONTAINS.test(s);
}

export function extractAdviceFromText(text: string): {
    advice: string[];
    remainder: string;
} {
    const sentences = text
        .split(/(?<=[.!])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

    const advice: string[] = [];
    const remainderParts: string[] = [];

    for (const sentence of sentences) {
        if (isAdviceSentence(sentence)) {
            advice.push(sentence);
        } else {
            remainderParts.push(sentence);
        }
    }

    return {
        advice: advice.slice(0, 2),
        remainder: remainderParts.join(' ').trim(),
    };
}

function normalizeDurationUnit(unit: string): string {
    const u = unit.toLowerCase();
    if (u === 'min' || u === 'mins' || u === 'minute' || u === 'minutes') return 'minutes';
    if (u === 'hr' || u === 'hrs' || u === 'hour' || u === 'hours') return 'hours';
    return u;
}

export function formatDurationDisplay(duration: string): string {
    const match = duration.match(/^(\d+)\s+(\w+)$/);
    if (!match) return duration;
    const [, amount, unit] = match;
    const normalized = normalizeDurationUnit(unit);
    const label = normalized === 'minutes' ? 'Minutes' : normalized === 'hours' ? 'Hours' : unit;
    return `${amount} ${label}`;
}

export function parseWinningHabitContent(text: string): {
    duration?: string;
    durationLabel?: string;
    checklist: string[];
    footer?: string;
    intro?: string;
} {
    const durationMatch = text.match(
        /(?:block|spend|allocate|dedicate|plan|protect)?\s*(\d+)\s*(minutes?|mins?|hours?|hrs?)/i
    );
    const duration = durationMatch
        ? `${durationMatch[1]} ${normalizeDurationUnit(durationMatch[2])}`
        : undefined;

    const durationLabelMatch = text.match(
        /\b(every morning|every evening|every afternoon|every show day|every sunday evening|every week|each morning|weekly)\b/i
    );
    let durationLabel: string | undefined;
    if (durationLabelMatch) {
        const raw = durationLabelMatch[1].toLowerCase();
        durationLabel =
            raw === 'weekly'
                ? 'Every week'
                : raw.replace(/\b\w/g, (c) => c.toUpperCase());
    } else if (duration) {
        durationLabel = 'Every morning';
    }

    const colonSplit = text.split(/:\s*/);
    let checklist: string[] = [];
    let intro = text;
    let footer: string | undefined;

    if (colonSplit.length >= 2) {
        intro = colonSplit[0].trim();
        const rest = colonSplit.slice(1).join(': ');
        const periodParts = rest.split(/\.\s+/);
        const listPart = periodParts[0] ?? '';
        if (periodParts.length > 1) {
            footer = periodParts.slice(1).join('. ').trim();
        }
        checklist = listPart
            .split(/,\s*(?:and\s+)?/)
            .map((item) => item.trim().replace(/[.!?]+$/, ''))
            .filter((item) => item.length > 2 && item.length < 100);
    }

    if (checklist.length === 0) {
        const dedicatedMatch = text.match(
            /dedicated only to[:\s]+(.+?)(?:\.|$)/i
        );
        if (dedicatedMatch) {
            checklist = dedicatedMatch[1]
                .split(/,\s*(?:and\s+)?/)
                .map((item) => item.trim().replace(/[.!?]+$/, ''))
                .filter((item) => item.length > 2 && item.length < 100);
        }
    }

    if (checklist.length === 0) {
        const protectMatch = text.match(/(.+?)\.\s*(Protect.+)$/i);
        if (protectMatch) {
            intro = protectMatch[1];
            footer = protectMatch[2];
        }
    }

    return {
        duration,
        durationLabel,
        checklist,
        footer,
        intro: intro !== text ? intro : undefined,
    };
}
