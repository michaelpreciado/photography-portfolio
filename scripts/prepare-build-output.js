#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = 'public';
const SOURCE_DIR = '.';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyDir(src, dest, options = {}) {
  const { ignore = [] } = options;

  if (!fs.existsSync(src)) return;

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (ignore.includes(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      ensureDir(destPath);
      copyDir(srcPath, destPath, options);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyFile(src, dest) {
  const dir = path.dirname(dest);
  ensureDir(dir);
  fs.copyFileSync(src, dest);
}

// Clean and create public directory
if (fs.existsSync(PUBLIC_DIR)) {
  fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
}
ensureDir(PUBLIC_DIR);

// Copy all necessary files and directories
const ignorePatterns = [
  'node_modules',
  '.git',
  '.github',
  '.vercel',
  'public',
  'scripts',
  '__tests__',
  '.codex',
  '.vscode',
  'docs',
  'images/portfolio', // We'll copy optimized versions later
];

// Copy root files
const rootFiles = fs.readdirSync(SOURCE_DIR);
for (const file of rootFiles) {
  if (ignorePatterns.includes(file)) continue;
  if (file.startsWith('.') && !['_headers', '.htaccess'].includes(file)) continue;

  const src = path.join(SOURCE_DIR, file);
  const dest = path.join(PUBLIC_DIR, file);
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    ensureDir(dest);
    copyDir(src, dest);
  } else if (stat.isFile()) {
    copyFile(src, dest);
  }
}

// Copy HTML files
['index.html', 'about.html', 'contact.html', 'portfolio.html'].forEach(file => {
  if (fs.existsSync(file)) {
    copyFile(file, path.join(PUBLIC_DIR, file));
  }
});

// Copy special files
if (fs.existsSync('_headers')) copyFile('_headers', path.join(PUBLIC_DIR, '_headers'));
if (fs.existsSync('.htaccess')) copyFile('.htaccess', path.join(PUBLIC_DIR, '.htaccess'));

console.log('Build output prepared in public/ directory');
