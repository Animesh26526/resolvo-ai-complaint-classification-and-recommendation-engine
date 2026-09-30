---
name: Resolvo
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434655'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#46566c'
  on-tertiary: '#ffffff'
  tertiary-container: '#5e6e85'
  on-tertiary-container: '#e9f0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: 2.75rem
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '500'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
    letterSpacing: 0.005em
  label-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: 0em
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.01em
  label-xs:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
---

## Brand & Style

This design system embodies the standard of precision enterprise craftsmanship: utilitarian, quiet, and hyper-focused. Taking inspiration from tools like Linear, Stripe, and Vercel, it replaces gratuitous ornamentation with meticulous spacing, systematic typography, and understated contrasts. The primary emotion evoked is confident control—providing high-throughput operators with clarity across dense workflows without visual fatigue. 

The aesthetic is built on:
- **Utilitarian Minimalism**: White and light-slate surfaces, hairline interior borders, and deliberate typographic rhythm.
- **Selective Accentuation**: High-contrast slate headlines anchored by controlled, high-intent placements of royal blue (`#2563EB`) reserved strictly for focal interactions and primary commits.
- **Restrained Semantic Density**: Calm, desaturated status indicators that communicate urgency through subtle tinted fields rather than high-chroma alarms.

## Colors

The color system prioritizes visual calm and hierarchy through a monochromatic neutral foundation paired with an authoritative blue accent.

### Base & Neutrals
- **Canvas Base**: `#FFFFFF` for primary cards, sheets, and dynamic workspace panels.
- **Canvas Background**: `#F8FAFC` (Slate 50) and `#F1F5F9` (Slate 100) for page foundations, layout scaffolding, and structural panels.
- **Hairline Dividers / Borders**: `#E2E8F0` (Slate 200) for subtle boundaries and hairline sectioning.
- **Muted Surfaces**: `#F1F5F9` for data token chips, subtle hover states, and inactive tab wells.

### Primary Accents
- **Primary Interactive**: `#2563EB` (Royal Blue) for primary calls to action, selected row indicators, active focus rings, and crucial workflow checkpoints.
- **Primary Hover / Pressed**: `#1D4ED8` and `#1E40AF` providing tactile visual feedback on primary clicks.

### Content Tiers
- **Primary Text**: `#0F172A` (Slate 900) for headers, values, and high-impact metadata.
- **Secondary Text**: `#334155` (Slate 700) for body copy, labels, and standard inputs.
- **Tertiary / Subdued Text**: `#64748B` (Slate 500) for timestamps, breadcrumb dividers, captions, and empty-state descriptions.
- **Disabled Text**: `#94A3B8` (Slate 400).

### Semantic Status Palette
Status pills avoid harsh borders and heavy saturation, relying instead on clean pastel fills paired with high-contrast text:
- **Critical / Overdue**: `#FFF1F2` (Rose 50) fill with `#BE123C` (Rose 700) text.
- **Warning / In Progress**: `#FFFBEB` (Amber 50) fill with `#B45309` (Amber 700) text.
- **Normal / Low / Info**: `#F1F5F9` (Slate 100) fill with `#334155` (Slate 700) text.
- **Success / Resolved**: `#ECFDF5` (Emerald 50) fill with `#047857` (Emerald 700) text.
- **Escalated / Blocked**: `#FAF5FF` (Purple 50) fill with `#7E22CE` (Purple 700) text.

## Typography

Typography is systematic, legible, and optimized for data density using Inter across all standard levels.

### Hierarchy & Letter Spacing
- Optical kerning is strictly enforced. Tighter negative letter spacing (`-0.025em` to `-0.015em`) is assigned to larger headlines to produce a unified, solid visual block.
- Micro labels and column headers use higher tracking (`0.04em`) with medium/semibold weights to ensure rapid scannability at small sizes.
- Monospace figures (using tabular numbers `tnum`) must be enabled on all numerical records, timers, pricing tables, and analytics cards to prevent layout jittering during updates.

## Layout & Spacing

The layout model is anchored by an 8pt base grid with a fluid 12-column dynamic container system on desktop displays.

### Form Factors & Breakpoints
- **Desktop (1280px and above)**: Global 12-column grid. Main working canvases use `margin: 2rem` and `gutter: 1.5rem`. Side navigation adheres to a persistent width of `260px` or a collapsed icon rail of `64px`.
- **Tablet (768px – 1279px)**: Side navigation collapses to an overlay drawer or 64px rail. Canvas collapses to 8 columns with `margin: 1.5rem` and `gutter: 1rem`.
- **Mobile (Below 768px)**: Single-column linear stack. Canvas padding scales down to `margin-sm: 1rem` and `gutter-sm: 0.75rem`.

