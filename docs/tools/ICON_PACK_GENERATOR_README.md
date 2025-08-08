# 📱 Icon Pack Generator

> Professional icon pack generator for Android and iOS apps

## 🚀 Quick Start

1. **Upload** your high-quality source image (1024×1024px recommended)
2. **Configure** platforms and icon types you need
3. **Generate** and download complete icon packs
4. **Install** using included setup instructions

## ✨ Features

### 🤖 Android Support

- **Adaptive Icons** with foreground/background layers
- **Legacy Icons** for all density buckets (mdpi to xxxhdpi)
- **Play Store Icon** (512×512px)
- Complete folder structure with setup guide

### 🍎 iOS Support

- **Complete Icon Set** (15 sizes from 20px to 1024px)
- **App Store Ready** with mandatory 1024×1024px icon
- **Xcode Integration** guide included
- Proper naming convention following Apple standards

## 📋 Requirements

### Source Image

- **Size**: 1024×1024px or larger recommended
- **Format**: PNG, JPG, or SVG
- **Design**: High contrast, avoid thin lines
- **Content**: Keep important elements in center 80%

### Platform Guidelines

- **Android**: Follow Material Design principles
- **iOS**: Comply with Human Interface Guidelines
- **Both**: Ensure good visibility at small sizes

## 📦 Generated Output

### Android Package (`android-icons.zip`)

```
res/
├── mipmap-mdpi/ic_launcher.png (48×48)
├── mipmap-hdpi/ic_launcher.png (72×72)
├── mipmap-xhdpi/ic_launcher.png (96×96)
├── mipmap-xxhdpi/ic_launcher.png (144×144)
├── mipmap-xxxhdpi/
│   ├── ic_launcher.png (192×192)
│   ├── ic_launcher_foreground.png (432×432)
│   └── ic_launcher_background.png (432×432)
├── play_store_icon.png (512×512)
└── ANDROID_SETUP.txt
```

### iOS Package (`ios-icons.zip`)

```
ios-icons/
├── Icon-App-20x20@1x.png (20×20)
├── Icon-App-29x29@2x.png (58×58)
├── Icon-App-40x40@3x.png (120×120)
├── Icon-App-60x60@2x.png (120×120)
├── Icon-App-60x60@3x.png (180×180)
├── Icon-App-76x76@2x.png (152×152)
├── Icon-App-83.5x83.5@2x.png (167×167)
├── Icon-App-1024x1024@1x.png (1024×1024)
├── ... (all 15 required sizes)
└── IOS_SETUP.txt
```

## 🎨 Design Tips

### ✅ Do

- Use high contrast colors
- Design at 1024×1024px or larger
- Keep important content in center 80%
- Test at small sizes
- Use bold, simple designs

### ❌ Avoid

- Thin lines and small details
- Text that becomes unreadable when small
- Designs that rely on sharp corners
- Overly complex illustrations
- Low contrast color combinations

## 🔧 Integration

### Android

1. Copy `res/` folder contents to your project
2. Update `AndroidManifest.xml` with icon references
3. Add adaptive icon XML files for API 26+
4. Test on different devices and launchers

### iOS

1. Open Xcode project
2. Select target → General tab
3. Find "App Icons and Launch Images"
4. Drag icons to appropriate slots
5. Ensure 1024×1024 icon is set

## ❓ Common Issues

**Icons appear blurry**: Use higher resolution source image  
**Icons get cropped on Android**: Keep content in center 80%  
**App Store rejection**: Ensure 1024×1024 icon meets guidelines  
**Poor visibility**: Increase contrast and simplify design

## 📚 Resources

- [Android Adaptive Icons Guide](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Material Design Icon Guidelines](https://material.io/design/iconography/product-icons.html)

---

**Start creating professional app icons now!** 🎨✨
