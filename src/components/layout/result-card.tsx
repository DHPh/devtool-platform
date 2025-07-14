"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Download, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface ResultCardProps {
  title: string;
  description?: string;
  status?: "success" | "error" | "warning" | "info";
  result?: string | null;
  error?: string | null;
  warnings?: string[];
  onCopy?: () => void;
  onDownload?: () => void;
  copyLabel?: string;
  downloadLabel?: string;
  children?: React.ReactNode;
  className?: string;
}

export function ResultCard({
  title,
  description,
  status = "info",
  result,
  error,
  warnings = [],
  onCopy,
  onDownload,
  copyLabel = "Copy",
  downloadLabel = "Download",
  children,
  className = "",
}: ResultCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case "success":
        return (
          <Badge variant="secondary" className="text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Valid
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="outline" className="text-orange-600">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Warning
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleCopy = async () => {
    if (!result || !onCopy) return;

    try {
      await navigator.clipboard.writeText(result);
      toast.success(`${copyLabel} copied to clipboard!`);
      onCopy();
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    if (!result || !onDownload) return;
    onDownload();
  };

  return (
    <Card className={`border-0 sm:border shadow-none sm:shadow-sm ${className}`}>
      <CardHeader className="px-3 sm:px-6 py-3 sm:py-6 pb-2 sm:pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-3 sm:px-6 pb-3 sm:pb-6 pt-0">
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Warnings Display */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <div
                key={index}
                className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md"
              >
                <p className="text-orange-700 dark:text-orange-400 text-sm">
                  ⚠️ {warning}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Result Content */}
        {children}

        {/* Action Buttons */}
        {(onCopy || onDownload) && result && (
          <div className="flex gap-2 pt-2">
            {onCopy && (
              <Button onClick={handleCopy} variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                {copyLabel}
              </Button>
            )}
            {onDownload && (
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                {downloadLabel}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
