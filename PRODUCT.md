# Product

<!-- impeccable:product-schema 1 -->

Inferred on 2026-10-25 from the repository (storefront source, QA audits) and the owner's redesign brief (`~/Code/Euler/state/briefs/design-skills-redesign-2026-10-25.md`). The owner ordered the work without an approval stage, so no interview took place. Every line below is inferred, not confirmed.

## Platform

web

## Users
- **Patient or shopper (storefront):** someone who needs a refill, a new or transferred prescription, an order status check, or over-the-counter products from a chosen pharmacy location, often on a phone.
- **Merchant (platform):** pharmacy staff handling prescriptions, verification, fulfilment, pickup and delivery. The platform shell is shared with Openfront E-commerce and isn't in scope for storefront work.

## Product Purpose
The public front of a pharmacy operator with one or more locations: choose a location, see its address, phone and store and pharmacy-counter hours, request refills or transfers, track orders, and buy over-the-counter products through cart and checkout (Stripe card step where enabled).

## Positioning
The storefront is scoped to the selected location: catalog availability, online ordering, pickup or delivery, and hours are that location's own.

## Operating Context
Routes: `/` (location label, counter services, over-the-counter catalog), `/products` (category, search, load more), `/products/[handle]`, `/cart`, `/checkout`, `/prescriptions` (services, transfer, location), `/order-status`, `/account` (login, reset, overview, prescriptions, profile), `/privacy` and the not-found pages.

## Capabilities and Constraints
- Prescription items carry a requirement label. The storefront must not imply that a prescription can be bought without one, and must make no medical claims.
- Online ordering can be off per location ("Call to order").
- Product photos are optional and fall back to a label.

## Brand Commitments
- The operator's display name, tagline, logo SVG and logo colour (accent hue) are the brand.
- Owner direction for this redesign (2026-10-24): dark, considered and premium; no grey, washed-out grounds; no generic SaaS cards; UI copy is labels, states and errors only; phone width must work. Tessier (`~/Code/shops/tessier`) is the reference the owner likes.

## Evidence on Hand
Live location, hours and catalog data. No testimonials, outcomes or health claims, and none may be invented.

## Product Principles
1. The patient's next step (refill, transfer, status, shop) is one tap from the first screen.
2. Location facts (open now, counter hours, ordering on or off) are always true and visible.
3. Every route, state and workflow stays. Presentation changes; behaviour doesn't.
