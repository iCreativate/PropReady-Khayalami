export type LearnMetricType = 'time' | 'money' | 'percent' | 'stat' | 'number';

export interface DetectedLearnMetric {
    label: string;
    value: string;
    detail?: string;
    type: LearnMetricType;
}

export type LearnMetricTone = 'gold' | 'blue' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';

const METRIC_PATTERNS: Array<{
    type: LearnMetricType;
    regex: RegExp;
    label: (match: RegExpMatchArray) => string;
    value: (match: RegExpMatchArray) => string;
}> = [
    {
        type: 'time',
        regex: /(?:within|under|in|after|before)\s+(<?\s*)?(\d+)\s*(minutes?|mins?|hours?|hrs?|days?|weeks?)/gi,
        label: (m) => 'Response window',
        value: (m) => `${m[1] ?? ''}${m[2]} ${m[3].replace(/s$/, '')}${Number(m[2]) > 1 ? 's' : ''}`.replace('mins', 'min'),
    },
    {
        type: 'time',
        regex: /(\d+)\s*[-–]\s*(\d+)\s*(minutes?|mins?|hours?|days?|weeks?)/gi,
        label: () => 'Time range',
        value: (m) => `${m[1]}–${m[2]} ${m[3]}`,
    },
    {
        type: 'time',
        regex: /<\s*(\d+)\s*(minutes?|mins?|hours?|hrs?)/gi,
        label: () => 'Target time',
        value: (m) => `< ${m[1]} ${m[2]}`,
    },
    {
        type: 'percent',
        regex: /(\d+)\s*×\s*(?:more|higher|likely)/gi,
        label: () => 'Conversion lift',
        value: (m) => `${m[1]}×`,
    },
    {
        type: 'percent',
        regex: /(\d+(?:\.\d+)?)\s*%\+?/gi,
        label: () => 'Rate',
        value: (m) => `${m[1]}%`,
    },
    {
        type: 'percent',
        regex: /(\d+)\s*[-–]\s*(\d+)\s*%/gi,
        label: () => 'Range',
        value: (m) => `${m[1]}–${m[2]}%`,
    },
    {
        type: 'money',
        regex: /R\s?(\d[\d\s,]*(?:\.\d+)?)\s*(k|m)?/gi,
        label: () => 'Amount',
        value: (m) => `R${m[1].replace(/\s/g, '')}${m[2] ? m[2].toUpperCase() : ''}`,
    },
    {
        type: 'stat',
        regex: /(\d+)\s*(new conversations|leads?|viewings?|offers?|touches?|appointments?)/gi,
        label: (m) => `Weekly ${m[2]}`,
        value: (m) => m[1],
    },
    {
        type: 'number',
        regex: /(\d+)\s*[-–]\s*(\d+)\s*(stage|step|touch)/gi,
        label: (m) => `${m[3]}s`,
        value: (m) => `${m[1]}–${m[2]}`,
    },
];

const LABEL_HINTS: Array<{ pattern: RegExp; label: string; type: LearnMetricType }> = [
    { pattern: /response window|contact(?:ed)? within|reply within/i, label: 'Response window', type: 'time' },
    { pattern: /pre-approval|final grant|ltv|loan-to-value/i, label: 'Finance metric', type: 'percent' },
    { pattern: /weekly target|per week/i, label: 'Weekly target', type: 'stat' },
    { pattern: /contact-to-viewing|conversion rate|win rate/i, label: 'Conversion rate', type: 'percent' },
    { pattern: /ffc format|ppra number/i, label: 'Registration', type: 'number' },
];

function metricKey(metric: DetectedLearnMetric): string {
    return `${metric.type}:${metric.label}:${metric.value}`.toLowerCase();
}

export function detectMetricsFromText(text: string, max = 3): DetectedLearnMetric[] {
    const found: DetectedLearnMetric[] = [];
    const seen = new Set<string>();

    for (const { type, regex, label, value } of METRIC_PATTERNS) {
        regex.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null && found.length < max) {
            const metric: DetectedLearnMetric = {
                type,
                label: label(match),
                value: value(match).trim(),
            };
            const key = metricKey(metric);
            if (!seen.has(key)) {
                seen.add(key);
                found.push(metric);
            }
        }
    }

    for (const hint of LABEL_HINTS) {
        if (found.length >= max) break;
        if (!hint.pattern.test(text)) continue;
        const percent = text.match(/(\d+(?:\.\d+)?)\s*%/);
        const time = text.match(/<\s*(\d+)\s*(min|minutes?|hours?)/i);
        const number = text.match(/(\d+)\s*digits?/i);
        let value = '';
        if (percent) value = `${percent[1]}%`;
        else if (time) value = `< ${time[1]} ${time[2]}`;
        else if (number) value = `${number[1]} digits`;
        if (!value) continue;
        const metric: DetectedLearnMetric = {
            type: hint.type,
            label: hint.label,
            value,
        };
        const key = metricKey(metric);
        if (!seen.has(key)) {
            seen.add(key);
            found.push(metric);
        }
    }

    return found
        .filter((metric, index, arr) => {
            if (metric.type !== 'time') return true;
            const sameLabel = arr.findIndex((m) => m.type === 'time' && m.label === metric.label);
            return sameLabel === index;
        })
        .slice(0, max);
}

export function metricTypeToTone(type: LearnMetricType): LearnMetricTone {
    switch (type) {
        case 'time':
            return 'blue';
        case 'money':
            return 'emerald';
        case 'percent':
            return 'amber';
        case 'stat':
            return 'violet';
        case 'number':
        default:
            return 'gold';
    }
}

export function inferMetricTypeFromLabel(label: string, value: string): LearnMetricType {
    const combined = `${label} ${value}`.toLowerCase();
    if (/min|hour|day|week|time|window|response|deadline|schedule/.test(combined)) return 'time';
    if (/r\d|\$|amount|fee|commission|duty|cost|price/.test(combined)) return 'money';
    if (/%|×|x more|rate|ltv|grant/.test(combined)) return 'percent';
    if (/weekly|target|leads|viewings|conversations|touches/.test(combined)) return 'stat';
    return 'number';
}
