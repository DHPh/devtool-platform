import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { Toaster } from "sonner";
import { siteConfig, validateConfig } from "@/config/site";
import { TOOL_COUNT } from "@/lib/tool-registry";

const inter = Inter({ subsets: ["latin"] });

// Validate configuration in development
if (process.env.NODE_ENV === "development") {
  validateConfig();
}

// TODO: Add these favicons to public/ directory before production
// TODO: Create and upload: favicon.ico, favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} - ${TOOL_COUNT} Developer Tools`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "developer tools",
    "JSON formatter",
    "Base64 encoder",
    "regex tester",
    "UUID generator",
    "hash generator",
    "web tools",
    "online tools",
    "free tools",
    "code formatter",
    "data converter",
    "text tools",
    "crypto tools",
    "URL encoder",
    "HTML formatter",
    "CSS formatter",
    "JavaScript formatter",
    "markdown preview",
    "color converter",
    "timestamp converter",
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "Technology",
  classification: "Developer Tools",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: siteConfig.url,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: `${siteConfig.name} - ${TOOL_COUNT} Developer Tools`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: "/og-image.png", // TODO: Create and upload this OG image (1200x630)
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - ${TOOL_COUNT} Developer Tools`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitter.site, // TODO: Update with real Twitter handle
    creator: siteConfig.twitter.handle, // TODO: Update with real Twitter handle
    title: `${siteConfig.name} - ${TOOL_COUNT} Developer Tools`,
    description: siteConfig.description,
    images: ["/og-image.png"], // TODO: Create and upload this OG image
  },
  verification: {
    google: siteConfig.verification.google, // TODO: Replace with real Google verification code
    other: {
      "msvalidate.01": siteConfig.verification.bing, // TODO: Replace with real Bing verification code
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "DevTool Platform",
    description: siteConfig.description,
    url: "https://devtool-platform.vercel.app",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    provider: {
      "@type": "Organization",
      name: "DevTool Platform",
    },
    featureList: [
      "JSON Formatter",
      "Base64 Encoder/Decoder",
      "Regex Tester",
      "Hash Generator",
      "UUID Generator",
      "URL Encoder/Decoder",
      "HTML Formatter",
      "CSS Formatter",
      "JavaScript Formatter",
      "Markdown Preview",
      "Color Converter",
      "Timestamp Converter",
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        {/* Prevent FOUC (Flash of Unstyled Content) for theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Get theme from localStorage (Zustand persist format)
                  var stored = localStorage.getItem('devtool-theme');
                  var theme = stored ? JSON.parse(stored).state?.theme : 'system';
                  var root = document.documentElement;
                  
                  // Clear any existing theme classes first
                  root.classList.remove('light', 'dark');
                  
                  // Apply theme immediately
                  if (theme === 'system') {
                    var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    root.classList.add(systemTheme);
                  } else if (theme === 'dark' || theme === 'light') {
                    root.classList.add(theme);
                  } else {
                    // Fallback to system if unknown theme
                    var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    root.classList.add(systemTheme);
                  }
                  
                  // Set flag to indicate theme was applied and make content visible
                  root.setAttribute('data-theme-applied', 'true');
                  
                } catch (e) {
                  // Fallback to system preference on any error
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(systemTheme);
                  document.documentElement.setAttribute('data-theme-applied', 'true');
                }
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className={inter.className}>
        <Navigation />
        <main className="min-h-screen w-full">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
