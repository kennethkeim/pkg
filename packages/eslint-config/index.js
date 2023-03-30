// https://typescript-eslint.io/getting-started/
module.exports = {
  root: true,
  plugins: ["@typescript-eslint", "sonarjs"],
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:sonarjs/recommended",
    "prettier",
  ],
  env: { es2021: true, node: true },
  // stuff to consider caring about
  // parserOptions: {
  // project: ["./tsconfig.json"],
  // ecmaVersion: "latest",
  // sourceType: "module",
  // },
  rules: {},
};
