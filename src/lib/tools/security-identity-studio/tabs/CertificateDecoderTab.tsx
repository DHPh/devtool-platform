"use client";

import { useState } from "react";
import {
  AsyncActionButton,
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Textarea } from "@/components/ui/textarea";
import { decodeCertificate } from "@/lib/processors/advanced-crypto-core";

export function CertificateDecoderTab() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<
    Awaited<ReturnType<typeof decodeCertificate>> | null
  >(null);
  const [working, setWorking] = useState(false);

  const decode = async () => {
    setWorking(true);
    setResult(await decodeCertificate(input));
    setWorking(false);
  };

  return (
    <section className="space-y-5">
      <Header
        title="X.509 Certificate Decoder"
        description="Decode certificate fields entirely in your browser. This does not validate trust, chain, hostname, revocation, or policy."
      />
      <label className="block space-y-2">
        <span className="text-sm font-medium">
          PEM, DER Base64, or hexadecimal certificate
        </span>
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={14}
          className="font-mono"
          spellCheck={false}
          placeholder="-----BEGIN CERTIFICATE-----"
        />
      </label>
      <AsyncActionButton
        pending={working}
        pendingLabel="Decoding…"
        onClick={() => void decode()}
      >
        Decode certificate
      </AsyncActionButton>
      {result?.ok ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <CopyableResult
              value={result.value.subject}
              label="Subject"
              copyLabel="Copy subject"
              rows={3}
            />
            <CopyableResult
              value={result.value.issuer}
              label="Issuer"
              copyLabel="Copy issuer"
              rows={3}
            />
            <CopyableResult
              value={result.value.serialNumber}
              label="Serial number"
              copyLabel="Copy serial number"
              rows={2}
            />
            <CopyableResult
              value={result.value.notBefore}
              label="Not before"
              copyLabel="Copy not before"
              rows={2}
            />
            <CopyableResult
              value={result.value.notAfter}
              label="Not after"
              copyLabel="Copy not after"
              rows={2}
            />
            <CopyableResult
              value={result.value.status}
              label="Validity status"
              copyLabel="Copy validity status"
              rows={2}
            />
            <CopyableResult
              value={result.value.signatureAlgorithm}
              label="Signature algorithm"
              copyLabel="Copy signature algorithm"
              rows={2}
            />
            <CopyableResult
              value={result.value.publicKeyAlgorithm}
              label="Public-key algorithm"
              copyLabel="Copy public-key algorithm"
              rows={2}
            />
            <CopyableResult
              value={result.value.sha256Fingerprint}
              label="SHA-256 fingerprint"
              copyLabel="Copy SHA-256 fingerprint"
              rows={3}
            />
            <CopyableResult
              value={result.value.selfSigned ? "Yes" : "No"}
              label="Self-signed"
              copyLabel="Copy self-signed result"
              rows={2}
            />
            <CopyableResult
              value={result.value.warning}
              label="Trust limitation"
              copyLabel="Copy trust limitation"
              rows={4}
            />
          </div>
          {result.value.extensions.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium">Extensions</h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {result.value.extensions.map((extension, index) => (
                  <CopyableResult
                    key={`${extension.oid}-${index}`}
                    value={`${extension.oid}\nCritical: ${extension.critical ? "yes" : "no"}`}
                    label={`Extension ${index + 1}`}
                    copyLabel={`Copy extension ${index + 1}`}
                    rows={2}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : result ? (
        <ErrorResult message={result.error} />
      ) : null}
    </section>
  );
}
