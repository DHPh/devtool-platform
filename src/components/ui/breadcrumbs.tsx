import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { serializeJsonForHtml } from "@/lib/security/safe-json";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://devtool-platform.vercel.app",
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: item.label,
        ...(item.href && {
          item: `https://devtool-platform.vercel.app${item.href}`,
        }),
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonForHtml(structuredData),
        }}
      />
      <nav
        aria-label="Breadcrumb"
        className="flex items-center space-x-1 text-sm text-muted-foreground mb-6"
      >
        <Link
          href="/"
          className="flex items-center hover:text-foreground transition-colors"
          aria-label="Go to homepage"
        >
          <Home className="h-4 w-4" />
          <span className="sr-only">Home</span>
        </Link>

        {items.map((item, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="h-4 w-4" />
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
                aria-current={index === items.length - 1 ? "page" : undefined}
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>
    </>
  );
}
