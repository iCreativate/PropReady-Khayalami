import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PropReady — Your Home. Ready.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Share preview banner for WhatsApp, email, and social link unfurls. */
export default function OpenGraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(145deg, #121212 0%, #2C2C2C 55%, #1a1a1a 100%)',
                    padding: '64px 72px',
                    fontFamily:
                        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                    }}
                >
                    <div
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: 16,
                            background: '#DC2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
                            <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        </svg>
                    </div>
                    <div style={{ display: 'flex', fontSize: 48, fontWeight: 700, letterSpacing: -1 }}>
                        <span style={{ color: '#FFFFFF' }}>Prop</span>
                        <span style={{ color: '#DC2626' }}>Ready</span>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 64,
                            fontWeight: 700,
                            color: '#FFFFFF',
                            lineHeight: 1.1,
                            letterSpacing: -1.5,
                            maxWidth: 900,
                        }}
                    >
                        Your Home. Ready.
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 28,
                            color: 'rgba(255,255,255,0.72)',
                            maxWidth: 820,
                            lineHeight: 1.35,
                        }}
                    >
                        Free tools for buyers & sellers — bonds, learning, listings, and verified
                        professionals across South Africa.
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            background: 'rgba(220,38,38,0.15)',
                            border: '1px solid rgba(220,38,38,0.35)',
                            borderRadius: 999,
                            padding: '12px 22px',
                            color: '#FCA5A5',
                            fontSize: 22,
                            fontWeight: 600,
                        }}
                    >
                        100% free for buyers and sellers
                    </div>
                    <div style={{ display: 'flex', color: 'rgba(255,255,255,0.45)', fontSize: 22 }}>
                        propready.live
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}
