#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { Config } from '../src/config/index.js';
import { ProjectWalker } from '../src/walker/index.js';
import { MarkdownFormatter } from '../src/utils/formatter.js';
import { GitignoreParser } from '../src/utils/gitignore.js';

function summarize() {
  try {
    // Parse and validate configuration
    const config = Config.fromArgs(process.argv.slice(2));
    
    // Parse .gitignore patterns
    const gitignorePatterns = GitignoreParser.parseGitignore(process.cwd());
    config.setGitignorePatterns(gitignorePatterns);

    // Initialize tree output
    const treeLines = ['# Project Summary', '## Folder Structure\n'];

    // Process each include directory
    const walker = new ProjectWalker(config);
    config.includeDirs.forEach(dir => {
      treeLines.push(`\n**${dir}**`);
      walker.walk(dir, dir);
    });

    // Get results and format markdown
    const { treeOutput, fileList } = walker.getResults();
    const markdown = MarkdownFormatter.formatProjectSummary(
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
