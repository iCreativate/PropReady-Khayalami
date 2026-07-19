/**
 * PropReady Enterprise UI Foundation
 *
 * Polish tokens that mirror CSS variables in `app/globals.css`.
 * Do not invent new colours or layout recipes here — keep the existing
 * charcoal / gold brand language and rounded-3xl portal surfaces.
 */

/** Spacing scale (4px base) → Tailwind: space-foundation-*, p-foundation-*, m-foundation-* */
export const SPACE = {
    0: '0',
    1: 'var(--space-1)',
    2: 'var(--space-2)',
    3: 'var(--space-3)',
    4: 'var(--space-4)',
    5: 'var(--space-5)',
    6: 'var(--space-6)',
    7: 'var(--space-7)',
    8: 'var(--space-8)',
    10: 'var(--space-10)',
    12: 'var(--space-12)',
    16: 'var(--space-16)',
} as const;

/** Border radius ladder matching portal chips → cards */
export const RADIUS = {
    xs: 'var(--radius-xs)',
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    '2xl': 'var(--radius-2xl)',
    full: 'var(--radius-full)',
} as const;

/** Elevation shadows (same recipes as premium-card / portal tokens) */
export const SHADOW = {
    xs: 'var(--shadow-xs)',
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
    hover: 'var(--shadow-hover)',
    lift: 'var(--shadow-lift)',
    gold: 'var(--shadow-gold)',
    focus: 'var(--shadow-focus)',
} as const;

/** Motion durations */
export const DURATION = {
    instant: 'var(--duration-instant)',
    fast: 'var(--duration-fast)',
    base: 'var(--duration-base)',
    moderate: 'var(--duration-moderate)',
    slow: 'var(--duration-slow)',
} as const;

/** Easing curves */
export const EASE = {
    standard: 'var(--ease-standard)',
    out: 'var(--ease-out)',
    inOut: 'var(--ease-in-out)',
} as const;

/** Icon glyph sizes (Lucide / SVG) */
export const ICON_SIZE = {
    xs: 'var(--icon-xs)',
    sm: 'var(--icon-sm)',
    md: 'var(--icon-md)',
    lg: 'var(--icon-lg)',
    xl: 'var(--icon-xl)',
    '2xl': 'var(--icon-2xl)',
} as const;

/* ── Tailwind class helpers (prefer these over ad-hoc values) ── */

export const UI_TRANSITION =
    'transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-200 ease-standard';

export const UI_TRANSITION_FAST =
    'transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-150 ease-standard';

export const UI_TRANSITION_MODERATE =
    'transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-300 ease-out-soft';

export const UI_FOCUS_RING =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

export const UI_FOCUS_RING_INPUT =
    'focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/25 focus:bg-white';

export const UI_HOVER_SURFACE =
    'hover:bg-charcoal/[0.03] hover:border-charcoal/15 hover:text-charcoal';

export const UI_ELEVATION_CARD = 'shadow-elevation-md';
export const UI_ELEVATION_CARD_HOVER = 'hover:shadow-elevation-hover';
export const UI_ELEVATION_SOFT = 'shadow-elevation-sm';
export const UI_ELEVATION_MODAL = 'shadow-elevation-xl';

export const UI_RADIUS_SURFACE = 'rounded-3xl';
export const UI_RADIUS_INNER = 'rounded-2xl';
export const UI_RADIUS_CHIP = 'rounded-xl';
export const UI_RADIUS_PILL = 'rounded-full';

export const UI_PAD_CARD = 'p-6 sm:p-7';
export const UI_PAD_SECTION = 'px-6 sm:px-8';
export const UI_PAD_SECTION_Y = 'py-5 sm:py-6';
export const UI_GAP_STACK = 'gap-4 sm:gap-5';
export const UI_GAP_INLINE = 'gap-2 sm:gap-3';

export const UI_ICON_XS = 'icon-xs';
export const UI_ICON_SM = 'icon-sm';
export const UI_ICON_MD = 'icon-md';
export const UI_ICON_LG = 'icon-lg';
export const UI_ICON_XL = 'icon-xl';

export const UI_TEXT_TITLE = 'text-hierarchy-title';
export const UI_TEXT_BODY = 'text-hierarchy-body';
export const UI_TEXT_META = 'text-hierarchy-meta';
export const UI_TEXT_CAPTION = 'text-hierarchy-caption';
