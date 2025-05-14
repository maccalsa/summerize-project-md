#!/usr/bin/env node

import { writeFileSync, existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { Config } from '../src/config/index.js';
import { ProjectWalker } from '../src/walker/index.js';
import { MarkdownFormatter } from '../src/utils/formatter.js';
import { GitignoreParser } from '../src/utils/gitignore.js';

async function summarize() {
  try {
    // Parse and validate configuration
    const config = Config.fromArgs(process.argv.slice(2));
    
    // Parse .gitignore patterns
    const gitignorePatterns = GitignoreParser.parseGitignore(process.cwd());
    config.setGitignorePatterns(gitignorePatterns);

    // Initialize tree output
    const treeLines = ['# Project Summary', '## Folder Structure\n'];

    // Process each include directory
    const walker = new ProjectWalker(config, { existsSync, readdirSync, statSync, readFileSync });
    const walkPromises = [];
    for (const dir of config.includeDirs) {
      treeLines.push(`\n**${dir}**`);
      walkPromises.push(walker.walk(dir, dir));
    }
    await Promise.all(walkPromises);

    const { treeOutput, fileList } = walker.getResults();


    // Format markdown using worker threads for file reading
    const markdown = await MarkdownFormatter.formatProjectSummary(
      [...treeLines, ...treeOutput],
      fileList,
      config
    );

    // Write output file
    writeFileSync(config.output, markdown);
    console.log(`✅ Project summary written to ${config.output}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

summarize();
