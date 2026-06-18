#!/usr/bin/env node
/**
 * Regenerate characters/manifest.json from per-character definition.json files.
 * Usage: make manifest
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const launchLineup = ["mochi", "pixel", "sakura", "nova", "ember", "micky"];

const characters = launchLineup.map((id) => {
  const path = join(root, "characters", id, "definition.json");
  return JSON.parse(readFileSync(path, "utf8"));
});

const manifest = {
  version: "1.0.0",
  launch_lineup: launchLineup,
  characters,
};

writeFileSync(
  join(root, "characters", "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);

console.log(`Wrote characters/manifest.json (${characters.length} characters)`);
