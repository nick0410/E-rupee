"use strict";

const { spawnSync } = require("node:child_process");

const MAX_ATTEMPTS = Number.parseInt(process.env.PRISMA_MIGRATE_MAX_ATTEMPTS ?? "6", 10);
const RETRY_DELAY_MS = Number.parseInt(process.env.PRISMA_MIGRATE_RETRY_DELAY_MS ?? "5000", 10);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runPrisma(args, options = {}) {
  const result = spawnSync("npx", ["prisma", ...args], {
    cwd: process.cwd(),
    stdio: options.stdio ?? "inherit",
    input: options.input,
    env: process.env,
    shell: true,
  });

  if (result.error) {
    console.error("[Prisma] Failed to start Prisma CLI:", result.error.message);
    return 1;
  }

  return typeof result.status === "number" ? result.status : 1;
}

async function main() {
  if (!Number.isInteger(MAX_ATTEMPTS) || MAX_ATTEMPTS < 1) {
    console.error("[Prisma] PRISMA_MIGRATE_MAX_ATTEMPTS must be an integer >= 1.");
    process.exit(1);
  }

  if (!Number.isInteger(RETRY_DELAY_MS) || RETRY_DELAY_MS < 0) {
    console.error("[Prisma] PRISMA_MIGRATE_RETRY_DELAY_MS must be an integer >= 0.");
    process.exit(1);
  }

  const directUrl = process.env.DIRECT_URL;
  const wakeupArgs = directUrl
    ? ["db", "execute", "--url", directUrl, "--stdin"]
    : ["db", "execute", "--stdin"];

  console.log("[Prisma] Waking database endpoint...");
  runPrisma(wakeupArgs, { stdio: ["pipe", "ignore", "ignore"], input: "" });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    console.log(`[Prisma] Running migrate deploy (attempt ${attempt}/${MAX_ATTEMPTS})...`);

    const exitCode = runPrisma(["migrate", "deploy"]);
    if (exitCode === 0) {
      console.log("[Prisma] Migrations applied successfully.");
      process.exit(0);
    }

    if (attempt === MAX_ATTEMPTS) {
      console.error(`[Prisma] Database is still unreachable after ${MAX_ATTEMPTS} attempts.`);
      process.exit(exitCode);
    }

    const waitSeconds = Math.ceil(RETRY_DELAY_MS / 1000);
    console.log(`[Prisma] Retry in ${waitSeconds}s...`);
    await sleep(RETRY_DELAY_MS);
  }
}

main().catch((error) => {
  console.error("[Prisma] Unexpected error while running migrations:", error);
  process.exit(1);
});
