import { jest } from '@jest/globals';
jest.mock('fs', () => ({
  existsSync: jest.fn()
}));
jest.mock('path', () => ({
  resolve: jest.fn(path => path)
}));
import { Config } from '../index.js';
import * as fs from 'fs';
import path from 'path';

describe('Config', () => {
  let existsSync;

  beforeEach(() => {
    existsSync = jest.fn().mockReturnValue(true);
  });

  describe('fromArgs', () => {
    it('should create config with default values when no args provided', () => {
      const config = Config.fromArgs([], { existsSync });
      expect(config.includeExtensions).toEqual(['.ts', '.tsx', '.js', '.jsx', '.svelte', '.md', '.json']);
      expect(config.excludeDirs).toContain('.git');
      expect(config.includeDirs).toEqual([path.resolve('.')]);
      expect(config.maxFileSizeKB).toBe(32);
      expect(config.output).toBe('project-summary.md');
    });

    it('should parse custom arguments correctly', () => {
      const args = [
        '--ext', '.js,.ts',
        '--exclude', 'test,coverage',
        '--include', 'src,lib',
        '--max-size', '64',
        '--output', 'custom.md'
      ];
      const config = Config.fromArgs(args, { existsSync });
      expect(config.includeExtensions).toEqual(['.js', '.ts']);
      expect(config.excludeDirs).toContain('test');
      expect(config.excludeDirs).toContain('coverage');
      expect(config.includeDirs).toEqual([path.resolve('src'), path.resolve('lib')]);
      expect(config.maxFileSizeKB).toBe(64);
      expect(config.output).toBe('custom.md');
    });

    it('should throw error when include directory does not exist', () => {
      existsSync.mockReturnValueOnce(false);
      expect(() => Config.fromArgs(['--include', 'nonexistent'], { existsSync }))
        .toThrow('Include directory does not exist: nonexistent');
    });

    it('should throw error when output directory does not exist', () => {
      existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
      const expectedDir = path.resolve('nonexistent');
      expect(() => Config.fromArgs(['--output', 'nonexistent/output.md'], { existsSync }))
        .toThrow(`Output directory does not exist: ${expectedDir}`);
    });
  });

  describe('getFlagValue', () => {
    it('should return default value when flag not found', () => {
      const result = Config.getFlagValue([], '--test', 'default');
      expect(result).toBe('default');
    });

    it('should return value after flag', () => {
      const result = Config.getFlagValue(['--test', 'value'], '--test', 'default');
      expect(result).toBe('value');
    });
  });

  describe('getFlagList', () => {
    it('should return default value when flag not found', () => {
      const result = Config.getFlagList([], '--test', ['default']);
      expect(result).toEqual(['default']);
    });

    it('should split comma-separated values', () => {
      const result = Config.getFlagList(['--test', 'a,b,c'], '--test', ['default']);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should trim whitespace from values', () => {
      const result = Config.getFlagList(['--test', 'a , b , c'], '--test', ['default']);
      expect(result).toEqual(['a', 'b', 'c']);
    });
  });
}); 