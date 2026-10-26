---
name: site-design
description: Plan and implement distinct Coupon site designs in Site Harness V2, preserving the established coupon-detail contract and existing sites. Use for new designs or scoped visual changes before independent design review.
---


首页卡片生成及审核读取[参考处理方法](references/home-card-reference-methods.md)：根据用途、内容和本站风格原创构图，PC/手机各自检查焦点、固定容量、至少70×70商家Logo及操作关系；摘要省略须保留全文详情。旧候选不追溯改写。

所有含卡片的适用页面追加执行[卡片密度与构图差异](references/card-density-and-diversity.md)：先记录卡型用途和跨端分组，实际检查短长内容、孤立动作和被撑开的文字轨道；各站及不同用途保留不同构图。等高、尺寸、对齐不能替代视觉审核。旧冻结候选仍用其绑定；本次明确授权的维护以补充规则为准。

# Site design

商家/分类网格按[展开宿主容量](references/global-layout-baseline.md)执行：枚举首页、真实CID详情和SID商家页，分别检查窄侧栏及落到整行后的内层网格。先增加可读列数，少量卡片限制轨道宽度并保留普通间距；禁止用拉大内边距、space-between或空轨道填宽。新绑定在1090/1440必须映射packing和实际gapRange，检查换列断点两侧并保留已正确品牌样本。

All pages and modes load [visual completion](references/visual-completion.md) during planning, making and checking. Apply it within the authorized scope; preserve existing identity in maintenance and the explicit target in reference-rebuild. Whole-page focus, purposeful space, color relationships and PC/mobile organization require actual visual evidence. Familiar usable layouts are allowed; geometry, decoration and novelty alone cannot establish completion.

New Harness bindings freeze this method as `couponCraft.densityStandard.visualCompletionPath` with `visualCompletionHash`; read the bound resource for that candidate. Historical bindings keep their original contract.

For coupon main details, store coupon rows and related cards, also load [coupon-detail-generation](../coupon-detail-generation/SKILL.md). It supplies the owner's measured PC/mobile detail and compact-card rules, including joined code/action controls. Apply the frozen version in `couponCraft.detailStandard` where present; preserve business minima and each brand's identity.

The owner wants independent commercial Coupon visual identities, not imitations of Couponur/Dealmerica/Couponbon/Couponister and not palette/button-background swaps. Their current screenshots calibrate aesthetic completion. Layout, actual CTA construction, coupon/card composition, information hierarchy and mobile rhythm must form a coherent original identity. Original business dimensions still apply; the main coupon title is a 16–20px offer field even when rendered as h1. Generic editorial/large-heading/taste advice cannot waive it. Do not reuse Poplane's rejected collage/poster direction or shoe artwork.

For new bound projects read `skills/site-v2/references/coupon-ui-measurement.md`, load all five original dependencies via site_skill once per content version, and implement the small DOM selector mapping. Source/selector/skill hashes and automatic live couponUI measurements are frozen with the candidate; known failures cannot be treated as typography pass. These are semantic measurements, not a shared skin.

Class names do not define business roles. A hero/board/editorial tile that displays an actual offer title and links to that offer's detail is an offer entry: apply the original title/date/home-action rules there too. Merchant entries linking to store pages have their own identity/count requirements. Do not omit fields by calling a coupon a board item. A large slogan beside a plain list, tiny merchant marks and a long wall of near-identical category boxes do not automatically constitute a finished commercial campaign; actual coupon browsing must have priority in the first two folds. Map category artwork to actual IDs, rather than relying on a repeated fallback gift glyph. Measurements are necessary evidence, not aesthetic approval.

Read the selected project's coupon-site and coupon-ui-lab skills and current layout-requirements through `site_skill`. They own business behavior, content and explicitly fixed dimensions. The user's boundary is **stable business framework, maximum appropriate design freedom inside it**. “Fixed detail” does not freeze one site's card markup or geometry for all new sites. Latest user instructions take precedence.

## Establish scope

- New design: design the home, store, listing/discovery and coupon-detail surfaces. Reuse data, routing, copy behavior and packaging; author site-specific rendering when shared markup prevents an appropriate composition. Do not start every site from the three example renderers in `generation/`.
- Existing site: continue its actual source and visual identity. Retain approved layouts and manual changes. Record changed routes and protected areas; do not create a new design to fix a local issue.
- Explicit reuse: retain and name the chosen design. Do not describe a palette variation as a new style.

## Design before implementation

