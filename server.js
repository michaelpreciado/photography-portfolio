// Simple development server script for Mario Preciado Photography
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const PORT = process.env.PORT || 8000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject'
};

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Parse URL
  let url = req.url;

  // Handle home page with trailing slash or empty path
  if (url === '/' || url === '') {
    url = '/index.html';
  }

  // Resolve file path
  let filePath = path.join(process.cwd(), url);

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1><p>The requested resource was not found on this server.</p>');
      return;
    }

    // Get file extension
    const ext = path.extname(filePath);
    
    // Set content type based on file extension
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Read and serve file
    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 Not Found</h1><p>The requested resource was not found on this server.</p>');
        } else {
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end(`<h1>500 Server Error</h1><p>${err.code}</p>`);
        }
        return;
      }

      // Set proper caching headers
      const headers = {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      };

      // No cache for HTML files to ensure freshness during development
      if (ext === '.html') {
        headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      }

      // Return the file
      res.writeHead(200, headers);
      res.end(content);
    });
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  
  // Open browser automatically
  const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${command} http://localhost:${PORT}`);

  console.log('Press Ctrl+C to stop the server');
}); 