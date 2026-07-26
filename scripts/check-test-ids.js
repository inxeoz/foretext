#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, basename, extname } from 'path';

const SRC_DIR = join(process.cwd(), 'src');

function findSvelteFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules' && entry !== '.svelte-kit') {
      files.push(...findSvelteFiles(fullPath));
    } else if (extname(entry) === '.svelte') {
      files.push(fullPath);
    }
  }
  return files;
}

function findClosingBracket(content, start) {
  let i = start;
  let inDoubleQuote = false;
  let inSingleQuote = false;
  let inBrace = 0;

  while (i < content.length) {
    const ch = content[i];

    if (inDoubleQuote) {
      if (ch === '"') inDoubleQuote = false;
    } else if (inSingleQuote) {
      if (ch === "'") inSingleQuote = false;
    } else if (ch === '"') {
      inDoubleQuote = true;
    } else if (ch === "'") {
      inSingleQuote = true;
    } else if (ch === '{') {
      inBrace++;
    } else if (ch === '}') {
      if (inBrace > 0) inBrace--;
    } else if (ch === '>' && inBrace === 0) {
      return i;
    }

    i++;
  }

  return -1;
}

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const relPath = relative(process.cwd(), filePath);
  const issues = [];

  const interactiveTags = ['button', 'input', 'select', 'textarea', 'form', 'nav', 'main', 'section', 'dialog', 'table', 'a'];

  for (const tag of interactiveTags) {
    const tagRegex = new RegExp(`<${tag}(\\s|>)`, 'g');
    let tagMatch;

    while ((tagMatch = tagRegex.exec(content)) !== null) {
      const tagStart = tagMatch.index;
      const tagEnd = findClosingBracket(content, tagStart + tagMatch[0].length);

      if (tagEnd === -1) continue;

      const fullTag = content.substring(tagStart, tagEnd + 1);

      if (fullTag.includes(`</${tag}`)) continue;

      if (fullTag.includes('data-testid')) continue;

      if (tag === 'a') {
        const hrefMatch = fullTag.match(/href="([^"]*)"/);
        if (hrefMatch && (hrefMatch[1].startsWith('http') || hrefMatch[1].startsWith('mailto:') || hrefMatch[1].startsWith('#'))) {
          continue;
        }
      }

      const lineNum = content.substring(0, tagStart).split('\n').length;
      const snippet = fullTag.substring(0, 120).replace(/\n/g, ' ').trim();

      issues.push({ file: relPath, line: lineNum, element: tag, snippet });
    }
  }

  return issues;
}

function checkDuplicates(svelteFiles) {
  const seen = new Map();
  const duplicates = [];

  for (const filePath of svelteFiles) {
    const content = readFileSync(filePath, 'utf-8');
    const relPath = relative(process.cwd(), filePath);
    const regex = /data-testid="([^"]+)"/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const id = match[1];
      const line = content.substring(0, match.index).split('\n').length;
      const loc = `${relPath}:${line}`;

      if (seen.has(id)) {
        seen.get(id).push(loc);
      } else {
        seen.set(id, [loc]);
      }
    }
  }

  for (const [id, locs] of seen) {
    if (locs.length > 1) {
      duplicates.push({ id, locs });
    }
  }

  return duplicates;
}

const svelteFiles = findSvelteFiles(SRC_DIR);
let exitCode = 0;

console.log(`\nChecking ${svelteFiles.length} Svelte files for test ID coverage...\n`);

const missingIssues = [];
for (const file of svelteFiles) {
  missingIssues.push(...checkFile(file));
}

if (missingIssues.length > 0) {
  console.log('Missing data-testid:');
  for (const issue of missingIssues) {
    console.log(`  ${issue.file}:${issue.line}  <${issue.element}>  ${issue.snippet}`);
  }
  exitCode = 1;
} else {
  console.log('  All interactive elements have data-testid.');
}

console.log('');
const duplicates = checkDuplicates(svelteFiles);
if (duplicates.length > 0) {
  console.log('Duplicate data-testid values:');
  for (const dup of duplicates) {
    console.log(`  "${dup.id}" in:`);
    for (const loc of dup.locs) {
      console.log(`    ${loc}`);
    }
  }
  exitCode = 1;
} else {
  console.log('  No duplicate data-testid values.');
}

console.log('');
if (exitCode === 0) {
  console.log('All checks passed.');
} else {
  console.log('Issues found. See above for details.');
}

process.exit(exitCode);
