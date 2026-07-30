#!/usr/bin/env bash
echo "==================================================="
echo "  NOA AUTONOMOUS AI ENGINE - AUTOMATED SETUP SCRIPT"
echo "==================================================="
echo ""

echo "[1/3] Installing Python Backend Dependencies..."
python3 -m pip install -r requirements.txt

echo "[2/3] Installing Web Interface Dependencies..."
cd ui && npm install && cd ..

echo ""
echo "[3/3] System Setup Complete!"
echo "To start Noa Backend: python3 api/main.py"
echo "To start Web UI: cd ui && npm run dev"
