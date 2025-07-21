"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
} from "lucide-react";
import { PasswordStrength } from "@/lib/utils/password";

interface PasswordStrengthMeterProps {
  strength: PasswordStrength;
  showDetails?: boolean;
}

export function PasswordStrengthMeter({
  strength,
  showDetails = true,
}: PasswordStrengthMeterProps) {
  const getStrengthColor = (level: PasswordStrength["level"]) => {
    switch (level) {
      case "Very Strong":
        return "text-green-600";
      case "Strong":
        return "text-green-500";
      case "Good":
        return "text-yellow-500";
      case "Fair":
        return "text-orange-500";
      case "Weak":
        return "text-red-500";
      case "Very Weak":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  const getStrengthIcon = (level: PasswordStrength["level"]) => {
    switch (level) {
      case "Very Strong":
        return <ShieldCheck className="h-5 w-5 text-green-600" />;
      case "Strong":
        return <Shield className="h-5 w-5 text-green-500" />;
      case "Good":
        return <Shield className="h-5 w-5 text-yellow-500" />;
      case "Fair":
        return <ShieldAlert className="h-5 w-5 text-orange-500" />;
      case "Weak":
        return <ShieldAlert className="h-5 w-5 text-red-500" />;
      case "Very Weak":
        return <ShieldX className="h-5 w-5 text-red-600" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStrengthIcon(strength.level)}
            <CardTitle className="text-lg">Password Strength</CardTitle>
          </div>
          <Badge variant={strength.score >= 75 ? "default" : "destructive"}>
            {strength.level}
          </Badge>
        </div>
        <CardDescription>Security analysis of your password</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strength Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Strength Score</span>
            <span
              className={`text-sm font-bold ${getStrengthColor(
                strength.level
              )}`}
            >
              {strength.score}/100
            </span>
          </div>
          <div className="relative">
            <Progress value={strength.score} className="h-3" />
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all ${getProgressColor(
                strength.score
              )}`}
              style={{ width: `${strength.score}%` }}
            />
          </div>
        </div>

        {/* Entropy and Crack Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">
              Entropy
            </div>
            <div className="text-lg font-semibold">
              {strength.entropy.toFixed(1)} bits
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">
              Crack Time
            </div>
            <div className="text-lg font-semibold">
              {strength.estimatedCrackTime}
            </div>
          </div>
        </div>

        {showDetails && (
          <>
            {/* Characteristics */}
            <div className="space-y-2">
              <div className="text-sm font-medium">
                Password Characteristics
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      strength.characteristics.hasUppercase
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  Uppercase letters
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      strength.characteristics.hasLowercase
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  Lowercase letters
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      strength.characteristics.hasNumbers
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  Numbers
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      strength.characteristics.hasSymbols
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  Symbols
                </div>
                {strength.characteristics.hasRepeats && (
                  <div className="flex items-center gap-2 col-span-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="text-orange-600">
                      Contains repeating characters
                    </span>
                  </div>
                )}
                {strength.characteristics.hasSequential && (
                  <div className="flex items-center gap-2 col-span-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="text-orange-600">
                      Contains sequential characters
                    </span>
                  </div>
                )}
                {strength.characteristics.hasCommonPatterns && (
                  <div className="flex items-center gap-2 col-span-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">
                      Contains common patterns
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Feedback */}
            {strength.feedback.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Recommendations</div>
                <ul className="space-y-1">
                  {strength.feedback.map((feedback, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-blue-500 mt-1">•</span>
                      {feedback}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
