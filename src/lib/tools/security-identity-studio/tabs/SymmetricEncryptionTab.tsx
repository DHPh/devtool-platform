"use client";

import { useRef, useState } from "react";
import {
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  decryptText,
  encryptText,
} from "@/lib/processors/advanced-crypto-core";

export function SymmetricEncryptionTab() {
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [input, setInput] = useState("Private message");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState<
    Awaited<ReturnType<typeof encryptText>> | null
  >(null);

  const revision = useRef(0);

  const updateInput = (update: () => void) => {
    revision.current++;
    update();
    setResult(null);
  };

  const run = async () => {
    const request = ++revision.current;
    const nextResult = mode === "encrypt"
      ? await encryptText(password, input)
      : await decryptText(password, input);
    if (request === revision.current) setResult(nextResult);
  };

  const reverse = () => {
    revision.current++;
    if (result?.ok) setInput(result.value);
    setResult(null);
    setMode((value) => (value === "encrypt" ? "decrypt" : "encrypt"));
  };

  return (
    <section className="space-y-5">
      <Header
        title="Authenticated Text Encryption"
        description="Encrypt or decrypt text locally with AES-256-GCM and a PBKDF2-derived key. This is a primitive demonstration, not application key management."
      />
      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={!password} onClick={() => void run()}>
          {mode === "encrypt" ? "Encrypt text" : "Decrypt text"}
        </Button>
        <Button type="button" variant="outline" onClick={reverse}>
          Reverse direction
        </Button>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-medium">
          {mode === "encrypt" ? "Plaintext" : "Encryption envelope"}
        </span>
        <Textarea
          value={input}
          onChange={(event) => updateInput(() => setInput(event.target.value))}
          rows={12}
          className="font-mono"
        />
      </label>
      <div className="max-w-xl space-y-2">
        <label htmlFor="symmetric-encryption-password" className="text-sm font-medium">
          Password
        </label>
        <div className="flex gap-2">
          <Input
            id="symmetric-encryption-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => updateInput(() => setPassword(event.target.value))}
            placeholder="Enter a passphrase to enable encryption/decryption"
            autoComplete="off"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? "Hide" : "Show"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter a passphrase to derive the AES-256-GCM key locally. Empty passwords are disabled.
        </p>
      </div>
      {result?.ok ? (
        <CopyableResult
          value={result.value}
          label={mode === "encrypt" ? "Encryption envelope" : "Decrypted text"}
          copyLabel={
            mode === "encrypt"
              ? "Copy encryption envelope"
              : "Copy decrypted text"
          }
          rows={12}
        />
      ) : result ? (
        <ErrorResult message={result.error} />
      ) : null}
    </section>
  );
}
