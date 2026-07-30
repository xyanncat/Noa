<div align="center">

# ✦ NOA AUTONOMOUS AI ENGINE

### *A Friendly Autonomous AI System with 5-Layer Memory Architecture & Multi-Platform Client Suite*

[![GitHub Release](https://img.shields.io/github/v/release/xyanncat/Noa?color=7c3aed&style=for-the-badge)](https://github.com/xyanncat/Noa/releases/tag/v1.0.0)
[![License](https://img.shields.io/github/license/xyanncat/Noa?color=38bdf8&style=for-the-badge)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.14+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Tauri](https://img.shields.io/badge/Tauri_v2-Rust-FFC107?style=for-the-badge&logo=tauri&logoColor=black)](https://tauri.app)

</div>

---

## 🌟 Overview

**Noa** is a next-generation autonomous AI system built with a **5-Layer Memory Engine**, **Internet Research Pipeline**, **Multi-Step Autonomous Planner**, **12-Tool Ecosystem**, and **Liquid Glass & Cortex Responsive UI**.

It is designed to run locally or in the cloud with zero external API dependencies required out of the box (featuring a standalone fallback engine), while seamlessly supporting Google Gemini API, OpenAI GPT-4o, and local Ollama models.

```
                      User
                      │
          Voice / Text / Images
                      │
              ┌──────────────┐
              │  NOA CORE    │
              │ Reasoning AI │
              └──────┬───────┘
                     │
 ┌───────────────────┼───────────────────┐
 │                   │                   │
Memory            Internet             Tools
 │                   │                   │
Working           Search/Web         File System
Short-term        Research           Calendar / Email
Long-term         RAG                Discord / GitHub / Drive
Semantic          APIs               Python REPL / Terminal
Episodes          News               Browser Automation
```

---

## 💎 Liquid Glass & Cortex Responsive UI Design

Noa features a **Liquid Glass UI Kit** aesthetic blending soft ambient lavender gradients, glassmorphism containers, iridescent glowing Orbs, floating prompt consoles, and responsive multi-column layouts optimized for **Windows Desktop** and **Smartphones (iOS & Android)**.

> [!TIP]
> **Desktop View**: Wide 2-column Cortex layout with persistent history sidebar and floating action cards.
> **Smartphone View**: Fluid full-screen interface with a slide-over mobile drawer and touch-friendly bottom navigation bar.

---

## 🧠 5-Layer Memory Engine

Noa never forgets context. All interaction data is partitioned across 5 dedicated memory layers:

| Layer | Type | Description |
| :--- | :--- | :--- |
| **Layer 1** | `Working Memory` | Manages active conversation turns and immediate scratchpad context. |
| **Layer 2** | `Short-Term Memory` | Tracks active task parameters and temporary variables with auto-expiration (TTL). |
| **Layer 3** | `Long-Term Memory` | Automatically detects and persists user preferences, personal goals, and ongoing project profiles across sessions. |
| **Layer 4** | `Semantic Memory` | Vectorized knowledge base storing verified facts and documentation with cosine similarity retrieval. |
| **Layer 5** | `Episodic Memory` | Maintains a temporal audit log of all past interaction traces, tool executions, and event outcomes. |

---

## ⚡ Multi-Step Autonomous Planner

Instead of answering blindly, Noa decomposes complex user requests into structured execution plans:

$$\text{Understand Goal} \longrightarrow \text{Create Plan} \longrightarrow \text{Execute Tools} \longrightarrow \text{Review Results} \longrightarrow \text{Synthesize Response}$$

```json
{
  "goal": "Check weather in Tokyo and research latest AI news",
  "thought": "Decomposed task into search and forecast steps.",
  "steps": [
    { "step_number": 1, "description": "Fetch live weather forecast", "tool_name": "weather", "tool_input": { "location": "Tokyo" } },
    { "step_number": 2, "description": "Search web for AI news", "tool_name": "check_news", "tool_input": { "topic": "AI technology" } },
    { "step_number": 3, "description": "Synthesize response for user", "tool_name": "none", "tool_input": {} }
  ]
}
```

---

## 🛠️ 12 Built-in Tools Ecosystem

Noa decides when to invoke tools autonomously:

- 💻 **`terminal`**: Safe Python code execution REPL & command runner.
- 📁 **`file_manager`**: Workspace file reader, writer, searcher, and directory explorer.
- ☀️ **`weather`**: Worldwide live weather forecasting (Open-Meteo API).
- 📅 **`calendar`**: Event scheduling & reminder creator.
- ✉️ **`email`**: Email drafting & dispatcher simulator.
- 🐙 **`github`**: GitHub repository search, user profiles, and issue inspector.
- 💬 **`discord`**: Discord channel notifications via webhooks.
- ☁️ **`drive`**: Cloud document manager and structured notes storage.
- 🌐 **`browser_automation`**: Webpage DOM inspector and text scraper.
- 🔍 **`web_search`**: Real-time web search (DuckDuckGo integration).
- 📰 **`read_article`**: Article text extractor and summarizer.
- 🗞️ **`check_news`**: Tech news monitoring and digest builder.

---

## 📱 Multi-Platform Architecture Suite

```
Noa/
├── backend/                    # Python FastAPI Server & Database
│   ├── api/                    # REST & WebSocket API Endpoints
│   ├── core/                   # Noa Brain & Orchestrator
│   ├── memory/                 # 5-Layer Memory Manager
│   ├── planner/                # Multi-Step Planner Engine
│   └── tools/                  # 12 Built-in Tools
│
├── ui/                         # React + Vite Cortex Liquid Glass Dashboard
│
├── desktop-windows/            # Windows Desktop Client (Tauri v2 + Rust, Zero Electron)
│   ├── src-tauri/              # Rust native layer (Alt+Space Spotlight hotkey & System Tray)
│   └── src/                    # Desktop UI React App
│
├── mobile/                     # Smartphone App (React Native + Expo for iOS & Android)
│   ├── app/                    # Expo Router screens (Voice Assistant & Camera OCR)
│   └── components/
│
└── shared/                     # Shared TypeScript SDK (@noa/api-client)
```

---

### ⚡ Option A: Automated One-Click Installation
1. Clone or download the repository.
2. Double click **`install.bat`** (Windows) or run `./install.sh` (Linux/macOS).
3. Start the services:
   - **Backend Server**: `python api/main.py`
   - **Web Interface**: `cd ui && npm run dev`

### 📱 Option B: Smartphone Direct Installation (iOS & Android)

#### 1. Instant Launch via Expo Go (No Build Required)
- 🤖 **Android**: [Download on Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- 🍎 **iOS**: [Download on Apple App Store](https://apps.apple.com/app/expo-go/id982107779)

Run the tunnel server on your computer:
```bash
cd mobile
npm install
npx expo start --tunnel
```
Scan the generated QR code using your smartphone camera or Expo Go app to launch Noa instantly!

#### 2. Standalone Build (APK & IPA)
```bash
cd mobile
npm install -g eas-cli
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

### 💻 Option C: Manual Installation Steps

#### 1. Launch Backend Engine
```bash
git clone https://github.com/xyanncat/Noa.git
cd Noa

# Install backend dependencies
pip install -r requirements.txt

# Launch Noa Core Backend API
python api/main.py
# Server active at http://localhost:8000
```

#### 2. Launch Liquid Glass Web UI
```bash
cd ui
npm install
npm run dev
# Dashboard active at http://localhost:5173
```

#### 3. Launch Windows Desktop Client (Tauri v2 + Rust)
```bash
cd desktop-windows
npm install
npm run tauri dev
```

> [!NOTE]
> **API Keys (Optional)**: Set `GEMINI_API_KEY` or `OPENAI_API_KEY` in `config/settings.py` or `.env` to connect cloud models. If no keys are provided, Noa operates using its built-in offline Reasoning Engine!

---

## 📄 License & Releases

Released under the **MIT License**.

- 📦 **Latest Release v2.1.0**: [https://github.com/xyanncat/Noa/releases/tag/v2.1.0](https://github.com/xyanncat/Noa/releases/tag/v2.1.0)
- 🐙 **GitHub Repository**: [https://github.com/xyanncat/Noa](https://github.com/xyanncat/Noa)