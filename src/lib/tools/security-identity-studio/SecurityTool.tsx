"use client";

import { useMemo, useRef, useState } from "react";
import {
  CopyableResult,
  AsyncActionButton,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  decryptText,
  decodeCertificate,
  encryptText,
  generateDigest,
  generateHmac,
  generateJwt,
  generateJwtHmacSecret,
  generateJwtSigningKeyPair,
  generateSigningKeyPair,
  generateSri,
  generateTotp,
  generateTotpSecret,
  inspectJwt,
  signText,
  validateTotp,
  verifyJwtSignature,
  verifyTextSignature,
  type DigestAlgorithm,
  type JwtSigningAlgorithm,
  type JwtSigningKeyType,
  type JwtVerificationKeyType,
} from "@/lib/processors";

const SAMPLE_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQWRhIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE4OTM0NTYwMDB9.signature";

export function JwtInspectorTool() {
  const [token, setToken] = useState(SAMPLE_JWT);
  const result = useMemo(() => inspectJwt(token), [token]);
  return <section className="space-y-5"><Header title="JWT Inspector" description="Decode JWT content locally. Decoding does not verify its signature or trust its claims." /><label className="space-y-2"><span className="text-sm font-medium">JWT</span><Textarea value={token} onChange={(event) => setToken(event.target.value)} rows={6} className="font-mono" spellCheck={false} /></label>{result.ok ? <div className="space-y-4"><p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">{result.value.warning}</p><div className="grid gap-4 lg:grid-cols-2"><CopyableResult value={JSON.stringify(result.value.header, null, 2)} label="Header" copyLabel="Copy header" rows={8} /><CopyableResult value={JSON.stringify(result.value.payload, null, 2)} label="Payload" copyLabel="Copy payload" rows={8} /><CopyableResult value={result.value.signature} label="Signature segment" copyLabel="Copy signature" rows={3} /><CopyableResult value={`Algorithm: ${result.value.algorithm ?? "unspecified"}\nStatus: ${result.value.status}\nIssued: ${result.value.issuedAt ?? "unspecified"}\nExpires: ${result.value.expiresAt ?? "unspecified"}\nNot before: ${result.value.notBefore ?? "unspecified"}`} label="Claim summary" copyLabel="Copy claim summary" rows={6} /></div></div> : <div role="alert"><CopyableResult value={result.error} label="Error" copyLabel="Copy error" rows={4} textareaClassName="border-destructive text-destructive" /></div>}</section>;
}

export function HashHmacGeneratorTool() {
  const [input, setInput] = useState("Hello, world!");
  const [secret, setSecret] = useState("development-secret");
  const [mode, setMode] = useState<"hash" | "hmac">("hash");
  const [algorithm, setAlgorithm] = useState<DigestAlgorithm>("SHA-256");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const generate = async () => {
    const result = mode === "hash" ? await generateDigest(input, algorithm) : await generateHmac(input, secret, algorithm);
    if (result.ok) { setOutput(result.value); setError(""); } else { setOutput(""); setError(result.error); }
  };
  return <section className="space-y-5"><Header title="Hash and HMAC Generator" description="Generate SHA-2 digests and keyed HMAC values locally with Web Crypto." /><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2"><span className="text-sm font-medium">Operation</span><Select value={mode} onValueChange={(value) => setMode(value as "hash" | "hmac")}><SelectTrigger aria-label="Operation"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hash">Hash</SelectItem><SelectItem value="hmac">HMAC</SelectItem></SelectContent></Select></label><label className="space-y-2"><span className="text-sm font-medium">Algorithm</span><Select value={algorithm} onValueChange={(value) => setAlgorithm(value as DigestAlgorithm)}><SelectTrigger aria-label="Algorithm"><SelectValue /></SelectTrigger><SelectContent>{(["SHA-256", "SHA-384", "SHA-512"] as const).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></label></div><label className="space-y-2"><span className="text-sm font-medium">Input text</span><Textarea value={input} onChange={(event) => setInput(event.target.value)} rows={7} /></label>{mode === "hmac" && <label className="block max-w-xl space-y-2"><span className="text-sm font-medium">Secret key</span><Input type="password" value={secret} onChange={(event) => setSecret(event.target.value)} autoComplete="off" /></label>}<Button type="button" onClick={() => void generate()}>Generate {mode === "hash" ? "hash" : "HMAC"}</Button>{error ? <div role="alert"><CopyableResult value={error} label="Error" copyLabel="Copy error" rows={3} textareaClassName="border-destructive text-destructive" /></div> : <CopyableResult value={output} label={mode === "hash" ? "Hash" : "HMAC"} copyLabel={mode === "hash" ? "Copy hash" : "Copy HMAC"} rows={4} />}</section>;
}

const JWT_GENERATOR_HEADER = JSON.stringify({ typ: "JWT" }, null, 2);
const JWT_GENERATOR_PAYLOAD = JSON.stringify({ sub: "123", name: "Ada" }, null, 2);
const JWT_SIGNING_ALGORITHMS: JwtSigningAlgorithm[] = ["HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "ES256", "ES384"];

export function JwtGeneratorTool() {
  const [header, setHeader] = useState(JWT_GENERATOR_HEADER);
  const [payload, setPayload] = useState(JWT_GENERATOR_PAYLOAD);
  const [algorithm, setAlgorithm] = useState<JwtSigningAlgorithm>("HS256");
  const [keyType, setKeyType] = useState<JwtSigningKeyType>("hmac");
  const [key, setKey] = useState("development-only-secret-change-me");
  const [publicJwk, setPublicJwk] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [working, setWorking] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof generateJwt>> | null>(null);
  const inputRevision = useRef(0);
  const updateInput = (update: () => void) => {
    update();
    inputRevision.current += 1;
    setResult(null);
  };
  const changeAlgorithm = (value: JwtSigningAlgorithm) => {
    updateInput(() => {
      const changesFamily = value.slice(0, 2) !== algorithm.slice(0, 2);
      setAlgorithm(value);
      if (value.startsWith("HS") && keyType === "pem") setKeyType("hmac");
      if (!value.startsWith("HS") && keyType === "hmac") setKeyType("jwk");
      if (changesFamily) {
        setKey("");
        setPublicJwk("");
      }
    });
  };
  const changeKeyType = (value: JwtSigningKeyType) => {
    updateInput(() => {
      setKeyType(value);
      setKey("");
      setPublicJwk("");
    });
  };
  const addTimeClaims = () => {
    try {
      const parsed = JSON.parse(payload) as unknown;
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error();
      const now = Math.floor(Date.now() / 1000);
      updateInput(() => setPayload(JSON.stringify({ ...parsed, iat: now, exp: now + 3600 }, null, 2)));
    } catch {
      setResult({ ok: false, error: "Fix the payload JSON before adding time claims." });
    }
  };
  const generateKey = async () => {
    const revision = inputRevision.current;
    const selectedAlgorithm = algorithm;
    setGeneratingKey(true);
    if (selectedAlgorithm.startsWith("HS")) {
      const generated = generateJwtHmacSecret();
      if (inputRevision.current !== revision) {
        setGeneratingKey(false);
        return;
      }
      if (generated.ok) {
        updateInput(() => {
          setKeyType("hmac");
          setKey(generated.value);
          setPublicJwk("");
        });
      } else setResult(generated);
    } else {
      const generated = await generateJwtSigningKeyPair(selectedAlgorithm as Exclude<JwtSigningAlgorithm, `HS${number}`>);
      if (inputRevision.current !== revision) {
        setGeneratingKey(false);
        return;
      }
      if (generated.ok) {
        updateInput(() => {
          setKeyType("jwk");
          setKey(JSON.stringify(generated.value.privateJwk, null, 2));
          setPublicJwk(JSON.stringify(generated.value.publicJwk, null, 2));
        });
      } else setResult(generated);
    }
    setGeneratingKey(false);
  };
  const sign = async () => {
    const revision = inputRevision.current;
    setWorking(true);
    const nextResult = await generateJwt(header, payload, key, { algorithm, keyType });
    if (inputRevision.current === revision) setResult(nextResult);
    setWorking(false);
  };
  const keyTypes: JwtSigningKeyType[] = algorithm.startsWith("HS") ? ["hmac", "jwk"] : ["jwk", "pem"];
  return (
    <section className="space-y-5">
      <Header
        title="JWT Generator"
        description="Create and sign development JWTs locally with HS, RS, or ES algorithms. The selected algorithm replaces any alg value in the header JSON."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Header JSON</span>
          <Textarea value={header} onChange={(event) => updateInput(() => setHeader(event.target.value))} rows={8} className="font-mono" spellCheck={false} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Payload JSON</span>
          <Textarea value={payload} onChange={(event) => updateInput(() => setPayload(event.target.value))} rows={8} className="font-mono" spellCheck={false} />
        </label>
      </div>
      <Button type="button" variant="outline" onClick={addTimeClaims}>Set iat and 1-hour expiry</Button>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Signing algorithm</span>
          <Select value={algorithm} onValueChange={(value) => changeAlgorithm(value as JwtSigningAlgorithm)}>
            <SelectTrigger aria-label="JWT signing algorithm"><SelectValue /></SelectTrigger>
            <SelectContent>{JWT_SIGNING_ALGORITHMS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Signing key format</span>
          <Select value={keyType} onValueChange={(value) => changeKeyType(value as JwtSigningKeyType)}>
            <SelectTrigger aria-label="JWT signing key format"><SelectValue /></SelectTrigger>
            <SelectContent>
              {keyTypes.includes("hmac") && <SelectItem value="hmac">HMAC secret</SelectItem>}
              {keyTypes.includes("jwk") && <SelectItem value="jwk">{algorithm.startsWith("HS") ? "Symmetric JWK" : "Private JWK"}</SelectItem>}
              {keyTypes.includes("pem") && <SelectItem value="pem">PKCS#8 private-key PEM</SelectItem>}
            </SelectContent>
          </Select>
        </label>
      </div>
      <AsyncActionButton pending={generatingKey} pendingLabel="Generating key…" variant="outline" onClick={() => void generateKey()}>
        Generate secure test key
      </AsyncActionButton>
      {keyType === "hmac" ? (
        <div className="space-y-2">
          <label htmlFor="jwt-generator-secret" className="text-sm font-medium">HMAC signing secret</label>
          <div className="flex gap-2">
            <Input
              id="jwt-generator-secret"
              type={showSecret ? "text" : "password"}
              value={key}
              onChange={(event) => updateInput(() => setKey(event.target.value))}
              className="font-mono"
              autoComplete="off"
            />
            <Button type="button" variant="outline" onClick={() => setShowSecret((value) => !value)}>{showSecret ? "Hide" : "Show"}</Button>
          </div>
        </div>
      ) : (
        <label className="block space-y-2">
          <span className="text-sm font-medium">{keyType === "jwk" ? "Signing JWK" : "PKCS#8 private key"}</span>
          <Textarea
            value={key}
            onChange={(event) => updateInput(() => setKey(event.target.value))}
            rows={10}
            className="font-mono"
            spellCheck={false}
            placeholder={keyType === "jwk" ? '{"kty":"EC", ... private parameters ...}' : "-----BEGIN PRIVATE KEY-----"}
          />
        </label>
      )}
      {publicJwk && <CopyableResult value={publicJwk} label="Generated public JWK" copyLabel="Copy generated public JWK" rows={8} />}
      <AsyncActionButton pending={working} pendingLabel="Generating JWT…" onClick={() => void sign()}>
        Generate signed JWT
      </AsyncActionButton>
      {result?.ok ? (
        <div className="space-y-3">
          <CopyableResult value={result.value.token} label="Signed JWT" copyLabel="Copy signed JWT" rows={5} />
          <CopyableResult value={result.value.warning} label="Security note" copyLabel="Copy generator security note" rows={3} />
        </div>
      ) : result ? (
        <ErrorResult message={result.error} />
      ) : null}
    </section>
  );
}

const VERIFIED_JWT_SAMPLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export function JwtSignatureVerifierTool() {
  const [token, setToken] = useState(VERIFIED_JWT_SAMPLE);
  const [key, setKey] = useState("your-256-bit-secret");
  const [keyType, setKeyType] = useState<Exclude<JwtVerificationKeyType, "auto">>("hmac");
  const [expectedAlgorithm, setExpectedAlgorithm] = useState("HS256");
  const [validateClaims, setValidateClaims] = useState(false);
  const [expectedIssuer, setExpectedIssuer] = useState("");
  const [expectedAudience, setExpectedAudience] = useState("");
  const [clockTolerance, setClockTolerance] = useState("0");
  const [showSecret, setShowSecret] = useState(false);
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof verifyJwtSignature>> | null>(null);
  const inputRevision = useRef(0);
  const inspection = useMemo(() => inspectJwt(token), [token]);
  const algorithms = keyType === "hmac"
    ? ["HS256", "HS384", "HS512"]
    : keyType === "pem"
      ? ["RS256", "RS384", "RS512", "ES256", "ES384"]
      : ["HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "ES256", "ES384"];
  const updateInput = (update: () => void) => {
    update();
    inputRevision.current += 1;
    setResult(null);
  };
  const changeKeyType = (value: Exclude<JwtVerificationKeyType, "auto">) => {
    const nextAlgorithms = value === "hmac"
      ? ["HS256", "HS384", "HS512"]
      : value === "pem"
        ? ["RS256", "RS384", "RS512", "ES256", "ES384"]
        : ["HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "ES256", "ES384"];
    updateInput(() => {
      setKeyType(value);
      if (!nextAlgorithms.includes(expectedAlgorithm)) setExpectedAlgorithm(nextAlgorithms[0]);
    });
  };
  const verify = async () => {
    const revision = inputRevision.current;
    setWorking(true);
    const nextResult = await verifyJwtSignature(token, key, {
      keyType,
      expectedAlgorithm,
      validateClaims,
      expectedIssuer,
      expectedAudience,
      clockToleranceSeconds: Number(clockTolerance),
    });
    if (inputRevision.current === revision) setResult(nextResult);
    setWorking(false);
  };
  const claimResult = result?.ok ? result.value.claimValidation : null;
  const claimSummary = claimResult
    ? claimResult.checks.length === 0
      ? "No claims checked. The token has no exp/nbf claim and no expected issuer or audience was entered."
      : claimResult.checks.map((check) => `${check.valid ? "PASS" : "FAIL"} ${check.claim}: ${check.message}`).join("\n")
    : "";
  return (
    <section className="space-y-5">
      <Header
        title="JWT Signature Verifier"
        description="Inspect a JWT, verify HS, RS, or ES signatures locally, and optionally validate standard claims. Signature and claim results are always reported separately."
      />
      <label className="block space-y-2">
        <span className="text-sm font-medium">JWT</span>
        <Textarea
          value={token}
          onChange={(event) => updateInput(() => setToken(event.target.value))}
          rows={6}
          className="font-mono"
          spellCheck={false}
          placeholder="Paste a three-part JWT without the Bearer prefix"
        />
      </label>
      {inspection.ok ? (
        <div className="space-y-3 rounded-md border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Decoded token</h3>
            <span className="text-sm text-muted-foreground">
              Declared algorithm: <span className="font-mono font-medium text-foreground">{inspection.value.algorithm ?? "unspecified"}</span>
            </span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <CopyableResult value={JSON.stringify(inspection.value.header, null, 2)} label="Header" copyLabel="Copy verifier header" rows={7} />
            <CopyableResult value={JSON.stringify(inspection.value.payload, null, 2)} label="Payload" copyLabel="Copy verifier payload" rows={7} />
          </div>
        </div>
      ) : (
        <ErrorResult message={inspection.error} />
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Key format</span>
          <Select value={keyType} onValueChange={(value) => changeKeyType(value as Exclude<JwtVerificationKeyType, "auto">)}>
            <SelectTrigger aria-label="JWT key format"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hmac">HMAC secret</SelectItem>
              <SelectItem value="jwk">JWK JSON</SelectItem>
              <SelectItem value="jwks">JWKS JSON</SelectItem>
              <SelectItem value="pem">SPKI public-key PEM</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Expected algorithm</span>
          <Select value={expectedAlgorithm} onValueChange={(value) => updateInput(() => setExpectedAlgorithm(value))}>
            <SelectTrigger aria-label="Expected JWT algorithm"><SelectValue /></SelectTrigger>
            <SelectContent>{algorithms.map((algorithm) => <SelectItem key={algorithm} value={algorithm}>{algorithm}</SelectItem>)}</SelectContent>
          </Select>
        </label>
      </div>
      {keyType === "hmac" ? (
        <div className="space-y-2">
          <label htmlFor="jwt-hmac-secret" className="text-sm font-medium">HMAC secret</label>
          <div className="flex gap-2">
            <Input
              id="jwt-hmac-secret"
              type={showSecret ? "text" : "password"}
              value={key}
              onChange={(event) => updateInput(() => setKey(event.target.value))}
              className="font-mono"
              autoComplete="off"
            />
            <Button type="button" variant="outline" onClick={() => setShowSecret((value) => !value)}>
              {showSecret ? "Hide" : "Show"}
            </Button>
          </div>
        </div>
      ) : (
        <label className="block space-y-2">
          <span className="text-sm font-medium">
            {keyType === "jwk" ? "Public or symmetric JWK" : keyType === "jwks" ? "JSON Web Key Set" : "SPKI public key"}
          </span>
          <Textarea
            value={key}
            onChange={(event) => updateInput(() => setKey(event.target.value))}
            rows={8}
            className="font-mono"
            spellCheck={false}
            placeholder={keyType === "jwk" ? '{"kty":"RSA", ...}' : keyType === "jwks" ? '{"keys":[...]}' : "-----BEGIN PUBLIC KEY-----"}
          />
        </label>
      )}
      <div className="space-y-4 rounded-md border p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <label htmlFor="validate-jwt-claims" className="text-sm font-medium">Validate standard claims</label>
            <p className="text-sm text-muted-foreground">Check exp and nbf when present, plus any issuer or audience entered below.</p>
          </div>
          <Switch
            id="validate-jwt-claims"
            checked={validateClaims}
            onCheckedChange={(checked) => updateInput(() => setValidateClaims(checked))}
          />
        </div>
        {validateClaims && (
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium">Expected issuer (optional)</span>
              <Input value={expectedIssuer} onChange={(event) => updateInput(() => setExpectedIssuer(event.target.value))} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Expected audience (optional)</span>
              <Input value={expectedAudience} onChange={(event) => updateInput(() => setExpectedAudience(event.target.value))} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Clock tolerance (seconds)</span>
              <Input
                type="number"
                min={0}
                max={3600}
                value={clockTolerance}
                onChange={(event) => updateInput(() => setClockTolerance(event.target.value))}
              />
            </label>
          </div>
        )}
      </div>
      <AsyncActionButton pending={working} pendingLabel="Verifying…" onClick={() => void verify()} disabled={!inspection.ok}>
        Verify signature
      </AsyncActionButton>
      {result?.ok ? (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <CopyableResult value={result.value.verified ? "Verified" : "Not verified"} label="Signature result" copyLabel="Copy signature result" rows={1} />
            <CopyableResult value={result.value.algorithm} label="Verified algorithm" copyLabel="Copy algorithm" rows={1} />
            <CopyableResult value={result.value.keyType.toUpperCase()} label="Key format used" copyLabel="Copy key format" rows={1} />
          </div>
          {claimResult && (
            <div className="grid gap-3 md:grid-cols-2">
              <CopyableResult
                value={claimResult.checks.length === 0 ? "No claims checked" : claimResult.valid ? "Passed" : "Failed"}
                label="Claim result"
                copyLabel="Copy claim result"
                rows={1}
              />
              <CopyableResult value={claimSummary} label="Claim checks" copyLabel="Copy claim checks" rows={4} />
            </div>
          )}
          <CopyableResult value={result.value.warning} label="Security note" copyLabel="Copy limitation" rows={3} />
        </div>
      ) : result ? (
        <ErrorResult message={result.error} />
      ) : null}
    </section>
  );
}

export function SymmetricEncryptionTool() {
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [input, setInput] = useState("Private message");
  const [password, setPassword] = useState("local-development-password");
  const [result, setResult] = useState<Awaited<ReturnType<typeof encryptText>> | null>(null);
  const run = async () => setResult(mode === "encrypt" ? await encryptText(password, input) : await decryptText(password, input));
  const reverse = () => { if (result?.ok) setInput(result.value); setResult(null); setMode((value) => value === "encrypt" ? "decrypt" : "encrypt"); };
  return <section className="space-y-5"><Header title="Authenticated Text Encryption" description="Encrypt or decrypt text locally with AES-256-GCM and a PBKDF2-derived key. This is a primitive demonstration, not application key management." /><div className="flex flex-wrap gap-3"><Button type="button" onClick={() => void run()}>{mode === "encrypt" ? "Encrypt text" : "Decrypt text"}</Button><Button type="button" variant="outline" onClick={reverse}>Reverse direction</Button></div><label className="block space-y-2"><span className="text-sm font-medium">{mode === "encrypt" ? "Plaintext" : "Encryption envelope"}</span><Textarea value={input} onChange={(event) => setInput(event.target.value)} rows={12} className="font-mono" /></label><label className="block max-w-xl space-y-2"><span className="text-sm font-medium">Password</span><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="off" /></label>{result?.ok ? <CopyableResult value={result.value} label={mode === "encrypt" ? "Encryption envelope" : "Decrypted text"} copyLabel={mode === "encrypt" ? "Copy encryption envelope" : "Copy decrypted text"} rows={12} /> : result ? <ErrorResult message={result.error} /> : null}</section>;
}

export function KeypairSignatureTool() {
  const [publicJwk, setPublicJwk] = useState("");
  const [privateJwk, setPrivateJwk] = useState("");
  const [text, setText] = useState("Message to sign");
  const [signature, setSignature] = useState("");
  const [verification, setVerification] = useState("");
  const [error, setError] = useState("");
  const generate = async () => { const result = await generateSigningKeyPair(); if (result.ok) { setPublicJwk(JSON.stringify(result.value.publicJwk, null, 2)); setPrivateJwk(JSON.stringify(result.value.privateJwk, null, 2)); setError(""); } else setError(result.error); };
  const sign = async () => { const result = await signText(privateJwk, text); if (result.ok) { setSignature(result.value); setError(""); } else setError(result.error); };
  const verify = async () => { const result = await verifyTextSignature(publicJwk, text, signature); if (result.ok) { setVerification(result.value ? "Verified" : "Not verified"); setError(""); } else setError(result.error); };
  return <section className="space-y-5"><Header title="Keypair and Signature Tool" description="Generate an exportable ECDSA P-256 test keypair, then sign and verify text locally. Do not use this UI to manage production private keys." /><div className="flex flex-wrap gap-3"><Button type="button" onClick={() => void generate()}>Generate keypair</Button><Button type="button" variant="outline" onClick={() => void sign()} disabled={!privateJwk}>Sign text</Button><Button type="button" variant="outline" onClick={() => void verify()} disabled={!publicJwk || !signature}>Verify signature</Button></div><label className="block space-y-2"><span className="text-sm font-medium">Text</span><Textarea value={text} onChange={(event) => setText(event.target.value)} rows={4} /></label>{error ? <ErrorResult message={error} /> : <div className="grid gap-4 lg:grid-cols-2"><CopyableResult value={publicJwk} label="Public JWK" copyLabel="Copy public JWK" rows={10} /><CopyableResult value={privateJwk} label="Private JWK" copyLabel="Copy private JWK" rows={10} showToggleVisibility /><CopyableResult value={signature} label="Signature" copyLabel="Copy signature" rows={4} /><CopyableResult value={verification} label="Verification" copyLabel="Copy verification" rows={2} /></div>}</section>;
}

export function SriGeneratorTool() {
  const [input, setInput] = useState("console.log('loaded');\n");
  const [algorithm, setAlgorithm] = useState<DigestAlgorithm>("SHA-384");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const generate = async () => { const output = await generateSri(input, algorithm); if (output.ok) { setResult(output.value); setError(""); } else { setResult(""); setError(output.error); } };
  return <section className="space-y-5"><Header title="Subresource Integrity Generator" description="Generate an SRI hash from the exact local resource content. Hash remote files only after downloading them from a trusted source." /><label className="block max-w-sm space-y-2"><span className="text-sm font-medium">Algorithm</span><Select value={algorithm} onValueChange={(value) => setAlgorithm(value as DigestAlgorithm)}><SelectTrigger aria-label="SRI algorithm"><SelectValue /></SelectTrigger><SelectContent>{(["SHA-256", "SHA-384", "SHA-512"] as const).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></label><label className="block space-y-2"><span className="text-sm font-medium">Resource content</span><Textarea value={input} onChange={(event) => setInput(event.target.value)} rows={12} className="font-mono" /></label><Button type="button" onClick={() => void generate()}>Generate SRI</Button>{error ? <ErrorResult message={error} /> : <CopyableResult value={result} label="Integrity attribute" copyLabel="Copy integrity attribute" rows={3} />}</section>;
}

export function TotpTool() {
  const [secret, setSecret] = useState("JBSWY3DPEHPK3PXP");
  const [code, setCode] = useState("");
  const [candidate, setCandidate] = useState("");
  const [validation, setValidation] = useState("");
  const [error, setError] = useState("");
  const newSecret = () => { const result = generateTotpSecret(); if (result.ok) { setSecret(result.value); setError(""); } else setError(result.error); };
  const generate = async () => { const result = await generateTotp(secret); if (result.ok) { setCode(result.value); setError(""); } else setError(result.error); };
  const validate = async () => { const result = await validateTotp(secret, candidate); if (result.ok) { setValidation(result.value ? "Valid" : "Invalid or expired"); setError(""); } else setError(result.error); };
  return <section className="space-y-5"><Header title="TOTP Generator and Validator" description="Generate and validate standard SHA-1 TOTP codes locally. Clock synchronization and secure secret storage remain your responsibility." /><div className="flex flex-wrap gap-3"><Button type="button" onClick={newSecret}>Generate secret</Button><Button type="button" variant="outline" onClick={() => void generate()}>Generate current code</Button></div><CopyableResult value={secret} label="Base32 secret" copyLabel="Copy Base32 secret" rows={2} readOnly={false} onValueChange={setSecret} showToggleVisibility /><CopyableResult value={code} label="Current code" copyLabel="Copy current code" rows={2} /><div className="flex max-w-xl items-end gap-3"><label className="flex-1 space-y-2"><span className="text-sm font-medium">Code to validate</span><Input inputMode="numeric" value={candidate} onChange={(event) => setCandidate(event.target.value)} /></label><Button type="button" onClick={() => void validate()}>Validate code</Button></div>{error ? <ErrorResult message={error} /> : <CopyableResult value={validation} label="Validation result" copyLabel="Copy validation result" rows={2} />}</section>;
}

export function CertificateDecoderTool() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof decodeCertificate>> | null>(null);
  const [working, setWorking] = useState(false);
  const decode = async () => { setWorking(true); setResult(await decodeCertificate(input)); setWorking(false); };
  return <section className="space-y-5"><Header title="X.509 Certificate Decoder" description="Decode certificate fields entirely in your browser. This does not validate trust, chain, hostname, revocation, or policy." /><label className="block space-y-2"><span className="text-sm font-medium">PEM, DER Base64, or hexadecimal certificate</span><Textarea value={input} onChange={(event) => setInput(event.target.value)} rows={14} className="font-mono" spellCheck={false} placeholder="-----BEGIN CERTIFICATE-----" /></label><AsyncActionButton pending={working} pendingLabel="Decoding…" onClick={() => void decode()}>Decode certificate</AsyncActionButton>{result?.ok ? <div className="space-y-4"><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"><CopyableResult value={result.value.subject} label="Subject" copyLabel="Copy subject" rows={3} /><CopyableResult value={result.value.issuer} label="Issuer" copyLabel="Copy issuer" rows={3} /><CopyableResult value={result.value.serialNumber} label="Serial number" copyLabel="Copy serial number" rows={2} /><CopyableResult value={result.value.notBefore} label="Not before" copyLabel="Copy not before" rows={2} /><CopyableResult value={result.value.notAfter} label="Not after" copyLabel="Copy not after" rows={2} /><CopyableResult value={result.value.status} label="Validity status" copyLabel="Copy validity status" rows={2} /><CopyableResult value={result.value.signatureAlgorithm} label="Signature algorithm" copyLabel="Copy signature algorithm" rows={2} /><CopyableResult value={result.value.publicKeyAlgorithm} label="Public-key algorithm" copyLabel="Copy public-key algorithm" rows={2} /><CopyableResult value={result.value.sha256Fingerprint} label="SHA-256 fingerprint" copyLabel="Copy SHA-256 fingerprint" rows={3} /><CopyableResult value={result.value.selfSigned ? "Yes" : "No"} label="Self-signed" copyLabel="Copy self-signed result" rows={2} /><CopyableResult value={result.value.warning} label="Trust limitation" copyLabel="Copy trust limitation" rows={4} /></div>{result.value.extensions.length > 0 && <div><h3 className="mb-2 text-sm font-medium">Extensions</h3><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{result.value.extensions.map((extension, index) => <CopyableResult key={`${extension.oid}-${index}`} value={`${extension.oid}\nCritical: ${extension.critical ? "yes" : "no"}`} label={`Extension ${index + 1}`} copyLabel={`Copy extension ${index + 1}`} rows={2} />)}</div></div>}</div> : result ? <ErrorResult message={result.error} /> : null}</section>;
}
