# 独立维护工作流

Node >=22.19，Git和宿主可用的Chromium。首次`npm ci`；通过`SITE_BROWSER_EXECUTABLE`指定真实浏览器路径，不包含浏览器二进制。下列命令从独立工程根运行，JSON由Agent准备。旧生成仍从bin/da.mjs进入；其规则/合同由compatibility/generation-baseline.json固定，原Harness目录未被回写。

## 日常调用

```
node bin/workbench.mjs checkout --id project-a --repo <Git地址> --ref <分支>
node bin/workbench.mjs start --id project-a --repo <同一地址> --ref <同一分支> --config .designer-data/project-a.json
node bin/workbench.mjs status --id project-a
node bin/workbench.mjs repair --id project-a --file .designer-data/edits.json
node bin/workbench.mjs observe --id project-a --file .designer-data/observations.json
node bin/workbench.mjs coverage --id project-a --file .designer-data/coverage.json
node bin/workbench.mjs handoff --id project-a
node bin/workbench.mjs feedback --id project-a --file .designer-data/feedback.json
node bin/workbench.mjs learn --id project-a --file .designer-data/lesson.json
node bin/workbench.mjs sync
```

checkout可先拉取供Agent检查源码，start复用同一checkout，不再clone。省略ref使用仓库默认分支。配置参考templates/maintenance-task.json；构建工程设置artifactRoot为实际输出目录，commands.install/build为argv数组。未绑定的额外HTML路由必须补入pages或给出excludedRoutesReason；不是自动跳过。

edits包含candidate与edits数组，每项为file、expectedHash（当前源码UTF-8字节SHA256）、find、replace。程序要求唯一匹配；新建/删除文件或复杂重构由宿主授权源码工具处理，随后cycle核对完整影响范围，不对冻结输出直接打补丁。

observations包含candidate、observations数组；每项为id、status、actor、observations对象。observations逐个填写对应check.criteria，实际阅读status给出的PNG。自动扫描不填写审美结论。

coverage包含actor、notes、gaps。notes记录真实组件与条款对账；缺少状态/能力时填gaps，不可声明完成。feedback包含candidate、actor、text、decision（revise/approve）及可选checkIds；actor是记录的实际设计师身份，不由程序认证，Agent不得冒充。未给checkIds时全部检查失效。

lesson包含actor、summary、cause、prevention、classification（general/site-preference/hard-failure）。程序从本任务实际反馈与检查记录绑定证据；未复测或未认可的案例保持候选。共享服务保存的是证据声明，不可能仅凭这些字段认证审美或人的真实行为。

每次start/cycle/repair返回lastAudit.executed/reused/visits。无变化且证据有效时无需重新浏览。preview命令复用一个本地进程与地址，并随任务切换到最新候选；stop-preview只停止该任务自己的服务。

默认命令返回摘要、待处理检查和对应证据，不重复输出整轮原始测量。需要原始记录时status --detail full。访问过外部网络的页面检查不能只凭本地文件指纹复用；无外部依赖的证据默认最多复用30分钟，超过后重新采集，避免时效状态长期失真。

## 共享HTTP与MCP

中央服务固定为http://172.18.188.6:4381/mcp。设计师npm run connect即可生成连接配置，内网查询/记录免Token。服务端只使用MongoDB副本集的独立designer_automation库，不再以JSON文件作为中央持久化；客户端的本地反馈、缓存和outbox继续保留。

普通Agent可用experience_search和experience_capture；维护者凭据另提供experience_publish。HTTP接口为GET /health、GET /v1/lessons、POST /v1/cases、维护者POST /v1/publish及GET /v1/admin/snapshot。数据库不可用时/health返回503；启动失败不会回退到文件库。默认拒绝未允许的浏览器Origin，并按TCP来源限制匿名内网访问。

不支持远端HTTP MCP的Agent，可运行node bin/experience-mcp.mjs作为stdio代理；它读取connect生成的客户端配置，连接同一中央HTTP服务，不能另建本机共享库。跨团队隔离应使用独立数据库/凭据或由网关负责，actor字段不是身份认证。

管理员部署、每6小时备份、30天保留、新集合恢复与回滚见[共享经验服务运维](experience-operations.md)。数据只含正文、状态与证据引用，不实现附件存储。直接运行npm run knowledge时必须显式配置DA_EXPERIENCE_MONGO_URI与DA_EXPERIENCE_DATABASE；外部绑定还需DA_EXPERIENCE_ALLOW_ANONYMOUS=true或原Bearer令牌。设计师不需要这些服务端变量。

本版本固定当前任务的规则与经验；新发布的active经验在后续任务选择。修改正式规则时更新对应源、索引和版本，执行npm run manifest；维护者需确认并更新兼容基线，才可有意升级原规则合同。外部原Harness的生成升级另行进行，不由经验发布触发。

## 验证边界

新增测试覆盖Git隔离、陈旧候选/越界修改、浏览器发现及修复布局错误、同次访问支持多项检查、增量复用与共享样式扩验、稳定预览切换、设计师反馈、HTTP/MCP及离线队列。测试中的视觉观察/人工认可为明确标注的合成协议夹具，不能作为真实站点验收或用户认可。默认npm test中的浏览器用例在缺浏览器路径时skip；正式验证必须明确确认没有跳过。

本轮仅验证经验服务、MongoDB并发/持久化及备份恢复。合成案例全部放在隔离测试集合，未执行站点或浏览器测试，也不代表站点验收。
