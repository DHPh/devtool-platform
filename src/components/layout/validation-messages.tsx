"use client";

import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";

interface ValidationMessageProps {
  type: "error" | "warning" | "info" | "success";
  message: string;
  className?: string;
}

interface ValidationMessagesProps {
  errors?: string[];
  warnings?: string[];
  infos?: string[];
  successes?: string[];
  className?: string;
}

export function ValidationMessage({
  type,
  message,
  className = "",
}: ValidationMessageProps) {
  const getStyles = () => {
    switch (type) {
      case "error":
        return {
          containerClass:
            "bg-destructive/10 border-destructive/20 text-destructive",
          textClass: "text-destructive",
          icon: <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />,
        };
      case "warning":
        return {
          containerClass:
            "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800",
          textClass: "text-orange-700 dark:text-orange-400",
          icon: <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />,
        };
      case "info":
        return {
          containerClass:
            "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
          textClass: "text-blue-700 dark:text-blue-400",
          icon: <Info className="w-4 h-4 mr-2 flex-shrink-0" />,
        };
      case "success":
        return {
          containerClass:
            "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
          textClass: "text-green-700 dark:text-green-400",
          icon: <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />,
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`p-3 border rounded-md ${styles.containerClass} ${className}`}
    >
      <div className="flex items-start">
        {styles.icon}
        <p className={`text-sm ${styles.textClass}`}>{message}</p>
      </div>
    </div>
  );
}

export function ValidationMessages({
  errors = [],
  warnings = [],
  infos = [],
  successes = [],
  className = "",
}: ValidationMessagesProps) {
  const hasMessages =
    errors.length > 0 ||
    warnings.length > 0 ||
    infos.length > 0 ||
    successes.length > 0;

  if (!hasMessages) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Errors */}
      {errors.map((error, index) => (
        <ValidationMessage
          key={`error-${index}`}
          type="error"
          message={error}
        />
      ))}

      {/* Warnings */}
      {warnings.map((warning, index) => (
        <ValidationMessage
          key={`warning-${index}`}
          type="warning"
          message={warning}
        />
      ))}

      {/* Info */}
      {infos.map((info, index) => (
        <ValidationMessage key={`info-${index}`} type="info" message={info} />
      ))}

      {/* Success */}
      {successes.map((success, index) => (
        <ValidationMessage
          key={`success-${index}`}
          type="success"
          message={success}
        />
      ))}
    </div>
  );
}
