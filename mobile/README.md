# PropReady mobile apps (Android + iOS)

The native apps use **Capacitor** and load your live Next.js site in a WebView.
Same product as the web app — no separate React Native rewrite.

## Prerequisites

- Node 20+
- **Android:** Android SDK, **Java 21** (`brew install openjdk@21`)
- **iOS (macOS only):** full **Xcode** from the App Store (Command Line Tools alone are not enough), then:
  `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`

## Setup

Native projects live in `android/` and `ios/` (already generated). After `npm install`:

```bash
npx cap sync
```

## Run

```bash
# Point at production (default in capacitor.config.ts)
CAPACITOR_SERVER_URL=https://propready.live npx cap sync

# Android — opens Android Studio (needs Java 17 + SDK)
npm run mobile:android

# iOS — opens Xcode (macOS only)
npm run mobile:ios
```

### Build from CLI

```bash
# Android debug APK → android/app/build/outputs/apk/debug/app-debug.apk
export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
npm run mobile:build:android

# Android release APK + Play Store AAB (needs android/keystore.properties + .jks — gitignored)
npm run mobile:build:android:release
# → android/app/build/outputs/apk/release/app-release.apk
# → android/app/build/outputs/bundle/release/app-release.aab

# iOS (requires Xcode.app installed)
npm run mobile:build:ios
```

### Local Next.js against an emulator

```bash
# Terminal 1 — Next.js
npm run dev

# Android emulator reaches host machine via 10.0.2.2
CAPACITOR_SERVER_URL=http://10.0.2.2:3000 npx cap sync
npm run mobile:android

# iOS simulator can use localhost
CAPACITOR_SERVER_URL=http://localhost:3000 npx cap sync
npm run mobile:ios
```

## Store listings

Set real URLs in `.env` / Netlify (used by the website footer badges):

```bash
NEXT_PUBLIC_APP_STORE_URL=https://apps.apple.com/app/idYOUR_APP_ID
NEXT_PUBLIC_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=za.co.propready.app
```

App ID (Android package / reverse-DNS): `za.co.propready.app`

## Ship checklist

1. Confirm `https://propready.live` (or your production URL) works on mobile Safari/Chrome.
2. Open `android/` in Android Studio → Generate Signed Bundle / APK → Play Console.
3. Open `ios/App/App.xcworkspace` in Xcode → Archive → App Store Connect.
4. Add icons & splash assets in Android Studio / Xcode (replace Capacitor defaults).
5. Privacy Policy URL: `https://propready.live/privacy` (required by both stores).

## Notes

- Server cookies / auth work in the WebView when the app loads your HTTPS site.
- OAuth providers may need the app’s custom URL scheme / associated domains for return redirects.
- Rebuild native projects after changing `capacitor.config.ts`: `npx cap sync`.
- **Safe-area / status bar:** the live website must include `viewport-fit=cover` and safe-area CSS (already in `app/layout.tsx` + `globals.css`). Deploy the Next.js site for the installed app to pick up header spacing fixes — no APK reinstall needed for CSS-only changes.
