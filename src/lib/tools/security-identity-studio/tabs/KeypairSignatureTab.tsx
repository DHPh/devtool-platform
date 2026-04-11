"use client";

import { useState } from "react";
import {
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  generateSigningKeyPair,
  signText,
  verifyTextSignature,
} from "@/lib/processors/advanced-crypto-core";

export function KeypairSignatureTab() {
  const [publicJwk, setPublicJwk] = useState("");
  const [privateJwk, setPrivateJwk] = useState("");
  const [text, setText] = useState("Message to sign");
  const [signature, setSignature] = useState("");
  const [verification, setVerification] = useState("");
  const [error, setError] = useState("");

  const generate = async () => {
    const result = await generateSigningKeyPair();
    if (result.ok) {
      setPublicJwk(JSON.stringify(result.value.publicJwk, null, 2));
      setPrivateJwk(JSON.stringify(result.value.privateJwk, null, 2));
      setError("");
    } else {
      setError(result.error);
    }
  };

  const sign = async () => {
    const result = await signText(privateJwk, text);
    if (result.ok) {
      setSignature(result.value);
      setError("");
    } else {
      setError(result.error);
    }
  };

  const verify = async () => {
    const result = await verifyTextSignature(publicJwk, text, signature);
    if (result.ok) {
      setVerification(result.value ? "Verified" : "Not verified");
      setError("");
    } else {
      setError(result.error);
    }
  };

  return (
    <section className="space-y-5">
      <Header
        title="Keypair and Signature Tool"
        description="Generate an exportable ECDSA P-256 test keypair, then sign and verify text locally. Do not use this UI to manage production private keys."
      />
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => void generate()}>
          Generate keypair
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void sign()}
          disabled={!privateJwk}
        >
          Sign text
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void verify()}
          disabled={!publicJwk || !signature}
        >
          Verify signature
        </Button>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Text</span>
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={4}
        />
      </label>
      {error ? (
        <ErrorResult message={error} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <CopyableResult
            value={publicJwk}
            label="Public JWK"
            copyLabel="Copy public JWK"
            rows={10}
          />
          <CopyableResult
            value={privateJwk}
            label="Private JWK"
            copyLabel="Copy private JWK"
            rows={10}
            showToggleVisibility
          />
          <CopyableResult
            value={signature}
            label="Signature"
            copyLabel="Copy signature"
            rows={4}
          />
          <CopyableResult
            value={verification}
            label="Verification"
            copyLabel="Copy verification"
            rows={2}
          />
        </div>
      )}
    </section>
  );
}
