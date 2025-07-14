"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  Loader2,
  Zap,
  Shield,
} from "lucide-react";

interface StatusIndicatorProps {
  status: "success" | "error" | "warning" | "info" | "loading" | "pending";
  message?: string;
  size?: "sm" | "default" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  message,
  size = "default",
  showIcon = true,
  className = "",
}: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "success":
        return {
          variant: "secondary" as const,
          icon: CheckCircle,
          color: "text-green-700 dark:text-green-400",
          bgColor:
            "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
        };
      case "error":
        return {
          variant: "destructive" as const,
          icon: XCircle,
          color: "text-white",
          bgColor: "bg-destructive/10 border-destructive/20",
        };
      case "warning":
        return {
          variant: "outline" as const,
          icon: AlertTriangle,
          color: "text-orange-700 dark:text-orange-400",
          bgColor:
            "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800",
        };
      case "info":
        return {
          variant: "outline" as const,
          icon: Info,
          color: "text-blue-700 dark:text-blue-400",
          bgColor:
            "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
        };
      case "loading":
        return {
          variant: "outline" as const,
          icon: Loader2,
          color: "text-muted-foreground",
          bgColor: "bg-muted/50 border-muted",
        };
      case "pending":
        return {
          variant: "outline" as const,
          icon: Clock,
          color: "text-muted-foreground",
          bgColor: "bg-muted/50 border-muted",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const iconSize =
    size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <Badge variant={config.variant} className={`${config.color} ${className}`}>
      {showIcon && (
        <Icon
          className={`${iconSize} mr-1 ${
            status === "loading" ? "animate-spin" : ""
          }`}
        />
      )}
      {message}
    </Badge>
  );
}

interface ProgressIndicatorProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function ProgressIndicator({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = "default",
  className = "",
}: ProgressIndicatorProps) {
  const percentage = Math.round((value / max) * 100);
  const height = size === "sm" ? "h-2" : size === "lg" ? "h-4" : "h-3";

  const getColorClass = () => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-blue-600";
    if (percentage >= 40) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-sm">
          {label && <span className="font-medium">{label}</span>}
          {showPercentage && (
            <span className={`${getColorClass()} font-mono`}>
              {percentage}%
            </span>
          )}
        </div>
      )}
      <Progress value={percentage} className={height} />
    </div>
  );
}

interface StrengthIndicatorProps {
  strength: "weak" | "fair" | "good" | "strong";
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export function StrengthIndicator({
  strength,
  label = "Strength",
  showIcon = true,
  className = "",
}: StrengthIndicatorProps) {
  const getStrengthConfig = () => {
    switch (strength) {
      case "weak":
        return {
          color: "text-red-600",
          bgColor: "bg-red-100 dark:bg-red-950/20",
          percentage: 25,
          icon: XCircle,
          label: "Weak",
        };
      case "fair":
        return {
          color: "text-orange-600",
          bgColor: "bg-orange-100 dark:bg-orange-950/20",
          percentage: 50,
          icon: AlertTriangle,
          label: "Fair",
        };
      case "good":
        return {
          color: "text-blue-600",
          bgColor: "bg-blue-100 dark:bg-blue-950/20",
          percentage: 75,
          icon: Zap,
          label: "Good",
        };
      case "strong":
        return {
          color: "text-green-600",
          bgColor: "bg-green-100 dark:bg-green-950/20",
          percentage: 100,
          icon: Shield,
          label: "Strong",
        };
    }
  };

  const config = getStrengthConfig();
  const Icon = config.icon;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-1">
          {showIcon && <Icon className="h-4 w-4" />}
          <span className={`font-medium ${config.color}`}>{config.label}</span>
        </div>
      </div>
      <Progress value={config.percentage} className="h-2" />
    </div>
  );
}

interface ValidationStatusProps {
  isValid: boolean;
  errorCount?: number;
  warningCount?: number;
  successMessage?: string;
  className?: string;
}

export function ValidationStatus({
  isValid,
  errorCount = 0,
  warningCount = 0,
  successMessage = "Valid",
  className = "",
}: ValidationStatusProps) {
  if (isValid && errorCount === 0) {
    return (
      <StatusIndicator
        status="success"
        message={successMessage}
        className={className}
      />
    );
  }

  if (errorCount > 0) {
    return (
      <StatusIndicator
        status="error"
        message={`${errorCount} error${errorCount !== 1 ? "s" : ""} found`}
        className={className}
      />
    );
  }

  if (warningCount > 0) {
    return (
      <StatusIndicator
        status="warning"
        message={`${warningCount} warning${warningCount !== 1 ? "s" : ""}`}
        className={className}
      />
    );
  }

  return null;
}
