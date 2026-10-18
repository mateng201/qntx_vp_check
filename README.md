# qntx-vp-demo

This is a minimal qntx-style tooling demo. It intentionally keeps the business code tiny and focuses on the reusable configuration surface.

## Goal

- Bun manages dependencies and workspace scripts.
- Vite+ exposes the main local workflow through `vp`.
- `vp check` runs format, lint, and type checking through the Vite+ configuration.
- Nx is installed and configured as the outer project graph layer for web/mobile/shared boundaries.
- `@qntx/oxlint`, `@qntx/oxfmt`, and `@qntx/tsconfig` are reused instead of creating parallel lint, format, or TypeScript configs.

## Build Process

This is the order used to create the demo.

### 1. Create the workspace

The demo root was created outside `qntx-source`:

```bash
mkdir E:\bigshoot\qntx-vp-demo
cd E:\bigshoot\qntx-vp-demo
```

The root `package.json` was then written as a Bun workspace:

```json
{
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "type": "module",
  "packageManager": "bun@1.4.2"
}
```

This means `apps/web`, `apps/mobile-shell`, and `packages/hello` are treated as packages in one workspace.

### 2. Install the tooling layer

The root package installs the tools and qntx reusable configs:

```bash
bun add -D vite-plus vite@npm:@voidzero-dev/vite-plus-core@0.3.1 typescript nx @qntx/oxlint @qntx/oxfmt @qntx/tsconfig
```

The important point is that the demo depends on qntx config packages:

```json
{
  "devDependencies": {
    "@qntx/oxfmt": "^1.0.2",
    "@qntx/oxlint": "^1.0.2",
    "@qntx/tsconfig": "^1.0.1"
  }
}
```

It does not add a separate ESLint, Prettier, or custom TypeScript config stack.

### 3. Add root scripts

The root scripts make Vite+ the daily entry point and Nx the project graph entry point:

```json
{
  "scripts": {
    "dev": "vp dev",
    "build": "vp build",
    "check": "vp check",
    "test": "vp test --run",
    "nx:projects": "nx show projects",
    "nx:graph": "nx graph"
  }
}
```

Use `vp` when checking, developing, or building the Vite+ TypeScript app. Use `nx` when looking at or orchestrating multiple projects.

### 4. Configure Vite+

The root `vite.config.ts` composes qntx configs:

```ts
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
```

The `.nx` ignore rule exists because Nx creates cache/workspace metadata, and those generated files should not be formatted as source code by `vp check`.

### 5. Configure TypeScript presets

The root config uses the qntx Bun preset:

```json
{
  "extends": "@qntx/tsconfig/configs/bun.json",
  "include": ["apps/**/*.ts", "apps/**/*.tsx", "packages/**/*.ts", "vite.config.ts"]
}
```

The Web app uses the qntx Vite React preset:

```json
{
  "extends": "@qntx/tsconfig/configs/vite-react.json",
  "include": ["src", "vite.config.ts"]
}
```

The shared package and the mobile placeholder use the qntx Bun preset:

```json
{
  "extends": "@qntx/tsconfig/configs/bun.json",
  "include": ["src"]
}
```

### 6. Add Nx project graph files

`nx.json` defines shared inputs and cache defaults:

```json
{
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "sharedGlobals": ["{workspaceRoot}/package.json", "{workspaceRoot}/vite.config.ts"]
  },
  "targetDefaults": {
    "build": {
      "cache": true,
      "inputs": ["default"]
    },
    "check": {
      "cache": true,
      "inputs": ["default"]
    }
  }
}
```

Each package also has a `project.json`:

- `apps/web`: `type:app`, `platform:web`
- `apps/mobile-shell`: `type:app`, `platform:mobile`
- `packages/hello`: `type:lib`, `platform:shared`

This is not a full React Native app. It is only a small boundary marker showing how Nx can see web, mobile, and shared projects in one workspace.

### 7. Write the shared package first

The shared package is named `@demo/hello`:

```json
{
  "name": "@demo/hello",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts"
    }
  }
}
```

Its code is intentionally tiny:

```ts
export const message = "Hello from a qntx-style Vite+ TypeScript monorepo.";
```

Writing the shared package first makes the package-level import clear.

### 8. Write the Web app second

The Web app declares the local workspace dependency:

```json
{
  "dependencies": {
    "@demo/hello": "workspace:*"
  }
}
```

Then `App.tsx` imports it by package name:

```tsx
import { message } from "@demo/hello";
import type { ReactElement } from "react";

export default function App(): ReactElement {
  return (
    <main>
      <h1>{message}</h1>
      <p>Vite+ checks this React app through qntx lint, format, and tsconfig presets.</p>
    </main>
  );
}
```

This proves the package-level connection:

```text
apps/web -> @demo/hello -> packages/hello
```

### 9. Run checks in order

First install dependencies:

```bash
bun install
```

Then run the Vite+ check:

```bash
bun run check
```

During creation, `vp check` exposed several qntx-style corrections:

- Use top-level `import type` instead of inline type imports.
- Prefer `document.querySelector("#root")` over `document.getElementById("root")`.
- Add explicit return types to exported React components.
- Avoid unsafe type assertions in Vite config.
- Avoid old `baseUrl` / `paths` patterns when package-level workspace imports already work.
- Ignore `.nx` generated files in Vite+ format/lint config.

After fixing those, `vp check` passed.

Then verify Nx can see the projects:

```bash
bun run nx:projects
```

Expected result:

```text
["mobile-shell","hello","web"]
```

Then verify the Web app builds through Vite+:

```bash
bun run build
```

Finally verify Nx can orchestrate project checks:

```bash
bunx nx run-many -t check
```

Expected result:

```text
NX   3 tasks: 3 succeeded
```

## Commands

```bash
bun install
bun run check
bun run nx:projects
bun run build
bunx nx run-many -t check
```

## Reused qntx configuration

Root `vite.config.ts` composes:

```ts
import { fmt } from "@qntx/oxfmt";
import { merge, react } from "@qntx/oxlint";
import { defineConfig } from "vite-plus";
```

The Web app uses:

```json
{
  "extends": "@qntx/tsconfig/configs/vite-react.json"
}
```

The shared TS package uses:

```json
{
  "extends": "@qntx/tsconfig/configs/bun.json"
}
```

Nx project tags show the intended boundary:

- `apps/web`: `platform:web`
- `apps/mobile-shell`: `platform:mobile`
- `packages/hello`: `platform:shared`

The current demo proves the Vite+ TypeScript monorepo path by making `apps/web` import `@demo/hello`.
