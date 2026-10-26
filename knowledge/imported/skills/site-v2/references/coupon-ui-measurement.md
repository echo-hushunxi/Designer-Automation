# 原始 Coupon 业务规范的执行绑定

这是原 skill 的可测量部分，不是新的皮肤、审美评分或缩减验收。新 new-design 导入自动冻结原项目 coupon-site、coupon-ui-lab、layout-requirements、module-contract、acceptance 的哈希，写入 `docs/coupon-ui-contract.json`；不能修改绑定绕过要求。读取五个原资源一次，后续使用冻结版本。最新用户要求优先：详情无 Conditions & source；非主券 Copy/Shop 先进入该券掩码详情，再明确揭示/复制。

`generationProfile="homepage-first"` 的新导入采用该模式的首页动作例外：冻结的 `rules.homeActions` 允许 Get Code、Get Deal、View Now 和按语义使用的 View Details，替代首页必须统一 View Details 的旧文案要求。按实际 code/deal 数据、板块职责和目的地选择文案，真实类型、CID、掩码/复制/跳转继续审核；允许集合通过不能证明语义或视觉通过。装饰图标应标记 aria-hidden，避免混入可见操作文案的测量。其他模式和既有冻结绑定仍使用各自原规则，不能靠修改旧候选绑定升级。券量和 Logo 起稿参考不设为跨站固定配额；用户最新确认的商家Logo实际展示区至少70×70为共同底线，需在本模式既有计划和同一轮像素审查中验证实际覆盖、辨识度、空间比例及重绘对齐。

在 `docs/coupon-ui-selectors.json` 写一个小对象：`{"version":1,"selectors":{...}}`。必须映射实际 DOM 的 couponCard、mainCoupon、couponTitle、merchantName、merchantLogo、merchantCard、cta、compactHeader、mainContent。值是该站自己的 CSS 选择器，不强制类名、版式或视觉皮肤。couponTitle 覆盖所有优惠标题（包括详情主券 h1），merchantName 包括 Hero/券卡/身份/推荐/侧栏商家名，merchantCard 只指身份卡、商家入口/推荐卡，不指整张优惠券，cta 只指实际券卡/主券动作，mainContent 指手机实际 12–15px 两侧边界，不选择没有边距的满屏背景。

每张官方 Logo 标记 `data-ui-logo-group`（可在最近祖先），按稳定展示场景区分如 hero-merchants、coupon-list、recommended-stores、sidebar；同场景同断点等框/等图片尺寸，不能按 merchant ID/图片比例逐张分组来逃避等尺寸要求。若边框在外壳而非 img，给外壳 `data-ui-logo-frame`。保留官方素材留白与颜色，contain、1px #EEEEEE、padding:0、图片与框同圆角；辨认程度仍靠视觉审核。实际券 CTA 标记 `data-ui-cta-group`，同级同场景等宽；主券可单独分组。标签不改变行为或样式。

`site_browser` 对新绑定候选每次实际访问/操作自动返回 couponUI 测量并存入不可变 receipt，独立于临时 inspect selectors。标题范围检查还覆盖主券标题和实际详情路由上的 main h1，避免把业务标题误当自由页面标题；空角色、损坏 Logo、错误首页 CTA、非 50px 内页顶栏、手机留白、同场景 Logo/CTA 不等尺寸均返回 fail。作者 handoff、独立 close ready 和最终正式验收必须有自己的 home/store/listing/detail 桌面、手机、320px 真实测量；homepage-direction 仅要求 home。发现失败修源码并构建新候选，不能靠文字 typography pass 放行，不能重建来修证据字段。

此测量不能代替完整原合同与最新用户确认的摘要容量/70px Logo检查；旧自动测量未覆盖的条款须另行实测，不能仅凭自动pass放行。原合同中的完整信息要求在摘要卡上按用途取舍、详情仍全文，其他规则继续适用：浅色内页、每券期限、商家/主题真实性、店铺一行一券、详情信息左/动作右及手机顺序、默认掩码/复制/刷新、无码/过期、首页节日、省钱内容末位、相关券后16商家与8主题、焦点/视觉质量、搜索/客户端重绘与离线 ZIP 仍须实际审核。逐条记录原合同的结果与真实 receipt，不把几个自动尺寸检查称为全规范通过。

真实空结果提示可标记 `data-ui-empty-state`，此状态不要求展示已不存在的券卡，但尺寸/剩余内容规则仍生效。每个必要页面族与断点仍必须提供正常有内容状态的实看测量；只看空结果不能满足交接/验收。屏外 lazy Logo 在未滚到它之前不凭未加载判断损坏，滚到可见位置后必须加载并实际辨认。

数据模块可能包含巨大表，不要用整文件读取或旧版单行 JSON 的 head 来理解 API。事实用 data 按ID/集合查询；实现只读取导出函数/调用点的有界片段。成功导入是可用的持久检查点，已读版本与未完事项经官方语义摘要保留，不重开作者/重复导入。
