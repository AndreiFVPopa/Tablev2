declare module "eslint-plugin-jsx-a11y" {
  import type { ESLint, Linter } from "eslint";
  interface JsxA11yPlugin extends ESLint.Plugin {
    flatConfigs: {
      recommended: Linter.Config;
      strict: Linter.Config;
    };
  }
  const plugin: JsxA11yPlugin;
  export default plugin;
}
declare module "eslint-plugin-react" {
  import type { ESLint, Linter } from "eslint";
  interface ReactPlugin extends ESLint.Plugin {
    configs: {
      flat: {
        recommended: Linter.Config;
        all: Linter.Config;
        "jsx-runtime": Linter.Config;
      };
    };
  }
  const plugin: ReactPlugin;
  export default plugin;
}
declare module "eslint-plugin-sonarjs" {
  import type { ESLint } from "eslint";
  const plugin: ESLint.Plugin & {
    configs: {
      recommended: {
        rules: Record<string, unknown>;
      };
    };
  };
  export default plugin;
}