### Spacing Principles
- Density is tightly guarded: inner card padding stays clamped between `space-lg` (1rem) for dense tools and `space-xl` (1.5rem) for summaries.
- List items and menu entries use vertical padding of `space-sm` (0.5rem) with horizontal padding of `space-md` (0.75rem) to ensure comfortable target heights of 36–40px without loose spatial leaks.

## Elevation & Depth

This design system relies primarily on low-contrast outlines and tonal layering to separate contexts, keeping shadows near-invisible and highly diffused.

### Structure Over Shadows
- Containers are primarily separated by 1px solid hairline borders in `#E2E8F0` rather than heavy shadow drop-offs.
- In resting states, white cards (`#FFFFFF`) sitting on background panels (`#F8FAFC`) use an ultra-subtle ambient micro-shadow: `0 1px 2px 0 rgba(15, 23, 42, 0.04)`.

### Elevation Tiers
- **Level 0 (Flat / Canvas)**: `#F8FAFC`. Zero elevation, structural container boundaries.
- **Level 1 (Card / Container)**: `#FFFFFF` with 1px border `#E2E8F0` and `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
- **Level 2 (Popovers / Dropdowns / Tooltips)**: `#FFFFFF` floating layer with 1px border `#E2E8F0` and diffused elevation: `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Modal Dialogs / Command Palettes)**: `#FFFFFF` floating surface bordered by `#CBD5E1` with `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)` over a semi-translucent backdrop (`rgba(15, 23, 42, 0.4)`).

## Shapes

With a roundedness index of `2`, the system strikes an exact balance between modern friendliness and technical precision.

- **Base Radius (`0.5rem` / 8px)**: Standard buttons, text input fields, dropdown toggles, and table filter groups.
- **Large Radius (`rounded-lg` / `1rem` / 16px)**: Primary application cards, metric blocks, panels, slide-out drawers, and modal containers.
- **Extra Large Radius (`rounded-xl` / `1.5rem` / 24px)**: Outer marketing dashboard containers or large workflow canvases.
- **Pills (`9999px`)**: Reserved exclusively for semantic status badges, user avatars, and numerical count indicator badges.

## Components

### Buttons
- **Primary**: Background `#2563EB`, text `#FFFFFF`, font-weight 500. Subtle inset shadow on hover, darkening to `#1D4ED8`. Focus ring: `2px solid #93C5FD` offset by 2px.
- **Secondary**: Background `#FFFFFF`, 1px border `#E2E8F0`, text `#0F172A`. Hover state: background `#F8FAFC`, border `#CBD5E1`.
- **Tertiary / Ghost**: Transparent background, text `#64748B`. Hover state: background `#F1F5F9`, text `#0F172A`.
- **Destructive**: Background `#FFF1F2`, text `#BE123C`, hover background `#FFE4E6`.

### Inputs & Form Controls
- **Text Inputs**: Height 36px (compact) or 40px (default). Background `#FFFFFF`, 1px border `#E2E8F0`, text `#0F172A`, placeholder `#94A3B8`. Focus state transitions border to `#2563EB` with an ambient glow of `0 0 0 3px rgba(37, 99, 235, 0.12)`.
- **Checkboxes & Radios**: 16px square/circle with a 1px border `#CBD5E1`. Checked state: background `#2563EB` with an inset white checkmark or dot.

### Navigation Sidebar
- **Background**: `#F8FAFC` separated from main workspace by a 1px solid `#E2E8F0` right border.
- **Item Resting**: Text `#64748B`, font-size `0.875rem`, font-weight 500, padding `0.5rem 0.75rem`, radius `0.375rem`.
- **Item Hover**: Background `#F1F5F9`, text `#0F172A`.
- **Item Active**: Background `#E2E8F0` with opacity 60%, text `#0F172A` with weight 600. No saturated color blocks.

### Semantic Status Badges
- Pill-shaped (`rounded-full`), padding `0.125rem 0.625rem`, font-size `0.75rem`, weight 500, no exterior border.
- Tone pairs strictly map to the pastel specifications (e.g., `#FFF1F2` fill with `#BE123C` text for Critical).

### Cards & Tables
- **Cards**: Background `#FFFFFF`, border 1px `#E2E8F0`, border-radius `0.75rem` to `1rem`, padding `1.25rem`.
- **Data Tables**: Zero outer card border bleed. Header row uses `#F8FAFC` with `#64748B` uppercase tracking labels. Table rows use `#FFFFFF`, alternating hover states at `#F8FAFC`, delimited by 1px bottom borders `#F1F5F9`. Monospace values rendered in `#475569` on `#F1F5F9` badge capsules for identifiers, keys, and hashes.