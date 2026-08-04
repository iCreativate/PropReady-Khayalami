'use client';

import { motion } from 'framer-motion';
import { BookOpen, Calculator, LineChart, Sparkles, TrendingUp } from 'lucide-react';

const float = (delay: number, y = 10) => ({
    initial: { opacity: 0, y: 24 },
    animate: {
        opacity: 1,
        y: [0, -y, 0],
        transition: {
            opacity: { duration: 0.7, delay },
            y: {
                duration: 5.5 + delay,
                repeat: Infinity,
                ease: 'easeInOut' as const,
                delay,
            },
        },
    },
});

export default function FloatingDashboard() {
    return (
        <div className="hl-dash-stage">
            <div className="hl-dash-glow" aria-hidden />

            <motion.div
                className="hl-dash-main"
                initial={{ opacity: 0, scale: 0.92, y: 28 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="relative p-5 sm:p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-semibold">
                                Property intelligence
                            </p>
                            <p className="text-white font-semibold text-lg mt-1 tracking-tight">
                                Your readiness
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 border border-gold/30 px-3 py-1 text-[11px] font-semibold text-[#FECACA]">
                            <Sparkles className="w-3 h-3" strokeWidth={1.75} />
                            Live
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="rounded-2xl bg-white/[0.07] border border-white/10 p-3.5">
                            <p className="text-[10px] text-white/45 uppercase tracking-wider">Buying power</p>
                            <p className="text-white text-xl font-semibold mt-1 tabular-nums tracking-tight">
                                R1.42m
                            </p>
                            <p className="text-[11px] text-emerald-300/90 mt-1">+ soft prequal</p>
                        </div>
                        <div className="rounded-2xl bg-white/[0.07] border border-white/10 p-3.5">
                            <p className="text-[10px] text-white/45 uppercase tracking-wider">Confidence</p>
                            <p className="text-white text-xl font-semibold mt-1 tabular-nums tracking-tight">
                                86%
                            </p>
                            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-gold to-[#F87171]"
                                    initial={{ width: 0 }}
                                    animate={{ width: '86%' }}
                                    transition={{ duration: 1.4, delay: 0.6, ease: 'easeOut' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 rounded-2xl bg-white/[0.05] border border-white/10 p-4 min-h-[120px]">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-medium text-white/70">Market pulse · Joburg</p>
                            <TrendingUp className="w-3.5 h-3.5 text-gold" strokeWidth={1.75} />
                        </div>
                        <svg viewBox="0 0 240 80" className="w-full h-[72px]" aria-hidden>
                            <defs>
                                <linearGradient id="homeChartFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#DC2626" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <motion.path
                                d="M0 58 C30 55, 45 48, 70 42 C95 36, 110 50, 135 38 C160 26, 180 22, 205 18 L240 14 L240 80 L0 80 Z"
                                fill="url(#homeChartFill)"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8, duration: 0.8 }}
                            />
                            <motion.path
                                d="M0 58 C30 55, 45 48, 70 42 C95 36, 110 50, 135 38 C160 26, 180 22, 205 18 L240 14"
                                fill="none"
                                stroke="#DC2626"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.6, delay: 0.5, ease: 'easeInOut' }}
                            />
                        </svg>
                    </div>

                    <div className="mt-4 flex gap-2">
                        {['Learn', 'Tools', 'Pros'].map((label) => (
                            <span
                                key={label}
                                className="flex-1 text-center rounded-xl bg-white/[0.06] border border-white/10 py-2 text-[11px] font-semibold text-white/70"
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                </div>
            </motion.div>

            <motion.div
                className="hl-dash-float -left-1 sm:left-0 top-[12%] w-[46%] sm:w-[44%] bg-charcoal/85"
                {...float(0.35, 8)}
            >
                <div className="flex items-center gap-2.5">
                    <span className="hl-icon !w-9 !h-9 !rounded-xl">
                        <Calculator className="w-4 h-4" strokeWidth={1.75} />
                    </span>
                    <div>
                        <p className="text-[10px] text-white/45 uppercase tracking-wider">Bond estimate</p>
                        <p className="text-sm font-semibold text-white tabular-nums">R12,480 / mo</p>
                    </div>
                </div>
            </motion.div>

            <motion.div
                className="hl-dash-float -right-1 sm:right-0 top-[38%] w-[48%] !bg-white/95 !border-charcoal/10"
                {...float(0.55, 12)}
            >
                <div className="flex items-center gap-2.5">
                    <span className="hl-icon !w-9 !h-9 !rounded-xl">
                        <BookOpen className="w-4 h-4" strokeWidth={1.75} />
                    </span>
                    <div>
                        <p className="text-[10px] text-charcoal/45 uppercase tracking-wider">Lesson</p>
                        <p className="text-sm font-semibold text-charcoal">Home loans · 68%</p>
                        <div className="mt-1.5 h-1 rounded-full bg-charcoal/10 overflow-hidden">
                            <div className="h-full w-[68%] bg-gradient-to-r from-gold to-[#F87171] rounded-full" />
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div
                className="hl-dash-float left-[8%] bottom-[6%] w-[52%] bg-charcoal/90"
                {...float(0.75, 9)}
            >
                <div className="flex items-center gap-2.5">
                    <span className="hl-icon hl-icon--emerald !w-9 !h-9 !rounded-xl">
                        <LineChart className="w-4 h-4" strokeWidth={1.75} />
                    </span>
                    <div>
                        <p className="text-[10px] text-white/45 uppercase tracking-wider">Yield insight</p>
                        <p className="text-sm font-semibold text-white">Net 7.2% · Sandton</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
