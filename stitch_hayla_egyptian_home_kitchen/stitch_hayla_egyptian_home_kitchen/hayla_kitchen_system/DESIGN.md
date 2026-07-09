---
name: Hayla Kitchen System
colors:
  surface: '#fef9f2'
  surface-dim: '#ded9d3'
  surface-bright: '#fef9f2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f3ec'
  surface-container: '#f2ede6'
  surface-container-high: '#ece7e1'
  surface-container-highest: '#e6e2db'
  on-surface: '#1d1c18'
  on-surface-variant: '#56423d'
  inverse-surface: '#32302c'
  inverse-on-surface: '#f5f0e9'
  outline: '#89726c'
  outline-variant: '#dcc1ba'
  surface-tint: '#9c4329'
  primary: '#994127'
  on-primary: '#ffffff'
  primary-container: '#b8583d'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb5a0'
  secondary: '#805600'
  on-secondary: '#ffffff'
  secondary-container: '#fdbe5a'
  on-secondary-container: '#734d00'
  tertiary: '#4e6143'
  on-tertiary: '#ffffff'
  tertiary-container: '#667a5a'
  on-tertiary-container: '#f8ffee'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd1'
  primary-fixed-dim: '#ffb5a0'
  on-primary-fixed: '#3b0900'
  on-primary-fixed-variant: '#7d2c14'
  secondary-fixed: '#ffddb0'
  secondary-fixed-dim: '#fabb57'
  on-secondary-fixed: '#291800'
  on-secondary-fixed-variant: '#614000'
  tertiary-fixed: '#d3e9c3'
  tertiary-fixed-dim: '#b7cda8'
  on-tertiary-fixed: '#0f2008'
  on-tertiary-fixed-variant: '#394c2f'
  background: '#fef9f2'
  on-background: '#1d1c18'
  surface-variant: '#e6e2db'
typography:
  headline-xl:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Quicksand
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Quicksand
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style

The design system is built to evoke the sensory experience of a modern Egyptian home kitchen—authentic, soulful, and deeply comforting. It balances the rustic heritage of homemade cooking with the clean, effortless usability of a contemporary digital product.

The style is a blend of **Minimalism** and **Tactile warmth**. It prioritizes high-quality, warm-toned food photography as the primary visual anchor, supported by generous whitespace and subtle organic textures. The interface should feel "made-by-hand," utilizing hand-drawn brush-stroke accents and minimal Egyptian-inspired motifs to create a sense of artisanal care and local trust. 

Targeting an audience that values quality over speed, the emotional response is one of safety, nostalgia, and the invitation to share a meal.

## Colors

The palette is grounded in the earth and the kitchen. **Terracotta** serves as the primary brand color, representing the traditional clay pots (*tajines*) and warmth of the oven. **Cream/Beige** is used for almost all backgrounds to reduce eye strain and provide a softer, more paper-like feel than pure white.

- **Primary (Terracotta):** Used for primary calls-to-action, key iconography, and brand-defining moments.
- **Secondary (Ochre):** Used for highlighting freshness, ratings, and secondary buttons.
- **Tertiary (Olive):** Provides a natural contrast for healthy options, labels, and success states.
- **Accent (Deep Red):** Reserved for seasonal offers or highlighting "signature" dishes.
- **Surface:** Always use the Cream/Beige for card containers and background layers to maintain the rustic atmosphere.

## Typography

This design system uses a sophisticated pairing of an elegant serif and a friendly, rounded sans-serif. 

**Playfair Display** provides an authoritative yet literary feel to headlines, suggesting the "story" behind every dish. Use it for page titles, category names, and large promotional banners.

**Quicksand** handles all functional text. Its rounded terminals mirror the "soft" brand personality and ensure high legibility in recipes, ingredients lists, and ordering flows. 

- Use **Medium (500)** weight for body text to ensure it holds enough visual weight against the warm background.
- Keep line heights generous to allow the text to "breathe," reinforcing the system's unhurried, cozy aesthetic.

## Layout & Spacing

The layout philosophy follows a **fluid grid** with significant breathing room to avoid a "cluttered market" feel. 

- **Desktop:** 12-column grid with a max-width of 1200px. Use 48px to 80px of vertical section spacing to separate different meal categories or kitchen stories.
- **Mobile:** 4-column grid with 16px side margins.
- **Rhythm:** All spacing should be multiples of 8px. Use 24px (md) for the standard gap between cards and 12px (sm) for internal card padding.

Emphasis should be placed on asymmetrical layouts when featuring photography—don't be afraid to let images bleed off the edge of a container to create a dynamic, modern feel.

## Elevation & Depth

To maintain the "warm and rustic" feel, this design system avoids harsh, technical shadows. Instead, it utilizes **Ambient Shadows** and **Tonal Layers**.

- **Shadows:** Use extremely soft, diffused shadows with a slight Terracotta or Umber tint (#C05E42 at 5-8% opacity) rather than pure black. This makes elements feel like they are resting on a tablecloth rather than hovering in digital space.
- **Layers:** Use subtle shifts in background color (e.g., a slightly darker beige for the "main" surface and pure white for "active" cards) to create depth.
- **Textures:** A very low-opacity linen texture overlay (2-3% opacity) should be applied to large background areas to give the UI a tactile, physical presence.

## Shapes

The shape language is consistently soft. There are no sharp 90-degree corners in this design system.

- **Standard Elements:** Buttons, input fields, and small cards use a 0.5rem (8px) radius.
- **Large Components:** Hero images and large food category cards use a 1.5rem (24px) radius.
- **Decorative:** Hand-drawn "blob" shapes or brush-stroke underlines should be used sparingly behind icons or beneath headline text to break the geometric rigidity of the grid.

## Components

### Buttons
- **Primary:** Solid Terracotta background with White text. Rounded (8px). Subtle lift on hover.
- **Secondary:** Outlined in Olive Green or Terracotta with a 1.5px border.
- **Tertiary:** Text-only with a hand-drawn brush-stroke underline that appears on hover.

### Cards
- Food cards should feature a top-heavy layout with the image occupying 60% of the height. 
- Use the "Rounded" (16px) corner radius for images and the "Soft" (8px) radius for the container itself.
- Information (Price, Time, Rating) should be neatly tucked into a bottom-row layout using Olive Green for functional icons.

### Inputs & Selection
- **Input Fields:** Soft beige background, slightly darker than the page background, with a 1px Ochre border when focused.
- **Checkboxes/Radios:** Circular and soft-edged. When selected, they should fill with Olive Green to symbolize "natural" and "fresh."

### Additional Components
- **The "Story" Chip:** A small, rounded label (Pill-shaped) using the Ochre background and dark text to highlight "Chef's Special" or "Family Recipe."
- **Divider:** Use a thin, slightly irregular "pencil-thin" line rather than a perfect vector line to separate sections, maintaining the artisanal feel.