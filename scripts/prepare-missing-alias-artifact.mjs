import fs from "node:fs";
import path from "node:path";
import { findServerAliases } from "./alias-utils.mjs";

const root = process.cwd();
const outRoot = path.join(root, ".matrix-results", "missing-alias-artifact", "workspace");
const aliases = findServerAliases(root);

if (aliases.length === 0) {
  throw new Error("No hashed server external aliases found. Run a Turbopack build first.");
}

fs.rmSync(outRoot, { recursive: true, force: true });
fs.mkdirSync(outRoot, { recursive: true });

for (const entry of [".next", ".vercel/output", "package.json", "pnpm-lock.yaml", "scripts"]) {
  const source = path.join(root, entry);
  const destination = path.join(outRoot, entry);
  if (!fs.existsSync(source)) continue;
  fs.cpSync(source, destination, {
    recursive: true,
    dereference: false,
    filter: (file) => !file.includes(`${path.sep}.next${path.sep}cache${path.sep}`),
  });
}

for (const { alias } of aliases) {
  fs.rmSync(path.join(outRoot, ".next", "node_modules", alias), {
    recursive: true,
    force: true,
  });
}

console.log(`Prepared ${path.relative(root, outRoot)}`);
console.log("Removed aliases:");
for (const { alias } of aliases) {
  console.log(`  - ${alias}`);
}
