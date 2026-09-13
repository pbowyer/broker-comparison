---
name: Broker Comparison
description: A calm, transparent UK investment platform fee calculator.
---

# Design System: Broker Comparison

## 1. Overview

**Creative North Star: "The Annotated Statement"**

The interface should feel like a carefully reviewed financial statement: ordered, legible, and explicit about how each number was reached. FT data graphics provide the model for numerical hierarchy; GOV.UK provides the model for accessible forms and candid guidance. The light theme is intended for a person making a deliberate comparison at a desk in daylight.

The system rejects sales-led comparison styling and opaque quiz flows. Information appears progressively, but users can always inspect the facts, fee formula, date, source, and restriction behind a result.

**Key Characteristics:**

- Restrained colour with one functional accent
- Humanist, highly legible typography with tabular numerals
- Clear document rhythm rather than a dashboard of interchangeable cards
- State transitions only, with no decorative choreography

## 2. Colors

Use warm tinted neutrals for the page and ink, with one sober brick accent reserved for actions, focus, and current selection.

- Paper: `oklch(97.2% 0.008 52)`
- Raised surface: `oklch(98.6% 0.006 52)`
- Recessed paper: `oklch(94.5% 0.012 52)`
- Ink: `oklch(22% 0.018 35)`
- Secondary ink: `oklch(43% 0.017 35)`
- Rules: `oklch(78% 0.014 48)` and `oklch(60% 0.018 42)`
- Accent: `oklch(43% 0.13 31)`; hover at `oklch(35% 0.12 31)`
- Warning surface: `oklch(95% 0.045 78)`

**The One-Marker Rule.** The accent occupies no more than 10% of a screen and never marks a provider as endorsed.

## 3. Typography

**Display Font:** Avenir Next, falling back to Avenir, Segoe UI, and the system sans-serif.
**Body Font:** The same family. Weight and spacing distinguish hierarchy without adding another typeface.

**Character:** Clear at form and table sizes, warm without becoming casual, and precise around large monetary values. Use tabular numerals wherever figures align or update.

**The Statement Rule.** Hierarchy comes from scale, weight, spacing, and rules, never ornamental display type.

## 4. Elevation

The interface is flat by default. Tonal surface changes and fine rules establish structure; shallow elevation may appear only when a disclosure or floating control must sit above surrounding content.

**The Paper Rule.** If a shadow looks like a floating software card rather than a sheet placed on a desk, remove it.

## 5. Components

Controls use familiar browser conventions, three-pixel focus rings, and a minimum 44-pixel target. Person rows combine an inclusion switch, editable name, total, and delete action. Account disclosures keep the compact summary visible above a recessed editor. A compact fieldset filters the three source tables and separates the trust decision about £0 providers from the table selection. Strategy columns pair a large tabular annual fee with account assignments, restrictions, and an expandable calculation. Provider rankings use a real table on wide screens and labelled cells on narrow screens.

Spacing follows a compact eight-pixel rhythm: 4, 8, 12, 24, 32, and 48 pixels. Corners stay nearly square at `0.2rem`; rules and tonal changes establish structure instead of shadows.

## 6. Do's and Don'ts

### Do:

- **Do** lead with the three strategy answers and reveal rankings, formulas, restrictions, and sources on demand.
- **Do** use colour for state and interaction, never as the sole carrier of meaning.
- **Do** make changing active people and account values feel immediate and reversible.

### Don't:

- **Don't** resemble a sales-led comparison site: no promotional broker treatment, urgency, decorative logos, affiliate-style winner badges, or visual cues that imply endorsement.
- **Don't** reduce the decision to an opaque quiz or hide material assumptions behind a simplified recommendation.
- **Don't** turn every section into a card or use decorative financial imagery.
