export const iconPackGeneratorFAQ = [
  {
    question: "What image formats are supported?",
    answer:
      "PNG, JPG, and SVG formats are supported. PNG is recommended for the best quality output with transparency support.",
  },
  {
    question: "What's the recommended source image size?",
    answer:
      "1024×1024px or larger is recommended. Higher resolution source images produce better quality results across all generated sizes.",
  },
  {
    question: "Do I need to create separate icons for Android and iOS?",
    answer:
      "No! Upload one high-quality image and the tool automatically generates platform-specific icon packs that comply with each platform's guidelines.",
  },
  {
    question: "What are adaptive icons?",
    answer:
      "Adaptive icons (Android 8.0+) consist of foreground and background layers. The system can apply different shapes and effects. Keep important content in the center 80% of the image.",
  },
  {
    question: "Why is my icon appearing cropped on Android?",
    answer:
      "Android may apply shape masks to your icon. Ensure important content stays within the center 80% of the image area to avoid cropping.",
  },
  {
    question: "Do I need the App Store icon for iOS?",
    answer:
      "Yes! The 1024×1024px App Store icon is mandatory for iOS app submission. It's automatically included in the complete iOS icon set.",
  },
  {
    question: "Can I use a transparent background?",
    answer:
      "For Android, transparency is supported. For iOS, Apple requires opaque backgrounds. Use the background color setting to ensure iOS compatibility.",
  },
  {
    question: "How do I install the generated icons?",
    answer:
      "Each ZIP file includes setup instructions. For Android, copy to res/ folders. For iOS, drag icons to Xcode's App Icon slots in the General tab.",
  },
  {
    question: "What's the difference between legacy and adaptive icons?",
    answer:
      "Legacy icons work on all Android versions but use fixed shapes. Adaptive icons (Android 8.0+) allow the system to apply dynamic shapes and effects.",
  },
  {
    question: "Why should I avoid thin lines in my icon?",
    answer:
      "Thin lines may disappear or become unclear when the icon is scaled down to smaller sizes. Use bold, high-contrast designs for better visibility.",
  },
  {
    question: "Can I generate icons for just one platform?",
    answer:
      "Yes! You can choose to generate icons for Android only, iOS only, or both platforms based on your needs.",
  },
  {
    question: "What's the Play Store icon used for?",
    answer:
      "The 512×512px Play Store icon is used in the Google Play Store listing and Google Play Games. It's separate from the app launcher icons.",
  },
];

export default iconPackGeneratorFAQ;
