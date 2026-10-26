# Coupon主券、列表与推荐的细节标准

来源：2026-10-16现场实测 Couponur 指定详情页；用户两份改前/改后附图；现有 Coupon 共用生成、业务框架与审核规范。照片中的“之后”是结构意图，不是可直接量取的CSS尺寸。观察值与采用值分开；保留每站颜色、字体家族、券形、分隔、实际CTA造型。

现行区域、数量、容量和自由构图以[详情参考处理方法](detail-layout-methods.md)为准（2026-10-21.13）；第一张券必须完整。推荐券模块可一行一张或合理多列，卡内可横向或上下分组，二者不互相限定。以下历史尺寸是标明作用域的预算，原始测量不变。


**2026-10-22 商家页最新区别：** 商家详情是商家卡（100×100 Logo、名称、真实券数，高≤200px）→普通优惠券列表；不保留独立主券区，不把第一张券单独放大、满宽或重复商家身份。原首券并入普通列表，CID、完整源字段、数量和顺序保留；筛选后也不重新提升首券。所有商家页券卡均按普通摘要容量及自身详情入口规则处理。不得只移除标记而遗留 :first-of-type／:first-child 的标题全文、按钮或列宽特例；须比较首张与后续卡的真实规格。全文中首券完整与领取条款仅适用于优惠券详情主券，商家列表第一项与其余普通券规格一致；优惠券详情页的主券仍保持完整及原领取区。

## 页面骨架与空间

|对象|PC采用标准/起点|手机采用标准/起点|检查方法|
|---|---|---|---|
|紧凑页头|50px高|50px高，搜索可达|量真实header，不把阴影当内容高|
|主容器|本六站max1200；两侧自然居中|12–15px，默认14px；宽=viewport−28|量内容边界，不能用root裁切掩盖溢出|
|PC主/侧栏|主栏flexible；侧栏256–300；间隔24–32|容器不够时先单列；主券→关联券→主栏推荐→侧栏内容|断点由可用宽度决定；分别查±1px|
|页面顶部到卡片|12–26px起稿；参考34px不是硬值|12–16px|量header底到卡片顶；不要加重复面包屑/店铺介绍|
|卡内信息间距|同组4–8；Logo→文字12–18；内容→操作16–24|同组4–8；Logo→文字10–12；上下区12–16|量实际元素边界，不只读gap|
|卡间/标题到组|12–16 / 12–16|12–14 / 12–16|检查末张、无内容、单张|
|模块间|24–34|24–32|合并margin后量真实距离|

PC左右区域视觉均衡，不用空框填高；卡内分组自由。普通摘要按固定文字容量省略，只有首券以完整展示优先，必要时自然增高。

完整主标题需在自己的文字轨道和券卡内，包含长网址、无空格长词；使用自然断词兜底，不能靠`overflow:visible`让字伸出卡片。量scroll/client宽与Range相对券卡的左右边界，root没有横向滚动不代表文字没有越卡。

## 类型与层级

|对象|PC|手机|硬边界|
|---|---|---|---|
|主券优惠标题|20px / 1.35–1.4 / 650–750|18px / 1.35；320可16px|16–20px、完整展示、无clamp；h1也不豁免|
|普通券标题|18–20px / 1.35–1.4 / 650–750|16–18px / 1.35|首要视觉焦点；不能出现重复描述段|
|商家名|16px / 1.3 / 400–600|16px / 1.3 / 400–600|只用颜色/字重弱化，不降到12px|
|日期、标签、数量|14px / 1.35–1.5|14px / 1.35–1.5|日期不作为可12px的描述；未知期限忠实显示|
|按钮|14–16px / 1.3–1.4 / 600–750|14–16px；图标入口有明确accessible name|真实触控区域≥44×44；同场景宽度相同|
|代码|20–24px / 1.2–1.4，等宽字体可选|18–22px，自然折行|原码完整、无ellipsis、无整串nowrap撑破布局|
|区块标题|20–24px / 1.3|20–22px / 1.3|不抢主券优惠标题焦点；对比度仍合格|

正文正常文字对比度至少4.5:1；有色标签、按钮、日期均按实际前后景合成检查。圆角、边框色、阴影不是统一皮肤；同一站主券/列表属于同一语言。官方Logo一个1:1框、contain、padding0、1px #EEE、保持原图，不能套双框或改色。六站当前84px作为主券与券行起点；其他场景不无差别放大所有图片。

