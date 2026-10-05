/**
 * Bootstraps npm when not on PATH, installs deps, builds web, adds Capacitor platforms.
 * Run: node scripts/bootstrap-install.mjs
 */
import { execSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readdirSync } from "node:fs";
import { get } from "node:https";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const npmVersion = "10.9.2";
const tmp = join(tmpdir(), "DoseVia-npm-bootstrap");

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: root, ...opts });
}

function downloadNpm() {
  return new Promise((resolve, reject) => {
    const tgz = join(tmp, "npm.tgz");
    mkdirSync(tmp, { recursive: true });
    const file = createWriteStream(tgz);
    get(`https://registry.npmjs.org/npm/-/npm-${npmVersion}.tgz`, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`npm download failed: ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        run(`tar -xzf npm.tgz`, { cwd: tmp });
        const folder = readdirSync(tmp).find((d) => d.startsWith("package"));
        if (!folder) reject(new Error("npm extract failed"));
        else resolve(join(tmp, folder, "bin", "npm-cli.js"));
      });
    }).on("error", reject);
  });
}

let npmCliPath;

async function getNpmCli() {
  if (npmCliPath) return npmCliPath;
  if (process.env.npm_execpath && existsSync(process.env.npm_execpath)) {
    npmCliPath = process.env.npm_execpath;
    return npmCliPath;
  }
  try {
    run("npm --version", { shell: true });
    npmCliPath = "npm";
    return npmCliPath;
  } catch {
    npmCliPath = await downloadNpm();
    return npmCliPath;
  }
}

async function npmCmd(args) {
  const cli = await getNpmCli();
  if (cli === "npm") run(`npm ${args}`, { shell: true });
  else run(`"${process.execPath}" "${cli}" ${args}`);
}

function capBin() {
  return join(root, "node_modules", "@capacitor", "cli", "bin", "capacitor");
}

async function capCmd(args) {
  const cap = capBin();
  if (!existsSync(cap))
    throw new Error("Capacitor CLI not installed. Run bootstrap again.");
  run(`"${process.execPath}" "${cap}" ${args}`);
}

async function main() {
  console.log("DoseVia bootstrap — installing dependencies…\n");
  await npmCmd("install");
  await npmCmd("run build");
  if (!existsSync(join(root, "android"))) {
    try {
      await capCmd("add android");
    } catch (e) {
      console.log("cap add android:", e.message);
    }
  }
  if (!existsSync(join(root, "ios"))) {
    try {
      await capCmd("add ios");
    } catch (e) {
      console.log("cap add ios:", e.message);
    }
  }
  await capCmd("sync");
  console.log("\nDone. See DEPLOYMENT.md for run/build commands.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
