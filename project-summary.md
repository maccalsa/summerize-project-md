# Project Summary

## package.json

```json
{
  "name": "summarize",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

## summarize-project.js

```js
#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const CONFIG = {
  includeExtensions: [".ts", ".tsx", ".js", ".jsx", ".svelte", ".md", ".json"],
  excludeDirs: ["node_modules", ".git", "dist", "build", ".next"],
  maxFileSizeKB: 32, // Only include content for files smaller than this
  output: "project-summary.md",
};

function walk(dir, callback, base = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (let entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!CONFIG.excludeDirs.includes(entry.name)) {
        walk(fullPath, callback, base);
      }
    } else {
      callback(fullPath, path.relative(base, fullPath));
    }
  }
}

function formatCodeBlock(content, ext) {
  const lang = ext.replace(/^\./, "") || "txt";
  return `\n\`\`\`${lang}\n${content}\n\`\`\`\n`;
}

function summarize() {
  const files = [];
  const excluded = [];
  const output = [];

  output.push("# Project Summary\n");

  walk(process.cwd(), (fullPath, relPath) => {
    const ext = path.extname(relPath);
    const stat = fs.statSync(fullPath);

    if (CONFIG.includeExtensions.includes(ext)) {
      const sizeKB = stat.size / 1024;
      files.push({ relPath, ext, sizeKB, fullPath });
    } else {
      excluded.push(relPath);
    }
  });

  for (let file of files) {
    const { relPath, fullPath, ext, sizeKB } = file;
    output.push(`## ${relPath}`);
    if (sizeKB <= CONFIG.maxFileSizeKB) {
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        output.push(formatCodeBlock(content.trim(), ext));
      } catch (e) {
        output.push(`_Error reading file: ${e.message}_\n`);
      }
    } else {
      output.push(`_File too large to include inline (${Math.round(sizeKB)}KB)_\n`);
    }
  }

  if (excluded.length) {
    output.push("\n## Excluded Files\n");
    excluded.forEach((f) => output.push(`- ${f}`));
  }

  fs.writeFileSync(CONFIG.output, output.join("\n"));
  console.log(`✅ Project summary written to ${CONFIG.output}`);
}

summarize();
```
