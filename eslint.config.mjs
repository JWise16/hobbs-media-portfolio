import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "test-results/**", "playwright-report/**", "content/clips.generated.ts"],
  },
];

export default config;
