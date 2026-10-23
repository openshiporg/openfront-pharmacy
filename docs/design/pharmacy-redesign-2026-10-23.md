# Openfront Pharmacy: storefront and platform direction (2026-10-23)

## Who comes first
- **Customer:** a patient refilling a prescription, checking whether an order is ready, or picking up something over the counter at their own pharmacy. They come for a task, not to browse.
- **Merchant:** a pharmacist whose first question is "what is waiting for review?", then orders to prepare, lots expiring or on hold, and open recalls.

## Direction: "dispensing label"
Calm and exact, like a well-set prescription label: warm label-paper ground, hairline and dashed rules, mono field labels over values, Rx and order numbers, prices and counts in mono. One store accent derived from the logo.

### Type (Google Fonts, OFL)
- **Public Sans** for words: display 44 to 72 at -0.035em, titles 24 to 40, body 15/24, labels 13.
- **DM Mono** for Rx numbers, order numbers, prices, quantities, counts and field labels (11px uppercase, 0.08em).

### Colour
- Ground `oklch(0.982 0.005 95)` (label paper), surface white, well `oklch(0.948 0.008 h)`, ink `oklch(0.23 0.02 h)`.
- Accent `oklch(0.43 0.085 h)` and tint `oklch(0.935 0.04 h)`, where `h` is the OKLCH hue of `#155eef` after the saved logo hue-rotate, computed with the same filter matrix the browser uses (`features/storefront/lib/rx-brand.ts`). The accent always matches the logo.
- Onboarding default logo: Untitled UI **Capsule** at rotation 295 (accent hue about 160, a dispensary green).

### Components
- **Segmented control:** recessed well track, raised white pill on the active item. Used for nav, sign in / create account, pickup or delivery, payment, category, account sections, and every platform filter and sort.
- **Status dot:** 8px, on the title line, baseline aligned.
- **Label card:** dashed header rule, mono field labels (Address, Phone, Service), the location state on the title line.
- **Buttons:** solid accent pill for primary (storefront), ink pill for primary (platform), raised pill in a track for secondary. 44px minimum on phone.

## Storefront
Brand strip (location and phone), header with logo lockup, nav track, account and cart; phone menu sheet. Home: store name set large, a numbered counter list (refill, new or transferred prescription, track order, shop), the pharmacy label card, the location picker and the over-the-counter catalog. Shop with search track, category track and 2-up phone grid with stock dot on the title line. Product with stock dot on the title, mono price, label facts and a sticky phone bar. Cart, checkout (numbered steps, fulfilment and payment tracks), order tracking with a three-step progress rule, account (prescriptions first with refill requests, then orders as a band), profile, sign in, reset, prescriptions page, 404.

## Platform (inside the unchanged shared shell)
Kit: `features/platform/components/rx-ui.tsx`, on the dashboard's own tokens for light and dark.
- **Overview:** the counter view. Four queue cards (prescriptions awaiting review, orders to prepare, lots expiring or held, open recalls) with live counts from the worklists, then records and settings.
- **Queues** (prescriptions, orders, inventory, recalls): count and state on the title line, priority track with counts, sort track, server filters as link tracks, rows in one band with the state dot on the title line, context fields, exception chips and the next step.
- **Directories** (patients, prescribers, audit log, integrations): status track with counts, band rows, expandable label fields.
- **Records** (prescription, order, lot, recall, patient): state dot on the title, a label strip of key fields, sections with counts.
- **Point of sale:** stock and sort tracks, dense product rows with steppers, sale panel with handoff track, quick cash amounts, change due, and a phone total bar.
- **Store settings:** Untitled UI logo tile picker, colour track and a live storefront preview.
