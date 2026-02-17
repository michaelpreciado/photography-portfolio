# Mario Preciado Photography Portfolio

Production-ready static photography portfolio with optimized assets, offline caching, and containerized deployment.

## Tech Stack

- HTML/CSS/Vanilla JavaScript
- Service Worker for offline caching
- Node.js build pipeline (`sharp`, `terser`, `csso-cli`)
- Nginx runtime container

## Project Structure

- `index.html`, `portfolio.html`, `about.html`, `contact.html`: Site entry points
- `css/style.css`: Source stylesheet
- `css/style.min.css`: Minified stylesheet output
- `js/script.js`: Main client runtime
- `js/script.min.js`: Minified runtime output
- `sw.js`: Service worker
- `scripts/optimize-images.js`: Image optimization and manifest generation
- `images/optimized/manifest.json`: Generated image manifest
- `Dockerfile`: Multi-stage production image
- `docker-compose.yml`: Local production-like execution
- `.github/workflows/ci.yml`: CI checks for lint/build

## Local Development

1. Install dependencies:
   ```bash
   npm ci
   ```
2. Build assets:
   ```bash
   npm run build
   ```
3. Serve locally:
   ```bash
   npm run serve
   ```
4. Open:
   - [http://localhost:8000](http://localhost:8000)

## Environment Variables

Copy `.env.example` and set values for your environment:

- `NODE_ENV`: `development` or `production`
- `PORT`: local port for static serving workflows
- `SITE_URL`: canonical public URL

## Build and Quality Commands

- `npm run lint`: JavaScript syntax checks
- `npm run test`: Alias to lint checks
- `npm run images`: Regenerate optimized image assets
- `npm run minify`: Minify CSS and JavaScript
- `npm run build`: Full production build (`images + minify`)
- `npm run ci`: Local CI-equivalent checks

## Docker Deployment

Build and run with Docker Compose:

```bash
docker compose up --build
```

Then open:

- [http://localhost:8080](http://localhost:8080)

## Vercel Deployment

This repository includes `vercel.json` with:

- `npm ci` install command
- `npm run build` build command
- clean route rewrites for `/about`, `/portfolio`, and `/contact`
- cache headers for HTML, assets, `sw.js`, and API responses
- a Vercel serverless endpoint at `api/contact.js` for contact form submissions

Deploy steps:

1. Run local checks:
   ```bash
   npm run ci
   ```
2. Deploy preview:
   ```bash
   npx vercel
   ```
3. Deploy production (when ready):
   ```bash
   npx vercel --prod
   ```

Contact form environment variables (Vercel Project Settings -> Environment Variables):

- `RESEND_API_KEY`: Resend API key used for delivery
- `CONTACT_TO_EMAIL`: destination inbox for contact submissions
- `CONTACT_FROM_EMAIL` (optional): sender identity (defaults to `onboarding@resend.dev`)
- `CONTACT_SUBJECT` (optional): custom email subject line

If `RESEND_API_KEY` or `CONTACT_TO_EMAIL` is missing, the API returns `503` so submissions are not silently dropped.

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on pushes and PRs:

1. `npm ci`
2. `npm run lint`
3. `npm run build`

## Security Notes

- No API keys or secrets should be committed; this project is static and should use environment-based configuration for deployment metadata only.
- CSP is defined in each HTML page and should be strengthened further at the CDN/edge layer with response headers.
- Service worker caches only same-origin `GET` requests with destination-aware strategies.
- External third-party scripts were removed from `portfolio.html` to reduce supply-chain exposure.

## Deployment Checklist

1. Run `npm run ci` locally.
2. Deploy with Docker or Vercel (`npx vercel`).
3. Ensure CDN/edge security headers are enabled in production.
4. Validate service worker updates by loading the site, then redeploying a new build.
