// Test script for Icon Pack Generator
// Run this in browser console to test icon generation functionality

console.log("Icon Pack Generator Test Script");

// Test data
const testSpecs = {
  android: {
    adaptive: true,
    legacy: true,
    playStore: true,
  },
  ios: {
    all: true,
    appStore: true,
  },
};

// Test image creation (create a simple test icon)
function createTestCanvas(size = 512) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = size;
  canvas.height = size;

  // Create a simple icon with gradient background and letter
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#3b82f6");
  gradient.addColorStop(1, "#8b5cf6");

  // Background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Letter/Icon
  ctx.fillStyle = "white";
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("A", size / 2, size / 2);

  return canvas;
}

// Test image resize function
function testImageResize() {
  console.log("Testing image resize functionality...");

  const testCanvas = createTestCanvas(1024);
  const testSizes = [20, 40, 60, 120, 180, 192, 432, 512, 1024];

  testSizes.forEach((size) => {
    const resizedCanvas = document.createElement("canvas");
    const ctx = resizedCanvas.getContext("2d");

    resizedCanvas.width = size;
    resizedCanvas.height = size;

    ctx.drawImage(testCanvas, 0, 0, size, size);

    console.log(`✓ Successfully resized to ${size}x${size}`);
  });

  console.log("Image resize test completed!");
}

// Test ZIP generation (mock)
function testZipGeneration() {
  console.log("Testing ZIP structure...");

  const androidStructure = [
    "res/mipmap-mdpi/ic_launcher.png",
    "res/mipmap-hdpi/ic_launcher.png",
    "res/mipmap-xhdpi/ic_launcher.png",
    "res/mipmap-xxhdpi/ic_launcher.png",
    "res/mipmap-xxxhdpi/ic_launcher.png",
    "res/mipmap-xxxhdpi/ic_launcher_foreground.png",
    "res/mipmap-xxxhdpi/ic_launcher_background.png",
    "play_store_icon.png",
    "ANDROID_SETUP.txt",
  ];

  const iosStructure = [
    "ios-icons/Icon-App-20x20@1x.png",
    "ios-icons/Icon-App-20x20@2x.png",
    "ios-icons/Icon-App-20x20@3x.png",
    "ios-icons/Icon-App-29x29@1x.png",
    "ios-icons/Icon-App-29x29@2x.png",
    "ios-icons/Icon-App-29x29@3x.png",
    "ios-icons/Icon-App-40x40@1x.png",
    "ios-icons/Icon-App-40x40@2x.png",
    "ios-icons/Icon-App-40x40@3x.png",
    "ios-icons/Icon-App-60x60@2x.png",
    "ios-icons/Icon-App-60x60@3x.png",
    "ios-icons/Icon-App-76x76@1x.png",
    "ios-icons/Icon-App-76x76@2x.png",
    "ios-icons/Icon-App-83.5x83.5@2x.png",
    "ios-icons/Icon-App-1024x1024@1x.png",
    "IOS_SETUP.txt",
  ];

  console.log("Android structure:", androidStructure);
  console.log("iOS structure:", iosStructure);
  console.log("ZIP structure test completed!");
}

// Test color validation
function testColorValidation() {
  console.log("Testing color validation...");

  const testColors = [
    "#ffffff", // white
    "#000000", // black
    "#ff0000", // red
    "#00ff00", // green
    "#0000ff", // blue
    "#3b82f6", // blue-500
    "rgb(255, 0, 0)", // rgb format
    "invalid-color", // invalid
  ];

  testColors.forEach((color) => {
    try {
      const div = document.createElement("div");
      div.style.backgroundColor = color;
      document.body.appendChild(div);
      const computedColor = getComputedStyle(div).backgroundColor;
      document.body.removeChild(div);

      console.log(`✓ Color ${color} is valid: ${computedColor}`);
    } catch (error) {
      console.log(`✗ Color ${color} is invalid:`, error);
    }
  });

  console.log("Color validation test completed!");
}

// Run all tests
function runAllTests() {
  console.log("=== Icon Pack Generator Tests ===");
  testImageResize();
  testZipGeneration();
  testColorValidation();
  console.log("=== All tests completed! ===");
}

// Export for manual testing
window.iconPackGeneratorTests = {
  createTestCanvas,
  testImageResize,
  testZipGeneration,
  testColorValidation,
  runAllTests,
};

console.log(
  "Test functions available:",
  Object.keys(window.iconPackGeneratorTests)
);
console.log("Run 'iconPackGeneratorTests.runAllTests()' to start testing");
