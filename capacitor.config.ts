import type { CapacitorConfig } from '@capacitor/cli';

/**
 * PropReady mobile shell (Capacitor).
 * Loads the live Next.js site in a native WebView — same product as the web app.
 *
 * Override the URL for local testing:
 *   CAPACITOR_SERVER_URL=http://10.0.2.2:3000 npx cap run android
 *   CAPACITOR_SERVER_URL=http://localhost:3000 npx cap run ios
 */
const serverUrl =
    process.env.CAPACITOR_SERVER_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'https://propready.live';

const config: CapacitorConfig = {
    appId: 'za.co.propready.app',
    appName: 'PropReady',
    webDir: 'mobile/www',
    server: {
        url: serverUrl.replace(/\/$/, ''),
        cleartext: serverUrl.startsWith('http://'),
        allowNavigation: [
            'propready.live',
            '*.propready.live',
            'prop-ready.co.za',
            '*.prop-ready.co.za',
            'localhost',
            '127.0.0.1',
            '10.0.2.2',
        ],
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 1200,
            launchAutoHide: true,
            backgroundColor: '#2C2C2C',
            showSpinner: false,
        },
        StatusBar: {
            style: 'DARK',
            backgroundColor: '#2C2C2C',
        },
    },
    android: {
        allowMixedContent: false,
        backgroundColor: '#2C2C2C',
    },
    ios: {
        backgroundColor: '#2C2C2C',
        contentInset: 'automatic',
        preferredContentMode: 'mobile',
        scheme: 'PropReady',
    },
};

export default config;
