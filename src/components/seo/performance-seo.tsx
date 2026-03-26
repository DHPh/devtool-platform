import Head from "next/head";

interface PerformanceSEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  noIndex?: boolean;
}

export function PerformanceSEO({
  title,
  description,
  keywords = [],
  noIndex = false,
}: PerformanceSEOProps) {
  return (
    <Head>
      {/* DNS Prefetch for external resources */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />

      {/* Preconnect to critical resources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />

      {/* Resource hints for better performance */}
      <link rel="prefetch" href="/tools" />
      <link
        rel="preload"
        href="/fonts/inter.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />

      {/* SEO Meta Tags */}
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(", ")} />
      )}

      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      )}

      {/* Viewport and mobile optimization */}
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
      />
      <meta name="format-detection" content="telephone=no" />

      {/* Security headers */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />

      {/* Performance hints */}
      <meta httpEquiv="x-dns-prefetch-control" content="on" />

      {/* Cache control for static assets */}
      <meta
        httpEquiv="Cache-Control"
        content="public, max-age=31536000, immutable"
      />
    </Head>
  );
}

// Hook for adding performance monitoring
export function usePerformanceTracking() {
  if (typeof window !== "undefined") {
    // Web Vitals tracking
    import("web-vitals").then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS(() => {});
      onINP(() => {});
      onFCP(() => {});
      onLCP(() => {});
      onTTFB(() => {});
    });
  }
}
