import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

const RESERVED_NAMES = new Set([
  "api", "admin", "assets", "static", "_next",
  ".git", "robots.txt", "favicon.ico",
]);

const ID_PATTERN = /^[a-zA-Z0-9._-]+$/;
const PART_PATTERN = /^[a-zA-Z0-9._-]+$/;

/**
 * @param {string} configPath - Absolute path to part.config.json
 * @returns {{ valid: true, config: object } | { valid: false, errors: string[] }}
 */
export function validatePartConfig(configPath) {
  const errors = [];

  if (!existsSync(configPath)) {
    return { valid: false, errors: [`Config not found: ${configPath}`] };
  }

  let config;
  try {
    const raw = readFileSync(configPath, "utf-8");
    config = JSON.parse(raw);
  } catch (err) {
    return { valid: false, errors: [`Invalid JSON: ${err.message}`] };
  }

  if (config.schemaVersion !== 1) {
    errors.push(`schemaVersion must be 1, got ${config.schemaVersion}`);
  }

  if (typeof config.id !== "string" || !ID_PATTERN.test(config.id)) {
    errors.push(`id must match /^[a-zA-Z0-9._-]+$/, got "${config.id}"`);
  }

  if (typeof config.title !== "string" || config.title.trim().length === 0) {
    errors.push("title must be a non-empty string");
  }

  if (!Array.isArray(config.routeParts)) {
    errors.push("routeParts must be an array");
  } else {
    if (config.routeParts.length < 3) {
      errors.push(`routeParts length must be >= 3, got ${config.routeParts.length}`);
    }

    if (config.routeParts[0] !== "hackathons") {
      errors.push(`routeParts[0] must be "hackathons", got "${config.routeParts[0]}"`);
    }

    for (let i = 0; i < config.routeParts.length; i++) {
      const part = config.routeParts[i];
      if (typeof part !== "string" || part === "" || part === "." || part === "..") {
        errors.push(`routeParts[${i}] is invalid: "${part}"`);
      } else if (!PART_PATTERN.test(part)) {
        errors.push(`routeParts[${i}] must match /^[a-zA-Z0-9._-]+$/, got "${part}"`);
      } else if (part.includes("/")) {
        errors.push(`routeParts[${i}] contains slash: "${part}"`);
      } else if (RESERVED_NAMES.has(part) && i === config.routeParts.length - 1) {
        errors.push(`routeParts[${i}] uses reserved name: "${part}"`);
      }
    }
  }

  if (typeof config.sourceDir !== "string" || config.sourceDir.trim().length === 0) {
    errors.push("sourceDir must be a non-empty string");
  } else {
    const sourceDir = resolve(ROOT, config.sourceDir);
    if (!existsSync(sourceDir)) {
      errors.push(`sourceDir does not exist: ${sourceDir}`);
    } else {
      const files = readdirSync(sourceDir, { recursive: true });
      const hasContent = files.some(
        (f) => typeof f === "string" && (f.endsWith(".mdx") || f.endsWith(".stories.tsx") || f.endsWith(".stories.jsx") || f.endsWith(".stories.ts") || f.endsWith(".stories.js") || f.endsWith(".stories.mjs"))
      );
      if (!hasContent) {
        errors.push(`sourceDir must contain at least one .mdx or .stories.* file`);
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, config };
}
