# Property Management Web

## Environment Setup

This frontend reads configuration from Vite environment files, with `env.ts` acting as the single code-level access point.

Keep it simple for local development:

1. Copy `.env.example` to `.env.development`
2. Set `VITE_API_BASE_URL` to your local API URL
3. Restart the Vite dev server after env changes

Available variables:

- `VITE_APP_NAME`
- `VITE_API_BASE_URL`

`.env.development` is ignored by Git. `.env.example` stays committed as the template.
