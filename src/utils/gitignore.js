import { resolve } from 'path';
import { Minimatch } from 'minimatch';

export class GitignoreParser {
  static parseGitignore(rootDir, { existsSync, readFileSync } = {}) {
    const gitignorePath = resolve(rootDir, '.gitignore');
    if (!existsSync || !existsSync(gitignorePath)) {
      return [];
    }
    const content = readFileSync(gitignorePath, 'utf-8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(pattern => {
        // Convert gitignore pattern to minimatch pattern
        const minimatch = new Minimatch(pattern, {
          dot: true,
          matchBase: true,
          nocase: true
        });
        return minimatch;
      });
  }

  static shouldIgnore(path, patterns) {
    return patterns.some(pattern => pattern.match(path));
  }
} 