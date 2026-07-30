# Noa Smartphone App — iOS & Android

This is the mobile application for **Noa Autonomous AI Engine** built with **React Native** and **Expo**.

---

## 📱 Smartphone Direct Installation Methods

### Method 1: Instant Testing via Expo Go (No Build Required)
1. Install **Expo Go** on your smartphone:
   - 🤖 **Android**: [Download on Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - 🍎 **iOS**: [Download on Apple App Store](https://apps.apple.com/app/expo-go/id982107779)
2. Scan the Expo QR Code or open the project URL:
   - **Expo Project URL**: `npx expo start --tunnel`
3. Launch Noa directly on your smartphone screen!

---

## 🛠️ Build Standalone Native Apps (APK & IPA)

### Android APK Build
```bash
cd mobile
npm install -g eas-cli
eas build --platform android --profile preview
```

### iOS IPA Build
```bash
cd mobile
eas build --platform ios --profile preview
```
