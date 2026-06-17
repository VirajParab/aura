#!/usr/bin/env node
/**
 * Download CC0 VRM models for the launch lineup.
 * Source: ToxSam 100Avatars (https://opensourceavatars.com) — CC0 public domain.
 */
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** @type {{ id: string; model: string; source: string; url: string }[]} */
const MODELS = [
  {
    id: "mochi",
    model: "DogoBurger",
    source: "100Avatars R3 — ToxSam (CC0)",
    url: "https://arweave.net/qKrAwFf60cT1348kvQc7S5Nzn3fO0aNvJ8ybMx5Lu04",
  },
  {
    id: "pixel",
    model: "MeganTheFox",
    source: "100Avatars R3 — ToxSam (CC0)",
    url: "https://arweave.net/up4WzT0YJfXv9woGseCIQnBSq3eH8KWASJJbNtuvEWY",
  },
  {
    id: "sakura",
    model: "Rose",
    source: "100Avatars R1 — ToxSam (CC0)",
    url: "https://arweave.net/Ea1KXujzJatQgCFSMzGOzp_UtHqB1pyia--U3AtkMAY",
  },
  {
    id: "nova",
    model: "Cyberpal",
    source: "100Avatars R3 — ToxSam (CC0)",
    url: "https://arweave.net/zNTLqtifNdl38MpdNXACcvSMFVu6-s7d6pJQDm7E7Us",
  },
  {
    id: "ember",
    model: "FireEye",
    source: "100Avatars R3 — ToxSam (CC0)",
    url: "https://arweave.net/RZJRCIir0engUa_94Naiy95fpg-RRZYiU1v-xKzXAco",
  },
];

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  await mkdir(dirname(dest), { recursive: true });
  await pipeline(res.body, createWriteStream(dest));
}

async function main() {
  console.log("Downloading CC0 VRM models for AuraOS launch lineup...\n");

  for (const entry of MODELS) {
    const dest = join(root, "characters", entry.id, "model.vrm");
    process.stdout.write(`  ${entry.id} (${entry.model})... `);
    try {
      await download(entry.url, dest);
      console.log("OK");
    } catch (err) {
      console.log("FAILED");
      console.error(`    ${err.message}`);
      process.exitCode = 1;
    }
  }

  console.log("\nDone. Restart the app: make dev");
}

main();
