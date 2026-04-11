"use client";

import { useMemo, useRef, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { inspectJwt } from "@/lib/processors/crypto-core";
import {
  verifyJwtSignature,
  type JwtVerificationKeyType,
} from "@/lib/processors/advanced-crypto-core";

const VERIFIED_JWT_SAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export function JwtSignatureVerifierTab() {
  const [token, setToken] = useState(VERIFIED_JWT_SAMPLE);
  const [key, setKey] = useState("your-256-bit-secret");
  const [keyType, setKeyType] =
    useState<Exclude<JwtVerificationKeyType, "auto">>("hmac");
  const [expectedAlgorithm, setExpectedAlgorithm] = useState("HS256");
  const [validateClaims, setValidateClaims] = useState(false);
  const [expectedIssuer, setExpectedIssuer] = useState("");
  const [expectedAudience, setExpectedAudience] = useState("");
  const [clockTolerance, setClockTolerance] = useState("0");
  const [showSecret, setShowSecret] = useState(false);
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<
    Awaited<ReturnType<typeof verifyJwtSignature>> | null
  >(null);
  const inputRevision = useRef(0);
  const inspection = useMemo(() => inspectJwt(token), [token]);

  const algorithms =
    keyType === "hmac"
      ? ["HS256", "HS384", "HS512"]
      : keyType === "pem"
        ? ["RS256", "RS384", "RS512", "ES256", "ES384"]
        : [
            "HS256",
            "HS384",
            "HS512",
            "RS256",
            "RS384",
            "RS512",
            "ES256",
            "ES384",
          ];

  const updateInput = (update: () => void) => {
    update();
    inputRevision.current += 1;
    setResult(null);
  };

  const changeKeyType = (value: Exclude<JwtVerificationKeyType, "auto">) => {
    const nextAlgorithms =
      value === "hmac"
        ? ["HS256", "HS384", "HS512"]
        : value === "pem"
          ? ["RS256", "RS384", "RS512", "ES256", "ES384"]
          : [
              "HS256",
              "HS384",
              "HS512",
              "RS256",
              "RS384",
              "RS512",
              "ES256",
              "ES384",
            ];
    updateInput(() => {
      setKeyType(value);
      if (!nextAlgorithms.includes(expectedAlgorithm)) {
        setExpectedAlgorithm(nextAlgorithms[0]);
      }
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
      : claimResult.checks
          .map(
            (check) =>
              `${check.valid ? "PASS" : "FAIL"} ${check.claim}: ${check.message}`,
          )
          .join("\n")
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
              Declared algorithm:{" "}
              <span className="font-mono font-medium text-foreground">
                {inspection.value.algorithm ?? "unspecified"}
              </span>
            </span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <CopyableResult
              value={JSON.stringify(inspection.value.header, null, 2)}
              label="Header"
              copyLabel="Copy verifier header"
              rows={7}
            />
            <CopyableResult
              value={JSON.stringify(inspection.value.payload, null, 2)}
              label="Payload"
              copyLabel="Copy verifier payload"
              rows={7}
            />
          </div>
        </div>
      ) : (
        <ErrorResult message={inspection.error} />
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Key format</span>
          <Select
            value={keyType}
            onValueChange={(value) =>
              changeKeyType(value as Exclude<JwtVerificationKeyType, "auto">)
            }
          >
            <SelectTrigger aria-label="JWT key format">
              <SelectValue />
            </SelectTrigger>
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
          <Select
            value={expectedAlgorithm}
            onValueChange={(value) =>
              updateInput(() => setExpectedAlgorithm(value))
            }
          >
            <SelectTrigger aria-label="Expected JWT algorithm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {algorithms.map((algorithm) => (
                <SelectItem key={algorithm} value={algorithm}>
                  {algorithm}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      {keyType === "hmac" ? (
        <div className="space-y-2">
          <label htmlFor="jwt-hmac-secret" className="text-sm font-medium">
            HMAC secret
          </label>
          <div className="flex gap-2">
            <Input
              id="jwt-hmac-secret"
              type={showSecret ? "text" : "password"}
              value={key}
              onChange={(event) =>
                updateInput(() => setKey(event.target.value))
              }
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
            {keyType === "jwk"
              ? "Public or symmetric JWK"
              : keyType === "jwks"
                ? "JSON Web Key Set"
                : "SPKI public key"}
          </span>
          <Textarea
            value={key}
            onChange={(event) => updateInput(() => setKey(event.target.value))}
            rows={8}
            className="font-mono"
            spellCheck={false}
            placeholder={
              keyType === "jwk"
                ? '{"kty":"RSA", ...}'
                : keyType === "jwks"
                  ? '{"keys":[...]}'
                  : "-----BEGIN PUBLIC KEY-----"
            }
          />
        </label>
      )}
      <div className="space-y-4 rounded-md border p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <label
              htmlFor="validate-jwt-claims"
              className="text-sm font-medium"
            >
              Validate standard claims
            </label>
            <p className="text-sm text-muted-foreground">
              Check exp and nbf when present, plus any issuer or audience
              entered below.
            </p>
          </div>
          <Switch
            id="validate-jwt-claims"
            checked={validateClaims}
            onCheckedChange={(checked) =>
              updateInput(() => setValidateClaims(checked))
            }
          />
        </div>
        {validateClaims && (
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium">
                Expected issuer (optional)
              </span>
              <Input
                value={expectedIssuer}
                onChange={(event) =>
                  updateInput(() => setExpectedIssuer(event.target.value))
                }
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">
                Expected audience (optional)
              </span>
              <Input
                value={expectedAudience}
                onChange={(event) =>
                  updateInput(() => setExpectedAudience(event.target.value))
                }
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">
                Clock tolerance (seconds)
              </span>
              <Input
                type="number"
                min={0}
                max={3600}
                value={clockTolerance}
                onChange={(event) =>
                  updateInput(() => setClockTolerance(event.target.value))
                }
              />
            </label>
          </div>
        )}
      </div>
      <AsyncActionButton
        pending={working}
        pendingLabel="Verifying…"
        onClick={() => void verify()}
        disabled={!inspection.ok}
      >
        Verify signature
      </AsyncActionButton>
      {result?.ok ? (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <CopyableResult
              value={result.value.verified ? "Verified" : "Not verified"}
              label="Signature result"
              copyLabel="Copy signature result"
              rows={1}
            />
            <CopyableResult
              value={result.value.algorithm}
              label="Verified algorithm"
              copyLabel="Copy algorithm"
              rows={1}
            />
            <CopyableResult
              value={result.value.keyType.toUpperCase()}
              label="Key format used"
              copyLabel="Copy key format"
              rows={1}
            />
          </div>
          {claimResult && (
            <div className="grid gap-3 md:grid-cols-2">
              <CopyableResult
                value={
                  claimResult.checks.length === 0
                    ? "No claims checked"
                    : claimResult.valid
                      ? "Passed"
                      : "Failed"
                }
                label="Claim result"
                copyLabel="Copy claim result"
                rows={1}
              />
              <CopyableResult
                value={claimSummary}
                label="Claim checks"
                copyLabel="Copy claim checks"
                rows={4}
              />
            </div>
          )}
          <CopyableResult
            value={result.value.warning}
            label="Security note"
            copyLabel="Copy limitation"
            rows={3}
          />
        </div>
      ) : result ? (
        <ErrorResult message={result.error} />
      ) : null}
    </section>
  );
}
