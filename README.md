# Designer-Automation

独立Git工程，运行程序0.2.0，既有生成规则固定为2026-10-26.1。

其他设计师从 [echo-hushunxi/Designer-Automation](https://github.com/echo-hushunxi/Designer-Automation) 拉取后，按[设计师快速连接](docs/designer-quickstart.md)运行npm ci及npm run connect即可，内网免Token。共享MCP固定在http://172.18.188.6:4381/mcp，复用MongoDB副本集的独立经验库；备份与恢复见[运维说明](docs/experience-operations.md)。连接文件与令牌均被Git和分发manifest排除。

设计师提供站点Git地址后，由其Agent读取AGENTS.md与core/maintenance.md，使用bin/workbench.mjs执行：拉取一次 → 审核 → 精确修复 → 增量复验 → 稳定预览 → 设计师反馈/认可。JSON配置、覆盖和证据由Agent准备。详细调用、能力边界与经验服务配置见[独立维护工作流](docs/standalone-workbench.md)。

共享经验无需日常Git推送：固定内网服务提供HTTP与远端MCP，其他Agent连接同一个/mcp，服务端不再使用本机JSON持久化。设计师对话自动入库为待验证案例，复测并认可后由维护者发布适用经验；运行中的任务不热更新。支持本地记录、远端读取缓存和离线待同步队列。网络监听与认证通过环境变量配置，不包含密钥。

首次使用需Node >=22.19并npm ci；实际浏览器由SITE_BROWSER_EXECUTABLE指定。现有生成仍使用bin/da.mjs，其流程和原Harness源码不因维护入口改变。项目使用独立私有Git仓库；共享经验服务的连接检查与真实站点验收分别记录。

以下是原生成规则包的固定版本说明。其上游导出说明用于解释历史来源；不要用原Harness导出程序覆盖本独立工程的新运行模块。

给 Harness、Codex 与其他能够读取文件的 Agent 使用的 Coupon 制作与审核包。详情页只是一个页面模块；通用规则、页面知识、个人方法和工具适配独立维护。

用户确认的卡片构图、层级、间距、数字／导航表达与PC／手机编排是后续任务默认要求，由 core/quality.md「后续任务默认执行的设计标准」维护。context 对所有页面、模式与生成／审核角色自动提供该规则；新任务冻结当前版本，历史产物保留原规范。后续制作沿用处理方法与质量底线，每站仍需形成自己的设计。

## 使用

需要 Node 22+ 执行辅助工具；没有 Node 的 Agent 仍可从 AGENTS.md、knowledge/index.json 手动选择规则并记录同等证据，不能假称运行过检查。

```sh
node bin/da.mjs check
node bin/da.mjs context --page offer-detail --mode preserve --adapter codex
node bin/da.mjs context --page home --mode new-design --profile homepage-first --adapter harness
node bin/da.mjs pages
# 先按 templates/task.json 和 core/start.md 填写真实任务与能力证据
node bin/da.mjs doctor --task task.json --capabilities capabilities.json
node bin/da.mjs init --id detail-trial-001 --task task.json
# 完成该 run 的 inputs/brief.md，制作 outputs 中的候选，再冻结：
node bin/da.mjs freeze --run runs/detail-trial-001
node bin/da.mjs verify --run runs/detail-trial-001
# 独立角色完成 review-1 证据后，用外部报告文件封存（格式见模板）：
node bin/da.mjs seal-review --run runs/detail-trial-001 --review /absolute/review.json
# 仅有遮蔽对照实验时，在封存独立结论后揭示历史交付：
node bin/da.mjs reveal --run runs/detail-trial-001 --history /absolute/held-out-history
```

init 把当前包复制到任务 inputs/package 并记录版本/hash，之后从任务冻结副本读取规范。现有执行顺序见 core/workflow.md，每个目标工程的必查维度见 core/quality.md。制作前填写 inputs/coverage.json 的工程/页面/组件/卡型/视口/状态/规则矩阵；空覆盖不能冻结，漏掉已声明检查不能封存审核。独立角色再对照实际项目和规则核验清单是否漏列，不只回填作者挑选的几项。freeze 后不得改候选或输入；返工创建新 run 并记录 supersedes。辅助程序验证文件一致性，不裁定视觉合格，也不能认证审核人的真实独立性或判断人为声明的矩阵是否完整。

新任务使用 version 2 task，由 `plan` 生成覆盖，绑定实际候选后再生成；不手填或删减自动清单。`seal-review`还核对能力证据、实际路由/模块inventory与任务预期。legacy模式仅兼容历史手工清单，不宣称具有新覆盖保证。程序无法识别伪造的观察或认证审核者身份，实际独立实看仍必须执行。

首次接入读 core/start.md。`context`默认只列resolve必读，后续阶段必须分别加载；`resources`和`deferredRequired`保留全部适用规则，`assets`保留可执行测量及完整数值契约，`policy`给出否决方向的可读查询。`pack --output /new/folder`生成不含私有运行/凭据的同哈希副本。复制后运行 `node --test tests/portable.test.mjs`；实际浏览器测试见 systems/browser.md。

## 当前完成度

- 2026-10-22.2：补入图文结构轴、文字基线、光学平衡、图文比例与跨端重组专项。审核必须记录alignmentAndBalance；测量器支持center-x/center-y，并保留边缘对齐和有理由的非零预算。可见图形重心与真实文字基线仍需实看，不能用元素盒自动推定。

- 2026-10-22.1：全页面视觉完成度方法已直接接入作者plan/make/check及审核review；整页构图/节奏、色彩/状态、图像/品牌协调各有PC与手机覆盖项。已执行项需具体observations和pixelEvidence，几何测量不能代替像素；合理留白和精细的成熟版式保留。文件完整性检查不能认证截图来源、观察真伪或审美结论，仍须真实独立审核。旧冻结候选保持原合同，维护沿用授权边界。

- 全页面公共布局：已接入生成预算、真实浏览器测量和PC/手机覆盖门槛，检查页边距、可见阅读轴、卡间距、文字容量及图文轨道。各站自定布局和合理预算，不固定皮肤。空态/不可用态/筛选重绘的自动预算分支尚待接入；保留现有独立状态审核，缺测不能通过。因此当前版本不能宣称所有页面所有状态已自动验收。
- 所有含卡片页面：已启用卡片密度与构图差异方法，生成和审核共同检查真实短长内容、断点两侧的正文宽度、自然信息/操作组、最终 CSS 级联、状态分支及动态重绘。跨站和不同用途不能套同一卡片只换颜色；相同用途可复用本站组件。Logo 只按显示大小及卡内占位审核；源图清晰度与来源不属于这一排版专项。此通用防错方法不代表下面仍待整理的页面专项已经完成。
- offer-detail：已接入详情生成、审核、数值契约、实测、原始截图和测量函数，细节标准沿用导出时的当前版本。
- store-detail：店铺身份、首券与普通券、主推荐商家、主题导航、侧栏商家已有排版方法；整页业务/异常状态与独立样本覆盖仍 partial。
- home：已接入首页方向、用户确认的四张参考处理方法、按用途确定的卡片容量与截断边界、70×70 Logo 下限、PC480px／手机400px Banner 上限，以及跨站跨端构图审核。homepage-first 仅在该模式启用；尚未整理的其他首页组件专项不算已完成。
- 其他 14 个页面族：已有业务字段框架和共同质量底线，页面专项细则待整理。未整理不等于没有业务约束，也不等于达到详情页的细节覆盖程度。

knowledge/index.json 是机器可读入口，knowledge/pages 是页面状态和扩展位置。追加首页等规则按 templates/page-rule.md 填写，再注册 active/candidate 和作用域；不要直接套详情卡84px或8px间距。

## 目录职责

core 保存通用执行、知识匹配、质量与遮蔽验证；workflows/coupon-pages 保存流程配置与制作方法；knowledge 保存公开索引、页面入口及只读导出规范；designers 保存可选个人方法；systems 描述工具能力和边界；bin 提供选择、冻结和完整性验证；templates 提供任务/规则/审核模板；docs 提供离线架构说明。runs 与私有知识/连接记录不进入版本管理和发布包。

## 版本来源与分发

当前迁移采用兼容导出：原 Harness skills 仍是已有规则的唯一编辑源，本包 knowledge/imported 是带逐文件 sourceHash/sha256 的可携带快照。core、页面索引、工具适配和辅助程序以本包为源。没有两份需要手工同步的正文。

在上游 site-harness-v2 根运行 node scripts/export-designer-automation.mjs，更新导出与 manifest；Harness workflow 返回同一包的版本、入口及哈希，并检测上游漂移。可复制整个 Designer-Automation 目录，排除 .gitignore 指定的私有路径；不要只复制 SKILL.md。项目内 skill 入口在 .agents/skills/designer-automation，任意其他 Agent 可直接读 AGENTS.md。原 Harness 全局 skill 和历史冻结包继续有效。

导入的旧资源中，`skills/…`、`policy/…` 和 `docs/…` 以 knowledge/imported 为知识根；源码中的 source/docs 指候选项目。原生工具名和原机器运行命令仅为 Harness 适配说明；其他 Agent 用 systems 中的等价能力，缺失记 not-run。没有复制 MCP 实现、密钥、私人运行记录或连接成功证明。

架构、规则与完整性工具可供不同 Agent 使用；不代表已用所有 Agent 实际生成并验收新站。每次候选仍须单独进行真实浏览器检查和独立视觉审核，结论与适用范围记录在对应 run。
