#!/usr/bin/env node
// @ts-check

/**
 * Updates CSP media-src directive across all config/HTML files to allow external video hosting.
 * Usage: node scripts/update-video-csp.js https://res.cloudinary.com
 */

const fs = require('fs');
const path = require('path');

const CDN_DOMAIN = process.argv[2];

if (!CDN_DOMAIN) {
  console.error('Usage: node scripts/update-video-csp.js <CDN_DOMAIN>');
  console.error('Example: node scripts/update-video-csp.js https://res.cloudinary.com');
  process.exit(1);
}

const ROOT = process.cwd();

// Extract domain (e.g., "https://res.cloudinary.com" -> "res.cloudinary.com")
const domainMatch = CDN_DOMAIN.match(/https?:\/\/([^\/]+)/);
const domain = domainMatch ? domainMatch[1] : CDN_DOMAIN;
const cdnOrigin = `https://${domain}`;

const originalCSP = "media-src 'self' data:";
const newCSP = `media-src 'self' data: ${cdnOrigin}`;

// Files to update
const files = [
  {
    path: path.join(ROOT, 'vercel.json'),
    pattern: /"Content-Security-Policy":\s*"([^"]*media-src[^"]*)"/,
    replacer: (match) => {
      return match.replace(originalCSP, newCSP);
    }
  },
  {
    path: path.join(ROOT, '_headers'),
    pattern: /Content-Security-Policy: ([^\n]*media-src[^\n]*)/,
    replacer: (match) => {
      return match.replace(originalCSP, newCSP);
    }
  },
  {
    path: path.join(ROOT, 'portfolio.html'),
    pattern: /<meta http-equiv="Content-Security-Policy" content="([^"]*)"/,
    replacer: (match) => {
      return match.replace(originalCSP, newCSP);
    }
  },
  {
    path: path.join(ROOT, 'index.html'),
    pattern: /<meta http-equiv="Content-Security-Policy" content="([^"]*)"/,
    replacer: (match) => {
      return match.replace(originalCSP, newCSP);
    }
  },
  {
    path: path.join(ROOT, 'about.html'),
    pattern: /<meta http-equiv="Content-Security-Policy" content="([^"]*)"/,
    replacer: (match) => {
      return match.replace(originalCSP, newCSP);
    }
  },
  {
    path: path.join(ROOT, 'contact.html'),
    pattern: /<meta http-equiv="Content-Security-Policy" content="([^"]*)"/,
    replacer: (match) => {
      return match.replace(originalCSP, newCSP);
    }
  }
];

let updatedCount = 0;

for (const file of files) {
  if (!fs.existsSync(file.path)) {
    console.warn(`Skipping ${file.path} (not found)`);
    continue;
  }

  let content = fs.readFileSync(file.path, 'utf8');
  const originalContent = content;

  // Replace all occurrences
  content = content.replace(file.pattern, (match) => {
    return file.replacer(match);
  });

  if (content !== originalContent) {
    fs.writeFileSync(file.path, content);
    console.log(`Updated ${path.relative(ROOT, file.path)}`);
    updatedCount++;
  } else {
    console.warn(`No changes in ${path.relative(ROOT, file.path)}`);
  }
}

console.log(`\nCSP updated to allow media from: ${cdnOrigin}`);
console.log(`Files updated: ${updatedCount}`);
console.log('\nNext steps:');
console.log('1. Fill in data/video-sources.json with CDN URLs and poster paths');
console.log('2. Run: npm run media');
console.log('3. Run: npm run build');
