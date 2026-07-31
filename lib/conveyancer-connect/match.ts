import type {
    ConveyancerProfile,
    MatchAnswers,
    MatchBucket,
    MatchRecommendation,
} from '@/lib/conveyancer-connect/types';

const BUCKET_META: Record<MatchBucket, string> = {
    'best-overall': 'Best overall',
    fastest: 'Fastest',
    'best-value': 'Best value',
    'highest-rated': 'Highest rated',
    'most-experienced': 'Most experienced',
};

export { BUCKET_META };

function scoreOverall(c: ConveyancerProfile, a: MatchAnswers): number {
    let score = c.rating * 20 + Math.min(20, c.reviewCount / 10);
    score += Math.max(0, 25 - c.avgTransferDays / 4);
    score += Math.max(0, 15 - c.avgResponseHours * 3);
    score += c.verified ? 8 : 0;
    score += c.acceptingNewClients ? 5 : -10;
    if (a.province && c.province === a.province) score += 18;
    if (a.propertyType === 'commercial' && c.specialisations.includes('commercial')) score += 12;
    if (a.propertyType === 'development' && c.specialisations.includes('developments')) score += 14;
    if (a.propertyType === 'investment' && c.specialisations.includes('investment-property'))
        score += 12;
    if (a.propertyType === 'residential' && c.specialisations.includes('residential')) score += 8;
    for (const s of a.specialRequirements) {
        if (c.specialisations.includes(s) || c.services.includes(s)) score += 6;
    }
    if (a.budgetBand && c.priceBand <= a.budgetBand) score += 8;
    if (a.timelineWeeks <= 10 && c.avgTransferDays <= 65) score += 10;
    if (a.propertyValue >= 5_000_000 && c.priceBand >= 3) score += 6;
    return score;
}

export function matchConveyancers(
    catalog: ConveyancerProfile[],
    answers: MatchAnswers
): MatchRecommendation[] {
    const pool = catalog.filter((c) => {
        if (answers.province && c.province !== answers.province) return false;
        return c.verified;
    });
    const ranked = [...pool].sort((a, b) => scoreOverall(b, answers) - scoreOverall(a, answers));
    if (!ranked.length) return [];

    const bestOverall = ranked[0];
    const fastest = [...pool].sort((a, b) => a.avgTransferDays - b.avgTransferDays)[0];
    const bestValue = [...pool]
        .filter((c) => !answers.budgetBand || c.priceBand <= answers.budgetBand)
        .sort((a, b) => a.priceBand - b.priceBand || b.rating - a.rating)[0] || ranked[0];
    const highestRated = [...pool].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)[0];
    const mostExperienced = [...pool].sort((a, b) => b.yearsInPractice - a.yearsInPractice)[0];

    const picks: Array<{ bucket: MatchBucket; profile: ConveyancerProfile }> = [
        { bucket: 'best-overall', profile: bestOverall },
        { bucket: 'fastest', profile: fastest },
        { bucket: 'best-value', profile: bestValue },
        { bucket: 'highest-rated', profile: highestRated },
        { bucket: 'most-experienced', profile: mostExperienced },
    ];

    const seen = new Set<string>();
    const out: MatchRecommendation[] = [];
    for (const pick of picks) {
        if (seen.has(pick.profile.id)) continue;
        seen.add(pick.profile.id);
        out.push({
            bucket: pick.bucket,
            profile: pick.profile,
            score: Math.round(scoreOverall(pick.profile, answers)),
            reasons: explain(pick.bucket, pick.profile, answers),
        });
    }
    return out;
}

function explain(
    bucket: MatchBucket,
    c: ConveyancerProfile,
    a: MatchAnswers
): string[] {
    const reasons: string[] = [];
    switch (bucket) {
        case 'best-overall':
            reasons.push(
                `Balanced score across rating (${c.rating}), speed (${c.avgTransferDays} day avg transfer), and responsiveness (${c.avgResponseHours}h).`
            );
            break;
        case 'fastest':
            reasons.push(
                `Shortest average transfer duration in your shortlist at ${c.avgTransferDays} days.`
            );
            break;
        case 'best-value':
            reasons.push(
                `Competitive fee band (${'R'.repeat(c.priceBand)}) while maintaining a ${c.rating} rating.`
            );
            break;
        case 'highest-rated':
            reasons.push(
                `Top client rating of ${c.rating} from ${c.reviewCount} verified reviews.`
            );
            break;
        case 'most-experienced':
            reasons.push(
                `${c.yearsInPractice} years in practice with ${c.completedTransfers.toLocaleString('en-ZA')} completed transfers.`
            );
            break;
    }
    if (a.province && c.province === a.province) {
        reasons.push('Located in your selected province for local deeds office familiarity.');
    }
    if (c.onlineConsultation) {
        reasons.push('Offers online consultation for remote buyers and sellers.');
    }
    if (a.specialRequirements.some((s) => c.specialisations.includes(s))) {
        reasons.push('Matches one or more of your special requirements.');
    }
    if (a.timelineWeeks <= 10 && c.avgTransferDays <= 65) {
        reasons.push('Transfer pace aligns with your accelerated timeline.');
    }
    return reasons;
}
