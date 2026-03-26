# Security Headers

## Why This Is In Docs

Security headers should be applied at the hosting layer. This repo does not yet encode a single hosting target strongly enough to safely hardcode a production CSP without risking Clerk, Convex, Stripe, or Puter breakage.

## Minimum Headers To Apply In Production

- `Content-Security-Policy`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy`
- `X-Frame-Options: DENY`

## CSP Notes

The final CSP must allow only the domains you actually use in production.

Typical integrations in this app:

- frontend origin
- Convex deployment origin
- Clerk auth assets and API domains
- Sentry ingest domain
- Stripe JS and API domains if billing is enabled
- `https://js.puter.com` if Puter remains enabled

## Deployment Step

Before production release, apply these headers in the hosting platform configuration and then run the staging smoke tests to confirm:

- auth still works
- assistant still works
- Stripe still works if enabled
- Sentry still receives events
