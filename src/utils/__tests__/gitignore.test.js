import { jest } from '@jest/globals';
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn()
}));
jest.mock('path', () => ({
  resolve: jest.fn(path => path)
}));
import { GitignoreParser } from '../gitignore.js';
import * as fs from 'fs';
import { resolve } from 'path';

describe('GitignoreParser', () => {
  let existsSync, readFileSync;

  beforeEach(() => {
    existsSync = jest.fn();
    readFileSync = jest.fn();
  });

  describe('parseGitignore', () => {
    it('should return empty array when .gitignore does not exist', () => {
      existsSync.mockReturnValue(false);
      const result = GitignoreParser.parseGitignore('/test', { existsSync, readFileSync });
      expect(result).toEqual([]);
      expect(existsSync).toHaveBeenCalledWith('/test/.gitignore');
    });

    it('should parse .gitignore content correctly', () => {
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(`
        # Comment line
        node_modules/
        *.log
        .env
        dist/
      `);
      const result = GitignoreParser.parseGitignore('/test', { existsSync, readFileSync });
      expect(result).toHaveLength(4);
      expect(result[0].pattern).toBe('node_modules/');
      expect(result[1].pattern).toBe('*.log');
      expect(result[2].pattern).toBe('.env');
      expect(result[3].pattern).toBe('dist/');
    });

    it('should ignore empty lines and comments', () => {
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(`
        # Comment line
        
        node_modules/
        
        # Another comment
        *.log
      `);
      const result = GitignoreParser.parseGitignore('/test', { existsSync, readFileSync });
      expect(result).toHaveLength(2);
      expect(result[0].pattern).toBe('node_modules/');
      expect(result[1].pattern).toBe('*.log');
    });
  });

  describe('shouldIgnore', () => {
    it('should return true when path matches any pattern', () => {
      const patterns = [
        { match: jest.fn().mockReturnValue(true) },
        { match: jest.fn().mockReturnValue(false) }
      ];
      const result = GitignoreParser.shouldIgnore('test.js', patterns);
      expect(result).toBe(true);
      expect(patterns[0].match).toHaveBeenCalledWith('test.js');
    });

    it('should return false when path matches no patterns', () => {
      const patterns = [
        { match: jest.fn().mockReturnValue(false) },
        { match: jest.fn().mockReturnValue(false) }
      ];
      const result = GitignoreParser.shouldIgnore('test.js', patterns);
      expect(result).toBe(false);
      expect(patterns[0].match).toHaveBeenCalledWith('test.js');
      expect(patterns[1].match).toHaveBeenCalledWith('test.js');
    });
  });
}); 