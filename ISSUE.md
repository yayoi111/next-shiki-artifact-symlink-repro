### Link to the code that reproduces this issue

https://github.com/yayoi111/next-shiki-artifact-symlink-repro

### To Reproduce

1. Clone the reproduction repository.
2. Install dependencies with pnpm 9.12.1 on Node 22.
3. Run `pnpm build`.
4. Run `pnpm inspect:build-output` to inspect the hashed server external aliases emitted by Turbopack.
5. Link the same repo to a Vercel project and run:

   ```sh
   pnpm dlx vercel@latest build --yes
   pnpm inspect:build-output
   pnpm dlx vercel@latest deploy --prebuilt --archive=tgz --yes
   ```

6. Visit the deployed app and inspect the Vercel runtime logs.

### Current vs. Expected behavior

#### Current behavior

In a real Vercel prebuilt deployment using Next.js 16.2.6, pnpm, and Turbopack,
the runtime failed while loading the instrumentation hook:

```text
Error: An error occurred while loading the instrumentation hook
[cause]: Error: Failed to load external module require-in-the-middle-<hash>:
Error: Cannot find module 'require-in-the-middle-<hash>'
Require stack:
- /var/task/.next/server/chunks/[root-of-the-server]__....js
- /var/task/.next/server/chunks/[turbopack]_runtime.js
- /var/task/.next/server/instrumentation.js
- /var/task/node_modules/.pnpm/next@16.2.6_.../node_modules/next/dist/server/lib/router-utils/instrumentation-globals.external.js
- /var/task/node_modules/.pnpm/next@16.2.6_.../node_modules/next/dist/compiled/next-server/server.runtime.prod.js
- /var/task/___next_launcher.cjs
```

The same mechanism is not specific to Sentry or `require-in-the-middle`. The
build output also contains Turbopack hashed aliases for packages such as
`shiki-<hash>`.

Locally, immediately after the build, these aliases are emitted under
`.next/node_modules` as symlinks to pnpm-managed package paths:

```text
.next/node_modules/require-in-the-middle-<hash>
  -> ../../node_modules/.pnpm/require-in-the-middle@8.0.1/node_modules/require-in-the-middle

.next/node_modules/shiki-<hash>
  -> ../../node_modules/.pnpm/shiki@3.23.0/node_modules/shiki
```

The local build output can be internally consistent: server chunks reference the
hashed alias, the alias exists under `.next/node_modules`, and Node.js can
resolve it locally. The failure appears when the prebuilt output is deployed and
the final Vercel serverless runtime artifact no longer has a resolvable alias.

#### Expected behavior

A successful Vercel prebuilt deployment produced from a successful Next.js
Turbopack build should be self-contained at runtime.

If the server output requires `shiki-<hash>` or
`require-in-the-middle-<hash>`, the final serverless runtime artifact should
contain a resolvable module at that alias, including the symlink target or an
equivalent copied directory.

Alternatively, the build or deploy step should fail before deployment if a
traced hashed external alias cannot be made resolvable in the final runtime
artifact.

### Provide environment information

```text
Operating System:
  Platform: linux
  Arch: x64
Binaries:
  Node: 22.x
  pnpm: 9.12.1
Relevant Packages:
  next: 16.2.6
  react: 19.2.4
  react-dom: 19.2.4
  @sentry/nextjs: 10.52.0
  shiki: 3.23.0
  @streamdown/code: 1.1.1
Deployment:
  Vercel prebuilt deployment
  vercel deploy --prebuilt --archive=tgz
Bundler:
  Turbopack via default next build
Package manager:
  pnpm
```

### Which area(s) are affected? (Select all that apply)

Turbopack

### Which stage(s) are affected? (Select all that apply)

Vercel (Deployed)

### Additional context

This looks related to #86099 because it also happens with Next.js 16 +
Turbopack on Vercel deployed output, and switching back to webpack avoids the
runtime failure.

The specific mechanism seems related to #86375: Turbopack writes hashed aliases
under `.next/node_modules`, e.g. `.next/node_modules/<package>-<hash>` as
symlinks to pnpm-managed package paths. In the failing Vercel runtime, the
server output tries to load `require-in-the-middle-<hash>` or `shiki-<hash>`,
but the alias is not resolvable in the final prebuilt deployment artifact.

The error shape is also similar to #86866 (`Failed to load external module
<package>-<hash>`), although this report is about Vercel deployed/prebuilt
output rather than Bun dev mode.

Building with webpack avoids the issue in the affected app:

```json
{
  "scripts": {
    "build": "next build --webpack"
  }
}
```
