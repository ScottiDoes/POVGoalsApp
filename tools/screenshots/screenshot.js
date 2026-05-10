#!/usr/bin/env node
// Usage:
//   node tools/screenshots/screenshot.js url <url> <label>
//   node tools/screenshots/screenshot.js file <path-to-html> <label>
//
// Captures desktop (1440px) and mobile (390px) screenshots.
// Output: tools/screenshots/output/<label>-desktop.png and <label>-mobile.png

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const [, , mode, target, label] = process.argv;

if (!mode || !target || !label) {
  console.error("Usage: node screenshot.js url <url> <label>");
  console.error("       node screenshot.js file <path> <label>");
  process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, "output");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

async function capture() {
  const browser = await puppeteer.launch({ headless: "new" });

  let url;
  if (mode === "file") {
    const abs = path.resolve(target);
    if (!fs.existsSync(abs)) {
      console.error(`File not found: ${abs}`);
      process.exit(1);
    }
    url = `file://${abs}`;
  } else if (mode === "url") {
    url = target;
  } else {
    console.error(`Unknown mode "${mode}". Use "url" or "file".`);
    process.exit(1);
  }

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    const outPath = path.join(OUTPUT_DIR, `${label}-${vp.name}.png`);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`Saved: ${outPath}`);
    await page.close();
  }

  await browser.close();
}

capture().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
