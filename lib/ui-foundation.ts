/**
 * PropReady Enterprise UI Foundation
 *
 * Polish tokens that mirror CSS variables in `app/globals.css`.
 * Do not invent new colours or layout recipes here — keep the existing
 * charcoal / gold brand language and rounded-3xl portal surfaces.
 *
 * Motion hierarchy (CSS transforms only — GPU friendly):
 * - Buttons: --lift-btn (−1px) + --brightness-hover
 * - Soft surfaces: --lift-soft (−2px)
 * - Cards: --lift-card (−3px) + accent sweep
 * - Media: --scale-media (1.06)
 * - Icons: --scale-icon (1.08)
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
    goldHover: 'var(--shadow-gold-hover)',
    focus: 'var(--shadow-focus)',
    btn: 'var(--shadow-btn)',
    btnHover: 'var(--shadow-btn-hover)',
    card: 'var(--shadow-card)',
    cardHover: 'var(--shadow-card-hover)',
} as const;

/** Motion durations */
export const DURATION = {
    instant: 'var(--duration-instant)',
    fast: 'var(--duration-fast)',
    base: 'var(--duration-base)',
    card: 'var(--duration-card)',
    moderate: 'var(--duration-moderate)',
    slow: 'var(--duration-slow)',
} as const;

/** Easing curves */
export const EASE = {
    standard: 'var(--ease-standard)',
    out: 'var(--ease-out)',
    inOut: 'var(--ease-in-out)',
} as const;

/** Interaction constants (mirror CSS vars — transforms only) */
export const MOTION = {
    liftBtn: 'var(--lift-btn)',
    liftSoft: 'var(--lift-soft)',
    liftCard: 'var(--lift-card)',
    scalePress: 'var(--scale-press)',
    scaleIcon: 'var(--scale-icon)',
    scaleMedia: 'var(--scale-media)',
    brightnessHover: 'var(--brightness-hover)',
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

export const UI_TRANSITION_CARD =
    'transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-250 ease-out-soft';

export const UI_FOCUS_RING =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

/** Text/select/textarea — pair with `form-control` in globals.css */
export const UI_FOCUS_RING_INPUT = 'form-control';

export const UI_HOVER_SURFACE =
    'hover:bg-charcoal/[0.03] hover:border-charcoal/15 hover:text-charcoal';

/**
 * Form system — motion / focus / a11y only.
 * Colour fills stay light; focus uses brand gold (see globals.css).
 * Invalid: set `aria-invalid="true"` or add `form-control-error`.
 * Loading: set `aria-busy="true"`.
 */
export const UI_FORM_CONTROL = 'form-control';
export const UI_FORM_CONTROL_ERROR = 'form-control-error';
export const UI_FORM_FIELD = 'form-field';
export const UI_FORM_LABEL = 'form-label';
export const UI_FORM_HINT = 'form-hint';
export const UI_FORM_ERROR = 'form-error';
export const UI_FORM_SEARCH = 'form-control';
export const UI_FORM_CHECKBOX = 'form-checkbox';
export const UI_FORM_RADIO = 'form-radio';
export const UI_FORM_SWITCH = 'form-switch';

/**
 * Button system — motion / density / a11y only.
 * Colour fills stay on each variant. Pair with `btn-interactive` in globals.css.
 * Loading: set `aria-busy="true"` and optionally `btn-loading` for a spinner.
 */
export const UI_BTN_INTERACTIVE = 'btn-interactive';
export const UI_BTN_LOADING = 'btn-loading';

export const UI_BTN_BASE =
    `inline-flex items-center justify-center gap-2 select-none cursor-pointer ${UI_BTN_INTERACTIVE} ${UI_FOCUS_RING}`;

export const UI_BTN_DISABLED =
    'disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none disabled:brightness-100';

export const UI_BTN_BUSY =
    'aria-[busy=true]:cursor-wait aria-[busy=true]:pointer-events-none aria-[busy=true]:opacity-80';

export const UI_BTN_SIZE_SM =
    'h-9 min-h-9 px-4 text-xs font-semibold tracking-[-0.01em] rounded-full';
export const UI_BTN_SIZE_MD =
    'h-10 min-h-10 px-5 text-sm font-semibold tracking-[-0.01em] rounded-full';
export const UI_BTN_SIZE_LG =
    'h-11 min-h-11 px-7 text-sm font-semibold tracking-[-0.01em] rounded-full';
export const UI_BTN_SIZE_XL =
    'h-12 min-h-12 px-8 text-base font-semibold tracking-[-0.01em] rounded-full';
export const UI_BTN_SIZE_ICON =
    'w-10 h-10 min-w-10 min-h-10 rounded-full';

export const UI_BTN_FILLED =
    `${UI_BTN_BASE} ${UI_BTN_DISABLED} ${UI_BTN_BUSY} shadow-elevation-gold hover:shadow-elevation-gold-hover`;

export const UI_BTN_OUTLINE =
    `${UI_BTN_BASE} ${UI_BTN_DISABLED} ${UI_BTN_BUSY} shadow-btn hover:shadow-btn-hover`;

export const UI_ELEVATION_CARD = 'shadow-card';
export const UI_ELEVATION_CARD_HOVER = 'hover:shadow-card-hover';
export const UI_ELEVATION_SOFT = 'shadow-elevation-sm';
export const UI_ELEVATION_MODAL = 'shadow-elevation-xl';

/** Card surfaces — polish tokens; pair interactive ones with `card-interactive` or use as `<a>` / `<button>` */
export const UI_CARD_SURFACE = 'card-surface';
export const UI_CARD_INTERACTIVE = 'card-interactive';
export const UI_CARD_RADIUS = 'rounded-3xl';
export const UI_CARD_RADIUS_INNER = 'rounded-2xl';

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
