# Harness

先 site_harness workflow 指定 intent，维护附精确 projectIds；返回 designerAutomation 给出包入口与版本/hash。当前候选仍优先读取 reviewContext 冻结资源，不强制旧包升级。

执行原生数据绑定/preflight/build/作者handoff/独立审核/release。此包负责通用知识组织与可携带入口，不能替代原生状态机或构造假的receipt。实际可用工具从宿主注册表确认。配置更改只对后续新进程/新运行生效，不能宣称已经热更新在跑会话。

导入后、首次构建前，用 `site_skill` 读取当前项目绑定的业务依赖；普通文件读取、另一项目的读取记录和本包 context 都不代替原生登记。当前原生合同至少包含 `coupon-site/SKILL.md`、`coupon-ui-lab/SKILL.md`、`coupon-site/references/layout-requirements.md`、`coupon-site/references/module-contract.md`、`coupon-site/references/acceptance.md`；以当前项目 `couponUI.resources` 返回的实际列表与 hash 为准，每个版本读一次，按其适用引用补读。审核者使用 reviewContext 的冻结依赖。它们是宿主项目的绑定扩展，不应从其他旧站随意复制，也不能修改这些冻结文件绕过门禁；最新用户要求与本包已明确的覆盖关系继续生效，旧样式示例不成为新站统一皮肤。

旧技能里的 skills/ 与 policy/ 在知识导出包以 knowledge/imported 为根；真正项目源码、dataRoot、工具和运行参数仍由宿主提供。

新任务先填task，init冻结所有页面context；按stage逐页读取。doctor中额外记录native-workflow/native-preflight/native-handoff/native-review能力，其证据取自实际工具注册、公共workflow及当前运行回执；正式审核结论仍绑定实际build，不复用能力探测作为成品证据。Task/coverage文件可放在独立任务目录，不能为了通过原生preflight改写业务结构计划。

本包不附带模型SDK、私有设置或原生MCP实现。宿主使用自己的受支持运行时和既有启动入口。在当前Site Harness仓库可使用 scripts/run-harness-batch.mjs（Node22.19+）发起新独立会话；分发到其他宿主时先发现真实入口，不能照搬机器路径。只做代表页面试验时记录其范围和原生stage，homepage-direction通过不是全站通过。未完成真实生成/审核不可把CLI自测写成端到端验证。
