---
name: coupon-detail-review
description: Independently audit coupon detail main cards and related or store coupon rows against the measured desktop/mobile detail standard, existing Coupon business rules and the owner's annotated card guidance. Use after generation or scoped refinement, with real browser and exact artifact evidence.
---

独立审核详情与真实SID商家页展开后的内层商家/分类网格，按[公共展开宿主容量](../site-design/references/global-layout-baseline.md)检查1090、宿主换列两侧、可读列数及末行真实间距。正常桌面窄侧栏和手机必须保留；首页或另一个站通过不能代表这些宿主通过。



所有含卡片的适用页面追加执行[卡片密度与构图差异](../site-design/references/card-density-and-diversity.md)：先记录卡型用途和跨端分组，实际检查短长内容、孤立动作和被撑开的文字轨道；各站及不同用途保留不同构图。等高、尺寸、对齐不能替代视觉审核。旧冻结候选仍用其绑定；本次明确授权的维护以补充规则为准。

# Coupon详情与券卡审核

你是独立设计审核者。先看实际页面，再读取作者计划；不修改源码、不构建、不替作者批准自己实现的修复。沿用 `site-design-review` 的只读角色权限和集中审核流程。本技能补充细节，不降低既有业务/功能/离线/完整模块要求。

读取冻结的 `coupon-detail-generation/references/detail-standard.md`、`detail-contract.json` 和 `reference-measurements.md`。Harness从 `reviewContext.couponCraft.detailStandard` 提供冻结路径；若不存在则使用当前任务显式授权版本，记录来源，不改旧绑定。参考观察与采用标准分开判断。

先读[详情区域、容量与参考处理方法](../coupon-detail-generation/references/detail-layout-methods.md)（以该文件当前版本为准）。优惠详情主券完整展示；普通推荐卡按用途与断点固定容量；PC 左侧领取→推荐券→推荐商店，右侧主题→商店。推荐券的模块列数与卡内构图分开审，一行一张、合理多列及横／竖卡均可；不因方向或与参考不同判失败，也不因换了列数判通过，按实际层级、密度、间距和动作对齐判断。历史冻结包保持原契约。


容量、紧凑分类与防位移统一执行[全页面公共布局底线](../site-design/references/global-layout-baseline.md)，不在页面技能重复维护。优惠详情主券完整；商店列表首项与其他普通券一致。

## 整轮检查

1. 固定 project/build/source/artifact hash。自己打开PC/手机，先记录第一焦点、主动作、最明显的≤3个问题和应保留的品牌特征。
2. 同一轮覆盖1440、1024、768、393或375、320与实际断点±1；主券、普通推荐、店铺券行、推荐商家及侧栏分别看。真实无效/撤回旧URL采用同一完整视口矩阵，不能只查手机状态或因没有主券跳过PC列尾。没有真实样本才记不适用。检查从首屏到最后一排，非仅主券局部。
3. 使用实际语义选择器采集几何、computed font/line-height/weight、padding/margin/gap、图像比例和加载、文字裁切、真实点击区域；可用`scripts/inspect-detail.mjs`的`inspectDetail`传给浏览器evaluate。缺角色不算通过，DOM测量不能证明视觉完成。
   手机相关推荐逐卡检查动作与整卡/Logo的对齐、按钮内部箭头/伪元素的居中及与标题、商家、日期的关系；短长内容均测。三列紧凑行按已记录的垂直居中目标判断，其他获准构图按自己的目标判断。44×44合格、按钮仍在卡内或主券复制通过，均不能豁免相关推荐动作错位。
4. 对照四层间距和信息优先级：券卡优惠突出、商家卡品牌突出；实际Logo展示区至少70×70，辅助文字≥14px，动作≥44px。按本站构图看归属和对齐，不强制手机图文并排或代码按钮同行。普通卡长内容不得撑高；首券必须完整，不以固定高度裁切。
   独立商家卡组必须传 `merchantGroups[].spacing` 并逐段实看白卡之间、首末卡、标题及末链接到面板边框的留白。面板内部padding与页面外层padding分开检查；零页面溢出、Logo/文字不碰撞不等于间距通过。参数与网格反例见细节标准「独立商家卡的间距与面板内边界」。
