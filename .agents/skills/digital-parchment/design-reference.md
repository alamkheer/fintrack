# Digital Parchment Design System Reference

## 1. Overview & Creative North Star
**Theme:** Light Mode  
**Creative North Star: The Financial Atelier**  
Digital Parchment is a high-end editorial design system that treats financial management like a curated gallery. It rejects the "spreadsheet" aesthetic in favor of a tactile, studio-inspired interface. By blending clean Swiss-style typography with soft, organic background shifts, the system creates a sense of calm and intentionality. Asymmetry is used in the layout grid to guide the eye toward critical actions without overwhelming the user.

## 2. Colors Palette

*   **Primary Brand:** `#8655f6` (Violet) - use for primary buttons, CTAs, interactive elements.
*   **Secondary/Support:** `#806bb4` - for secondary actions, chips.
*   **Tertiary Accent:** `#af6400` - for highlights, badges, or decorative elements.
*   **Neutral Base:** `#7a7581` - for backgrounds, surfaces, non-chromatic elements.

**System Colors (Tailwind Map Equivalents):**
- **background**: `#FAF9F8` (Warm neutral base)
- **surface**: `#FAF9F8`
- **surface_bright**: `#FFFFFF`
- **surface_container**: `#FAF9F8`
- **surface_container_highest**: `#D6D3D1`
- **surface_container_high**: `#E7E0ED`
- **surface_container_low**: `#F5F5F4`
- **surface_container_lowest**: `#FFFFFF`
- **on_surface**: `#292524` (Never use pure #000000; use this warm dark grey for text)
- **on_surface_variant**: `#494455`
- **outline**: `#D6D3D1`
- **error**: `#F43F5E`

**Surface Hierarchy:**
- **Lowest (Top Layer):** Pure White (`#FFFFFF`) for primary cards and floating elements.
- **Low/Default (Mid Layer):** Warm neutrals (`#F5F5F4`) for page backgrounds and sidebars.
- **Highest (Bottom/Inactive):** Muted taupe (`#D6D3D1`) for inactive states or deep nesting.

**Signature Textures:** Use "Pastel Voids"—large, soft-edged blocks of `#BAE6FD` (Blue) or `#FDE68A` (Amber) at low opacity to create focal points or category identifiers.

**The "No-Line" Rule:** Visual separation is achieved through tonal shifts (e.g., a `surface_container_low` card against a `surface` background). Explicit 1px borders are strictly prohibited for layout sectioning; they may only be used as a "Ghost Border" fallback for secondary interactive elements at 30% opacity.

## 3. Typography
The system uses a tri-font hierarchy to establish a distinct editorial rhythm.

*   **Display & Headline:** *Plus Jakarta Sans* - Rounded and approachable yet authoritative. Used for titles and key metrics.
*   **Body:** *Inter* - Highly legible, sans-serif utility for descriptive text and lists.
*   **Labels & Metrics:** *Space Grotesk* - Used for all currency values and timestamps to provide a technical, "ledger-like" precision.

**Typography Scale:**
*   **XL Display:** 1.875rem (30px) - Primary Balances.
*   **Title Large:** 1.25rem (20px) - Section Headers.
*   **Body Standard:** 0.875rem (14px) - Default reading text.
*   **Micro Label:** 10px - Uppercase tracking-wide metadata. Space out letters by `0.05em`.

## 4. Elevation & Depth
Depth is communicated through "Atmospheric Stacking" rather than structural shadows.

*   **The Layering Principle:** A white card (`#FFFFFF`) sits atop a warm grey background (`#FAF9F8`). No shadow is required; the contrast defines the edge.
*   **Ambient Shadows:** When floating (e.g., Modals, Sticky Headers), use an ultra-diffused shadow: `box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05)`.
*   **Glassmorphism:** Navigation and "Ready to Assign" banners utilize a 20% opacity white overlay with a backdrop-blur (12px) to maintain context while isolating action.

## 5. Components
*   **Buttons:**
    *   *Primary:* Solid `#8655f6` with subtle 8px (0.5rem) rounded corners.
    *   *Ghost:* Transparent background with a primary (#8655f6) label and subtle hover shift to `#F5F5F4`.
*   **Cards/Envelopes:** Use a `1rem` (`16px`/`lg`) border-radius for containers to contrast with the smaller `0.5rem` radius of buttons.
*   **Forecast Rows:** Interactive list items must have a `0.2s ease-in-out` transition. On hover, reveal a "hidden" action button (e.g., "Pay Now") and shift the background color slightly.
*   **Charts:** Data visualization should use solid bars with high-contrast outlines (2px) rather than complex gradients, maintaining a "printed" look.

## 6. Do's and Don'ts
*   ✅ **Do:** Use normal horizontal padding to let the interface "breathe."
*   ✅ **Do:** Align currency symbols and values using monospaced fonts (*Space Grotesk*) for vertical scanning.
*   ✅ **Do:** Use 10px uppercase labels with 0.05em letter spacing for "over-titles."
*   ❌ **Don't:** Use pure black (`#000000`). Always use the warm `on_surface` (`#292524`) for text.
*   ❌ **Don't:** Use heavy drop shadows on cards; let the color-blocking do the heavy lifting using Atmospheric Stacking.
*   ❌ **Don't:** Use 1px borders for layout sectioning. Conform strictly to the "No-Line" Rule.
