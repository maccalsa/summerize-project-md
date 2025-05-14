import { FileWorkerPool } from './fileWorker.js';

export class MarkdownFormatter {
  static formatCodeBlock(content, ext = '') {
    const lang = ext ? ext.replace(/^\./, '') : 'txt';
    return `\n\`\`\`${lang}\n${content}\n\`\`\`\n`;
  }

  static async formatProjectSummary(treeOutput, fileList, config) {
    const contentLines = ['\n## Included Files\n'];
    const excludedFiles = [];
    let workerPool = null;

    try {
      // Batch process files that need to be read
      const filesToRead = fileList.filter(file => 
        file.include && file.sizeKB <= config.maxFileSizeKB
      );

      let fileContents = new Map();
      if (filesToRead.length > 0) {
        // Use worker pool to read files in parallel
        workerPool = new FileWorkerPool();
        fileContents = await workerPool.readFiles(filesToRead);
      }

      // Process all files
      for (const file of fileList) {
        if (!file.include) {
          excludedFiles.push(file.relPath);
          continue;
        }

        contentLines.push(`### ${file.relPath}`);
        if (file.sizeKB <= config.maxFileSizeKB) {
          const content = fileContents.get(file.relPath);
          if (content) {
            contentLines.push(this.formatCodeBlock(content, file.ext));
          }
        } else {
          contentLines.push(`_File too large to include inline (${Math.round(file.sizeKB)}KB)_\n`);
        }
      }

      if (excludedFiles.length) {
        contentLines.push('\n## Excluded Files (by extension)\n');
        excludedFiles.forEach(f => contentLines.push(`- ${f}`));
      }

      return [...treeOutput, ...contentLines].join('\n');
    } finally {
      if (workerPool) {
        workerPool.terminate();
      }
    }
  }
} 