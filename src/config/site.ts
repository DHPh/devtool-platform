/**
 * Site Configuration
 * Centralized configuration using environment variables
 */

// Default values (fallbacks)
// TODO: Replace these with your actual production values
const DEFAULT_CONFIG = {
  siteUrl: "https://devtool-platform.vercel.app", // TODO: Replace with your actual domain
  siteName: "DevTool Platform", // TODO: Replace with your actual site name
  siteDescription:
    "The ultimate collection of 100+ free online developer tools",
  twitterHandle: "@devtoolplatform", // TODO: Replace with your actual Twitter handle
  contactEmail: "hello@devtoolplatform.com", // TODO: Replace with your actual contact email
};

export const siteConfig = {
  // Basic site info
  url: process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_CONFIG.siteUrl,
  name: process.env.NEXT_PUBLIC_SITE_NAME || DEFAULT_CONFIG.siteName,
  description: DEFAULT_CONFIG.siteDescription,

  // Social media
  twitter: {
    handle: process.env.TWITTER_HANDLE || DEFAULT_CONFIG.twitterHandle,
    site: process.env.TWITTER_HANDLE || DEFAULT_CONFIG.twitterHandle,
  },

  // Contact
  email: process.env.CONTACT_EMAIL || DEFAULT_CONFIG.contactEmail,
  supportUrl:
    process.env.SUPPORT_URL ||
    `${process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_CONFIG.siteUrl}/support`,

  // SEO verification
  // TODO: Replace with actual verification codes from Google Search Console and Bing Webmaster Tools
  verification: {
    google:
      process.env.GOOGLE_VERIFICATION_CODE || "your-google-verification-code", // TODO: Get from Google Search Console
    bing: process.env.BING_VERIFICATION_CODE || "your-bing-verification-code", // TODO: Get from Bing Webmaster Tools
  },

  // Analytics
  analytics: {
    googleId: process.env.GOOGLE_ANALYTICS_ID,
    hotjarId: process.env.HOTJAR_ID,
    enabled: process.env.ENABLE_ANALYTICS === "true",
  },

  // Error monitoring
  sentry: {
    dsn: process.env.SENTRY_DSN,
    enabled: process.env.ENABLE_ERROR_MONITORING === "true",
  },

  // Features
  features: {
    analytics: process.env.ENABLE_ANALYTICS === "true",
    errorMonitoring: process.env.ENABLE_ERROR_MONITORING === "true",
    abTesting: process.env.ENABLE_A_B_TESTING === "true",
  },
};

// Helper functions
export const getAbsoluteUrl = (path: string = "") => {
  return `${siteConfig.url}${path}`;
};

export const getCanonicalUrl = (path: string = "") => {
  return getAbsoluteUrl(path);
};

export const getOgImageUrl = (slug?: string) => {
  if (slug) {
    return getAbsoluteUrl(`/api/og?slug=${slug}`);
  }
  return getAbsoluteUrl("/og-homepage.png");
};

export const getTwitterUrl = () => {
  return `https://twitter.com/${siteConfig.twitter.handle.replace("@", "")}`;
};

// Development helpers
export const isDevelopment = process.env.NODE_ENV === "development";
export const isProduction = process.env.NODE_ENV === "production";

// Validation function
export const validateConfig = () => {
  const warnings: string[] = [];

  if (siteConfig.verification.google === "your-google-verification-code") {
    warnings.push("Google Search Console verification not configured");
  }

  if (siteConfig.verification.bing === "your-bing-verification-code") {
    warnings.push("Bing Webmaster Tools verification not configured");
  }

  if (siteConfig.url.includes("vercel.app") && isProduction) {
    warnings.push("Using default Vercel domain in production");
  }

  if (warnings.length > 0 && isDevelopment) {
    console.warn("⚠️  Configuration warnings:");
    warnings.forEach((warning) => console.warn(`   - ${warning}`));
    console.warn("   Update .env.local with production values");
  }

  return warnings.length === 0;
};

// Export default for easy importing
export default siteConfig;
