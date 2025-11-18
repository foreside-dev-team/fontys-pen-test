/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/stylistic",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  env: {
    node: true,
    jest: true,
  },
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    ecmaVersion: 2021,
    sourceType: "module",
  },
  overrides: [
    {
      extends: [
        "plugin:@typescript-eslint/recommended-type-checked",
        "plugin:@typescript-eslint/stylistic-type-checked",
      ],
      files: ["./**/*.{ts,tsx}"],
    },
  ],
  plugins: ["unicorn", "@typescript-eslint"],
  rules: {
    "@typescript-eslint/consistent-type-definitions": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "no-constant-binary-expression": "error",
    "unicorn/new-for-builtins": "error",
    "unicorn/switch-case-braces": "warn",
    "unicorn/throw-new-error": "warn",
    "unicorn/prefer-default-parameters": "warn",
    "unicorn/prefer-array-some": "error",
    "unicorn/prefer-includes": "error",
    "unicorn/prefer-array-index-of": "error",
    "unicorn/no-new-array": "error",
    "@typescript-eslint/no-unnecessary-type-assertion": "error",
    "@typescript-eslint/require-await": "warn",
    "@typescript-eslint/await-thenable": "error",
  },
  ignorePatterns: [
    "**/*.d.ts",
    "**/*.min.js",
    ".eslintrc*",
    "dist/*",
    "node_modules/",
    "mocks/*",
  ],
};
