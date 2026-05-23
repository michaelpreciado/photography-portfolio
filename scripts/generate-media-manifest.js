#!/usr/bin/env node
// @ts-check

/**
 * Generates a client-consumable media manifest from images/portfolio.
 * Drop images/videos into category folders, run `npm run media`, and the site updates.
 */

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const PORTFOLIO_DIR = path.join(ROOT, 'images', 'portfolio');
const OUTPUT_PATH = path.join(ROOT, 'data', 'media.json');
const POSTER_DIR = path.join(ROOT, 'images', 'video-posters');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v']);

const CATEGORY_LABELS = {
  'live-music': 'Live Music',
  visuals: 'Visuals'
};

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCase(value) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function publicPath(absolutePath) {
  return path.relative(ROOT, absolutePath).split(path.sep).join('/');
}

async function walk(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function makeAlt(categoryLabel, filePath, type) {
  const name = path.basename(filePath, path.extname(filePath))
    .replace(/^portfolio[_-]?/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();

  const suffix = name ? ` ${name}` : '';
  return `${categoryLabel}${suffix} ${type === 'video' ? 'video' : 'photography'}`.replace(/\s+/g, ' ').trim();
}

async function ensureVideoPoster(videoPath, categorySlug) {
  const posterName = `${categorySlug}-${path.basename(videoPath, path.extname(videoPath))}.jpg`;
  const posterPath = path.join(POSTER_DIR, posterName);

  if (fs.existsSync(posterPath)) {
    return publicPath(posterPath);
  }

  const ffmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (ffmpeg.status !== 0) {
    return '';
  }

  await fsp.mkdir(POSTER_DIR, { recursive: true });
  const result = spawnSync('ffmpeg', [
    '-y',
    '-ss', '00:00:01',
    '-i', videoPath,
    '-frames:v', '1',
    '-vf', 'scale=960:-1',
    '-q:v', '4',
    posterPath
  ], { stdio: 'ignore' });

  return result.status === 0 ? publicPath(posterPath) : '';
}

async function main() {
  if (!fs.existsSync(PORTFOLIO_DIR)) {
    throw new Error(`Missing portfolio directory: ${PORTFOLIO_DIR}`);
  }

  const categoryDirs = (await fsp.readdir(PORTFOLIO_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  const categories = [];

  for (const categoryDir of categoryDirs) {
    const categorySlug = slugify(categoryDir.name);
    const label = CATEGORY_LABELS[categorySlug] || titleCase(categoryDir.name);
    const files = (await walk(path.join(PORTFOLIO_DIR, categoryDir.name)))
      .sort((a, b) => a.localeCompare(b));

    const media = [];
    for (const file of files) {
      const extension = path.extname(file).toLowerCase();
      const basename = path.basename(file).toLowerCase();
      // Keep brand/decorative assets out of client galleries while preserving them on disk.
      if (basename === 'disc.png') continue;

      const type = VIDEO_EXTENSIONS.has(extension) ? 'video' : IMAGE_EXTENSIONS.has(extension) ? 'image' : null;
      if (!type) continue;

      media.push({
        type,
        src: publicPath(file),
        poster: type === 'video' ? await ensureVideoPoster(file, categorySlug) : '',
        alt: makeAlt(label, file, type)
      });
    }

    categories.push({
      id: categorySlug,
      label,
      accent: categorySlug === 'visuals' ? 'cyan' : 'magenta',
      media
    });
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    instructions: 'Drop media into images/portfolio/<category>/ and run npm run media. Run npm run images for responsive image derivatives.',
    categories
  };

  await fsp.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fsp.writeFile(OUTPUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Generated ${publicPath(OUTPUT_PATH)} with ${categories.reduce((sum, category) => sum + category.media.length, 0)} media items.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
