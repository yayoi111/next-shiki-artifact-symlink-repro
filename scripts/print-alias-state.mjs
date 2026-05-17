import { findServerAliases, inspectAlias } from "./alias-utils.mjs";

const aliases = findServerAliases(process.cwd());

if (aliases.length === 0) {
  console.log("No hashed server external aliases found.");
}

for (const { alias } of aliases) {
  const state = inspectAlias(process.cwd(), alias);
  const target = state.target ? ` -> ${state.target}` : "";
  console.log(
    `${state.alias}: ${state.type}${target}; exists=${state.exists}; targetExists=${state.targetExists}; requireResolved=${Boolean(state.requireResolved)}`,
  );
}
