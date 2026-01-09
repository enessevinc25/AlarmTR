#!/usr/bin/env node
/**
 * Console log wrapper script
 * Tüm console.log/warn/error'ları __DEV__ kontrolü ile sarmalar
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// İşlenecek dosyalar (src ve transit-api/src)
const filesToProcess = [];

// Recursive file finder
function findFiles(dir, pattern) {
  const fs = require('fs');
  const path = require('path');
  let results = [];
  
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      // node_modules ve .git'i atla
      if (!file.includes('node_modules') && !file.includes('.git')) {
        results = results.concat(findFiles(file, pattern));
      }
    } else if (file.match(pattern)) {
      results.push(file);
    }
  });
  return results;
}

// TypeScript/JavaScript dosyalarını bul
const srcFiles = findFiles(join(projectRoot, 'src'), /\.(ts|tsx|js|jsx)$/);
const transitApiFiles = findFiles(join(projectRoot, 'transit-api', 'src'), /\.(ts|tsx|js|jsx)$/);

const allFiles = [...srcFiles, ...transitApiFiles];

// Console statement pattern
const consolePattern = /console\.(log|warn|error|info|debug)\s*\(/g;

// Zaten __DEV__ ile sarmalanmış mı kontrol et
function isAlreadyWrapped(content, index) {
  const before = content.substring(Math.max(0, index - 100), index);
  return before.includes('if (__DEV__)') || before.includes('if(__DEV__)');
}

let totalWrapped = 0;
let totalSkipped = 0;

allFiles.forEach(filePath => {
  try {
    let content = readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Tüm console.* çağrılarını bul
    const matches = [...content.matchAll(consolePattern)];
    
    // Ters sırada işle (index'ler değişmesin diye)
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const startIndex = match.index;
      
      // Zaten sarmalanmış mı kontrol et
      if (isAlreadyWrapped(content, startIndex)) {
        totalSkipped++;
        continue;
      }
      
      // Satır başını bul
      const lineStart = content.lastIndexOf('\n', startIndex) + 1;
      const indent = content.substring(lineStart, startIndex).match(/^\s*/)?.[0] || '';
      
      // Satır sonunu bul
      const lineEnd = content.indexOf('\n', startIndex);
      const lineContent = content.substring(startIndex, lineEnd === -1 ? content.length : lineEnd);
      
      // Parantez eşleştirmesi yap
      let parenCount = 0;
      let inString = false;
      let stringChar = null;
      let endIndex = startIndex;
      
      for (let j = 0; j < lineContent.length; j++) {
        const char = lineContent[j];
        if (!inString && (char === '"' || char === "'" || char === '`')) {
          inString = true;
          stringChar = char;
        } else if (inString && char === stringChar && lineContent[j - 1] !== '\\') {
          inString = false;
          stringChar = null;
        } else if (!inString) {
          if (char === '(') parenCount++;
          if (char === ')') {
            parenCount--;
            if (parenCount === 0) {
              endIndex = startIndex + j + 1;
              break;
            }
          }
        }
      }
      
      // Eğer satır içinde kapanmamışsa, sonraki satırları da oku
      if (parenCount > 0) {
        let searchIndex = endIndex;
        while (parenCount > 0 && searchIndex < content.length) {
          const char = content[searchIndex];
          if (char === '(') parenCount++;
          if (char === ')') {
            parenCount--;
            if (parenCount === 0) {
              endIndex = searchIndex + 1;
              break;
            }
          }
          searchIndex++;
        }
      }
      
      // Console statement'ı al
      const consoleStatement = content.substring(startIndex, endIndex);
      
      // __DEV__ kontrolü ekle
      const wrapped = `${indent}if (__DEV__) {\n${indent}  ${consoleStatement}\n${indent}}`;
      
      // Değiştir
      content = content.substring(0, startIndex) + wrapped + content.substring(endIndex);
      modified = true;
      totalWrapped++;
    }
    
    if (modified) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Wrapped console statements in: ${filePath.replace(projectRoot, '')}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\nTotal wrapped: ${totalWrapped}`);
console.log(`Total skipped (already wrapped): ${totalSkipped}`);

