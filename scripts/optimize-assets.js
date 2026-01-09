/**
 * Asset Optimization Script
 * 
 * Bu script görselleri optimize eder ve doğru boyutlara getirir.
 * Kullanım: node scripts/optimize-assets.js
 */

const fs = require('fs');
const path = require('path');

// Sharp kütüphanesi gerekli (npm install sharp)
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Sharp kütüphanesi bulunamadı. Yüklemek için: npm install sharp');
  process.exit(1);
}

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

// Hedef boyutlar
const TARGET_SIZES = {
  'icon.png': { width: 1024, height: 1024 },
  'splash.png': { width: 2048, height: 2048 }, // veya 1242x2436 (iPhone)
  'adaptive-icon-foreground.png': { width: 1024, height: 1024 },
  'adaptive-icon-background.png': { width: 1024, height: 1024 },
};

async function optimizeAsset(filename) {
  const inputPath = path.join(ASSETS_DIR, filename);
  const outputPath = path.join(ASSETS_DIR, filename + '.optimized');
  
  if (!fs.existsSync(inputPath)) {
    console.warn(`⚠️  ${filename} bulunamadı, atlanıyor...`);
    return;
  }

  const targetSize = TARGET_SIZES[filename];
  if (!targetSize) {
    console.warn(`⚠️  ${filename} için hedef boyut tanımlı değil, atlanıyor...`);
    return;
  }

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    console.log(`📸 ${filename}: ${metadata.width}x${metadata.height}px → ${targetSize.width}x${targetSize.height}px`);

    // Boyut kontrolü ve resize
    if (metadata.width !== targetSize.width || metadata.height !== targetSize.height) {
      await image
        .resize(targetSize.width, targetSize.height, {
          fit: filename.includes('adaptive-icon-foreground') ? 'contain' : 'cover',
          background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
        })
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(outputPath);
      
      // Orijinal dosyayı yedekle
      const backupPath = path.join(ASSETS_DIR, filename + '.backup');
      fs.copyFileSync(inputPath, backupPath);
      
      // Optimize edilmiş dosyayı orijinal yerine koy
      fs.renameSync(outputPath, inputPath);
      
      console.log(`✅ ${filename} optimize edildi ve yedeklendi (${filename}.backup)`);
    } else {
      console.log(`✓ ${filename} zaten doğru boyutta`);
    }
  } catch (error) {
    console.error(`❌ ${filename} optimize edilirken hata:`, error.message);
  }
}

async function main() {
  console.log('🚀 Asset optimizasyonu başlatılıyor...\n');
  
  for (const filename of Object.keys(TARGET_SIZES)) {
    await optimizeAsset(filename);
  }
  
  console.log('\n✅ Asset optimizasyonu tamamlandı!');
}

main().catch(console.error);