The owner adopted the [four-reference common craft standard](references/coupon-common-craft.md) for both Codex and Harness. Read workflow.couponCraft once per hash before composition. In new bound projects complete docs/site-craft.json with concrete color roles, four spacing layers, each card's space/hierarchy/action/phone decisions, surface density and fact-check methods. Couple it to the real snapshot and business structure via preflight. Read the bound docs/coupon-craft/instructions.md and observations.json for that project when shared standards later change. Do not turn the observed 10–24px spacing into a hard range or copy a reference's tiny text, cropped marks or truncation. Actual visual inspection and independent review remain necessary.

For a new direction or authorized redesign, use [research-informed visual craft](references/creative-craft.md). It translates the reviewed high-star UI skills into art direction, shopping hierarchy, original component expression and evidence-based critique. Record the applicable reference-to-design decisions in the existing plan; do not install five competing skill packages or treat their defaults as this project's rules.

Before composing a new design or an authorized redesign, read [production lessons and author preflight](references/production-lessons.md). Apply relevant known failure modes while making the page, then verify them on the actual candidate before requesting independent review. Preserve evidence and distinguish a proven repair from an untested suggestion; do not convert one site's solution into a mandatory template.

Read the [human-correction capability pack](references/human-correction-learning.md) returned in the shared workflow as `productionLearning`. Use the applicable H01–H08 methods when selecting content and constructing components, then inspect actual short/long records, whole regions and related page/redraw uses. Preserve its hashes with the generation context; no private Codex reminder should be necessary. Learn the reason and transferable method, not Couponrite's skin or pixel values. Known prohibited-content failures in actual browser receipts require source repair before handoff; hiding the DOM or omitting the inspect action cannot waive them.