## 主券组合

PC主券图文、身份和操作在一个统一视觉区域内按本站构图组合，不拆成独立底色／分割面板；历史左信息右操作、160–220px仅为起稿例子。首券全文不能被固定高度裁切。

手机主券重新安排图文和操作，Logo展示区至少70×70；不强制上下两块或代码按钮同行。历史200–320px与365px复核点是预算；超过时检查多余堆叠，不裁掉首券全文。

日期只渲染一次。标签与代码/按钮具有清楚归属。长码揭示后控件可一起增高或在确实不足时重排；反馈进入真实status区域，不预填Ready/Copied。无码不生成`****`，只展示真实SHOP NOW和真实日期，操作仍可辨认。

撤回、失效状态优先于历史类型标签；`coupon_code`但没有有效代码、或原状态为withdrawn的矛盾记录，不渲染成可领取有码券。保留原始快照，在展示派生层隔离；旧URL只给不可用状态和有效店铺入口，不能补造代码或自动改写成有效deal。

## 普通券卡与紧凑预览

普通券卡PC按家族确定容量。84px Logo、横排、120–140px动作、118–144px高度都是历史起稿例子，不是唯一构图。优惠标题为焦点，真实动作清楚。

普通券PC／手机按家族固定容量，标题／商家名单行省略且有完整源字段、可访问名称和对应详情入口。优惠券详情主券始终全文；不得缩字、误导优惠语义或用根级裁切遮住动作。

手机箭头是导航动作，可省略可见按钮字，但accessible name须包含动作和优惠全名；主券复制动作继续显示文字。一码一目标；推荐的Copy/Get Code先进入本券掩码详情，不在列表自动复制。无码按真实业务走SHOP NOW，过期整券从购物面移除，旧URL只显示不可用状态。

本轮附图的手机三列紧凑行，CTA与整张卡片及Logo垂直居中，不能随中栏标题行数改变而贴顶。逐卡量CTA中心与既定对齐参考中心的差值，并实看箭头/伪元素在按钮内部的位置；按钮无越界和≥44px只证明容纳/点击范围。其他保留的构图按其明确目标审核，不把居中坐标推广成全站统一皮肤。可配置`rowActionAlignment: {vertical:'center', reference:'row', maxViewport:700, tolerancePx:2}`，配合实际`rows`与`rowActionInRow`；若以Logo为参考则用`reference:'logo'`并提供`rowLogo`。配置适用视口内不得漏传两项选择器或空覆盖；可传来自实际冻结内容的`expectedRowCount`核对数量，真实零结果才显式设0，不能用于绕过漏选。每行同时检查按钮必需、卡内边界及与标题/商家关系；伪元素实际视觉仍须截图实看。

最终验收包含用户实际入口：从成果库点击进入本轮详情并核对最终URL build；保留一个修复前已打开的成果库，在修复后返回/恢复，确认其预览、页面族选择和现有下载入口指向当前版本。候选直链、sourceHash及current指针正确不能替代此项。旧构建仍保持不可变，不用覆盖旧包来掩盖入口过期。

## 与原规范共同执行

保留17类页面职责、真实公共库、CID/SID与数量/时间语义，店铺一行一券；详情无重复身份卡、无额外Conditions & source、无装饰说明条。关联券之后为主栏末位推荐商家，≥16个真实去重商家；所需侧栏分类≥8与当前六站既有侧栏商家不删减。页面范围内的首页、文章、品牌/素材和数据保持基线。

用实际页面比较主券、普通券、商家卡三种作用域，检查空态和重绘。尺寸通过只说明一部分；仍需独立实看PC/手机的层级、品牌、节奏与组件成套程度。冻结旧包不重写，新候选显式记录本细节版本及实际取舍。

## 主侧栏与跨区推荐

同一页的主栏和侧栏优先提供互补商家。保留主栏必要16家与既有PC侧栏数量，使用同一冻结目录中真实商家；数据有限时可回填主栏商家，不能造店铺或链接。手机侧栏下移后，已在主栏完整出现的同商家入口应去重，独有商家保留；这是跨区目的地去重，不是减少主栏必要集合或隐藏不合格字段。分别记录PC侧栏总数、手机独有数和跨区去重后的覆盖。

