# Source facts, U.S. shopping and seasonal content

Use for every newly generated coupon site. The owner-selected Feishu Coupon public API supersedes the imported coupon-ui-lab illustrative-data default for new generation. It does not mutate old sites or prove a source's coupon is redeemable.

## Freeze facts before writing copy

The requested source is the [Feishu Coupon public library](https://tanyueco.feishu.cn/wiki/N2exwDwzpiYaV6kXoZvcmW9cnie), served by `http://new.sp.com/open-api/coupon`. Load the Harness site-data skill; use the installed public API snapshot and raw evidence. Fetch additional records only from the same public API and record their URL/time/hash. Inspect actual responses when a field or record is ambiguous. Merchant official domains may corroborate merchant identity or eligibility, but do not follow purchase flows to manufacture a verification claim.

Record `docs/content-provenance.json` in the project's source before build. Use the current machine schema enforced by the build and report tools. The source-backed manifest contains versioned source records with URL, retrieval time, raw evidence path and hash; merchants/offers/topics link to source IDs. Claim values link to their supporting sources. Preserve a local copy of the actual normalized catalogue and cited evidence so later builds remain reproducible.

Captured does not mean publishable. Before selecting offers, review the title's month/season against the snapshot date, its eligibility and thresholds, and whether it describes one offer or a coupon directory, rolling promotion collection, loyalty program or service guarantee. A later expiry field does not cure an outdated title; do not remove the old month to manufacture an evergreen offer. Conflicting or indistinguishable thresholds must be excluded pending clarification rather than choosing the most attractive value. Keep a separate, versioned curation selection with offer IDs, source IDs and reasons: distinguish excluded records from retained records that are unsuitable for featured positions. Preserve the immutable catalogue/raw evidence and do not generalize missing codes or unknown dates into invalidity. Every page, detail route, recommendation, search/filter result, metadata consumer and count must derive from the same included selection; featured positions also apply its no-featured restrictions. Freeze that selection with the new build without changing old sites' established baselines.

Source observations and editorial selections have different meanings:

| Field | Allowed handling |
| --- | --- |
| Merchant name, official domain, logo | Preserve actual identity and exact domain. Attribute logo/source evidence; avoid guessed domains and lookalike placeholders. |
| Offer title/scope | Faithfully restate the source terms. Preserve “up to,” selected products, new-customer restrictions and membership requirements. Do not turn a partial promotion into a sitewide offer. |
| Coupon code | Use only the exact code actually exposed in evidence. No `contentKey + discount`, random suffix, masked value interpreted as a real code, or default fallback. |
| End date | Retain a source date only when explicit and coherent. Date-only evidence remains date-only; do not invent midnight UTC. Unknown is null/unknown, not a rotated deadline. |
| Current status | Expired stays expired. An unknown end date is not evidence the offer works today. `source-listed` is not `verified`, and no active-code test is implied. |
| Offer count | Derive from the actual represented selection and status. Public shopping counts can simply say “N offers”; do not prepend source-listed, verified or live labels. |
| Category | Map by real merchant/offer relevance. Editorial categories may group sourced records; record the mapping reason and never fabricate an offer to populate a category. |
| Region/currency | Use US/USD only where the source supports it or the field is explicitly the site's browsing locale. An English interface does not make every international merchant offer U.S.-eligible. |
| Popularity/ranking | Do not turn source ordering into measured popularity, savings rank, usage count or customer endorsement. Use honest editorial selection language where needed. |

Do not load historical generated catalogue facts as production defaults. Legacy `data.mjs` may synthesize coupon codes, rotate fixed dates and mark unverified entries as listed; those are incompatible with this task's new sites even if source validation previously passed. Update every consumer: SSR, search/filter redraw, code payload, count logic, detail conditions, metadata and offline package. A manifest is not enough if the UI still imports the old arrays.

Treat a result count and its neighboring scope copy as one statement derived from the current filter and date-eligible pool. For example, a Codes + Pets result cannot retain “across 12 departments” from the unfiltered catalogue when only Pets is represented. Keep distinct whole-catalogue totals clearly scoped. On initial load, reload and client redraw, recompute affected page/header totals, merchant/topic counts, date/status labels and action destinations from the same selected records and current date policy; updating rows alone leaves stale claims elsewhere. When an offer expires, its literal source date stays unchanged while eligibility, counts and claim controls change consistently. Check combined filters, empty results and the expiry boundary in hosted and offline behavior; do not add a source explanation strip to compensate for incorrect values.

New designs must audit the complete generated route inventory and ZIP, including unlinked redirects. Do not inherit legacy demo merchant aliases that send one brand's slug to an unrelated real merchant. Route slug, displayed identity, offer ownership and final destination must agree; keep an alias only when its same-merchant relationship is supported. Existing sites retain their authorized compatibility baseline: identify scope and preserve those routes rather than deleting historical aliases globally. Fix new-site route generation at the source, not only navigation links or an already built ZIP.

If a source classifies an offer as code but does not expose the code, preserve that unknown state. Do not relabel it as a no-code discount or present a dead copy button. Choose supported fully evidenced offers for featured actionable positions, and provide an honest source-check action for unresolved records where the business contract permits. Never invent data to satisfy a behavioral test; use a real evidenced record or record the unavailable case accurately.

Keep necessary source attribution and conditions in the established detail conditions/Disclaimer region. `source-listed` is an internal fact state and may inform those explanations; it is not a required public card or section format. Do not replace forbidden `Sample catalogue`/demo strips with repeated `source-listed offers`, `on file`, `honest dates`, or other explanation bars. Public shopping counts can say “N offers”; actual expiry dates, unknown-date states, eligibility and necessary feedback still remain visible where the task requires them. Disclosure explains uncertainty; it cannot make invented data correct.

Operator identity and contact details must follow the existing owner-authorized naming defaults and confirmed operator overrides. The imported project records the owner's authorization of `info@<site-name>.com` (preserving an explicit domain in the site name); retain this convention through `sites/operator.mjs`/recipe configuration unless the owner changes it. Do not copy another brand's or a source site's contact details, company address or legal identity into a new brand, or create unrelated contact conventions. A generated address and `mailto:` link do not establish domain ownership, provision a mailbox, or prove that submissions are received or receive human review/support. Do not invent a legal entity, an operational backend, staffing or response promises; where no authorized default or confirmed override exists, omit unsupported contact details. Likewise do not copy testimonials, ad behavior or unsupported marketing claims.

## Seasonal content is editorial until a promotion is evidenced

As of the 2026-09-28 brief, Black Friday and Christmas are future occasions. Dates for this batch:

| Occasion | U.S. calendar date | Useful shopper task, not a promised promotion |
| --- | --- | --- |
| Black Friday | Friday, November 27, 2026 | Compare merchants/categories and plan a shopping shortlist |
| Cyber Monday | Monday, November 30, 2026 | Explore tech and online-shopping categories with source-supported offers |
| Christmas Eve | Thursday, December 24, 2026 | Browse last-minute gift ideas; no invented delivery/pickup guarantees |
| Christmas Day | Friday, December 25, 2026 | Gift discovery and relevant home/holiday selections without invented sale claims |

Calendar references checked 2026-09-28: [Black Friday](https://www.timeanddate.com/holidays/us/black-friday), [Cyber Monday](https://www.timeanddate.com/holidays/us/cyber-monday), [U.S. 2026 holiday calendar](https://www.timeanddate.com/holidays/us/2026?hol=4658), [NYSE calendar](https://www.nyse.com/trade/hours-calendars?os=i). Recheck dates for later batches; do not advance the year by string substitution. Calendar facts do not establish merchant campaigns or offer validity.

Record seasonal sections as editorial unless source evidence explicitly ties an offer to that campaign. Use phrases such as “Plan for Black Friday” or “Christmas gift ideas” before a supported campaign exists. Do not say a seasonal sale is live, reuse an unrelated September offer as a Christmas promotion, reset countdowns, invent discounts or imply delivery by December 24. Any countdown must have a real named target, timezone and expired behavior; omission is often clearer.

Editorial is the internal classification, not a repeated shopping-page eyebrow. Do not add `Planning guide · editorial` labels or walls of `not live sale claims` disclaimers to every seasonal block. Make the actual shopping/planning copy accurate on its own, with necessary conditions in the established detail/Disclaimer location; an explanation strip is not a substitute for truthful wording.

Make occasions meaningfully different: comparison-oriented Black Friday, considered gift discovery for Christmas, and practical late-shopping constraints for Christmas Eve. Let each site's identity shape the composition. Do not use the same colored holiday tile grid with different glyphs or carry outdated Memorial Day as the main upcoming occasion. Richness can come from useful curation, varied information density and relevant licensed/original art; it does not require unsupported promotions.

## Image selection serves the record

Use official logo assets for merchants and relevant permitted photography/illustration for editorial subjects. Do not copy the source's entire visual design. Check source image licensing/provenance and preserve local assets in the HTML ZIP. A generic shopping-bag SVG on five differently colored banners is not five art directions.

If image generation is configured, follow `banner-workflow.md`. If it is unavailable and the user did not require a generated-image deliverable, make an intentional complete composition using already approved source assets, relevant original illustration or strong typography; record that decision. Do not ship missing-image placeholders, broken URLs or unrelated stock images. If generated artwork was explicitly requested, keep that part outstanding and continue independent work without claiming success.

## Required default catalogue

The owner requires all future generated sites to use the Coupon public API defined by the Feishu document in `skills/site-data/SKILL.md`. Read that skill and its API reference. New-design and reuse imports fetch real public data and install `src/site-data.mjs`, `docs/site-data.json` and raw URL/time/hash evidence under `docs/content-evidence/coupon-api/`. Derive the actual renderer, client, detail routes, search and counts from this shared snapshot; build validation rejects an unused or modified snapshot and content sources outside the public API. Keep presentation/curation in a separate module and write the selected records to `docs/content-provenance.json` using the evidence in the binding. Fetch needed additional detail data from the same API and record it as evidence. Language does not select market. API failure blocks new imports instead of falling back to ChoiceInsiders or invented data. Preserve imports and existing frozen projects retain their authorized data/history; the historical ChoiceInsiders validator remains for those projects only.
