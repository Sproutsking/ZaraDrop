# Deploying the Four Apps to Vercel

Deploy these as **four separate Vercel projects**. Each gets its own URL and deployment settings while the monorepo and Supabase backend stay shared.

## Before Deploying

1. Apply `supabase/migrations/202610170001_initial_schema.sql` and `supabase/migrations/202610170002_live_rider_queue.sql` to the Supabase project, in that order.
2. In Supabase, copy the project URL and the project's publishable key (or legacy anon key). Never use a personal access token or service-role key in a browser app.
3. Make sure the deployment branch contains the latest code and `package-lock.json`.

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
5. Deploy the project. Repeat with the other three root directories.

Vercel will assign four distinct `*.vercel.app` links. You can add a separate custom domain to each project under Settings → Domains.

## Verify Each Deployment

1. Open the Customer URL. With a configured Supabase project, it should show the customer sign-in/create-account screen until a user signs in.
2. Open Rider, Vendor, and Ops URLs separately and sign in with administrator-provisioned accounts of their matching roles.
3. Create a vendor profile and add available menu items in Vendor. Switch the listing on. Confirm the Customer app shows it.
4. Place a cash-on-delivery test order as a customer. Confirm it appears for Vendor, then in the Rider queue; claim it and check that order status and order chat update in Customer and Ops.
5. Keep Ops access restricted. A separate URL is not a security boundary; Supabase RLS and role-checked RPC functions remain the authorization boundary.

## Local Development

At the repository root, copy `.env.example` to `.env.local`, add the publishable/anon key, then restart Vite. Keep `.env.local` out of Git. Build all four apps locally with `npm run build`.

## Current Scope

The order, vendor catalog, rider assignment/status, and order-chat paths use Supabase. Payments, wallet funding/withdrawals, several analytics panels, and some team/support/admin sections are not yet backed by live services. Cash on delivery is the only checkout method currently available. Do not treat sample analytics or payout values as real financial records.
