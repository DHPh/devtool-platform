import { defineStudioManifest } from "@/lib/studio-manifest";

export const SECURITY_IDENTITY_STUDIO_MANIFEST = defineStudioManifest(
  "security-identity-studio",
  "security-identity-studio",
  [
    { id: "jwt-inspector", shortLabel: "JWT", icon: "Eye", loadComponent: () => import("./tabs/JwtInspectorTab").then((module) => ({ default: module.JwtInspectorTab })) },
    { id: "hash-hmac-generator", shortLabel: "Hash/HMAC", icon: "Hash", loadComponent: () => import("./tabs/HashHmacGeneratorTab").then((module) => ({ default: module.HashHmacGeneratorTab })) },
  ],
);
