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

Apply both SQL migrations in order in the Supabase SQL Editor:

1. `supabase/migrations/202610170001_initial_schema.sql`
2. `supabase/migrations/202610170002_live_rider_queue.sql`

Together they create the shared profile, vendor, menu, order and messaging tables; grant only the required client privileges; enable row-level security; and add order workflow functions, realtime publication, and the complete rider order queue.

New sign-ups receive the `customer` role. Rider, vendor and ops roles must be granted by a trusted administrator after the user signs up; do not allow users to choose a privileged role in a client app. A vendor profile also needs its vendor record before it can manage a catalog. Keep `.env.local` private; it is ignored by Git.

The customer marketplace reads active vendors and available menu items from Supabase and places cash-on-delivery orders through a server-side RPC. Vendor order tickets and menu/listing availability are persisted; rider jobs are claimed atomically and status changes are persisted; Operations monitors the shared orders and assigns real rider accounts. Order changes refresh through Supabase Realtime. Vendor accounts must create a profile and menu before appearing in the marketplace. Rider, vendor, and ops roles must be assigned by an administrator.

Card, wallet, cash-out, refunds, chat messages, and most analytics/team/support panels are not yet connected to real payment or domain services; some of those screens still show demo values. Do not enter real payout details or treat demo balances as money. Before a live launch, apply and test both migrations in the Supabase project, configure the publishable key in `.env.local`, add role-assignment administration, and connect a payment provider for online payments. The browser apps must never use the supplied personal access token or a service-role key.

## App ports

- Customer: 5173
- Rider: 5174
- Vendor: 5175
- Ops: 5176
