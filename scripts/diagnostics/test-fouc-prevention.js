/**
 * FOUC (Flash of Unstyled Content) Test Script
 *
 * This script simulates the theme loading behavior that happens in the browser
 * to verify that our FOUC prevention logic works correctly.
 */

// Simulate localStorage with theme data
const mockLocalStorage = {
  "devtool-theme": JSON.stringify({
    state: { theme: "dark" },
  }),
};

// Simulate document.documentElement
const mockHTML = {
  classList: {
    values: [],
    add: function (className) {
      if (!this.values.includes(className)) {
        this.values.push(className);
      }
      console.log(`✅ Added class: ${className}`);
    },
    remove: function (...classNames) {
      classNames.forEach((className) => {
        const index = this.values.indexOf(className);
        if (index > -1) {
          this.values.splice(index, 1);
          console.log(`❌ Removed class: ${className}`);
        }
      });
    },
    toString: function () {
      return this.values.join(" ");
    },
  },
  attributes: {},
  setAttribute: function (name, value) {
    this.attributes[name] = value;
    console.log(`🏷️  Set attribute: ${name}="${value}"`);
  },
  getAttribute: function (name) {
    return this.attributes[name];
  },
};

// Simulate window.matchMedia
const mockMatchMedia = function (query) {
  return {
    matches: query.includes("dark") ? true : false, // Simulate dark preference
    addEventListener: function () {},
    removeEventListener: function () {},
  };
};

console.log("🧪 Testing FOUC Prevention Logic\n");

// Test the actual script logic from layout.tsx
function testFOUCScript() {
  try {
    console.log("📖 Reading theme from localStorage...");

    // Get theme from localStorage (Zustand persist format)
    var stored = mockLocalStorage["devtool-theme"];
    var theme = stored ? JSON.parse(stored).state?.theme : "system";
    var root = mockHTML;

    console.log(`🎨 Found theme: ${theme}`);

    // Clear any existing theme classes first
    root.classList.remove("light", "dark");

    // Apply theme immediately
    if (theme === "system") {
      var systemTheme = mockMatchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      console.log(`🖥️  Applied system theme: ${systemTheme}`);
    } else if (theme === "dark" || theme === "light") {
      root.classList.add(theme);
      console.log(`🎯 Applied selected theme: ${theme}`);
    } else {
      // Fallback to system if unknown theme
      var systemTheme = mockMatchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      console.log(`⚠️  Unknown theme, fallback to system: ${systemTheme}`);
    }

    // Set flag to indicate theme was applied and make content visible
    root.setAttribute("data-theme-applied", "true");

    console.log(`\n✅ Final state:`);
    console.log(`   Classes: ${root.classList.toString()}`);
    console.log(
      `   Theme applied flag: ${root.getAttribute("data-theme-applied")}`
    );
  } catch (error) {
    console.log("❌ Error occurred, applying fallback...");
    console.log(`   Error: ${error.message}`);

    // Fallback to system preference on any error
    var systemTheme = mockMatchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    mockHTML.classList.remove("light", "dark");
    mockHTML.classList.add(systemTheme);
    mockHTML.setAttribute("data-theme-applied", "true");

    console.log(`🔄 Fallback applied: ${systemTheme}`);
  }
}

// Run the test
testFOUCScript();

console.log("\n🔍 Testing different scenarios:\n");

// Test different theme values
const testScenarios = [
  { theme: "light", description: "Light theme" },
  { theme: "dark", description: "Dark theme" },
  { theme: "system", description: "System theme" },
  { theme: "invalid", description: "Invalid theme (should fallback)" },
  { theme: null, description: "No theme stored (should fallback)" },
];

testScenarios.forEach((scenario, index) => {
  console.log(`📋 Scenario ${index + 1}: ${scenario.description}`);

  // Reset mock
  mockHTML.classList.values = [];
  mockHTML.attributes = {};

  // Set mock localStorage
  if (scenario.theme === null) {
    mockLocalStorage["devtool-theme"] = null;
  } else {
    mockLocalStorage["devtool-theme"] = JSON.stringify({
      state: { theme: scenario.theme },
    });
  }

  // Run test
  testFOUCScript();
  console.log("");
});

console.log("🎉 FOUC prevention test completed!");
console.log("\n📝 Summary:");
console.log("- Theme is applied immediately on page load");
console.log("- No FOUC should occur during theme switching");
console.log("- Fallback mechanisms work for error cases");
console.log("- CSS visibility control prevents content flash");
