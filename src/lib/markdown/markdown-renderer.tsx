import { createElement, type ComponentPropsWithoutRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown, { type ExtraProps, type UrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";

const SAFE_LINK_SCHEMES = new Set(["http", "https", "mailto"]);
const SAFE_IMAGE_SCHEMES = new Set(["http", "https"]);
const SCHEME_PATTERN = /^([a-z][a-z\d+.-]*):/i;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export function sanitizeMarkdownUrl(
  value: string,
  kind: "link" | "image"
): string {
  const url = value.trim();

  if (!url || CONTROL_CHARACTER_PATTERN.test(url)) {
    return "";
  }

  // Fragment, query, absolute-path, and dot-relative URLs cannot introduce a
  // browser URL scheme. Other relative URLs are accepted below when no scheme
  // is present.
  if (
    url.startsWith("#") ||
    url.startsWith("?") ||
    url.startsWith("/") ||
    url.startsWith("./") ||
    url.startsWith("../")
  ) {
    return url;
  }

  const scheme = SCHEME_PATTERN.exec(url)?.[1]?.toLowerCase();
  if (!scheme) {
    return url;
  }

  const allowedSchemes = kind === "image" ? SAFE_IMAGE_SCHEMES : SAFE_LINK_SCHEMES;
  return allowedSchemes.has(scheme) ? url : "";
}

const markdownUrlTransform: UrlTransform = (url, key) =>
  sanitizeMarkdownUrl(url, key === "src" ? "image" : "link");

function SafeLink(props: ComponentPropsWithoutRef<"a"> & ExtraProps) {
  const { children, node, ...safeProps } = props;
  void node;
  if (!safeProps.href) {
    return <span>{children}</span>;
  }

  return (
    <a {...safeProps} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function SafeImage(props: ComponentPropsWithoutRef<"img"> & ExtraProps) {
  const { alt, node, ...safeProps } = props;
  void node;
  if (!safeProps.src) {
    return <span>{alt ?? ""}</span>;
  }

  // Markdown can reference arbitrary remote URLs, which cannot use a fixed
  // Next.js image loader configuration.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...safeProps} alt={alt ?? ""} />;
}

export interface MarkdownPreviewContentProps {
  markdown: string;
}

export function MarkdownPreviewContent({
  markdown,
}: MarkdownPreviewContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml
      urlTransform={markdownUrlTransform}
      components={{ a: SafeLink, img: SafeImage }}
    >
      {markdown}
    </ReactMarkdown>
  );
}

export function renderMarkdownToSafeHtml(markdown: string): string {
  return renderToStaticMarkup(createElement(MarkdownPreviewContent, { markdown }));
}
