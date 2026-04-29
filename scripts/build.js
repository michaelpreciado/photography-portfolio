#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = 'public';

console.log('Building for Vercel deployment...\n');

// Step 1: Prepare output directory
console.log('Step 1: Preparing build output directory');
execSync('node scripts/prepare-build-output.js');

// Step 2: Generate media manifest
console.log('\nStep 2: Generating media manifest');
process.chdir(PUBLIC_DIR);
execSync('node ../scripts/generate-media-manifest.js');
process.chdir('..');

// Step 3: Optimize images
console.log('\nStep 3: Optimizing images (this may take several minutes)');
process.chdir(PUBLIC_DIR);
execSync('node ../scripts/optimize-images.js');
process.chdir('..');

// Step 4: Minify assets
console.log('\nStep 4: Minifying CSS and JavaScript');
process.chdir(PUBLIC_DIR);
execSync('csso css/style.css --output css/style.min.css --source-map file');
execSync('terser js/script.js -o js/script.min.js --compress --mangle --source-map "content=inline"');
process.chdir('..');

console.log('\n✓ Build completed successfully!');
console.log(`✓ Output ready in ${PUBLIC_DIR}/ directory for deployment`);
