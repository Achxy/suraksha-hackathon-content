import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { validatePartConfig } from "./validate-part-config.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const PARTS_DIR = join(ROOT, "parts");

/**
 * @returns {{ schemaVersion: number, parts: object[] }}
 */
function discoverParts() {
  if (!existsSync(PARTS_DIR)) {
    return { schemaVersion: 1, parts: [] };
  }

  const entries = readdirSync(PARTS_DIR);
  const configs = [];

  for (const entry of entries) {
    const configPath = join(PARTS_DIR, entry, "part.config.json");
    if (existsSync(configPath)) {
      const result = validatePartConfig(configPath);
      if (!result.valid) {
        console.error(`Validation failed for ${entry}:`);
        for (const err of result.errors) {
          console.error(`  - ${err}`);
        }
        process.exit(1);
      }
      configs.push({ dir: entry, config: result.config });
    }
  }

  const ids = new Set();
  const routeStrings = new Set();
  const prefixTries = [];

  for (const { dir, config } of configs) {
    if (ids.has(config.id)) {
      console.error(`Duplicate id: ${config.id}`);
      process.exit(1);
    }
    ids.add(config.id);

    const routeStr = config.routeParts.join("/");
    if (routeStrings.has(routeStr)) {
      console.error(`Duplicate routeParts: ${routeStr}`);
      process.exit(1);
    }
    routeStrings.add(routeStr);

    prefixTries.push({ id: config.id, routeParts: config.routeParts });
  }

  for (let i = 0; i < prefixTries.length; i++) {
    for (let j = 0; j < prefixTries.length; j++) {
      if (i === j) continue;
      const a = prefixTries[i].routeParts;
      const b = prefixTries[j].routeParts;
      const minLen = Math.min(a.length, b.length);
      const prefixA = a.slice(0, minLen);
      const prefixB = b.slice(0, minLen);
      if (prefixA.join("/") === prefixB.join("/")) {
        console.error(
          `Prefix collision between "${prefixTries[i].id}" and "${prefixTries[j].id}"`
        );
        process.exit(1);
      }
    }
  }

  return {
    schemaVersion: 1,
    parts: configs.map(({ config }) => ({
      id: config.id,
      title: config.title,
      routeParts: config.routeParts,
      sourceDir: config.sourceDir,
    })),
  };
}

const result = discoverParts();
console.log(JSON.stringify(result, null, 2));
