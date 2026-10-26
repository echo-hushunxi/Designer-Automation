# 共享经验服务运维

## 当前部署与边界

MCP地址为 http://172.18.188.6:4381/mcp，固定Linux内网主机，复用现有PM2及其系统启动服务。HTTP与MCP共用MongoDB存储，复用现有带认证的rs0副本集，独立数据库designer_automation、集合cases，专用数据库账号只有该库readWrite权限。数据库连接保存在服务器私有配置中，不进入Git、日志或设计师配置。现有Mongo副本集成员使用既有网络地址；此次没有把数据库迁入新的纯内网副本集，也没有修改其网络拓扑或业务库。

本次仅存经验正文、作用域、候选/发布状态、版本、反馈及证据引用；不接入截图、附件、图片上传或对象存储。客户端JSON仅用于本地记录、缓存和待同步队列。服务启动强制连接MongoDB，连接失败不会切回JSON。读取使用primary，写入要求majority和journal确认；MongoDB单文档原子操作与预期revision避免并发覆盖。正式规则和原Harness生成入口保持原合同，经验发布不会修改它们。

普通内网Agent无需Token即可experience_search/experience_capture；正式发布和管理员快照需要独立维护者凭据。IP限制依据TCP实际来源，不信任X-Forwarded-For。actor是反馈记录声明，不是认证身份。数据库认证与MCP内网免授权分别配置。

## 文件与进程

- 程序：/data/frontend/designer-automation/current，指向独立版本目录；不覆盖现有业务工程。
- 私有配置：/home/liusili/.config/designer-automation/service.json，权限600；目录700。
- 备份：/data/frontend/designer-automation-data/backups，目录700，归档600。
- 定时任务日志：/data/frontend/designer-automation-data/backup.log。
- PM2进程：designer-automation-experience。仅操作这个进程；不要执行pm2 restart all。

新主机需先准备Node22.19+、PM2开机恢复及crond。将deploy/experience.config.example.json复制到私有配置位置，由管理员填写已有副本集地址和该库专用账号。不要给设计师分发数据库连接。安装命令保留原crontab，只替换带Designer-Automation标记的备份项：

```sh
cd /data/frontend/designer-automation/current
npm ci --omit=dev --ignore-scripts
node scripts/install-experience-linux.mjs /home/liusili/.config/designer-automation/service.json
```

固定主机已有PM2系统启动服务；安装程序仅追加本进程、保存PM2清单及安装用户备份定时项，不修改其他服务。运行install脚本的Node路径同时用于PM2解释器和定时备份，避免依赖交互shell的nvm。

## 备份与检查

crond按服务器时区每6小时执行一次。备份通过本机维护者快照接口读取MongoDB的snapshot事务，得到包含全部候选和已发布经验的同一时点数据，正常查询/记录无需停机。[MongoDB快照读说明](https://www.mongodb.com/docs/manual/reference/read-concern-snapshot/)是该实现依赖的副本集能力；服务拒绝使用不支持该恢复保证的单机MongoDB。归档为带schema版本、条数和SHA256的JSON gzip，是备份格式，在线读写始终使用数据库。

文件先写临时路径并fsync，再原子改名并核验；只有新备份核验成功才删除本工具30天前的归档，不处理其他文件。备份在服务服务器上，与现有Mongo副本集分开；它不是另一套自动异地容灾系统。默认最大损失窗口约6小时，实际取决于最后成功备份时间。

```sh
node scripts/experience-admin.mjs backup --config /home/liusili/.config/designer-automation/service.json
node scripts/experience-admin.mjs status --config /home/liusili/.config/designer-automation/service.json
node scripts/experience-admin.mjs verify --config /home/liusili/.config/designer-automation/service.json --input /实际备份路径.json.gz
```

status核验最新归档并显示ageHours；超过8小时返回非零退出码。该检查不代表已接入告警平台，需管理员查看backup.log和status。备份不包含数据库密码、维护者凭据或附件；灾难恢复时需从独立凭据管理恢复连接配置。

## 恢复与回滚

先verify，再恢复到新的restore_集合，禁止覆盖在线集合，也不允许复用已存在的恢复集合。恢复完成逐条身份/状态校验、对比条数和内容SHA256，保留原集合。

```sh
node scripts/experience-admin.mjs restore --config /home/liusili/.config/designer-automation/service.json --input /实际备份路径.json.gz --target restore_20261026_01
```

需要正式切换时，先暂停本服务写入：pm2 stop designer-automation-experience。在私有service.json中将mongo.collection改为已核验的restore_20261026_01，按需更新发布者配置，然后pm2 restart designer-automation-experience。检查/health和真实MCP查询后恢复使用。回滚只需停止本服务、将mongo.collection改回cases并重启；原集合不删除。不要同时运行指向不同集合的写服务。恢复到备份会丢失该快照之后的写入；切换前可另做当前快照，保留新增记录供人工合并。

合成恢复演练使用独立test_/restore_test_集合，完成后只删除本次创建的演练集合。它不是站点测试，也不作为设计师认可的经验。

## 旧JSON迁移

停止旧服务后保留原store.json副本。输入是旧版{version:1,revision,cases}完整状态；全量校验后备份，再按原id、生命周期、revision和发布时间写入MongoDB。已有相同记录跳过，有内容冲突则报错，不覆盖既有记录。迁移应在新共享服务开放写入前完成；重复执行安全。

```sh
node scripts/experience-admin.mjs import-json --config /home/liusili/.config/designer-automation/service.json --input /旧store.json副本
```

旧文件不存在时按空库建立迁移备份；不能据此补造历史经验。迁移后停用旧本机写服务，所有设计师重新运行npm run connect并重启其MCP连接。

## 验证范围

npm run test:experience只运行经验服务测试。设置DA_EXPERIENCE_TEST_CONFIG为私有服务器配置路径时，另运行MongoDB隔离集合的并发、持久化、MCP及备份恢复集成测试；未设置则明确skip这部分。不要使用npm test代替本轮验证，它还包含站点浏览器用例。本轮不执行站点测试。
