"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import {
  analyzePasswordStrength,
  checkPasswordBreach,
  BreachCheckResult,
} from "@/lib/utils/password";
import { PasswordStrengthMeter, BreachCheckDisplay } from "../components";

export function PasswordAnalysisTab() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [breachResult, setBreachResult] = useState<BreachCheckResult | null>(
    null
  );
  const [isCheckingBreach, setIsCheckingBreach] = useState(false);

  // Analyze password strength in real-time
  const passwordStrength = useMemo(() => {
    if (!password) {
      return {
        score: 0,
        level: "Very Weak" as const,
        entropy: 0,
        estimatedCrackTime: "Instant",
        feedback: ["Enter a password to analyze"],
        characteristics: {
          hasUppercase: false,
          hasLowercase: false,
          hasNumbers: false,
          hasSymbols: false,
          hasRepeats: false,
          hasSequential: false,
          hasCommonPatterns: false,
        },
      };
    }
    return analyzePasswordStrength(password);
  }, [password]);

  const handleBreachCheck = async () => {
    if (!password) return;

    setIsCheckingBreach(true);
    try {
      const result = await checkPasswordBreach(password);
      setBreachResult(result);
    } catch (error) {
      console.error("Breach check failed:", error);
      setBreachResult({
        isBreached: false,
        message: "Failed to check breach status",
        severity: "warning",
        checkedAt: new Date(),
      });
    } finally {
      setIsCheckingBreach(false);
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    // Clear previous breach result when password changes
    if (breachResult) {
      setBreachResult(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Password Analysis</CardTitle>
          <CardDescription>
            Enter a password to analyze its security and check for breaches
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passwordInput">Password to Analyze</Label>
            <div className="relative">
              <Input
                id="passwordInput"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Enter password to analyze..."
                className="font-mono pr-10"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                {showPassword ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {password && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-muted-foreground">Length:</span>
                    <span className="ml-2 font-medium">{password.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Uppercase:</span>
                    <span className="ml-2 font-medium">
                      {password.match(/[A-Z]/g)?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lowercase:</span>
                    <span className="ml-2 font-medium">
                      {password.match(/[a-z]/g)?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Numbers:</span>
                    <span className="ml-2 font-medium">
                      {password.match(/[0-9]/g)?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Symbols:</span>
                    <span className="ml-2 font-medium">
                      {password.match(/[^a-zA-Z0-9]/g)?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unique chars:</span>
                    <span className="ml-2 font-medium">
                      {new Set(password.split("")).size}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Strength */}
        <PasswordStrengthMeter strength={passwordStrength} />

        {/* Breach Check */}
        <BreachCheckDisplay
          result={breachResult}
          isChecking={isCheckingBreach}
          onRecheck={handleBreachCheck}
          password={password}
        />
      </div>

      {/* Detailed Security Information */}
      {password && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Security Information</CardTitle>
            <CardDescription>
              Detailed analysis of your password security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Character Set Analysis */}
            <div>
              <h4 className="font-medium mb-2">Character Set Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Estimated character set size:</span>
                    <span className="font-medium">
                      {passwordStrength.characteristics.hasLowercase ? 26 : 0}
                      {passwordStrength.characteristics.hasUppercase
                        ? " + 26"
                        : ""}
                      {passwordStrength.characteristics.hasNumbers
                        ? " + 10"
                        : ""}
                      {passwordStrength.characteristics.hasSymbols
                        ? " + 32"
                        : ""}
                      {" = "}
                      {(passwordStrength.characteristics.hasLowercase
                        ? 26
                        : 0) +
                        (passwordStrength.characteristics.hasUppercase
                          ? 26
                          : 0) +
                        (passwordStrength.characteristics.hasNumbers ? 10 : 0) +
                        (passwordStrength.characteristics.hasSymbols ? 32 : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total possible combinations:</span>
                    <span className="font-medium">
                      {Math.pow(2, passwordStrength.entropy).toExponential(2)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Entropy:</span>
                    <span className="font-medium">
                      {passwordStrength.entropy.toFixed(2)} bits
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated crack time:</span>
                    <span className="font-medium">
                      {passwordStrength.estimatedCrackTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Common Patterns */}
            <div>
              <h4 className="font-medium mb-2">Pattern Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span>Dictionary words:</span>
                  <span
                    className={`font-medium ${
                      passwordStrength.characteristics.hasCommonPatterns
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {passwordStrength.characteristics.hasCommonPatterns
                      ? "Detected"
                      : "None found"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Repeating characters:</span>
                  <span
                    className={`font-medium ${
                      passwordStrength.characteristics.hasRepeats
                        ? "text-orange-500"
                        : "text-green-500"
                    }`}
                  >
                    {passwordStrength.characteristics.hasRepeats
                      ? "Found"
                      : "None"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sequential characters:</span>
                  <span
                    className={`font-medium ${
                      passwordStrength.characteristics.hasSequential
                        ? "text-orange-500"
                        : "text-green-500"
                    }`}
                  >
                    {passwordStrength.characteristics.hasSequential
                      ? "Found"
                      : "None"}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Recommendations */}
            {passwordStrength.feedback.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Security Recommendations</h4>
                <ul className="space-y-1 text-sm">
                  {passwordStrength.feedback.map((feedback, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{feedback}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
