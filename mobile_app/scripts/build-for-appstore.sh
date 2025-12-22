#!/bin/bash

# Script để build Flutter app cho App Store
# Usage: ./scripts/build-for-appstore.sh

set -e

echo "🚀 Bắt đầu build app cho App Store..."

# Di chuyển đến thư mục mobile_app
cd "$(dirname "$0")/.."

# Kiểm tra Flutter
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter chưa được cài đặt. Vui lòng cài Flutter trước."
    exit 1
fi

# Clean build
echo "🧹 Cleaning build..."
flutter clean

# Get dependencies
echo "📦 Getting dependencies..."
flutter pub get

# Build iOS app
echo "🔨 Building iOS app..."
flutter build ipa --release

# Kiểm tra kết quả
if [ -f "build/ios/ipa/phuocbuu_mobile.ipa" ]; then
    echo "✅ Build thành công!"
    echo "📱 IPA file: build/ios/ipa/phuocbuu_mobile.ipa"
    echo ""
    echo "📋 Bước tiếp theo:"
    echo "1. Mở Xcode: open ios/Runner.xcworkspace"
    echo "2. Product → Archive"
    echo "3. Distribute App → App Store Connect"
    echo ""
    echo "Hoặc upload trực tiếp bằng Transporter app hoặc command line:"
    echo "xcrun altool --upload-app --type ios --file build/ios/ipa/phuocbuu_mobile.ipa --apiKey YOUR_API_KEY --apiIssuer YOUR_ISSUER_ID"
else
    echo "❌ Build thất bại. Vui lòng kiểm tra lỗi ở trên."
    exit 1
fi

