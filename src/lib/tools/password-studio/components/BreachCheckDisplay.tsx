"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  ShieldAlert,
  ShieldX,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { LockKeyIcon as LockKey } from "@phosphor-icons/react/LockKey";
import { MagnifyingGlassIcon as MagnifyingGlass } from "@phosphor-icons/react/MagnifyingGlass";
import { BreachCheckResult } from "@/lib/utils/password";

interface BreachCheckDisplayProps {
  result: BreachCheckResult | null;
  isChecking: boolean;
  onRecheck: () => void;
  password: string;
}

export function BreachCheckDisplay({
  result,
  isChecking,
  onRecheck,
  password,
}: BreachCheckDisplayProps) {
  const getStatusIcon = (severity: BreachCheckResult["severity"]) => {
    switch (severity) {
      case "safe":
        return <Shield className="h-5 w-5 text-green-600" />;
      case "warning":
        return <ShieldAlert className="h-5 w-5 text-orange-500" />;
      case "danger":
        return <ShieldX className="h-5 w-5 text-red-600" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (severity: BreachCheckResult["severity"]) => {
    switch (severity) {
      case "safe":
        return "text-green-600";
      case "warning":
        return "text-orange-500";
      case "danger":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  const getBadgeVariant = (severity: BreachCheckResult["severity"]) => {
    switch (severity) {
      case "safe":
        return "default";
      case "warning":
        return "secondary";
      case "danger":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (!password) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Breach Check
          </CardTitle>
          <CardDescription>
            Check if your password has been found in data breaches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <LockKey
              aria-hidden="true"
              weight="duotone"
              className="mx-auto mb-2.5 h-9 w-9 text-muted-foreground/60"
            />
            <p>Enter a password to check for breaches</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {result ? (
              getStatusIcon(result.severity)
            ) : (
              <Shield className="h-5 w-5" />
            )}
            <CardTitle className="text-lg">Breach Check</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <Badge variant={getBadgeVariant(result.severity)}>
                {result.isBreached === null ? "Unknown" : result.isBreached ? "Breached" : "No match"}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onRecheck}
              disabled={isChecking}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`}
              />
              {isChecking ? "Checking..." : "Check"}
            </Button>
          </div>
        </div>
        <CardDescription>
          Check against HaveIBeenPwned database of known breaches
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isChecking ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-sm text-muted-foreground">
              Checking password against breach database...
            </p>
          </div>
        ) : result ? (
          <div className="space-y-4">
            {/* Status Message */}
            <div
              className={`p-4 rounded-lg border ${
                result.severity === "safe"
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : result.severity === "warning"
                  ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              }`}
            >
              <div className="flex items-start gap-3">
                {result.severity === "safe" ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                )}
                <div>
                  <p
                    className={`font-medium ${getStatusColor(result.severity)}`}
                  >
                    {result.isBreached === null
                      ? "Breach Status Unknown"
                      : result.isBreached
                      ? "Password Found in Breaches"
                      : "Password Not Found in Breaches"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Breach Details */}
            {result.isBreached && result.breachCount && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Breach Details</h4>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Times found:
                      </span>
                      <span className="ml-2 font-semibold text-red-600">
                        {result.breachCount.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Risk level:</span>
                      <span className="ml-2 font-semibold">
                        {result.breachCount > 100
                          ? "Very High"
                          : result.breachCount > 10
                          ? "High"
                          : "Moderate"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.isBreached && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  Security Recommendations
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>
                      Change this password immediately on all accounts
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Use a unique password for each account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Consider using a password manager</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Enable two-factor authentication where possible</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Check Info */}
            <div className="text-xs text-muted-foreground border-t pt-3">
              <p>Checked at: {result.checkedAt.toLocaleString()}</p>
              <p className="mt-1">
                Data provided by HaveIBeenPwned API. Your password is never sent
                in plain text.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MagnifyingGlass
              aria-hidden="true"
              weight="duotone"
              className="mx-auto mb-2.5 h-9 w-9 text-muted-foreground/60"
            />
            <p>Click &quot;Check&quot; to verify password security</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
