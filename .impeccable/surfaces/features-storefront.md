---
version: 1
slug: "features-storefront"
primary_target: "features/storefront"
related_targets: []
---

# Storefront (customer) surface brief

Scope: every customer route: `/`, `/products`, `/products/[handle]`, `/cart`, `/checkout`, `/prescriptions`, `/order-status`, `/account` (login, reset, overview, prescriptions, profile), `/privacy`, and the not-found pages. Mode: Persuade on `/`; Operate everywhere else. Audience and job are in PRODUCT.md. Constraints: every route, state and workflow stays; no medical claims; the owner pinned a dark, premium aesthetic (2026-10-24 brief).

## Direction contract
THESIS: The storefront is a blister card printed at night. The patient's four counter services and every product sit in clear domes on a dark card stock in the store's hue, ringed by perforations. It refuses the warm label-paper page (the previous look) and the clinical white-and-teal pharmacy template.
OWN-WORLD: A near-black ground and a card-stock field (oklch 0.235, 0.05 chroma, store hue), with domes one step lighter and a soft highlight, separated by dotted perforations (2px outline, offset 7px) that meet between cells. One bright accent from the store hue goes on the primary action and the icons, and ink is the solid chosen pill. Schibsted Grotesk at 800 for display and 400 to 700 for everything else. Rounded rectangles at 14px (controls) and 22px (domes) are the world's only shapes.
STORY: The patient sees the pharmacy's name and its location label (open now, counter hours, ordering on or off), presses Refill, New or transferred, Track or Shop, and shops over the counter from domed products.
FIRST VIEWPORT: A full-bleed card-stock field. On the left, the operator name at 96px with the tagline and the location label at its foot. On the right, a 2x2 blister of the four services as square domes that press in once.
FORM: Blister pack, number 6 on my ordered list (1 dispensing label, 2 amber vial, 3 24-hour pharmacy sign, 4 drug-compendium monograph, 5 apothecary drawer cabinet, 6 blister pack, 7 weekly pill organiser). seed:87cdd5bb5ad775b0. Raises: each cell holds exactly one thing, as in a size run (sneaker archive); the pass's sequence and state stay legible at a glance (boarding pass and gate board). Signature interaction: domes push through on press (scale and darken) and press in once on load.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
