// @ts-check
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    ignores: [".next/**", "node_modules/**"],
  }
);
