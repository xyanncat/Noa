#!/usr/bin/env bash
set -e

echo "==================================================="
echo "  NOA AUTONOMOUS AI ENGINE - AUTOMATED SETUP SCRIPT"
echo "==================================================="
echo ""

echo "[1/2] Installing Python Backend Dependencies..."
python3 -m pip install -r requirements.txt

echo "[2/2] Installing Node.js Workspace Dependencies..."
npm install

echo ""
echo "==================================================="
echo "  SETUP COMPLETE!"
echo "  - To start Noa Backend: python3 api/main.py"
echo "  - To start Web UI:      cd ui && npm run dev"
echo "  - To build Desktop EXE: npm run build:desktop"
echo "  - To build Mobile APK:  npm run build:mobile"
echo "==================================================="
