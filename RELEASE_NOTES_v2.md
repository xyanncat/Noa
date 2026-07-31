# Noa Autonomous AI Engine — Release v2.2.0 (Multi-Platform Direct Release)

🎉 **Noa v2.2.0** is officially released! Includes pre-compiled direct-installation packages for both **Windows Desktop** and **Smartphone (Android)**, alongside interactive installation & build tools.

---

## 📦 Direct Installer Packages

| Target Platform | Package File | Location | Description | SHA-256 Checksum |
| :--- | :--- | :--- | :--- | :--- |
| **Android Smartphone** | `Noa-v2.2.0-Android-arm64.apk` | [`release-assets/`](file:///d:/Github/ai-engine/release-assets/Noa-v2.2.0-Android-arm64.apk) | Signed ARM64 Android installation package | `C71BB53350D8CF1BFF8F1AA615A31914DF7C2738BAA5FB2A7A2345AEB9340CEE` |
| **Windows Desktop** | `Noa-v2.2.0-Windows-x64-Setup.exe` | [`release-assets/`](file:///d:/Github/ai-engine/release-assets/Noa-v2.2.0-Windows-x64-Setup.exe) | Offline NSIS Windows installer (Tauri v2 + WebView2) | `FC2F132B03A32925F1BBBB4DFD7707D221C6619AAAB1F6F917D742294214D5F8` |
| **Verification Metadata** | `build-metadata.json` | [`release-assets/`](file:///d:/Github/ai-engine/release-assets/build-metadata.json) | Hash verification & build toolchain metadata | — |

---

## ⚡ Interactive Installation & Build Hub

Double-click **`install.bat`** (Windows) or execute `./install.sh` (Linux/macOS) to access the installation menu:

1. **Install All System Dependencies** (Python + Node.js Workspaces)
2. **Build Smartphone Package** (`Noa-v2.2.0-Android-arm64.apk`)
3. **Build Desktop Package** (`Noa-v2.2.0-Windows-x64-Setup.exe`)
4. **Build Full Release Suite** (APK + EXE + Metadata)
5. **Start Local Services** (Backend API + Web UI)

---

## 🛠️ Direct npm Command Line Build Shortcuts

```bash
# Build Smartphone Android APK
npm run build:mobile

# Build Desktop Windows Setup EXE
npm run build:desktop

# Build Complete Release Suite (APK + EXE + Checksums)
npm run build:release
```
