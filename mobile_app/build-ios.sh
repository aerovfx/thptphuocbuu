#!/bin/bash

# Build iOS App với Xcode
# Usage: ./build-ios.sh

set -e

echo "🚀 Building iOS App với Xcode"
echo "=========================================="

# Set encoding
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

cd "$(dirname "$0")"

# Step 1: Install CocoaPods dependencies
echo ""
echo "📦 Step 1: Installing CocoaPods dependencies..."
cd ios
pod install --repo-update
cd ..

# Step 2: Flutter clean và get dependencies
echo ""
echo "🧹 Step 2: Cleaning Flutter project..."
flutter clean
flutter pub get

# Step 3: Generate Flutter files
echo ""
echo "⚙️  Step 3: Generating Flutter files..."
flutter pub run build_runner build --delete-conflicting-outputs 2>/dev/null || true

# Step 4: Open Xcode
echo ""
echo "📱 Step 4: Opening Xcode workspace..."
echo "⚠️  Lưu ý: Phải mở Runner.xcworkspace, KHÔNG phải Runner.xcodeproj"
open ios/Runner.xcworkspace

echo ""
echo "✅ Setup completed!"
echo ""
echo "📋 Next steps trong Xcode:"
echo "   1. Chọn target 'Runner'"
echo "   2. Vào tab 'Signing & Capabilities'"
echo "   3. Chọn Team của bạn"
echo "   4. Chọn device/simulator"
echo "   5. Nhấn ⌘R để build và run"
echo ""
echo "🔗 Hoặc chạy từ terminal:"
echo "   flutter run -d ios"

