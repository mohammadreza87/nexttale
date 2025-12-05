# Mobile App Deployment Guide

> **Status:** Future implementation guide. Mina is currently a web application.

This guide covers deploying Mina to iOS App Store and Google Play using Capacitor.

## Why Capacitor?

- Wraps existing React app (no rewrite)
- Access to native device features
- One codebase for web + mobile
- Official Ionic team support

## Quick Start

### 1. Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Mina" "com.yourdomain.mina" --web-dir dist
```

### 2. Add Platforms

```bash
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
```

### 3. Install Plugins

```bash
npm install @capacitor/app @capacitor/haptics @capacitor/share @capacitor/status-bar
```

### 4. Configure (capacitor.config.ts)

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourdomain.mina',
  appName: 'Mina',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3B82F6'
    }
  }
};

export default config;
```

### 5. Build and Sync

```bash
npm run build
npx cap sync
```

### 6. Open in IDEs

```bash
npx cap open ios      # Requires macOS + Xcode
npx cap open android  # Android Studio
```

## Mobile Optimizations

### Safe Areas (index.css)
```css
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Native Share
```typescript
import { Share } from '@capacitor/share';

await Share.share({
  title: storyTitle,
  url: `https://yourapp.com?story=${storyId}`
});
```

### Haptic Feedback
```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

await Haptics.impact({ style: ImpactStyle.Light });
```

## App Store Requirements

### iOS (Apple Developer: $99/year)
- App icons (1024x1024)
- Screenshots (various sizes)
- Privacy policy URL
- Bundle in Xcode, upload via App Store Connect

### Android (Google Play: $25 one-time)
- App icons (512x512)
- Screenshots
- Privacy policy URL
- Build signed AAB, upload to Play Console

## In-App Purchases

Platform-specific payment handling required:

```typescript
import { Capacitor } from '@capacitor/core';

const platform = Capacitor.getPlatform();

if (platform === 'ios') {
  // Apple In-App Purchase (30% commission)
} else if (platform === 'android') {
  // Google Play Billing (15-30% commission)
} else {
  // Stripe for web
}
```

## Compliance

### COPPA (Children's Apps)
- Parental consent for data collection
- No behavioral advertising
- Limited data retention

### Content
- Age-appropriate content only
- Content filtering implemented
- Report mechanism available

## Timeline Estimate

- Capacitor setup: 1-2 days
- Mobile optimizations: 2-3 days
- Testing: 3-5 days
- App store assets: 1-2 days
- iOS review: 1-2 weeks
- Android review: 3-7 days

**Total: 3-4 weeks**

## Cost

- Apple Developer: $99/year
- Google Play: $25 one-time
- Total to start: ~$125

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/console/about/guides/releasewithconfidence/)
