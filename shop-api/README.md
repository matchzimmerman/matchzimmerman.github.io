# MZCMG Shop API

Private serverless bridge between the custom MZCMG storefront and Printful.

This subproject is isolated from the GitHub Pages site. A Vercel project can point to this repository with Root Directory set to shop-api. Doing that does not change where matchzimmerman.com is hosted.

## Environment variables

Set these only in the deployment environment. Never commit their values.

PRINTFUL_TOKEN
The Printful private token.

MZ_SHOP_ADMIN_PASSWORD
A separate strong password for the private inventory endpoints.

The Basic Auth username is: match

## Initial routes

/api/health
Shows whether the required environment variables are configured without exposing them.

/api/inventory
Password-protected live inventory of all accessible Printful stores, store products, and Product Templates.

/api/product
Password-protected product and variant detail endpoint. Required query parameters: storeId, storeType, id.

## Safety model

The Printful token may carry write permissions so the system can later automate product creation, orders, files, webhooks, and fulfillment.

The current application code performs GET requests only.

Write operations will be added as separate deliberate phases after the existing catalog has been inspected.

## Architecture

matchzimmerman.com/shop
GitHub Pages storefront

MZCMG Shop API
Separate Vercel project using shop-api as its Root Directory

Printful
Catalog, production, fulfillment, and shipping
