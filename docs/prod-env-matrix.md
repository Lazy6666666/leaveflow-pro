# Production Environment Matrix

## Frontend

Required:

- `VITE_CONVEX_URL`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_SENTRY_DSN`

Recommended:

- `VITE_SENTRY_ENVIRONMENT`
- `VITE_SENTRY_TRACES_SAMPLE_RATE`
- `VITE_PUTER_ENABLED`
  Recommended even though the code defaults Puter to enabled. Set it explicitly in production so you have a clean kill switch.
- `VITE_CONVEX_SITE_URL`

Conditional:

- `VITE_STRIPE_PUBLISHABLE_KEY`
  Only required if Stripe-backed billing is enabled in production and you have implemented a real payment-intent backend.

## Convex / Backend

Required:

- `CLERK_JWT_ISSUER_DOMAIN`
- `CLERK_APPLICATION_ID`
- `CLERK_WEBHOOK_SIGNING_SECRET`
- `CONVEX_SITE_URL`

Required if feature enabled:

- `MISTRAL_API_KEY`
  Required for Mistral assistant fallback and policy OCR or embeddings.
- `RESEND_API_KEY`
  Required for real email delivery.
- `RESEND_FROM_EMAIL`
  Required for real email delivery with a verified sender identity.

Operational:

- `ADMIN_SETUP_TOKEN`

## APIs and Keys You Still Need To Provide

You need to provide these before production:

- Clerk publishable key
- Clerk webhook signing secret
- Convex deployment URL and site URL
- Sentry DSN for frontend

You also need these if the related features are expected to work in production:

- Mistral API key
- Resend API key
- Resend from-email identity
- Stripe publishable key

You do not need to provide a Puter API key for the current browser-side Puter integration.
