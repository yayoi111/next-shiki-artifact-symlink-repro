# Next.js Turbopack hashed external alias repro

Minimal reproduction for inspecting hashed server external aliases emitted by
Next.js 16 Turbopack with pnpm.

This repository intentionally contains no `.vercel/project.json`. If you deploy
it to Vercel, link it to your own project.

## Why this repo exists

In a real Vercel prebuilt deployment using Next.js 16.2.6, pnpm, and Turbopack,
the runtime failed with:

```text
Failed to load external module require-in-the-middle-<hash>:
Error: Cannot find module 'require-in-the-middle-<hash>'
Require stack:
- /var/task/.next/server/chunks/[root-of-the-server]__....js
- /var/task/.next/server/chunks/[turbopack]_runtime.js
- /var/task/.next/server/instrumentation.js
```

The same build shape can also contain aliases such as:

```text
.next/node_modules/shiki-<hash>
.next/node_modules/require-in-the-middle-<hash>
```

These aliases are symlinks to pnpm-managed package paths.

## Local inspection

```sh
corepack enable
pnpm install
pnpm build
pnpm inspect:build-output
```

The inspection script reports:

- server chunks that reference hashed aliases
- whether `.next/node_modules/<alias>` exists
- whether it is a symlink
- whether the symlink target exists
- whether Node.js can resolve the alias locally

## Vercel prebuilt deployment shape

To inspect a Vercel build output, link the project to your own Vercel project and
run:

```sh
pnpm dlx vercel@latest build --yes
pnpm inspect:build-output
pnpm dlx vercel@latest deploy --prebuilt --archive=tgz --yes
```

The expected behavior is that a successful prebuilt deployment is self-contained
at runtime. If server output requires `shiki-<hash>` or
`require-in-the-middle-<hash>`, the final serverless runtime artifact must
contain a resolvable module for that alias.

## Workaround

Webpack avoids the Turbopack hashed alias path in the affected app:

```sh
pnpm build:webpack
```
