---
name: coupon-detail-generation
description: Generate or refine coupon detail main cards, store coupon rows and related coupon cards for desktop and mobile using measured Couponur evidence and the owner's annotated card guidance. Apply alongside the existing Coupon business and generation standards, preserving each site's visual identity.
---

详情和商家页的侧栏落成整行时，按[公共展开宿主容量](../site-design/references/global-layout-baseline.md)重新计算商家/分类列数；保留窄侧栏及已有圆卡风格。修复不能只覆盖首页，少量项目用有限轨道宽度和普通间距，不把两项内容拉到两端。



所有含卡片的适用页面追加执行[卡片密度与构图差异](../site-design/references/card-density-and-diversity.md)：先记录卡型用途和跨端分组，实际检查短长内容、孤立动作和被撑开的文字轨道；各站及不同用途保留不同构图。等高、尺寸、对齐不能替代视觉审核。旧冻结候选仍用其绑定；本次明确授权的维护以补充规则为准。

# Coupon 详情与券卡细节生成

遇到优惠券详情（包括 businessDetail、offers/CID），以及店铺券列表、详情相关推荐卡片时自动使用。普通文章、商家目录与首页大 Banner 不套用本技能的主券结构；改旧站只触及授权区域。不要把六站做成同一皮肤。

先读取现有 `coupon-generation-standard`、`site-design` 与 `site-v2/references/coupon-site-framework.md`。本技能是这些规范的细节补充，不能替代真实数据、页面模块、复制状态、离线与独立审核。先识别当前项目和冻结版本，再读 [具体尺寸与关系](references/detail-standard.md)、[参考原始实测](references/reference-measurements.md) 与 [决策/证据契约](references/detail-contract.json)。

先读[详情区域、容量与参考处理方法](references/detail-layout-methods.md)（以该文件当前版本为准）。优惠详情主券完整展示；普通推荐卡按用途与断点固定容量；PC 左侧领取→推荐券→推荐商店，右侧主题→商店。推荐券的模块列数与卡内构图分别选择，允许一行一张、合理多列及横／竖卡，不统一全部站点的排法；具体选择以内容容量和跨端实看为准。历史冻结包保持原契约。


容量、紧凑分类与防位移统一执行[全页面公共布局底线](../site-design/references/global-layout-baseline.md)，不在页面技能重复维护。优惠详情主券完整；商店列表首项与其他普通券一致。

## 采用规则

- 区分 `observed`（真实参考值）、`required`（业务底线）、`target`（本轮制作起点）和 `exception`（长内容/旧基线例外）。参考页不是合规样板。所有尺寸是 CSS px；附件截图缩放后的像素不能冒充 DOM 实测。
- 优惠券详情主券完整展示商家、标题、必要条件和日期／状态；16–20px字号不缩小。图文与操作可自由组合，标题和主要动作突出，主券信息与领取区构成一个完整视觉区域，不拆成两块底色／边框面板；图文分组、卡片轮廓与本站品牌仍自由。首券不以省略或额外点击代替全文。
- 有码默认 `****`；代码和领取动作归属清楚，是否同行、连体、等高由构图决定。真实复制后显示反馈；长码完整自然换行，必要时首券增高。无码只保留真实SHOP NOW，不出现伪代码框。
- 普通券、商家推荐和侧栏卡按用途分别定义固定宽高规则、最大宽度、文字槽及动作位置。首券除外，长内容不改变同家族规格；模块可选字段按用途取舍，保留真实入口。PC和手机分别设计，卡内构图不限定横排。
- 手机紧凑推荐行的动作与整张卡片/Logo垂直居中，短标题、单行省略商家和标题不能把动作挤到顶部；箭头及其伪元素也须在按钮内居中。其他已确认构图记录其明确对齐目标，不能只以44px或整卡内无溢出认定位置正确。
- 普通摘要卡在PC／手机均可按明确容量省略，保留完整源字段、可访问名称和同券／商家详情入口。优惠券详情主券始终完整，不能因排版把优惠含义裁成误导性片段。
- 先使用具体组件作用域，核对最终级联及客户端重绘。不能往公共 h1、article、img、button 上追加一层又一层全局覆盖。
- 首券商家名完整自然断词并容纳在自己的文字轨道；普通摘要卡商家名可在声明的文字槽内省略，完整身份在正确详情可达。保留 `[hidden]` 的实际隐藏语义，grid/flex不得覆盖折叠、分页、筛选和空态。
- 完整标题还须在自己的文字轨道和券卡内。给网址/无空格长词保留`overflow-wrap:anywhere`等自然断词能力；`overflow:visible`与root无横溢出不能证明没有越卡。PC实量主侧栏内容结束点，约500px以上差距进入视觉复核；优惠详情的末位推荐仍属于左侧主区域，不能删商家、空框填高或强制所有站套同一布局。

- 同商家推荐券按真实商家身份省去重复店名，Logo、优惠标题、日期和动作重新紧凑组合；主券及推荐商店保留完整身份。混合商家仍须辨识身份，不能隐藏后留空轨道。

## 执行

