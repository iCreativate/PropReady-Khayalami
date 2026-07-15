import { NextRequest, NextResponse } from 'next/server';
import { answerCoachQuestion, buildOptimizerSnapshot } from '@/lib/property-optimizer';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const question = String(body.question ?? '').trim();
        if (!question) {
            return NextResponse.json({ error: 'Question is required' }, { status: 400 });
        }

        const snapshot = buildOptimizerSnapshot();
        const response = answerCoachQuestion(question, snapshot, snapshot.improvements);

        return NextResponse.json({
            ...response,
            disclaimer: 'AI guidance is informational — not financial or legal advice. Projections are estimates.',
        });
    } catch {
        return NextResponse.json({ error: 'Coach request failed' }, { status: 500 });
    }
}
