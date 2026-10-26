# 从一个新 Agent 开始

本包只要求能读文件，辅助程序需要 Node 22+。没有浏览器、构建或独立审核能力时，仍能规划或写代码，但不能宣称完成相应验收。历史聊天、开发者本机路径和隐藏工具不是依赖。

1. `node bin/da.mjs check` 检查包；`node bin/da.mjs pages` 查看17类页面的业务覆盖、专项成熟度和模块职责。active 表示已启用规则，不代表任何未来成品自动通过。
2. 读取用户请求，按 `templates/task.json` 填任务：全部工程、真实源码位置、页面/代表路由、模块语义与选择器、实际断点、状态、数据来源、交付范围。先规划，数据和源码确认后再绑定选择器和真实样本。`config/page-contracts.json` 是职责索引，不是皮肤模板。数据为空也检查空态；没有某种真实状态须填有依据的 notApplicable。
3. 每页、每角色、每阶段运行 `context --page home --mode new-design --adapter generic --role author --stage resolve`。顺序为 resolve → plan → make → check → review → deliver。读取当阶段 `read`；其他阶段的规则列在 `deferredRequired`，必须在进入相应阶段前加载。所有启用原文仍在包内，资产不要求整段读入：`policy` 查询否决方向（原指纹仍供执行工具核验）；JSON契约按字段查，inspector直接执行。不能将延后读取解释成规则失效。
4. 根据 `systems/<adapter>.md` 绑定真实工具，把能力探测输出保存在任务目录，按 `templates/capabilities.json` 记录。`doctor --task task.json --capabilities capabilities.json` 核对缺口。没有能力就记录 not-run，不能伪造原生回执。新任务确认真实API可达或使用用户授权、来源可核验的冻结快照；既有 Harness 新导入的更严格实时取数门禁保持。
5. `init --id unique-id --task task.json` 冻结完整规则包并生成预期覆盖。实现后把真实 build ID 写回 run 的 task，运行 `plan --root runs/ID/inputs/package --task runs/ID/inputs/task.json --output runs/ID/inputs/coverage.json`。把能力及其证据保存到 inputs。覆盖由模块×路由×视口×状态和逐页质量维度推导，不能删检查让候选通过。
6. 按 core/workflow.md 完成制作、自检和原生门禁，保存实际候选到 outputs，再 freeze。独立审核者从实际候选采集 `review-1/inventory.json`，核对真实模块与预期；用相同检查ID记录结论和证据。新增漏列组件应返工任务清单、新建run，不能修改冻结输入。seal-review 检查全部项、候选绑定与能力证据；有失败、未检项或主要视觉问题不通过。
7. 交付明确范围：实现、独立审核、用户认可、站点库激活分别记录。Harness 必须执行原生交接/审核/发布工具；本包通过不能代替它。没有用户要求不提交或推送Git。

## 创作空间

必须遵守真实数据、模块职责、首券全文、普通摘要容量、Logo与字号/热区底线、必要操作、跨端可用性。字体家族、配色角色、构图、列数、信息分组、卡片轮廓、数量表达和按钮整合由页面目的与品牌决定。宽高预算按“本站×用途×断点”记录，不给所有站统一数值或轮换模板。不强求每张卡与别站不同；比较相近站同用途的真实PC/手机页面，忽略换色和装饰后仍应有清楚、实用的原创组织。样式自由不能抵消空散、拥挤、重叠或阅读困难。

## 维护与分发

`pack --output /new/Designer-Automation` 仅复制manifest公有文件，排除runs、私有知识及凭据。在新目录跑 `node --test tests/portable.test.mjs`；浏览器回归见 systems/browser.md。本包core/bin/页面扩展直接维护；imported是上游只读快照，离线使用无需上游。要改其中规则，在原上游维护再导出；独立分支应显式建立新canonical来源及版本，不能双源静默漂移。完整旧原文、版本与来源不因渐进加载而删除。
