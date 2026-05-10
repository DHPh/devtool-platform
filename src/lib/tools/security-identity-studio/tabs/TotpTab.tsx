"use client";

import { useRef, useState } from "react";
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
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [candidate, setCandidate] = useState("");
  const [validation, setValidation] = useState("");
  const [error, setError] = useState("");

  const codeVersion = useRef(0);
  const validationVersion = useRef(0);

  const changeSecret = (value: string) => {
    codeVersion.current++;
    validationVersion.current++;
    setSecret(value);
    setCode("");
    setValidation("");
    setError("");
  };

  const changeCandidate = (value: string) => {
    validationVersion.current++;
    setCandidate(value);
    setValidation("");
    setError("");
  };

  const newSecret = () => {
    const result = generateTotpSecret();
    if (result.ok) {
      changeSecret(result.value);
    } else {
      setError(result.error);
    }
  };

  const generate = async () => {
    const version = ++codeVersion.current;
    setCode("");
    const result = await generateTotp(secret);
    if (version !== codeVersion.current) return;
    if (result.ok) {
      setCode(result.value);
      setError("");
    } else {
      setError(result.error);
    }
  };

  const validate = async () => {
    const version = ++validationVersion.current;
    setValidation("");
    const result = await validateTotp(secret, candidate);
    if (version !== validationVersion.current) return;
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
        description="Generate a secret or enter your own Base32 secret to generate and validate SHA-1 TOTP codes locally. Clock synchronization and secure secret storage remain your responsibility."
      />
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={newSecret}>
          Generate secret
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!secret.trim()}
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
        onValueChange={changeSecret}
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
            onChange={(event) => changeCandidate(event.target.value)}
          />
        </label>
        <Button type="button" disabled={!secret.trim() || !candidate.trim()} onClick={() => void validate()}>
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
