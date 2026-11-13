/** Aplica as regras de Hooks e de pureza a componentes e módulos do aplicativo. */
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    files: ["{app,components,lib}/**/*.{ts,tsx}", "middleware.ts"],
    languageOptions: { parser: tsParser },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/globals": "error",
      "react-hooks/immutability": "error",
      "react-hooks/purity": "error",
      "react-hooks/refs": "error",
    },
  },
];
