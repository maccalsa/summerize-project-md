import { readFileSync } from 'fs';

export class MarkdownFormatter {
  static formatCodeBlock(content, ext) {
    const lang = ext.replace(/^\./, '') || 'txt';
    return `\n\`\`\`${lang}\n${content}\n\`\`\`\n`;
  }

  static formatProjectSummary(treeOutput, fileList, config) {
    const contentLines = ['\n## Included Files\n'];
    const excludedFiles = [];

    for (const file of fileList) {
      if (!file.include) {
        excludedFiles.push(file.relPath);
        continue;
      }

      contentLines.push(`### ${file.relPath}`);
      if (file.sizeKB <= config.maxFileSizeKB) {
        try {
          const content = readFileSync(file.fullPath, 'utf-8');
          contentLines.push(this.formatCodeBlock(content.trim(), file.ext));
        } catch (e) {
          contentLines.push(`_Error reading file: ${e.message}_\n`);
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
  }
} 