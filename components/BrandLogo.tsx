import Link from 'next/link';

type BrandLogoProps = {
    href?: string;
    /** Light backgrounds use charcoal + red; dark panels use white + red. */
    tone?: 'light' | 'dark';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    onClick?: () => void;
};

const SIZE_CLASS = {
    sm: 'text-lg font-bold tracking-tight',
    md: 'text-xl font-bold tracking-tight',
    lg: 'text-2xl font-bold tracking-tight',
} as const;

/**
 * Primary PropReady wordmark (black/charcoal + red “Ready”) — matches auth screens.
 * Use this for site headers; Footer keeps the house mark separately.
 */
export default function BrandLogo({
    href = '/',
    tone = 'light',
    size = 'md',
    className = '',
    onClick,
}: BrandLogoProps) {
    const base = tone === 'dark' ? 'text-white' : 'text-charcoal';
    const mark = (
        <span className={`${SIZE_CLASS[size]} ${base} ${className}`.trim()}>
            Prop<span className="text-gold">Ready</span>
        </span>
    );

    if (!href) {
        return (
            <button type="button" onClick={onClick} className="inline-flex items-center min-w-0 shrink-0">
                {mark}
            </button>
        );
    }

    return (
        <Link href={href} onClick={onClick} className="inline-flex items-center min-w-0 shrink-0">
            {mark}
        </Link>
    );
}
