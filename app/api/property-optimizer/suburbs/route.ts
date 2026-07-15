import { NextResponse } from 'next/server';
import {
    getSuburbMarketMeta,
    resolveSuburbMarketRecord,
    searchSuburbMarket,
    suburbMarketToAreaProfile,
} from '@/lib/property-optimizer/suburb-market';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';
    const suburb = searchParams.get('suburb')?.trim();
    const city = searchParams.get('city')?.trim() ?? undefined;
    const province = searchParams.get('province')?.trim() ?? undefined;
    const limit = Math.min(Number(searchParams.get('limit') ?? 12), 50);

    if (suburb) {
        const record =
            (await resolveSuburbMarketRecord({ suburb, city, province })) ??
            searchSuburbMarket(suburb, 1)[0] ??
            null;

        if (!record) {
            return NextResponse.json({ ok: false, error: 'Suburb not found' }, { status: 404 });
        }

        const area = suburbMarketToAreaProfile(record);
        return NextResponse.json({
            ok: true,
            record,
            area: {
                suburb: area.suburb,
                city: record.city,
                municipality: area.municipality,
                province: area.province,
                avgPropertyPrice: area.avgPropertyPrice,
                pricePerSqm: area.pricePerSqm,
                dataQuality: record.dataQuality,
                dataSource: record.source,
                priceYear: record.priceYear,
            },
        });
    }

    const results = searchSuburbMarket(q, limit);
    return NextResponse.json({
        ok: true,
        meta: getSuburbMarketMeta(),
        results: results.map((r) => ({
            suburb: r.suburb,
            city: r.city,
            municipality: r.municipality,
            province: r.province,
            avgPropertyPrice: r.avgPropertyPrice,
            priceYear: r.priceYear,
            dataQuality: r.dataQuality,
            dataSource: r.source,
        })),
    });
}
