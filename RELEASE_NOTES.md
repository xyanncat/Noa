# Noa Autonomous AI Engine — Release v1.0.0

🎉 **Noa v1.0.0** is officially released! 

Noa is a friendly, autonomous AI system equipped with a **5-Layer Memory Architecture**, **Internet Research Pipeline**, **Multi-Step Autonomous Planner**, **12-Tool Ecosystem**, **FastAPI Backend Engine**, and **Responsive Cortex Web UI**.

---

## 📦 Released Packages & Distribution

### 1. ⚙️ Noa Core Backend Engine (`/backend` & `/api`)
- **Python FastAPI Server** with REST and WebSocket streaming support.
- **5-Layer Memory Engine**:
  - `Working Memory`: Active chat turns & scratchpad.
  - `Short-Term Memory`: Task TTL parameters & temporary caching.
  - `Long-Term Memory`: Persistent user preferences, ongoing projects, and goals across sessions.
  - `Semantic Memory`: Vectorized knowledge base with cosine similarity search.
  - `Episodic Memory`: Temporal event logs & interaction traces.
- **Autonomous Planner Pipeline**: `Understand Goal` → `Create Plan` → `Execute Tools` → `Review Results` → `Synthesize Response`.
- **12 Built-in Tools**: `terminal`, `file_manager`, `weather`, `calendar`, `email`, `github`, `discord`, `drive`, `browser_automation`, `web_search`, `read_article`, `check_news`.

### 2. 🖥️ Noa Cortex Responsive Web UI (`/ui`)
- Responsive Cortex layout matching desktop wide displays and smartphone touch UI.
- Floating lavender 3D iridescent orb, responsive prompt console, 5-layer memory deck inspector, planner arena, and tools test sandbox.

### 3. 💻 Noa Windows Desktop App (`/desktop-windows`)
- Built with **Tauri v2 + Rust** (Zero Electron overhead, <35MB RAM).
- Global Spotlight hotkey (`Alt + Space`) for instant query overlay over any Windows app.
- System tray background runner and native Windows notifications.

### 4. 📱 Noa Mobile App (`/mobile`)
- Built with **React Native + Expo** for iOS and Android.
- Native speech-to-text hands-free voice mode and camera vision document OCR.

### 5. 📦 Shared TypeScript SDK (`/shared`)
- `@noa/api-client`: Unified TypeScript library for REST API, WebSocket streaming, and 5-layer memory sync.

---

## 🚀 Quick Start Guide

### Start Backend Engine
```bash
python api/main.py
# Server running at http://localhost:8000
```

### Start Web UI
```bash
cd ui
npm install
npm run dev
# Dashboard running at http://localhost:5173
```
