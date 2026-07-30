# Noa Autonomous AI Engine — Release v2.0.0

🚀 **Noa v2.0.0** is officially released! 

This release introduces the **Responsive Cortex & Liquid Glass UI System**, **Multi-Platform Architecture (Windows Tauri Desktop + Mobile Apps)**, **Enhanced 5-Layer Memory Matrix**, and **Security Hardening**.

---

## 📦 What's New in v2.0.0

### 1. 🖥️ Liquid Glass & Cortex Responsive Web UI (`/ui`)
- **Desktop & Smartphone Adaptive Layout**: Responsive 2-column Cortex desktop layout with left history sidebar, and fluid smartphone mobile layout with slide-over drawer and mobile bottom nav bar.
- **3D Iridescent Floating Lavender Orb** hero section with quick action prompt pills (`☀️ Weather`, `📰 Tech News`, `📅 Reminders`, `📁 Workspace Files`).

### 2. 📱 Multi-Platform Client Suite
- **Windows Desktop (`/desktop-windows`)**: Tauri v2 + Rust client (Zero Electron overhead, <35MB RAM, `Alt + Space` Spotlight hotkey overlay).
- **Smartphone Mobile App (`/mobile`)**: React Native + Expo app (iOS & Android) with native microphone speech recognition and camera document OCR.

### 3. 🧠 5-Layer Memory Matrix & Planner Engine
- Full real-time synchronization across **Working**, **Short-Term**, **Long-Term**, **Semantic** (Vector Search), and **Episodic** memory layers.
- Multi-step goal decomposition and automated tool routing.

### 4. 🛡️ Security & Reliability Hardening
- Workspace path-traversal sandboxing enforcement.
- Parameterized SQLite database bindings across all memory tables.
- Input validation safeguards for tool execution parameters.

---

## 📄 Installation & Usage

### Start FastAPI Backend
```bash
python api/main.py
```

### Start Web UI
```bash
cd ui
npm run dev
```

- 📦 **Release Link**: [https://github.com/xyanncat/Noa/releases/tag/v2.0.0](https://github.com/xyanncat/Noa/releases/tag/v2.0.0)
- 🐙 **Repository**: [https://github.com/xyanncat/Noa](https://github.com/xyanncat/Noa)
