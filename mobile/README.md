# Noa Android App

This is a conventional React Native Android application. It does not use Expo, Expo Go, Expo Router, or Expo native modules.

## Run during development

1. Start the Noa backend on a computer reachable from your Android device.
2. In `mobile/`, run `npm run start`.
3. In a second terminal, run `npm run android` with an Android device or emulator attached.
4. Open **Connection** in the app and enter the reachable API URL, for example `http://192.168.1.10:8000/api` for a physical phone or `http://10.0.2.2:8000/api` for the Android emulator.

The optional API key is held in memory for the current app session only; it is never stored in the APK.

## Signed APK

The repository release workflow and `tools/build-local-release.ps1` build the signed arm64 Android APK through the native Gradle project:

```powershell
.\android\gradlew.bat -p android :app:assembleRelease --no-daemon
```

Release builds require the four `NOA_ANDROID_KEYSTORE_*` / `NOA_ANDROID_KEY_*` signing environment values and fail rather than fall back to a debug signature.