For new sites and explicitly rejected homepages, follow [the owner's UI-first priority](references/homepage-visual-priority.md) before choosing a direction. Actual visual finish is the first design milestone: an original promotional visual, coherent palette/type/actions, compelling first two folds and deliberate mobile composition. Independent homepage-direction review comes before full-site expansion. Distinctness, working functions and numerical compliance cannot establish this milestone.

For a new design, write `source/docs/site-design.json` using [the design plan contract](references/design-plan.md). Study actual reference pages before extracting their layout ideas. Borrow composition, hierarchy and browsing behavior; do not import the reference's industry, products or copy unless requested. Explore genuinely different arrangements before choosing one. A named theme or swapped palette is not a composition.

For two or more new sites, first follow [batch direction and commercial craft](references/batch-direction.md). Declare the entire cohort, settle distinct shopping emphases and compositions, and compare representative routes before expanding any one site to hundreds of pages. This is a design exercise, not a rotation through a fixed style catalogue. A shared renderer with different CSS is permitted only if the actual compositions and real actions meet the differences in that contract; copying one site's sections and changing metaphors does not.

For every new coupon site, follow [content facts and seasonality](references/content-and-seasonality.md). The owner-selected Feishu Coupon public API and site-data skill override imported illustrative catalogue defaults. Use the same trustworthy fact base across sites but make genuine editorial selections and arrangements. Do not invent codes, validity dates, holiday promotions, popularity or verification to fill a design.

Choose one memorable visual idea grounded in coupon shopping. Design the first focus, merchant recognition, offer discovery, section rhythm, typography, imagery and primary actions together. Each field in the plan must describe a concrete decision, not adjectives such as “premium” or “modern”. Relevant artwork and considered type can carry identity; a huge hero, arbitrary asymmetry or decorative labels are not required. Commercial usefulness and polish must remain apparent after decorative textures, notches and motif names are removed. Users should see stores, categories, offer scope and a clear next action, not decipher a transit map, ledger or invented taxonomy.

For the required original homepage promotional visual, follow [Banner production and acceptance](references/banner-workflow.md). Use the Harness image-generation plugin when generated raster artwork is needed and actually available, or suitable authorized assets/original illustration. Missing image-provider access does not permit an empty or text-only replacement. Image generation belongs after composition planning and before final page implementation. A plugin result is an image candidate, not an accepted Banner or a complete website design.

Use whitespace, open rows, groups, editorial placement or cards where content benefits. Do not put every module in a repeated card shell. Do not force every site into a fixed catalog of three themes. Within a site, keep offer identity consistent across initial render, filtering and other lists. Respect page-specific constraints: store offers remain one per row, category pages show merchants, search remains concise. Distinctive design does not excuse forbidden modules or invented facts.

## Stable business framework, independently designed cards

Store and coupon-detail pages may retain similar list order and business flow across sites. Their cards must still have their own visual identity. Preserve the source skill's required information, explicit layout boundaries and interaction states:

- Compact 50px header; no additional merchant identity card or breadcrumb above the main coupon.
- Retain the agreed desktop information/action relationship and mobile reading/action order, plus a light reading background. Within that framework, design logo/text grouping, column proportions, alignment, separators, code-area treatment and whitespace per site; do not freeze equal coordinates or sizes from one example. The source contract's expressly fixed dimensions still apply.
- Code box initially visible as `****`; one reveal-and-copy action, no automatic navigation or second SHOP NOW action. Reload restores masking. No-code offers have only SHOP NOW; expired offers cannot be claimed.
- Related offers followed by recommended stores, which end the main content column; retain the required discovery sidebar and responsive behavior. No appended articles or decorative explanation strips.

Design **store identity cards, store coupon rows, main detail coupons and related coupons** as a connected brand language. Choose card silhouette, internal regions, logo/text relationship, typography hierarchy, metadata placement, code container, real CTA construction, border/material treatment and spacing deliberately. Same single-column list does not require the same card. A different color on the same card is insufficient; equally, a familiar left-information/right-action arrangement is not automatically a failure. Judge the combined result, not maximal DOM differences or decorative complexity.

Record concrete store/detail `cardDesign` decisions in the plan. The reviewer must compare both surfaces against a real reference and batch peers. See [the owner's reference study](references/owner-card-references.md). Its observed treatments are examples, never three mandatory styles. Existing sites retain their own accepted layout unless the requested scope changes it. Do not use new-site diversity to redesign old accepted work. The original skill remains authoritative for numerical and content constraints.

Check recommendation coverage separately for both detail route families; “detail” in this requirement never means coupon detail alone:

| Generated route family | Topics | Recommended stores |
| --- | --- | --- |
| Store detail (`family: store`) | At least 8 real, relevant, unique topics in the required discovery region | At least 16 unique real merchants other than the current store, in the recommendation region that ends the main content column |
| Coupon detail (`family: detail`) | At least 8 real, relevant, unique topics in the required discovery region | At least 16 unique real merchants other than the coupon's merchant, in the recommendation region that ends the main content column |

Self-check both rows across their generated routes, then inspect each family at desktop and phone widths. Count actual rendered recommendations with valid destinations, not data-array length, duplicates or invisible filler. Sidebar merchants do not contribute to the 16 required at the end of the main column. This clarifies the existing minimums and placement; it does not prescribe the recommendation cards' visual design or change an old site's authorized baseline.

## Implement, receive critique, refine

Build a representative home, store/list and independently styled detail within the business contract first. Inspect the actual pages yourself, then obtain the independent homepage-direction feedback described above before expanding the full site. A major visual weakness returns to the original author now; do not postpone it until hundreds of pages exist. Preserve strengths when fixing problems.

Delegate acceptance to the named `site_design_review` role using a fresh context. Supply project ID, exact build ID, requested scope, every batch peer's final candidate build ID, content provenance and any repair target; do not supply a desired verdict or self-awarded score. The reviewer must first look at the actual pages, then read this plan and measurements. It submits its own report with `site_review`. Its comparison needs real matching page families and browser evidence from the peers; prose in a design plan cannot stand in for a rendered comparison.

`revise` means continue editing the project source, build a new candidate, and send it back to this role. Address every blocking/major finding and check neighboring modules. Never edit a frozen artifact, copy an old passing report, reduce the quality rules, or ask the user to approve every repair. After three unsuccessful focused rounds, preserve the candidate and explain remaining issues; it still cannot be released as verified.

Release only when design acceptance and all functional/offline/preservation checks pass. Internal acceptance is separate from the user's aesthetic approval. Compare the same content and nearest existing design, including mobile. Shared business flow is allowed; identical store/detail cards are not excused by it. Within each site, preserve its own card language across routes and client redraws.

Read [design sources and adaptation boundaries](references/sources.md) when selecting methods or updating this skill.

## Required default catalogue

The owner requires all future generated sites to use the Coupon public API defined by the Feishu document in `skills/site-data/SKILL.md`. Read that skill and its API reference. New-design and reuse imports fetch real public data and install `src/site-data.mjs`, `docs/site-data.json` and raw URL/time/hash evidence under `docs/content-evidence/coupon-api/`. Derive the actual renderer, client, detail routes, search and counts from this shared snapshot; build validation rejects an unused or modified snapshot and content sources outside the public API. Keep presentation/curation in a separate module and write the selected records to `docs/content-provenance.json` using the evidence in the binding. Fetch needed additional detail data from the same API and record it as evidence. Language does not select market. API failure blocks new imports instead of falling back to ChoiceInsiders or invented data. Preserve imports and existing frozen projects retain their authorized data/history; the historical ChoiceInsiders validator remains for those projects only.
# Owner rejection record

For a new visual direction, read [GitHub taste and mobile methods](references/github-taste.md). This bounded adaptation keeps source attribution and Coupon constraints; full upstream manuals are optional resources for a specific method, not default prompt padding.

Before choosing references, direction or Banner prompts, read `policy/owner-design-rejections.json` returned by `site_harness(action="workflow")`. Daymark, DealCircuit and Pickwell were rejected and deleted by the owner on 2026-09-30. Never treat their internal checks as owner approval, recreate them, borrow their Banners/prompts, or repeat their overall page/card style under another name. Color or image substitutions do not resolve this rejection. Develop an independent visual direction and check the actual desktop/mobile first two screens before expanding the site.

## 参考站重建分支（reference-rebuild）

用户要求模仿或还原指定参考站时，先读取 `skills/site-reference-rebuild/SKILL.md` 与 `site_harness(action="engineering")`。导入使用 `mode="reference-rebuild"` 和 `referenceUrl`。此模式按本次真实参考证据还原布局与风格，不套用 new-design 的三个原创差异、原创主视觉或固定 Sunclip 皮肤；真实数据、业务、可读性与完整验收标准继续生效。项目冻结参考分析与截图，必须先通过 homepage-direction 再完成 full-site。独立审核读取 reviewContext.referenceRebuild，benchmark 增加目标 referenceUrl、captureIds 与八维 referenceAnalysis（reference/actual/adaptation），完成新增覆盖项。旧站与旧冻结规则保持原适用范围。

## 生成前固定 Coupon 业务框架

按最新用户要求先读取 [Coupon页面、模块与卡片字段框架](../site-v2/references/coupon-site-framework.md)。后续新Coupon项目使用新公共库真实数据，先明确17种页面用途、模块职责、卡片字段与空数据行为，在源码写docs/site-structure.json并通过公共site_harness preflight后再做视觉实现。固定业务框架，颜色、字体、构图、比例、密度及跨端设计自由；旧产物不追溯改写，计划校验不代表视觉验收。

生成/维护入口：先记录好样本和需保留的边界，再按容量决定重组；执行[容量驱动方法](references/global-layout-baseline.md#容量驱动的修复与生成2026-10-23)，把实际中间宽度和断点写入reviewWidths/breakpoints并绑定适用criteria与可执行预算。不要只补规则说明而未接入检查；未执行状态保留not-run。

手机控制和图片边框执行global-layout-baseline的专节：标题右入口有名称的icon-only，横滑箭头同轨道两侧且不占独立行，缩略图规则外框。生成落实真实资产/样式；审核执行heading-action、rail-controls和image-fit.conventionalFrame，并实际切换。共享调用页按实际范围覆盖，不能以首页通过替代其他页面。

手机优惠动作与文章等高执行global-layout-baseline的“全家族覆盖与动作归属”：逐实际家族声明保留/修改/无此模块，接入mobile-card-flow或等价源码，冻结并执行action-flow及image-fit.balanceWith/fitMode。图文完整性与分组比较完整阅读组；不能用单站/featured样本替代其他家族。

文章须按实际调用位置列清首页、目录、详情内相关文章；无图文字卡与真实空列表分别记清。初始HTML必须直接包含手机动作、标题与图文语义分组，可复用assets/reading-static.mjs并在生成时执行assertReadingMarkup；禁止只等客户端脚本追加。审核需包含禁用/延迟脚本与离线ZIP。保留正常纵排、文字卡及桌面布局，横排比较图片与完整标题/阅读提示组，不给整卡链接内的装饰提示另留44px空行。

新站执行global-layout-baseline的2026-10-24.2自动门禁：原生build与便携freeze自动运行最终产物检查，缺检或失败不得交接。便携任务绑定project.artifactRoot（outputs内）及project.layoutBudget（inputs内），不靠临时专项脚本触发。

本次及后续新候选追加公共布局底线2026-10-26.1：文章图片完整内容优先于等高，窄屏容量不足重排；内页券行按实际构图测轴线与上下内距，不能用首页结果替代；主复制按钮仅Copy类文案，无码仅Shop Now；footer只保留指定四项。使用真实初始HTML、最终ZIP和独立像素证据，不追改历史冻结包。