5. 查看短/最长标题、长商家、横/方Logo、真实长代码。复制前`****`、明确点击后正确码/真实剪贴板、刷新复位；键盘有焦点、反馈可读；推荐先入本券详情；无码真实SHOP NOW；过期/withdrawn旧URL无失效主券。空码却coupon_code等矛盾记录应隔离，不能补码/改成有效deal。检查网络/剪贴板失败的现有反馈能力，不替未知行为填写pass。
6. 对PC／手机普通摘要逐项核对卡片容量、文字槽、完整源字段和正确全文入口；首券不使用摘要例外，必须全文可见。长码完整，不强制代码按钮同高。
   普通券和商家推荐名称可按声明槽位省略；首券名称、标题及未授权省略的字段仍检查自身与祖先裁切。新增文字包裹层后，长单词名称仍需真实显示省略号，不能因内层继承nowrap但丢失text-overflow变成硬裁。主题名称按字形与标签、序号及箭头检查相交，子盒在卡片内不等于文字未碰撞。记录innerWidth、clientWidth及经典滚动条占位。不得用一个全局省略开关跳过所有字段检查。
7. 实际解压最终ZIP并用file://看改动页与重绘。用户原先允许的HTTP Logo依赖单列记录，不能称为完全断网通过；未执行的状态是not-run。

同一整轮还要比较主/侧栏推荐商家的ID集合，手机避免重复展示同一批商家；检查必要主栏16家、既有PC侧栏总数与手机独有商家保留。PC滚到两列真实结束处，记录是否存在约500–1000px的意外空白；多列编组不能让Logo、名称槽与14px数量拥挤；名称省略必须符合声明容量。不能靠删模块/填空白让列高表面一致。

边界审核必须量商家卡内部Logo、名称字形和数量的实际边界，检查相互叠压及越出卡片；根级没有滚动条不能豁免。确认最终CSS顺序中的真实列数，保留语义Logo类名、场景分组和商家ID钩子；`inspectDetail`的merchantCards测量覆盖此项。

完整主标题同时比较scroll/client宽与Range相对主券的真实左右边界；`overflow:visible`仍可能让长网址越卡。PC配置`columnBalance`记录真实内容结束点，约500px以上进入集中视觉复核，不只读取可能被stretch撑高的外框。优惠详情末位推荐属于左侧主区域，不得作为跨栏共享尾区从列尾测量排除。发现区自身若再次分栏，用`columnBalances`另测内部分类/商家列，不能把外层改成单列便结束检查。无效页没有主券时仍测这些内容。长内容的合理例外须记录精确页面/视口、实量及实看原因，保留原始触发项，不能自动豁免其他页面。

Browser Use会话剪贴板可能与系统OS隔离。实际点击后核对所用剪贴板与粘贴结果，标明会话/OS；会话值不得冒充OS，系统旧值也不能当新复制成功。能力受限记not-run，作者补充证据与独立角色证据分开。

无效页入口按冻结CID→merchantId确定预期店铺；原商家已知时不能用全店目录替代当前店铺，未知商家才允许目录fallback。传`unavailableState`测提示、无claim、动作及预期路径，并实际点击/Enter核对最终URL与店铺当前内容；目录可访问不等于对应店铺正确。不要从待测href反推预期目标。

对照冻结数据和实际渲染器建立角色映射，主栏/侧栏分别传`merchantGroups`及预期数量；`missing-merchant-field`、空集合、漏掉一种品牌类名均不能通过。所有普通券名也要纳入`names`。对每个实际存在的折叠/展开、分页和All/Codes/Deals状态，真实点击后传`listState`的预期可见ID顺序与计数；检查`hiddenElements`为空、实际可见集合与标签一致，包含零结果。共享券行的全部优惠页也属于受影响回归，店铺没有筛选不代表全站没有。不能从当前hidden属性反推预期集合，也不能用筛选后尺寸正确替代筛选正确。参数与本轮失败回归方法见细节标准“状态与角色覆盖”。多审核者须串行独占剪贴板，首点后真实粘贴/读取并刷新，避免相互覆盖造成误判。

