/**
 * Icon Fix Script
 * 
 * Windows uyumlu icon düzeltme script'i (jimp kullanarak, sharp yok)
 * - icon.png: near-white dışındaki piksellerin bbox'ını bul, crop et, 1024x1024 resize
 * - adaptive-icon-foreground.png: alpha>0 bbox bul, içerik küçükse scale up, 1024x1024 şeffaf canvas'a ortala
 */

import Jimp from 'jimp';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const ICON_PATH = join(rootDir, 'assets', 'icon.png');
const ADAPTIVE_FOREGROUND_PATH = join(rootDir, 'assets', 'adaptive-icon-foreground.png');
const TARGET_SIZE = 1024;

/**
 * RGB değerinin near-white olup olmadığını kontrol et (RGB > 245)
 */
function isNearWhite(r, g, b) {
  return r > 245 && g > 245 && b > 245;
}

/**
 * Icon.png için: near-white dışındaki piksellerin bounding box'ını bul
 */
async function fixIcon() {
  if (!existsSync(ICON_PATH)) {
    console.warn(`[fix-icons] ${ICON_PATH} bulunamadı, atlanıyor`);
    return;
  }

  console.log(`[fix-icons] ${ICON_PATH} işleniyor...`);
  
  try {
    // Backup oluştur
    const backupPath = ICON_PATH.replace('.png', '.original.png');
    if (!existsSync(backupPath)) {
      const originalData = readFileSync(ICON_PATH);
      writeFileSync(backupPath, originalData);
      console.log(`[fix-icons] Backup oluşturuldu: ${backupPath}`);
    }

    const image = await Jimp.read(ICON_PATH);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    // Bounding box bul: near-white olmayan piksellerin min/max koordinatları
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let foundNonWhite = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = Jimp.intToRGBA(image.getPixelColor(x, y));
        if (!isNearWhite(color.r, color.g, color.b)) {
          foundNonWhite = true;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (!foundNonWhite) {
      console.warn(`[fix-icons] ${ICON_PATH} içinde near-white olmayan piksel bulunamadı, atlanıyor`);
      return;
    }

    // Bounding box'ı kareye genişlet
    const bboxWidth = maxX - minX + 1;
    const bboxHeight = maxY - minY + 1;
    const bboxSize = Math.max(bboxWidth, bboxHeight);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const cropX = Math.max(0, Math.floor(centerX - bboxSize / 2));
    const cropY = Math.max(0, Math.floor(centerY - bboxSize / 2));
    const cropSize = Math.min(bboxSize, Math.min(width - cropX, height - cropY));

    // Crop et
    const cropped = image.clone().crop(cropX, cropY, cropSize, cropSize);
    
    // 1024x1024 resize
    const resized = cropped.resize(TARGET_SIZE, TARGET_SIZE, Jimp.RESIZE_LANCZOS);
    
    // Kaydet
    await resized.writeAsync(ICON_PATH);
    console.log(`[fix-icons] ${ICON_PATH} düzeltildi: ${width}x${height} -> ${TARGET_SIZE}x${TARGET_SIZE}`);
  } catch (error) {
    console.error(`[fix-icons] ${ICON_PATH} işlenirken hata:`, error.message);
    throw error;
  }
}

/**
 * Adaptive icon foreground için: alpha>0 bbox bul, scale up gerekirse yap, ortala
 */
async function fixAdaptiveForeground() {
  if (!existsSync(ADAPTIVE_FOREGROUND_PATH)) {
    console.warn(`[fix-icons] ${ADAPTIVE_FOREGROUND_PATH} bulunamadı, atlanıyor`);
    return;
  }

  console.log(`[fix-icons] ${ADAPTIVE_FOREGROUND_PATH} işleniyor...`);
  
  try {
    // Backup oluştur
    const backupPath = ADAPTIVE_FOREGROUND_PATH.replace('.png', '.original.png');
    if (!existsSync(backupPath)) {
      const originalData = readFileSync(ADAPTIVE_FOREGROUND_PATH);
      writeFileSync(backupPath, originalData);
      console.log(`[fix-icons] Backup oluşturuldu: ${backupPath}`);
    }

    const image = await Jimp.read(ADAPTIVE_FOREGROUND_PATH);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    // Alpha>0 olan piksellerin bounding box'ını bul
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let foundAlpha = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = Jimp.intToRGBA(image.getPixelColor(x, y));
        if (color.a > 0) {
          foundAlpha = true;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (!foundAlpha) {
      console.warn(`[fix-icons] ${ADAPTIVE_FOREGROUND_PATH} içinde alpha>0 piksel bulunamadı, atlanıyor`);
      return;
    }

    // Bounding box'ı crop et
    const bboxWidth = maxX - minX + 1;
    const bboxHeight = maxY - minY + 1;
    const cropped = image.clone().crop(minX, minY, bboxWidth, bboxHeight);

    // İçerik çok küçükse scale up (target: canvas'ın ~80% max dimension)
    const targetMaxDimension = Math.floor(TARGET_SIZE * 0.8);
    const currentMaxDimension = Math.max(bboxWidth, bboxHeight);
    
    let processed = cropped;
    if (currentMaxDimension < targetMaxDimension) {
      const scale = targetMaxDimension / currentMaxDimension;
      const newWidth = Math.floor(bboxWidth * scale);
      const newHeight = Math.floor(bboxHeight * scale);
      processed = cropped.resize(newWidth, newHeight, Jimp.RESIZE_LANCZOS);
      console.log(`[fix-icons] İçerik scale up edildi: ${bboxWidth}x${bboxHeight} -> ${newWidth}x${newHeight}`);
    }

    // 1024x1024 şeffaf canvas oluştur
    const canvas = new Jimp(TARGET_SIZE, TARGET_SIZE, 0x00000000); // Şeffaf siyah
    
    // İçeriği ortala
    const offsetX = Math.floor((TARGET_SIZE - processed.bitmap.width) / 2);
    const offsetY = Math.floor((TARGET_SIZE - processed.bitmap.height) / 2);
    canvas.composite(processed, offsetX, offsetY);
    
    // Kaydet
    await canvas.writeAsync(ADAPTIVE_FOREGROUND_PATH);
    console.log(`[fix-icons] ${ADAPTIVE_FOREGROUND_PATH} düzeltildi: ${width}x${height} -> ${TARGET_SIZE}x${TARGET_SIZE} (ortalandı)`);
  } catch (error) {
    console.error(`[fix-icons] ${ADAPTIVE_FOREGROUND_PATH} işlenirken hata:`, error.message);
    throw error;
  }
}

// Ana fonksiyon
async function main() {
  console.log('[fix-icons] Icon düzeltme başlatılıyor...');
  
  try {
    await fixIcon();
    await fixAdaptiveForeground();
    console.log('[fix-icons] Tüm icon\'lar başarıyla düzeltildi!');
  } catch (error) {
    console.error('[fix-icons] Hata:', error);
    process.exit(1);
  }
}

main();