PC必须滚看主、侧栏的实际结束位置，尤其是侧栏连续16行造成主栏底部约500–1000px空白。优先用可读的多列商家编组、合理列宽/卡片布局或互补内容调整；不塞装饰、加空框、强行拉高主栏来凑等高。图库每个Logo84px时，2列侧栏通常比16行更均衡；普通名称按固定槽位省略、全文店铺可达，数量至少14px，不能为了列高压缩字号。模块所需数量不因视觉问题而删减。

卡片切换列数时同时协调卡内Logo/名称/数量的轨道；不要只改外层columns。检查实际加载后的样式顺序：工程收尾可能把旧detail-layout样式放在后面，同优先级的新规则会失效。用明确组件作用域与实际计算值确认结果，测试701/719/720/721这类本站真实边界及新列宽中最长名称；检查文字字形与Logo重叠、文字/图片越出卡片，不能只查根级横向滚动。保留原有Logo类名、场景分组、frame与商家ID计数钩子，让公共语义测量继续覆盖新节点。

## 独立商家卡的间距与面板内边界

独立卡片的圆角、背景和边框定义实际视觉边界；必须检查相邻卡之间的净距离，不能只查页面溢出或卡内碰撞。带边框／底色的面板保留内部padding，即使它同时是移动端列表宿主；页面单层外边距与面板内部留白是不同层级。

在实际 `merchantGroups` 中增加 `spacing: {container: '.sidebar-panel', minimumGapPx: 8, minimumInsetPx: 12, insetFields: 'h2, .all-stores-link'}`。数值是本站明确预算示例，不强迫各站同一间距；`container` 必须是每张卡的真实面板祖先，`insetFields` 映射当前存在的面板标题／末链接。只做连续行构图的列表须在计划说明共同外框与分隔方式，不能把独立圆角卡的贴合声明成连续行例外。

检查器从真实矩形的横向／纵向投影测相邻行列距离，支持多列网格；面板内边界扣除border，避免把1px边框误算成留白。`merchant-card-gap`、`merchant-panel-inset` 和缺失映射均为返工项。作者和独立审核用同一映射测PC、手机、320px及断点±1；几何通过后仍须查看完整侧栏、标题与首末卡，不能只看首屏。回归夹具覆盖零间距单列、零间距网格、正常8px网格和手机padding清零；不同家族须配实际选择器。

## 状态与角色覆盖

### 优惠券标题与日期的真实内容高度

本轮用户明确要求短标题不预留空白第二行。作者／审核映射 `couponTextGroups: [{name:'coupon-rows', cards:'.actual-coupon', title:'.actual-title', date:'.actual-date', maximumTitleDateGapPx:12, unusedHeightTolerancePx:2}]`；选择器相对卡片，数值为实际字体与行高的预算示例。检查器读取实际可见文本行与line-height，报告 `coupon-title-unused-line-space` 及 `coupon-title-date-gap`。缺失字段与空覆盖不能通过；真实无券状态显式expectedCount:0。旧测量仍可检查全文角色的自然双行；普通摘要另由公共summary强制单行。测试覆盖固定44px单行失败、自然单行通过和日期额外margin失败。标题在inline子元素时同时核对父包装，不能借子元素高度掩盖父空轨道。

检查每个品牌的短／长标题、店铺首券和普通推荐、PC／手机及实际重绘。卡高和动作轴按已声明的家族规则保持一致，标题／日期组内部紧凑；首券完整要求不变。几何检查之外，仍须看对比图确认没有把空白从标题下方转移成卡内新的异常空带。

首券商家名完整自然换行；普通摘要中的商家名按声明文字槽省略，保留完整身份和真实店铺入口。不同用途独立制定宽高预算，不以141px统一所有卡；320px同时记录innerWidth和clientWidth。

需要完整展示的首券身份必须容纳在自身轨道。对比scroll/client与Range边界，overflow:visible不是豁免；无空格名称必要时断词，不缩字。普通摘要按声明容量检查，不能套用全文裁切失败条件。

布局规则必须保留`[hidden]`的隐藏语义。初始折叠、展开、加载更多和类型筛选从同一冻结快照派生ID顺序与计数；逐一点击后核对真实可见集合、布局尺寸、空态和计数标签。不要从DOM当前hidden标志反推出预期值。未提供某控件或真实类型记录时记not-applicable，不能造记录；真实存在的零结果必须测试。

`inspectDetail`仍是实际浏览器测量函数，不会自动操作页面。按真实DOM配置：

### 分类导航的公共防回归测量

