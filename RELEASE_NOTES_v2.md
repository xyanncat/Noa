# Noa Autonomous AI Engine — Release v2.1.0 (Complete Installation Methods)

🎉 **Noa v2.1.0** includes complete automated installers (`install.bat` / `install.sh`) and step-by-step installation instructions for all platforms!

---

## ⚡ Method 1: Automated One-Click Installation

### Windows One-Click Setup
1. Clone or download the source code zip from this release.
2. Double click **`install.bat`** to automatically install all Python and Node.js dependencies.
3. Start the system:
   - **Backend Server**: `python api/main.py`
   - **Web Interface**: `cd ui && npm run dev`

### Linux / macOS Setup
```bash
git clone https://github.com/xyanncat/Noa.git
cd Noa
chmod +x install.sh
./install.sh
```

---

## 🛠️ Method 2: Step-by-Step Manual Installation

### 1. ⚙️ Noa Backend Engine Setup (Python)
```bash
# Clone Repository
git clone https://github.com/xyanncat/Noa.git
cd Noa

# Install Dependencies
pip install -r requirements.txt

# Launch Backend Server
python api/main.py
# Server running at http://localhost:8000
```

### 2. 🖥️ Noa Web Interface Setup (React + Vite)
```bash
# Navigate to UI directory
cd ui

# Install dependencies
npm install

# Start development server
npm run dev
# Interface running at http://localhost:5173
```

### 3. 💻 Noa Windows Desktop Setup (Tauri v2 + Rust)
```bash
cd desktop-windows

# Install dependencies
npm install

# Run Desktop Client (Requires Rust & WebView2)
npm run tauri dev
```

### 4. 📱 Noa Smartphone App Setup (iOS & Android)
```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server for iOS / Android
npx expo start
```

---

## 📦 Released Packages Summary

- **`install.bat`**: Automated one-click Windows installer.
- **`install.sh`**: Automated Unix/macOS installer.
- **`requirements.txt`**: Python dependencies list.
- **`backend/`**: Python FastAPI Engine with 5 Memory Layers.
- **`ui/`**: Responsive Cortex Web Interface.
- **`desktop-windows/`**: Tauri v2 Rust Windows desktop app.
- **`mobile/`**: React Native Expo iOS & Android app.
