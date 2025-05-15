#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";


import os from "os";
import { createInterface } from "readline";
const npmrcPath = resolve(process.cwd(), ".npmrc");

function ensureNpmToken() {
  if (existsSync(npmrcPath)) {
    const content = readFileSync(npmrcPath, "utf-8");
    if (content.includes("_authToken")) return;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Enter your npm auth token (https://www.npmjs.com/settings/tokens): ", (token) => {
    writeFileSync(npmrcPath, `//registry.npmjs.org/:_authToken=${token}\n`, { flag: "a" });
    console.log(`✅ Token saved to .npmrc`);
    rl.close();
  });
}

ensureNpmToken();