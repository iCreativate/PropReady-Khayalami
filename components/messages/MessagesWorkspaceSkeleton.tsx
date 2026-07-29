'use client';

/**
 * Static (non-lazy) skeleton for the messages workspace. Used both as the
 * `loading` fallback for the dynamically-imported MessagesWorkspace and as
 * the render when the workspace itself is still waiting on `profileId`.
 * Kept out of the lazy chunk so it paints immediately (no blank white flash).
 */
export default function MessagesWorkspaceSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                    <div className="h-7 w-40 rounded-lg bg-slate-200/70" />
                    <div className="h-4 w-72 max-w-full rounded bg-slate-200/50" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-10 w-24 rounded-xl bg-slate-200/70" />
                    <div className="h-10 w-36 rounded-xl bg-slate-200/70" />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)]"
                    >
                        <div className="h-3 w-24 rounded bg-slate-200/70" />
                        <div className="mt-3 h-7 w-14 rounded bg-slate-200/70" />
                        <div className="mt-2 h-3 w-28 rounded bg-slate-200/50" />
                    </div>
                ))}
            </div>

            <div
                className="grid min-h-[65vh] gap-4 xl:grid-cols-[320px_1fr_280px]"
                style={{ backgroundColor: '#F8FAFC' }}
            >
                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                    <div className="mb-2 h-11 rounded-xl bg-slate-100" />
                    <div className="space-y-1 p-1">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex gap-3 rounded-xl p-3">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3.5 w-2/3 rounded bg-slate-100" />
                                    <div className="h-3 w-full rounded bg-slate-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="hidden min-h-[65vh] flex-col rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)] xl:flex">
                    <div className="flex-1 space-y-4">
                        <div className="flex justify-start">
                            <div className="h-16 w-[55%] rounded-2xl bg-slate-100" />
                        </div>
                        <div className="flex justify-end">
                            <div className="h-12 w-[45%] rounded-2xl bg-slate-100" />
                        </div>
                        <div className="flex justify-start">
                            <div className="h-20 w-[60%] rounded-2xl bg-slate-100" />
                        </div>
                    </div>
                    <div className="h-14 rounded-xl bg-slate-100" />
                </div>
                <div className="hidden rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] xl:block">
                    <div className="mx-auto h-16 w-16 rounded-full bg-slate-100" />
                    <div className="mx-auto mt-3 h-4 w-24 rounded bg-slate-100" />
                    <div className="mx-auto mt-2 h-3 w-16 rounded bg-slate-100" />
                </div>
            </div>
        </div>
    );
}
