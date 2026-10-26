---
name: coupon-generation-standard
description: Apply the owner's shared page/data and visual craft standards when generating or redesigning Coupon websites through Codex or Harness. Preserve style freedom and scope existing-site refinements.
---


所有含卡片的适用页面追加执行[卡片密度与构图差异](../site-design/references/card-density-and-diversity.md)：先记录卡型用途和跨端分组，实际检查短长内容、孤立动作和被撑开的文字轨道；各站及不同用途保留不同构图。等高、尺寸、对齐不能替代视觉审核。旧冻结候选仍用其绑定；本次明确授权的维护以补充规则为准。

# Coupon生成共同标准

优惠详情、店铺券行及相关推荐再读取 [Coupon细节生成](../coupon-detail-generation/SKILL.md) 与 [对应审核](../coupon-detail-review/SKILL.md)。它们把 Couponur PC/手机实测及用户改后附图结合为尺寸、层级、四层间距与代码/按钮组合细则；参考值不覆盖本技能的业务/可读性底线，也不统一各站皮肤。新Harness绑定由 `couponCraft.detailStandard` 冻结，两种入口使用同一版本。

用户已要求后续优惠券站生成都使用同一标准。物理资源位于`<HARNESS_ROOT>`；全局技能是本目录的链接，读取相对引用时以物理位置为准。

先读取[共同设计标准](../site-design/references/coupon-common-craft.md)、[页面/模块/字段框架](../site-v2/references/coupon-site-framework.md)与[真实数据技能](../site-data/SKILL.md)。颜色角色、四层间距、不同卡片的比例和信息层级、首页/内页密度、手机重组以及目的地/数量/时间/实体语义必须提前决定并实看验证。参考间距是起稿依据，风格自由；业务、可读性与状态要求继续适用。历史示例数据不能覆盖新公共库要求。

Harness通过公共workflow取得couponCraft与couponFramework，完成docs/site-structure.json、docs/site-craft.json后preflight；作者及独立审核都采用冻结版本。直接Codex生成也写同样的计划，采用同一真实快照与业务规范，在独立源码副本操作；不要求换引擎。准备数据与结构后，可执行以下共用检查：

```sh
node <HARNESS_ROOT>/bin/coupon-craft.mjs prepare --source /absolute/independent/source
# 根据该源码中的模板完成docs/site-craft.json，再执行：
node <HARNESS_ROOT>/bin/coupon-craft.mjs check --source /absolute/independent/source
```

prepare保存当前标准且不覆盖已有绑定；check验证计划、数据和标准哈希，不能代替业务全项与视觉验收。缺少真实数据不回退到旧样例；如用户明确指定不同数据，以新要求为准并记录。

使用“首页驱动创作”模式时，再读取[该模式技能](../site-homepage-first/SKILL.md)，workflow/import 传 `generationProfile: "homepage-first"`。其按钮构造、Get Code/Get Deal/View Now 文案语义、首页券量与品牌显示要求同时适用于 Codex 与 Harness。用户现行硬下限是 PC 与手机商家 Logo 实际展示区均至少70×70 CSS px；其他推荐尺寸及券量是构图参考，不是统一模板或配额。按[四张参考处理方法](../site-design/references/home-card-reference-methods.md)决定家族容量、摘要省略及全文详情边界。该模式覆盖旧依赖中首页统一 View Details 的要求，保留真实类型、CID、掩码/复制/跳转及其他业务底线；历史冻结产物不因此改写。

该模式的集中复核同时覆盖主券/列表样式隔离、窄屏文本宽度、整卡及内部独立操作、主栏与侧栏职责、推荐末行、商家 Logo 的正确身份和实际显示尺寸、动态重绘图片的预览/离线路径及异常标题隔离。当前排版专项不审核或修复源图分辨率与锐度；另有素材任务时再按其范围执行。具体按模式技能执行，不能用构建成功、等高卡框或无横向滚动代替这些实际检查。

仅在“首页驱动创作”模式，继续读取[六站修复预防与审核清单](../site-homepage-first/references/repair-prevention.md)。把筛选实际可见数、手机搜索、有码/无码同组操作、过期旧URL、推荐各断点末行、Logo本体、矛盾数据、联系/包说明和打包脚本真实执行同时纳入制作及审核；复用判断方法，保留各站创作自由。其他模式不新增这份清单，旧冻结包不追溯更新。

新方向先看桌面/手机/320px的首页与代表内页并获得独立视觉反馈，再扩展；作者修完交新候选，整轮集中审核，最多3轮，单站自主生成预算2小时。目标是人主动参与检查、沟通和Codex收尾≤60分钟，等待另计。预算耗尽不放宽通过条件。功能/数值通过与用户认可分别记录。

旧站维护保留已认可身份和未请求区域，只检查适用问题及回归；不将新规则追溯到旧冻结产物。V1工作树和指向V1的全局coupon-ui-lab技能只读，不能为了更新规则修改V1。其他站型使用其自身业务框架。
