import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    // Existing client tools use mount flags and URL-to-state synchronization.
    // Enforce React 19 compiler-oriented hook purity and effect state rules.
    rules: {
      "react-hooks/purity": "error",
      "react-hooks/set-state-in-effect": "error",
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
