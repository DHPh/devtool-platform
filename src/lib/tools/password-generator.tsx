"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Copy,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  Key,
} from "lucide-react";
import { toast } from "sonner";
import {
  ToolHeader,
  QuickActions,
  ResultCard,
  CopyableResult,
} from "@/components/layout";

export const metadata = {
  id: "password-generator",
  name: "Password Generator",
  description: "Generate secure passwords with customizable options",
  category: "Security",
  tags: ["password", "generator", "security", "random"],
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

export default function PasswordGenerator() {
  const [password, setPassword] = useState("");
  const [passwords, setPasswords] = useState<string[]>([]);
  const [strength, setStrength] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState("Weak");
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
  });

  const characterSets = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    similar: "il1Lo0O",
    ambiguous: "{}[]()/\\'\"~,;.<>",
  };

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
    calculateStrength(result);
    toast.success("Password generated!");
  };

  const generateMultiplePasswords = (count: number) => {
    const newPasswords: string[] = [];
    for (let i = 0; i < count; i++) {
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

      if (charset === "") continue;

      let result = "";
      for (let j = 0; j < options.length; j++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      newPasswords.push(result);
    }
    setPasswords(newPasswords);
    toast.success(`Generated ${newPasswords.length} passwords!`);
  };

  const calculateStrength = (pwd: string) => {
    let score = 0;

    // Length scoring
    if (pwd.length >= 8) score += 25;
    if (pwd.length >= 12) score += 25;
    if (pwd.length >= 16) score += 25;

    // Character variety
    if (/[a-z]/.test(pwd)) score += 5;
    if (/[A-Z]/.test(pwd)) score += 5;
    if (/[0-9]/.test(pwd)) score += 5;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 10;

    // Bonus for more character types
    const charTypes = [
      /[a-z]/.test(pwd),
      /[A-Z]/.test(pwd),
      /[0-9]/.test(pwd),
      /[^A-Za-z0-9]/.test(pwd),
    ].filter(Boolean).length;
    if (charTypes >= 3) score += 5;
    if (charTypes === 4) score += 10;

    // Penalties
    if (/(.)\1{2,}/.test(pwd)) score -= 10; // Repeated characters
    if (/123|abc|qwe/i.test(pwd)) score -= 10; // Common sequences

    score = Math.max(0, Math.min(100, score));
    setStrength(score);

    if (score < 30) setStrengthLabel("Weak");
    else if (score < 60) setStrengthLabel("Fair");
    else if (score < 80) setStrengthLabel("Good");
    else setStrengthLabel("Strong");
  };

  const copyPassword = async (pwd: string) => {
    await navigator.clipboard.writeText(pwd);
    toast.success("Password copied to clipboard!");
  };

  useEffect(() => {
    if (password === "") {
      generatePassword();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  const getStrengthIcon = () => {
    if (strength < 60)
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (strength < 80) return <Shield className="h-4 w-4 text-blue-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStrengthColor = () => {
    if (strength < 30) return "text-red-500";
    if (strength < 60) return "text-yellow-500";
    if (strength < 80) return "text-blue-500";
    return "text-green-500";
  };

  const presets = [
    { label: "8 chars - Simple", length: 8, symbols: false },
    { label: "12 chars - Secure", length: 12, symbols: true },
    { label: "16 chars - Strong", length: 16, symbols: true },
    { label: "24 chars - Max", length: 24, symbols: true },
  ];

  return (
    <div className="space-y-6">
      <ToolHeader
        title="Password Generator"
        description="Generate secure passwords with customizable options"
        icon={Key}
      />

      <QuickActions
        actions={presets.map((preset, index) => ({
          id: `preset-${index}`,
          label: preset.label,
          onClick: () => {
            setOptions(prev => ({
              ...prev,
              length: preset.length,
              includeSymbols: preset.symbols,
            }));
          },
        }))}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-4">
          <ResultCard
            title="Password Settings"
            description="Configure your password generation options"
            status="info"
          >
            <div className="space-y-6">
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
                <Label className="text-sm font-medium">Character Types</Label>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="uppercase" className="text-sm">Uppercase (A-Z)</Label>
                    <Switch
                      id="uppercase"
                      checked={options.includeUppercase}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, includeUppercase: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="lowercase" className="text-sm">Lowercase (a-z)</Label>
                    <Switch
                      id="lowercase"
                      checked={options.includeLowercase}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, includeLowercase: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="numbers" className="text-sm">Numbers (0-9)</Label>
                    <Switch
                      id="numbers"
                      checked={options.includeNumbers}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, includeNumbers: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="symbols" className="text-sm">Symbols (!@#$%...)</Label>
                    <Switch
                      id="symbols"
                      checked={options.includeSymbols}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, includeSymbols: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Exclusions */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Character Exclusions</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="similar" className="text-sm">
                      Exclude similar (il1Lo0O)
                    </Label>
                    <Switch
                      id="similar"
                      checked={options.excludeSimilar}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, excludeSimilar: checked }))
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
                        setOptions((prev) => ({ ...prev, excludeAmbiguous: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Button onClick={generatePassword} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Password
              </Button>
            </div>
          </ResultCard>

          {/* Bulk Generation */}
          <ResultCard
            title="Bulk Generation"
            description="Generate multiple passwords at once"
            status="info"
          >
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => generateMultiplePasswords(5)}
                  variant="outline"
                  size="sm"
                >
                  5 Passwords
                </Button>
                <Button
                  onClick={() => generateMultiplePasswords(10)}
                  variant="outline"
                  size="sm"
                >
                  10 Passwords
                </Button>
                <Button
                  onClick={() => generateMultiplePasswords(20)}
                  variant="outline"
                  size="sm"
                >
                  20 Passwords
                </Button>
              </div>

              {passwords.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {passwords.map((pwd, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input value={pwd} readOnly className="font-mono text-xs" />
                      <Button
                        onClick={() => copyPassword(pwd)}
                        size="sm"
                        variant="ghost"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ResultCard>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          <ResultCard
            title="Generated Password"
            description="Your secure password with strength analysis"
            status={password ? (strength > 60 ? "success" : "warning") : "info"}
            onCopy={password ? () => copyPassword(password) : undefined}
            copyLabel="Copy Password"
          >
            <div className="space-y-4">
              <CopyableResult
                value={password}
                placeholder="Click Generate to create a password"
                fontFamily="mono"
                rows={3}
              />
              
              {password && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className={`flex items-center gap-2 ${getStrengthColor()}`}>
                      {getStrengthIcon()}
                      Password Strength: {strengthLabel}
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {strength}/100
                    </span>
                  </div>
                  <Progress value={strength} className="h-2" />
                </div>
              )}
            </div>
          </ResultCard>

          {/* Security Information */}
          <ResultCard
            title="Security Information"
            description="Best practices for password security"
            status="info"
          >
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <strong>Strong Password Tips:</strong>
                    <ul className="mt-1 list-disc list-inside space-y-1 text-xs">
                      <li>Use at least 12 characters for better security</li>
                      <li>Include a mix of uppercase, lowercase, numbers, and symbols</li>
                      <li>Avoid common words, names, or predictable patterns</li>
                      <li>Use unique passwords for each account</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-xs">
                    <strong>Security Note:</strong> This tool generates passwords
                    locally in your browser. For maximum security, consider using
                    a dedicated password manager.
                  </div>
                </div>
              </div>
            </div>
          </ResultCard>
        </div>
      </div>
    </div>
  );
}
