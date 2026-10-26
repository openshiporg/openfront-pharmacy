# Pharmacy: full redesign of platform pages and storefront (2026-10-25/26)

Brief: `~/Code/Euler/state/briefs/batches-2-6-full-redesign-2026-10-25.md`.

Live: https://openfront-pharmacy-production.up.railway.app
Commits on master, each auto-deployed: `bbfa283` (redesign), `36f5a69` (scroller fix and after screenshots), plus the commit carrying this report.

## Critique of the previous UI (before screenshots in `before/`)
- **Platform.** Every filter, sort and action was a raised pill in a recessed rounded track. Field labels were mono uppercase tracked capitals. The overview was four equal queue cards, each with a giant mono zero, followed by a list of 20 links that repeated the sidebar. The prescription and order queues were stacked cards with label grids. List pages were card rows with a hidden-details toggle.
- **Storefront.** Blister-card world. Four big rounded "dome" tiles with dotted perforations made the generic icon-tile hero. Category filters were pill chips with 14px corners. Schibsted Grotesk throughout.

## Platform (`features/platform/**`), Operate mode inside the shared shell
- **Kit (`rx-ui.tsx`).** The same API now draws underline tabs, flat 5px buttons (solid foreground for the one primary action), bordered 6px lists, and a `StatusText` status column. Labels are plain sentence case; figures use tabular numerals in the UI face instead of mono.
- **Overview.** Opens on a "Needs attention" queue ordered by urgency: Class I recalls, recall-held lots, missing cold-chain evidence and payment issues first, then pharmacist review, online requests, refills, orders to prepare, expiring lots and outreach. Then a compact Queues table (records, lead, the other counts, state, actions) and a three-column records-and-settings index. The header's actions are New prescription, Receive stock and Point of sale.
- **Work queues** (`WorkflowQueuePage`: prescriptions, orders, inventory, recalls, refills, requests). A table led by its Priority column (urgent, attention, routine). Each row has the record with its exceptions inline, the patient or lead fact, state, age and location, the next decision (its hint is the tooltip), and Open. Priority, sort and server filters are underline tabs.
- **List pages** (`OperationalPage`: patients, prescribers, products, suppliers, drug references, locations, staff, credentials, integrations, audit and others). A real table whose first three detail fields become columns, then a status column. Row actions and a details row stay.
- **Task pages.** Bordered 6px sections with a header bar, and the record's meta inline with its title. Transition buttons are outline buttons, not pills.
- **POS.** Product list with outline quantity steppers. The sale panel's quick cash amounts are buttons. Radii are pinned and the mobile sale bar is squared.
- **Store Settings.** The preview shows the apothecary storefront in miniature, in its own fonts.
- **Everywhere.** Radii pinned at 6px or less (the dashboard token renders `rounded-md` at 8px). Table scrollers are positioned, so sr-only cells can't widen the phone page.

## Storefront (`features/storefront/**`, `app/(storefront)/apothecary.css`)
- **World.** The pharmacy's old Main Street apothecary cabinet (contract in `.impeccable/surfaces/features-storefront.md`, `seed:c2af0d6d9834d59d`): an ebonized cabinet tinted by the store hue, cream enamel label plates, and gold-leaf Gloock for the store name, headings and prices.
- **Home.** The gold store name and the location plate (address, pharmacy counter and store open state, phone, service) sit beside the counter cabinet. Its four drawers (Refill a prescription, New or transfer, Track an order, Shop the shelves) each have an enamel plate and a brass pull, and pull out on hover. The OTC shelf follows: category plates (the chosen one is enamel), search, and product compartments with prescription-requirement plates and gold prices.
- **Across the site.** Header, footer, cart, checkout, order status, prescriptions, account and privacy all inherit the cabinet tokens. Perforations become 1px rules, 14px and 22px corners become 4px and 6px, and extrabold headings become Gloock.
- **Type.** Gloock (display) with Hanken Grotesk (reading). The stylesheet is renamed from `storefront.css` to force a fresh compile.

## Skills used, and on what
- **impeccable:**
  - `concept-seed --scope direction --mode persuade` assigned #3 of my ranked seven (the apothecary drawers). Its six declined challengers each donated a discipline, named in the contract: label as control, rules not boxes, colour at rest, deep gaps, one repeated anatomy, and packed facts.
  - `surface-brief write` recorded the contract. `craft-floor.md` and `operate.md` set the build floor and the Operate rules for the platform.
- **Memory traps from earlier redesigns:** the 8px dashboard radius, sr-only scroller overflow, and the stale CSS compile.
- Not run on this repo: the finish reviewer and the documenter. The other design skills named in the brief were not loaded this run.

## Gates
- **Typecheck:** `tsc --noEmit -p .` through heavy-exec, exit 0 with 0 errors after the last type-relevant change. `36f5a69` changed only className strings.
- **Unit tests:** `family-security` passed 14/14 (exit 0); `shared-dashboard` passed 8/8 (exit 0).
- **Parity:** drift 0, missing 0, sidebar ok.
- **Live CSS:** `rx-drawer` was confirmed in the served CSS after deploy.

## Open items
- **No finish review.** No impeccable-finish-reviewer pass or documenter has run on this repo, and DESIGN.md still describes the blister-card world.
- **Logo unchanged.** The store logo (Cedar & Elm, two overlapping circles) is store data and was left as is; the owner asked for a logo change only on cannabis.
- **Phone shots retaken.** The phone captures of overview, orders, patients, prescribers, inventory, products, suppliers, drug references, locations, staff, integrations and audit were retaken after `36f5a69` deployed. None now overflows at 390px.

## Screenshots
`before/` and `after/` were captured at 1440 desktop and 390 phone (2x), full page, with Playwright WebKit.
