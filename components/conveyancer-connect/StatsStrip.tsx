'use client';

export default function StatsStrip({ firmCount = 0 }: { firmCount?: number }) {
    const cells = [
        { label: 'Verified firms', value: String(firmCount) },
        { label: 'Live inbox', value: 'Quotes & chat' },
        { label: 'Matters', value: 'Track progress' },
        { label: 'Consultations', value: 'Book online' },
    ];

    return (
        <section className="cc-content-cta !items-stretch !flex-col gap-4">
            <div>
                <p className="cc-content-kicker-ink">How it works</p>
                <strong>Conveyancer Connect in four moves</strong>
                <p>Browse PropReady-approved firms, request quotes, and message attorneys in one place.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 w-full">
                {cells.map((c, i) => (
                    <div key={c.label} className="cc-content-section !p-4">
                        <span className="cc-content-section-num">{String(i + 1).padStart(2, '0')}</span>
                        <h2 className="!text-base">{c.label}</h2>
                        <p className="!text-lg !font-semibold !text-[color:var(--cc-ink)] !leading-tight">
                            {c.value}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