本次范围涉及主题／分类时设置 `requireTopicNavigation:true`，逐个实际导航家族传 `topicNavigation`；不能用其他角色通过、空数组或一次截图代替。本检查返回几何证据，适用失败进入集中返工包；独立实看仍负责图标含义、颜色协调和跨站构图质量。

```js
{
  requireTopicNavigation: true,
  topicNavigation: [{
    name: 'sidebar-categories', host: '.actual-category-host',
    cards: 'a.actual-category', label: '.actual-category-name',
    mode: 'svg', iconFrame: '.actual-icon-frame', icon: '.actual-icon-frame svg',
    markers: '.actual-editorial-marker',
    iconMinPx: 26, iconMaxPx: 32, // 本卡族已声明预算，非所有站固定值
    expectedCount: 8, // 来自冻结数据；不是读取当前DOM后填回
    expectedLabels: ['...'], // 完整真实名称及顺序
    expectedMarkedLabels: ['...'], // 实际获准精选项；没有则 []
    sharedAlignment: [{field:'iconFrame',axis:'y'}, {field:'label',axis:'y'}],
    alignment: [{field:'labelText',relativeTo:'label',axis:'x',anchor:'center'}] // 此示例声明文字居中；目录可用start
  }]
}
```

`host` 相对文档，其他选择器相对宿主／卡片；`cards` 不含 All categories 等目录入口，该入口另按真实动作测44px和落点。`action` 可映射卡内真实链接，默认卡片本身。`mode:'text'` 仅兼容旧冻结包的无图标目录；新任务分类必须有图标，同时通过公共topic检查；不为通过把黑白／不可读图标称为文字模式。当前图标自动颜色测量支持直接绘制的内联SVG，并沿祖先检查零透明度；`use/symbol`引用画笔无法用use自身的fill/stroke证明颜色，返回 `topic-icon-paint-unverified`、status=not-run、hasColoredPaint=null，不能误报无色或直接通过。图片、字体图标及引用SVG需等效渲染像素证据和独立审核，未补齐不得把该项记为pass。

按当前断点声明实际预算。`sharedAlignment` 比较同家族字段相对卡片起点的偏移，仅用于设计声明需对齐的组，不把不同构图强行比较。需要中心／边缘对齐时使用 `alignment:[{field:'iconFrame',axis:'x',anchor:'center',tolerancePx:2}]`，也可声明 start／end 与 offsetPx；不要求所有卡片居中。`label`表示文字槽，`labelText`表示真实字形；二者分别声明对齐。文字中心／起点可用 `relativeTo:'label'` 对照自己的槽，默认参照卡片。横向文字对齐逐行检查，合并同一行的内联字形，不强制所有站居中。名称全文字形须容纳在自己的槽内，不能靠溢出可见、缩字、遮盖或删精选标签通过。

实际换列阈值须测前／中／后1px；容器查询记录实际宿主宽度。测试里主动设置宽度时附 `requestedHostWidth`，公共检查会核对实际值；被旧 max-width 限制而没达到目标的样本算未覆盖，不能记断点通过。测试候选文件保持冻结，仅在浏览器临时施加压力样例，并与自然视口样本区分。

公共检查覆盖：映射／预期数量缺失、SVG被旧min/max约束缩小、实际图形无颜色、长名称越槽、文字与图标／标签碰撞、精选项对齐偏移、卡片重叠、44px热区和标签遗漏。颜色检测仅判实际SVG画笔有色，不能证明语义、对比度或视觉优秀。真实点击／Enter核对来源数据所指目标，hover／移出、触屏、焦点、减少动态、重绘及跨站差异继续按既有流程执行。

回归入口为宿主工程的 `tests/coupon-topic-inspector.test.mjs`；包括正例和故障注入，证明确实能拒绝已知坏布局。便携包从 `knowledge/imported/skills/coupon-detail-review/scripts/inspect-detail.mjs` 提供同一函数，无需复制本次站点CSS或临时工程脚本。

详情PC另配置`columnBalance: { sidebar: 'main aside', primary: '.actual-main-column', fixedPrimaryColumn: true, reviewThresholdPx: 500 }`。分别量两列真实子内容的结束位置；display:contents可由子项测量。当前优惠详情不允许把主区域末位推荐排除为共享尾区；该旧参数仅用于其他有明确授权的布局，约500px以上差距须集中视觉复核，不能把该数字当统一皮肤或用空框/删模块凑齐。单列状态记录不适用。

