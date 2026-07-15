#!/usr/bin/env node
/**
 * Scrapes Property24 suburb average prices into data/sa-suburb-market.json.
 * Resumable — re-run to continue; existing suburb IDs are skipped.
 *
 * Usage: node scripts/scrape-property24-suburbs.mjs [--limit=500] [--delay=250]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_PATH = join(ROOT, 'data/sa-suburb-market.json');
const PROGRESS_PATH = join(ROOT, 'data/sa-suburb-market.progress.json');

const UA = 'PropReady/1.0 (suburb market research; +https://propready.co.za)';
const PROVINCES = [
    ['gauteng', 1],
    ['kwazulu-natal', 2],
    ['free-state', 3],
    ['mpumalanga', 5],
    ['north-west', 6],
    ['eastern-cape', 7],
    ['northern-cape', 8],
    ['western-cape', 9],
    ['limpopo', 14],
];

const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
        const [k, v] = a.replace(/^--/, '').split('=');
        return [k, v ?? 'true'];
    })
);
const LIMIT = args.limit ? Number(args.limit) : Infinity;
const DELAY_MS = args.delay ? Number(args.delay) : 250;
const REFRESH = args.refresh === 'true';

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function titleCase(slug) {
    return slug
        .split('-')
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(' ');
}

function provinceLabel(slug) {
    const map = {
        gauteng: 'Gauteng',
        'western-cape': 'Western Cape',
        'kwazulu-natal': 'KwaZulu-Natal',
        'eastern-cape': 'Eastern Cape',
        'free-state': 'Free State',
        limpopo: 'Limpopo',
        mpumalanga: 'Mpumalanga',
        'north-west': 'North West',
        'northern-cape': 'Northern Cape',
    };
    return map[slug] ?? titleCase(slug);
}

function normalizeKey(...parts) {
    return parts.join('-').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function fetchText(url) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.text();
}

function extractCityLinks(html, province) {
    const re = new RegExp(
        `property-values/([a-z0-9-]+)/${province.replace(/-/g, '\\-')}/([0-9]+)`,
        'g'
    );
    const out = new Map();
    let m;
    while ((m = re.exec(html))) {
        out.set(`${m[1]}/${m[2]}`, { citySlug: m[1], cityId: m[2], province });
    }
    return [...out.values()];
}

function extractSuburbLinks(html, citySlug, province) {
    const re = new RegExp(
        `property-values/([a-z0-9-]+)/${citySlug.replace(/-/g, '\\-')}/${province.replace(/-/g, '\\-')}/([0-9]+)`,
        'g'
    );
    const out = new Map();
    let m;
    while ((m = re.exec(html))) {
        out.set(`${m[1]}-${m[2]}`, { suburbSlug: m[1], suburbId: Number(m[2]) });
    }
    return [...out.values()];
}

function extractAveragePrice(html) {
    const marker = 'averagePropertyPriceGraph_Suburb_';
    const idx = html.indexOf(marker);
    if (idx === -1) return null;

    const rowsStart = html.indexOf('"rows":[', idx);
    if (rowsStart === -1) return null;

    let depth = 0;
    let begin = -1;
    for (let i = rowsStart + 7; i < html.length; i++) {
        const ch = html[i];
        if (ch === '[') {
            if (depth === 0) begin = i;
            depth++;
        } else if (ch === ']') {
            depth--;
            if (depth === 0) {
                try {
                    const rows = JSON.parse(html.slice(begin, i + 1));
                    if (!rows.length) return null;
                    const latest = rows[rows.length - 1];
                    const year = latest.c[0]?.v;
                    const avgPropertyPrice = latest.c[1]?.v;
                    if (!year || !avgPropertyPrice) return null;
                    return { year, avgPropertyPrice };
                } catch {
                    return null;
                }
            }
        }
    }

    return null;
}

function loadJson(path, fallback) {
    if (!existsSync(path)) return fallback;
    try {
        return JSON.parse(readFileSync(path, 'utf8'));
    } catch {
        return fallback;
    }
}

function saveJson(path, data) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(data, null, 2));
}

async function collectSuburbUrls() {
    const progress = loadJson(PROGRESS_PATH, { suburbUrls: null, citiesDone: [] });
    if (progress.suburbUrls?.length) {
        console.log(`Using cached ${progress.suburbUrls.length} suburb URLs`);
        return progress.suburbUrls;
    }

    const cities = [];
    for (const [province, id] of PROVINCES) {
        console.log(`Fetching province index: ${province}`);
        const html = await fetchText(`https://www.property24.com/property-values/${province}/${id}`);
        cities.push(...extractCityLinks(html, province));
        await sleep(DELAY_MS);
    }

    console.log(`Found ${cities.length} cities/towns`);
    const suburbUrls = [];
    const citiesDone = new Set(progress.citiesDone ?? []);

    for (let i = 0; i < cities.length; i++) {
        const city = cities[i];
        const cityKey = `${city.province}/${city.citySlug}/${city.cityId}`;
        if (citiesDone.has(cityKey)) continue;

        const url = `https://www.property24.com/property-values/${city.citySlug}/${city.province}/${city.cityId}`;
        try {
            const html = await fetchText(url);
            const suburbs = extractSuburbLinks(html, city.citySlug, city.province);
            for (const s of suburbs) {
                suburbUrls.push({
                    province: city.province,
                    citySlug: city.citySlug,
                    cityId: city.cityId,
                    suburbSlug: s.suburbSlug,
                    suburbId: s.suburbId,
                    path: `/property-values/${s.suburbSlug}/${city.citySlug}/${city.province}/${s.suburbId}`,
                });
            }
            citiesDone.add(cityKey);
            if (i % 20 === 0) {
                saveJson(PROGRESS_PATH, { suburbUrls, citiesDone: [...citiesDone] });
                console.log(`  ${i + 1}/${cities.length} cities — ${suburbUrls.length} suburbs indexed`);
            }
        } catch (err) {
            console.warn(`  Skip city ${cityKey}: ${err.message}`);
        }
        await sleep(DELAY_MS);
    }

    saveJson(PROGRESS_PATH, { suburbUrls, citiesDone: [...citiesDone] });
    console.log(`Indexed ${suburbUrls.length} suburb URLs`);
    return suburbUrls;
}

async function main() {
    const existing = loadJson(OUT_PATH, { suburbs: [], scrapedAt: null, source: 'property24' });
    const byId = new Map(existing.suburbs.map((s) => [s.suburbId, s]));

    const suburbUrls = await collectSuburbUrls();
    const pending = suburbUrls.filter((s) => REFRESH || !byId.has(s.suburbId));
    const toFetch = pending.slice(0, LIMIT === Infinity ? pending.length : LIMIT);

    console.log(`Fetching prices for ${toFetch.length} suburbs (${byId.size} already cached)`);

    let fetched = 0;
    for (const item of toFetch) {
        const url = `https://www.property24.com${item.path}`;
        try {
            const html = await fetchText(url);
            const price = extractAveragePrice(html);
            if (price && price.avgPropertyPrice > 0) {
                const suburb = titleCase(item.suburbSlug);
                const city = titleCase(item.citySlug);
                const record = {
                    key: normalizeKey(suburb, city, item.province),
                    suburb,
                    city,
                    municipality: city,
                    province: provinceLabel(item.province),
                    provinceSlug: item.province,
                    suburbSlug: item.suburbSlug,
                    citySlug: item.citySlug,
                    suburbId: item.suburbId,
                    avgPropertyPrice: price.avgPropertyPrice,
                    priceYear: price.year,
                    source: 'property24',
                    dataQuality: 'verified',
                    p24Path: item.path,
                };
                byId.set(item.suburbId, record);
                fetched++;
                if (fetched % 25 === 0) {
                    const suburbs = [...byId.values()].sort((a, b) => a.suburb.localeCompare(b.suburb));
                    saveJson(OUT_PATH, {
                        suburbs,
                        scrapedAt: new Date().toISOString(),
                        source: 'property24',
                        count: suburbs.length,
                    });
                    console.log(`  Saved ${byId.size} suburbs (${fetched} new this run)`);
                }
            }
        } catch (err) {
            console.warn(`  Skip ${item.path}: ${err.message}`);
        }
        await sleep(DELAY_MS);
    }

    const suburbs = [...byId.values()].sort((a, b) => a.suburb.localeCompare(b.suburb));
    saveJson(OUT_PATH, {
        suburbs,
        scrapedAt: new Date().toISOString(),
        source: 'property24',
        count: suburbs.length,
    });
    console.log(`Done — ${suburbs.length} suburbs with verified average prices`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
