import { join, relative, extname } from 'path';
import { GitignoreParser } from '../utils/gitignore.js';

export class ProjectWalker {
  constructor(config, { existsSync, readdirSync, statSync, readFileSync } = {}) {
    this.config = config;
    this.treeOutput = [];
    this.fileList = [];
    this.existsSync = existsSync;
    this.readdirSync = readdirSync;
    this.statSync = statSync;
    this.readFileSync = readFileSync;
    this.dirCache = new Map();
  }

  async walk(dir, base, level = 0) {
    if (!this.existsSync || !this.existsSync(dir)) {
      return;
    }

    // Check cache first
    if (this.dirCache.has(dir)) {
      const cached = this.dirCache.get(dir);
      await this.processEntries(cached, dir, base, level);
      return;
    }

    try {
      const entries = this.readdirSync(dir, { withFileTypes: true });
      if (!entries || !Array.isArray(entries)) {
        return;
      }

      const sortedEntries = entries.sort((a, b) => a.isDirectory() === b.isDirectory() 
        ? a.name.localeCompare(b.name) 
        : a.isDirectory() ? -1 : 1
      );

      // Cache the entries
      this.dirCache.set(dir, sortedEntries);

      // Process entries
      await this.processEntries(sortedEntries, dir, base, level);
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error.message);
    }
  }

  async processEntries(entries, dir, base, level) {
    const promises = entries.map(async entry => {
      const fullPath = join(dir, entry.name);
      const relPath = relative(base, fullPath);

      // Skip if path matches gitignore patterns
      if (GitignoreParser.shouldIgnore(relPath, this.config.gitignorePatterns)) {
        return;
      }

      if (entry.isDirectory()) {
        if (!this.config.excludeDirs.includes(entry.name)) {
          this.treeOutput.push(`${this.indent(level)}- ${entry.name}/`);
          await this.walk(fullPath, base, level + 1);
        }
      } else {
        const ext = extname(entry.name);
        const stat = this.statSync(fullPath);
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
    });

    return Promise.all(promises);
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