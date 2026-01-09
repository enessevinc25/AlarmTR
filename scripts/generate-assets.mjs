import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const sourcePath = join(projectRoot, 'assets-src', 'composite.png');
const outputDir = join(projectRoot, 'assets');

// Ensure output directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Check if source exists
if (!existsSync(sourcePath)) {
  console.error(`❌ Source image not found: ${sourcePath}`);
  console.error('Please place composite.png in assets-src/ folder');
  process.exit(1);
}

console.log('📸 Reading composite image...');
const composite = await sharp(sourcePath);
const metadata = await composite.metadata();
console.log(`   Source size: ${metadata.width}x${metadata.height}`);

if (metadata.width !== 1536 || metadata.height !== 1024) {
  console.warn(`⚠️  Warning: Expected 1536x1024, got ${metadata.width}x${metadata.height}`);
}

// Crop coordinates (based on 1536x1024 composite)
// Sharp extract uses: { left, top, width, height }
const crops = {
  icon: { left: 0, top: 0, width: 768, height: 512 }, // top-left
  adaptive: { left: 768, top: 0, width: 768, height: 512 }, // top-right
  splash: { left: 0, top: 512, width: 1536, height: 512 }, // bottom
};

// 1. Generate icon.png (1024x1024)
// Use 'contain' to preserve full icon without cropping, with transparent background
console.log('🎨 Generating icon.png...');
await composite
  .clone()
  .extract(crops.icon)
  .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png()
  .toFile(join(outputDir, 'icon.png'));
console.log(`   ✅ Created: ${join(outputDir, 'icon.png')}`);

// 2. Generate adaptive-icon-foreground.png (1024x1024)
// Use 'contain' to preserve full icon in safe zone, with transparent background
console.log('🎨 Generating adaptive-icon-foreground.png...');
await composite
  .clone()
  .extract(crops.adaptive)
  .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(join(outputDir, 'adaptive-icon-foreground.png'));
console.log(`   ✅ Created: ${join(outputDir, 'adaptive-icon-foreground.png')}`);

// 3. Generate adaptive-icon-background.png (1024x1024 solid #EAF3FF)
console.log('🎨 Generating adaptive-icon-background.png...');
await sharp({
  create: {
    width: 1024,
    height: 1024,
    channels: 3,
    background: { r: 234, g: 243, b: 255 }, // #EAF3FF
  },
})
  .png()
  .toFile(join(outputDir, 'adaptive-icon-background.png'));
console.log(`   ✅ Created: ${join(outputDir, 'adaptive-icon-background.png')}`);

// 4. Generate splash.png (1242x2436)
console.log('🎨 Generating splash.png...');
const splashCrop = await composite.clone().extract(crops.splash);
const splashMetadata = await splashCrop.metadata();

// Resize to fit width 1242, maintain aspect ratio
const targetWidth = 1242;
const targetHeight = 2436;
const aspectRatio = splashMetadata.width / splashMetadata.height;
const resizedWidth = targetWidth;
const resizedHeight = Math.round(targetWidth / aspectRatio);

// Create canvas with background color #EAF3FF
const splashImage = await splashCrop
  .resize(resizedWidth, resizedHeight, { fit: 'contain', background: { r: 234, g: 243, b: 255 } })
  .toBuffer();

await sharp({
  create: {
    width: targetWidth,
    height: targetHeight,
    channels: 3,
    background: { r: 234, g: 243, b: 255 }, // #EAF3FF
  },
})
  .composite([
    {
      input: splashImage,
      top: Math.round((targetHeight - resizedHeight) / 2), // Center vertically
      left: 0,
    },
  ])
  .png()
  .toFile(join(outputDir, 'splash.png'));
console.log(`   ✅ Created: ${join(outputDir, 'splash.png')}`);

console.log('\n✨ All assets generated successfully!');
console.log('\n📋 Generated files:');
console.log('   - assets/icon.png (1024x1024)');
console.log('   - assets/adaptive-icon-foreground.png (1024x1024)');
console.log('   - assets/adaptive-icon-background.png (1024x1024)');
console.log('   - assets/splash.png (1242x2436)');
console.log('\n💡 Next steps:');
console.log('   1. Review the generated assets');
console.log('   2. Run: npx expo start -c');

