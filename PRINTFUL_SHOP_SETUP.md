# MZCMG Printful Shop — Connection Setup

The initial Printful inventory bridge lives in `api/shop-inventory.js`.

## Secrets

Configure these as deployment environment variables. Never commit their values to GitHub.

- `PRINTFUL_TOKEN` — Printful private token created in the Developer Portal.
- `MZ_SHOP_ADMIN_PASSWORD` — a separate strong password used to protect the private inventory workstation.

The Basic Auth username is fixed as `match`.

## Initial route

`/api/shop-inventory`

The route:
1. Requires Basic Auth.
2. Reads the Printful token only on the server.
3. Calls `GET /stores`.
4. Uses `GET /store/products` for native/API stores.
5. Uses `GET /sync/products` for ecommerce integration stores.
6. Calls `GET /product-templates` at account level.
7. Renders a private, no-index inventory page.

No Printful token is sent to the browser.

## Current phase

Inventory is intentionally read-only in application behavior even though the token may have broader permissions. Product writes, order creation, fulfillment confirmation, webhooks, and payment integration should be enabled as separate deliberate phases.
