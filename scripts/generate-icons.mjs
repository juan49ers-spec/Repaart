/**
 * Genera todos los iconos PNG necesarios para la PWA
 * desde el SVG base en public/pwa-192x192.svg
 * 
 * Uso: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');
const svgPath = path.resolve(publicDir, 'pwa-192x192.svg');

const sizes = [32, 57, 60, 64, 72, 76, 114, 120, 144, 152, 180, 192, 256, 512];

async function generate() {
  console.log('🎨 Generando iconos PWA desde SVG...\n');

  for (const size of sizes) {
    const outputPath = path.resolve(publicDir, `pwa-${size}x${size}.png`);
    await sharp(svgPath)
      .resize(size, size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outputPath);
    console.log(`  ✅ pwa-${size}x${size}.png`);
  }

  // Generar también apple-touch-icon (180x180 es el estándar)
  const appleTouchPath = path.resolve(publicDir, 'apple-touch-icon.png');
  await sharp(svgPath)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(appleTouchPath);
  console.log(`  ✅ apple-touch-icon.png (180x180)`);

  // Generar favicon como PNG 32x32
  const faviconPath = path.resolve(publicDir, 'favicon.png');
  await sharp(svgPath)
    .resize(32, 32)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(faviconPath);
  console.log(`  ✅ favicon.png (32x32)`);

  console.log(`\n🎉 ${sizes.length + 2} iconos generados en public/`);
}

generate().catch(console.error);