无效/撤回详情必须采用与有效主券相同的1440、1024、768、393/375、320及重组断点±1矩阵；不能只测手机提示。无效状态减少了主内容，可能恰好产生PC大块空白。只免除不存在的main/mainTitle/claimAction角色，容器、不可用提示及真实店铺入口、完整主推荐/既有侧栏/分类仍检查。没有真实样本才记not-applicable；最终解压ZIP亦检查无效页PC与手机。记录状态×视口覆盖，未访问格不能被整站pass覆盖。

依据冻结CID的merchantId解析当前店铺，已知原商家时直达该商家；仅无从识别商家时允许真实目录fallback并使用相符文案。示例测量参数`unavailableState: { container: '.actual-unavailable', action: 'a[href]', expectedStorePath: '/stores/artist-works/' }`；预期路径来自冻结数据和本站路由规则，不能从当前href反推。helper检查状态、无主券、动作44px及路径；仍须真实点击/Enter并核对目标URL、店铺身份与当前优惠或真实空态。Jingle旧候选目录仍能正常打开、按钮44px，不代表回到原Artist Works店铺的业务正确。

发现区变为通栏且内部仍分分类/商家两列时，外层单列不代表内部均衡。追加`columnBalances: [{ name: 'discovery', primary: 'main aside > .actual-topics', sidebar: 'main aside > .actual-stores', reviewThresholdPx: 500 }]`，以各真实子内容结束点判断。约500px触发项保留原始测量；合理长标题/推荐带来的个别例外由独立实看记录具体路由、视口、原因与界限，不能扩大成无效页或全站豁免。经典滚动条的headful浏览器与overlay浏览器宽度不同，应记录二者的inner/client实际值，不通过伪减viewport宽度替代媒体查询测试。

复制证据注明浏览器会话剪贴板还是系统OS剪贴板。Browser Use可隔离二者；真实点击后核对对应读取/粘贴，旧OS值不能证明新复制成功。未执行的分支保持not-run，作者与独立角色证据分开。

`requiredRoles`按页面族与状态声明：主券详情要求main/mainTitle/claimAction；店铺或列表零结果不要求不存在的主券角色，仍要求当前应有的容器、页头和推荐模块。未执行的状态不得改为pass。

```js
{
  requiredRoles: ['content', 'header'], // 此例为列表零结果，非主券详情
  content: 'main', header: 'body > header',
  names: 'main .actual-coupon-merchant, main .actual-store-name',
  merchantGroups: [
    { name: 'primary-stores', cards: 'main .actual-recommendations .actual-store',
      nameSelector: '.actual-store-name', countSelector: '.actual-count',
      expectedCount: 16 }
  ],
  listState: {
    name: 'deals-empty', cards: 'main .actual-offer-row',
    idAttribute: 'data-offer-id', expectedVisibleIds: [],
    counter: '[data-results-count]', expectedCounterText: '0 of 0 offers'
  }
}
```

这些选择器只是参数示意，须替换为本站真实类名/属性。主栏、侧栏分别建立预期计数（含手机合法跨区去重），不能把两区合计当主栏16家。`merchantGroups`默认要求非空；明确某状态数量为0时可用`required:false, expectedCount:0`，不能为绕过缺失设置false。每张卡必需Logo/名称/数量均应被覆盖；Rivet的`.store-tile-name`等品牌类名不能漏掉。`listState.expectedVisibleIds`来自冻结数据与实际分页规则，不能仅比较元素数；重复/缺失ID同样失败。

`hidden-element-occupies-layout`、`full-field-*-clipping`、`merchant-group-coverage`、`missing-merchant-field`、`list-visible-id-mismatch`及`list-counter-mismatch`是本轮防漏检项。用真实失败的旧候选验证能检出，再用新候选证明修复；旧冻结技能与旧产物不重写。

手机普通卡按声明规格和容量布局；短标题按实际行高，标题与日期间不能保留空白第二行；合理的对齐余量放在整个内容组外。长标题不撑高普通卡；首券完整展示单独审核。辅助链接不制造空触控轨道。

本轮紧凑目标为卡间8px、模块标题到首卡8px、主券到关联区16px、末券到发现区标题约20–24px，均为制作目标而非裁切上限。测量真实前项底到后项顶，包含margin、padding、标题默认margin、辅助入口换行和边框的累计值；不能只读gap。辅助入口可与标题并行，箭头导航保留44px真实热区和完整可访问名称。必须同时实看短/长标题、短/长商家、最后一张卡、完整发现区和PC，不能只检CTA中心或最长标题。

