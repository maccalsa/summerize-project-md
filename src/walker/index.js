import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join, relative, extname } from 'path';
import { GitignoreParser } from '../utils/gitignore.js';

export class ProjectWalker {
  constructor(config) {
    this.config = config;
    this.treeOutput = [];
    this.fileList = [];
  }

  walk(dir, base, level = 0) {
    if (!existsSync(dir)) {
      return;
    }

    const entries = readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.isDirectory() === b.isDirectory() 
        ? a.name.localeCompare(b.name) 
        : a.isDirectory() ? -1 : 1
      );

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relPath = relative(base, fullPath);

      // Skip if path matches gitignore patterns
      if (GitignoreParser.shouldIgnore(relPath, this.config.gitignorePatterns)) {
        continue;
      }

      if (entry.isDirectory()) {
        if (!this.config.excludeDirs.includes(entry.name)) {
          this.treeOutput.push(`${this.indent(level)}- ${entry.name}/`);
          this.walk(fullPath, base, level + 1);
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
          include: this.config.includeExtensions.includes(ext),
        };

        this.fileList.push(tracked);
        this.treeOutput.push(
          `${this.indent(level)}- ${entry.name}${
            tracked.include && sizeKB <= this.config.maxFileSizeKB ? '' : ' (skipped)'
          }`
        );
      }
    }
  }

  indent(level) {
    return '  '.repeat(level);
  }

  getResults() {
    return {
      treeOutput: this.treeOutput,
      fileList: this.fileList
    };
  }
} 