# Harness 安装与验证

2026-10-09 已将 site-data 安装到 Harness 自有技能目录，并重新生成 `.dsh-home/.agent-presets/site-v2`。实际 DSH FileSystemSkillProvider 使用预设中的技能目录成功发现并加载 site-data，`modelInvocable` 和 `userInvocable` 均为 true。真实 `site_harness(action="workflow")` 工具返回 `2026-10-09.1` 版协议及 `feishu-coupon-public-api` 数据契约。Web 与 SDK 的新运行共用该预设；既有运行不自动热更新。本次检查时没有运行中的本地 DSH 服务，3082 端口未监听。

新设计和新建复用项目的导入自动读取公共 GET API，冻结响应和证据；已有 preserve 项目及旧冻结数据不改写。构建检查实际 renderer 对 `src/site-data.mjs` 的依赖、快照/证据哈希及内容来源。渲染转换、市场筛选、内容选集和浏览器客户端仍由生成者按技能实现，需正常进行实际页面内容验收。

实际取数测试调用了 lib/site-data.mjs 的安装函数，在 `/private/tmp/site-data-harness-live-aSoTGO` 中写入真实数据和项目技能：100 个首页商家、100 条首页优惠、100 个推荐商家候选、83 个分类、7 篇攻略、18 个节假日。通过渲染依赖/快照校验，临时 renderer 成功读取公共库原始优惠标题。该测试不构成一整站生成或视觉验收。

验证命令与结果：

- Node 22.19：`node --test tests/site-data.test.mjs tests/generation-workflow.test.mjs tests/default-catalogue.test.mjs tests/plugin.test.mjs tests/store.test.mjs`：27 项通过。
- `uv run --offline --with pyyaml python <skill-creator>/scripts/quick_validate.py skills/site-data`：通过。
- `git diff --check`：通过。
- 全量 `node --test tests/*.test.mjs`：111 项中 108 项通过；2 项 Chrome 启动测试和 1 项监听本机端口测试被当前沙箱权限限制。后者在允许本机监听的环境重跑 `tests/imported-sites.test.mjs`，3 项全部通过。2 项浏览器用例未在本次环境完成，不记为通过。

未创建 Git 提交、推送或发起付费模型生成。下一次启动 Harness 或发起新的 SDK 运行会加载更新后的配置。
