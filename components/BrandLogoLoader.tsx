'use client';

type BrandLogoLoaderProps = {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    showWordmark?: boolean;
    tone?: 'light' | 'dark';
    className?: string;
};

const MARK_PX = { sm: 36, md: 48, lg: 64 } as const;

function BrandLogoMark({ size, animate }: { size: number; animate?: boolean }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 32 32"
            className={animate ? 'brand-logo-loader-mark' : undefined}
            aria-hidden
        >
            <rect width="32" height="32" rx="6" fill="#DC2626" />
            <g
                transform="translate(4, 4)"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
                <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </g>
        </svg>
    );
}

export default function BrandLogoLoader({
    message,
    size = 'md',
    showWordmark = true,
    tone = 'light',
    className = '',
}: BrandLogoLoaderProps) {
    const px = MARK_PX[size];
    const ringInset = size === 'sm' ? '-inset-[5px]' : size === 'lg' ? '-inset-[9px]' : '-inset-[7px]';
    const ringRadius = size === 'sm' ? 'rounded-[11px]' : size === 'lg' ? 'rounded-[18px]' : 'rounded-[14px]';
    const label = message?.replace(/\.\.\.$/, '').replace(/…$/, '').trim();

    return (
        <div
            className={`flex flex-col items-center gap-4 text-center ${className}`.trim()}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="relative grid place-items-center">
                <span
                    className={`pointer-events-none absolute ${ringInset} ${ringRadius} border-2 border-[rgba(220,38,38,0.14)] border-r-[rgba(220,38,38,0.55)] border-t-[#dc2626] brand-logo-loader-ring`}
                    aria-hidden
                />
                <span
                    className="pointer-events-none absolute -inset-5 rounded-full bg-[radial-gradient(circle,rgba(220,38,38,0.22),transparent_68%)] brand-logo-loader-glow"
                    aria-hidden
                />
                <div className="relative z-[1] drop-shadow-[0_8px_20px_rgba(220,38,38,0.28)]">
                    <BrandLogoMark size={px} animate />
                </div>
            </div>

            {showWordmark ? (
                <p
                    className={`font-bold tracking-tight leading-none ${
                        size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-[1.625rem]' : 'text-[1.375rem]'
                    } ${tone === 'dark' ? 'text-white' : 'text-charcoal'}`}
                    aria-hidden
                >
                    Prop<span className="brand-logo-loader-ready text-gold">Ready</span>
                </p>
            ) : null}

            {label ? (
                <p
                    className={`m-0 text-sm font-medium brand-logo-loader-message ${
                        tone === 'dark' ? 'text-white/60' : 'text-charcoal/55'
                    }`}
                >
                    {label}
                </p>
            ) : null}

            <span className="sr-only">{message || 'Loading'}</span>
        </div>
    );
}
