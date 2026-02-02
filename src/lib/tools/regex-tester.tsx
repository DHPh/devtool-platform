"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Code,
  Copy,
  Share2,
  Info,
  FileText,
  Hash,
  Download,
  Upload,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  ToolHeader,
  ResultCard,
  ValidationMessages,
  ResponsiveTextArea,
} from "@/components/layout";
import { RegexMatchHighlighter } from "@/lib/tools/regex-studio/components/RegexMatchHighlighter";

// Common regex patterns library
const REGEX_PATTERNS = {
  email: {
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    description: "Email address validation",
    flags: "i",
    example: "user@example.com",
  },
  phone: {
    pattern: "^\\+?[1-9]\\d{1,14}$",
    description: "Phone number (E.164 format)",
    flags: "",
    example: "+1234567890",
  },
  url: {
    pattern:
      "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$",
    description: "URL validation",
    flags: "i",
    example: "https://www.example.com",
  },
  ipv4: {
    pattern:
      "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
    description: "IPv4 address",
    flags: "",
    example: "192.168.1.1",
  },
  hex: {
    pattern: "^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$",
    description: "Hex color code",
    flags: "",
    example: "#FF5733",
  },
  date: {
    pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    description: "Date (YYYY-MM-DD)",
    flags: "",
    example: "2023-12-25",
  },
  creditCard: {
    pattern:
      "^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$",
    description: "Credit card number",
    flags: "",
    example: "4111111111111111",
  },
  strongPassword: {
    pattern:
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
    description: "Strong password validation",
    flags: "",
    example: "MyP@ssw0rd123",
  },
  uuid: {
    pattern:
      "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    description: "UUID validation",
    flags: "i",
    example: "550e8400-e29b-41d4-a716-446655440000",
  },
  ssn: {
    pattern: "^\\d{3}-\\d{2}-\\d{4}$",
    description: "Social Security Number",
    flags: "",
    example: "123-45-6789",
  },
};

interface RegexMatch {
  match: string;
  groups: (string | undefined)[];
  namedGroups: Record<string, string>;
  index: number;
  input: string;
  length: number;
}

interface RegexExplanation {
  pattern: string;
  explanation: string;
  parts: Array<{
    part: string;
    description: string;
    position: [number, number];
  }>;
}

