#!/usr/bin/env node

/**
 * High-Performance Image Optimization Pipeline
 * Generates responsive images in AVIF, WebP, and JPEG formats
 * Optimized for 120fps performance and fast loading
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const crypto = require('crypto');

// Configuration
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
  lqipSize: 20, // Low Quality Image Placeholder size
  maxConcurrency: 4 // Limit concurrent operations to prevent memory issues
};

// Ensure output directory exists
async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Generate content hash for cache busting
function generateHash(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex').substring(0, 8);
}

// Generate LQIP (Low Quality Image Placeholder)
async function generateLQIP(inputPath, outputPath) {
  try {
    const lqipBuffer = await sharp(inputPath)
      .resize(CONFIG.lqipSize, CONFIG.lqipSize, { fit: 'inside' })
      .blur(1)
      .jpeg({ quality: 30 })
      .toBuffer();
    
    const base64 = `data:image/jpeg;base64,${lqipBuffer.toString('base64')}`;
    return base64;
  } catch (error) {
    console.error(`Error generating LQIP for ${inputPath}:`, error.message);
    return null;
  }
}

// Process single image
async function processImage(inputPath, outputDir) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const inputBuffer = await fs.readFile(inputPath);
  const hash = generateHash(inputBuffer);
  
  const results = {
    original: inputPath,
    formats: {},
    lqip: null
  };

  console.log(`Processing: ${filename}`);

  // Generate LQIP
  results.lqip = await generateLQIP(inputPath);

  // Process each format
  for (const format of CONFIG.formats) {
    results.formats[format] = {};
    
    // Process each size
    for (const size of CONFIG.sizes) {
      const outputFilename = `${filename}-${size}-${hash}.${format}`;
      const outputPath = path.join(outputDir, outputFilename);
      
      try {
        let pipeline = sharp(inputBuffer)
          .resize(size, null, { 
            withoutEnlargement: true,
            fit: 'inside'
          })
          .normalize() // Enhance contrast
          .sharpen(); // Enhance sharpness
        
        // Strip EXIF and enforce sRGB
        pipeline = pipeline.withMetadata({
          exif: {},
          icc: 'srgb'
        });

        // Apply format-specific optimizations
        switch (format) {
          case 'avif':
            pipeline = pipeline.avif({ 
              quality: CONFIG.quality.avif,
              effort: 6 // Higher effort for better compression
            });
            break;
          case 'webp':
            pipeline = pipeline.webp({ 
              quality: CONFIG.quality.webp,
              effort: 6,
              nearLossless: false
            });
            break;
          case 'jpeg':
            pipeline = pipeline.jpeg({ 
              quality: CONFIG.quality.jpeg,
              progressive: true,
              mozjpeg: true
            });
            break;
        }

        await pipeline.toFile(outputPath);
        results.formats[format][size] = outputFilename;
        
      } catch (error) {
        console.error(`Error processing ${filename} at ${size}px in ${format}:`, error.message);
      }
    }
  }

  return results;
}

// Generate srcset strings
function generateSrcSet(formats, size, baseUrl = 'images/optimized/') {
  const srcsets = {};
  
  for (const [format, sizes] of Object.entries(formats)) {
    const srcsetArray = CONFIG.sizes
      .filter(s => sizes[s])
      .map(s => `${baseUrl}${sizes[s]} ${s}w`);
    
    if (srcsetArray.length > 0) {
      srcsets[format] = srcsetArray.join(', ');
    }
  }
  
  return srcsets;
}

// Generate picture element HTML
function generatePictureHTML(imageData, alt, sizes = '(max-width: 768px) 100vw, 50vw', loading = 'lazy') {
  const srcsets = generateSrcSet(imageData.formats);
  
  let html = `<picture>\n`;
  
  // AVIF source (best compression)
  if (srcsets.avif) {
    html += `  <source srcset="${srcsets.avif}" sizes="${sizes}" type="image/avif">\n`;
  }
  
  // WebP source (good compression, wide support)
  if (srcsets.webp) {
    html += `  <source srcset="${srcsets.webp}" sizes="${sizes}" type="image/webp">\n`;
  }
  
  // JPEG fallback (universal support)
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
  html += ` decoding="async"`;
  if (imageData.lqip) {
    html += ` style="background-image: url('${imageData.lqip}'); background-size: cover;"`;
  }
  html += `>\n`;
  html += `</picture>`;
  
  return html;
}

// Process all images with concurrency control
async function processAllImages() {
  console.log('🖼️  Starting image optimization pipeline...\n');
  
  const startTime = Date.now();
  
  // Ensure output directory exists
  await ensureDir(CONFIG.outputDir);
  
  // Find all image files
  const imageFiles = glob.sync(`${CONFIG.inputDir}/**/*.{jpg,jpeg,png,JPG,JPEG,PNG}`, {
    ignore: ['**/node_modules/**', '**/optimized/**']
  });
  
  console.log(`Found ${imageFiles.length} images to process\n`);
  
  if (imageFiles.length === 0) {
    console.log('No images found to process.');
    return;
  }
  
  const results = [];
  
  // Process images in batches to control memory usage
  for (let i = 0; i < imageFiles.length; i += CONFIG.maxConcurrency) {
    const batch = imageFiles.slice(i, i + CONFIG.maxConcurrency);
    const batchPromises = batch.map(file => processImage(file, CONFIG.outputDir));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    console.log(`Completed batch ${Math.floor(i / CONFIG.maxConcurrency) + 1}/${Math.ceil(imageFiles.length / CONFIG.maxConcurrency)}`);
  }
  
  // Generate image manifest
  const manifest = {
    generated: new Date().toISOString(),
    config: CONFIG,
    images: results
  };
  
  await fs.writeFile(
    path.join(CONFIG.outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  // Generate picture elements examples
  const pictureExamples = results.slice(0, 3).map((img, index) => {
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
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n✅ Image optimization complete!`);
  console.log(`📊 Processed ${imageFiles.length} images in ${duration}s`);
  console.log(`📁 Optimized images saved to: ${CONFIG.outputDir}/`);
  console.log(`📋 Manifest saved to: ${CONFIG.outputDir}/manifest.json`);
  console.log(`🖼️  Picture element examples: ${CONFIG.outputDir}/picture-examples.json`);
  
  // Calculate total file size savings
  const inputStats = await Promise.all(
    imageFiles.map(async file => (await fs.stat(file)).size)
  );
  const totalInputSize = inputStats.reduce((a, b) => a + b, 0);
  
  console.log(`💾 Original total size: ${(totalInputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`🚀 Ready for 120fps performance!`);
}

// Handle CLI execution
if (require.main === module) {
  processAllImages().catch(error => {
    console.error('❌ Image optimization failed:', error);
    process.exit(1);
  });
}

module.exports = {
  processImage,
  generatePictureHTML,
  processAllImages
};
