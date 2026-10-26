# 设计师快速连接

需要Node 22.19+、Git及私有仓库访问权限。共享经验只连接中央服务，其他设计师不用启动自己的服务。

## 只配置一次

当前共享服务对内网Agent免授权：查询和记录经验不需要Token，也无需分发令牌文件。

```sh
git clone git@github.com:echo-hushunxi/Designer-Automation.git
cd Designer-Automation
npm ci
npm run connect -- --url http://192.168.12.9:4381
```

连接命令会生成被Git忽略的.codex/config.toml和.designer-data/client.json，不添加Authorization请求头，并移除本命令以前生成的令牌配置。无需手写JSON/TOML或设置环境变量。之后在Agent中重新打开项目或重启该MCP连接，让项目配置生效；Codex项目配置需要可信项目。[官方MCP配置说明](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)支持项目级配置和Streamable HTTP。

以上地址用于可路由到192.168.12.9的内网。主机另一个内网地址为192.168.11.228，同一服务也监听http://192.168.11.228:4381/mcp。选择设计师能访问的地址；公网连接需使用管理员实际提供的域名/IP，不因服务在本机启动就宣称已公网可用。

使用其他Agent时可加--client generic，保存工作流连接但不写Codex配置；再在该Agent的MCP设置中填写：

| 字段 | 值 |
| --- | --- |
| 名称 | designer_experience |
| 类型 | Streamable HTTP |
| 地址 | http://192.168.12.9:4381/mcp |
| 认证 | 无／None，不填写Authorization |

## 日常只需对话

在拉取的项目中告诉Agent：

> 先读AGENTS.md和core/maintenance.md，连接designer_experience。只查看共享经验工具是否可用，暂时不要测试任何站点。后续我给站点Git地址后，按审核→调整→给我查看的流程处理，先读取适用经验，并保存我的反馈与已验证的修复经验。

Agent应能看到experience_search、experience_capture。任务开始查询适用经验并固定快照；反馈随时保存为待验证案例，修复后保存带实际证据的经验。正式发布由维护者完成。设计师不必提交/推送Git来同步日常经验。

workbench自动复用connect保存的连接；服务短暂不可达时，反馈保留本地待同步队列，恢复后让Agent执行npm run workbench -- sync。不要编造站点哈希来试写经验；只需列工具和读取已有经验来确认连接。

## 主机管理员

```sh
npm run knowledge:service -- install --auth none
npm run knowledge:service -- status
```

macOS使用当前用户LaunchAgent常驻，登录时启动、异常退出自动重启。其他系统可以通过DA_EXPERIENCE_ALLOW_ANONYMOUS=true及npm run knowledge配合既有进程管理器运行。数据、日志和维护者凭据保存在用户Library/Application Support/Designer-Automation/experience目录，独立于Git工作区。内网免授权只开放查询与记录，发布仍需维护者凭据；无需向设计师分发任何令牌。

免授权根据实际TCP来源地址识别私有IPv4、IPv6及回环地址，不使用客户端提供的X-Forwarded-For。若通过反向代理接入，由网关维持相同内网边界。需要切回原认证模式时使用install --auth token；客户端仍支持--token-file或--auth token配合DA_EXPERIENCE_TOKEN。

暂停服务使用npm run knowledge:service -- stop；停止不会删除经验数据。换机/改IP后重新运行connect即可更新客户端地址。启动服务与MCP连接检查不代表任何站点已通过审核。
