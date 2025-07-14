"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Code } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
  ValidationMessages,
  CopyableResult,
  ResponsiveTextArea,
} from "@/components/layout";

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

  const sampleData = {
    email: {
      pattern: "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b",
      text: `Contact us at:
support@example.com
admin@test.org
user123@domain.co.uk
invalid-email@
another@valid-email.com`
    },
    phoneNumbers: {
      pattern: "\\(\\d{3}\\) \\d{3}-\\d{4}",
      text: `Call us at:
(555) 123-4567
(800) 555-0123
555-123-4567 (invalid format)
(999) 888-7766`
    },
    urls: {
      pattern: "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)",
      text: `Visit these sites:
https://www.example.com
http://test.org
https://subdomain.website.co.uk/path
ftp://invalid.com (not http/https)`
    }
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
    ignoreCase: "Case insensitive matching - Ignore uppercase/lowercase differences",
    multiline: "Multiline mode - ^ and $ match line boundaries instead of string boundaries",
    dotAll: "Dot matches newlines - . matches \\n and \\r characters",
    unicode: "Unicode mode - Proper Unicode handling for character classes",
    sticky: "Sticky mode - Match only at lastIndex position (advanced usage)",
  };

  const testRegex = () => {
    if (!pattern) {
      setMatches([]);
      setError("");
      setWarnings([]);
      return;
    }

    try {
      const flagString = Object.entries(flags)
        .filter(([, enabled]) => enabled)
        .map(([flag]) => {
          switch (flag) {
            case "global": return "g";
            case "ignoreCase": return "i";
            case "multiline": return "m";
            case "dotAll": return "s";
            case "unicode": return "u";
            case "sticky": return "y";
            default: return "";
          }
        })
        .join("");

      // Check for flag conflicts
      const flagWarnings: string[] = [];
      if (flags.global && flags.sticky) {
        flagWarnings.push("Global (g) and Sticky (y) flags can conflict. Consider using only one.");
      }
      setWarnings(flagWarnings);

      const regex = new RegExp(pattern, flagString);
      const foundMatches: Match[] = [];

      if (flags.global) {
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
  };

  useEffect(() => {
    testRegex();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern, text, flags]);

  const clearAll = () => {
    setPattern("");
    setText("");
    setMatches([]);
    setError("");
    setWarnings([]);
  };

  const loadSample = (sampleKey: keyof typeof sampleData) => {
    const sample = sampleData[sampleKey];
    setPattern(sample.pattern);
    setText(sample.text);
  };

  const copyMatches = async () => {
    const matchText = matches.map((m) => m.match).join("\n");
    await navigator.clipboard.writeText(matchText);
    toast.success("Matches copied to clipboard!");
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <ToolHeader
          title="Regex Tester"
          description="Test and validate regular expressions with real-time matching"
          icon={Code}
        />

        <QuickActions
          actions={[
            {
              id: "email",
              label: "Email Pattern",
              onClick: () => loadSample("email"),
            },
            {
              id: "phone",
              label: "Phone Numbers",
              onClick: () => loadSample("phoneNumbers"),
            },
            {
              id: "urls",
              label: "URL Pattern",
              onClick: () => loadSample("urls"),
            },
            {
              id: "test",
              label: "Test Pattern",
              onClick: testRegex,
              variant: "default" as const,
            },
            {
              id: "clear",
              label: "Clear All",
              onClick: clearAll,
              variant: "outline" as const,
            },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pattern Input */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="pattern" className="text-sm font-medium">
                Regular Expression Pattern
              </Label>
              <Input
                id="pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Enter regex pattern..."
                className={`font-mono mt-2 ${!isValid ? "border-destructive" : ""}`}
              />
              <div className="mt-2 text-sm text-muted-foreground">
                <p className="font-medium">Generated Regex:</p>
                <code className="text-xs bg-muted p-1 rounded">
                  /{pattern}/
                  {Object.entries(flags)
                    .filter(([, enabled]) => enabled)
                    .map(([flag]) => {
                      switch (flag) {
                        case "global": return "g";
                        case "ignoreCase": return "i";
                        case "multiline": return "m";
                        case "dotAll": return "s";
                        case "unicode": return "u";
                        case "sticky": return "y";
                        default: return "";
                      }
                    })
                    .join("")}
                </code>
              </div>
            </div>

            {/* Flags */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Flags</Label>
              <div className="grid grid-cols-2 gap-3">
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
            </div>

            {/* Test Text */}
            <div>
              <Label className="text-sm font-medium">
                Test Text
              </Label>
              <ResponsiveTextArea
                value={text}
                onChange={setText}
                placeholder="Enter text to test..."
                minHeight={200}
                showCharacterCount={true}
                className="font-mono mt-2"
              />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <ValidationMessages
              errors={!isValid ? [error] : []}
              warnings={warnings}
            />

            <ResultCard
              title={`Matches (${matches.length})`}
              status={matches.length > 0 ? "success" : "info"}
              onCopy={matches.length > 0 ? copyMatches : undefined}
              copyLabel="Copy All Matches"
            >
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
                      <CopyableResult
                        value={match.match}
                        fontFamily="mono"
                        rows={1}
                      />
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
            </ResultCard>
          </div>
        </div>

        {/* Quick Reference */}
        <ResultCard
          title="Quick Reference"
          status="info"
          description="Common regex patterns and syntax"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">Character Classes</h4>
              <div className="space-y-1 font-mono text-xs">
                <div><code>\\d</code> - Digits (0-9)</div>
                <div><code>\\w</code> - Word characters (a-z, A-Z, 0-9, _)</div>
                <div><code>\\s</code> - Whitespace</div>
                <div><code>.</code> - Any character (except newline)</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Quantifiers</h4>
              <div className="space-y-1 font-mono text-xs">
                <div><code>*</code> - 0 or more</div>
                <div><code>+</code> - 1 or more</div>
                <div><code>?</code> - 0 or 1</div>
                <div><code>{"{n}"}</code> - Exactly n</div>
                <div><code>{"{n,m}"}</code> - Between n and m</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Anchors</h4>
              <div className="space-y-1 font-mono text-xs">
                <div><code>^</code> - Start of string</div>
                <div><code>$</code> - End of string</div>
                <div><code>\\b</code> - Word boundary</div>
                <div><code>\\B</code> - Non-word boundary</div>
              </div>
            </div>
          </div>
        </ResultCard>
      </div>
    </TooltipProvider>
  );
}

export default RegexTester;
