import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    // Existing client tools use mount flags and URL-to-state synchronization.
    // Keep Next 16's compiler-oriented findings visible without blocking CI.
    rules: {
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "coverage/**",
    "next-env.d.ts",
    "node_modules/**",
    "out/**",
    "playwright-report/**",
    "scripts/diagnostics/**",
    "test-results/**",
  ]),
]);
