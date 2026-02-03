import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * POST /api/property/improve
 * Body: { title, type, bedrooms, bathrooms, size, description, features?: string[], imageCount?: number }
 * Returns: { improvedDescription, listingScore, feedback }
 */
export async function POST(request: NextRequest) {
    try {
        let body: Record<string, unknown> = {};
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: 'Invalid JSON body' },
                { status: 400 }
            );
        }
        if (!body || typeof body !== 'object') {
            body = {};
        }
        const {
            title = '',
            type = '',
            bedrooms = '',
            bathrooms = '',
            size = '',
            description = '',
            features = [],
            imageCount = 0,
        } = body;

        const featuresList = Array.isArray(features) ? features : [];
        const titleStr = String(title ?? '');
        const typeStr = String(type ?? '');
        const descStr = String(description ?? '');

        if (OPENAI_API_KEY) {
            const improved = await improveWithOpenAI({
                title: titleStr,
                type: typeStr,
                bedrooms: String(bedrooms),
                bathrooms: String(bathrooms),
                size: String(size),
                description: descStr,
                features: featuresList,
                imageCount: Number(imageCount) || 0,
            });
            return NextResponse.json(improved);
        }

        // Fallback: compute score and improve description without OpenAI
        const score = computeListingScore({
            title: titleStr,
            type: typeStr,
            bedrooms: String(bedrooms),
            bathrooms: String(bathrooms),
            size: String(size),
            description: descStr,
            features: featuresList,
            imageCount: Number(imageCount) || 0,
        });
        const improvedDescription = improveDescriptionFallback(descStr, { title: titleStr, type: typeStr, bedrooms: String(bedrooms), bathrooms: String(bathrooms), size: String(size), features: featuresList });
        const feedback = getFeedbackFallback(score, { description: descStr.length, imageCount: Number(imageCount) || 0, features: featuresList.length });
        return NextResponse.json({
            improvedDescription,
            listingScore: score,
            feedback,
        });
    } catch (err) {
        console.error('API property/improve error:', err);
        return NextResponse.json(
            { error: 'Failed to improve listing' },
            { status: 500 }
        );
    }
}

async function improveWithOpenAI(params: {
    title: string;
    type: string;
    bedrooms: string;
    bathrooms: string;
    size: string;
    description: string;
    features: string[];
    imageCount: number;
}): Promise<{ improvedDescription: string; listingScore: number; feedback: string[] }> {
    const { title, type, bedrooms, bathrooms, size, description, features, imageCount } = params;
    const prompt = `You are a South African real estate listing expert. Given this property:
Title: ${title}
Type: ${type}
Bedrooms: ${bedrooms} | Bathrooms: ${bathrooms} | Size: ${size} m²
Features: ${features.join(', ') || 'None listed'}
Number of images: ${imageCount}
Current description: ${description || '(empty)'}

Respond with valid JSON only, no markdown:
{
  "improvedDescription": "A compelling 2-4 sentence property description for South African buyers, professional and inviting. Use the details above. If description was empty, write one from the facts.",
  "listingScore": <number 0-100>,
  "feedback": ["tip1", "tip2", "tip3"]
}
Score based on: completeness, description quality, features, and having images (more images = better). feedback: 3 short actionable tips to improve the listing.`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.6,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'OpenAI request failed');
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    const match = content.replace(/```json?\s*|\s*```/g, '').match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : {};
    return {
        improvedDescription: parsed.improvedDescription || description,
        listingScore: Math.min(100, Math.max(0, Number(parsed.listingScore) || 50)),
        feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
    };
}

function computeListingScore(params: {
    title: string;
    type: string;
    bedrooms: string;
    bathrooms: string;
    size: string;
    description: string;
    features: string[];
    imageCount: number;
}): number {
    let score = 0;
    if (params.title?.trim()) score += 15;
    if (params.type?.trim()) score += 10;
    if (params.bedrooms) score += 10;
    if (params.bathrooms) score += 10;
    if (params.size) score += 10;
    if (params.description?.trim()) score += 20;
    if (params.description?.trim().length >= 100) score += 10;
    score += Math.min(15, params.imageCount * 5); // up to 15 for 3+ images
    score += Math.min(10, params.features.length * 2); // up to 10 for features
    return Math.min(100, score);
}

function improveDescriptionFallback(
    description: string,
    ctx: { title: string; type: string; bedrooms: string; bathrooms: string; size: string; features: string[] }
): string {
    if (description?.trim()) {
        let d = description.trim();
        if (!d.endsWith('.')) d += '.';
        return d;
    }
    const parts = [];
    if (ctx.title) parts.push(ctx.title);
    if (ctx.type) parts.push(`This ${ctx.type.toLowerCase()} offers ${ctx.bedrooms || '?'} bedrooms and ${ctx.bathrooms || '?'} bathrooms.`);
    if (ctx.size) parts.push(`Approximately ${ctx.size} m² of living space.`);
    if (ctx.features.length) parts.push(`Features include: ${ctx.features.join(', ')}.`);
    return parts.length ? parts.join(' ') : 'Add a description to attract more buyers.';
}

function getFeedbackFallback(
    score: number,
    ctx: { description: number; imageCount: number; features: number }
): string[] {
    const tips: string[] = [];
    if (ctx.description < 50) tips.push('Add a longer description (100+ characters) to improve your listing.');
    if (ctx.imageCount === 0) tips.push('Add at least one image to increase engagement.');
    if (ctx.features === 0) tips.push('List features (e.g. parking, garden, security) to stand out.');
    if (score < 70) tips.push('Complete all fields and add images for a higher listing score.');
    return tips.slice(0, 3);
}
