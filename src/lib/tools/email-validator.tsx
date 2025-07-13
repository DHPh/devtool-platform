"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Mail, Copy } from "lucide-react";
import { toast } from "sonner";

export const metadata = {
  id: "email-validator",
  name: "Email Validator",
  description: "Validate email addresses and check formatting",
  category: "Validators",
  tags: ["email", "validator", "validation"],
  path: "/tools/email-validator",
  icon: "📧",
};

interface EmailValidation {
  email: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export default function EmailValidator() {
  const [singleEmail, setSingleEmail] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [singleResult, setSingleResult] = useState<EmailValidation | null>(
    null
  );
  const [bulkResults, setBulkResults] = useState<EmailValidation[]>([]);

  const validateEmail = (email: string): EmailValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push("Invalid email format");
    }

    // Check for spaces
    if (email.includes(" ")) {
      errors.push("Email cannot contain spaces");
    }

    // Check for multiple @ symbols
    const atCount = (email.match(/@/g) || []).length;
    if (atCount !== 1) {
      errors.push("Email must contain exactly one @ symbol");
    }

    // Check local part (before @)
    const [localPart, domain] = email.split("@");
    if (localPart) {
      if (localPart.length === 0) {
        errors.push("Local part cannot be empty");
      }
      if (localPart.length > 64) {
        errors.push("Local part cannot exceed 64 characters");
      }
      if (localPart.startsWith(".") || localPart.endsWith(".")) {
        errors.push("Local part cannot start or end with a dot");
      }
      if (localPart.includes("..")) {
        errors.push("Local part cannot contain consecutive dots");
      }
      if (!/^[a-zA-Z0-9._%+-]+$/.test(localPart)) {
        warnings.push("Local part contains unusual characters");
      }
    }

    // Check domain part (after @)
    if (domain) {
      if (domain.length === 0) {
        errors.push("Domain cannot be empty");
      }
      if (domain.length > 253) {
        errors.push("Domain cannot exceed 253 characters");
      }
      if (!domain.includes(".")) {
        errors.push("Domain must contain at least one dot");
      }
      if (domain.startsWith(".") || domain.endsWith(".")) {
        errors.push("Domain cannot start or end with a dot");
      }
      if (domain.includes("..")) {
        errors.push("Domain cannot contain consecutive dots");
      }

      // Check TLD
      const tldParts = domain.split(".");
      const tld = tldParts[tldParts.length - 1];
      if (tld.length < 2) {
        errors.push("Top-level domain must be at least 2 characters");
      }
      if (!/^[a-zA-Z]+$/.test(tld)) {
        errors.push("Top-level domain can only contain letters");
      }
    }

    // Check total length
    if (email.length > 254) {
      errors.push("Email cannot exceed 254 characters");
    }

    return {
      email,
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  };

  const validateSingleEmail = () => {
    if (!singleEmail.trim()) {
      setSingleResult(null);
      return;
    }

    const result = validateEmail(singleEmail.trim());
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

    const results = emails.map(validateEmail);
    setBulkResults(results);
  };

  const copyValidEmails = async () => {
    const validEmails = bulkResults
      .filter((result) => result.isValid)
      .map((result) => result.email)
      .join("\n");

    try {
      await navigator.clipboard.writeText(validEmails);
      toast.success("Valid emails copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const examples = [
    "user@example.com",
    "john.doe@company.co.uk",
    "test.email+tag@domain.org",
    "user123@sub.domain.com",
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Validator</CardTitle>
          <CardDescription>
            Validate email addresses and check for common formatting issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Single Email Validation */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="singleEmail">Single Email Validation</Label>
                <div className="flex gap-2">
                  <Input
                    id="singleEmail"
                    type="email"
                    placeholder="Enter email address..."
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={validateSingleEmail}>
                    <Mail className="h-4 w-4 mr-2" />
                    Validate
                  </Button>
                </div>
              </div>

              {/* Examples */}
              <div className="space-y-2">
                <Label>Examples</Label>
                <div className="flex flex-wrap gap-2">
                  {examples.map((example) => (
                    <Button
                      key={example}
                      variant="outline"
                      size="sm"
                      onClick={() => setSingleEmail(example)}
                      className="text-xs"
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Single Result */}
              {singleResult && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      {singleResult.isValid ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <CardTitle
                        className={`text-lg ${
                          singleResult.isValid
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {singleResult.isValid ? "Valid Email" : "Invalid Email"}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="p-3 bg-muted rounded-md">
                        <code className="text-sm">{singleResult.email}</code>
                      </div>

                      {singleResult.errors.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-red-500">Errors:</Label>
                          {singleResult.errors.map((error, index) => (
                            <Badge
                              key={index}
                              variant="destructive"
                              className="text-xs"
                            >
                              {error}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {singleResult.warnings.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-yellow-500">Warnings:</Label>
                          {singleResult.warnings.map((warning, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs border-yellow-500"
                            >
                              {warning}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Bulk Email Validation */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulkEmails">Bulk Email Validation</Label>
                <Textarea
                  id="bulkEmails"
                  placeholder="Enter multiple email addresses, one per line..."
                  value={bulkEmails}
                  onChange={(e) => setBulkEmails(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={validateBulkEmails} className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Validate All
                </Button>
                {bulkResults.length > 0 && (
                  <Button variant="outline" onClick={copyValidEmails}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Valid
                  </Button>
                )}
              </div>

              {/* Bulk Results */}
              {bulkResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Validation Results</CardTitle>
                    <CardDescription>
                      {bulkResults.filter((r) => r.isValid).length} valid out of{" "}
                      {bulkResults.length} emails
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {bulkResults.map((result, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 border rounded"
                        >
                          {result.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                          <span className="text-sm font-mono flex-1">
                            {result.email}
                          </span>
                          <Badge
                            variant={result.isValid ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {result.isValid ? "Valid" : "Invalid"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
