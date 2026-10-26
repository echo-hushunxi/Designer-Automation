# Frozen design plan

New designs save `docs/site-design.json` in the selected project's source before build. The build freezes and hashes it alongside the exact design/review skills. Preserve/reuse work does not need to invent a fresh direction.

Future Coupon imports also bind [the common craft standard](coupon-common-craft.md). Complete the separate docs/site-craft.json from its bound template before structure preflight; it records specific color roles, four spacing layers, per-card space/action/phone choices, density and fact checks. This supplements the direction below and can retain explicitly reused design choices without pretending they are original. Neither plan is an aesthetic pass. Old frozen projects are not retroactively bound.

Required shape (descriptions below are schema guidance, not a finished plan):

```json
{
  "version": 1,
  "audience": "Who is browsing and what matters to them",
  "mainTask": "The concrete shopping task",
  "direction": "The distinctive idea and why it fits this content",
  "composition": {
    "home": "First focus, browsing order, offer arrangement and page rhythm",
    "store": "Identity, one-offer-per-row arrangement and sidebar treatment",
    "listing": "One concrete applicable discovery/list surface and its composition"
  },
  "visualLanguage": {
    "typography": "Font roles and hierarchy within fixed readability limits",
    "palette": "Actual colors and their roles, including interactive states",
    "imagery": "Relevant subject, medium, crop and treatment",
    "density": "Where content is compact, where it breathes and mobile reflow",
    "actions": "How real actions are recognized and fit the brand"
  },
  "detail": {"mode": "fixed-contract", "baseline": "skills/coupon-site/references/layout-requirements.md plus any retained design reference"},
  "cardDesign": {
    "store": "Specific identity card and coupon-row geometry, logo/text grouping, date and actual CTA treatment",
    "detail": "Specific main/related coupon composition, code container, type hierarchy and action treatment inside the retained business framework"
  },
  "references": [{"source": "Actual inspected URL or local build", "borrow": "Specific compositional idea", "avoid": "Reference-specific content or inappropriate convention"}]
}
```

Optional `alternatives` can capture rejected composition ideas. Optional `implementation` can identify the site's renderer, CSS and shared behavior. These are project records, never visible website text. A valid JSON file is not proof of a good design: the independent role must compare the plan with the actual result.

For a new batch, this per-site plan accompanies `docs/batch-design.json` from [batch direction](batch-direction.md); it does not replace the complete cohort record. Add concrete `implementation` paths for renderer, data adapter, interaction code and asset copier. If using an inherited renderer, explain which chosen compositions it can express and which parts were replaced. Avoid five plans that describe the same layout using different thematic nouns.

For source-backed work, add `content: {"mode":"source-backed","manifest":"docs/content-provenance.json","catalogue":"the actual project-relative catalogue path"}`. If using seasonal elements, add `seasonal` entries with occasion ID, actual date, editorial/campaign status, source IDs when making a factual claim, and the intended shopping task. The content/seasonality reference owns truthfulness requirements; a plan is not evidence of facts.

Record the primary shopping task, first two folds, CTA anatomy and phone priority in enough detail to implement and compare. Follow [the owner's UI-first priority](homepage-visual-priority.md): record the required homepage promotional visual's actual asset/production decisions in `banner-assets.json`, or state that the visual milestone is still incomplete. An intentional no-Banner declaration does not waive the requirement. Suitable authorized artwork or finished original illustration remains allowed; preserve accepted existing designs outside the requested scope.

`fixed-contract` refers to the business flow, required information and explicit numerical/layout boundaries. It does not mean the same card layout and appearance across sites. Both cardDesign entries must describe independent design choices, not just different colors or “use the fixed detail template”.
