# GitHub design methods for Coupon sites

Read this when establishing a new site's visual direction or explicitly redesigning one. Existing business, data, readability and acceptance contracts take precedence. These methods sharpen design decisions; they do not replace independent visual review.

Sources inspected and installed on 2026-10-12:
- [Taste Skill](https://github.com/Leonxlnx/taste-skill/tree/main/skills/taste-skill), upstream of UI-taste-skill. Full original: `engineering/vendor-skills/taste-skill/SKILL.md`.
- [Design Mobile Apps](https://github.com/sleekdotdesign/agent-skills/tree/main/skills/design-mobile-apps). Full original and designing/implementing references: `engineering/vendor-skills/design-mobile-apps/`. This is a Sleek API integration, not a standalone visual generator. Do not trigger its account/device flow for ordinary Harness HTML generation. No Sleek output was generated merely by installing it.

The verified exact commits, source hashes and original licenses are saved in `engineering/vendor-skills/sources.json` and each vendor folder. Taste Skill is pinned to d237dd399d57524945c0c81327da5da19f7a468d; Design Mobile Apps is pinned to fb90438ab2263b7a87cdce1ca7747d371fccb438. Installed file bytes were checked against those commits.

Apply the applicable design methods below without loading unrelated framework/API manuals into each model request. The full originals are available when a specific method needs inspection. Preserve their authorship and licenses; do not represent these adaptations as upstream rules.

Before code, commit to a one-paragraph direction: shopper/audience, mood, color roles, type hierarchy, layout rhythm, component construction, imagery and two distinctive details. Explain variance, motion and density choices from the brief. Design freedom belongs in an intentional visual system, not unusual shopping navigation.

Treat the homepage as a composed shopping campaign. Plan type and imagery together so the principal shopping action and recognizable merchants appear in the first viewport. Give the first two folds differing hierarchy and rhythm; a centered heading plus repeated equal card grids is insufficient. Use a real original promotional asset with meaningful cropping and offline packaging. Hero and controls must look finished at desktop, phone and 320px; mobile needs its own composition rather than proportional shrinking.

Typography, palette and shapes need documented roles. Avoid reaching automatically for Inter/slate, cream/brass/serif, gradient blobs, generic pills or borders/shadows around every item. These are contextual design warnings, not a ban on a justified brand direction. Match one coherent action language to the brand: silhouette, label/code relationship, border, contrast, spacing, pressed state and focus. Compare actual buttons and store/detail cards with the nearest existing accepted site. Color and a replacement image alone do not establish a new identity.

Official merchant marks must be visually recognizable. Judge the visible logo itself, not just its container: padding/white margin in the source image can make a large box hold a tiny mark. Check both wide wordmarks and square symbols against the surrounding title, discount and border. Preserve aspect ratio and official colors, create deliberate breathing room, and prevent clipping/overlays. Do not wrap every logo in a heavy generic card that dominates the identity.

Size shared components for their actual parent width, including sidebar layouts, rather than relying only on viewport breakpoints. Check real wide marks and the longest merchant names in coupon headers and main detail identities. Give the offer title and visible actions enough space as logos grow; wrap or stack the composition before text becomes a narrow word-by-word column. Enlarging a logo must not hide a save button or crowd the main offer. These practical checks come from this project's observed failures, not an additional upstream acceptance pass.

Build working states, not only a populated mockup. Mobile search/menu/filter/code actions remain operable and reachable; verify keyboard, empty/single-item, invalid/expired, copy-denied and reload states where relevant. Use honest visible controls with sufficient hit area even when the icon is small. Reduced-motion fallbacks must preserve content and actions; offline fonts/icons/assets cannot depend on external CDNs.

Apply Taste Skill's marketing layout methods to home/discovery surfaces. Its generic landing-page prescriptions (React stack, dark-mode defaults, no repeat CTA, logo-only trust walls) do not override Coupon-specific merchant information or repeated coupon actions. Apply Sleek's screenshot/composition and interaction methods to responsive HTML; native insets/React Native conversion and external authentication apply only to an explicitly requested native/Sleek project.

Review actual pixels first, then measurements. Inspect below the fold before declaring content missing. HTML presence is not proof of visual presence. Integrate findings into the existing homepage-direction/full-site sweep; do not add a separate serial 'taste pass'. None of these methods produces an automatic visual verdict.
