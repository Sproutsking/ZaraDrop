# ZaraDrop Monorepo

This repository contains four independent React applications built in a single monorepo:

- Customer app
- Rider app
- Vendor app
- Ops app

Each app has its own Vite configuration, independent build output, and distinct development port.

## Why this structure

A single repository is the right choice when the apps share design language, operations, and internal tooling, but must still be deployed as separate products. This keeps shared UI and logic in one place without forcing cross-app access at runtime.

## Security model

The apps are intentionally separated so that no app imports or renders another app's source. Each app is compiled as its own bundle and is expected to authenticate against a dedicated backend identity layer.

Important: app-level bundle isolation is not the same as secure access control. Users must be authorized by the backend and authorized roles must be enforced server-side. The Ops app should never be public or broadly downloadable.

## Install

npm install

## Run individually

npm run dev:customer
npm run dev:rider
npm run dev:vendor
npm run dev:ops

## Build all

npm run build

## Build one app

npm run build:customer
npm run build:rider
npm run build:vendor
npm run build:ops

## Supabase setup

The four apps share one Supabase project through `@zaradrop/core`. Copy `.env.example` to `.env.local` at the repository root, then set `VITE_SUPABASE_ANON_KEY` to the project's publishable key (or legacy anon key). The project URL is already filled in. Only a publishable/anon key belongs in browser apps; never use a service-role key or Supabase personal access token here.

All app sign-in uses social OAuth; email and password sign-in are not used. Enable Google, Facebook, and X in Supabase Authentication and configure their client credentials. Register Supabase's generated `/auth/v1/callback` URL in each provider console, then add each app's local and deployed origins to Supabase's allowed redirect URLs. Locally, allow `http://localhost:5173`, `:5174`, `:5175`, and `:5176`; each app returns to the origin where sign-in began.

TikTok and Instagram are shown as custom provider options. TikTok requires a Supabase-compatible custom OIDC configuration. Instagram's standard login is OAuth 2.0, not OIDC, so it cannot be connected directly using Supabase's custom OIDC provider alone; use an identity broker that exposes Instagram login as OIDC, or an auth gateway that can issue sessions trusted by Supabase. Do not put provider client secrets in browser code or `VITE_*` variables.

Apply all SQL migrations in order in the Supabase SQL Editor:

1. `supabase/migrations/202610170001_initial_schema.sql`
2. `supabase/migrations/202610170002_live_rider_queue.sql`
3. `supabase/migrations/202610230001_guard_terminal_order_assignment.sql`
4. `supabase/migrations/202610230002_paystack_order_payments.sql`
5. `supabase/migrations/202610230003_mapbox_rider_tracking.sql`

Together they create the shared profile, vendor, menu, order and messaging tables; grant only the required client privileges; enable row-level security; add order workflow functions, realtime publication, and the complete rider order queue; and prevent assigning terminal orders.

### Paystack setup

Paystack checkout is initialized and verified by the `paystack-payment` Supabase Edge Function; never expose `PAYSTACK_SECRET_KEY` through a `VITE_*` variable or browser bundle. After applying migration 4, deploy with `supabase functions deploy paystack-payment --no-verify-jwt`. The function validates customer JWTs itself and validates webhook requests with Paystack's HMAC signature. Set `PAYSTACK_SECRET_KEY` with `supabase secrets set PAYSTACK_SECRET_KEY=...`. Set `PAYSTACK_ALLOWED_APP_ORIGINS` to a comma-separated list of the four deployed app origins using `supabase secrets set PAYSTACK_ALLOWED_APP_ORIGINS=...`; local origins `http://localhost:5173` through `:5176` are already allowed by the function. Configure the Paystack webhook URL as `https://<project-ref>.supabase.co/functions/v1/paystack-payment`, use the same Paystack environment as the secret, and test successful, failed, abandoned, and duplicate webhook events before switching from test to live credentials. A Paystack-enabled project cannot process online payments until this migration and function are deployed.

### Mapbox rider tracking

Set `VITE_MAPBOX_PUBLIC_TOKEN` to a Mapbox public token with only the required map/style/tile scopes, restricted to your local and deployed app URLs. This token is intentionally public in the frontend; never put a Mapbox secret token in a `VITE_*` variable. Apply migration 5 before using location tracking. Rider location sharing starts only after the rider chooses to share during an active trip, and Customer sees the point only while its order is on the way. This implements a live marker, not geocoding or turn-by-turn routing.

New sign-ups receive the `customer` role. Rider, vendor and ops roles must be granted by a trusted administrator after the user signs up; do not allow users to choose a privileged role in a client app. A vendor profile also needs its vendor record before it can manage a catalog. Keep `.env.local` private; it is ignored by Git.

The customer marketplace reads active vendors and available menu items from Supabase. Cash-on-delivery orders and Paystack orders are created through a server-side RPC; online payment confirmation is handled by the Paystack Edge Function and signed webhook. Vendor order tickets and menu/listing availability are persisted; rider jobs are claimed atomically, status changes are persisted, and location sharing is available during active delivery after rider consent and Mapbox setup. Operations monitors the shared orders and assigns eligible rider accounts. Order and location changes refresh through Supabase Realtime. Vendor accounts must create a vendor profile and menu before appearing in the marketplace. Rider, vendor, and ops roles must be assigned by an administrator.

Wallet funding, payouts, refunds, rider/vendor/customer administration, staff/team permissions, support tickets, and most analytics are still not backed by live domain services; those screens are labeled as preview data. General chat/support is not the same as the persisted order conversation. Do not treat demo balances, operational metrics, or locally edited roles as real financial or security records. Before launch, apply and verify all five migrations, deploy/configure the Paystack Edge Function and webhook, configure OAuth and Mapbox, establish a trusted role-provisioning process, and test the whole workflow with provider test credentials. Browser apps must never use a service-role key, Paystack secret, Mapbox secret token, or OAuth client secret.

## App ports

- Customer: 5173
- Rider: 5174
- Vendor: 5175
- Ops: 5176
