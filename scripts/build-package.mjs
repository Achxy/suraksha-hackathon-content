import { existsSync, readFileSync, mkdirSync, writeFileSync, rmSync, cpSync, readdirSync, statSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { execSync } from "node:child_process";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = join(ROOT, "dist-package");

/**
 * @returns {{ parts: Array<{ id: string, title: string, routeParts: string[], sourceDir: string }> }}
 */
function discoverParts() {
  const raw = execSync("node scripts/discover-parts.mjs", {
    cwd: ROOT,
    encoding: "utf-8",
  });
  return JSON.parse(raw);
}

function assertStorybookBuild(dir) {
  const files = [];
  function walk(d) {
    const entries = readdirSync(d, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(d, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(`Symlink rejected in build output: ${full}`);
      }
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        files.push(full);
      }
    }
  }
  walk(dir);

  const rel = files.map((f) => relative(dir, f));

  if (!rel.includes("index.html")) {
    throw new Error(`Missing index.html in ${dir}`);
  }

  if (rel.length < 5) {
    throw new Error(
      `Invalid Storybook build: expected full static directory, got only ${rel.length} files in ${dir}`
    );
  }

  const hasJs = rel.some((f) => f.endsWith(".js"));
  const hasIframe = rel.includes("iframe.html");
  const hasStorybookMeta = rel.some(
    (f) =>
      f === "index.json" ||
      f === "project.json" ||
      f.startsWith("sb-preview/") ||
      f.startsWith("sb-manager/") ||
      f.startsWith("assets/")
  );

  if (!hasJs) {
    throw new Error(`Invalid Storybook build: no JS assets in ${dir}`);
  }

  if (!hasIframe && !hasStorybookMeta) {
    throw new Error(
      `Invalid Storybook build: does not look like a full Storybook static export in ${dir}`
    );
  }

  console.log(`  Validated: ${rel.length} files, ${hasIframe ? "has iframe, " : ""}${hasJs ? "has JS, " : ""}has metadata`);
}

function buildPackage() {
  const manifest = discoverParts();
  const routes = [];

  if (existsSync(DIST)) {
    rmSync(DIST, { recursive: true, force: true });
  }

  for (const part of manifest.parts) {
    const storybookDir = join(DIST, "storybooks", part.id);
    mkdirSync(storybookDir, { recursive: true });

    console.log(`\nBuilding Storybook for ${part.id}...`);

    execSync(
      `STORYBOOK_PART_DIR=${part.sourceDir} npm run build-storybook -- --output-dir ${storybookDir} --quiet`,
      { cwd: ROOT, stdio: "inherit", encoding: "utf-8" }
    );

    const indexPath = join(storybookDir, "index.html");
    const iframePath = join(storybookDir, "iframe.html");

    assertStorybookBuild(storybookDir);

    const indexContent = readFileSync(indexPath, "utf-8");
    const iframeContent = readFileSync(iframePath, "utf-8");

    if (!indexContent.includes("noindex")) {
      console.warn(`Warning: ${indexPath} missing noindex meta`);
    }
    if (!iframeContent.includes("noindex")) {
      console.warn(`Warning: ${iframePath} missing noindex meta`);
    }

    routes.push({
      id: part.id,
      title: part.title,
      parts: part.routeParts,
      sourcePath: `storybooks/${part.id}`,
    });
  }

  const deployManifest = {
    schemaVersion: 1,
    sourceRepo: process.env.GITHUB_REPOSITORY || null,
    sourceSha: process.env.GITHUB_SHA || null,
    routes,
  };

  writeFileSync(
    join(DIST, "deploy-manifest.json"),
    JSON.stringify(deployManifest, null, 2),
    "utf-8"
  );

  console.log(`\nPackage built at ${DIST}`);
  console.log(`Routes: ${routes.length}`);
  for (const r of routes) {
    console.log(`  ${r.id} -> /${r.parts.join("/")}/`);
  }
}

buildPackage();