interface RegexStats {
  execTime: number;
  totalMatches: number;
  uniqueMatches: number;
  coverage: number;
}

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [testString, setTestString] = useState("");
  const [replacement, setReplacement] = useState("");
  const [flags, setFlags] = useState({
    g: false,
    i: false,
    m: false,
    s: false,
    u: false,
    y: false,
  });
  const [matches, setMatches] = useState<RegexMatch[]>([]);
  const [error, setError] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [explanation, setExplanation] = useState<RegexExplanation | null>(null);
  const [replacementResult, setReplacementResult] = useState("");
  // SSR-safe tab state initialization
  const [activeTab, setActiveTab] = useState("test");
  // Update tab in URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("tab", tab);
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${params.toString()}`
      );
    }
  };
  const [selectedPattern, setSelectedPattern] = useState("");
  const [stats, setStats] = useState<RegexStats>({
    execTime: 0,
    totalMatches: 0,
    uniqueMatches: 0,
    coverage: 0,
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Generate regex explanation
    const generateExplanation = (regex: string): RegexExplanation => {
      const parts: Array<{
        part: string;
        description: string;
        position: [number, number];
      }> = [];

      // Advanced explanation patterns
      const explanationMap: Record<string, string> = {
        "^": "Start of string/line",
        $: "End of string/line",
        "\\d": "Any digit (0-9)",
        "\\w": "Word character (a-z, A-Z, 0-9, _)",
        "\\s": "Whitespace character",
        "\\D": "Non-digit character",
        "\\W": "Non-word character",
        "\\S": "Non-whitespace character",
        "\\b": "Word boundary",
        "\\B": "Non-word boundary",
        ".": "Any character (except newline)",
        "*": "Zero or more (greedy)",
        "+": "One or more (greedy)",
        "?": "Zero or one (optional)",
        "*?": "Zero or more (lazy)",
        "+?": "One or more (lazy)",
        "??": "Zero or one (lazy)",
        "|": "Alternation (OR)",
        "()": "Capturing group",
        "(?:)": "Non-capturing group",
        "(?=)": "Positive lookahead",
        "(?!)": "Negative lookahead",
        "(?<=)": "Positive lookbehind",
        "(?<!)": "Negative lookbehind",
        "[]": "Character class",
        "[^]": "Negated character class",
        "\\": "Escape character",
        "{}": "Quantifier",
      };

      // Simple pattern breakdown
      let explanation = `Pattern: /${regex}/`;

      // Add flag explanations
      const flagExplanations = [];
      if (flags.g) flagExplanations.push("Global");
      if (flags.i) flagExplanations.push("Case-insensitive");
      if (flags.m) flagExplanations.push("Multiline");
      if (flags.s) flagExplanations.push("Dotall");
      if (flags.u) flagExplanations.push("Unicode");
      if (flags.y) flagExplanations.push("Sticky");

      if (flagExplanations.length > 0) {
        explanation += ` with flags: ${flagExplanations.join(", ")}`;
      }

      // Basic pattern analysis
      const regex_str = regex;
      let pos = 0;

      while (pos < regex_str.length) {
        let found = false;

        // Check for multi-character patterns
        const multiCharPatterns = [
          "\\d",
          "\\w",
          "\\s",
          "\\D",
          "\\W",
          "\\S",
          "\\b",
          "\\B",
          "*?",
          "+?",
          "??",
          "(?:",
          "(?=",
          "(?!",
          "(?<=",
          "(?<!",
          "[^",
        ];

        for (const pattern_key of multiCharPatterns) {
          if (regex_str.substr(pos, pattern_key.length) === pattern_key) {
            parts.push({
              part: pattern_key,
              description:
                explanationMap[pattern_key] || `Pattern: ${pattern_key}`,
              position: [pos, pos + pattern_key.length],
            });
            pos += pattern_key.length;
            found = true;
            break;
          }
        }

        if (!found) {
          const char = regex_str[pos];
          const description =
            explanationMap[char] || `Literal character: "${char}"`;
          parts.push({
            part: char,
            description,
            position: [pos, pos + 1],
          });
          pos++;
        }
      }

      return {
        pattern: regex,
        explanation,
        parts,
      };
    };

    // Calculate statistics
    const calculateStats = (
      matches: RegexMatch[],
      testString: string,
      execTime: number
    ): RegexStats => {
      const totalMatches = matches.length;
      const uniqueMatches = new Set(matches.map((m) => m.match)).size;
      const matchedChars = matches.reduce(
        (sum, match) => sum + match.length,
        0
      );
      const coverage =
        testString.length > 0 ? (matchedChars / testString.length) * 100 : 0;

      return {
        execTime,
        totalMatches,
        uniqueMatches,
        coverage: Math.round(coverage * 100) / 100,
      };
    };

    const testRegex = () => {
      if (!pattern) {
        setMatches([]);
        setError("");
        setIsValid(false);
        setReplacementResult("");
        setStats({
          execTime: 0,
          totalMatches: 0,
          uniqueMatches: 0,
          coverage: 0,
        });
        return;
      }

      try {
        const startTime = performance.now();

        const flagString = Object.entries(flags)
          .filter(([, enabled]) => enabled)
          .map(([flag]) => flag)
          .join("");

        const regex = new RegExp(pattern, flagString);
        setError("");
        setIsValid(true);

        // Generate explanation
        setExplanation(generateExplanation(pattern));

        // Find matches
        const allMatches: RegexMatch[] = [];

        if (flags.g) {
          let match;
          while ((match = regex.exec(testString)) !== null) {
            allMatches.push({
              match: match[0],
              groups: Array.from(match).slice(1),
              namedGroups: match.groups || {},
              index: match.index,
              input: match.input || "",
              length: match[0].length,
            });

            // Prevent infinite loop
            if (match.index === regex.lastIndex) {
              regex.lastIndex++;
            }
          }
        } else {
          const match = regex.exec(testString);
          if (match) {
            allMatches.push({
              match: match[0],
              groups: Array.from(match).slice(1),
              namedGroups: match.groups || {},
              index: match.index,
              input: match.input || "",
              length: match[0].length,
            });
          }
        }

        const endTime = performance.now();
        const execTime = Math.round((endTime - startTime) * 1000) / 1000;

        setMatches(allMatches);
        setStats(calculateStats(allMatches, testString, execTime));

        // Test replacement
        if (replacement) {
          try {
            const result = testString.replace(regex, replacement);
            setReplacementResult(result);
          } catch {
            setReplacementResult("Invalid replacement pattern");
          }
        } else {
          setReplacementResult("");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Invalid regex pattern");
        setIsValid(false);
        setMatches([]);
        setReplacementResult("");
        setStats({
          execTime: 0,
          totalMatches: 0,
          uniqueMatches: 0,
          coverage: 0,
        });
      }
    };

    const timeoutId = setTimeout(testRegex, 300);
    return () => clearTimeout(timeoutId);
  }, [pattern, testString, replacement, flags]);

  // Load common pattern
  const loadPattern = (patternKey: string) => {
    const commonPattern =
      REGEX_PATTERNS[patternKey as keyof typeof REGEX_PATTERNS];
    if (commonPattern) {
      setPattern(commonPattern.pattern);
      setTestString(commonPattern.example);
      setFlags({
        g: commonPattern.flags.includes("g"),
        i: commonPattern.flags.includes("i"),
        m: commonPattern.flags.includes("m"),
        s: commonPattern.flags.includes("s"),
        u: commonPattern.flags.includes("u"),
        y: commonPattern.flags.includes("y"),
      });
      setSelectedPattern(patternKey);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  // Export/Import functionality
  const exportRegex = () => {
    const data = {
      pattern,
      flags,
      testString,
      replacement,
      matches: matches.map((m) => ({
        match: m.match,
        index: m.index,
        groups: m.groups,
      })),
      stats,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `regex-test-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Regex test exported successfully");
  };

  const importRegex = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            setPattern(data.pattern || "");
            setFlags(
              data.flags || {
                g: false,
                i: false,
                m: false,
                s: false,
                u: false,
                y: false,
              }
            );
            setTestString(data.testString || "");
            setReplacement(data.replacement || "");
            toast.success("Regex test imported successfully");
          } catch {
            toast.error("Invalid file format");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Generate shareable link
  const generateShareableLink = () => {
    const params = new URLSearchParams({
      pattern: pattern,
      flags: Object.entries(flags)
        .filter(([, enabled]) => enabled)
        .map(([flag]) => flag)
        .join(""),
      test: testString,
      replacement: replacement,
    });

    const url = `${window.location.origin}${
      window.location.pathname
    }?${params.toString()}`;
    copyToClipboard(url, "Shareable link");
  };

  // Load from URL params on mount and listen for tab param changes (client only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlPattern = params.get("pattern");
    const urlFlags = params.get("flags");
    const urlTest = params.get("test");
    const urlReplacement = params.get("replacement");
    const urlTab = params.get("tab");

    if (urlPattern) setPattern(urlPattern);
    if (urlTest) setTestString(urlTest);
    if (urlReplacement) setReplacement(urlReplacement);
    if (urlFlags) {
      setFlags({
        g: urlFlags.includes("g"),
        i: urlFlags.includes("i"),
        m: urlFlags.includes("m"),
        s: urlFlags.includes("s"),
        u: urlFlags.includes("u"),
        y: urlFlags.includes("y"),
      });
    }
    if (urlTab) setActiveTab(urlTab);

    // Listen for popstate (browser back/forward)
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") || "test";
      setActiveTab(tab);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <TooltipProvider>
      <div className="w-full max-w-7xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
        <ToolHeader
          title="Advanced Regex Tester"
          description="Test, debug, and understand regular expressions with detailed explanations and performance metrics"
          icon={Code}
        />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-4 md:space-y-6">
            {/* Pattern Library */}
            <Card>
              <CardHeader className="px-4 md:px-6">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4 md:h-5 md:w-5" />
                  Pattern Library
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                  {Object.entries(REGEX_PATTERNS).map(
                    ([key, { description, example }]) => (
                      <button
                        key={key}
                        onClick={() => loadPattern(key)}
                        className={`p-2 md:p-3 text-left rounded-lg border transition-colors ${
                          selectedPattern === key
                            ? "bg-primary/5 border-primary"
                            : "bg-muted/50 border-border hover:bg-muted"
                        }`}
                      >
                        <div className="font-medium text-xs md:text-sm">
                          {description}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 font-mono break-all">
                          {example}
                        </div>
                      </button>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Regex Input */}
            <Card>
              <CardHeader className="px-4 md:px-6">
                <CardTitle className="text-base md:text-lg">
                  Regular Expression
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 md:px-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <span className="text-xl font-mono text-muted-foreground hidden sm:inline">
                    /
                  </span>
                  <Input
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder="Enter your regex pattern..."
                    className="font-mono text-sm md:text-base flex-1 min-w-0"
                    style={{ wordBreak: "break-all" }}
                  />
                  <span className="text-xl font-mono text-muted-foreground hidden sm:inline">
                    /
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {Object.entries(flags).map(([flag, enabled]) => (
                      <TooltipProvider key={flag}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() =>
                                setFlags((prev) => ({
                                  ...prev,
                                  [flag]: !enabled,
                                }))
                              }
                              className={`px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm font-mono rounded border transition-colors ${
                                enabled
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                              }`}
                            >
                              {flag}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {flag === "g"
                                ? "Global - Find all matches"
                                : flag === "i"
                                ? "Case insensitive - Ignore case"
                                : flag === "m"
                                ? "Multiline - ^ and $ match line boundaries"
                                : flag === "s"
                                ? "Dotall - . matches newlines"
                                : flag === "u"
                                ? "Unicode - Proper unicode handling"
                                : flag === "y"
                                ? "Sticky - Match at exact position"
                                : flag}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>

                <ValidationMessages errors={error ? [error] : []} />

                {isValid && pattern && (
                  <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                    ✓ Valid regex pattern
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test String */}
            <Card>
              <CardHeader className="px-4 md:px-6">
                <CardTitle className="text-base md:text-lg">
                  Test String
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6">
                <ResponsiveTextArea
                  value={testString}
                  onChange={setTestString}
                  placeholder="Enter text to test against your regex..."
                  minHeight={150}
                  className="font-mono text-sm"
                  showCharacterCount
                />
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="test" className="text-xs md:text-sm">
                  Test Results
                </TabsTrigger>
                <TabsTrigger value="replace" className="text-xs md:text-sm">
                  Replace
                </TabsTrigger>
                <TabsTrigger value="explain" className="text-xs md:text-sm">
                  Explanation
                </TabsTrigger>
                <TabsTrigger value="performance" className="text-xs md:text-sm">
                  Performance
                </TabsTrigger>
              </TabsList>

              <TabsContent value="test" className="space-y-4">
                <ResultCard
                  title={`Matches Found (${matches.length})`}
                  status={matches.length > 0 ? "success" : "info"}
                  onCopy={
                    matches.length > 0
                      ? () =>
                          copyToClipboard(
                            matches.map((m) => m.match).join("\n"),
                            "All matches"
                          )
                      : undefined
                  }
                  copyLabel="Copy All Matches"
                >
                  {matches.length > 0 ? (
                    <div className="space-y-6">
                      {/* Highlighted text */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            Highlighted Text
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDetails(!showDetails)}
                          >
                            {showDetails ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            {showDetails ? "Hide Details" : "Show Details"}
                          </Button>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg border min-h-[100px] overflow-auto">
                          <RegexMatchHighlighter
                            text={testString}
                            matches={matches}
                            className="font-mono text-sm leading-relaxed"
                          />
                        </div>
                      </div>

                      {/* Match details */}
                      {showDetails && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">
                            Match Details
                          </Label>
                          <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {matches.map((match, index) => (
                              <div
                                key={index}
                                className="border rounded-lg p-4 space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <Badge
                                    variant="outline"
                                    className="font-mono"
                                  >
                                    Match {index + 1}
                                  </Badge>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>
                                      Position: {match.index}-
                                      {match.index + match.length}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        copyToClipboard(match.match, "Match")
                                      }
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground">
                                      Full Match
                                    </Label>
                                    <div className="font-mono text-sm bg-muted/50 p-2 rounded border">
                                      {match.match}
                                    </div>
                                  </div>

                                  {match.groups.length > 0 && (
                                    <div>
                                      <Label className="text-xs font-medium text-muted-foreground">
                                        Capturing Groups
                                      </Label>
                                      <div className="space-y-1">
                                        {match.groups.map((group, i) => (
                                          <div
                                            key={i}
                                            className="flex items-center gap-2"
                                          >
                                            <Badge
                                              variant="secondary"
                                              className="text-xs"
                                            >
                                              Group {i + 1}
                                            </Badge>
                                            <code className="font-mono text-sm bg-muted/50 px-2 py-1 rounded">
                                              {group || "<empty>"}
                                            </code>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {Object.keys(match.namedGroups).length >
                                    0 && (
                                    <div>
                                      <Label className="text-xs font-medium text-muted-foreground">
                                        Named Groups
                                      </Label>
                                      <div className="space-y-1">
                                        {Object.entries(match.namedGroups).map(
                                          ([name, value]) => (
                                            <div
                                              key={name}
                                              className="flex items-center gap-2"
                                            >
                                              <Badge
                                                variant="secondary"
                                                className="text-xs"
                                              >
                                                {name}
                                              </Badge>
                                              <code className="font-mono text-sm bg-muted/50 px-2 py-1 rounded">
                                                {value}
                                              </code>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No matches found</p>
                      <p className="text-sm">
                        {pattern
                          ? "Try adjusting your pattern or test string"
                          : "Enter a regex pattern to test"}
                      </p>
                    </div>
                  )}
                </ResultCard>
              </TabsContent>

              <TabsContent value="replace" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Find & Replace</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Replacement Text</Label>
                      <Input
                        value={replacement}
                        onChange={(e) => setReplacement(e.target.value)}
                        placeholder="Enter replacement text (use $1, $2 for groups, $& for full match)..."
                        className="font-mono"
                      />
                      <div className="text-xs text-muted-foreground">
                        Use $1, $2, etc. for capture groups • $& for full match
                        • $&grave; for text before match • $&rsquo; for text
                        after match
                      </div>
                    </div>

                    {replacementResult && (
                      <div className="space-y-2">
                        <Label>Replacement Result</Label>
                        <div className="p-4 bg-muted/50 rounded-lg border min-h-[100px]">
                          <div className="font-mono text-sm whitespace-pre-wrap">
                            {replacementResult}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              replacementResult,
                              "Replacement result"
                            )
                          }
                        >
                          <Copy className="h-3 w-3 mr-2" />
                          Copy Result
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="explain" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Pattern Explanation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pattern ? (
                      <div className="space-y-6">
                        <div className="p-4 bg-muted/50 rounded-lg border">
                          <div className="font-mono text-lg">
                            /{pattern}/
                            {Object.entries(flags)
                              .filter(([, enabled]) => enabled)
                              .map(([flag]) => flag)
                              .join("")}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            {explanation?.explanation}
                          </p>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg">
                            Pattern Breakdown
                          </h4>
                          <div className="grid gap-3">
                            {explanation?.parts.map((part, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                              >
                                <code className="bg-muted px-2 py-1 rounded font-mono text-sm font-medium">
                                  {part.part}
                                </code>
                                <div className="flex-1">
                                  <p className="text-sm">{part.description}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Position: {part.position[0]}-
                                    {part.position[1]}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">
                          No pattern to explain
                        </p>
                        <p className="text-sm">
                          Enter a regex pattern to see detailed explanation
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {stats.execTime}ms
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Execution Time
                        </div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {stats.totalMatches}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Matches
                        </div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {stats.uniqueMatches}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Unique Matches
                        </div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {stats.coverage}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Text Coverage
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Actions */}
            <Card>
              <CardHeader className="px-4 md:px-6">
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 md:px-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateShareableLink}
                  className="w-full"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(pattern, "Regex pattern")}
                  className="w-full"
                  disabled={!pattern}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Pattern
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportRegex}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={importRegex}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Separator />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setPattern("");
                    setTestString("");
                    setReplacement("");
                    setFlags({
                      g: false,
                      i: false,
                      m: false,
                      s: false,
                      u: false,
                      y: false,
                    });
                    setSelectedPattern("");
                  }}
                  className="w-full"
                >
                  Clear All
                </Button>
              </CardContent>
            </Card>

            {/* Quick Reference */}
            <Card>
              <CardHeader className="px-4 md:px-6">
                <CardTitle className="text-base">Quick Reference</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs px-4 md:px-6 max-h-96 md:max-h-none overflow-y-auto">
                {/* Regex Flavor */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-primary">
                    Regex Flavor
                  </h4>
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                    <div className="font-medium">JavaScript (ECMAScript)</div>
                    <div className="text-muted-foreground">
                      Running natively in your browser
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Language Support */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-primary">
                    Language Support
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span>JavaScript</span>
                      <Badge variant="secondary" className="text-xs">
                        Full
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>PHP (PCRE2)</span>
                      <Badge variant="secondary" className="text-xs">
                        Full
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Java</span>
                      <Badge variant="secondary" className="text-xs">
                        Full
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Python</span>
                      <Badge variant="outline" className="text-xs">
                        Emulated
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>C++</span>
                      <Badge variant="secondary" className="text-xs">
                        Full
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Golang</span>
                      <Badge variant="secondary" className="text-xs">
                        Full
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>.NET</span>
                      <Badge variant="secondary" className="text-xs">
                        Full
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Rust</span>
                      <Badge variant="secondary" className="text-xs">
                        Full
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Character Classes */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-primary">
                    Character Classes
                  </h4>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <code>\\d</code>
                      <span className="text-muted-foreground text-right">
                        Digit [0-9]
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <code>\\w</code>
                      <span className="text-muted-foreground text-right">
                        Word [a-zA-Z0-9_]
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <code>\\s</code>
                      <span className="text-muted-foreground text-right">
                        Whitespace
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <code>\\D</code>
                      <span className="text-muted-foreground text-right">
                        Non-digit
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <code>\\W</code>
                      <span className="text-muted-foreground text-right">
                        Non-word
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <code>\\S</code>
                      <span className="text-muted-foreground text-right">
                        Non-whitespace
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <code>.</code>
                      <span className="text-muted-foreground text-right">
                        Any character
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <code>[abc]</code>
                      <span className="text-muted-foreground text-right">
                        Character set
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <code>[^abc]</code>
                      <span className="text-muted-foreground text-right">
                        Negated set
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <code>[a-z]</code>
                      <span className="text-muted-foreground text-right">
                        Range
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Quantifiers */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-primary">
                    Quantifiers
                  </h4>
                  <div className="space-y-1 font-mono">
                    <div className="flex justify-between">
                      <code>*</code>
                      <span className="text-muted-foreground">0 or more</span>
                    </div>
                    <div className="flex justify-between">
                      <code>+</code>
                      <span className="text-muted-foreground">1 or more</span>
                    </div>
                    <div className="flex justify-between">
                      <code>?</code>
                      <span className="text-muted-foreground">0 or 1</span>
                    </div>
                    <div className="flex justify-between">
                      <code>{"{n}"}</code>
                      <span className="text-muted-foreground">Exactly n</span>
                    </div>
                    <div className="flex justify-between">
                      <code>{"{n,}"}</code>
                      <span className="text-muted-foreground">n or more</span>
                    </div>
                    <div className="flex justify-between">
                      <code>{"{n,m}"}</code>
                      <span className="text-muted-foreground">n to m</span>
                    </div>
                    <div className="flex justify-between">
                      <code>*?</code>
                      <span className="text-muted-foreground">0+ (lazy)</span>
                    </div>
                    <div className="flex justify-between">
                      <code>+?</code>
                      <span className="text-muted-foreground">1+ (lazy)</span>
                    </div>
                    <div className="flex justify-between">
                      <code>??</code>
                      <span className="text-muted-foreground">0/1 (lazy)</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Anchors */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-primary">Anchors</h4>
                  <div className="space-y-1 font-mono">
                    <div className="flex justify-between">
                      <code>^</code>
                      <span className="text-muted-foreground">
                        Start of string
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>$</code>
                      <span className="text-muted-foreground">
                        End of string
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>\\b</code>
                      <span className="text-muted-foreground">
                        Word boundary
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>\\B</code>
                      <span className="text-muted-foreground">
                        Non-word boundary
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>\\A</code>
                      <span className="text-muted-foreground">
                        Start of string
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>\\Z</code>
                      <span className="text-muted-foreground">
                        End of string
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Groups */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-primary">
                    Groups & Lookaround
                  </h4>
                  <div className="space-y-1 font-mono">
                    <div className="flex justify-between">
                      <code>(abc)</code>
                      <span className="text-muted-foreground">
                        Capturing group
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>(?:abc)</code>
                      <span className="text-muted-foreground">
                        Non-capturing
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>(?=abc)</code>
                      <span className="text-muted-foreground">
                        Positive lookahead
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>(?!abc)</code>
                      <span className="text-muted-foreground">
                        Negative lookahead
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>(?&lt;=abc)</code>
                      <span className="text-muted-foreground">
                        Positive lookbehind
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>(?&lt;!abc)</code>
                      <span className="text-muted-foreground">
                        Negative lookbehind
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>(?&lt;name&gt;abc)</code>
                      <span className="text-muted-foreground">Named group</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Special Characters */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-primary">
                    Special Characters
                  </h4>
                  <div className="space-y-1 font-mono">
                    <div className="flex justify-between">
                      <code>\\</code>
                      <span className="text-muted-foreground">
                        Escape character
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>|</code>
                      <span className="text-muted-foreground">
                        Alternation (OR)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>\\n</code>
                      <span className="text-muted-foreground">Newline</span>
                    </div>
                    <div className="flex justify-between">
                      <code>\\r</code>
                      <span className="text-muted-foreground">
                        Carriage return
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>\\t</code>
                      <span className="text-muted-foreground">Tab</span>
                    </div>
                    <div className="flex justify-between">
                      <code>\\v</code>
                      <span className="text-muted-foreground">
                        Vertical tab
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>\\f</code>
                      <span className="text-muted-foreground">Form feed</span>
                    </div>
                    <div className="flex justify-between">
                      <code>\\0</code>
                      <span className="text-muted-foreground">
                        Null character
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Flags */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-primary">Flags</h4>
                  <div className="space-y-1 font-mono">
                    <div className="flex justify-between">
                      <code>g</code>
                      <span className="text-muted-foreground">
                        Global search
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>i</code>
                      <span className="text-muted-foreground">
                        Case insensitive
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>m</code>
                      <span className="text-muted-foreground">Multiline</span>
                    </div>
                    <div className="flex justify-between">
                      <code>s</code>
                      <span className="text-muted-foreground">
                        Dotall (. matches \\n)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>u</code>
                      <span className="text-muted-foreground">Unicode</span>
                    </div>
                    <div className="flex justify-between">
                      <code>y</code>
                      <span className="text-muted-foreground">Sticky</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Replacement */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-primary">
                    Replacement
                  </h4>
                  <div className="space-y-1 font-mono">
                    <div className="flex justify-between">
                      <code>$1, $2</code>
                      <span className="text-muted-foreground">
                        Group references
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>$&amp;</code>
                      <span className="text-muted-foreground">Full match</span>
                    </div>
                    <div className="flex justify-between">
                      <code>$`</code>
                      <span className="text-muted-foreground">
                        Before match
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <code>$&apos;</code>
                      <span className="text-muted-foreground">After match</span>
                    </div>
                    <div className="flex justify-between">
                      <code>$$</code>
                      <span className="text-muted-foreground">Literal $</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Common Patterns */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-primary">
                    Common Patterns
                  </h4>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Email:</div>
                      <code className="text-wrap break-all">
                        \\S+@\\S+\\.\\S+
                      </code>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Phone:</div>
                      <code>\\+?[1-9]\\d{"{1,14}"}</code>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">URL:</div>
                      <code className="text-wrap break-all">https?://\\S+</code>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">IPv4:</div>
                      <code className="text-wrap break-all">
                        \\d{"{1,3}"}\\.\\d{"{1,3}"}\\.\\d{"{1,3}"}\\.\\d
                        {"{1,3}"}
                      </code>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Hex Color:</div>
                      <code>#[a-fA-F0-9]{6}</code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Pattern length:</span>
                  <span className="font-mono">{pattern.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Test string length:</span>
                  <span className="font-mono">{testString.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Matches found:</span>
                  <span className="font-mono">{matches.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Execution time:</span>
                  <span className="font-mono">{stats.execTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Active flags:</span>
                  <span className="font-mono">
                    {Object.entries(flags)
                      .filter(([, enabled]) => enabled)
                      .map(([flag]) => flag)
                      .join("") || "none"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
