#!/usr/bin/env node
/**
 * Console log düzeltme scripti - __DEV__ kontrolü ekler
 * 
 * Kullanım: node scripts/fix-console-logs.mjs [dry-run]
 * dry-run modunda sadece rapor verir, değişiklik yapmaz
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const EXTENSIONS = ['.ts', '.tsx'];
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', '.expo', 'coverage', '__tests__'];
const EXCLUDE_FILES = ['fix-console-logs.mjs', 'check-console-logs.mjs'];

const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('dry-run');

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

function fixConsoleLogs(content, filePath) {
  const lines = content.split('\n');
  const fixedLines = [];
  let modified = false;
  
  // Backend dosyaları için farklı yaklaşım (production'da da log olabilir)
  const isBackend = filePath.includes('transit-api');
  const isErrorBoundary = filePath.includes('ErrorBoundary');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Console kullanımı var mı?
    const consoleMatch = line.match(/console\.(log|warn|error|info|debug)\s*\(/);
    
    if (consoleMatch) {
      // Zaten __DEV__ kontrolü var mı?
      const hasDevCheck = 
        line.includes('__DEV__') ||
        (i > 0 && lines[i - 1].trim().includes('if (__DEV__)')) ||
        (i > 0 && lines[i - 1].trim().includes('if(__DEV__)'));
      
      // Zaten sarmalanmış mı?
      const isWrapped = 
        (i > 0 && lines[i - 1].trim().startsWith('if (__DEV__) {')) ||
        (i > 0 && lines[i - 1].trim().startsWith('if(__DEV__) {')) ||
        line.includes('if (__DEV__)') ||
        line.includes('if(__DEV__)');
      
      if (!hasDevCheck && !isWrapped) {
        // Backend'de console.log'lar production'da da olabilir, sadece warn/error için __DEV__ ekle
        if (isBackend && consoleMatch[0].includes('console.log')) {
          // Backend log'ları atla (production'da da olabilir)
          fixedLines.push(line);
          continue;
        }
        
        // ErrorBoundary'de console.error kritik, ama yine de __DEV__ ekleyelim
        // Satırın indent'ini al
        const indent = line.match(/^(\s*)/)?.[1] || '';
        
        // Önceki satırları kontrol et - eğer bir if bloğu içindeyse, sadece __DEV__ ekle
        let prevLine = i > 0 ? lines[i - 1].trim() : '';
        let prevPrevLine = i > 1 ? lines[i - 2].trim() : '';
        
        // Eğer önceki satır bir if bloğu açıyorsa, sadece içine __DEV__ ekle
        if (prevLine.startsWith('if (') || prevLine.startsWith('if(')) {
          // Zaten bir if bloğu var, sadece console satırını değiştir
          fixedLines.push(line);
          continue;
        }
        
        // Yeni if (__DEV__) bloğu ekle
        fixedLines.push(`${indent}if (__DEV__) {`);
        fixedLines.push(`${indent}  ${line.trim()}`);
        fixedLines.push(`${indent}}`);
        modified = true;
        continue;
      }
    }
    
    fixedLines.push(line);
  }
  
  return { content: fixedLines.join('\n'), modified };
}

function processFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const { content: fixedContent, modified } = fixConsoleLogs(content, filePath);
    
    if (modified) {
      if (DRY_RUN) {
        console.log(`[DRY-RUN] Would fix: ${filePath}`);
        return { fixed: true, file: filePath };
      } else {
        writeFileSync(filePath, fixedContent, 'utf-8');
        console.log(`✅ Fixed: ${filePath}`);
        return { fixed: true, file: filePath };
      }
    }
    
    return { fixed: false, file: filePath };
  } catch (err) {
    console.error(`❌ Error processing ${filePath}:`, err.message);
    return { fixed: false, file: filePath, error: err.message };
  }
}

function scanDirectory(dir, baseDir = dir) {
  const results = [];
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      
      try {
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (shouldProcessDir(entry)) {
            results.push(...scanDirectory(fullPath, baseDir));
          }
        } else if (stat.isFile() && shouldProcessFile(fullPath)) {
          results.push(processFile(fullPath));
        }
      } catch (err) {
        // Dosya okunamazsa atla
      }
    }
  } catch (err) {
    // Dizin okunamazsa atla
  }
  
  return results;
}

// Ana işlem
console.log(DRY_RUN ? '🔍 DRY-RUN: Console log düzeltme kontrolü...\n' : '🔧 Console log düzeltme başlatılıyor...\n');

const results = [
  ...scanDirectory('src'),
  ...scanDirectory('transit-api/src'),
];

const fixed = results.filter(r => r.fixed);
const errors = results.filter(r => r.error);

console.log(`\n📊 Özet:`);
console.log(`   ✅ Düzeltilen: ${fixed.length} dosya`);
if (errors.length > 0) {
  console.log(`   ❌ Hatalar: ${errors.length} dosya`);
}

if (DRY_RUN && fixed.length > 0) {
  console.log(`\n💡 Gerçek düzeltme için: node scripts/fix-console-logs.mjs`);
  process.exit(0);
} else if (fixed.length > 0) {
  console.log(`\n✅ Tamamlandı!`);
  process.exit(0);
} else {
  console.log(`\n✅ Tüm console kullanımları zaten __DEV__ kontrolü ile sarmalanmış!`);
  process.exit(0);
}
