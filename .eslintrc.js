module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    webextensions: true,
  },
  extends: [
    "airbnb",
    "eslint:recommended",
    "prettier",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json"],
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      ecmaVersion: 2020,
      modules: true,
      jsx: true,
    },
  },
  plugins: ["import", "react", "@typescript-eslint"],
  rules: {
    "no-undef": "warn",
    "react/prop-types": "off",
    "react/jsx-filename-extension": [1, { extensions: [".jsx", ".tsx"] }],
    "import/extensions": "off",
  },
  settings: {
    react: {
      version: "detect", // Tells eslint-plugin-react to automatically detect the version of React to use
    },
    typescript: {},
    "import/parsers": { "@typescript-eslint/parser": [".ts", ".tsx"] },
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
  ignorePatterns: [".eslintrc.js"],
};
