import { jest } from '@jest/globals';
import { ProjectWalker } from '../index.js';

describe('ProjectWalker', () => {
  let walker;
  let mockConfig;
  let mockDeps;

  beforeEach(() => {
    mockConfig = {
      includeExtensions: ['.js', '.ts'],
      excludeDirs: ['node_modules'],
      gitignorePatterns: [],
      maxFileSizeKB: 32 // Ensure this is set for all tests
    };

    mockDeps = {
      existsSync: jest.fn().mockReturnValue(true),
      readdirSync: jest.fn(),
      statSync: jest.fn(),
      readFileSync: jest.fn()
    };

    walker = new ProjectWalker(mockConfig, mockDeps);
  });

  it('should skip non-existent directories', async () => {
    mockDeps.existsSync.mockReturnValueOnce(false);
    await walker.walk('/nonexistent', '/base');
    expect(mockDeps.readdirSync).not.toHaveBeenCalled();
  });

  it('should process directory entries correctly', async () => {
    const mockEntries = [
      { isDirectory: () => true, name: 'src' },
      { isDirectory: () => false, name: 'index.js' }
    ];

    mockDeps.readdirSync.mockReturnValueOnce(mockEntries);
    // Set file size to 1KB, below maxFileSizeKB
    mockDeps.statSync.mockReturnValueOnce({ size: 1024 });

    await walker.walk('/test', '/base');

    expect(walker.treeOutput).toContain('- src/');
    expect(walker.treeOutput).toContain('- index.js');
    expect(walker.fileList).toHaveLength(1);
    // The relPath is relative to base, which is '/base', so expect '../test/index.js'
    expect(walker.fileList[0].relPath).toBe('../test/index.js');
  });

  it('should respect gitignore patterns', async () => {
    const mockEntries = [
      { isDirectory: () => false, name: 'ignored.js' }
    ];

    mockConfig.gitignorePatterns = [
      { match: jest.fn().mockReturnValue(true) }
    ];

    mockDeps.readdirSync.mockReturnValueOnce(mockEntries);
    await walker.walk('/test', '/base');

    expect(walker.treeOutput).toHaveLength(0);
    expect(walker.fileList).toHaveLength(0);
  });

  it('should cache directory entries', async () => {
    const mockEntries = [
      { isDirectory: () => true, name: 'src' }
    ];

    mockDeps.readdirSync.mockReturnValueOnce(mockEntries);
    
    // Use the same dir and base for both calls
    await walker.walk('/test', '/test');
    await walker.walk('/test', '/test');

    // Check that the root directory is only read once
    const rootCalls = mockDeps.readdirSync.mock.calls.filter(
      call => call[0] === '/test'
    );
    expect(rootCalls).toHaveLength(1);
  });

  it('should handle file size limits correctly', async () => {
    const mockEntries = [
      { isDirectory: () => false, name: 'large.js' }
    ];

    mockDeps.readdirSync.mockReturnValueOnce(mockEntries);
    mockDeps.statSync.mockReturnValueOnce({ size: 1024 * 1024 }); // 1MB

    await walker.walk('/test', '/base');

    expect(walker.fileList[0].sizeKB).toBe(1024);
    expect(walker.treeOutput[0]).toContain('(skipped)');
  });
}); 