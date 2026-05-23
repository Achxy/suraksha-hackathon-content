# SuRaksha Hackathon Content Repository

Monorepo for SuRaksha hackathon parts. Each part is an isolated Storybook static site.

## Quick Start

```bash
npm install
npm run storybook
```

## Adding a New Part

```bash
# 1. Create the part directory
mkdir parts/part-2

# 2. Generate a random slug
npm run new-slug
# Example output: Y72mPqkLz03vBn

# 3. Create parts/part-2/part.config.json
# Use the slug as the last entry in routeParts

# 4. Add stories and MDX files

# 5. Push to main - CI builds and packages automatically
```

## part.config.json

```json
{
  "schemaVersion": 1,
  "id": "my-part-id",
  "title": "My Part Title",
  "routeParts": ["hackathons", "event-name", "part-slug", "randomSlug"],
  "sourceDir": "parts/part-2"
}
```

## Route Structure

Final URL: `https://mydomain.com/${routeParts.join("/")}/`

Example: `https://mydomain.com/hackathons/suraksha/anomaly-detection/1a2b3c4d5e6f7g8h/`

## Scripts

| Script | Description |
|--------|-------------|
| `npm run storybook` | Dev server (defaults to parts/part-1) |
| `npm run build-storybook` | Build single part storybook |
| `npm run discover-parts` | Validate and list all parts |
| `npm run build-package` | Build all parts into dist-package/ |
| `npm run new-slug` | Generate a random 128-bit slug |

## Deployment

CI/CD builds all parts and uploads as a single GitHub Actions artifact.
The hosting repo is dispatched via `repository_dispatch` event.

## R2 Deployment

Assets are deployed to Cloudflare R2 (bucket: `just-cdn`) under the route path:

```
r2://just-cdn/hackathons/suraksha/anomaly-detection/1a2b3c4d5e6f7g8h/
```

Public URL (if R2 bucket is configured with public access):

```
https://pub-XXXXXXXXXXXXX.r2.dev/hackathons/suraksha/anomaly-detection/1a2b3c4d5e6f7g8h/
```

Manual deploy:
```bash
node scripts/deploy-r2.mjs
```

## Important Rules

- Use imported assets or relative paths only
- No root-absolute assets (`/image.png`, `/assets/`)
- Random slug is link-only obscurity, not authentication
- Always use trailing slash when sharing links
