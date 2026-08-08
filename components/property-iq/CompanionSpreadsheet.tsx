'use client';

import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import {
    buildSpendSummary,
    formatZarCents,
    formatZarSheet,
    type YearMonthGrid,
} from '@/lib/property-iq';
import type { IqProperty } from '@/lib/property-iq';

type SheetId = 'summary' | 'bond' | 'rates' | 'renovations';

const SHEETS: { id: SheetId; label: string }[] = [
    { id: 'summary', label: 'Summary' },
    { id: 'bond', label: 'Bond repayments' },
    { id: 'rates', label: 'Rates & taxes' },
    { id: 'renovations', label: 'Renovations' },
];

function YearMonthTable({
    title,
    grid,
    monthLabels,
    accent = 'bond',
    /** Show every year with horizontal scroll (no 5-year pages). */
    showAllYears = false,
    /** Scroll so the current calendar year is the first visible year column. */
    startAtCurrentYear = false,
}: {
    title: string;
    grid: YearMonthGrid;
    monthLabels: readonly string[];
    accent?: 'bond' | 'rates';
    showAllYears?: boolean;
    startAtCurrentYear?: boolean;
}) {
    const PAGE = 5;
    const [page, setPage] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const currentYear = new Date().getFullYear();

    const hasYears = grid.years.length > 0;
    const pageCount = showAllYears || !hasYears ? 1 : Math.max(1, Math.ceil(grid.years.length / PAGE));
    const safePage = Math.min(page, pageCount - 1);
    const start = showAllYears ? 0 : safePage * PAGE;
    const visibleYears = !hasYears
        ? []
        : showAllYears
          ? grid.years
          : grid.years.slice(start, start + PAGE);
    const visibleSubs = !hasYears
        ? []
        : showAllYears
          ? grid.yearSubtotals
          : grid.yearSubtotals.slice(start, start + PAGE);
    const visibleRates = !hasYears
        ? []
        : showAllYears
          ? (grid.yearRates ?? [])
          : (grid.yearRates ?? []).slice(start, start + PAGE);
    const variable = grid.variableRate;

    const cumulative = useMemo(() => {
        const acc: number[] = [];
        let run = 0;
        for (const v of visibleSubs) {
            run = Math.round((run + v) * 100) / 100;
            acc.push(run);
        }
        return acc;
    }, [visibleSubs]);

    const yearsToDate = grid.years.filter((y) => y <= currentYear);
    const paidToDate = useMemo(() => {
        const now = new Date();
        const cy = now.getFullYear();
        const cm = now.getMonth();
        let sum = 0;
        grid.years.forEach((y, yi) => {
            if (y > cy) return;
            for (let m = 0; m < 12; m++) {
                if (y === cy && m > cm) continue;
                sum += grid.cells[m]?.[yi] ?? 0;
            }
        });
        return Math.round(sum * 100) / 100;
    }, [grid.cells, grid.years]);

    const scrollYearIntoView = (year: number) => {
        const root = scrollRef.current;
        if (!root) return;
        const cell = root.querySelector<HTMLElement>(`thead [data-year="${year}"]`);
        const sticky = root.querySelector<HTMLElement>('thead .pc-sheet-sticky-col');
        if (!cell) return;
        const rootRect = root.getBoundingClientRect();
        const cellRect = cell.getBoundingClientRect();
        const stickyW = sticky?.offsetWidth ?? 0;
        root.scrollTo({
            left: root.scrollLeft + (cellRect.left - rootRect.left - stickyW),
            behavior: 'smooth',
        });
    };

    useEffect(() => {
        if (!showAllYears || !startAtCurrentYear || !hasYears) return;
        const targetYear = grid.years.includes(currentYear)
            ? currentYear
            : (grid.years.find((y) => y > currentYear) ?? grid.years[0]);
        const id = window.setTimeout(() => scrollYearIntoView(targetYear), 50);
        return () => window.clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- align once when grid years change
    }, [showAllYears, startAtCurrentYear, hasYears, grid.years.join(','), currentYear]);

    if (!hasYears) {
        return <p className="pc-muted">Add purchase date, bond amount, rate and term to build this sheet.</p>;
    }

    return (
        <div className={`pc-sheet-wrap accent-${accent}`}>
            <div className="pc-sheet-toolbar">
                <div>
                    <h3 className="pc-sheet-title">{title}</h3>
                    <p className="pc-muted">
                        {grid.years[0]}–{grid.years[grid.years.length - 1]} · {grid.years.length} years · Schedule{' '}
                        {formatZarSheet(grid.grandTotal)}
                        {yearsToDate.length > 0 ? ` · To date ${formatZarSheet(paidToDate)}` : ''}
                        {showAllYears ? ' · scroll sideways for every year' : ''}
                    </p>
                    {variable ? (
                        <p className="pc-sheet-rate-note">
                            Variable SA home loan · priced as <strong>{variable.marginLabel}</strong> (your{' '}
                            {variable.quotedRate.toFixed(2)}% vs prime {variable.currentPrime.toFixed(2)}%). Monthly
                            instalments follow historical prime each month, then current prime for future months.
                        </p>
                    ) : null}
                </div>
                {!showAllYears && pageCount > 1 ? (
                    <div className="pc-sheet-pager">
                        <button
                            type="button"
                            className="pc-btn"
                            disabled={safePage <= 0}
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                        >
                            Earlier
                        </button>
                        <span>
                            {visibleYears[0]}–{visibleYears[visibleYears.length - 1]}
                            <em>
                                {' '}
                                ({safePage + 1}/{pageCount})
                            </em>
                        </span>
                        <button
                            type="button"
                            className="pc-btn"
                            disabled={safePage >= pageCount - 1}
                            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                        >
                            Later
                        </button>
                    </div>
                ) : showAllYears && grid.years.includes(currentYear) ? (
                    <button type="button" className="pc-btn" onClick={() => scrollYearIntoView(currentYear)}>
                        Jump to {currentYear}
                    </button>
                ) : null}
            </div>

            <div className="pc-sheet-scroll pc-sheet-scroll--years" tabIndex={0} ref={scrollRef}>
                <table className="pc-sheet-table pc-sheet-table--calendar">
                    <thead>
                        <tr>
                            <th className="pc-sheet-sticky-col">Month</th>
                            {visibleYears.map((y) => (
                                <th
                                    key={y}
                                    data-year={y}
                                    className={y === currentYear ? 'is-current-year' : undefined}
                                >
                                    {y}
                                    {y === currentYear ? <em>Now</em> : null}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRates.length === visibleYears.length ? (
                            <tr className="pc-sheet-rates-row">
                                <th scope="row" className="pc-sheet-sticky-col">
                                    Avg rate
                                </th>
                                {visibleRates.map((rate, i) => (
                                    <td
                                        key={`rate-${visibleYears[i]}`}
                                        className={visibleYears[i] === currentYear ? 'is-current-year' : undefined}
                                    >
                                        {rate > 0 ? `${rate.toFixed(2)}%` : '—'}
                                    </td>
                                ))}
                            </tr>
                        ) : null}
                        {monthLabels.map((label, mi) => (
                            <tr key={label}>
                                <th scope="row" className="pc-sheet-sticky-col">
                                    {label}
                                </th>
                                {visibleYears.map((y, vi) => {
                                    const yi = start + vi;
                                    const v = grid.cells[mi]?.[yi] ?? 0;
                                    return (
                                        <td
                                            key={`${y}-${label}`}
                                            className={[
                                                v ? '' : 'is-empty',
                                                y === currentYear ? 'is-current-year' : '',
                                            ]
                                                .filter(Boolean)
                                                .join(' ') || undefined}
                                        >
                                            {v ? formatZarSheet(v) : '—'}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        <tr className="pc-sheet-cumulative">
                            <th scope="row" className="pc-sheet-sticky-col">
                                Cumulative
                            </th>
                            {cumulative.map((v, i) => (
                                <td
                                    key={`cum-${visibleYears[i]}`}
                                    className={visibleYears[i] === currentYear ? 'is-current-year' : undefined}
                                >
                                    {formatZarSheet(v)}
                                </td>
                            ))}
                        </tr>
                        <tr className="pc-sheet-total">
                            <th scope="row" className="pc-sheet-sticky-col">
                                Total
                            </th>
                            {visibleSubs.map((v, i) => (
                                <td
                                    key={`tot-${visibleYears[i]}`}
                                    className={visibleYears[i] === currentYear ? 'is-current-year' : undefined}
                                >
                                    {formatZarSheet(v)}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function CompanionSpreadsheet({ property }: { property: IqProperty }) {
    const [sheet, setSheet] = useState<SheetId>('summary');
    const summary = useMemo(() => buildSpendSummary(property), [property]);

    return (
        <div className="pc-spreadsheet">
            <div className="pc-module-head">
                <p className="pc-ov-kicker">Ledger</p>
                <h3>Property spreadsheet</h3>
                <p className="pc-muted">Bond schedule, rates and renovation spend in one place.</p>
            </div>

            <div className="pc-sheet-tabs">
                {SHEETS.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        className={sheet === s.id ? 'is-active' : ''}
                        onClick={() => setSheet(s.id)}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {sheet === 'summary' ? (
                <div className="pc-sheet-summary">
                    <header className="pc-sheet-hero">
                        <p className="pc-ov-kicker">Cash flow of ownership</p>
                        <h3>{property.name}</h3>
                        <div className="pc-sheet-kpis">
                            <div>
                                <span>Purchase price</span>
                                <strong>{formatZarCents(summary.purchasePrice)}</strong>
                            </div>
                            {summary.depositPaid > 0 ? (
                                <div>
                                    <span>Deposit paid</span>
                                    <strong>{formatZarCents(summary.depositPaid)}</strong>
                                </div>
                            ) : null}
                            <div>
                                <span>Total spent</span>
                                <strong>{formatZarCents(summary.totalSpent)}</strong>
                            </div>
                            <div>
                                <span>Monthly instalment</span>
                                <strong>{formatZarCents(summary.instalment)}</strong>
                            </div>
                        </div>
                        <p className="pc-muted">
                            Instalment from {formatZarCents(summary.principal)} at {summary.rate.toFixed(2)}% over{' '}
                            {Math.round(summary.termMonths / 12)} years
                            {summary.verify.settles
                                ? ` · settles in ${summary.verify.monthsToSettle} months · interest ~${formatZarCents(summary.verify.totalInterest)}`
                                : summary.instalment > 0
                                  ? ' · check rate / term / bond amount'
                                  : ''}
                        </p>
                    </header>

                    <div className="pc-sheet-summary-grid">
                        <div className="pc-sheet-scroll pc-sheet-scroll--fit">
                            <table className="pc-sheet-table pc-sheet-table--summary">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Description</th>
                                        <th>Sub-total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.rows.map((r) => (
                                        <tr key={r.item}>
                                            <td className="pc-sheet-item">{r.item}</td>
                                            <td className="pc-sheet-desc">{r.description}</td>
                                            <td className="pc-sheet-amt">
                                                {r.amount > 0 ? formatZarCents(r.amount) : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="pc-sheet-total">
                                        <td colSpan={2}>Total flow of cash</td>
                                        <td className="pc-sheet-amt">{formatZarCents(summary.totalSpent)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="pc-sheet-pie">
                            <p className="pc-ov-kicker">Spend mix</p>
                            {summary.pie.length ? (
                                <>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie
                                                data={summary.pie}
                                                dataKey="amount"
                                                nameKey="item"
                                                innerRadius={52}
                                                outerRadius={88}
                                                paddingAngle={2}
                                            >
                                                {summary.pie.map((r) => (
                                                    <Cell key={r.item} fill={r.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v: number) => formatZarCents(v)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <ul className="pc-sheet-legend">
                                        {summary.pie.map((r) => (
                                            <li key={r.item}>
                                                <i style={{ background: r.color }} />
                                                <span>{r.item}</span>
                                                <strong>{formatZarCents(r.amount)}</strong>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <p className="pc-empty-hint">Add bond, rates or renovations to see the spend mix.</p>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}

            {sheet === 'bond' ? (
                <YearMonthTable
                    title="Mortgage repayments"
                    grid={summary.bondGrid}
                    monthLabels={summary.monthLabels}
                    accent="bond"
                    showAllYears
                    startAtCurrentYear
                />
            ) : null}

            {sheet === 'rates' ? (
                <div className="pc-sheet-rates">
                    <p className="pc-sheet-note">
                        Filled from municipal rates ({formatZarCents(property.municipalRates)} / month) from purchase
                        date to today. Edit municipal rates in Overview to update this sheet.
                    </p>
                    <YearMonthTable
                        title="Rates and taxes"
                        grid={summary.ratesGrid}
                        monthLabels={summary.monthLabels}
                        accent="rates"
                        showAllYears
                        startAtCurrentYear
                    />
                </div>
            ) : null}

            {sheet === 'renovations' ? (
                <div className="pc-sheet-reno">
                    <div className="pc-sheet-toolbar">
                        <div>
                            <h3 className="pc-sheet-title">Renovations &amp; improvements</h3>
                            <p className="pc-muted">
                                {summary.reno.sections.length
                                    ? `Total ${formatZarSheet(summary.reno.grandTotal)}`
                                    : 'Capture upgrades under the Renovations tab'}
                            </p>
                        </div>
                    </div>
                    {summary.reno.sections.length === 0 ? (
                        <p className="pc-empty-hint">No renovations recorded yet — add them under the Renovations tab.</p>
                    ) : (
                        <div className="pc-sheet-scroll">
                            <table className="pc-sheet-table pc-sheet-table--reno">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Room</th>
                                        <th>Item</th>
                                        <th>Description</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.reno.sections.map((sec) => (
                                        <Fragment key={sec.room}>
                                            {sec.rows.map((row) => (
                                                <tr key={row.id}>
                                                    <td>{row.date || '—'}</td>
                                                    <td className="pc-sheet-room">{row.room}</td>
                                                    <td>{row.item}</td>
                                                    <td className="pc-sheet-desc">{row.description}</td>
                                                    <td className="pc-sheet-amt">{formatZarSheet(row.amount)}</td>
                                                </tr>
                                            ))}
                                            <tr className="pc-sheet-subtotal">
                                                <td colSpan={3} />
                                                <td>Subtotal</td>
                                                <td className="pc-sheet-amt">{formatZarSheet(sec.subtotal)}</td>
                                            </tr>
                                        </Fragment>
                                    ))}
                                    <tr className="pc-sheet-total">
                                        <td colSpan={4}>Total</td>
                                        <td className="pc-sheet-amt">{formatZarSheet(summary.reno.grandTotal)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
