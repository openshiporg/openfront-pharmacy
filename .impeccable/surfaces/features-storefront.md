---
version: 1
slug: "features-storefront"
primary_target: "features/storefront"
related_targets: []
---

# Storefront (customer) surface brief

Scope: `/`, `/products`, `/products/[handle]`, `/cart`, `/checkout`, `/prescriptions`, `/order-status`, `/account` (login, reset, overview, prescriptions, profile), `/privacy` and the not-found pages. Mode: Persuade on `/`; Operate on the shop, cart, checkout, order status and account. Audience and job are in PRODUCT.md. Constraints: every route, state and workflow stays; no implied purchase of prescription items without a prescription; no medical claims; dark ground (owner, 2026-10-24).

Main tasks, in order: refill a prescription; bring a new or transferred prescription; track an order; check today's counter hours and the address; buy over-the-counter items for pickup or delivery.

## Direction contract
THESIS: The storefront is the pharmacy's old Main Street apothecary cabinet: an ebonized wall of drawers with cream enamel label plates and gold-leaf sign lettering, where every counter service and every shelf category is a labelled drawer you pull. It refuses the green-cross clinic template, the white SaaS health app, and the previous blister card (rounded domes, dotted perforations).
OWN-WORLD: Ebonized cabinet (oklch 0.16, tinted by the store hue) with drawer fronts one step lighter and a 1px bevel line; cream enamel plates (#ece5d3) with near-black ink for labels and chosen states; gold leaf (#cfae6a) for the store name, prices and the one primary action. Gloock (a high-contrast sign-writer's serif) for the name, headings and prices; Hanken Grotesk for everything read. Corners 3 to 6px; no pills, no glow, no gradients.
STORY: The patient sees the store name in gold over today's counter hours and address, pulls the drawer for what they came to do (refill, new or transfer, track, shop), and either lands in the prescription or order flow or shops the shelf drawers for pickup or delivery.
FIRST VIEWPORT: Desktop 6:6. Left, the gold store name (up to 104px), tagline, and the location plate: address, phone, store and pharmacy-counter open state today, pickup and delivery. Right, the counter cabinet: four drawers in a 2x2 cabinet, each a drawer front with its enamel label and a brass pull. The shelf's category drawers and the first products start below. Phone: name, the four drawers as a 2x2 cabinet, then the location plate.
FORM: Apothecary drawer cabinet, number 3 on my ordered list (1 will-call bags with stapled receipts, 2 dispensing label, 3 apothecary drawers with enamel labels, 4 green-cross storefront sign, 5 seven-day pill organizer, 6 paper prescription pad, 7 drugstore weekly circular). seed:c2af0d6d9834d59d. Raises: the label plate is the control, not a caption beside one (HyperCard shoebox); hierarchy comes from rules and alignment, never from boxes inside boxes (phosphor terminal); colour rests until something is chosen, then the chosen plate turns gold (silk canopy); sections are separated by deep, even gaps (cloud quarry); every product compartment repeats one anatomy at one size (silkscreen loft); the location facts pack into one ruled band at the top of every page (angura poster). Signature interaction: a drawer pulls out a few pixels with a shadow under it on hover and press, and the chosen category's plate turns gold.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
