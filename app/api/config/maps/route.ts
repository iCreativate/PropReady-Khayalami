import { NextResponse } from 'next/server';

/** Public Maps JS key — safe to expose (restricted by HTTP referrer in Google Cloud). */
export async function GET() {
    const apiKey = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
    return NextResponse.json(
        { apiKey: apiKey || null },
        {
            headers: {
                'Cache-Control': 'private, max-age=300',
            },
        }
    );
}
