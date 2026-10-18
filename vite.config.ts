import { defineConfig } from "vite-plus";

import { fmt } from "@qntx/oxfmt";
import { merge, react } from "@qntx/oxlint";

export default defineConfig({
  defaultPackage: {
    dev: "./apps/web",
    build: "./apps/web",
    preview: "./apps/web",
  }, 
  staged: {
    "*": "vp check --fix",
  },
  lint: merge(react, {
    ignorePatterns: [...(react.ignorePatterns ?? []), "**/.nx/**"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
  }),
  fmt: {
    ...fmt,
    ignorePatterns: [...fmt.ignorePatterns, "**/.nx/**"],
  },
  run: {
    cache: true,
  },
});
