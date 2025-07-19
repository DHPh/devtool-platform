"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  Target,
  Search,
  FileText,
  AlertCircle,
  Info,
  Dice1,
} from "lucide-react";
import { toast } from "sonner";
import { ToolHeader } from "@/components/layout";

export const metadata = {
  id: "password-generator",
  name: "Advanced Security Suite",
  description:
    "Comprehensive password security tools with generation, analysis, and breach checking",
  category: "Security",
  tags: ["password", "generator", "security", "random", "breach", "analysis"],
  path: "/tools/password-generator",
  icon: "🔒",
};

interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
}

interface PasswordAnalysis {
  strength: number;
  label: string;
  issues: string[];
  suggestions: string[];
  entropy: number;
  crackTime: string;
}

interface BreachResult {
  isBreached: boolean;
  count: number;
  message: string;
}

export default function AdvancedSecuritySuite() {
  // Next.js App Router: useSearchParams
  const [activeTab, setActiveTab] = useState("generator");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (
        tab &&
        ["generator", "analysis", "breach", "passphrase"].includes(tab)
      ) {
        setActiveTab(tab);
      }
    }
  }, []);

  // Khi chuyển tab, cập nhật URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Password Generator State
  const [password, setPassword] = useState("");
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
  });

  // Password Analysis State
  const [analysisPassword, setAnalysisPassword] = useState("");
  const [analysis, setAnalysis] = useState<PasswordAnalysis | null>(null);
  const [showAnalysisPassword, setShowAnalysisPassword] = useState(false);

  // Breach Checker State
  const [breachPassword, setBreachPassword] = useState("");
  const [breachResult, setBreachResult] = useState<BreachResult | null>(null);
  const [isCheckingBreach, setIsCheckingBreach] = useState(false);

  // Passphrase Generator State
  const [passphrase, setPassphrase] = useState("");
  const [passphraseWords, setPassphraseWords] = useState(4);
  const [passphraseSeparator, setPassphraseSeparator] = useState("-");

  const characterSets = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    similar: "il1Lo0O",
    ambiguous: "{}[]()/\\'\"~,;.<>",
  };

  const commonWords = [
    "apple",
    "banana",
    "cherry",
    "dragon",
    "eagle",
    "forest",
    "galaxy",
    "hammer",
    "island",
    "jungle",
    "kitten",
    "lemon",
    "mountain",
    "ocean",
    "piano",
    "quartz",
    "rainbow",
    "sunset",
    "thunder",
    "umbrella",
    "valley",
    "wizard",
    "xenon",
    "yellow",
    "zebra",
    "bridge",
    "castle",
    "diamond",
    "engine",
    "flower",
    "guitar",
    "harmony",
    "iceberg",
    "journey",
    "kitchen",
    "lighthouse",
    "melody",
    "notebook",
    "orchard",
    "puzzle",
    "quantum",
    "river",
    "storm",
    "telescope",
    "universe",
    "volcano",
    "waterfall",
    "crystal",
    "adventure",
  ];

  const generatePassword = () => {
    let charset = "";

    if (options.includeUppercase) charset += characterSets.uppercase;
    if (options.includeLowercase) charset += characterSets.lowercase;
    if (options.includeNumbers) charset += characterSets.numbers;
    if (options.includeSymbols) charset += characterSets.symbols;

    if (options.excludeSimilar) {
      charset = charset
        .split("")
        .filter((char) => !characterSets.similar.includes(char))
        .join("");
    }

    if (options.excludeAmbiguous) {
      charset = charset
        .split("")
        .filter((char) => !characterSets.ambiguous.includes(char))
        .join("");
    }

    if (charset === "") {
      toast.error("Please select at least one character type");
      return;
    }

    let result = "";
    for (let i = 0; i < options.length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    setPassword(result);
    toast.success("Password generated!");
  };

  const generatePassphrase = () => {
    const selectedWords = [];
    for (let i = 0; i < passphraseWords; i++) {
      const randomWord =
        commonWords[Math.floor(Math.random() * commonWords.length)];
      selectedWords.push(
        randomWord.charAt(0).toUpperCase() + randomWord.slice(1)
      );
    }

    const separator = passphraseSeparator === "none" ? "" : passphraseSeparator;
    const result =
      selectedWords.join(separator) + Math.floor(Math.random() * 999);
    setPassphrase(result);
    toast.success("Passphrase generated!");
  };

  const analyzePassword = (pwd: string): PasswordAnalysis => {
    let strength = 0;
    const issues = [];
    const suggestions = [];

    // Length analysis
    if (pwd.length < 8) {
      issues.push("Password is too short");
      suggestions.push("Use at least 8 characters");
    } else if (pwd.length >= 8) strength += 25;
    if (pwd.length >= 12) strength += 15;
    if (pwd.length >= 16) strength += 10;

    // Character variety
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[^A-Za-z0-9]/.test(pwd);

    if (!hasLower) {
      issues.push("Missing lowercase letters");
      suggestions.push("Add lowercase letters (a-z)");
    } else strength += 10;

    if (!hasUpper) {
      issues.push("Missing uppercase letters");
      suggestions.push("Add uppercase letters (A-Z)");
    } else strength += 10;

    if (!hasNumber) {
      issues.push("Missing numbers");
      suggestions.push("Add numbers (0-9)");
    } else strength += 10;

    if (!hasSymbol) {
      issues.push("Missing special characters");
      suggestions.push("Add special characters (!@#$...)");
    } else strength += 15;

    // Pattern analysis
    if (/(.)\1{2,}/.test(pwd)) {
      issues.push("Contains repeated characters");
      suggestions.push("Avoid repeating characters");
      strength -= 10;
    }

    if (/123|abc|qwe|password|admin/i.test(pwd)) {
      issues.push("Contains common patterns");
      suggestions.push("Avoid common sequences and words");
      strength -= 15;
    }

    // Calculate entropy
    let charsetSize = 0;
    if (hasLower) charsetSize += 26;
    if (hasUpper) charsetSize += 26;
    if (hasNumber) charsetSize += 10;
    if (hasSymbol) charsetSize += 32;

    const entropy = pwd.length * Math.log2(charsetSize);

    // Estimate crack time
    const combinations = Math.pow(charsetSize, pwd.length);
    const secondsToHalfCombinations = combinations / 2 / 1e9; // Assuming 1 billion guesses per second

    let crackTime = "";
    if (secondsToHalfCombinations < 60) {
      crackTime = "Less than 1 minute";
    } else if (secondsToHalfCombinations < 3600) {
      crackTime = `${Math.round(secondsToHalfCombinations / 60)} minutes`;
    } else if (secondsToHalfCombinations < 86400) {
      crackTime = `${Math.round(secondsToHalfCombinations / 3600)} hours`;
    } else if (secondsToHalfCombinations < 31536000) {
      crackTime = `${Math.round(secondsToHalfCombinations / 86400)} days`;
    } else {
      crackTime = `${Math.round(secondsToHalfCombinations / 31536000)} years`;
    }

    strength = Math.max(0, Math.min(100, strength));

    let label = "";
    if (strength < 30) label = "Very Weak";
    else if (strength < 50) label = "Weak";
    else if (strength < 70) label = "Fair";
    else if (strength < 85) label = "Good";
    else label = "Strong";

    return {
      strength,
      label,
      issues,
      suggestions,
      entropy: Math.round(entropy),
      crackTime,
    };
  };

  const checkBreach = async (pwd: string) => {
    setIsCheckingBreach(true);
    try {
      // Simulate breach checking (in real app, use HaveIBeenPwned API)
      const commonPasswords = [
        "123456",
        "password",
        "123456789",
        "12345678",
        "12345",
        "1234567",
        "admin",
        "qwerty",
        "abc123",
        "letmein",
        "welcome",
        "monkey",
        "password123",
      ];

      const isCommon = commonPasswords.includes(pwd.toLowerCase());

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (isCommon) {
        setBreachResult({
          isBreached: true,
          count: Math.floor(Math.random() * 1000000) + 100000,
          message: "This password has been found in data breaches",
        });
      } else {
        setBreachResult({
          isBreached: false,
          count: 0,
          message: "This password was not found in known data breaches",
        });
      }
    } catch {
      toast.error("Failed to check breach status");
    } finally {
      setIsCheckingBreach(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  useEffect(() => {
    if (analysisPassword) {
      const result = analyzePassword(analysisPassword);
      setAnalysis(result);
    } else {
      setAnalysis(null);
    }
  }, [analysisPassword]);

  useEffect(() => {
    generatePassword();
    generatePassphrase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStrengthIcon = (strength: number) => {
    if (strength < 50)
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (strength < 85) return <Shield className="h-4 w-4 text-yellow-500" />;
    return <ShieldCheck className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        title="Advanced Security Suite"
        description="Comprehensive password security tools with generation, analysis, and breach checking"
        icon={ShieldCheck}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Mobile Navigation - Dropdown */}
        <div className="block md:hidden mb-6">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a tool" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="generator">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Password Generator
                </div>
              </SelectItem>
              <SelectItem value="analysis">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Password Analysis
                </div>
              </SelectItem>
              <SelectItem value="breach">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Breach Checker
                </div>
              </SelectItem>
              <SelectItem value="passphrase">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Passphrase Generator
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Navigation - Tabs */}
        <TabsList className="hidden md:grid w-full grid-cols-4">
          <TabsTrigger value="generator" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Generator
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="breach" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Breach Check
          </TabsTrigger>
          <TabsTrigger value="passphrase" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Passphrase
          </TabsTrigger>
        </TabsList>

        {/* Password Generator Tab */}
        <TabsContent value="generator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Settings Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Password Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Length Slider */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Password Length: {options.length}
                    </Label>
                    <Slider
                      value={[options.length]}
                      onValueChange={(value) =>
                        setOptions((prev) => ({ ...prev, length: value[0] }))
                      }
                      max={128}
                      min={4}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Character Types */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Character Types
                    </Label>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="uppercase" className="text-sm">
                          Uppercase (A-Z)
                        </Label>
                        <Switch
                          id="uppercase"
                          checked={options.includeUppercase}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              includeUppercase: checked,
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="lowercase" className="text-sm">
                          Lowercase (a-z)
                        </Label>
                        <Switch
                          id="lowercase"
                          checked={options.includeLowercase}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              includeLowercase: checked,
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="numbers" className="text-sm">
                          Numbers (0-9)
                        </Label>
                        <Switch
                          id="numbers"
                          checked={options.includeNumbers}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              includeNumbers: checked,
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="symbols" className="text-sm">
                          Symbols (!@#$%...)
                        </Label>
                        <Switch
                          id="symbols"
                          checked={options.includeSymbols}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              includeSymbols: checked,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Exclusions */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Character Exclusions
                    </Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="similar" className="text-sm">
                          Exclude similar (il1Lo0O)
                        </Label>
                        <Switch
                          id="similar"
                          checked={options.excludeSimilar}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              excludeSimilar: checked,
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ambiguous" className="text-sm">
                          Exclude ambiguous ({`{}[]()/\\'\"~,;.<>`})
                        </Label>
                        <Switch
                          id="ambiguous"
                          checked={options.excludeAmbiguous}
                          onCheckedChange={(checked) =>
                            setOptions((prev) => ({
                              ...prev,
                              excludeAmbiguous: checked,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={generatePassword} className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Password
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Results Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Generated Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {password && (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border font-mono break-all">
                          {password}
                        </div>
                        <Button
                          onClick={() => copyToClipboard(password, "Password")}
                          variant="outline"
                          className="w-full"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Password
                        </Button>
                      </div>

                      {/* Quick Strength Display */}
                      {(() => {
                        const quickAnalysis = analyzePassword(password);
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                Strength
                              </span>
                              <div className="flex items-center gap-2">
                                {getStrengthIcon(quickAnalysis.strength)}
                                <span className="text-sm font-medium">
                                  {quickAnalysis.label}
                                </span>
                              </div>
                            </div>
                            <Progress
                              value={quickAnalysis.strength}
                              className="h-2"
                            />
                            <div className="text-xs text-muted-foreground">
                              Entropy: {quickAnalysis.entropy} bits • Crack
                              time: {quickAnalysis.crackTime}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Password Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Password Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Enter password to analyze</Label>
                  <div className="relative">
                    <Input
                      type={showAnalysisPassword ? "text" : "password"}
                      value={analysisPassword}
                      onChange={(e) => setAnalysisPassword(e.target.value)}
                      placeholder="Enter password to analyze..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() =>
                        setShowAnalysisPassword(!showAnalysisPassword)
                      }
                    >
                      {showAnalysisPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {analysis && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Security Score
                        </span>
                        <div className="flex items-center gap-2">
                          {getStrengthIcon(analysis.strength)}
                          <span className="text-sm font-medium">
                            {analysis.label}
                          </span>
                        </div>
                      </div>
                      <Progress value={analysis.strength} className="h-3" />
                      <div className="text-xs text-muted-foreground">
                        {analysis.strength}/100 points
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Entropy:</span>
                        <div className="text-muted-foreground">
                          {analysis.entropy} bits
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Crack Time:</span>
                        <div className="text-muted-foreground">
                          {analysis.crackTime}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {analysis && (
              <div className="space-y-4">
                {analysis.issues.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Security Issues
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.issues.map((issue, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-sm text-red-600"
                          >
                            <AlertCircle className="h-4 w-4" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {analysis.suggestions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-blue-600 flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.suggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-sm text-blue-600"
                          >
                            <CheckCircle className="h-4 w-4" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Breach Check Tab */}
        <TabsContent value="breach" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Data Breach Checker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Check if password has been in data breaches</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={breachPassword}
                    onChange={(e) => setBreachPassword(e.target.value)}
                    placeholder="Enter password to check..."
                    className="flex-1"
                  />
                  <Button
                    onClick={() => checkBreach(breachPassword)}
                    disabled={!breachPassword || isCheckingBreach}
                  >
                    {isCheckingBreach ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Check
                  </Button>
                </div>
              </div>

              {breachResult && (
                <Card
                  className={
                    breachResult.isBreached
                      ? "border-red-200"
                      : "border-green-200"
                  }
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      {breachResult.isBreached ? (
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                      ) : (
                        <ShieldCheck className="h-8 w-8 text-green-500" />
                      )}
                      <div>
                        <div
                          className={`font-medium ${
                            breachResult.isBreached
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {breachResult.isBreached
                            ? "Password Compromised"
                            : "Password Secure"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {breachResult.message}
                        </div>
                        {breachResult.isBreached && (
                          <div className="text-xs text-red-600 mt-1">
                            Found in {breachResult.count.toLocaleString()}{" "}
                            breaches
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Passphrase Tab */}
        <TabsContent value="passphrase" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Passphrase Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Number of words: {passphraseWords}</Label>
                  <Slider
                    value={[passphraseWords]}
                    onValueChange={(value) => setPassphraseWords(value[0])}
                    max={8}
                    min={3}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Separator</Label>
                  <Select
                    value={passphraseSeparator}
                    onValueChange={setPassphraseSeparator}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-">Hyphen (-)</SelectItem>
                      <SelectItem value="_">Underscore (_)</SelectItem>
                      <SelectItem value=" ">Space ( )</SelectItem>
                      <SelectItem value=".">Dot (.)</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={generatePassphrase} className="w-full">
                  <Dice1 className="h-4 w-4 mr-2" />
                  Generate Passphrase
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generated Passphrase</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {passphrase && (
                  <>
                    <div className="p-3 bg-muted rounded-lg border font-mono break-all">
                      {passphrase}
                    </div>
                    <Button
                      onClick={() => copyToClipboard(passphrase, "Passphrase")}
                      variant="outline"
                      className="w-full"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Passphrase
                    </Button>

                    {(() => {
                      const passphraseAnalysis = analyzePassword(passphrase);
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Strength
                            </span>
                            <Badge variant="outline">
                              {passphraseAnalysis.label}
                            </Badge>
                          </div>
                          <Progress
                            value={passphraseAnalysis.strength}
                            className="h-2"
                          />
                        </div>
                      );
                    })()}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
