# ✅ iOS Build Error - FIXED!

**Ngày**: 2025-12-25
**Lỗi ban đầu**: `Command PhaseScriptExecution failed with a nonzero exit code`
**Trạng thái**: ✅ **HOÀN TOÀN ĐÃ FIX**

---

## 🔍 Nguyên Nhân Thực Sự

Lỗi **KHÔNG PHẢI** do PhaseScriptExecution script, mà là do **LỖI COMPILE DART CODE**!

### Lỗi cụ thể:
```
lib/screens/welcome/welcome_screen.dart:442:43: Error: The getter 'fontWeight' isn't defined for the type '_WelcomeScreenState'.
Try correcting the name to the name of an existing getter, or defining a getter or field named 'fontWeight'.
                                  fontWeight: fontWeight.w500,
                                              ^^^^^^^^^^
```

**Giải thích:**
- Dòng 442 viết nhầm: `fontWeight: fontWeight.w500` (chữ f thường)
- Phải viết đúng: `fontWeight: FontWeight.w500` (chữ F hoa)
- Đây là typo đơn giản nhưng gây build fail

---

## ✅ Giải Pháp Đã Thực Hiện

### 1. Fix CocoaPods Encoding (đã làm trước đó)
```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
cd ios && pod install
```

### 2. Fix Dart Compilation Error (nguyên nhân chính)

**File**: `lib/screens/welcome/welcome_screen.dart`

**Thay đổi dòng 442:**
```dart
// TRƯỚC (SAI):
fontWeight: fontWeight.w500,

// SAU (ĐÚNG):
fontWeight: FontWeight.w500,
```

---

## 🎉 Kết Quả

### ✅ Build Thành Công!

```bash
flutter build ios --debug --no-codesign
```

**Output:**
```
Warning: Building for device with codesigning disabled. You will have to manually codesign before deploying to device.
Building com.thptphuocbuu.edu.vn.social for device (ios)...
Running Xcode build...
Xcode build done.                                           16.3s
✓ Built build/ios/iphoneos/Runner.app
```

---

## 📊 Tổng Kết Các Vấn Đề Đã Fix

### 1. CocoaPods Encoding Issue ✅
**Vấn đề:**
```
Unicode Normalization not appropriate for ASCII-8BIT
```

**Fix:**
```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

### 2. Dart Compilation Error ✅
**Vấn đề:**
```
The getter 'fontWeight' isn't defined
```

**Fix:**
```dart
fontWeight.w500 → FontWeight.w500
```

### 3. Build Dependencies ✅
**Đã cài đặt:**
- 14 CocoaPods
- Google Sign-In
- Flutter Secure Storage
- Image Picker
- Shared Preferences
- SQLite

---

## 🚀 Các Bước Build Tiếp Theo

### Option 1: Build từ Flutter CLI

```bash
cd mobile_app

# Build for debug
flutter build ios --debug

# Run on simulator
flutter run

# Run on device
flutter run -d <device-id>
```

### Option 2: Build từ Xcode

```bash
# 1. Mở workspace
open ios/Runner.xcworkspace

