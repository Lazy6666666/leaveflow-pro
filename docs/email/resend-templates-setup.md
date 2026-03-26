# Resend Templates Setup (BALANCE)

This repo includes a BALANCE-branded Resend template HTML file and a helper script to create and publish the template using the Resend API.

## Files

- Base HTML template: `docs/email/resend-balance-template.html`
- Script (create + optional publish): `scripts/resend_templates_create.mjs`

## Required environment

- `RESEND_API_KEY`

Optional:

- `RESEND_FROM_EMAIL` is required for actually sending emails, but not required to create a template.

## Create + publish the template

From `leaveflow-pro/`:

```bash
node scripts/resend_templates_create.mjs --name "BALANCE Base Template" --alias balance-base --file docs/email/resend-balance-template.html --publish
```

This prints the created template id. Store it (non-secret) as:

- `RESEND_TEMPLATE_BALANCE_BASE_ID=...`

## Template variables

This template only supports simple `{{{VARIABLE}}}` placeholders (no conditional blocks).

- `TITLE` (string)
- `PREHEADER` (string, optional)
- `GREETING_HTML` (string, optional HTML)
- `BODY_HTML` (string, HTML)
- `CTA_HTML` (string, optional HTML)
- `FOOTER_NOTE` (string, optional)