默认视觉与紧凑密度按详情布局方法的「安静的默认视觉与信息密度」执行：白／近白底、浅细线／轻阴影，品牌边框留给交互反馈；检查SVG与伪元素，普通券按实际信息收紧，不缩小Logo、字号与热区，不把不同站做成同一构图。

推荐券的 Logo 外框、内包装、图片和 SVG 底板分别量边界；标题／日期可见字形不能进入 Logo 区域或动作区域，按详情布局方法「推荐券的 Logo 区域、文字轨道与真实留白」覆盖所有工程及重绘。


## 商家详情顶部卡片（2026-10-22用户最终附图）

必须显示100×100px实际Logo、完整商家名称及真实优惠券数量，卡片总高度≤200px，下方直接券列表；风格自由。复用原始数量节点与实时钩子，不把筛选后显示数当全店券数。名称、图片、数量及单位均不裁切或相交。公共检查映射 `storeHeading:{container:".actual-card",name:"h1",count:".actual-count",logo:"img",logoPx:100,maximumHeightPx:200,expectedName:"Frozen merchant name",expectedCount:3,followingContent:".actual-offers"}`。期望来自冻结数据或原生节点，不能从已改DOM反推；已有筛选属于有效内容，不把其高度误报为空白。仍须独立实看PC/手机、真实长名、0/1/多券状态和重绘。



## 商家卡轴线与可见文字的防回归

使用当前公共inspectDetail时，本次范围包含商家卡就设置requireMerchantAlignment:true，并为每个实际merchantGroups声明alignment。上下卡核对Logo／名称／券数同一水平中轴；横排卡核对Logo与完整名称券数组的垂直中轴，不能把Paloma修复皮肤推广到其他品牌。

```js
{
  requireMerchantAlignment: true,
  merchantGroups: [{
    name: 'primary-stores', cards: '.actual-store-card', logo: '.actual-logo',
    nameSelector: '.actual-name', countSelector: '.actual-count', expectedCount: 16,
    compactText: { maximumNameCountGapPx: 8, unusedHeightTolerancePx: 2 },
    alignment: [{
      axis: 'center-x', reference: 'logo', tolerancePx: 2,
      fields: [{ selector: '.actual-name', text: true }, { selector: '.actual-count', text: true }]
    }]
  }]
}
```

选择器相对卡片，必须替换为真实节点。axis为center-x或center-y；reference为logo、card或卡内真实选择器；fields不可为空，必须覆盖声明的名称与券数。默认比较盒中心，text:true再比较实际可见文字行；严格开关下center-x的名称／券数必须使用text:true，不能只量居中的空容器。同一行不同字号的数字／单位按整行合并，上下分行分别检查。center-y的文字采用整组范围；横排名称券数组通常直接映射其真实包装，不把每一行强行拉到Logo中心。tolerancePx默认2，offsetPx只用于有像素依据的局部光学校正，不能用26px偏移去掩盖错误网格。数值不是全站固定皮肤。

缺组、缺alignment、字段缺失／隐藏、空文字及无效轴线配置分别报告merchant-alignment-*；偏离声明轴报告merchant-declared-alignment。显式真实零组可以expectedCount:0，不能借此跳过实际存在的卡；严格开关下仅用required:false不能豁免空样本，必须有数据依据和显式零计数。未提供映射不得报告该项通过；作者和审核采用同一参数，PC／手机／320px及实际断点两侧分别执行。

字段居中后继续检查与操作的字形边界。已有recommendationBoundaries可映射此商家卡：cards映射实际商家组、logo映射Logo框、fields映射名称／数量、action映射实际可见箭头或按钮区域，expectedCount与真实集合一致；它会报告文字进入操作／Logo区域。装饰箭头的可见区域与整卡真实热区分别核对，不能把空装饰包装当作图形，也不能把独立按钮缩到44px以下。几何与Range矩形不能证明光学平衡或点击行为，保留独立像素与实际状态的证据边界。

来源是Paloma左侧下方商家券数26px偏移的用户退回；具体原因与修复构图边界见[公共布局底线](../../site-design/references/global-layout-baseline.md#商家卡对齐必须落实到字段和可见文字)。回归同时覆盖旧偏移、容器居中但文字偏移、数字／单位混合字号、字段漏映射及合法横排分组；旧冻结候选不改写。
