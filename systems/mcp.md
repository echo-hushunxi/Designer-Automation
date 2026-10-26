# MCP 能力接入

config/mcp.json 是能力分组，非可直接安装的服务器配置。按宿主发现工具、读取schema、确认权限并执行最小只读连接检查；结果可保存 systems/connection-check-YYYY-MM-DD.md（默认私有）。记录时间、工具名、成功/失败、范围，凭据留在宿主密钥管理中。

项目内插件副本只在明确需要且具备来源/权限时添加 .codex/plugins；当前不提供空壳插件或伪连接。review 工具组不能拥有写源码/构建/发布能力。
