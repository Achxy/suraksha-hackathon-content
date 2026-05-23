import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = join(ROOT, "dist-package");

function uploadDir(bucket, prefix, dirPath) {
  const entries = readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const key = `${prefix}/${entry}`;
    if (statSync(fullPath).isDirectory()) {
      uploadDir(bucket, key, fullPath);
    } else {
      const cmd = `wrangler r2 object put "${bucket}/${key}" --file="${fullPath}" --ct "$(file -b --mime-type "${fullPath}" 2>/dev/null || echo 'application/octet-stream')"`;
      try {
        execSync(cmd, { cwd: ROOT, stdio: "pipe", encoding: "utf-8" });
        process.stdout.write(".");
      } catch {
        console.error(`\n  Failed: ${key}`);
      }
    }
  }
}

function deployToR2() {
  if (!existsSync(DIST)) {
    console.error("dist-package not found. Run npm run build-package first.");
    process.exit(1);
  }

  const manifestPath = join(DIST, "deploy-manifest.json");
  if (!existsSync(manifestPath)) {
    console.error("deploy-manifest.json not found");
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

  for (const route of manifest.routes) {
    const sourcePath = join(DIST, route.sourcePath);
    const destPrefix = route.parts.join("/");

    console.log(`\nDeploying ${route.id} → r2://just-cdn/${destPrefix}/`);

    if (!existsSync(sourcePath)) {
      console.error(`  Source not found: ${sourcePath}`);
      continue;
    }

    uploadDir("just-cdn", destPrefix, sourcePath);
    console.log(` done`);
  }

  console.log("\nR2 deployment complete");
}

deployToR2();
