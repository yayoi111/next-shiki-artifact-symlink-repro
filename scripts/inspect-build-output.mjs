import { findServerAliases, findVcConfigReferences, inspectAlias } from "./alias-utils.mjs";

const root = process.cwd();
const aliases = findServerAliases(root);
const warnings = [];

console.log(`server external alias count: ${aliases.length}`);

for (const { alias, references } of aliases) {
  const state = inspectAlias(root, alias);
  const vcConfig = findVcConfigReferences(root, alias);

  console.log("");
  console.log(`alias: ${alias}`);
  console.log(`  server references: ${references.length}`);
  for (const reference of references.slice(0, 6)) {
    console.log(`    - ${reference}`);
  }
  if (references.length > 6) {
    console.log(`    - ... ${references.length - 6} more`);
  }

  if (!state.exists) {
    console.log("  .next/node_modules: missing");
    warnings.push(`${alias} is referenced by server output but missing locally`);
  } else if (state.type === "symlink") {
    console.log(`  .next/node_modules: symlink -> ${state.target}`);
    console.log(`  symlink target exists: ${state.targetExists}`);
    if (!state.targetExists) warnings.push(`${alias} symlink target is missing`);
  } else {
    console.log(`  .next/node_modules: ${state.type}`);
  }

  if (state.requireResolved) {
    console.log(`  require.resolve: ${state.requireResolved}`);
  } else if (state.requireError) {
    console.log(`  require.resolve error: ${state.requireError}`);
    warnings.push(`${alias} cannot be resolved by Node.js`);
  }

  console.log(`  .vc-config filePathMap present: ${vcConfig.hits.length}`);
  console.log(`  .vc-config required path missing: ${vcConfig.missing.length}`);
  for (const missing of vcConfig.missing.slice(0, 6)) {
    console.log(`    - ${missing}`);
  }
}

console.log("");
console.log(`warnings: ${warnings.length}`);
for (const warning of warnings) {
  console.log(`  - ${warning}`);
}

if (warnings.length > 0) {
  process.exitCode = 1;
}
