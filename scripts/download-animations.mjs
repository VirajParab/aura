#!/usr/bin/env node
/**
 * Download shared VRMA animation clips for character activities.
 * Usage: make animations
 */
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const destDir = join(root, "animations", "shared");

const BASE =
  "https://raw.githubusercontent.com/tk256ailab/vrm-viewer/main/VRMA";

/** Logical id -> source filename in vrm-viewer repo */
const CLIPS = {
  relax: "Relax.vrma",
  sleepy: "Sleepy.vrma",
  goodbye: "Goodbye.vrma",
  jump: "Jump.vrma",
  look_around: "LookAround.vrma",
  clapping: "Clapping.vrma",
  sad: "Sad.vrma",
  thinking: "Thinking.vrma",
  surprised: "Surprised.vrma",
  angry: "Angry.vrma",
};

mkdirSync(destDir, { recursive: true });

for (const [id, file] of Object.entries(CLIPS)) {
  const dest = join(destDir, `${id}.vrma`);
  if (existsSync(dest)) {
    console.log(`skip ${id}.vrma (exists)`);
    continue;
  }
  const url = `${BASE}/${file}`;
  console.log(`fetch ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  console.log(`wrote ${id}.vrma (${(buf.length / 1024).toFixed(0)} KB)`);
}

console.log(`Done — ${Object.keys(CLIPS).length} clips in animations/shared/`);
