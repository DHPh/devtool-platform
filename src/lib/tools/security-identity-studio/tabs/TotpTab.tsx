"use client";

import { useState } from "react";
import {
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  generateTotp,
  generateTotpSecret,
  validateTotp,
} from "@/lib/processors/advanced-crypto-core";

export function TotpTab() {
  const [secret, setSecret] = useState("JBSWY3DPEHPK3PXP");
  const [code, setCode] = useState("");
  const [candidate, setCandidate] = useState("");
  const [validation, setValidation] = useState("");
  const [error, setError] = useState("");

  const newSecret = () => {
    const result = generateTotpSecret();
    if (result.ok) {
      setSecret(result.value);
      setError("");
    } else {
      setError(result.error);
    }
  };

  const generate = async () => {
    const result = await generateTotp(secret);
    if (result.ok) {
      setCode(result.value);
      setError("");
    } else {
      setError(result.error);
    }
  };

  const validate = async () => {
    const result = await validateTotp(secret, candidate);
    if (result.ok) {
      setValidation(result.value ? "Valid" : "Invalid or expired");
      setError("");
    } else {
      setError(result.error);
    }
  };

  return (
    <section className="space-y-5">
      <Header
        title="TOTP Generator and Validator"
        description="Generate and validate standard SHA-1 TOTP codes locally. Clock synchronization and secure secret storage remain your responsibility."
      />
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={newSecret}>
          Generate secret
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void generate()}
        >
          Generate current code
        </Button>
      </div>
      <CopyableResult
        value={secret}
        label="Base32 secret"
        copyLabel="Copy Base32 secret"
        rows={2}
        readOnly={false}
        onValueChange={setSecret}
        showToggleVisibility
      />
      <CopyableResult
        value={code}
        label="Current code"
        copyLabel="Copy current code"
        rows={2}
      />
      <div className="flex max-w-xl items-end gap-3">
        <label className="flex-1 space-y-2">
          <span className="text-sm font-medium">Code to validate</span>
          <Input
            inputMode="numeric"
            value={candidate}
            onChange={(event) => setCandidate(event.target.value)}
          />
        </label>
        <Button type="button" onClick={() => void validate()}>
          Validate code
        </Button>
      </div>
      {error ? (
        <ErrorResult message={error} />
      ) : (
        <CopyableResult
          value={validation}
          label="Validation result"
          copyLabel="Copy validation result"
          rows={2}
        />
      )}
    </section>
  );
}
