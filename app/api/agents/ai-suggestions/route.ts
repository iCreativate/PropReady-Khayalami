import { NextRequest, NextResponse } from 'next/server';
import { UNLIMITED_LEAD_CAP } from '@/lib/agent-plans';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface SuggestionContext {
    newBuyers?: number;
    newSellers?: number;
    pendingVerifications?: number;
    verifiedBuyers?: number;
    verifiedSellers?: number;
    upcomingViewings?: number;
    uncontactedLeads?: number;
    planName?: string;
    buyerLimit?: number;
}

function buildFallbackSuggestions(ctx: SuggestionContext): string[] {
    const tips: string[] = [];
    if ((ctx.uncontactedLeads ?? 0) > 0) {
        tips.push(`You have ${ctx.uncontactedLeads} uncontacted lead(s). Reach out within 2 hours for the best conversion rate.`);
    }
    if ((ctx.pendingVerifications ?? 0) > 0) {
        tips.push(
            `${ctx.pendingVerifications} lead(s) have appointments awaiting buyer or seller confirmation. Send a WhatsApp reminder to confirm the viewing.`
        );
    }
    if ((ctx.upcomingViewings ?? 0) > 0) {
        tips.push(`Prepare property packs and bond pre-approval docs for ${ctx.upcomingViewings} upcoming viewing(s).`);
    }
    const used = (ctx.verifiedBuyers ?? 0) + (ctx.verifiedSellers ?? 0);
    const limit = ctx.buyerLimit ?? 3;
    if (limit < UNLIMITED_LEAD_CAP && used >= limit && limit > 0) {
        tips.push('You have used your verified lead allowance on your current plan. Consider upgrading for more verified leads.');
    }
    if ((ctx.newBuyers ?? 0) > 0) {
        tips.push('Prioritise high-score buyer leads and schedule dual-party viewings (buyer + seller) to verify leads faster.');
    }
    if (tips.length === 0) {
        tips.push(
            'Schedule viewings with both buyer and seller selected so they can confirm appointments and verify your leads.',
            'Publish at least 3 listings with quality photos to attract more prequalified buyers.',
            'Review the Learning Hub for lead conversion scripts and follow-up templates.'
        );
    }
    return tips.slice(0, 5);
}

async function fetchOpenAiSuggestions(ctx: SuggestionContext): Promise<string[]> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            temperature: 0.7,
            max_tokens: 400,
            messages: [
                {
                    role: 'system',
                    content:
                        'You are a South African real estate sales coach for PropReady agents. Give 3-5 short, actionable bullet tips (one sentence each). Focus on lead verification via appointments, buyer/seller confirmations, and conversions. No markdown bullets, return JSON array of strings only.',
                },
                {
                    role: 'user',
                    content: JSON.stringify(ctx),
                },
            ],
        }),
    });

    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '[]';
    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed.filter((s): s is string => typeof s === 'string').slice(0, 5);
    } catch {
        return text
            .split('\n')
            .map((l: string) => l.replace(/^[-*•\d.]+\s*/, '').trim())
            .filter(Boolean)
            .slice(0, 5);
    }
    return buildFallbackSuggestions(ctx);
}

export async function POST(request: NextRequest) {
    try {
        const ctx = (await request.json()) as SuggestionContext;

        if (OPENAI_API_KEY) {
            try {
                const suggestions = await fetchOpenAiSuggestions(ctx);
                return NextResponse.json({ suggestions, source: 'ai' });
            } catch (e) {
                console.warn('AI suggestions fallback:', e);
            }
        }

        return NextResponse.json({
            suggestions: buildFallbackSuggestions(ctx),
            source: 'rules',
        });
    } catch (err) {
        console.error('AI suggestions error:', err);
        return NextResponse.json({ suggestions: buildFallbackSuggestions({}), source: 'rules' });
    }
}
