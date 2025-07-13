"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Copy,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
}

export function PasswordGenerator() {
  const [password, setPassword] = useState("");
  const [passwords, setPasswords] = useState<string[]>([]);
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
  });
  const [strength, setStrength] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState("");

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

      if (charset === "") return;

      let result = "";
      for (let j = 0; j < options.length; j++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
      }

      newPasswords.push(result);
    }

    setPasswords(newPasswords);
    toast.success(`Generated ${count} passwords!`);
  };

  const calculateStrength = (pwd: string) => {
    let score = 0;

    // Length bonus
    if (pwd.length >= 8) score += 25;
    if (pwd.length >= 12) score += 25;
    if (pwd.length >= 16) score += 25;

    // Character variety bonus
    if (/[a-z]/.test(pwd)) score += 5;
    if (/[A-Z]/.test(pwd)) score += 5;
    if (/[0-9]/.test(pwd)) score += 5;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 10;

    // Penalty for common patterns
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
    const characterSets = {
      uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      lowercase: "abcdefghijklmnopqrstuvwxyz",
      numbers: "0123456789",
      symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
      similar: "il1Lo0O",
      ambiguous: "{}[]()/\\'\"~,;.<>",
    };

    const generatePasswordEffect = () => {
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

      if (charset === "") return;

      let result = "";
      for (let i = 0; i < options.length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
      }

      setPassword(result);
      calculateStrength(result);
    };

    generatePasswordEffect();
  }, [options]);

  const getStrengthIcon = () => {
    if (strength < 60)
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (strength < 80) return <Shield className="h-4 w-4 text-blue-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Current Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Generated Password</span>
            <Button onClick={generatePassword} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={password}
              readOnly
              className="font-mono text-lg"
              placeholder="Click Generate to create a password"
            />
            <Button onClick={() => copyPassword(password)} disabled={!password}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
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
        </CardContent>
      </Card>

      {/* Options */}
      <Card>
        <CardHeader>
          <CardTitle>Password Options</CardTitle>
          <CardDescription>
            Customize your password generation settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Length */}
          <div className="space-y-2">
            <Label>Password Length: {options.length}</Label>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="uppercase">Uppercase (A-Z)</Label>
              <Switch
                id="uppercase"
                checked={options.includeUppercase}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({ ...prev, includeUppercase: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="lowercase">Lowercase (a-z)</Label>
              <Switch
                id="lowercase"
                checked={options.includeLowercase}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({ ...prev, includeLowercase: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="numbers">Numbers (0-9)</Label>
              <Switch
                id="numbers"
                checked={options.includeNumbers}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({ ...prev, includeNumbers: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="symbols">Symbols (!@#$...)</Label>
              <Switch
                id="symbols"
                checked={options.includeSymbols}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({ ...prev, includeSymbols: checked }))
                }
              />
            </div>
          </div>

          {/* Exclusions */}
          <div className="space-y-3">
            <Label>Exclusions</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="similar" className="text-sm">
                  Exclude similar characters (il1Lo0O)
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
                  Exclude ambiguous characters ({`{}[]()/\\'"~,;.<>`})
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
        </CardContent>
      </Card>

      {/* Bulk Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Password Generation</CardTitle>
          <CardDescription>Generate multiple passwords at once</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => generateMultiplePasswords(5)}
              variant="outline"
            >
              Generate 5
            </Button>
            <Button
              onClick={() => generateMultiplePasswords(10)}
              variant="outline"
            >
              Generate 10
            </Button>
            <Button
              onClick={() => generateMultiplePasswords(25)}
              variant="outline"
            >
              Generate 25
            </Button>
          </div>

          {passwords.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {passwords.map((pwd, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-accent"
                  onClick={() => copyPassword(pwd)}
                >
                  <span className="font-mono text-sm flex-1">{pwd}</span>
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Password Security Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">
                Strong Password Characteristics
              </h4>
              <ul className="space-y-1 text-xs">
                <li>• At least 12 characters long</li>
                <li>• Mix of uppercase and lowercase letters</li>
                <li>• Include numbers and symbols</li>
                <li>• Avoid common words or patterns</li>
                <li>• Don&apos;t reuse passwords across sites</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">
                Best Practices
              </h4>
              <ul className="space-y-1 text-xs">
                <li>• Use a password manager</li>
                <li>• Enable two-factor authentication</li>
                <li>• Update passwords regularly</li>
                <li>• Never share passwords</li>
                <li>• Use different passwords for important accounts</li>
              </ul>
            </div>
          </div>

          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-xs">
                <strong>Security Note:</strong> This tool generates passwords
                entirely in your browser. No passwords are sent to any server or
                stored anywhere. For maximum security, consider using a
                dedicated password manager.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
