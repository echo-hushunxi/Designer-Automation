# 知识匹配与启用

共享索引 knowledge/index.json 含稳定 id、status、pages、path、source 和版本。active 只表示已经进入现行规则，不代表每次生成都会自动合格。candidate 只能作为待核实材料，draft/retired 不自动启用。

匹配顺序：确定页面 → 共同业务/质量 → 页面专项 → 请求明确选择的 profile → 可选个人方法。模式、角色、validFrom/validUntil 同时匹配才生效；不能按关键词把详情尺寸套到首页。store-detail 采用共享卡片规则与已确认的主推荐商家／主题数量，身份区和券列表按店铺职责设计，不套单券领取页骨架。

--local true 才读取 config/knowledge.local.json。私有条目必须位于 knowledge/local，使用唯一 id、明确页面与状态；不能覆盖共享 id。没有适用范围、来源、日期或验证的旧经验先注册 candidate，不自动晋升。知识去重和冲突应在生成前解决并记录，不能由个人方法豁免硬规则。

更新流程：保存原始参考和实际事实 → 分清 observation / required / target / exception → 写适用范围及来源 → 制作代表样本并独立验证 → 有依据后启用。详情19.1里的“本轮六站”预算保留原范围；当前用户确认的四参考处理方法另行允许有完整详情目的地的摘要卡按容量省略。新任务使用匹配的现行明确授权，不从旧截图自行推定例外；历史冻结包仍按其原契约。

容量／分类／稳定性只在global-layout-baseline维护，详情区域职责在detail-layout-methods维护，检查器参数在各自执行规范维护。新增纠正修改所属条款，移除冲突旧句及重复日期补丁；入口只链接，回归测试与导出同步更新。

已有规范在 knowledge/imported 只读：编辑上游 skills 后运行导出程序；逐文件哈希用于发现漏同步。新页面规则维护在 knowledge/pages，明确缺口；不得只创建空 SKILL 即宣称页面已支持。运行中的冻结包不热更新。
