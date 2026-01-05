#!/bin/bash

echo "🔧 Fixing iOS Build Issues"
echo "=========================="
echo ""

# Set UTF-8 encoding (required for CocoaPods)
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

echo "1️⃣ Cleaning Flutter build cache..."
flutter clean

echo ""
echo "2️⃣ Getting Flutter dependencies..."
flutter pub get

echo ""
echo "3️⃣ Installing CocoaPods dependencies..."
cd ios
pod install
cd ..

echo ""
echo "✅ Build fix completed!"
echo ""
echo "📱 Next steps:"
echo "   1. Open Xcode: open ios/Runner.xcworkspace"
echo "   2. Select a device or simulator"
echo "   3. Build and run (Cmd+R)"
echo ""
echo "💡 If you still see PhaseScriptExecution errors:"
echo "   - Clean build folder in Xcode: Product → Clean Build Folder (Cmd+Shift+K)"
echo "   - Restart Xcode"
echo "   - Make sure you're opening Runner.xcworkspace (NOT Runner.xcodeproj)"
echo ""
