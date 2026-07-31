import { NextResponse } from 'next/server';

/** Public Maps JS config — API key is safe to expose (restrict by HTTP referrer in Google Cloud). */
export async function GET() {
    const apiKey = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
    const mapId =
        (process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || '').trim() || 'DEMO_MAP_ID';

    return NextResponse.json(
        {
            apiKey: apiKey || null,
            mapId,
        },
        {
            headers: {
                'Cache-Control': 'private, max-age=300',
            },
        }
    );
}
