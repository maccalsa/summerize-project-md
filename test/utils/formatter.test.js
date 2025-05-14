import { MarkdownFormatter } from '../../src/utils/formatter.js';
import { Config } from '../../src/config/index.js';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('MarkdownFormatter', () => {
  let tempDir;
  let testFiles;
  let config;

  beforeEach(() => {
    // Create temporary test directory
    tempDir = join(tmpdir(), 'summarize-test-' + Date.now());
    mkdirSync(tempDir, { recursive: true });
    
    // Initialize testFiles array
    testFiles = [];
    
    // Create test files
    testFiles = [
      { content: 'test content 1', ext: '.txt' },
      { content: 'test content 2', ext: '.js' },
      { content: 'test content 3', ext: '.md' }
    ].map((file, index) => {
      const path = join(tempDir, `test${index}${file.ext}`);
      writeFileSync(path, file.content);
      return {
        relPath: `test${index}${file.ext}`,
        fullPath: path,
        sizeKB: 1,
        include: true
      };
    });

    // Create test config
    config = new Config();
    config.includeExtensions = ['.txt', '.js', '.md'];
    config.maxFileSizeKB = 10;
  });

  afterEach(() => {
    // Clean up test files
    testFiles.forEach(file => {
      try {
        unlinkSync(file.fullPath);
      } catch (error) {
        // Ignore errors if file doesn't exist
      }
    });
  });

  it('should format project summary with file contents', async () => {
    const treeOutput = [
      '# Project Summary',
      '## Folder Structure',
      '```',
      'test0.txt',
      'test1.js',
      'test2.md',
      '```'
    ];

    const markdown = await MarkdownFormatter.formatProjectSummary(
      treeOutput,
      testFiles,
      config
    );

    expect(markdown).toContain('# Project Summary');
    expect(markdown).toContain('## Folder Structure');
    expect(markdown).toContain('test0.txt');
    expect(markdown).toContain('test content 1');
    expect(markdown).toContain('test content 2');
    expect(markdown).toContain('test content 3');
  }, 10000);

  it('should handle empty file list', async () => {
    const treeOutput = [
      '# Project Summary',
      '## Folder Structure',
      '```',
      '```'
    ];

    const markdown = await MarkdownFormatter.formatProjectSummary(
      treeOutput,
      [],
      config
    );

    expect(markdown).toContain('# Project Summary');
    expect(markdown).toContain('## Folder Structure');
    expect(markdown).not.toContain('## File Contents');
  }, 10000);

  it('should respect file size limits', async () => {
    // Create a large file
    const largeFile = {
      relPath: 'large.txt',
      fullPath: join(tempDir, 'large.txt'),
      sizeKB: 20, // Exceeds default 10KB limit
      include: true,
      ext: '.txt'
    };
    writeFileSync(largeFile.fullPath, 'x'.repeat(21 * 1024)); // 21KB of content

    const treeOutput = [
      '# Project Summary',
      '## Folder Structure',
      '```',
      'large.txt',
      '```'
    ];

    const markdown = await MarkdownFormatter.formatProjectSummary(
      treeOutput,
      [largeFile],
      config
    );

    expect(markdown).toContain('large.txt');
    expect(markdown).toContain('_File too large to include inline (20KB)_');
  }, 10000);

  it('should respect file extension filters', async () => {
    // Create a file with excluded extension
    const excludedFile = {
      relPath: 'excluded.log',
      fullPath: join(tempDir, 'excluded.log'),
      sizeKB: 1,
      include: false,
      ext: '.log'
    };
    writeFileSync(excludedFile.fullPath, 'excluded content');

    const treeOutput = [
      '# Project Summary',
      '## Folder Structure',
      '```',
      'excluded.log',
      '```'
    ];

    const markdown = await MarkdownFormatter.formatProjectSummary(
      treeOutput,
      [excludedFile],
      config
    );

    expect(markdown).toContain('excluded.log');
    expect(markdown).not.toContain('excluded content');
  }, 10000);

  it('should handle file read errors gracefully', async () => {
    const nonExistentFile = {
      relPath: 'nonexistent.txt',
      fullPath: join(tempDir, 'nonexistent.txt'),
      sizeKB: 1,
      include: true,
      ext: '.txt'
    };

    const treeOutput = [
      '# Project Summary',
      '## Folder Structure',
      '```',
      'nonexistent.txt',
      '```'
    ];

    const markdown = await MarkdownFormatter.formatProjectSummary(
      treeOutput,
      [nonExistentFile],
      config
    );

    expect(markdown).toContain('nonexistent.txt');
    expect(markdown).toContain('_Error reading file: ENOENT: no such file or directory');
  }, 10000);
}); 