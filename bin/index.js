#!/usr/bin/env node

import { existsSync, readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import { join, relative, extname, resolve } from "path";

// --- CLI ARGUMENT PARSING ---
const args = process.argv.slice(2);

function getFlagValue(flag, defaultVal) {
  const index = args.indexOf(flag);
  return index !== -1 ? args[index + 1] : defaultVal;
}

function getFlagList(flag, defaultVal) {
  const val = getFlagValue(flag, null);
  return val ? val.split(",").map((s) => s.trim()) : defaultVal;
}

// --- CONFIG ---
const CONFIG = {
  includeExtensions: getFlagList("--ext", [".ts", ".tsx", ".js", ".jsx", ".svelte", ".md", ".json"]),
  excludeDirs: getFlagList("--exclude", ["node_modules", ".git", "dist", "build", ".next"]),
  includeDirs: getFlagList("--include", ["."]),
  maxFileSizeKB: parseInt(getFlagValue("--max-size", "32")),
  output: getFlagValue("--output", "project-summary.md"),
};

// --- HELPERS ---
function formatCodeBlock(content, ext) {
  const lang = ext.replace(/^\./, "") || "txt";
  return `\n\`\`\`${lang}\n${content}\n\`\`\`\n`;
}

function indent(level) {
  return "  ".repeat(level);
}

// --- WALK ---
function walk(dir, base, level = 0, treeOutput = [], fileList = []) {
  if (!existsSync(dir)) {
    return;
  }
  
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.isDirectory() === b.isDirectory() ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1
  );

  for (let entry of entries) {
    const fullPath = join(dir, entry.name);
    const relPath = relative(base, fullPath);

    if (entry.isDirectory()) {
      if (!CONFIG.excludeDirs.includes(entry.name)) {
        treeOutput.push(`${indent(level)}- ${entry.name}/`);
        walk(fullPath, base, level + 1, treeOutput, fileList);
      }
    } else {
      const ext = extname(entry.name);
      const stat = statSync(fullPath);
      const sizeKB = stat.size / 1024;

      const tracked = {
        relPath,
        ext,
        sizeKB,
        fullPath,
        include: CONFIG.includeExtensions.includes(ext),
      };

      fileList.push(tracked);
      treeOutput.push(`${indent(level)}- ${entry.name}${tracked.include && sizeKB <= CONFIG.maxFileSizeKB ? "" : " (skipped)"}`);
    }
  }
}

// --- MAIN ---
function summarize() {
  const treeLines = ["# Project Summary", "## Folder Structure\n"];
  const fileList = [];

  CONFIG.includeDirs.forEach((d) => {
    treeLines.push(`\n**${d}**`);
    walk(resolve(d), resolve(d), 0, treeLines, fileList);
  });

  const contentLines = ["\n## Included Files\n"];
  const excludedFiles = [];

  for (const file of fileList) {
    if (!file.include) {
      excludedFiles.push(file.relPath);
      continue;
    }

    contentLines.push(`### ${file.relPath}`);
    if (file.sizeKB <= CONFIG.maxFileSizeKB) {
      try {
        const content = readFileSync(file.fullPath, "utf-8");
        contentLines.push(formatCodeBlock(content.trim(), file.ext));
      } catch (e) {
        contentLines.push(`_Error reading file: ${e.message}_\n`);
      }
    } else {
      contentLines.push(`_File too large to include inline (${Math.round(file.sizeKB)}KB)_\n`);
    }
  }

  if (excludedFiles.length) {
    contentLines.push("\n## Excluded Files (by extension)\n");
    excludedFiles.forEach((f) => contentLines.push(`- ${f}`));
  }

  writeFileSync(CONFIG.output, [...treeLines, ...contentLines].join("\n"));
  console.log(`✅ Project summary written to ${CONFIG.output}`);
}

summarize();