同商家推荐隐藏店名为授权字段取舍；审核 Logo、优惠、日期和操作是否重新编组，不要求恢复重复店名。主券、推荐商店及混合商家身份仍按各自规则检查。PC 与手机分别比较跨站构图，不能只验颜色、边框和按钮形状。

## 交接

返回一个集中问题包：每项含位置/视口、证据、违反的required或观察到的视觉问题、用户影响、调整目标、复测标准。`hardFailures`与`visualFindings`分开，不能用minor标签豁免硬失败；目标范围仅为制作预算。作者修完交新候选，再复验全部遗留和相关回归。

最终记录：exact build、各视口/状态结果、参考/附件来源、对比图、实际操作及剪贴板结果、未检查项、pass/revise/not-run。通过只代表本轮独立范围审核，用户审美认可与正式全站发布状态分别记录。

另从用户实际使用的成果库/预览入口点击进入本轮详情，核对最终build，包含已打开成果库返回/恢复后的入口和现有下载目标。旧tab仍指向未修版本时不能以新候选通过宣布交付完成；入口复验与候选视觉复验分别记录，保留旧冻结构建。


## 公共执行与页面回归

容量、紧凑分类与防位移统一执行[全页面公共布局底线](../site-design/references/global-layout-baseline.md)，不在页面技能重复维护。优惠详情主券完整；商店列表首项与其他普通券一致。

详情方法负责主／侧区域、主券统一区域、商店身份卡、数量及数据状态；detail-standard.md负责inspectDetail的精确映射。公共inspectLayout的summary／topic／stability与详情检查共同执行。优惠详情与商店详情的共享组件同轮修正、重绘与最终产物复验，首页引用相同容量和稳定性规则。保留独立审核、真实交互、冻结数据及最终入口核验要求；缺证据不得填写通过。

详情按钮专项追加执行 detail-layout-methods.md 的“详情按钮的品牌造型与稳定动作”：主复制／购物及普通券入口共同设计；保留原生动作与掩码，形状只裁装饰背景，检查伪元素实际尺寸、44px热区、焦点及手机文字容量。主次按钮均提供 PC／手机真实像素；源码不变不等于交互通过，未测项目明确 not-run。

审核入口：先看当前像素，按适用问题逐模块复核；执行[容量驱动方法](../site-design/references/global-layout-baseline.md#容量驱动的修复与生成2026-10-23)，把实际中间宽度和断点写入reviewWidths/breakpoints并绑定适用criteria与可执行预算。不要只补规则说明而未接入检查；未执行状态保留not-run。

手机控制和图片边框执行global-layout-baseline的专节：标题右入口有名称的icon-only，横滑箭头同轨道两侧且不占独立行，缩略图规则外框。生成落实真实资产/样式；审核执行heading-action、rail-controls和image-fit.conventionalFrame，并实际切换。共享调用页按实际范围覆盖，不能以首页通过替代其他页面。

手机优惠动作与文章等高执行global-layout-baseline的“全家族覆盖与动作归属”：逐实际家族声明保留/修改/无此模块，接入mobile-card-flow或等价源码，冻结并执行action-flow及image-fit.balanceWith/fitMode。图文完整性与分组比较完整阅读组；不能用单站/featured样本替代其他家族。

本次及后续新候选追加公共布局底线2026-10-26.1：文章图片完整内容优先于等高，窄屏容量不足重排；内页券行按实际构图测轴线与上下内距，不能用首页结果替代；主复制按钮仅Copy类文案，无码仅Shop Now；footer只保留指定四项。使用真实初始HTML、最终ZIP和独立像素证据，不追改历史冻结包。
