# Coupon 公共库取数参考

来源：[新coupon公共库供后续站点使用](https://tanyueco.feishu.cn/wiki/N2exwDwzpiYaV6kXoZvcmW9cnie)，读取日期：2026-10-09。

## 接口

文档说明后端代码位置为 `sp_be/apps/modules/open_api/coupon_router.py`。统一前缀 `/open-api/coupon`，全部为 GET，均支持 `lang` 参数，默认 `us`。默认服务 origin 为 `http://new.sp.com`，由 `platform-identity` 注册信息定位并于 2026-10-09 实测确认：当前网络解析到 `172.18.188.6`，11 个 GET 接口均返回 HTTP 200，无需 Cookie 或 Token。以新任务的实际请求结果判断当前可用性；项目明确配置了更新地址时采用该配置。

快速请求：`curl --fail --silent --show-error --connect-timeout 8 --max-time 20 'http://new.sp.com/open-api/coupon/home?lang=us'`。

| 路径 | 返回内容与使用规则 |
| --- | --- |
| `/home` | 首页 `store`、`coupon` 两个数组，各最多 100 条；优惠来自不同商家。 |
| `/recommended-stores` | 最多 100 个推荐商家候选，前端生成 JSON 时统一取前 50 个。 |
| `/merchants` | 商家信息、分类、`offers` 优惠列表；商家默认 10 个，优惠默认全部。不要把默认响应当作全量库。 |
| `/merchants/{merchant_slug}` | 商家详情、分类、全部优惠及优惠总数。Slug 使用源数据值。 |
| `/offers` | 优惠列表，默认 20 条；`limit` 可调整，最多 200 条。 |
| `/offers/{cid}` | 优惠详情、所属商家，以及同商家除自身外最多 2 条 `relatedOffers`。 |
| `/categories` | 分类完整数据，包括分类信息、商家数量和分类下商家列表。 |
| `/all-categories` | 分类摘要：`cat_id`、`cat_name`、`catslug`、商家数量，无商家明细。 |
| `/money-saving-tips` | 按语言读取 Blog，返回标题、图片、简介、正文等。 |
| `/events` | 按语言返回以页面名为键的假期对象；包含 `holiday_slug`、名称及按 `cids` 关联的最多 15 条优惠；明确的优惠到期日为 `YYYY-MM-DD`。 |
| `/search` | 用 `q` 对当前语言的商家名称做包含匹配；返回 `lang`、`q`、`count` 和最多 50 条商家 `items`。不是全文优惠搜索。 |

先检查实际响应 envelope、字段和空值，再写转换器；文档没有列出的参数或字段不要假定存在。构建整站时需要完整数据，应依据现有导出逻辑或确认过的接口参数取数，并核对返回范围。

## 实测响应结构

2026-10-09 的实际响应并不使用统一 envelope：

- `/home`：顶层 `store` 和 `coupon` 数组。
- `/recommended-stores`、`/merchants`、`/offers`、`/search`：顶层 `items` 数组及数量等元数据。
- 商家详情、优惠详情：顶层 `item` 对象；商家的 `offers`、优惠的 `relatedOffers` 位于 `item` 内。
- `/categories`、`/all-categories`、`/money-saving-tips`、`/events`：`success`、`code`、`result` envelope；先核对业务成功。分类完整数据和 Blog 的 `result` 是数组；分类摘要数组位于 `result.content`；节假日的 `result` 是以页面名为键的对象。

商家字段使用 `merchantName`、`merchantSlug`、`merchantUrl`、`officialUrl`、`sid`、`logo`、`market`、`lang`、`cat_id`、`cat_name`。优惠券字段使用 `cid`、`sid`、`title`、`offerType`、`code`、`discountText`、`expiresAt`、`expiresText`、`validityText`、`externalUrl`、`sourceUrl`、`terms`、`status`、`logo`、`merchant`。`offerType` 实测包括 `sale`、`deal`、`coupon_code`，复制按钮应读取 `code`。

Blog 实测字段包括 `page_name`、`image_name`、`title`、`description`、`introduction`、`recommendations`、`tips`；正文不能固定假定为 `body` 字段。节假日对象包含 `page_name`、`holiday_slug`、`name`、`coupons`。

`lang=us` 的首页商家实测包含 GB、US、CA 市场；语言和市场需要分别处理。完整测试证据见 [live-verification.md](live-verification.md)。

## 业务记录与关系

| 数据 | 文档中的集合 | 主要内容 |
| --- | --- | --- |
| 商家 | `all_store` | SID、Slug、名称、Logo、分类、市场、语言、优惠数量、页面来源、官网、更新时间。 |
| 优惠券 | `all_coupon_offer` | CID、所属商家、标题、类型、优惠码、文案、状态、有效期、跳转链接、来源链接、使用条款。 |
| 分类 | `all_cat` | 分类 ID、Slug、多语言分类名称、更新时间。 |
| 节假日 | `all_event` | Slug、名称、关联 `cids`、更新时间。 |
| Blog | `all_blog` | 标题、描述、简介、创建时间；API 还提供图片及正文等。 |

商家 Logo 更新会同步其优惠券 Logo；优惠券市场、语言及 Logo 继承商家。只有 `coupon_code` 类型必须填写优惠码。新增 CID 由管理面板生成，站点渲染保留原 CID。

## 更新与已有 JSON

文档描述每周数据处理：日期快照经过合并进入长期集合，再补 Logo、分类和节假日关联。建站读取长期数据或公共 API，不把 `store_update_YYYYMMDD`、`coupon_off_update_YYYYMMDD` 当成完整站点数据。

管理面板可将 API 全量数据生成 JSON 上传到接入站点，也支持单次最多 20 个商家的批量上线。数据库删除不会立即移除已上线 JSON，因此旧站点 JSON 可能落后于公共库。使用已有 JSON 时核实生成来源和时间；需要最新内容时重新读取 API。

文档首部连接配置与后续集合说明的数据库名称存在不同表述，skill 不固定数据库连接，也不保存文档中的连接凭据。正常建站走公共 GET API；底层数据库解析留给实际服务配置。
