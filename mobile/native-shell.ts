/**
 * Native shell bootstrap — runs inside the Capacitor WebView once the remote
 * Next.js app has loaded (injected via capacitor.config plugins as needed).
 *
 * Keep this light; product UI lives in the Next.js app.
 */
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';

export async function initNativeShell() {
    if (!Capacitor.isNativePlatform()) return;

    try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#2C2C2C' });
    } catch {
        /* web / unsupported */
    }

    try {
        await SplashScreen.hide();
    } catch {
        /* ignore */
    }

    CapApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
            window.history.back();
        } else {
            void CapApp.exitApp();
        }
    });
}
