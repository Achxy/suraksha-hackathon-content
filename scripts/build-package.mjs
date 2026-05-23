import { existsSync, readFileSync, mkdirSync, writeFileSync, rmSync, cpSync } from "node:fs";
import { join, resolve } from "node:path";
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

    if (!existsSync(indexPath)) {
      console.error(`Missing: ${indexPath}`);
      process.exit(1);
    }
    if (!existsSync(iframePath)) {
      console.error(`Missing: ${iframePath}`);
      process.exit(1);
    }

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
