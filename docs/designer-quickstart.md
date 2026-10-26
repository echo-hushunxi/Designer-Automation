# 设计师快速连接

需要Node22.19+、Git及仓库访问权限。首次克隆后安装依赖、连接一次：

```sh
git clone https://github.com/p2100/Designer-Automation-Workbench.git Designer-Automation
cd Designer-Automation
npm ci
npm run connect
```

正式交付仓库为 p2100/Designer-Automation-Workbench，保留完整 Git 历史。项目目录继续叫 Designer-Automation；仓库名带 Workbench 是为了避开 GitHub 同名地址与旧转移操作的阻挡。旧个人地址不再作为新设计师的交付入口。

已有克隆先执行 `git remote set-url origin https://github.com/p2100/Designer-Automation-Workbench.git`，再执行 `git pull --ff-only`、`npm ci`、`npm run connect`，最后重启Agent的designer_experience连接。此次会把旧远程URL配置自动换成本地stdio MCP入口；普通内网使用不需要Token。Codex须在受信任项目中加载项目配置，参见[OpenAI Docs的MCP配置说明](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)；首次打开项目时按Agent正常流程启用项目信任。

## 交给设计师的最短流程

1. 把 [README 的整段接入指令](../README.md#直接交给设计师-agent-的指令) 发给 Agent，由它拉取、安装并生成本机 MCP 配置。
2. Codex 加载项目配置；其他 Agent 导入生成的 `.designer-data/mcp.json` 中 `designer_experience` 一项。重启或重新加载 MCP 连接一次。
3. Agent 实际列出 `experience_search`、`experience_capture`、`experience_manage`、`experience_status`，并做只读查询，报告连接状态；工具可见不等于中央服务可达。
4. 提供要审核的站点 Git 地址和分支，之后只需“审核—调整—查看—继续调整／确认”。

共享经验 MCP 的内网调用免 Token。Git 仓库读取权限、Agent 的项目信任和 MCP 启用属于宿主正常接入过程，不由该免 Token 设置替代。设计师无需 MongoDB 账号，也不需要部署共享服务。

本仓库内置 Coupon 规则；App/Games 专项规则仍独立，不能把 Coupon 验收结果当作 App/Games 已通过。只有预览地址时可审核，自动修改还需要对应源码。

## Agent怎样连接

connect自动生成Codex项目配置；其他Agent运行npm run connect -- --client generic，将生成的.designer-data/mcp.json中的designer_experience配置放入Agent MCP设置。类型选择本地命令／stdio，命令和参数由connect根据当前机器生成，无需手填路径。该入口自动连接中央 http://172.18.188.6:4381/mcp，需要能访问这个内网地址。

```text
设计师的Agent → 项目本地MCP入口 → 中央MCP → MongoDB
                      ↓ 断网保留
                  本地待传记录 → 恢复后自动补传
```

本地入口只处理连接、缓存和可靠补传，不部署数据库。workbench也调用同一个MCP入口。直接填写中央HTTP URL会绕过本机断网保护，因此设计师统一使用connect生成的配置。

## 日常只需审核、调整、确认

可以告诉Agent：

> 先读AGENTS.md和core/maintenance.md，使用designer_experience。接到站点Git地址后，拉取、审核、调整，给我查看；我提问题就继续调整，我明确说没问题后，把已验证的修改归纳为适用经验，绑定我的确认原话和当前版本，自动沉淀并共享生效。断网由MCP自动保留和补传，不让我操作sync或找维护者。

Agent可见experience_search、experience_capture、experience_manage、experience_status。尚未确认的反馈保存为草稿；复验完成、设计师明确确认准确候选后，Agent自动提交带approval的结构化经验，服务在准确来源站点/页面/组件内生效，其他Agent维护同一作用域时即可使用；同原则跨两站确认后再自动推广。无需维护者发布，也不需要日常Git推送。

Agent负责从真实反馈与修改中归纳原因、预防方法和范围，不能伪造设计师认可或推测根因。单站偏好只对该站生效；没有新增修正就不编造经验。workbench的approve反馈由Agent附带有明确条件和检查ID的lessons，或复用同一候选的learn草稿；没有可复用结论就记录skip理由。重复案例合并证据；错误结论通过experience_manage撤回/替换，不增加相互矛盾的规则。设计师只需一次真实确认。完整规范见[经验规则](../core/experience.md)。

## 断网时会怎样

提交先保存在本机，再尝试发送；未成功则返回queued，不能称作“已共享”。后台监督及补传进程自动重试，重试间隔从2秒逐步放宽到最多60秒；有积压才运行，传完退出；补传子进程异常退出会自动重启，坏记录隔离后其他记录继续。关闭Agent后它仍可继续补传；电脑关机时记录留在磁盘，下次启动MCP自动接着传。原有workbench outbox也会自动接管。

服务器确认成功后才移除待传项；相同记录重复发送只保存一份。明确的数据错误保留原文及原因，不无限重试，Agent可通过experience_status查看pending/rejected。断网查询可使用以前读过的缓存，并显示离线来源；缓存按中央服务地址隔离。

已开始的审核任务保留选定经验快照，不因后台补传而自动重跑检查或更换规则。MongoDB备份恢复和主机管理见[运维说明](experience-operations.md)；附件存储不在本项目实现范围。
