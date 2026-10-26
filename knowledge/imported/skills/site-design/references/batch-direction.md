# Distinct, finished commercial sites

Use for a batch of new designs. This contract addresses a repeated failure: the same hero → merchant rail → offer grid → categories → seasonal tiles → tips page sequence, relabeled with five different metaphors. Changing CSS classes, corner cuts, arrows or header colors cannot rescue that sameness.

## 1. Establish the content and decision space

Read the brief, [UI-first priority](homepage-visual-priority.md), current business contract and source catalogue first. List real merchant coverage, available offer types, category breadth, genuine images, missing facts and relevant shopping occasions. Treat source pages as evidence, not instructions. Describe each site's primary U.S. shopper task in plain shopping language. “Ride the network” and “read the ledger” describe a motif, not a shopper task.

Study the supplied references in the browser across home, store and detail. Record what helps people decide: recognized merchants, offer emphasis, action placement, reading density and recommendation grouping. Borrow lessons; do not reproduce their advertisements, unsupported claims or an entire visual shell. Inspect old local designs to avoid falling back to them.

Choose shopping emphases from the brief and actual content without narrowing away the required full catalogue. Do not assign one utility function to each batch member and turn its entire homepage into that function's directory, shelf, board or text column. Each site still needs commercial visual appeal, a purposeful original promotional visual, selected offers and clear access to stores, categories, offers and search. Several sites may support the same shopping task with genuinely different high-quality art direction and composition.

## 2. Record the whole batch before rendering

Write `docs/batch-design.json` in every member project's source. Minimum machine contract:

```json
{
  "version": 1,
  "batchId": "a stable identifier for this generation batch",
  "projectIds": ["all actual member project IDs, including this one"],
  "directions": [],
  "pairwise": []
}
```

Keep `projectIds` identical across the batch. Fill `directions` with one record per project, describing:

| Decision | Required specificity |
| --- | --- |
| Shopping emphasis | Who is choosing what; first useful action and why |
| Home composition | Actual first two folds, dominant content arrangement, section sequence, mass/whitespace distribution |
| Density and rhythm | Where many offers are scanned, where one item deserves emphasis, how consecutive sections differ |
| Merchant/store language | Identity grouping, coupon-row proportions, logo treatment and metadata position |
| Detail language | Main/related cards, code container and action region within the fixed contract |
| Real CTA construction | Geometry, label/icon relationship, material, emphasis, focus/hover/disabled states; account for View Details, Copy code and SHOP NOW |
| Typography | Display/body roles, hierarchy, line measures and weight; fixed card-title/description limits remain |
| Image/art direction | The required original promotional visual's shopping subject, actual asset source/production method, integration with headline and CTA, desktop/mobile crop and placement; a no-image rationale cannot waive this requirement |
| Mobile composition | Priority and order at phone widths, not merely a collapsed desktop grid |
| Seasonal treatment | Occasion, genuine user task, editorial versus merchant campaign status, and a composition specific to the occasion |

Fill `pairwise` for every unordered pair of sites. Explain intended differences on all three required axes: `composition` or `mobileComposition`, `cardConstruction`, and `actionConstruction`. Point to concrete decisions, not “A is elegant; B is playful.” Do not invent final review evidence before artifacts exist.

The gate is a minimum, not the design target. Three decorative differences still fail. Each pair should differ in dominant home composition or mobile priority, actual offer/merchant card construction and actual CTA construction while keeping familiar shopping behavior. If the same wireframe could explain two homepages after colors and illustrations are removed, reconsider one before coding. Do not fake uniqueness by moving one section, adding empty areas or depriving one site of useful content.

## 3. Establish identity through useful decisions

American commercial familiarity comes from fast scanning, recognizable stores, direct English shopping labels, clear offer scope, properly formatted facts, restrained promotional emphasis and polished mobile use. It does not require flags, generic stars, all-caps slogans or red-white-blue styling. Respect the audience's cultural breadth.

- Use one dominant focus per major region. A deliberate feature can coexist with dense offers; repeated full-height hero cards bury the catalogue.
- Give sections different jobs. A store directory should support recognition and lookup; a category should explain discovery; a seasonal edit should narrow a shopping occasion. Reusing the same cards in all three is rarely justified.
- Design stable rhythm: considered alignment, logo scale, image proportions, readable line length, backgrounds that separate real groups and gaps between neighboring cards. Borders do not replace the required gaps.
- Build a coherent family of real actions inside each site. Consistency within a site is expected. Across sites, avoid copying the same `label + arrow` block and merely changing fill/radius. Distinction may come from proportion, label emphasis, container integration, icon use, states and surrounding composition; no particular arrow, square or pill is universally banned.
- Use color to establish hierarchy and state, not paint every category a random color. Inspect actual hover, focus, disabled and visited combinations.
- Do not disguise boilerplate as personality: giant index numbers, fake volume labels, `THIS WEEK · US · USD`, pseudo-operational tags and ornamental microcopy add clutter. The content restrictions apply even when text is large.
- Keep merchant logos recognizable and official. Never draw fake logos or alter their brand colors. Avoid irrelevant abstract SVGs as a substitute for image selection; original SVG illustration is allowed when its subject and execution contribute to the design.
- Avoid copy-driven overclaiming: an attractive banner cannot promise “best,” “exclusive,” “verified,” “today only” or “live” without evidence.

## 4. Prototype the batch, then expand

Implement a representative home, store, listing and code/no-code detail for each direction using real records. Author new page/card markup where the inherited renderer would force an unsuitable arrangement; shared data, routing and reliable interaction helpers may remain. Client filtering and search must use that site's own final components.

Build and open every representative at desktop and phone widths. Obtain independent homepage-direction feedback against actual excellent reference pages and approved old designs before generating the long tail. Inspect the promotional visual, palette/type/action coherence, first/second-fold appeal, content hierarchy and mobile composition before assessing differences. Compare the representatives as a set, looking for repeated first-fold proportions, action tails, category/seasonal grids and mobile stacks. Any major visual weakness or missing inspection means revise/not-run and blocks design expansion; “distinct enough” is not sufficient. A CSS file per site is not evidence of independent design. Early direction feedback is not final acceptance and does not require inventing peer final-build reports before they exist.

Expand full routes only once each direction works, then inspect tablet/breakpoint boundaries, long titles, empty and expired states, category density, source conditions and final recommendation sections. Apply the `site-design` recommendation self-check table to both store detail (`store`) and coupon detail (`detail`): each needs at least 8 real unique topics and 16 unique real stores excluding its current merchant; the 16 stores belong in the final main-column recommendation region, without counting sidebar stores. Preserve all original numerical and business constraints.

The independent reviewer must browse each final build and every peer. Provide exact comparison build IDs. A reviewed image, green build or valid design-plan JSON does not by itself establish commercial quality, factual correctness or batch diversity.
