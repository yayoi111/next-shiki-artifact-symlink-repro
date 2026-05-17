import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const aliasPattern = /["']((?:@[\w.-]+\/)?[\w.-]+-[a-f0-9]{12,})["']/g;

export function walkFiles(root, predicate, files = []) {
  if (!fs.existsSync(root)) return files;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, predicate, files);
      continue;
    }
    if (entry.isFile() && predicate(fullPath)) files.push(fullPath);
  }
  return files;
}

export function findServerAliases(root = process.cwd()) {
  const serverDir = path.join(root, ".next", "server");
  const files = walkFiles(serverDir, (file) => file.endsWith(".js"));
  const aliases = new Map();

  for (const file of files) {
    const relativeFile = path.relative(root, file);
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(aliasPattern)) {
      const alias = match[1];
      if (!aliases.has(alias)) aliases.set(alias, new Set());
      aliases.get(alias).add(relativeFile);
    }
  }

  return [...aliases]
    .map(([alias, references]) => ({
      alias,
      references: [...references].sort(),
    }))
    .sort((a, b) => a.alias.localeCompare(b.alias));
}

export function inspectAlias(root, alias) {
  const aliasPath = path.join(root, ".next", "node_modules", alias);
  const relativeAliasPath = path.relative(root, aliasPath);
  const result = {
    alias,
    aliasPath: relativeAliasPath,
    exists: false,
    type: "missing",
    target: null,
    targetExists: false,
    requireResolved: null,
    requireError: null,
  };

  try {
    const stat = fs.lstatSync(aliasPath);
    result.exists = true;

    if (stat.isSymbolicLink()) {
      result.type = "symlink";
      result.target = fs.readlinkSync(aliasPath);
      result.targetExists = fs.existsSync(path.resolve(path.dirname(aliasPath), result.target));
    } else if (stat.isDirectory()) {
      result.type = "directory";
      result.targetExists = true;
    } else {
      result.type = "file";
      result.targetExists = true;
    }
  } catch {
    return result;
  }

  try {
    result.requireResolved = path.relative(root, require.resolve(alias, {
      paths: [path.join(root, ".next", "server")],
    }));
  } catch (error) {
    result.requireError = error instanceof Error ? error.message : String(error);
  }

  return result;
}

export function findVcConfigReferences(root, alias) {
  const functionsDir = path.join(root, ".vercel", "output", "functions");
  const configs = walkFiles(functionsDir, (file) => file.endsWith(".vc-config.json"));
  const hits = [];
  const missing = [];

  for (const configPath of configs) {
    const relativeConfigPath = path.relative(root, configPath);
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const filePathMap = parsed.filePathMap ?? {};
    const entries = Object.entries(filePathMap).filter(([key, value]) => {
      const serialized = JSON.stringify([key, value]);
      return serialized.includes(`.next/node_modules/${alias}`);
    });

    if (entries.length === 0) continue;

    hits.push(relativeConfigPath);

    for (const [, value] of entries) {
      const mappedPath = Array.isArray(value) ? value[0] : value;
      if (typeof mappedPath === "string" && !fs.existsSync(path.join(root, mappedPath))) {
        missing.push(`${relativeConfigPath}: ${mappedPath}`);
      }
    }
  }

  return { hits, missing };
}
