# Commercial acceptance and full-batch comparison

Use the exact frozen review format returned by `site_review`. This procedure raises the evidence and design bar; it does not replace the schema or permit self-approval.

## First look: observe the rendered site

Savervine was owner-rejected on 2026-10-12 after an internal direction-ready packet. Its cream/pine/marigold slogan-plus-board and repeated heavy cards are a negative example, retained for diagnosis. The packet's imagery assessment only proved official logos loaded and icons were different; its typography/mobile assessments mostly proved sizes and overflow. Those observations do not establish promotional composition, balanced hierarchy, distinctive real coupon/button construction or parity with approved designs. Never use a permitted medium, a theme name, three structural differences or resolved numeric defects as proof of visual completion. Missing generation capabilities must not silently lower the selected design's finish.

On 2026-10-13 the owner also removed Clipwise, Savervine, eveandember-harness-20261008, merryperks-harness-20261008, Goodfind, DealDeck, Aislewise, Storeline, Gridly, Counterpart and Kindred Deals as low-quality, unusable sites. Consult the complete current owner rejection policy; their old internal pass/ready records are superseded and cannot serve as quality references. Diagnostic history is negative evidence only. The original eveandember/merryperks projects remain separate approved homepage references. Reject recreated or lookalike directions, and assess actual commercial finish and usable home/store/listing/detail pages against the excellent references rather than accepting technical compliance or layout novelty.

