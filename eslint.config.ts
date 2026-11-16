import js from "@eslint/js";
import importX from "eslint-plugin-import-x";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import sonarjs from "eslint-plugin-sonarjs";
import globals from "globals";
import tseslint from "typescript-eslint";

import type { Linter } from "eslint";

const typedRules: Linter.RulesRecord = {
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-non-null-assertion": "error",
  "@typescript-eslint/no-unnecessary-condition": "warn",
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-misused-promises": "error",
  "@typescript-eslint/switch-exhaustiveness-check": "error",
  "@typescript-eslint/consistent-type-imports": [
    "error",
    { prefer: "type-imports", fixStyle: "inline-type-imports" },
  ],
  "@typescript-eslint/consistent-type-exports": "error",
  "@typescript-eslint/no-unsafe-assignment": "error",
  "@typescript-eslint/no-unsafe-member-access": "error",
  "@typescript-eslint/no-unsafe-call": "error",
  "@typescript-eslint/no-unsafe-return": "error",
  "@typescript-eslint/no-unsafe-argument": "error",
  "@typescript-eslint/restrict-template-expressions": [
    "error",
    { allowNumber: true, allowBoolean: true, allowNullish: false },
  ],
};

const TABLE_BARREL_IMPORT_MESSAGE =
  "Inside src/table, import via @table/<path> — never through the public barrel.";

const complexityRules: Linter.RulesRecord = {
  complexity: ["warn", 12],
  "max-depth": ["warn", 4],
  "max-lines-per-function": ["warn", { max: 120, skipComments: true, skipBlankLines: true }],
  "max-nested-callbacks": ["warn", 4],
  "max-params": ["warn", 5],
  "sonarjs/cognitive-complexity": ["warn", 15],
  "sonarjs/no-duplicate-string": ["warn", { threshold: 4 }],
  "sonarjs/no-identical-functions": "warn",
};

// eslint-disable-next-line @typescript-eslint/no-deprecated, sonarjs/deprecation -- tseslint.config() is deprecated for eslint/core defineConfig, but defineConfig still rejects plugins whose configs.flat shape differs from Plugin["configs"] (react-hooks, react). Remove when the ecosystem aligns.
const config = tseslint.config(
  {
    ignores: [
      "dist",
      "coverage",
      "node_modules",
      ".cache",
      "playwright-report",
      "test-results",
      "src/app/routeTree.gen.ts",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.es2023 },
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.js"],
          defaultProject: "tsconfig.json",
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      sonarjs,
      "import-x": importX,
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    settings: {
      "import-x/resolver": {
        typescript: true,
        node: true,
      },
      react: { version: "detect" },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      ...sonarjs.configs.recommended.rules,
      ...importX.flatConfigs.recommended.rules,
      ...importX.flatConfigs.typescript.rules,

      "import-x/no-cycle": ["error", { maxDepth: 10 }],
      "import-x/no-self-import": "error",
      "import-x/no-useless-path-segments": "error",
      "import-x/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "type"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],

      ...typedRules,
      ...complexityRules,

      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='fetch']",
          message:
            "Do not call fetch from table or feature UI. Demo data is validated local fixtures; host apps may fetch outside these layers and pass data as props.",
        },
      ],

      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { react: reactPlugin },
    rules: {
      ...(reactPlugin.configs.flat.recommended.rules ?? {}),
      ...(reactPlugin.configs.flat["jsx-runtime"].rules ?? {}),
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
    },
  },

  {
    files: ["src/table/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@table",
              message: TABLE_BARREL_IMPORT_MESSAGE,
            },
            {
              name: "@table/index",
              message: TABLE_BARREL_IMPORT_MESSAGE,
            },
            {
              name: "@/table",
              message: TABLE_BARREL_IMPORT_MESSAGE,
            },
            {
              name: "@/table/index",
              message: TABLE_BARREL_IMPORT_MESSAGE,
            },
          ],
          patterns: [
            {
              group: [
                "@app/*",
                "@features/*",
                "@mocks/*",
                "src/app/*",
                "src/features/*",
                "src/mocks/*",
              ],
              message:
                "src/table must remain portable and cannot import from app, features, or mocks.",
            },
            {
              group: ["@tanstack/react-query"],
              message:
                "src/table must not depend on the data layer. Pass data in through props instead.",
            },
          ],
        },
      ],
    },
  },

  {
    files: ["src/table/schema/**/*.ts", "src/table/url/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-dom", "@tanstack/react-table", "@tanstack/react-router"],
              message:
                "Schema and URL helpers must stay pure TypeScript. Router hooks live in src/table/hooks and components.",
            },
          ],
        },
      ],
    },
  },

  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@app/*", "@features/*", "src/app/*", "src/features/*"],
              message: "shared code cannot import from app or features.",
            },
          ],
        },
      ],
    },
  },

  {
    files: ["src/**/*.{test,spec}.{ts,tsx}", "vitest.setup.ts", "e2e/**/*.ts"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "sonarjs/no-duplicate-string": "off",
      "max-lines-per-function": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },

  {
    files: [
      "*.config.{ts,js,mjs,cjs}",
      "eslint.config.ts",
      "vite.config.ts",
      "vitest.config.ts",
      "playwright.config.ts",
    ],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "import-x/no-default-export": "off",
    },
  },
);

export default config;
