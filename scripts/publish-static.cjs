#!/usr/bin/env node
/**
 * Build a static partner demo and deploy via Netlify Drop (no token required).
 * Booking works client-side when /api/book is unavailable.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const apiSrc = path.join(root, "app/api");
const apiPark = path.join(root, ".parked-api");

function run(cmd, env = {}) {
  console.log("$", cmd);
  execSync(cmd, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
}

function parkApi() {
  if (fs.existsSync(apiSrc)) {
    if (fs.existsSync(apiPark)) fs.rmSync(apiPark, { recursive: true, force: true });
    fs.renameSync(apiSrc, apiPark);
  }
}

function restoreApi() {
  if (fs.existsSync(apiPark)) {
    if (fs.existsSync(apiSrc)) fs.rmSync(apiSrc, { recursive: true, force: true });
    fs.renameSync(apiPark, apiSrc);
  }
}

process.on("exit", restoreApi);
process.on("SIGINT", () => {
  restoreApi();
  process.exit(1);
});

try {
  parkApi();
  run("npm run build", { MPE_STATIC_EXPORT: "1" });
  const outDir = path.join(root, "out");
  if (!fs.existsSync(outDir)) throw new Error("Missing out/ after static build");

  // Zip out/
  run("rm -f /tmp/mpe-static.zip && cd out && zip -r /tmp/mpe-static.zip .");

  // Netlify Drop-style create site from zip (anonymous)
  const result = execSync(
    'curl -sS -H "Content-Type: application/zip" --data-binary @/tmp/mpe-static.zip https://api.netlify.com/api/v1/sites',
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
  );
  fs.writeFileSync("/tmp/mpe-netlify-response.json", result);
  console.log(result);
  const json = JSON.parse(result);
  const url = json.ssl_url || json.url || json.deploy_url;
  if (!url) throw new Error("Netlify response missing url: " + result.slice(0, 500));
  console.log("\nNETLIFY_PUBLIC_URL=" + url);
  fs.writeFileSync(
    path.join(root, ".publish-url"),
    url + "\n",
    "utf8"
  );
} finally {
  restoreApi();
}
