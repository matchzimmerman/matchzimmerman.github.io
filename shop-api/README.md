# MZCMG Shop API

Vercel API for [matchzimmerman.com/shop](https://matchzimmerman.com/shop). The customer-facing storefront is custom GitHub Pages. Stripe handles payments, and Printful handles print-on-demand production and fulfillment. Squarespace is not part of the target architecture.

## Cutover state (October 2026)

This branch is a **staged migration**, not a live switch. Do not merge or change production environment variables until the checklist below is complete.

- `api/inventory.js` and `api/product.js` now select one dedicated native Printful store via `lib/store-config.js`, never by the name/type of an ecommerce integration.
- `api/checkout.js` validates the same native store, then associates each new Stripe Checkout session with its Printful store ID.
- Completed/expired pre-cutover Stripe sessions may use `PRINTFUL_LEGACY_STORE_ID` temporarily to resolve drafts in the original Printful store. Remove only after outstanding orders, refunds, and Stripe events have been reconciled.
- `data/catalog.json` is the initial **MZ-owned catalog manifest**. `GET /api/catalog` exposes only products with verified publish prerequisites; the Two Houses sweater is a draft and is not for sale.
- The live `/shop/shop.js` storefront still reads `/api/inventory` and `/api/product`. Switching to MZ catalog, authenticated write/publish endpoints, and automated Printful product creation are separate follow-up phases.

## Vercel Hobby function quota

The `shop-api` project must stay at **12 or fewer functions** on Vercel Hobby. The `api/` directory contains 12 deployable `.js` files. To avoid adding functions for low-volume routes, `/api/catalog` and `/api/verify-mzcmg-store` are implemented as two query-mode branches of `api/inventory.js`; `vercel.json` rewrites preserve both original URLs. The store verifier itself lives in `lib/verify-mzcmg-store.js` (not `api/`) and still refuses non-Preview environments. `npm test` checks the function count and rewrites automatically. Future endpoints must reuse a function or consolidate existing ones, rather than add another file under `api/`.

## Private native-store verification (Preview only)

The store ID can be discovered without copying credentials into chat or looking through the Printful dashboard:

1. Configure `PRINTFUL_MZCMG_TOKEN` on **Preview** for the shop API project. Keep the old `PRINTFUL_TOKEN` unchanged.
2. Ensure the **existing** `MZ_SHOP_ADMIN_PASSWORD` is accessible to the Preview deployment (add a Preview-scoped value in Vercel if necessary; do not expose the password in code or chat).
3. Open the migration branch's **Vercel Preview deployment URL** and append `/api/verify-mzcmg-store`. Do **not** use `mzcmg-shop-api.vercel.app` because that is the production alias.
4. When the browser requests HTTP Basic authentication, use username `match` and the configured admin password.
5. The read-only response contains only `{ "ok": true, "store": { "id": ..., "name": "MZCMG", "type": "native" }, "next_env_key": "PRINTFUL_STORE_ID" }` (not the token). If authentication fails or no store matches, no ID is returned.
6. Save that returned numeric ID as `PRINTFUL_STORE_ID` **for Preview only**. Optionally set `PRINTFUL_STORE_NAME=MZCMG`. Changes to Preview environment variables require a new Preview deployment to take effect.

Security: this endpoint refuses any non-Preview environment (404), requires admin authentication, refuses a missing `PRINTFUL_MZCMG_TOKEN`, never falls back to the older token, and returns no raw Printful response or token. Do not merge/deploy it to production as part of cutover. Later remove this temporary diagnostic when store setup is complete.

## Required environment variables

Set these **only** in the Vercel deployment settings, not in the repository. See `.env.example`:

- `PRINTFUL_MZCMG_TOKEN`: preferred new Printful token for the native/manual-order API store. In staging, scope this secret to Preview only. The code prioritizes it over the old `PRINTFUL_TOKEN`; do not overwrite or remove the existing production secret. Required scopes include products and orders for intended automation.
- `PRINTFUL_TOKEN`: legacy/backup Printful credential retained while the existing storefront is still live.
- `PRINTFUL_STORE_ID`: **required** positive numeric ID of a dedicated **Manual Order Platform/API** Printful store (`type: native`). The code fails closed if absent or pointing to an ecommerce integration.
- `PRINTFUL_STORE_NAME`: optional exact-name check for additional protection.
- `PRINTFUL_LEGACY_STORE_ID`: transitional ID for existing Stripe sessions that lack store association metadata; needed only during the drain window.
- `MZ_SHOP_ADMIN_PASSWORD`: private workstation auth, not used in browser-side JavaScript.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`: existing Stripe credentials.
- `MZ_SHOP_BASE_URL`: shop hostname for checkout return URLs.
- `MZ_SHOP_CONFIRM_PRINTFUL`: must remain `false` until successful end-to-end proof and approval.

## Safe activation checklist

1. In Printful, create a **Manual Order Platform/API store** dedicated to MZCMG; do not disconnect the old account during transition.
2. Generate / authorize an appropriately scoped token and identify the actual native store ID. Never commit the token.
3. Grant Vercel team/project access, and configure `PRINTFUL_MZCMG_TOKEN`, `PRINTFUL_STORE_ID`, and optional name guard for the migration preview only. Leave the existing production `PRINTFUL_TOKEN` untouched.
4. Set `PRINTFUL_LEGACY_STORE_ID` to the retired Printful store's ID **only** while old Stripe sessions/fulfillment need it.
5. Audit existing visible products, variants, print files, previous orders, and migration strategy. Native and ecommerce-linked stores do **not** share sync-product IDs automatically. Do not present old variants from one store as variants of another.
6. Deploy a **preview environment** and validate `/api/inventory?storefront=1`, individual `/api/product?storefront=1&id=...`, and `/api/catalog`. Until native products have been created, the public inventory may be empty.
7. Run regression tests (`cd shop-api && npm test`). Test a purchase with Stripe **test** credentials, Printful mock/draft, shipping calculation, expired-session cleanup, webhooks, and a post-payment fulfillment hold.
8. Only then transition production environment variables and catalog source together, preserving continuity for old orders; verify products, sizes, costs, and prices in the real storefront. Keep fulfillment held until separately approved.
9. Remove `PRINTFUL_LEGACY_STORE_ID` once old pending sessions and legitimate post-purchase support obligations are handled by an alternative verified path.

## Owned catalog v1

`data/catalog.json` is version-controlled MZCMG product intent, not Printful's inventory. Each product has identity, line/category, status, artwork/placement files, yarn validation, Printful IDs and variants, retail price, mockups, and review approvals. The initial `TWO HOUSES` record is a deliberate unpublished draft. `lib/catalog.js` requires both production validation and an explicit published state before returning products publicly. A product's presence in the manifest is **not** permission to charge a customer.

The current catalog is read-only through the API. A later publisher must validate the actual knitting placement rules from the selected Printful product and size, create production products/assets, obtain verified cost/variant mappings, and only then update the MZ manifest through a reviewed, authenticated write path. It must never publish on a mockup alone.

## Development

Run `cd shop-api && npm test` (Node 20+). Tests run without external credentials or paid API calls. Do not place Printful or Stripe tokens in GitHub Actions secrets unless explicitly authorized.

Existing API routes (inventory, product, checkout, mockup generation, workstation) remain otherwise in place. The old foundry is a candidate/mockup tool, **not** a product publisher yet.
