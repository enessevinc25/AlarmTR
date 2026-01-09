#!/usr/bin/env node
/**
 * Console log kontrolü - __DEV__ kontrolü olmayan console.log/warn/error kullanımlarını bulur
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', '.expo', 'coverage'];
const EXCLUDE_FILES = ['check-console-logs.mjs'];

function shouldProcessFile(filePath) {
  const ext = extname(filePath);
  if (!EXTENSIONS.includes(ext)) return false;
  
  const fileName = filePath.split(/[/\\]/).pop();
  if (EXCLUDE_FILES.includes(fileName)) return false;
  
  return true;
}

function shouldProcessDir(dirName) {
  return !EXCLUDE_DIRS.includes(dirName) && !dirName.startsWith('.');
}

function findConsoleLogs(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];
  
  // Console kullanımlarını bul
  const consolePattern = /console\.(log|warn|error|info|debug)\s*\(/g;
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const match = line.match(consolePattern);
    
    if (match) {
      // Bu satırda __DEV__ kontrolü var mı?
      // Önceki satırlarda veya aynı satırda __DEV__ kontrolü olmalı
      const hasDevCheck = 
        line.includes('__DEV__') ||
        (index > 0 && lines[index - 1].includes('__DEV__')) ||
        (index > 1 && lines[index - 2].includes('__DEV__'));
      
      // if (__DEV__) { console... } veya if (__DEV__) console... pattern'i
      const isInDevBlock = 
        line.includes('if (__DEV__)') ||
        (index > 0 && lines[index - 1].trim().startsWith('if (__DEV__)'));
      
      if (!hasDevCheck && !isInDevBlock) {
        // Bazı özel durumlar - backend'de console.log kabul edilebilir
        const isBackend = filePath.includes('transit-api');
        const isErrorBoundary = filePath.includes('ErrorBoundary');
        
        // Backend'de sadece error ve warn kontrol edelim, log'lar production'da da olabilir
        if (isBackend && match[0].includes('console.log')) {
          // Backend log'ları production'da da olabilir, sadece warn/error kontrol edelim
          if (!match[0].includes('console.warn') && !match[0].includes('console.error')) {
            return; // Backend console.log'ları atla
          }
        }
        
        // Kritik exception'lar (catch blokları) prod'da da loglanmalı - bunlar atlanmalı
        // Eğer önceki satırlarda "// Kritik hatalar" veya "catch" varsa, bu bir exception log'u
        const prevLines = lines.slice(Math.max(0, index - 3), index).join('\n');
        const isCriticalException = 
          prevLines.includes('// Kritik hatalar') ||
          prevLines.includes('catch (') ||
          prevLines.includes('} catch');
        
        if (isBackend && isCriticalException && match[0].includes('console.error')) {
          return; // Kritik exception'lar prod'da da loglanmalı, atla
        }
        
        // ErrorBoundary'de console.error kritik, ama yine de __DEV__ kontrolü ekleyelim
        if (!isErrorBoundary || match[0].includes('console.error')) {
          issues.push({
            file: filePath,
            line: lineNum,
            code: line.trim(),
            type: match[0],
          });
        }
      }
    }
  });
  
  return issues;
}

function scanDirectory(dir, baseDir = dir) {
  const issues = [];
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      
      try {
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (shouldProcessDir(entry)) {
            issues.push(...scanDirectory(fullPath, baseDir));
          }
        } else if (stat.isFile() && shouldProcessFile(fullPath)) {
          const fileIssues = findConsoleLogs(fullPath);
          issues.push(...fileIssues);
        }
      } catch (err) {
        // Dosya okunamazsa atla
      }
    }
  } catch (err) {
    // Dizin okunamazsa atla
  }
  
  return issues;
}

// Ana işlem
const srcDir = process.argv[2] || 'src';
const transitApiDir = process.argv[3] || 'transit-api/src';

console.log('🔍 Console log kontrolü başlatılıyor...\n');

const issues = [
  ...scanDirectory(srcDir),
  ...scanDirectory(transitApiDir),
];

if (issues.length === 0) {
  console.log('✅ Tüm console kullanımları __DEV__ kontrolü ile sarmalanmış!');
  process.exit(0);
}

console.log(`⚠️  ${issues.length} adet __DEV__ kontrolü olmayan console kullanımı bulundu:\n`);

// Dosyaya göre grupla
const byFile = {};
issues.forEach(issue => {
  if (!byFile[issue.file]) {
    byFile[issue.file] = [];
  }
  byFile[issue.file].push(issue);
});

Object.keys(byFile).sort().forEach(file => {
  console.log(`\n📄 ${file}`);
  byFile[file].forEach(issue => {
    console.log(`   Line ${issue.line}: ${issue.code.substring(0, 80)}${issue.code.length > 80 ? '...' : ''}`);
  });
});

console.log(`\n📊 Özet: ${issues.length} sorun bulundu`);
process.exit(1);

