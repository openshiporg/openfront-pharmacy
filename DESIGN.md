---
name: Openfront Pharmacy Storefront
description: The customer storefront printed as a blister card at night, in the operator's own hue.
colors:
  ground: "oklch(0.155 0.014 160)"
  ink: "oklch(0.965 0.008 160)"
  card-stock: "oklch(0.235 0.05 160)"
  dome: "oklch(0.29 0.045 160)"
  dome-lit: "oklch(0.33 0.05 160)"
  perforation: "oklch(0.4 0.04 160)"
  foil-accent: "oklch(0.82 0.13 160)"
  foil-accent-ink: "oklch(0.17 0.03 160)"
  surface: "oklch(0.205 0.02 160)"
  well: "oklch(0.235 0.02 160)"
  quiet-ink: "oklch(0.76 0.014 160)"
  tint: "oklch(0.3 0.05 160)"
  tint-ink: "oklch(0.93 0.05 160)"
  border: "oklch(0.3 0.02 160)"
  input-stroke: "oklch(0.34 0.022 160)"
  alarm: "oklch(0.72 0.17 27)"
typography:
  display:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3rem, 6vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.05em"
  headline:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 4vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 2vw, 1.75rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: "18px"
  figures:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontFeature: "tnum"
    letterSpacing: "-0.01em"
rounded:
  control: "14px"
  dome: "22px"
spacing:
  perforation-gap: "14px"
  dome-pad: "28px"
  gutter-phone: "16px"
  gutter-tablet: "24px"
  gutter-desktop: "32px"
  section: "56px"
components:
  button-primary:
    backgroundColor: "{colors.foil-accent}"
    textColor: "{colors.foil-accent-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 24px"
    height: "48px"
  pill:
    backgroundColor: "{colors.well}"
    textColor: "{colors.quiet-ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  pill-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  dome:
    backgroundColor: "{colors.dome}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dome}"
    padding: "{spacing.dome-pad}"
  dome-hover:
    backgroundColor: "{colors.dome-lit}"
  dome-pressed:
    backgroundColor: "{colors.card-stock}"
  card:
    backgroundColor: "{colors.card-stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dome}"
  input:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  notice:
    backgroundColor: "{colors.well}"
    textColor: "{colors.quiet-ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
---

# Design System: Openfront Pharmacy Storefront

Scope: the customer storefront only (`.storefront-brand` wrapper, `features/storefront`). The merchant platform shares Openfront's shell and is not governed by this file.

## Overview

**Creative North Star: "The Blister Card at Night"**

The storefront is a blister card printed in the dark. The page is a near-black ground; each working region is a sheet of card stock tinted in the operator's own hue; every service and every product sits in its own clear dome, one step lighter than the card, ringed by a dotted perforation. Neighbouring domes share one perforation, so a grid reads as a single pressed sheet rather than a set of floating cards. One bright foil accent from the same hue marks the primary action and the icons; solid ink marks the chosen pill.

