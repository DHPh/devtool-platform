/**
 * Regex Match Highlighter Component
 * Displays text with regex matches highlighted
 */

"use client";

import { useEffect, useRef } from "react";

type HighlightMatch = {
  match: string;
  index: number;
  length: number;
};

interface RegexMatchHighlighterProps {
  text: string;
  matches: HighlightMatch[];
  activeMatchIndex?: number | null;
  className?: string;
}

export function RegexMatchHighlighter({
  text,
  matches,
  activeMatchIndex = null,
  className = "",
}: RegexMatchHighlighterProps) {
  const containerRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (activeMatchIndex === null || activeMatchIndex === undefined) return;
    const target = containerRef.current?.querySelector<HTMLElement>(
      `mark[data-match="${activeMatchIndex}"]`,
    );
    target?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [activeMatchIndex]);

  if (!matches.length) {
    return <pre className={`whitespace-pre-wrap ${className}`}>{text}</pre>;
  }

  // Sort matches by index to process in order
  const sortedMatches = [...matches].sort((a, b) => a.index - b.index);

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedMatches.forEach((match, i) => {
    // Add text before match
    if (match.index > lastIndex) {
      elements.push(
        <span key={`text-${i}`}>{text.substring(lastIndex, match.index)}</span>
      );
    }

    const isActive = activeMatchIndex === i;

    // Add highlighted match
    elements.push(
      <mark
        key={`match-${i}`}
        className={
          isActive
            ? "bg-amber-300 dark:bg-amber-600 ring-2 ring-primary px-1 rounded font-semibold"
            : "bg-yellow-200 dark:bg-yellow-800 px-1 rounded font-medium"
        }
        data-match={i}
        data-active={isActive ? "true" : undefined}
        title={`Match ${i + 1}: "${match.match}" at position ${match.index}`}
      >
        {match.match}
      </mark>
    );

    lastIndex = match.index + match.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    elements.push(<span key="text-end">{text.substring(lastIndex)}</span>);
  }

  return (
    <pre ref={containerRef} className={`whitespace-pre-wrap ${className}`}>
      {elements}
    </pre>
  );
}
