"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { regexTesterFAQ, FAQSection } from "@/lib/faq-data";

interface Match {
  match: string;
  index: number;
  groups?: string[];
}

export function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [text, setText] = useState("");
  const [flags, setFlags] = useState({
    global: true,
    ignoreCase: false,
    multiline: false,
    dotAll: false,
    unicode: false,
    sticky: false,
  });
  const [matches, setMatches] = useState<Match[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    // Check for flag conflicts
    const flagWarnings: string[] = [];

    // Global + Sticky conflict
    if (flags.global && flags.sticky) {
      flagWarnings.push(
        "Global (g) and Sticky (y) flags can conflict. Consider using only one."
      );
    }

    // Sticky flag warning
    if (flags.sticky && !flags.global) {
      flagWarnings.push(
        "Sticky (y) flag requires careful handling of lastIndex property."
      );
    }

    // Multiline + DotAll information (not conflict, just info)
    if (flags.multiline && flags.dotAll) {
      flagWarnings.push(
        "Info: Multiline (m) affects ^ and $, while DotAll (s) affects . behavior."
      );
    }

    setWarnings(flagWarnings);

    if (!pattern) {
      setMatches([]);
      return;
    }

    try {
      const flagString = Object.entries(flags)
        .filter(([, enabled]) => enabled)
        .map(([flag]) => {
          switch (flag) {
            case "global":
              return "g";
            case "ignoreCase":
              return "i";
            case "multiline":
              return "m";
            case "dotAll":
              return "s";
            case "unicode":
              return "u";
            case "sticky":
              return "y";
            default:
              return "";
          }
        })
        .join("");

      const regex = new RegExp(pattern, flagString);
      const foundMatches: Match[] = [];

      // Handle sticky flag specially
      if (flags.sticky) {
        // Sticky flag requires different handling
        regex.lastIndex = 0;
        let match;
        while ((match = regex.exec(text)) !== null) {
          foundMatches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
          if (!flags.global) break;
          // For sticky, if no global flag, only one match
          if (!flags.global) break;
        }
      } else if (flags.global) {
        let match;
        while ((match = regex.exec(text)) !== null) {
          foundMatches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      } else {
        const match = regex.exec(text);
        if (match) {
          foundMatches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      }

      setMatches(foundMatches);
      setIsValid(true);
      setError("");
    } catch (err) {
      setIsValid(false);
      setError(err instanceof Error ? err.message : "Invalid regex pattern");
      setMatches([]);
    }
  }, [pattern, text, flags]);

  const copyMatches = async () => {
    const matchText = matches.map((m) => m.match).join("\n");
    await navigator.clipboard.writeText(matchText);
    toast.success("Matches copied to clipboard!");
  };

  const clearAll = () => {
    setPattern("");
    setText("");
    setMatches([]);
    setError("");
  };

  const loadSample = () => {
    setPattern("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b");
    setText(`Contact us at:
support@example.com
admin@test.org
user123@domain.co.uk
invalid-email@
another@valid-email.com`);
  };

  const flagDescriptions = {
    global: "Global (g)",
    ignoreCase: "Ignore Case (i)",
    multiline: "Multiline (m)",
    dotAll: "Dot All (s)",
    unicode: "Unicode (u)",
    sticky: "Sticky (y)",
  };

  const flagTooltips = {
    global: "Find all matches - Without this, only first match is found",
    ignoreCase:
      "Case insensitive matching - Ignore uppercase/lowercase differences",
    multiline:
      "Multiline mode - ^ and $ match line boundaries instead of string boundaries",
    dotAll: "Dot matches newlines - . matches \\n and \\r characters",
    unicode: "Unicode mode - Proper Unicode handling for character classes",
    sticky: "Sticky mode - Match only at lastIndex position (advanced usage)",
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={clearAll} variant="outline">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Button onClick={loadSample} variant="outline">
            Load Email Example
          </Button>
          <Button
            onClick={copyMatches}
            variant="outline"
            disabled={matches.length === 0}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Matches
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pattern & Flags */}
          <Card>
            <CardHeader>
              <CardTitle>Regular Expression</CardTitle>
              <CardDescription>
                Enter your regex pattern and configure flags
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pattern">Pattern</Label>
                <Input
                  id="pattern"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="Enter regex pattern..."
                  className={`font-mono ${
                    !isValid ? "border-destructive" : ""
                  }`}
                />
                {!isValid && (
                  <p className="text-destructive text-sm">{error}</p>
                )}
                {warnings.length > 0 && (
                  <div className="space-y-1">
                    {warnings.map((warning, index) => (
                      <p
                        key={index}
                        className="text-orange-600 dark:text-orange-400 text-sm"
                      >
                        ⚠️ {warning}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Label className="pb-2">Flags</Label>
                {Object.entries(flagDescriptions).map(([key, description]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label htmlFor={key} className="text-sm cursor-help">
                          {description}
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{flagTooltips[key as keyof typeof flagTooltips]}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Switch
                      id={key}
                      checked={flags[key as keyof typeof flags]}
                      onCheckedChange={(checked) =>
                        setFlags((prev) => ({ ...prev, [key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="font-medium">Generated Regex:</p>
                <code className="text-xs bg-muted p-1 rounded">
                  /{pattern}/
                  {Object.entries(flags)
                    .filter(([, enabled]) => enabled)
                    .map(([flag]) => {
                      switch (flag) {
                        case "global":
                          return "g";
                        case "ignoreCase":
                          return "i";
                        case "multiline":
                          return "m";
                        case "dotAll":
                          return "s";
                        case "unicode":
                          return "u";
                        case "sticky":
                          return "y";
                        default:
                          return "";
                      }
                    })
                    .join("")}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Test Text */}
          <Card>
            <CardHeader>
              <CardTitle>Test Text</CardTitle>
              <CardDescription>
                Enter the text to test against your regex
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to test..."
                className="min-h-[400px] font-mono text-sm textarea-enhanced"
              />
              <div className="text-sm text-muted-foreground mt-2">
                Characters: {text.length}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Matches</span>
                <Badge variant={matches.length > 0 ? "default" : "secondary"}>
                  {matches.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Regex matches found in the test text
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {matches.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    {pattern
                      ? "No matches found"
                      : "Enter a regex pattern to see matches"}
                  </p>
                ) : (
                  matches.map((match, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Match {index + 1}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Index: {match.index}
                        </span>
                      </div>
                      <div className="font-mono text-sm bg-muted p-2 rounded">
                        {match.match}
                      </div>
                      {match.groups && match.groups.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium">
                            Capturing Groups:
                          </p>
                          {match.groups.map((group, groupIndex) => (
                            <div
                              key={groupIndex}
                              className="text-xs font-mono bg-muted p-1 rounded"
                            >
                              Group {groupIndex + 1}: {group || "(empty)"}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium">Character Classes</h4>
                  <div className="space-y-1 font-mono text-xs">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <code>.</code> - Any character
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Matches any single character except newline</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <code>\d</code> - Digit (0-9)
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Matches any digit character (0-9)</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <code>\w</code> - Word character
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Matches any word character (a-z, A-Z, 0-9, _)</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <code>\s</code> - Whitespace
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Matches any whitespace character (space, tab, newline)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <code>[abc]</code> - Character set
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Matches any one of the characters inside the brackets
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <code>[^abc]</code> - Negated set
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Matches any character NOT inside the brackets</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Quantifiers</h4>
                  <div className="space-y-1 font-mono text-xs">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <code>*</code> - 0 or more
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Matches 0 or more of the preceding character/group
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <code>+</code> - 1 or more
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Matches 1 or more of the preceding character/group
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <code>?</code> - 0 or 1
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Matches 0 or 1 of the preceding character/group
                          (optional)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <code>{`{n}`}</code> - Exactly n
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Matches exactly n occurrences of the preceding
                          character/group
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <code>{`{n,m}`}</code> - Between n and m
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Matches between n and m occurrences of the preceding
                          character/group
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <code>{`{n,}`}</code> - n or more
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Matches n or more occurrences of the preceding
                          character/group
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Anchors</h4>
                  <div className="space-y-1 font-mono text-xs">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <code>^</code> - Start of string
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Matches the start of the string (or line in multiline
                          mode)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <code>$</code> - End of string
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Matches the end of the string (or line in multiline
                          mode)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <code>\b</code> - Word boundary
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Matches a word boundary (between word and non-word
                          characters)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <code>\B</code> - Non-word boundary
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Matches a non-word boundary (between two word or two
                          non-word characters)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <code>(?=...)</code> - Positive lookahead
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Matches a group after the main expression without
                          including it in the result
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <code>(?!...)</code> - Negative lookahead
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Matches if the group does NOT match after the main
                          expression
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* Flag Conflicts Warning */}
              <div className="border-t pt-4">
                <h4 className="font-medium pb-6">
                  Flag Combinations & Conflicts
                </h4>
                <div className="space-y-2 text-sm">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-start space-x-2 cursor-help">
                        <span className="text-red-500">⚠️</span>
                        <div>
                          <span className="font-medium text-red-600 dark:text-red-400">
                            Global (g) + Sticky (y):
                          </span>
                          <span className="text-muted-foreground ml-2">
                            Can cause conflicts. Use with caution.
                          </span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Sticky flag can behave unpredictably with global flag.
                        The sticky flag requires matching at a specific position
                        (lastIndex), while global flag finds all matches.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-start space-x-2 cursor-help">
                        <span className="text-yellow-500">⚠️</span>
                        <div>
                          <span className="font-medium text-yellow-600 dark:text-yellow-400">
                            Sticky (y) alone:
                          </span>
                          <span className="text-muted-foreground ml-2">
                            Requires careful lastIndex handling.
                          </span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Sticky flag only matches at the exact position specified
                        by lastIndex. You need to manually manage the lastIndex
                        property.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-start space-x-2 cursor-help">
                        <span className="text-blue-500">ℹ️</span>
                        <div>
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            Multiline (m) + DotAll (s):
                          </span>
                          <span className="text-muted-foreground ml-2">
                            Compatible. They affect different behaviors.
                          </span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Multiline affects ^ and $ anchors to match line
                        boundaries. DotAll affects . to match newlines. These
                        work together without conflicts.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-start space-x-2 cursor-help">
                        <span className="text-green-500">✅</span>
                        <div>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            Unicode (u) + others:
                          </span>
                          <span className="text-muted-foreground ml-2">
                            Fully compatible with all flags.
                          </span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Unicode flag enables proper Unicode support and is fully
                        compatible with all other flags. Recommended for
                        international text.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How to Use Section */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use the Regex Tester</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Step-by-Step Guide</h4>
                <ol className="space-y-2 text-sm list-decimal list-inside">
                  <li>
                    Enter your regular expression pattern in the Pattern field
                  </li>
                  <li>Paste or type your test text in the Test Text area</li>
                  <li>Configure flags as needed (Global, Ignore Case, etc.)</li>
                  <li>View real-time matches in the Matches panel</li>
                  <li>
                    Copy results or use the sample email pattern to get started
                  </li>
                </ol>
              </div>
              <div>
                <h4 className="font-medium mb-3">Pro Tips</h4>
                <ul className="space-y-2 text-sm list-disc list-inside text-muted-foreground">
                  <li>Use capturing groups ( ) to extract specific parts</li>
                  <li>
                    Test edge cases with empty strings and special characters
                  </li>
                  <li>
                    Enable Global flag to find all matches, not just the first
                  </li>
                  <li>Use word boundaries \\b for precise word matching</li>
                  <li>Escape special characters with backslash when needed</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Common questions about regex testing and pattern matching
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FAQSection items={regexTesterFAQ} />
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