1. 冻结目标项目、当前 build/source hash 和改前图。旧站在独立源码副本修改，写 `docs/maintenance.json`；不改冻结构建。
2. 在 `docs/site-craft.json` 的 `detailCraft` 记录 `standardVersion`、具体 Logo/文字/代码/动作空间预算、四层间距、各断点重组、推荐预览是否获准、长内容例外与实际语义选择器。保留现有结构/数据绑定。
3. 实现主券与普通券两套明确作用域，并把图片、日期、代码、按钮及文案关系落实到真实 DOM。保留官方 Logo、CID/SID、真实链接与剪贴板钩子。
4. 用实际内容构建新候选，检查1440、1024、768、393/375、320px及发生重组断点的±1px。记录 computed style、真实边界、四层间距与文本裁切；参考 `../coupon-detail-review/scripts/inspect-detail.mjs`，按站点映射选择器。
   独立商家卡组须声明 `merchantGroups[].spacing` 的容器、最小卡间距和内部留白，并映射标题／末链接；用实际白卡边界检查整个连续列表。手机单层页面外边距不免除有框面板的内部padding，禁止按泛化宿主属性一律清零。
5. 实看完整页面与卡片局部，操作有码、无码、过期旧URL、长标题、长码、复制/刷新、键盘及筛选重绘。真实无效/撤回旧URL也覆盖步骤4的完整视口矩阵及断点；没有主券仅免除主券角色，不免除布局、推荐、分类、商家边界和状态入口检查。原商家已知时从冻结CID→merchantId解析对应店铺，实际点击/Enter确认到该店及当前真实内容；未知商家才允许目录fallback，不能仅凭合法href/按钮存在放行。用冻结数据算出各实际存在的初始折叠、展开、分页及All/Codes/Deals状态的预期可见ID顺序和计数，逐个真实点击后核对；必须包含真实零结果。共享券行影响全部优惠页时也检查该页。记录各商家区域的预期数量及选择器，空覆盖不能过。检查320px及经典滚动条占位后的实际内容宽度。用最终 ZIP 解压文件复验，包括真实无效页的PC与手机。具体测量参数见细节标准的“状态与角色覆盖”。
6. 交给独立 `coupon-detail-review`/site_design_review 整轮集中审核。同一候选 hash 才能复用本轮证据；结构或数值成功不能代替视觉通过。返工生成新候选。

交付后还要从用户正在使用的成果库/预览入口真实点开改动详情，核对最终URL的build与本轮审核build；检查未关闭的成果库返回/恢复后是否更新，预览及下载是否仍留在旧build。修复入口不能篡改冻结旧包。直接打开新候选URL和当前指针正确，只能证明该候选存在，不能证明用户实际入口已经更新。

未来通过 Harness 创建的新项目由公共 couponCraft 冻结本细节包；直接 Codex 使用相同文件。旧冻结包按其原版本审，本次授权六站通过维护计划显式升级细节。


## 公共执行与页面回归

容量、紧凑分类与防位移统一执行[全页面公共布局底线](../site-design/references/global-layout-baseline.md)，不在页面技能重复维护。优惠详情主券完整；商店列表首项与其他普通券一致。

详情方法负责主／侧区域、主券统一区域、商店身份卡、数量及数据状态；detail-standard.md负责inspectDetail的精确映射。公共inspectLayout的summary／topic／stability与详情检查共同执行。优惠详情与商店详情的共享组件同轮修正、重绘与最终产物复验，首页引用相同容量和稳定性规则。保留独立审核、真实交互、冻结数据及最终入口核验要求；缺证据不得填写通过。

详情按钮专项追加执行 detail-layout-methods.md 的“详情按钮的品牌造型与稳定动作”：主复制／购物及普通券入口共同设计；保留原生动作与掩码，形状只裁装饰背景，检查伪元素实际尺寸、44px热区、焦点及手机文字容量。主次按钮均提供 PC／手机真实像素；源码不变不等于交互通过，未测项目明确 not-run。

生成/维护入口：先记录好样本和需保留的边界，再按容量决定重组；执行[容量驱动方法](../site-design/references/global-layout-baseline.md#容量驱动的修复与生成2026-10-23)，把实际中间宽度和断点写入reviewWidths/breakpoints并绑定适用criteria与可执行预算。不要只补规则说明而未接入检查；未执行状态保留not-run。

手机控制和图片边框执行global-layout-baseline的专节：标题右入口有名称的icon-only，横滑箭头同轨道两侧且不占独立行，缩略图规则外框。生成落实真实资产/样式；审核执行heading-action、rail-controls和image-fit.conventionalFrame，并实际切换。共享调用页按实际范围覆盖，不能以首页通过替代其他页面。

手机优惠动作与文章等高执行global-layout-baseline的“全家族覆盖与动作归属”：逐实际家族声明保留/修改/无此模块，接入mobile-card-flow或等价源码，冻结并执行action-flow及image-fit.balanceWith/fitMode。图文完整性与分组比较完整阅读组；不能用单站/featured样本替代其他家族。

本次及后续新候选追加公共布局底线2026-10-26.1：文章图片完整内容优先于等高，窄屏容量不足重排；内页券行按实际构图测轴线与上下内距，不能用首页结果替代；主复制按钮仅Copy类文案，无码仅Shop Now；footer只保留指定四项。使用真实初始HTML、最终ZIP和独立像素证据，不追改历史冻结包。
