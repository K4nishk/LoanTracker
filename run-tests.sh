#!/bin/bash
# LoanTracker Test Runner Script
# Run all automated tests for the application

set -e  # Exit on error

echo "🧪 LoanTracker Test Suite Runner"
echo "================================="
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if pytest is installed
if ! python3 -m pytest --version &> /dev/null; then
    echo "❌ pytest not found. Installing dependencies..."
    pip3 install -r requirements.txt
fi

echo "📦 Running Unit Tests..."
echo "------------------------"
python3 -m pytest tests/unit/ -v

echo ""
echo "🌐 Running Integration Tests..."
echo "--------------------------------"
python3 -m pytest tests/integration/ -v

echo ""
echo "📊 Generating Coverage Report..."
echo "---------------------------------"
python3 -m pytest tests/ --cov=app --cov-report=term-missing --cov-report=html

echo ""
echo "✅ All Tests Complete!"
echo ""
echo "📈 Coverage report generated: backend/htmlcov/index.html"
echo "   Open with: open backend/htmlcov/index.html"
echo ""
