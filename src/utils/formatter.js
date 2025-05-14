import { readFileSync } from 'fs';

export class MarkdownFormatter {
  static formatCodeBlock(content, ext) {
    const lang = ext.replace(/^\./, '') || 'txt';
    return `\n\`\`\`${lang}\n${content}\n\`\`\`\n`;
  }

  static formatProjectSummary(treeOutput, fileList, config) {
    const contentLines = ['\n## Included Files\n'];
    const excludedFiles = [];
    const fileContentCache = new Map();

    // Batch process files that need to be read
    const filesToRead = fileList.filter(file => 
      file.include && file.sizeKB <= config.maxFileSizeKB
    );

    // Read files in batches to avoid memory spikes
    const BATCH_SIZE = 10;
    for (let i = 0; i < filesToRead.length; i += BATCH_SIZE) {
      const batch = filesToRead.slice(i, i + BATCH_SIZE);
      batch.forEach(file => {
        try {
          const content = readFileSync(file.fullPath, 'utf-8');
          fileContentCache.set(file.relPath, content.trim());
        } catch (e) {
          fileContentCache.set(file.relPath, `_Error reading file: ${e.message}_`);
        }
      });
    }

    // Process all files using cached content
    for (const file of fileList) {
      if (!file.include) {
        excludedFiles.push(file.relPath);
        continue;
      }

      contentLines.push(`### ${file.relPath}`);
      if (file.sizeKB <= config.maxFileSizeKB) {
        const content = fileContentCache.get(file.relPath);
        contentLines.push(this.formatCodeBlock(content, file.ext));
      } else {
        contentLines.push(`_File too large to include inline (${Math.round(file.sizeKB)}KB)_\n`);
      }
    }

    if (excludedFiles.length) {
      contentLines.push('\n## Excluded Files (by extension)\n');
      excludedFiles.forEach(f => contentLines.push(`- ${f}`));
    }

    return [...treeOutput, ...contentLines].join('\n');
  }
} 