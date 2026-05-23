import { existsSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRISM_DIR = resolve(ROOT, ".prism");

const tarballPath = resolve(
  ROOT,
  "node_modules",
  "@prism",
  "storybook",
  "storybook-pkg.tgz"
);

if (!existsSync(tarballPath)) {
  process.exit(0);
}

if (existsSync(PRISM_DIR)) {
  rmSync(PRISM_DIR, { recursive: true, force: true });
}
mkdirSync(PRISM_DIR, { recursive: true });
execSync(`tar xzf "${tarballPath}" -C "${PRISM_DIR}"`, { stdio: "pipe" });

const pkgJsonPath = resolve(PRISM_DIR, "package.json");
if (!existsSync(pkgJsonPath)) {
  process.exit(1);
}

const replacements = [
  { dir: resolve(ROOT, "node_modules", "storybook"), name: "storybook" },
  { dir: resolve(ROOT, "node_modules", "@storybook", "core"), name: "@storybook/core" },
  { dir: resolve(ROOT, "node_modules", "@storybook", "manager-api"), name: "@storybook/manager-api" },
  { dir: resolve(ROOT, "node_modules", "@storybook", "preview-api"), name: "@storybook/preview-api" },
];

for (const { dir } of replacements) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
  symlinkSync(PRISM_DIR, dir, "junction");
}

const binDir = resolve(ROOT, "node_modules", ".bin");
const prismPkg = JSON.parse(
  execSync(`cat "${pkgJsonPath}"`, { encoding: "utf-8" })
);
if (prismPkg.bin) {
  const binEntries = typeof prismPkg.bin === "string"
    ? { storybook: prismPkg.bin }
    : prismPkg.bin;
  for (const [name, relPath] of Object.entries(binEntries)) {
    const binLink = resolve(binDir, name);
    const binTarget = resolve(PRISM_DIR, relPath);
    rmSync(binLink, { force: true });
    symlinkSync(binTarget, binLink);
  }
}

const files = execSync(`find "${PRISM_DIR}" -type f | wc -l`, { encoding: "utf-8" }).trim();
