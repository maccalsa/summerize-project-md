import { FileWorkerPool } from '../../src/utils/fileWorker.js';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('FileWorkerPool', () => {
  let tempDir;
  let testFiles;

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

  it('should read multiple files in parallel', async () => {
    const pool = new FileWorkerPool(2); // Use 2 workers for testing
    try {
      const results = await pool.readFiles(testFiles);
      
      expect(results.size).toBe(testFiles.length);
      testFiles.forEach((file, index) => {
        const content = results.get(file.relPath);
        expect(content).toBeDefined();
        expect(content).toBe(`test content ${index + 1}`);
      });
    } finally {
      pool.terminate();
    }
  });

  it('should handle file read errors gracefully', async () => {
    const pool = new FileWorkerPool(1);
    const nonExistentFile = {
      relPath: 'nonexistent.txt',
      fullPath: join(tempDir, 'nonexistent.txt'),
      sizeKB: 1
    };

    try {
      const results = await pool.readFiles([nonExistentFile]);
      expect(results.get(nonExistentFile.relPath)).toContain('Error reading file');
    } finally {
      pool.terminate();
    }
  });

  it('should process files in batches', async () => {
    const pool = new FileWorkerPool(1);
    const largeFileList = Array.from({ length: 15 }, (_, i) => ({
      relPath: `test${i}.txt`,
      fullPath: join(tempDir, `test${i}.txt`),
      sizeKB: 1
    }));

    // Create the test files
    largeFileList.forEach(file => {
      writeFileSync(file.fullPath, `content ${file.relPath}`);
    });

    try {
      const results = await pool.readFiles(largeFileList);
      expect(results.size).toBe(largeFileList.length);
      largeFileList.forEach(file => {
        expect(results.get(file.relPath)).toBe(`content ${file.relPath}`);
      });
    } finally {
      pool.terminate();
    }
  });

  it('should terminate all workers', async () => {
    const pool = new FileWorkerPool(2);
    const results = await pool.readFiles(testFiles);
    expect(results.size).toBe(testFiles.length);
    
    pool.terminate();
    expect(pool.workers.length).toBe(0);
    expect(pool.taskQueue.length).toBe(0);
    expect(pool.activeWorkers).toBe(0);
  });
}); 