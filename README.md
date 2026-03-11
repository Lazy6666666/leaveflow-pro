# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Clerk
- Convex

## Backend operational notes

### Clerk onboarding webhook

The Convex backend now exposes a server-side provisioning endpoint at `/clerk/onboarding`.

Required server env:

- `CLERK_ONBOARDING_SECRET`
- `CLERK_JWT_ISSUER_DOMAIN`
- `CLERK_APPLICATION_ID`

Recommended flow:

1. Set `CLERK_ONBOARDING_SECRET` in Convex env and send the same secret with the onboarding request.
2. Configure your trusted server-side onboarding source to POST `user.created` and `user.updated`-style payloads to:
   `https://<your-convex-site>/clerk/onboarding`
3. Send the shared secret in one of:
   - `x-clerk-onboarding-secret`
   - `x-webhook-secret`
   - `Authorization: Bearer <secret>`

This route provisions:

- `profiles`
- default `employee` role
- current-year leave balances

The browser-side `ensureCurrentUser` mutation is still present as a safety net, but the preferred production path is now server-to-server onboarding.

### Biometrics sync scheduler

The Convex cron scheduler now runs a recurring biometrics sync check every 1 minute.

Behavior:

- only active biometrics configs are checked
- only configs whose `syncFrequencyMinutes` window has elapsed are synced
- `generic_webhook` configs are skipped by the pull scheduler and remain webhook-driven

### Generic webhook site URL

For generic biometrics webhook testing, set one of:

- `CONVEX_SITE_URL`
- `VITE_CONVEX_SITE_URL`

`CONVEX_SITE_URL` is preferred. The backend no longer falls back to a placeholder URL.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
