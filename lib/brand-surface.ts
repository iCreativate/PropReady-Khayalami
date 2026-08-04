import type { CSSProperties } from 'react';

/** Shared charcoal + red brand surface (login/registration panel look). */

/** Base shell — use with BrandDarkGlow or `.brand-dark-glow` child. */
export const BRAND_DARK_SURFACE =
    'relative overflow-hidden bg-charcoal text-white';

/** Overlay glow — place as absolute child inside BRAND_DARK_SURFACE. */
export const BRAND_DARK_GLOW =
    'pointer-events-none absolute inset-0 opacity-40 brand-dark-glow';

/** Inline style matching auth panel radials (for components that prefer style=). */
export const BRAND_DARK_GLOW_STYLE: CSSProperties = {
    backgroundImage:
        'radial-gradient(circle at 15% 20%, rgba(220,38,38,0.45) 0%, transparent 42%), radial-gradient(circle at 85% 75%, rgba(255,255,255,0.08) 0%, transparent 40%)',
};

/** Combined class for simple blocks (glow via ::before in globals.css). */
export const BRAND_DARK_PANEL = `${BRAND_DARK_SURFACE} brand-dark-panel`;
