/**
 * Regex Match Highlighter Component
 * Displays text with regex matches highlighted
 */

"use client";

import { RegexMatch } from "@/lib/utils/regex";

interface RegexMatchHighlighterProps {
  text: string;
  matches: RegexMatch[];
  className?: string;
}

export function RegexMatchHighlighter({
  text,
  matches,
  className = "",
}: RegexMatchHighlighterProps) {
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

    // Add highlighted match
    elements.push(
      <span
        key={`match-${i}`}
        className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded font-medium"
        title={`Match ${i + 1}: "${match.match}" at position ${match.index}`}
      >
        {match.match}
      </span>
    );

    lastIndex = match.index + match.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    elements.push(<span key="text-end">{text.substring(lastIndex)}</span>);
  }

  return <pre className={`whitespace-pre-wrap ${className}`}>{elements}</pre>;
}
