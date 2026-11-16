/** @type {import('stylelint').Config} */
export default {
  extends: ["stylelint-config-standard-scss"],
  customSyntax: "postcss-scss",
  rules: {
    "selector-class-pattern": [
      "^[a-z][a-zA-Z0-9]*(__[a-z][a-zA-Z0-9]*)?(--[a-z][a-zA-Z0-9]*)?$",
      {
        message:
          "Expected class selector to follow BEM with camelCase identifiers (block, block__element, block--modifier).",
      },
    ],
    "no-descending-specificity": null,
    "declaration-no-important": true,
    "max-nesting-depth": 3,
    "selector-max-compound-selectors": 4,
    "selector-max-id": 0,
    "selector-max-universal": 1,
    "scss/at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          "use",
          "forward",
          "include",
          "mixin",
          "function",
          "if",
          "else",
          "each",
          "for",
          "while",
          "return",
        ],
      },
    ],
    "scss/no-global-function-names": null,
    "scss/dollar-variable-pattern": "^[a-z][a-zA-Z0-9]*$",
    "custom-property-pattern": "^[a-z][a-z0-9-]*$",
  },
};
