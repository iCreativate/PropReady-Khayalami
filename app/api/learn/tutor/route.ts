import { NextRequest, NextResponse } from 'next/server';
import {
    answerTutorOffline,
    retrieveTutorContextSnippets,
} from '@/lib/buyer-learn/tutor-offline';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();

type ChatTurn = { role: 'user' | 'assistant' | 'system'; content: string };

const SYSTEM_PROMPT = `You are PropReady AI Tutor — a warm, sharp South African property education companion for PropReady (iKhayalami — “Your Home. Ready.”).

## How you talk
- Be conversational: answer like a real tutor in a back-and-forth chat, not a brochure or FAQ dump.
- Acknowledge what the learner asked (and prior turns when relevant), then answer directly.
- Match length to the question: short questions get short answers; deeper questions get more detail.
- Ask at most one clarifying question when needed — still give a useful partial answer in the same reply.
- Invite a natural follow-up when it helps (“Want me to walk through a R1.8m cash-to-close example?”).
- No fluff, no emojis unless the learner uses them first. Educational only — not legal, tax, credit, or financial advice.

## About PropReady (use when asked)
- PropReady is an intelligent SA property platform: immersive learning hubs (buyers, sellers, investors), decision tools (bond calculator, PropReady Score), and connections to verified professionals (agents, bond originators, conveyancers).
- Core learning and buyer/seller journeys are free.
- It is not a classic classifieds site, not a bank, and does not replace conveyancers/insurers/advisers.
- Why it exists: reduce expensive jargon-blind decisions — learn → decide with tools → connect when ready.
- Start paths: /get-started (buyers), /sellers/property-quiz (sellers valuation), /learn and /learn/investors hubs, Professionals sign-in for agent/originator/conveyancer portals.

## Expertise
Help with the SA residential (and relevant investment) journey using PropReady learning-hub content:
- Bonds / home loans: affordability, deposits, LTV, prime + margin, fixed vs variable, soft vs full prequal, originators vs banks, credit behaviour during application, bond registration costs
- Buying: search, OTP, suspensive conditions, occupation vs registration, occupational rent, FiCA, clearances, Deeds Office
- Transfer & costs: transfer duty (educational), VAT vs duty, conveyancer / bond attorney fees, rates/levy clearances, cash-to-close vs deposit
- Insurance: building vs contents, bond requirements, underinsurance, choosing insurers, uninsured risks; landlord cover for investors; cover while selling
- FLISP / subsidies: eligibility framing and what to verify — never guarantee approval
- Agents & PPRA: mandates, commission (usually seller-paid), what buyers/sellers should expect
- Selling: pricing, staging, marketing, sole vs open mandates, offers, bond cancellation, seller costs, deceased estates, trusts, company/CC sales
- Investing: gross vs net yield, cash-flow, vacancy, rate stress, portfolio mistakes, high-level tax concepts (CGT, rental income)
- Structures & risk: trusts, estates, company/CC deals; overstretching, fee blindness, new credit mid-application, emotional bidding

## Accuracy rules
- Be specific to South Africa. Use ZAR examples when helpful.
- Prefer retrieved PropReady learning snippets and glossary definitions when provided — stay consistent with hub content.
- You can answer any reasonable South African property question (definitions, process, costs, insurance, investing, selling) even outside the current lesson.
- Define jargon the first time (LTV, FiCA, OTP, conveyancer, occupational interest).
- Prefer: direct answer → why it matters → one practical next step.
- If rules/bands/products may change (SARS, banks, subsidies), say so and tell them to verify with a bank, conveyancer, originator, or official source.
- Do not invent case law, guarantee approvals, prices, rates, or timelines.
- Soft-refuse unrelated topics and steer back to property learning or PropReady product questions.
- Never help with fraud, misrepresentation, hiding defects, or circumventing FiCA / credit / conveyancing rules.
- You may answer any property-related question even if it goes beyond the current lesson; connect to the lesson when it helps.`;

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
        if (cleaned.length > 0 && cleaned[cleaned.length - 1].role === role) {
            cleaned[cleaned.length - 1] = { role, content: text };
        } else {
            cleaned.push({ role, content: text });
        }
    }
    return cleaned.slice(-20);
}

function localReply(input: {
    message: string;
    lessonTitle: string;
    lessonSubtitle: string;
    hubBasePath: string;
    history: ChatTurn[];
    userName?: string;
}): NextResponse {
    const reply = answerTutorOffline({
        message: input.message,
        lessonTitle: input.lessonTitle,
        lessonSubtitle: input.lessonSubtitle,
        hubBasePath: input.hubBasePath,
        userName: input.userName,
        history: input.history
            .filter((h) => h.role === 'user' || h.role === 'assistant')
            .map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
    });
    return NextResponse.json({ reply, source: 'local' });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const message = typeof body.message === 'string' ? body.message.trim() : '';
        const lessonTitle = typeof body.lessonTitle === 'string' ? body.lessonTitle : 'this lesson';
        const lessonSubtitle = typeof body.lessonSubtitle === 'string' ? body.lessonSubtitle : '';
        const hubBasePath = typeof body.hubBasePath === 'string' ? body.hubBasePath : '/learn';
        const userName =
            typeof body.userName === 'string' ? body.userName.trim().slice(0, 40) : '';
        const history = sanitizeHistory(body.history);

        if (!message || message.length > 4000) {
            return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
        }

        const offlineCtx = {
            message,
            lessonTitle,
            lessonSubtitle,
            hubBasePath,
            userName,
            history: history.map((h) => ({
                role: h.role as 'user' | 'assistant',
                content: h.content,
            })),
        };

        // Always available: full learning-hub + PropReady offline tutor (conversational)
        if (!OPENAI_API_KEY) {
            return localReply({ ...offlineCtx, history });
        }

        const hubLabel = hubBasePath.includes('investors')
            ? 'Investors'
            : hubBasePath.includes('sellers')
              ? 'Sellers'
              : 'Buyers';

        const retrieved = retrieveTutorContextSnippets(
            {
                message,
                lessonTitle,
                lessonSubtitle,
                hubBasePath,
                userName,
            },
            5
        );
        const systemWithContext = `${SYSTEM_PROMPT}

## Current lesson context
- Hub: ${hubLabel} (${hubBasePath})
- Lesson: ${lessonTitle}
- Subtitle: ${lessonSubtitle || '(none)'}
- Learner name: ${userName || '(not provided)'}
${userName ? `Address the learner as “${userName}” naturally in your replies (especially openings), without overusing the name every sentence.` : 'If you learn their name later, use it.'}
Use this context when helpful; still answer general SA property and PropReady product questions fully.

${
    retrieved
        ? `## Retrieved PropReady learning snippets (authoritative for this reply)\n${retrieved}`
        : ''
}`;

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
                console.warn('AI tutor OpenAI error — using local knowledge:', res.status, errText.slice(0, 400));
                return localReply(offlineCtx);
            }

            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content?.trim();
            if (!reply) {
                return localReply(offlineCtx);
            }

            return NextResponse.json({ reply, source: 'openai' });
        } catch (err) {
            console.warn('AI tutor OpenAI request failed — using local knowledge:', err);
            return localReply(offlineCtx);
        }
    } catch (err) {
        console.error('AI tutor API error:', err);
        return NextResponse.json({ error: 'Tutor unavailable' }, { status: 500 });
    }
}