# 2. Trong Xcode:
# - Select device/simulator
# - Product → Build (⌘B)
# - Product → Run (⌘R)
```

---

## 🔍 Cách Tìm Lỗi (Bài Học)

### ❌ Lỗi Message Gây Hiểu Lầm:
```
Command PhaseScriptExecution failed with a nonzero exit code
```

Thông báo này làm ta nghĩ rằng:
- Script build bị lỗi
- CocoaPods có vấn đề
- Xcode build phases sai

### ✅ Cách Tìm Lỗi Đúng:

1. **Chạy build với Flutter CLI:**
   ```bash
   flutter build ios --debug --no-codesign 2>&1 | tail -100
   ```

2. **Đọc kỹ output để tìm lỗi thực sự:**
   ```
   Failed to parse TARGET_DEVICE_OS_VERSION:
   lib/screens/welcome/welcome_screen.dart:442:43: Error: The getter 'fontWeight' isn't defined
   ```

3. **Lỗi thực sự là Dart compilation error**, không phải script error!

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Thông báo lỗi có thể gây hiểu lầm

`PhaseScriptExecution failed` không phải lúc nào cũng là lỗi script. Có thể là:
- Dart compilation error
- Swift/Objective-C compilation error
- Missing files/resources
- CocoaPods issues

### 2. Luôn kiểm tra full build log

Xcode thường chỉ hiện message tổng quát. Để thấy lỗi chi tiết:
- Chạy `flutter build ios` từ terminal
- Hoặc xem Report Navigator trong Xcode (⌘9)

### 3. Common Dart Errors trong Flutter

- `fontWeight` vs `FontWeight` (case-sensitive)
- Missing imports
- Undefined properties/methods
- Type mismatches

---

## 📝 Files Đã Sửa

### 1. mobile_app/lib/screens/welcome/welcome_screen.dart
- **Line 442**: `fontWeight.w500` → `FontWeight.w500`

### 2. mobile_app/ios (CocoaPods)
- Reinstalled all pods với UTF-8 encoding
- 14 pods installed successfully

---

## 🎯 Checklist Hoàn Thành

### Build Environment:
- [x] Flutter 3.35.7 (stable)
- [x] Xcode 26.1.1
- [x] CocoaPods 1.16.2
- [x] UTF-8 encoding configured

### Dependencies:
- [x] CocoaPods installed (14 pods)
- [x] Flutter dependencies resolved
- [x] Google Sign-In configured

### Code Fixes:
- [x] Dart compilation error fixed
- [x] welcome_screen.dart corrected
- [x] No more compilation errors

### Build Status:
- [x] ✅ Build successful
- [x] ✅ Runner.app created
- [x] ✅ No errors in build log

---

## 🚀 Next Steps

### Immediate:
1. ✅ Build đã thành công
2. ⏳ Run trên simulator hoặc device
3. ⏳ Test app functionality

### Optional:
1. ⏳ Add GoogleService-Info.plist nếu cần Firebase
2. ⏳ Configure signing cho device deployment
3. ⏳ Test Google Sign-In flow

---

## 💡 Pro Tips

### 1. Debugging Build Errors

Khi gặp `PhaseScriptExecution failed`:

```bash
# Step 1: Build với Flutter CLI để thấy full log
flutter build ios --debug --no-codesign 2>&1 | tee build.log

# Step 2: Tìm từ khóa "Error:" hoặc "error:"
grep -i "error:" build.log

# Step 3: Tìm file và line number có lỗi
grep -B 5 "Error:" build.log
```

### 2. Fixing Dart Errors

```bash
# Analyze code trước khi build
flutter analyze

# Format code
flutter format .

# Clean nếu cần
flutter clean
flutter pub get
```

### 3. Xcode Build Troubleshooting

```bash
# Clean build folder
Product → Clean Build Folder (⌘⇧K)

# Derived Data
Xcode → Preferences → Locations → Derived Data → Delete

# Restart Xcode
pkill -9 Xcode
```

---

## 📞 Support

Nếu gặp lỗi tương tự trong tương lai:

1. **Đừng panic!** Lỗi `PhaseScriptExecution failed` thường không phải lỗi script

2. **Chạy Flutter CLI build** để thấy lỗi chi tiết:
   ```bash
   flutter build ios --debug --no-codesign 2>&1 | less
   ```

3. **Tìm lỗi Dart compilation** trong output

4. **Fix code error** trước khi nghĩ đến script/CocoaPods

---

**Created**: 2025-12-25 13:00 UTC
**Status**: ✅ **COMPLETELY FIXED**
**Build Status**: ✅ **SUCCESS** - Runner.app built in 16.3s
**Next Action**: Run app on simulator/device

---

## 📚 Related Documentation

- [IOS_BUILD_ERROR_RESOLUTION.md](IOS_BUILD_ERROR_RESOLUTION.md) - CocoaPods fix
- [mobile_app/IOS_BUILD_FIX.md](mobile_app/IOS_BUILD_FIX.md) - General iOS build guide
- [mobile_app/GOOGLE_SIGNIN_SETUP.md](mobile_app/GOOGLE_SIGNIN_SETUP.md) - Google Sign-In setup

---

**Bài học quan trọng:** Đừng bị đánh lừa bởi error message! Luôn kiểm tra full build log để tìm nguyên nhân thực sự. ✨
