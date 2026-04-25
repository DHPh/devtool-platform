"use client";

import { useState } from "react";
import { writeClipboardText } from "@/hooks/use-clipboard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  QuickActions,
  CommonActions,
  ActionGroups,
  SampleDataLoader,
  CommonSamples,
  ResultCard,
  ValidationMessages,
  CopyableResult,
  ValidationStatus,
} from "@/components/layout";
import {
  validateEmailSyntax,
  type EmailSyntaxResult,
} from "@/lib/processors/email";

export const metadata = {
  id: "email-validator",
  name: "Email Validator",
  description: "Check common email address syntax and normalize internationalized domains",
  category: "Validators",
  tags: ["email", "validator", "validation"],
  path: "/tools/email-validator",
  icon: "📧",
};

export default function EmailValidator() {
  const [singleEmail, setSingleEmail] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [singleResult, setSingleResult] = useState<EmailSyntaxResult | null>(
    null
  );
  const [bulkResults, setBulkResults] = useState<EmailSyntaxResult[]>([]);

  const validateSingleEmail = () => {
    if (!singleEmail.trim()) {
      setSingleResult(null);
      return;
    }

    const result = validateEmailSyntax(singleEmail);
    setSingleResult(result);
  };

  const validateBulkEmails = () => {
    if (!bulkEmails.trim()) {
      setBulkResults([]);
      return;
    }

    const emails = bulkEmails
      .split("\n")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    const results = emails.map(validateEmailSyntax);
    setBulkResults(results);
  };

  const copyValidEmails = async () => {
    const validEmails = bulkResults
      .filter((result) => result.isValid)
      .map((result) => result.email)
      .join("\n");

    try {
      await writeClipboardText(validEmails);
      toast.success("Valid emails copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const copyEmail = async (email: string) => {
    try {
      await writeClipboardText(email);
      toast.success("Email copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const clearAll = () => {
    setSingleEmail("");
    setBulkEmails("");
    setSingleResult(null);
    setBulkResults([]);
  };

  return (
    <div className="space-y-6">
      {(singleEmail || bulkEmails || singleResult || bulkResults.length > 0) && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={clearAll}>
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reset Both Panels
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single Email Validation */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Single Email Validation</h3>
          
          <div className="space-y-3">
            <Input
              aria-label="Single email address"
              placeholder="Enter email address to validate..."
              value={singleEmail}
              onChange={(e) => setSingleEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && validateSingleEmail()}
            />

            <QuickActions
              actions={[
                CommonActions.process(validateSingleEmail, "Validate"),
                CommonActions.clearAll(() => {
                  setSingleEmail("");
                  setSingleResult(null);
                }),
              ]}
            />

            <SampleDataLoader
              samples={CommonSamples.emails}
              onLoad={(value) => setSingleEmail(value.split("\n")[0])}
              buttonLabel="Load Example"
            />
          </div>

          {/* Single Result */}
          {singleResult && (
            <ResultCard
              title="Validation Result"
              status={singleResult.isValid ? "success" : "error"}
              onCopy={() =>
                copyEmail(singleResult.normalizedEmail ?? singleResult.email)
              }
              copyLabel="Copy Email"
            >
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-md">
                  <code className="text-sm font-mono">{singleResult.email}</code>
                  {singleResult.normalizedEmail && singleResult.normalizedEmail !== singleResult.email && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Normalized: <code>{singleResult.normalizedEmail}</code>
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Scope: syntax only. DNS, SMTP, mailbox existence, and deliverability are not checked.
                  </p>
                </div>
                
                <ValidationStatus
                  isValid={singleResult.isValid}
                  errorCount={singleResult.errors.length}
                  warningCount={singleResult.warnings.length}
                />

                <ValidationMessages
                  errors={singleResult.errors}
                  warnings={singleResult.warnings}
                />
              </div>
            </ResultCard>
          )}
        </div>

        {/* Bulk Email Validation */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Bulk Email Validation</h3>

          <Textarea
            aria-label="Email addresses"
            placeholder="Enter multiple email addresses (one per line)..."
            value={bulkEmails}
            onChange={(e) => setBulkEmails(e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />

          <QuickActions
            actions={ActionGroups.validator(
              validateBulkEmails,
              () => {
                setBulkEmails("");
                setBulkResults([]);
              },
              () => setBulkEmails(CommonSamples.emails[0].value)
            )}
          />

          {bulkResults.length > 0 && (
            <div className="space-y-4">
              <ResultCard
                title="Bulk Validation Results"
                description={`${bulkResults.length} emails processed`}
                status={bulkResults.every(r => r.isValid) ? "success" : "warning"}
              >
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-green-600 text-lg">
                        {bulkResults.filter(r => r.isValid).length}
                      </div>
                      <div className="text-muted-foreground">Valid</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-red-600 text-lg">
                        {bulkResults.filter(r => !r.isValid).length}
                      </div>
                      <div className="text-muted-foreground">Invalid</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-orange-600 text-lg">
                        {bulkResults.filter(r => r.warnings.length > 0).length}
                      </div>
                      <div className="text-muted-foreground">Warnings</div>
                    </div>
                  </div>

                  <QuickActions
                    actions={[
                      CommonActions.copy(copyValidEmails, bulkResults.filter(r => r.isValid).length === 0)
                    ]}
                    showLabels={true}
                  />
                </div>
              </ResultCard>

              <CopyableResult
                value={bulkResults.map(r => 
                  `${r.email}: ${r.isValid ? '✓ Valid' : '✗ Invalid'}`
                ).join('\n')}
                label="Detailed Results"
                placeholder="Results will appear here..."
                rows={8}
              />

              <div className="max-h-80 space-y-2 overflow-y-auto" aria-label="Individual email results">
                {bulkResults.map((result, index) => {
                  const copyValue = result.normalizedEmail ?? result.email;
                  return (
                    <div
                      key={`${result.email}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-md border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm">{result.email}</p>
                        <p
                          className={
                            result.isValid
                              ? "text-xs text-green-600"
                              : "text-xs text-destructive"
                          }
                        >
                          {result.isValid ? "Valid" : "Invalid"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyEmail(copyValue)}
                        aria-label={`Copy ${result.email}`}
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Show validation messages for all errors/warnings */}
              <ValidationMessages
                errors={bulkResults.flatMap(r => r.errors.map(e => `${r.email}: ${e}`))}
                warnings={bulkResults.flatMap(r => r.warnings.map(w => `${r.email}: ${w}`))}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
