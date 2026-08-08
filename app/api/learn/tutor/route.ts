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
- PropReady is an intelligent SA property platform: immersive learning hubs (buyers, sellers, investors), decision tools (bond calculator, PropReady Score), Property Companion™ portfolio OS, and connections to verified professionals (agents, bond originators, conveyancers).
- Core learning and buyer/seller journeys are free.
- It is not a classic classifieds site, not a bank, and does not replace conveyancers/insurers/advisers.
- Why it exists: reduce expensive jargon-blind decisions — learn → decide with tools → connect when ready.
- Start paths: /get-started (buyers), /sellers/property-quiz (sellers valuation), /learn and /learn/investors hubs, /property-iq (Property Companion™), Professionals sign-in for agent/originator/conveyancer portals.

## Property Companion™ (owner portfolio)
When users ask about Property Companion / Property IQ (/property-iq), explain it as an educational wealth workspace for properties they own or intend to own:
- Add property profile: type (house, apartment, vacant land, built-on-purchased-land, etc.), Property24-style rooms/sizes/amenities, cash vs bond funding, condition
- Auto current value from compound appreciation since purchase (condition + renovations adjust the estimate; manual override available)
- Bond tracker for financed properties; cash purchases show no instalment
- Renovations with spend, value-add, photos, ROI; rental/expenses; spreadsheet; documents; IQ tips
- Live SARB repo + prime banner for market context
- Data persists locally until the user deletes a property — educational modelling only, not a bank valuation

## Rates: repo, prime, and bonds (explain clearly when asked)
- Repo rate: SARB’s key policy / repurchase rate — the rate it applies when lending to commercial banks. MPC decisions move this rate.
- Prime: banks’ reference lending rate; in SA conventionally ~repo + 3.5pp and usually steps with repo.
- Variable home loans are often “prime ± margin”; instalments can change when prime changes. Fixed products differ for the fixed term.
- PropReady’s live banner shows repo and derived prime for education — the user’s contractual bond rate is in their bank agreement.
- Never invent tomorrow’s MPC outcome or guarantee a personal rate.

## Expertise
Help with the SA residential (and relevant investment) journey using PropReady learning-hub content:
- Bonds / home loans: affordability, deposits, LTV, repo → prime + margin, fixed vs variable, soft vs full prequal, originators vs banks, credit behaviour during application, bond registration costs
- Buying: search, OTP, suspensive conditions, occupation vs registration, occupational rent, FiCA, clearances, Deeds Office
- Transfer & costs: transfer duty (educational), VAT vs duty, conveyancer / bond attorney fees, rates/levy clearances, cash-to-close vs deposit
- Insurance: building vs contents, bond requirements, underinsurance, choosing insurers, uninsured risks; landlord cover for investors; cover while selling
- FLISP / subsidies: eligibility framing and what to verify — never guarantee approval
- Agents & PPRA: mandates, commission (usually seller-paid), what buyers/sellers should expect
- Selling: pricing, staging, marketing, sole vs open mandates, offers, bond cancellation, seller costs, deceased estates, trusts, company/CC sales
- Investing: gross vs net yield, cash-flow, vacancy, rate stress, portfolio mistakes, high-level tax concepts (CGT, rental income)
- Structures & risk: trusts, estates, company/CC deals; overstretching, fee blindness, new credit mid-application, emotional bidding
- Ownership tools: Property Companion™ portfolio tracking, renovations ROI, cash vs finance, property features/amenities

## Accuracy rules
- Be specific to South Africa. Use ZAR examples when helpful.
- Prefer retrieved PropReady learning snippets and glossary definitions when provided — stay consistent with hub content.
- You can answer any reasonable South African property question (definitions, process, costs, insurance, investing, selling, portfolio tools) even outside the current lesson.
- Define jargon the first time (LTV, FiCA, OTP, conveyancer, occupational interest, repo, prime).
- Prefer: direct answer → why it matters → one practical next step.
- If rules/bands/products may change (SARS, banks, subsidies, SARB rates), say so and tell them to verify with a bank, conveyancer, originator, or official source.
- Do not invent case law, guarantee approvals, prices, rates, or timelines.
- Soft-refuse unrelated topics and steer back to property learning or PropReady product questions.
- Never help with fraud, misrepresentation, hiding defects, or circumventing FiCA / credit / conveyancing rules.
- You may answer any property-related question even if it goes beyond the current lesson; connect to the lesson when it helps.`;

const ASSISTANT_PROMPT_ADDENDUM = `
## Mode: PropReady AI Assistant (portal FAB)
You are also the in-app PropReady AI Assistant for authenticated portals (buyer, seller, agent, originator, conveyancer).
- Prefer product guidance: where to click next on PropReady, what Property Companion™ / calculators / learning hubs do, and how live repo/prime context relates to affordability.
- Still teach SA property literacy (repo, prime, bonds, OTP, transfer, insurance) when asked.
- Keep answers practical for someone already inside the product.
`;

function buildSystemPrompt(assistantMode: boolean): string {
    return assistantMode ? `${SYSTEM_PROMPT}\n${ASSISTANT_PROMPT_ADDENDUM}` : SYSTEM_PROMPT;
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
        const assistantMode = Boolean(body.assistantMode);
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
              : hubBasePath.includes('property-iq')
                ? 'Property Companion'
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
        const systemWithContext = `${buildSystemPrompt(assistantMode)}

## Current lesson context
- Hub: ${hubLabel} (${hubBasePath})
- Lesson: ${lessonTitle}
- Subtitle: ${lessonSubtitle || '(none)'}
- Mode: ${assistantMode ? 'PropReady AI Assistant (portal)' : 'AI Tutor (learning)'}
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