The whole palette is generated from a single runtime hue (`--store-brand-hue`, default 160, set from the operator's saved logo colour). Every value below is recorded at the default hue; the lightness and chroma are the system, the hue is the operator's. Density is calm: big extrabold display type, square domes, generous 14px gaps. Motion is physical and brief: domes press in once on load and push through on press.

It refuses the warm label-paper page that came before it and the clinical white-and-teal pharmacy template.

**Key Characteristics:**
- Dark ground, hue-tinted card stock, lighter domes; no grey, washed-out grounds.
- Dotted 2px perforation around every dome and panel, offset so neighbours meet.
- Two radii only for surfaces and controls: 14px controls, 22px domes and panels.
- One typeface, Schibsted Grotesk, from 400 to 800; tabular figures for numbers.
- One foil accent per action; ink (solid foreground) marks selection.
- Each dome holds exactly one thing.

## Colors

One hue, stepped through lightness: a dark sheet with a single bright foil.

### Primary
- **Foil Accent** (`foil-accent`): the primary action (Add, Place order), icons on domes, links that act ("All hours", "View cart"), the order-status progress fill, focus rings and text selection. Text on it is **Foil Ink** (`foil-accent-ink`), a near-black of the same hue.

### Neutral
- **Night Ground** (`ground`): page background, the header bar, input fills on forms over card stock.
- **Card Stock** (`card-stock`): full-bleed section fields (home hero, catalog, utility strip) and panel fill (`rx-card`); also the pressed state of a dome.
- **Dome** (`dome`) and **Lit Dome** (`dome-lit`): the clear cell holding a service or product, and its hover state.
- **Perforation** (`perforation`): the dotted outline around domes and panels and the dotted dividers inside bands and between checkout fieldsets.
- **Ink** (`ink`): body text and the solid fill of the chosen pill and the cart button.
- **Quiet Ink** (`quiet-ink`): field labels, counts, meta lines, unselected pill text.
- **Well** (`well`): resting pill fill and the muted notice.
- **Surface** (`surface`): shadcn `card` role; input fill on checkout.
- **Tint** (`tint`) with **Tint Ink** (`tint-ink`): the brand notice and the location-picker badge.
- **Border** / **Input Stroke**: hairlines on shared primitives.

### Status
- **Alarm** (`alarm`, hue 27): errors, at 10% fill behind alarm text.
- Status dots use fixed signal tones independent of the store hue: ok emerald-400, warn amber-400, danger red-400, info sky-400, brand = Foil Accent, muted = Quiet Ink at 45%.

### Named Rules
**The One Hue Rule.** Every store colour except the status signals is `oklch(L C var(--store-brand-hue))`. Never hard-code a hue into a storefront surface; change lightness and chroma, never the hue.

**The One Foil Rule.** Foil Accent is for the action and the icon, not for fills of regions. A selected state is ink, not foil.

## Typography

**Display Font:** Schibsted Grotesk (with ui-sans-serif, system-ui, sans-serif), loaded via `next/font` as `--rx-font-sans`.
**Body Font:** the same.

**Character:** One heavy grotesk, as printed on blister foil. Hierarchy comes from weight and size alone: 800 with tight negative tracking for display, 600 to 700 for titles and controls, 400 to 500 for reading.

### Hierarchy
- **Display** (800, 48px / 72px / 96px at phone / sm / lg, line-height 0.9, -0.05em): the operator name in the home hero only, capped at 12ch.
- **Headline** (800, 40px to 56px, line-height 0.95, -0.04em): page titles (`PageHead`) and the catalog title (40px to 52px), with a count beside it in 14px Quiet Ink.
- **Title** (700, 20px to 28px, line-height 1.1, -0.02em): dome labels and location names; product names are 16px 700.
- **Body** (400 to 500, 14px to 16px): field values, notices, meta. The hero tagline is 20px to 22px at 1.4, capped at 34ch.
- **Label** (600, 13px / 18px, sentence case, Quiet Ink): field labels over values, form labels, footer column labels, hours table headers. Never uppercase, never tracked out.
- **Figures** (`rx-num`): tabular numerals at -0.01em for phones, counts, prices.

### Named Rules
**The One Face Rule.** Schibsted Grotesk only. No second display face, no monospace; numbers get tabular figures instead.

**The Label Is a Field Rule.** The 13px label names the value directly beneath it. It is not a kicker above a heading.

## Layout

Content sits in a 1280px column (`max-w-7xl`) with 16 / 24 / 32px gutters at phone / sm / lg. Section fields of card stock run full bleed behind that column; sections breathe at 56px vertical padding (catalog) and up to 80px in the hero. Reading pages narrow to 576px to 1152px columns.

The blister grid is the spatial unit: a 14px gap between domes, which is exactly the space two perforations share. Services are a 2x2 of square domes; products are two columns on phone, four at lg, square domes with 40px between rows for name, category, price and action beneath each dome. The home hero is two equal columns at lg (name, tagline and location label left; the service blister right), stacking on phone.

Controls keep 40px minimum height (44px below sm) and 48px for the primary button.

## Elevation & Depth

Flat, with depth from tone and one moulded inset. There are no drop shadows: `--rx-raise` and `--rx-recess` are both `none`, and shared primitives that carry `shadow-xs` have it removed where they sit on card stock. Depth reads as ground (darkest), card stock, dome (lighter), lit dome (hover).

### Shadow Vocabulary
- **Dome moulding** (`box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.09), inset 0 -1px 0 oklch(0 0 0 / 0.25)`): the soft highlight on top and shade below that makes a dome read as clear plastic. Domes only.

### Named Rules
**The Tone Not Shadow Rule.** Lift a surface by stepping its lightness, never by casting a shadow.

## Shapes

Two radii: 14px for controls (pills, buttons, inputs, notices, tags, the cart button) and 22px for domes and panels. Circles are reserved for the 8px status dot and the order-status progress bar. The perforation is a 2px dotted outline offset 6px from the dome edge, so two domes 14px apart share one row of dots; inside a band, rows divide with 2px dotted lines in the same colour. Dotted perforation is the world's native line; solid hairlines appear only on shared form primitives.

## Components

### Buttons
Solid, compact, pressable.
- **Shape:** 14px radius.
- **Primary:** Foil Accent fill, Foil Ink text, 15px 700, 48px tall, 24px sides (compact Add: 40px, 16px sides). Optional 16px leading icon.
- **Hover / Focus / Active:** brightness 110% on hover; 2px Foil Accent outline at 2px offset on focus-visible; scale 0.97 on press over 150ms `cubic-bezier(0.23, 1, 0.32, 1)`.
- **Secondary:** an ink pill (see Pills) in its own track, used for Search, Load more and secondary links.
- **Cart:** ink fill, Night Ground text, bag icon and tabular count.

### Pills and Tracks
- **Style:** Well fill, Quiet Ink 14px 600 text, 14px radius, 40px tall, set in a horizontal track with 4px gaps that scrolls without a scrollbar.
- **State:** hover lifts text to Ink; the chosen pill (`data-active`, with `aria-pressed` or `aria-current`) is solid Ink with Night Ground text. Category pills carry a 13px tabular count.

### Domes
The signature component.
- **Corner Style:** 22px.
- **Background:** Dome; Lit Dome on hover (fine pointers only); Card Stock and scale 0.97 on press.
- **Border:** 2px dotted Perforation outline, 6px offset.
- **Contents:** exactly one thing: a service label bottom-left with a Foil Accent arrow top-right (20px to 28px padding), or a product image filling the square with an optional prescription tag (Night Ground, 14px radius, 13px 600) top-left.
- **Motion:** a group of domes presses in once on load (`rx-press`: from 0.94 scale and 0 opacity over 520ms, staggered 70ms, capped at 260ms), suppressed under reduced motion.

### Cards / Panels
- **Corner Style:** 22px.
- **Background:** Card Stock, ringed by the same perforation as domes.
- **Band:** a panel whose rows divide with 2px dotted Perforation lines, used for label-style lists of fields.
- **Empty state:** a panel with a centred 600 title and an optional action, 56px vertical padding.

### Inputs / Fields
- **Style:** 44px tall, 14px radius, Night Ground fill (Surface on checkout), 16px sides, Input Stroke hairline, placeholder in Quiet Ink at 70%.
- **Focus:** border shifts to Foil Accent with a 3px Foil Accent ring at 50%.
- **Error:** Alarm border and ring.
- **Search:** sits borderless inside a pill track beside an ink Search pill.

### Field and Title Line
- **Field:** 13px label over a 14px 500 value, as on a dispensing label; used in definition lists.
- **Title Line:** a heading with an 8px status dot and state label on the same baseline ("Ordering online", "Call to order").

### Notices
14px radius, 12px by 16px, 14px text. Muted (Well), brand (Tint), danger (Alarm at 10%).

### Navigation
A sticky header: a Card Stock utility strip (36px, 13px, location name left, phone right), then a Night Ground bar with the brand mark, the section pills in a track (md and up), an Account text link and the ink cart button. Phones use the mobile menu in place of the track.

## Do's and Don'ts

### Do:
- **Do** derive every storefront colour from `--store-brand-hue` through the tokens above.
- **Do** put each service or product in its own dome, 14px from its neighbours, so perforations meet.
- **Do** use 14px for controls and 22px for domes and panels.
- **Do** mark selection with solid Ink and action with Foil Accent.
- **Do** set numbers in tabular figures (`rx-num`).
- **Do** keep presses at scale 0.97 with `cubic-bezier(0.23, 1, 0.32, 1)`, and the load press-in behind `prefers-reduced-motion: no-preference`.

### Don't:
- **Don't** use grey, washed-out or light grounds; the sheet is always dark and hue-tinted.
- **Don't** cast drop shadows; depth is tone plus the dome moulding.
- **Don't** introduce a second typeface or a monospace face.
- **Don't** place a small label above a heading as a kicker; 13px labels name fields only.
- **Don't** put more than one thing in a dome.
- **Don't** use foil as a region fill or for the selected pill.