For a new/rejected homepage, first apply [the owner's UI-first milestone](../../site-design/references/homepage-visual-priority.md). Judge its required original promotional visual and the complete first two folds against actually viewed reference/approved local pages at desktop and phone sizes. A catalogue's usefulness or a novel arrangement cannot waive a weak or absent visual direction. Identify whether imagery, palette, type, selected content and real actions belong together; do not replace this judgment with a point total. During early homepage-direction review, return stage feedback rather than fabricating a complete final report. During final review, the same visual failures remain blocking/major defects.

Use your own local browser visits for local reference builds. External reference comparison uses original coordinator-captured page images with URL/time/viewport, inspected by you with `read_image`; report that limited evidence accurately. External captures are not tool-issued local browser receipts and do not substitute for required final cohort `referenceVisits`.

Open the exact build. See the viewport with `read_image`, then scroll and interact. Before the generator's rationale, record first focus, site identity, shopping task, next action, up to three major problems and strengths. Do not infer sophistication from a theme name, code volume, a different CSS file, rich illustration or a claimed reference pedigree.

Ask whether a U.S. shopper can recognize merchants, understand an offer and reach an appropriate next step. Empty first folds, excessive headline scale, ornamental categories, oversized action panels or a catalogue buried below several introductions are genuine defects even if readable and technically responsive. Conversely, a dense useful catalogue is not inherently less premium than a spacious one.

Inspect more than the home hero. Cover home, store, listing/discovery and detail, then seasonal discovery, formal information and applicable search/results states. Include short/long offer titles, source-listed/unknown/expired conditions and code/no-code behavior. Main detail, related rows, eight topic recommendations and sixteen other stores must preserve usable gaps and alignment.

Use the required phone/tablet/desktop matrix and breakpoint boundaries. A phone view must prioritize content and actions deliberately; “everything became full-width cards” is not automatically a successful mobile composition. Inspect image crop, logo readability, CTA state contrast and sibling overlap as well as document overflow.

For typography, inspect the actual role coverage as well as the measured values. `site_browser` defaults to `[data-site-role="card-title"]`; when the generated markup uses different classes, supply selectors for its real coupon titles, merchant names and sidebar/recommendation names. An empty match list does not establish compliance. Check these roles again after client redraw and at the phone breakpoint; page-heading freedom does not exempt a title or merchant name inside a card.

## Fact audit: reconcile what is displayed

Read the frozen content provenance and catalogue after the visual first look. For every sampled page, reconcile visible merchant identity, title scope, code/deal type, source date/status, destination and category against actual cited evidence. Check featured records, each observed detail state, and records in client-rendered search/filter results. Use automation to reconcile the full catalogue where available; manual samples alone do not prove every record correct.

Exercise a combined type/category filter and an empty result, then reconcile the displayed count **and adjacent scope wording** with the actual represented records. “4 offers across 12 departments” fails if those four results all belong to one department. Check page/header totals as well as row counts and merchant/topic counters after filtering and reload. Verify that date/status labels and links still belong to the same selected records. For expiry, check any available real expired state and, where controlled-time verification is available, the before/after boundary without altering source dates or the system clock: expired records must not remain in eligible totals or keep claim actions merely because the original HTML was static. Cover the extracted offline package too; record unavailable time-boundary verification honestly instead of claiming it ran.

For a new site, audit the complete built route/ZIP inventory, including redirects absent from navigation. Trace merchant aliases through their redirect or canonical target to the final displayed identity and offer destination; an old demo alias leading to a different brand is a defect even when every URL resolves. Request a source-level route fix and a new build. For existing sites, compare with the authorized compatibility baseline and report unrelated inherited behavior outside the requested scope without demanding indiscriminate route deletion.

Return `revise` for invented codes, reset/rotated dates, unsupported sale amounts, wrong merchant/category, an international offer represented as guaranteed US/USD, fabricated popularity or claims of merchant verification. A general footer disclaimer cannot cure a false claim on a coupon. Omit unsupported values or preserve an explicit unknown state in the correct region; do not demand tiny source text on every card.

Seasonal discovery may be an editorial collection. Confirm it does not imply merchant participation or current holiday validity without evidence. Review dates and the actual generated date, not just the headline. Black Friday, Christmas and Christmas Eve should have appropriate shopping purposes and distinct presentation instead of one copied category grid.

Populate v6 `contentReview` with `status`, `observation`, the exact frozen `manifestHash`, and `merchants`/`offers` observations linked to own visit indices and real `sourceIds`. Inspect at least three distinct merchants and three offers, or all records when fewer exist. Include `claims.code`, `claims.expiry`, `claims.verified` and `claims.seasonal`, each with actual `status`, `mode: sourced|absent`, `visits`, supporting `sourceIds` when sourced, and an observation. “Absent” requires checking that the assertion is absent in the rendered UI and data; it is not a shortcut around a missing audit.

Audit both detail route families separately; a complete coupon-detail catalogue does not establish store-detail coverage:

| Actual route family | Required recommendation evidence |
| --- | --- |
| Store detail (`family: store`) | At least 8 real, relevant, unique topics, plus at least 16 unique real merchants excluding the current store in the final main-column recommendation region |
| Coupon detail (`family: detail`) | At least 8 real, relevant, unique topics, plus at least 16 unique real merchants excluding the coupon's merchant in the final main-column recommendation region |

Cover both rows at the required desktop and phone widths. Scroll to the main column's end and check the rendered items and their destinations; sidebar merchants cannot make up the 16. For every own `store` or `detail` visit, add `contentReview.recommendations` with that `visit` index and the observed unique `topicIds` and main-column `merchantIds`. Resolve IDs to the frozen manifest. Do not count duplicates, invisible items, arbitrary theme glyphs or the current merchant. A failure in either family requires revision; success in the other does not offset it. Refer to the frozen report format for the authoritative schema; old builds retain their frozen contract.

If the entire source catalogue lacks a real code or expired case, do not manufacture one for public display. Record that specific `cases` entry as `not-applicable` with a factual `reason` and exact `sourceManifestHash` where the frozen schema permits it. This is explicitly an unexecuted unavailable state, not a pass of copy/expired behavior. Exercise all actual applicable source states, including no-code and unknown-date behavior.

## Compare every member of the batch

The frozen `docs/batch-design.json` names the cohort. Open every other member's real candidate build; do not compare descriptions from their plans. Use matched content where possible (same merchant and code/deal type) so a different record does not masquerade as a design difference. Compare home/store/listing/detail and mobile. Also inspect the nearest old local design to detect accidental reuse.

Evidence requirements for the v6 contract:

- Every own `visits` record includes the immutable `evidenceId` returned by `site_browser`.
- Each `referenceVisits` record identifies `projectId`, `buildId`, `artifactHash`, `route`, `width`, `family`, `evidenceId` and a specific `observation`.
- Each other cohort member gets a `comparison` record with its exact project/build identity, all four `pageFamilies`, and evidence-linked `differences`. Include at least `composition` or `mobileComposition`, `cardConstruction` and `actionConstruction` axes. Use `visit`/`referenceVisit` as required by the frozen schema; copy real indices/IDs, never invented receipts. Record `referenceRoute`, current observation, reference observation and user-facing impact.
- Keep existing separate `cardIdentity` assessments for store and detail. A changed homepage cannot compensate for identical merchant rows and claim cards.

Three axes are necessary, not sufficient. Reject comparisons that count shadows, notches, hover color or vocabulary while the first-fold shape, repeated module rhythm and action construction remain effectively the same. A site may share a fixed detail business skeleton and a conventional row list; judge meaningful differences inside those boundaries without demanding disruption of known shopping behavior.

Compare actual action controls, including View Details, Copy code and SHOP NOW, not decorative links built only to pass the comparison. Record whether the design remains internally consistent after search/filter rerenders. Different fonts or radii are allowed components of identity, but cannot alone support a cross-site uniqueness verdict.

## Quality verdict

Judge each dimension independently: shopping clarity, composition/rhythm, typography, color/states, imagery, card/action craftsmanship, responsive behavior, factual accuracy and cohort diversity. A major failure in any one means `revise`; do not average it away with numerical scores or praise in another dimension.

Repair requests specify route, viewport, state, observation, impact, intended outcome and observable retest. “Make it premium” is not actionable; “At 390px the 16-store section repeats 280px-tall tiles, causing 12 empty screenfuls; make merchant recognition compact while retaining distinct targets and legible names” is. Do not prescribe your favorite theme, fixed card or mandatory decoration as the solution.

Final acceptance requires actual final-build evidence, resolved inherited defects and completed peer comparisons. Missing source evidence, inaccessible peer pages or unavailable browser/image inspection is `not-run` for the relevant check. Preserve evidence and report the gap; never infer a pass from a manifest, code review, green numeric audit or another agent's prose. Internal acceptance remains separate from the owner's aesthetic approval.
