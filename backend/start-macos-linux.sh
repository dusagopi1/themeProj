#!/bin/bash
# Quick Start Script for Crop Prediction System (macOS/Linux)
# This script automates the setup process

echo ""
echo "================================================"
echo " 🌾 Crop Prediction System - Quick Start"
echo "================================================"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

# Check if Node.js is installed
echo "Checking dependencies..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found. Please install from https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js found: $(node --version)"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "✗ Python not found. Please install Python 3.8+"
    exit 1
fi
echo "✓ Python found: $(python3 --version)"

echo ""
echo "Installing Node.js dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "✗ npm install failed"
    exit 1
fi
echo "✓ npm dependencies installed"

echo ""
echo "Installing Python dependencies..."
cd backend
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "✗ pip install failed"
    exit 1
fi
echo "✓ Python dependencies installed"

echo ""
echo "Generating ML model (this may take 1-2 minutes)..."
python3 generate_model.py
if [ $? -ne 0 ]; then
    echo "✗ Model generation failed"
    exit 1
fi
echo "✓ ML model generated successfully"

echo ""
echo "================================================"
echo " ✓ Setup Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo " 1. Keep this terminal open (Flask API running)"
echo " 2. In a NEW terminal, run:"
echo "    npm start"
echo " 3. Open browser to:"
echo "    http://localhost:3000/farmer-dashboard.html"
echo " 4. Click \"Crop Prediction\" in navbar"
echo ""
echo "Starting Flask API server..."
echo ""

# Start Flask API
python3 app.py
