"use client";

import { useRef, useState } from "react";
import {
  AsyncActionButton,
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  generateJwt,
  generateJwtHmacSecret,
  generateJwtSigningKeyPair,
  type JwtSigningAlgorithm,
  type JwtSigningKeyType,
} from "@/lib/processors/advanced-crypto-core";

const JWT_GENERATOR_HEADER = JSON.stringify({ typ: "JWT" }, null, 2);
const JWT_GENERATOR_PAYLOAD = JSON.stringify(
  { sub: "123", name: "Ada" },
  null,
  2,
);
const JWT_SIGNING_ALGORITHMS: JwtSigningAlgorithm[] = [
  "HS256",
  "HS384",
  "HS512",
  "RS256",
  "RS384",
  "RS512",
  "ES256",
  "ES384",
];

export function JwtGeneratorTab() {
  const [header, setHeader] = useState(JWT_GENERATOR_HEADER);
  const [payload, setPayload] = useState(JWT_GENERATOR_PAYLOAD);
  const [algorithm, setAlgorithm] = useState<JwtSigningAlgorithm>("HS256");
  const [keyType, setKeyType] = useState<JwtSigningKeyType>("hmac");
  const [key, setKey] = useState("");
  const [publicJwk, setPublicJwk] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [working, setWorking] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [result, setResult] = useState<
    Awaited<ReturnType<typeof generateJwt>> | null
  >(null);
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
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        throw new Error();
      }
      const now = Math.floor(Date.now() / 1000);
      updateInput(() =>
        setPayload(
          JSON.stringify({ ...parsed, iat: now, exp: now + 3600 }, null, 2),
        ),
      );
    } catch {
      setResult({
        ok: false,
        error: "Fix the payload JSON before adding time claims.",
      });
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
      } else {
        setResult(generated);
      }
    } else {
      const generated = await generateJwtSigningKeyPair(
        selectedAlgorithm as Exclude<JwtSigningAlgorithm, `HS${number}`>,
      );
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
      } else {
        setResult(generated);
      }
    }
    setGeneratingKey(false);
  };

  const sign = async () => {
    const revision = inputRevision.current;
    setWorking(true);
    const nextResult = await generateJwt(header, payload, key, {
      algorithm,
      keyType,
    });
    if (inputRevision.current === revision) setResult(nextResult);
    setWorking(false);
  };

  const keyTypes: JwtSigningKeyType[] = algorithm.startsWith("HS")
    ? ["hmac", "jwk"]
    : ["jwk", "pem"];

  return (
    <section className="space-y-5">
      <Header
        title="JWT Generator"
        description="Create and sign development JWTs locally with HS, RS, or ES algorithms. The selected algorithm replaces any alg value in the header JSON."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Header JSON</span>
          <Textarea
            value={header}
            onChange={(event) =>
              updateInput(() => setHeader(event.target.value))
            }
            rows={8}
            className="font-mono"
            spellCheck={false}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Payload JSON</span>
          <Textarea
            value={payload}
            onChange={(event) =>
              updateInput(() => setPayload(event.target.value))
            }
            rows={8}
            className="font-mono"
            spellCheck={false}
          />
        </label>
      </div>
      <Button type="button" variant="outline" onClick={addTimeClaims}>
        Set iat and 1-hour expiry
      </Button>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Signing algorithm</span>
          <Select
            value={algorithm}
            onValueChange={(value) =>
              changeAlgorithm(value as JwtSigningAlgorithm)
            }
          >
            <SelectTrigger aria-label="JWT signing algorithm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JWT_SIGNING_ALGORITHMS.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Signing key format</span>
          <Select
            value={keyType}
            onValueChange={(value) =>
              changeKeyType(value as JwtSigningKeyType)
            }
          >
            <SelectTrigger aria-label="JWT signing key format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {keyTypes.includes("hmac") && (
                <SelectItem value="hmac">HMAC secret</SelectItem>
              )}
              {keyTypes.includes("jwk") && (
                <SelectItem value="jwk">
                  {algorithm.startsWith("HS") ? "Symmetric JWK" : "Private JWK"}
                </SelectItem>
              )}
              {keyTypes.includes("pem") && (
                <SelectItem value="pem">PKCS#8 private-key PEM</SelectItem>
              )}
            </SelectContent>
          </Select>
        </label>
      </div>
      <AsyncActionButton
        pending={generatingKey}
        pendingLabel="Generating key…"
        variant="outline"
        onClick={() => void generateKey()}
      >
        Generate secure test key
      </AsyncActionButton>
      {keyType === "hmac" ? (
        <div className="space-y-2">
          <label
            htmlFor="jwt-generator-secret"
            className="text-sm font-medium"
          >
            HMAC signing secret
          </label>
          <div className="flex gap-2">
            <Input
              id="jwt-generator-secret"
              type={showSecret ? "text" : "password"}
              value={key}
              onChange={(event) =>
                updateInput(() => setKey(event.target.value))
              }
              placeholder="Enter a signing secret or click Generate secure test key"
              className="font-mono"
              autoComplete="off"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSecret((value) => !value)}
            >
              {showSecret ? "Hide" : "Show"}
            </Button>
          </div>
        </div>
      ) : (
        <label className="block space-y-2">
          <span className="text-sm font-medium">
            {keyType === "jwk" ? "Signing JWK" : "PKCS#8 private key"}
          </span>
          <Textarea
            value={key}
            onChange={(event) => updateInput(() => {
              setKey(event.target.value);
              setPublicJwk("");
            })}
            rows={10}
            className="font-mono"
            spellCheck={false}
            placeholder={
              keyType === "jwk"
                ? '{"kty":"EC", ... private parameters ...}'
                : "-----BEGIN PRIVATE KEY-----"
            }
          />
        </label>
      )}
      {publicJwk && (
        <CopyableResult
          value={publicJwk}
          label="Generated public JWK"
          copyLabel="Copy generated public JWK"
          rows={8}
        />
      )}
      <AsyncActionButton
        pending={working}
        disabled={!key.trim() || generatingKey}
        pendingLabel="Generating JWT…"
        onClick={() => void sign()}
      >
        Generate signed JWT
      </AsyncActionButton>
      {result?.ok ? (
        <div className="space-y-3">
          <CopyableResult
            value={result.value.token}
            label="Signed JWT"
            copyLabel="Copy signed JWT"
            rows={5}
          />
          <CopyableResult
            value={result.value.warning}
            label="Security note"
            copyLabel="Copy generator security note"
            rows={3}
          />
        </div>
      ) : result ? (
        <ErrorResult message={result.error} />
      ) : null}
    </section>
  );
}
