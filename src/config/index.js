import { resolve } from 'path';

export class Config {
  constructor({ existsSync } = {}) {
    this.includeExtensions = [];
    this.excludeDirs = [];
    this.includeDirs = [];
    this.maxFileSizeKB = 32;
    this.output = 'project-summary.md';
    this.gitignorePatterns = [];
    this.existsSync = existsSync;
  }

  static fromArgs(args, deps = {}) {
    const config = new Config(deps);
    
    // Parse CLI arguments
    config.includeExtensions = Config.getFlagList(args, '--ext', ['.ts', '.tsx', '.js', '.jsx', '.svelte', '.md', '.json']);
    config.excludeDirs = Config.getFlagList(args, '--exclude', ['node_modules', 'dist', 'build', '.next']);
    config.includeDirs = Config.getFlagList(args, '--include', ['.']);
    config.maxFileSizeKB = parseInt(Config.getFlagValue(args, '--max-size', '32'));
    config.output = Config.getFlagValue(args, '--output', 'project-summary.md');

    // Always exclude .git directory
    config.excludeDirs.push('.git');

    // Validate paths exist
    config.validatePaths();

    return config;
  }

  static getFlagValue(args, flag, defaultVal) {
    const index = args.indexOf(flag);
    return index !== -1 ? args[index + 1] : defaultVal;
  }

  static getFlagList(args, flag, defaultVal) {
    const val = Config.getFlagValue(args, flag, null);
    return val ? val.split(',').map(s => s.trim()) : defaultVal;
  }

  validatePaths() {
    // Validate include directories
    this.includeDirs = this.includeDirs.map(dir => {
      const resolvedPath = resolve(dir);
      if (this.existsSync && !this.existsSync(resolvedPath)) {
        throw new Error(`Include directory does not exist: ${dir}`);
      }
      return resolvedPath;
    });

    // Validate output directory
    const outputDir = resolve(this.output, '..');
    if (this.existsSync && !this.existsSync(outputDir)) {
      throw new Error(`Output directory does not exist: ${outputDir}`);
    }
  }

  setGitignorePatterns(patterns) {
    this.gitignorePatterns = patterns;
  }
} 