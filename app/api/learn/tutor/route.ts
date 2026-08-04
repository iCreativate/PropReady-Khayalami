import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();

type ChatTurn = { role: 'user' | 'assistant' | 'system'; content: string };

const SYSTEM_PROMPT = `You are PropReady AI Tutor — a warm, sharp South African property education companion for PropReady (iKhayalami).

## How you talk
- Be conversational: answer like a real tutor in a back-and-forth chat, not a brochure or FAQ dump.
- Acknowledge what the learner asked (and prior turns when relevant), then answer directly.
- Match length to the question: short questions get short answers; deeper questions get more detail.
- Ask at most one clarifying question when needed — still give a useful partial answer in the same reply.
- Invite a natural follow-up when it helps (“Want me to walk through a R1.8m cash-to-close example?”).
- No fluff, no emojis unless the learner uses them first. Educational only — not legal, tax, credit, or financial advice.

## Expertise
Help with the SA residential (and relevant investment) journey:
- Bonds / home loans: affordability, deposits, LTV, prime + margin, fixed vs variable, soft vs full prequal, originators vs banks, credit behaviour during application, bond registration costs
- Buying: search, OTP, suspensive conditions, occupation vs registration, occupational rent, FiCA, clearances, Deeds Office
- Transfer & costs: transfer duty (educational), VAT vs duty, conveyancer / bond attorney fees, rates/levy clearances, cash-to-close vs deposit
- FLISP / subsidies: eligibility framing and what to verify — never guarantee approval
- Agents & PPRA: mandates, commission (usually seller-paid), what buyers/sellers should expect
- Selling: pricing, staging, marketing, sole vs open mandates, offers, bond cancellation, seller costs, deceased estates, trusts, company/CC sales
- Investing: gross vs net yield, cash-flow, vacancy, rate stress, portfolio mistakes, high-level tax concepts (CGT, rental income)
- Structures & risk: trusts, estates, company/CC deals; overstretching, fee blindness, new credit mid-application, emotional bidding

## Accuracy rules
- Be specific to South Africa. Use ZAR examples when helpful.
- Define jargon the first time (LTV, FiCA, OTP, conveyancer, occupational interest).
- Prefer: direct answer → why it matters → one practical next step.
- If rules/bands/products may change (SARS, banks, subsidies), say so and tell them to verify with a bank, conveyancer, originator, or official source.
- Do not invent case law, guarantee approvals, prices, rates, or timelines.
- Soft-refuse unrelated topics and steer back to property learning.
- Never help with fraud, misrepresentation, hiding defects, or circumventing FiCA / credit / conveyancing rules.
- You may answer any property-related question even if it goes beyond the current lesson; connect to the lesson when it helps.`;

function unavailableReply(): string {
    return 'I can’t reach the live PropReady tutor right now — the AI connection isn’t available. Please ask again in a moment, or check that OPENAI_API_KEY is set correctly and the server was restarted. I’m here for SA buying, selling, bonds, transfer costs, and investing once we’re connected again.';
}

function sanitizeHistory(raw: unknown): ChatTurn[] {
    if (!Array.isArray(raw)) return [];

    const cleaned: ChatTurn[] = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object') continue;
        const role = (item as ChatTurn).role;
        const content = (item as ChatTurn).content;
        if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') continue;
        const text = content.trim().slice(0, 4000);
        if (!text) continue;
        // Drop consecutive same-role turns (keep the latest)
        if (cleaned.length > 0 && cleaned[cleaned.length - 1].role === role) {
            cleaned[cleaned.length - 1] = { role, content: text };
        } else {
            cleaned.push({ role, content: text });
        }
    }
    return cleaned.slice(-20);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const message = typeof body.message === 'string' ? body.message.trim() : '';
        const lessonTitle = typeof body.lessonTitle === 'string' ? body.lessonTitle : 'this lesson';
        const lessonSubtitle = typeof body.lessonSubtitle === 'string' ? body.lessonSubtitle : '';
        const hubBasePath = typeof body.hubBasePath === 'string' ? body.hubBasePath : '/learn';
        const history = sanitizeHistory(body.history);

        if (!message || message.length > 4000) {
            return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
        }

        if (!OPENAI_API_KEY) {
            return NextResponse.json(
                { reply: unavailableReply(), source: 'unavailable', error: 'missing_api_key' },
                { status: 503 }
            );
        }

        const hubLabel = hubBasePath.includes('investors')
            ? 'Investors'
            : hubBasePath.includes('sellers')
              ? 'Sellers'
              : 'Buyers';

        const systemWithContext = `${SYSTEM_PROMPT}

## Current lesson context
- Hub: ${hubLabel} (${hubBasePath})
- Lesson: ${lessonTitle}
- Subtitle: ${lessonSubtitle || '(none)'}
Use this context when helpful; still answer general SA property questions fully.`;

        // Keep a natural chat transcript: prior turns, then the latest user message.
        const messages: ChatTurn[] = [
            { role: 'system', content: systemWithContext },
            ...history,
            { role: 'user', content: message },
        ];

        try {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    temperature: 0.7,
                    max_tokens: 1100,
                    messages,
                }),
            });

            if (!res.ok) {
                const errText = await res.text();
                console.warn('AI tutor OpenAI error:', res.status, errText.slice(0, 400));
                const quota =
                    res.status === 429 ||
                    /quota|billing|rate limit/i.test(errText);
                return NextResponse.json(
                    {
                        reply: quota
                            ? 'The live tutor is temporarily unavailable because the OpenAI account has no remaining quota (or hit a rate limit). Add billing/credits at platform.openai.com, then try again.'
                            : unavailableReply(),
                        source: 'unavailable',
                        error:
                            res.status === 401
                                ? 'invalid_api_key'
                                : quota
                                  ? 'quota_exceeded'
                                  : 'openai_error',
                    },
                    { status: 503 }
                );
            }

            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content?.trim();
            if (!reply) {
                return NextResponse.json(
                    { reply: unavailableReply(), source: 'unavailable', error: 'empty_reply' },
                    { status: 503 }
                );
            }

            return NextResponse.json({ reply, source: 'openai' });
        } catch (err) {
            console.warn('AI tutor OpenAI request failed:', err);
            return NextResponse.json(
                { reply: unavailableReply(), source: 'unavailable', error: 'request_failed' },
                { status: 503 }
            );
        }
    } catch (err) {
        console.error('AI tutor API error:', err);
        return NextResponse.json({ error: 'Tutor unavailable' }, { status: 500 });
    }
}
