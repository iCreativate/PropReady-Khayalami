/**
 * Native shell bootstrap — runs inside the Capacitor WebView once the remote
 * Next.js app has loaded.
 *
 * Keep this light; product UI lives in the Next.js app.
 */
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';

export async function initNativeShell() {
    if (!Capacitor.isNativePlatform()) return;

    document.documentElement.classList.add('native-shell');
    document.documentElement.dataset.platform = Capacitor.getPlatform();

    try {
        // Edge-to-edge on Android 15+: content uses CSS safe-area insets.
        // On older Android, keep the WebView below the status bar when possible.
        await StatusBar.setOverlaysWebView({ overlay: true });
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
