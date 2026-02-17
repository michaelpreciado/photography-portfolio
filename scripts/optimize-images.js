#!/usr/bin/env node

// @ts-check

/**
 * High-performance image optimization pipeline.
 * Generates responsive AVIF, WebP, and JPEG variants plus a manifest.
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { globSync } = require('glob');
const { createHash } = require('crypto');

const CONFIG = {
  inputDir: 'images/portfolio',
  outputDir: 'images/optimized',
  sizes: [320, 640, 960, 1280, 1600, 2048],
  formats: ['avif', 'webp', 'jpeg'],
  quality: {
    avif: 60,
    webp: 80,
    jpeg: 85
  },
  lqipSize: 20,
  maxConcurrency: 4
};

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

const logger = {
  info(event, meta) {
    console.info(JSON.stringify({ level: 'info', event, ...(meta || {}) }));
  },
  warn(event, meta) {
    console.warn(JSON.stringify({ level: 'warn', event, ...(meta || {}) }));
  },
  error(event, meta) {
    console.error(JSON.stringify({ level: 'error', event, ...(meta || {}) }));
  }
};

/**
 * @param {string} dir
 */
async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * @param {Buffer} buffer
 */
function generateHash(buffer) {
  return createHash('md5').update(buffer).digest('hex').substring(0, 8);
}

/**
 * @param {string} inputPath
 */
function isSafeImagePath(inputPath) {
  const normalized = path.normalize(inputPath);
  const relative = path.relative(CONFIG.inputDir, normalized);
  const extension = path.extname(normalized).toLowerCase();

  return !relative.startsWith('..')
    && !path.isAbsolute(relative)
    && ALLOWED_EXTENSIONS.has(extension);
}

/**
 * @param {string} inputPath
 */
async function generateLQIP(inputPath) {
  try {
    const lqipBuffer = await sharp(inputPath)
      .resize(CONFIG.lqipSize, CONFIG.lqipSize, { fit: 'inside' })
      .blur(1)
      .jpeg({ quality: 30 })
      .toBuffer();

    return `data:image/jpeg;base64,${lqipBuffer.toString('base64')}`;
  } catch (error) {
    logger.warn('lqip_generation_failed', { inputPath, error: String(error) });
    return null;
  }
}

/**
 * @param {string} inputPath
 * @param {string} outputDir
 */
