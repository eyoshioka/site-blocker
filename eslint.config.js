import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

// 関数やファイルが責任を抱え込みすぎていないかの目安。
// 行数は Prettier の整形で増えるため、行数ではなく文の数と分岐で測る。
const MAX_COMPLEXITY = 10;
const MAX_STATEMENTS = 15;
const MAX_DEPTH = 3;
const MAX_PARAMS = 3;
const MAX_FILE_LINES = 300;

export default tseslint.config(
  { ignores: ["dist/**/*.js", "node_modules/"] },

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    rules: {
      // 単一責任の目安
      complexity: ["error", MAX_COMPLEXITY],
      "max-statements": ["error", MAX_STATEMENTS],
      "max-depth": ["error", MAX_DEPTH],
      "max-params": ["error", MAX_PARAMS],
      "max-lines": [
        "error",
        { max: MAX_FILE_LINES, skipBlankLines: true, skipComments: true },
      ],

      // 書き方の統一とバグの予防
      eqeqeq: "error",
      curly: ["error", "all"],
      "no-console": "error",
      "no-param-reassign": "error",
      "prefer-const": "error",
      "prefer-template": "error",
      "object-shorthand": "error",
      "no-nested-ternary": "error",

      // 型
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/no-magic-numbers": [
        "error",
        {
          ignore: [0, 1],
          ignoreEnums: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ],
    },
  },

  // 設定ファイルは型情報なしで検査する
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  eslintConfigPrettier
);
