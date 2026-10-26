# 只读取数实测

时间：2026-10-09 15:53（Asia/Shanghai）。服务：`http://new.sp.com/open-api/coupon`。语言：`us`。使用 curl 和 Node.js fetch 发起 GET 请求，无 Cookie、Token 或数据库连接。

| 接口 | HTTP | 实际结果 |
| --- | --- | --- |
| `/home` | 200 | 100 个商家、100 条优惠 |
| `/recommended-stores` | 200 | 100 个候选商家 |
| `/merchants` | 200 | 默认 10 个商家 |
| `/merchants/manomano.co.uk` | 200 | 商家详情及 20 条优惠，SID/Slug 与首页记录一致 |
| `/offers` | 200 | 默认 20 条优惠 |
| `/offers/c_20082` | 200 | 优惠详情及 2 条关联优惠；CID 与首页记录一致；关联优惠同属一个商家且排除自身 |
| `/categories` | 200 | 83 个分类；业务 success=true、code=200 |
| `/all-categories` | 200 | `result.content` 中 83 个分类摘要；业务 success=true、code=200 |
| `/money-saving-tips` | 200 | 7 篇攻略；业务 success=true、code=200 |
| `/events` | 200 | 18 个节假日页面；业务 success=true、code=200 |
| `/search?q=ManoMano+Discount+Codes` | 200 | 1 个匹配商家 |

全部响应成功解析为 JSON。响应结构与实际字段已补充到 coupon-api.md。以上条数和记录仅是本次实测快照，不代表未来接口内容固定，也不证明其他语言或网络环境可达。

原始响应及机器可读报告保存在本次任务的临时目录 `/private/tmp/site-data-live-check/`；临时目录可能被系统清理。本文件保留本次测试摘要。