async function processImage(inputPath, outputDir) {
  if (!isSafeImagePath(inputPath)) {
    throw new Error(`Unsafe or unsupported image path: ${inputPath}`);
  }

  const filename = path.basename(inputPath, path.extname(inputPath));
  const inputBuffer = await fs.readFile(inputPath);
  const hash = generateHash(inputBuffer);

  /** @type {{ original: string, formats: Record<string, Record<number, string>>, lqip: string | null }} */
  const results = {
    original: inputPath,
    formats: {},
    lqip: null
  };

  logger.info('image_processing_started', { filename });
  results.lqip = await generateLQIP(inputPath);

  for (const format of CONFIG.formats) {
    results.formats[format] = {};

    for (const size of CONFIG.sizes) {
      const outputFilename = `${filename}-${size}-${hash}.${format}`;
      const outputPath = path.join(outputDir, outputFilename);

      try {
        let pipeline = sharp(inputBuffer)
          .resize(size, null, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .normalize()
          .sharpen()
          .toColorspace('srgb');

        switch (format) {
          case 'avif':
            pipeline = pipeline.avif({ quality: CONFIG.quality.avif, effort: 6 });
            break;
          case 'webp':
            pipeline = pipeline.webp({ quality: CONFIG.quality.webp, effort: 6, nearLossless: false });
            break;
          case 'jpeg':
            pipeline = pipeline.jpeg({ quality: CONFIG.quality.jpeg, progressive: true, mozjpeg: true });
            break;
          default:
            throw new Error(`Unsupported format: ${format}`);
        }

        await pipeline.toFile(outputPath);
        results.formats[format][size] = outputFilename;
      } catch (error) {
        logger.error('image_variant_failed', { filename, size, format, error: String(error) });
      }
    }
  }

  return results;
}

/**
 * @param {Record<string, Record<number, string>>} formats
 * @param {string} [baseUrl]
 */
function generateSrcSet(formats, baseUrl = 'images/optimized/') {
  /** @type {Record<string, string>} */
  const srcsets = {};

  for (const [format, sizes] of Object.entries(formats)) {
    const srcsetArray = CONFIG.sizes
      .filter((size) => sizes[size])
      .map((size) => `${baseUrl}${sizes[size]} ${size}w`);

    if (srcsetArray.length > 0) {
      srcsets[format] = srcsetArray.join(', ');
    }
  }

  return srcsets;
}

/**
 * @param {{ original: string, formats: Record<string, Record<number, string>>, lqip: string | null }} imageData
 * @param {string} alt
 * @param {string} [sizes]
 * @param {'eager'|'lazy'} [loading]
 */
function generatePictureHTML(imageData, alt, sizes = '(max-width: 768px) 100vw, 50vw', loading = 'lazy') {
  const srcsets = generateSrcSet(imageData.formats);

  let html = '<picture>\n';

  if (srcsets.avif) {
    html += `  <source srcset="${srcsets.avif}" sizes="${sizes}" type="image/avif">\n`;
  }

  if (srcsets.webp) {
    html += `  <source srcset="${srcsets.webp}" sizes="${sizes}" type="image/webp">\n`;
  }

  const fallbackSrc = imageData.formats.jpeg && imageData.formats.jpeg[640]
    ? `images/optimized/${imageData.formats.jpeg[640]}`
    : imageData.original;

  html += `  <img src="${fallbackSrc}"`;
  if (srcsets.jpeg) {
    html += ` srcset="${srcsets.jpeg}"`;
  }
  html += ` sizes="${sizes}"`;
  html += ` alt="${alt}"`;
  html += ` loading="${loading}"`;
  html += ' decoding="async"';

  if (imageData.lqip) {
    html += ` style="background-image: url('${imageData.lqip}'); background-size: cover;"`;
  }

  html += '>\n';
  html += '</picture>';

  return html;
}

async function processAllImages() {
  const startedAt = Date.now();
  logger.info('optimization_started');

  await ensureDir(CONFIG.outputDir);

  const imageFiles = globSync(`${CONFIG.inputDir}/**/*.{jpg,jpeg,png,JPG,JPEG,PNG}`, {
    ignore: ['**/node_modules/**', '**/optimized/**']
  }).filter(isSafeImagePath);

  logger.info('images_discovered', { count: imageFiles.length });

  if (imageFiles.length === 0) {
    logger.warn('no_images_found');
    return;
  }

  const results = [];

  for (let index = 0; index < imageFiles.length; index += CONFIG.maxConcurrency) {
    const batch = imageFiles.slice(index, index + CONFIG.maxConcurrency);
    const batchResults = await Promise.all(batch.map((file) => processImage(file, CONFIG.outputDir)));
    results.push(...batchResults);

    logger.info('batch_completed', {
      batch: Math.floor(index / CONFIG.maxConcurrency) + 1,
      totalBatches: Math.ceil(imageFiles.length / CONFIG.maxConcurrency)
    });
  }

  const manifest = {
    generated: new Date().toISOString(),
    config: CONFIG,
    images: results
  };

  await fs.writeFile(
    path.join(CONFIG.outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  const pictureExamples = results.slice(0, 3).map((img) => {
    const filename = path.basename(img.original, path.extname(img.original));
    return {
      filename,
      hero: generatePictureHTML(img, `${filename} photography`, '100vw', 'eager'),
      gallery: generatePictureHTML(img, `${filename} photography`, '(max-width: 768px) 100vw, 50vw', 'lazy')
    };
  });

  await fs.writeFile(
    path.join(CONFIG.outputDir, 'picture-examples.json'),
    JSON.stringify(pictureExamples, null, 2)
  );

  const totalInputSize = (await Promise.all(
    imageFiles.map(async (file) => (await fs.stat(file)).size)
  )).reduce((sum, bytes) => sum + bytes, 0);

  logger.info('optimization_completed', {
    imageCount: imageFiles.length,
    durationSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(2)),
    totalInputMegabytes: Number((totalInputSize / 1024 / 1024).toFixed(2))
  });
}

if (require.main === module) {
  processAllImages().catch((error) => {
    logger.error('optimization_failed', { error: String(error) });
    process.exit(1);
  });
}

module.exports = {
  processImage,
  generatePictureHTML,
  processAllImages
};
