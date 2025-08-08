# Icon Pack Generator - Usage Guide

## 📱 Tool Overview

The Icon Pack Generator automatically creates professional icon packs for Android and iOS platforms from a single high-quality source image. It ensures compliance with platform guidelines and generates all required sizes and formats.

## 🚀 Features

### Android Support

- **Adaptive Icons**: Foreground and background layers (Android 8.0+)
- **Legacy Icons**: All density buckets (mdpi to xxxhdpi)
- **Play Store Icon**: 512×512px for Google Play Store
- **Automatic folder structure**: Organized in proper Android resource folders

### iOS Support

- **Complete Icon Set**: All required sizes for iPhone, iPad, and App Store
- **Naming Convention**: Follows Apple's naming standards
- **Size Coverage**: From 20px to 1024px for all use cases
- **Setup Instructions**: Included guide for Xcode integration

## 📋 Usage Instructions

### Step 1: Prepare Your Source Image

- **Recommended size**: 1024×1024px or larger
- **Format**: PNG, JPG, or SVG
- **Design guidelines**:
  - Use high contrast colors
  - Avoid thin lines and small details
  - Keep important content in the center 80% of the image
  - Design for square format (platforms will add their own shapes)

### Step 2: Upload and Configure

1. Click "Upload Source Image" and select your file
2. Choose background color (used for padding and background layers)
3. Select platforms and icon types to generate:
   - **Android**: Adaptive icons, legacy icons, Play Store icon
   - **iOS**: Complete set or App Store icon only

### Step 3: Generate and Download

1. Click "Generate Icon Packs"
2. Wait for processing (progress will be shown)
3. Download the generated ZIP files
4. Follow the included setup instructions

## 🎨 Design Guidelines

### General Best Practices

- **Keep it simple**: Icons should work at small sizes
- **High contrast**: Ensure visibility across different backgrounds
- **No text**: Avoid small text that becomes unreadable
- **Consistent style**: Maintain visual consistency across platforms

### Android Specific

- **Adaptive design**: Important content should be in center 80%
- **Safe zones**: System may crop or mask your icon
- **Material Design**: Follow Google's design principles
- **Testing**: Test on different devices and launchers

### iOS Specific

- **App Store ready**: 1024×1024px icon is mandatory
- **Human Interface Guidelines**: Follow Apple's design standards
- **No alpha channels**: Backgrounds should be opaque
- **Corner radius**: Don't add rounded corners (iOS handles this)

## 📦 Output Structure

### Android Package

```
android-icons.zip
├── res/
│   ├── mipmap-mdpi/
│   │   └── ic_launcher.png (48×48)
│   ├── mipmap-hdpi/
│   │   └── ic_launcher.png (72×72)
│   ├── mipmap-xhdpi/
│   │   └── ic_launcher.png (96×96)
│   ├── mipmap-xxhdpi/
│   │   └── ic_launcher.png (144×144)
│   └── mipmap-xxxhdpi/
│       ├── ic_launcher.png (192×192)
│       ├── ic_launcher_foreground.png (432×432)
│       └── ic_launcher_background.png (432×432)
├── play_store_icon.png (512×512)
└── ANDROID_SETUP.txt
```

### iOS Package

```
ios-icons.zip
├── ios-icons/
│   ├── Icon-App-20x20@1x.png (20×20)
│   ├── Icon-App-20x20@2x.png (40×40)
│   ├── Icon-App-20x20@3x.png (60×60)
│   ├── ... (all required sizes)
│   └── Icon-App-1024x1024@1x.png (1024×1024)
└── IOS_SETUP.txt
```

## 🔧 Platform Requirements

### Android Requirements

- **Adaptive Icons**: Android 8.0 (API 26) and above
- **Legacy Support**: All Android versions
- **Format**: PNG with optional transparency
- **Color space**: sRGB recommended

### iOS Requirements

- **Universal**: Works on all iOS devices
- **Format**: PNG without transparency
- **Color space**: Display P3 or sRGB
- **Testing**: Test on actual devices when possible

## ⚡ Pro Tips

1. **Source Quality**: Start with the highest quality possible
2. **Test Early**: Generate and test icons on actual devices
3. **Brand Consistency**: Ensure icon matches your app's branding
4. **Platform Optimization**: Consider slight variations for each platform
5. **Accessibility**: Ensure sufficient contrast for all users

## 🚀 Integration Steps

### Android Integration

1. Copy the `res/` folder contents to your Android project's `src/main/res/`
2. Update `AndroidManifest.xml` with the provided configuration
3. For adaptive icons, add the XML files from the setup guide
4. Test on different devices and launchers

### iOS Integration

1. Open your Xcode project
2. Select your target and go to General tab
3. Find "App Icons and Launch Images"
4. Drag the appropriate icon files to each slot
5. Ensure the 1024×1024 icon is set for App Store

## 🛠️ Troubleshooting

### Common Issues

- **Blurry icons**: Source image too small or low quality
- **Incorrect colors**: Check color space and background settings
- **Missing sizes**: Ensure all required platforms are selected
- **Upload errors**: Check file format and size limits

### Platform-Specific Issues

- **Android**: Icons appear cropped → Adjust safe zone usage
- **iOS**: Rejection from App Store → Ensure 1024px icon meets guidelines
- **Both**: Poor visibility → Increase contrast and simplify design

## 📚 Additional Resources

- [Android Adaptive Icons Guide](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Material Design Icon Guidelines](https://material.io/design/iconography/product-icons.html)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

---

**Happy icon creating!** 🎨📱
