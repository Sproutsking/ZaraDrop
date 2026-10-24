# Deploying the Four Apps to Vercel

Deploy these as **four separate Vercel projects**. Each gets its own URL and deployment settings while the monorepo and Supabase backend stay shared.

## Before Deploying

1. Apply all five SQL migrations to the Supabase project, in filename order, including the terminal-order, Paystack, and Mapbox location migrations.
2. In Supabase, copy the project URL and the project's publishable key (or legacy anon key). Never use a personal access token or service-role key in a browser app.
3. Make sure the deployment branch contains the latest code and `package-lock.json`.
4. Configure Google, Facebook, and X under Supabase Authentication providers. Register Supabase's generated `/auth/v1/callback` URL with each provider and add each deployed app origin to Supabase's redirect URL allowlist. TikTok needs compatible custom OIDC support. Instagram needs an OIDC identity broker or a different auth gateway because its standard login is OAuth 2.0, not OIDC.
5. Add `VITE_MAPBOX_PUBLIC_TOKEN` to each Vercel app project. Use a public token restricted to those app origins and the required map/style/tile scopes; never use a Mapbox secret token in a browser build.
6. For Paystack, deploy `supabase/functions/paystack-payment` with `supabase functions deploy paystack-payment --no-verify-jwt`. The function verifies customer JWTs and Paystack webhook HMAC signatures itself. Set `PAYSTACK_SECRET_KEY` and `PAYSTACK_ALLOWED_APP_ORIGINS` as Edge Function secrets, and register `https://<project-ref>.supabase.co/functions/v1/paystack-payment` as the Paystack webhook URL. Keep the secret out of Vercel frontend environment variables. Test using Paystack test credentials before enabling live payments.

## Create Four Vercel Projects

In Vercel, use **Add New → Project** and import this Git repository four times. Configure one app per Vercel project:

| Vercel project | Root Directory | Build Command | Output Directory |
| --- | --- | --- | --- |
| ZaraDrop Customer | `apps/customer` | `npm run build --workspace @zaradrop/customer` | `dist` |
| ZaraDrop Rider | `apps/rider` | `npm run build --workspace @zaradrop/rider` | `dist` |
| ZaraDrop Vendor | `apps/vendor` | `npm run build --workspace @zaradrop/vendor` | `dist` |
| ZaraDrop Ops | `apps/ops` | `npm run build --workspace @zaradrop/ops` | `dist` |

For each project:

1. Set the listed **Root Directory** in Project Settings → Build and Development Settings.
2. Enable **Include source files outside of the Root Directory in the Build Step**. These apps consume the `packages/core` and `packages/ui` workspaces above their app folders.
3. Select the Vite framework preset. Use `npm install` as the install command and `dist` as the output directory. If Vercel’s workspace detection chooses the repository root for dependency installation, keep it; do not create a second lockfile inside an app folder.
4. Add these environment variables in Project Settings → Environment Variables for Production, Preview, and Development:
   - `VITE_SUPABASE_URL`: the Supabase project URL.
   - `VITE_SUPABASE_ANON_KEY`: the Supabase publishable/anon key.
   - `VITE_MAPBOX_PUBLIC_TOKEN`: a Mapbox public token restricted to deployed app URLs and the required map/style/tile scopes.
5. Deploy the project. Repeat with the other three root directories.

Vercel will assign four distinct `*.vercel.app` links. You can add a separate custom domain to each project under Settings → Domains.

## Verify Each Deployment

1. Open the Customer URL. With a configured Supabase project, it should show the customer sign-in/create-account screen until a user signs in.
2. Open Rider, Vendor, and Ops URLs separately and sign in with administrator-provisioned accounts of their matching roles.
3. Create a vendor profile and add available menu items in Vendor. Switch the listing on. Confirm the Customer app shows it.
4. Place one cash-on-delivery order and one Paystack test order. Confirm unpaid online orders stay hidden from Vendor/Rider; verify a successful test payment releases the order, then test vendor status, rider claim, consented location sharing, customer map updates, and Ops monitoring.
5. Keep Ops access restricted. A separate URL is not a security boundary; Supabase RLS and role-checked RPC functions remain the authorization boundary.

## Local Development

At the repository root, copy `.env.example` to `.env.local`, add the publishable/anon key, then restart Vite. Keep `.env.local` out of Git. Build all four apps locally with `npm run build`.

## Current Scope

The order, vendor catalog, rider assignment/status, order messages, Paystack checkout, and order-scoped rider location paths use Supabase when the corresponding migrations, Edge Function, and provider credentials are deployed. Wallet funding/withdrawals, refunds, most analytics, customer/vendor/rider administration, team permissions, and support tickets remain demo/local state. The current Mapbox integration shares a live point; geocoding and turn-by-turn navigation are not implemented. Do not treat sample analytics or payout values as real financial records.
