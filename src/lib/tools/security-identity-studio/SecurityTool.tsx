"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  AsyncActionButton,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  decryptText,
  decodeCertificate,
  encryptText,
  generateDigest,
  generateHmac,
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

const VERIFIED_JWT_SAMPLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export function JwtSignatureVerifierTool() {
  const [token, setToken] = useState(VERIFIED_JWT_SAMPLE);
  const [key, setKey] = useState("your-256-bit-secret");
  const [result, setResult] = useState<Awaited<ReturnType<typeof verifyJwtSignature>> | null>(null);
  const verify = async () => setResult(await verifyJwtSignature(token, key));
  return <section className="space-y-5"><Header title="JWT Signature Verifier" description="Verify HS, RS, or ES JWT signatures locally with a secret, public JWK, or SPKI PEM key. Claims are not validated." /><label className="block space-y-2"><span className="text-sm font-medium">JWT</span><Textarea value={token} onChange={(event) => setToken(event.target.value)} rows={6} className="font-mono" spellCheck={false} /></label><label className="block space-y-2"><span className="text-sm font-medium">Verification key or HMAC secret</span><Textarea value={key} onChange={(event) => setKey(event.target.value)} rows={7} className="font-mono" spellCheck={false} /></label><Button type="button" onClick={() => void verify()}>Verify signature</Button>{result?.ok ? <div className="grid gap-3 md:grid-cols-3"><CopyableResult value={result.value.verified ? "Verified" : "Not verified"} label="Signature result" copyLabel="Copy signature result" rows={1} /><CopyableResult value={result.value.algorithm} label="Algorithm" copyLabel="Copy algorithm" rows={1} /><CopyableResult value={result.value.warning} label="Limitation" copyLabel="Copy limitation" rows={3} /></div> : result ? <ErrorResult message={result.error} /> : null}</section>;
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
