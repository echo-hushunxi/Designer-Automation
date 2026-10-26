# 设计师快速连接

需要Node22.19+、Git及私有仓库访问权限。共享经验服务固定在内网服务器，其他设计师无需部署数据库或启动服务。

## 只配置一次

```sh
git clone git@github.com:echo-hushunxi/Designer-Automation.git
cd Designer-Automation
npm ci
npm run connect
```

npm run connect默认读取config/experience-service.json，连接 http://172.18.188.6:4381/mcp。已经拉过项目的设计师执行git pull、npm ci、npm run connect即可更新。内网Agent查询、记录经验无需Token，不填写Authorization。需要能访问172.18.188.6所在内网。

命令生成被Git忽略的.codex/config.toml和.designer-data/client.json，并清理本命令旧配置中的认证头。之后在Agent中重新打开项目或重启该MCP连接。Codex项目配置需信任项目；其他Agent可运行npm run connect -- --client generic，再将下表填入MCP设置。管理员改址时可用npm run connect -- --url http://实际主机:4381覆盖默认值。

| 字段 | 值 |
| --- | --- |
| 名称 | designer_experience |
| 类型 | Streamable HTTP |
| 地址 | http://172.18.188.6:4381/mcp |
| 认证 | 无／None |

## 日常只需对话

告诉Agent：

> 先读AGENTS.md和core/maintenance.md，连接designer_experience。先确认能列工具和读取经验，暂时不要测试站点。后续我给站点Git地址后，按审核→调整→给我查看的流程处理，读取适用经验，并保存我的反馈和验证过的修复经验。

Agent应能看到experience_search、experience_capture。新任务查询适用经验并固定快照；反馈随时保存为待验证案例，修复后记录实际验证与设计师认可，再由维护者发布。设计师日常沉淀无需Git提交或推送。服务端经验保存在统一MongoDB独立库中；JSON仅用于客户端缓存和离线待同步记录。

workbench自动复用连接。服务短暂不可达时保留本地反馈，恢复后让Agent运行npm run workbench -- sync。确认连接只需列工具、查询经验，不向正式库写测试案例。旧本机192.168.12.9/192.168.11.228服务已迁移，不再作为共享入口。

## 管理员

固定主机部署、数据库账号边界、每6小时备份、30天保留及新集合恢复步骤见[共享经验服务运维](experience-operations.md)。设计师无需数据库凭据，也无需维护备份。正式发布和备份管理保留维护者凭据；普通查询/记录继续内网免授权。
