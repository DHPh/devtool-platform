import { defineStudioManifest } from "@/lib/studio-manifest";

export const SECURITY_IDENTITY_STUDIO_MANIFEST = defineStudioManifest(
  "security-identity-studio",
  "security-identity-studio",
  [
    { id: "jwt-inspector", shortLabel: "JWT", icon: "Eye", loadComponent: () => import("./tabs/JwtInspectorTab").then((module) => ({ default: module.JwtInspectorTab })) },
    { id: "hash-hmac-generator", shortLabel: "Hash/HMAC", icon: "Hash", loadComponent: () => import("./tabs/HashHmacGeneratorTab").then((module) => ({ default: module.HashHmacGeneratorTab })) },
    { id: "jwt-signature-verifier", shortLabel: "JWT verify", icon: "CheckCircle", loadComponent: () => import("./tabs/JwtSignatureVerifierTab").then((module) => ({ default: module.JwtSignatureVerifierTab })) },
    { id: "symmetric-encryption", shortLabel: "Encrypt", icon: "Key", loadComponent: () => import("./tabs/SymmetricEncryptionTab").then((module) => ({ default: module.SymmetricEncryptionTab })) },
    { id: "keypair-signature-tool", shortLabel: "Signatures", icon: "Shield", loadComponent: () => import("./tabs/KeypairSignatureTab").then((module) => ({ default: module.KeypairSignatureTab })) },
    { id: "sri-generator", shortLabel: "SRI", icon: "Link", loadComponent: () => import("./tabs/SriGeneratorTab").then((module) => ({ default: module.SriGeneratorTab })) },
    { id: "totp-tool", shortLabel: "TOTP", icon: "Activity", loadComponent: () => import("./tabs/TotpTab").then((module) => ({ default: module.TotpTab })) },
    { id: "certificate-decoder", shortLabel: "X.509", icon: "FileText", loadComponent: () => import("./tabs/CertificateDecoderTab").then((module) => ({ default: module.CertificateDecoderTab })) },
  ],
);
