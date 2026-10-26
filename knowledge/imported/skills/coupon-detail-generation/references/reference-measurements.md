# Couponur指定详情页实测档案

URL: [Couponur Best Buy coupon detail](https://couponur.com/businessDetail/406085.html)。采集于 2026-10-16T10:09:37.198Z。单位均为CSS px，DPR/附件缩放不改变这里的CSS数值。该CID当前为Best Buy无码优惠；有码组合控件来自用户附图意图，未在此无码页面实测，不能编造为参考观察。

完整8视口原始DOM/computed-style/坐标：[reference-measurements.json](captures/reference-measurements.json)，SHA256 `c1181bbebf4a4aff82bf52b79589b3c7c004c228183078999bff39da40155e32`。本技能携带相同目录中的1440/393/320参考截图；全部8张原始截图另存工程证据目录。新绑定连同原始JSON与这3张截图一起冻结，审核用detailStandard的明确路径。记录只证明本次观察，不是Harness正式审核receipt。

## 核心观察与采用值

|对象|参考PC1440|参考手机393|采用标准|
|---|---|---|---|
|页头|1440×50|393×50|50px|
|容器|1180宽；34顶留白|365宽；左右14；15顶留白|本六站max1200；手机14|
|列|820+40gap+288侧栏|单列365|弹性主栏+256–300侧栏；按容量重排|
|主券|820×190|365×263|完整标题；通常160–220/200–320，长内容auto|
|主券标题|22/25.52，700|22/28，700|16–20；PC20，手机18，320为16|
|主商家名|16/21，700|16/21，700|16–20；弱化字重与位置|
|主SHOP NOW|131.39×38；12px|131.39×38；12px|至少44×44；文字≥14|
|推荐券|820×126；84px Logo框|365×141；92px左区、58px图片|84方框起点，手机126–141预算，长内容auto|
|推荐标题|20/27，600|16/20，600且两行预览|16–20；主券全文，预览例外单列授权|
|推荐日期|12/16|参考手机不显示|至少14；不删除真实期限字段|
|相似商家|3列，12gap，252卡高|单列，12gap，112卡高|保留各站比例，商家卡≤200及原合同|
|区块标题到卡组|14|14|12–16起点|
|模块间|34|34|24–34起点|

## 各视口关键几何

|宽度|主容器x/宽|主券宽×高|标题字号/行高|推荐券宽×高|实际列|
|---|---|---|---|---|---|
|1440|130/1180|820×190|22px/25.52px|820×126|820px 288px|
|1200|20/1160|820×190|22px/25.52px|820×126|820px 288px|
|1024|16/992|992×190|22px/25.52px|992×126|992px|
|768|16/736|736×190|22px/25.52px|736×126|736px|
|600|14/572|572×235|22px/28px|572×141|572px|
|393|14/365|365×263|22px/28px|365×141|365px|
|375|14/347|347×263|22px/28px|347×141|347px|
|320|14/292|292×291|22px/28px|292×141|292px|

## 1440px全元素尺寸/字号/间距索引

相同选择器的重复商家项保留首个实例；全部实例及横向坐标仍在原始JSON。不固定内容长度造成的高度。

|DOM标识|宽×高|font px/line-height/weight|padding|margin|gap|border/radius|
|---|---|---|---|---|---|---|
|header|1440×50|16px/normal/400|0px 14px|0px|normal|0px none rgb(0, 0, 0) / 0px|
|div.header|1200×50|16px/normal/400|0px|0px|28px|0px none rgb(0, 0, 0) / 0px|
|a.logo|146×30|16px/normal/400|0px|0px|normal|0px none rgb(0, 0, 238) / 0px|
|img.site-logo|146×30|16px/normal/400|0px|0px|normal|0px none rgb(0, 0, 238) / 0px|
|div.toLink|137.75×44|16px/normal/400|0px|0px|normal|0px none rgb(0, 0, 0) / 0px|
|a|137.75×44|12px/18px/700|0px|0px|normal|0px none rgb(19, 33, 63) / 0px|
|div.search-page-search-input.search-page-search-input-header|260×38|16px/normal/400|3px 4px 3px 14px|0px|normal|1px solid rgb(227, 231, 239) / 8px|
|button.search-page-search-input-button|32×32|13.3333px/normal/400|0px|0px|normal|0px none rgb(0, 0, 0) / 7px|
|img.search-page-search-input-icon|17×17|13.3333px/normal/400|0px|0px|normal|0px none rgb(0, 0, 0) / 0px|
|input.search-page-search-input-value|208×30|12px/18px/400|0px 10px 0px 0px|0px|normal|0px none rgb(19, 33, 63) / 0px|
|main.page-content|1440×1705.19|16px/normal/400|0px|0px|normal|0px none rgb(16, 29, 61) / 0px|
|div.container|1440×1705.19|16px/normal/400|0px|0px|normal|0px none rgb(16, 29, 61) / 0px|
|div.business-detail-content-shell|1180×1705.19|16px/normal/400|34px 0px 46px|0px|normal|0px none rgb(16, 29, 61) / 0px|
|div.business-detail-content-inner|1180×1625.19|16px/normal/400|0px 0px 72px|0px|40px|0px none rgb(16, 29, 61) / 0px|
|div.main-content|820×1553.19|16px/normal/400|0px|0px|normal|0px none rgb(16, 29, 61) / 0px|
|div.business-detail-head-section|820×190|16px/normal/400|0px|0px 0px 30px|normal|1px solid rgb(225, 229, 235) / 14px|
|div.main-content-head|818×188|16px/normal/400|0px|0px|24px|0px none rgb(16, 29, 61) / 12px|
|div.main-content-head-inner|818×188|16px/normal/400|0px|0px|0px|0px none rgb(16, 29, 61) / 0px|
|div.main-content-head-brand|200×188|16px/normal/400|20px 14px|0px|normal| / 0px|
|div.lazy-box.main-content-head-logo|72×72|16px/normal/400|6px|0px|normal|1px solid rgb(227, 230, 235) / 10px|
|img|58×58|16px/normal/400|0px|0px|normal|0px none rgb(16, 29, 61) / 0px|
|div.main-content-head-brand-name|70.67×21|16px/21px/700|0px|10px 0px 0px|normal|0px none rgb(32, 33, 36) / 0px|
|div.main-content-head-brand-badge|54.33×18|12px/18px/500|0px|4px 0px 0px|normal|0px none rgb(116, 123, 136) / 0px|
|div.main-content-head-content.main-content-head-content--no-code|618×188|16px/normal/400|22px 26px|0px|0px 28px|0px none rgb(16, 29, 61) / 0px|
|div.main-content-head-title|566×25.52|22px/25.52px/700|0px|0px|normal|0px none rgb(48, 51, 58) / 0px|
|div.main-content-head-tip|120.58×17|12px/17px/500|0px|7px 0px 10px|normal|0px none rgb(104, 115, 139) / 999px|
|a.main-content-head-button.shop-now-btn|131.39×38|12px/12px/800|0px 13px 0px 16px|15px 0px 0px|9px|0px none rgb(255, 255, 255) / 8px|
|span.shop-now-btn__label|67.39×12|12px/12px/800|0px|0px|normal|0px none rgb(255, 255, 255) / 0px|
|div.main-content-list-title|820×28.59|22px/28.6px/500|0px|34px 0px 14px|normal|0px none rgb(32, 33, 36) / 0px|
|div.main-content-deal-list|820×126|16px/normal/400|0px|0px|14px|0px none rgb(16, 29, 61) / 0px|
|a.main-content-deal-list-item.deal-card--offer|820×126|16px/normal/400|18px 18px 18px 16px|0px|0px 18px|0px none rgb(16, 29, 61) / 18px|
|div.main-content-deal-list-item-brand|84×84|16px/normal/400|0px|0px|normal|1px solid rgb(231, 233, 237) / 11px|
|div.lazy-box.main-content-deal-list-item-cover.is-square-image|84×84|16px/normal/400|0px|0px|normal|1px solid rgb(216, 221, 230) / 16px|
|div.main-content-deal-list-item-info|506×114|16px/normal/400|0px 4px 0px 22px|0px|8px|0px none rgb(16, 29, 61) / 0px|
|div.main-content-deal-list-item-info-title|81.36×28|12px/28px/500|0px 10px|0px|normal|0px none rgb(85, 85, 85) / 5px|
|div.main-content-deal-list-item-info-desc|480×54|20px/27px/600|0px|0px|normal|0px none rgb(18, 20, 24) / 0px|
|div.main-content-deal-list-item-info-expires|71.42×16|12px/16px/500|0px|0px|5px|0px none rgb(104, 115, 139) / 0px|
|div.main-content-deal-list-item-action|160×52|16px/normal/400|0px|0px|0px|0px none rgb(16, 29, 61) / 0px|
|button.main-content-deal-list-item-action-button.deal-cta|164×44|12px/18.858px/800|0px|0px|normal|0px none rgb(255, 255, 255) / 999px|
|span.deal-cta__label|120×44|16px/16px/700|0px 2px 1px 8px|0px|normal|0px none rgb(255, 255, 255) / 0px|
|span.deal-cta__sign|44×44|0px/0px/700|0px|0px|normal| / 0px|
|div.main-content-similar-list|820×1044|16px/normal/400|0px|0px 0px 40px|12px|0px none rgb(16, 29, 61) / 0px|
|a.main-content-deal-list-item|265.33×252|16px/normal/400|18px 16px 14px|0px|0px|1px solid rgb(232, 235, 239) / 18px|
|div.similar-store-card__top|231.33×170|16px/normal/400|18px 16px 16px|0px|12px|0px none rgb(16, 29, 61) / 0px|
|div.similar-store-card__foot|231.33×48|16px/normal/400|0px 52px 0px 18px|0px|normal|1px solid rgba(255, 47, 63, 0.45) / 10px|
|div.side-content|288×1499.19|16px/normal/400|0px 0px 0px 22px|0px|normal|0px none rgb(16, 29, 61) / 0px|
|div.side-content-title|266×28.59|22px/28.6px/500|0px|0px 0px 12px|normal|0px none rgb(32, 33, 36) / 0px|
|div.side-content-feature-list|266×628|16px/normal/400|4px 0px|0px 0px 38px|4px|0px none rgb(16, 29, 61) / 0px|
|a.side-content-feature-list-item|266×48|16px/normal/400|4px 42px 4px 2px|0px|10px|0px none rgb(0, 0, 238) / 0px|
|div.side-content-feature-list-item-logo|30×30|16px/0px/400|0px|0px|normal|0px none rgb(0, 0, 238) / 10px|
|img.side-content-feature-list-item-icon|30×30|16px/0px/400|0px|0px|normal|0px none rgb(0, 0, 238) / 0px|
|div.side-content-feature-list-item-title|174×20|14px/20px/500|0px 4px 0px 0px|0px|normal|0px none rgb(32, 33, 36) / 0px|
|div.side-content-title.side-content-title--with-link|266×28.59|22px/28.6px/500|0px|26px 0px 12px|10px|0px none rgb(32, 33, 36) / 0px|
|span|155.97×28.59|22px/28.6px/500|0px|0px|normal|0px none rgb(32, 33, 36) / 0px|
|div.side-content-popular-list|266×718|16px/normal/400|0px|0px 0px 34px|14px 8px|0px none rgb(16, 29, 61) / 0px|
|a.side-content-popular-list-item|83.33×108|16px/0px/400|0px|0px|4px 7px|0px none rgb(16, 29, 61) / 0px|
|div.lazy-box.side-content-popular-list-item-logo-mobile|72×72|16px/0px/400|0px|0px|normal|0px none rgb(16, 29, 61) / 10px|
|span.side-content-popular-list-item-name|83.33×28|14px/14px/500|0px|0px|normal|0px none rgb(32, 33, 36) / 0px|
|div.site-loading-placeholder.site-loading-placeholder--medium|72×72|16px/0px/400|0px|0px|normal|0px none rgb(16, 29, 61) / 10px|
|div.spinner|34×34|16px/0px/400|0px|0px|normal|0px solid rgba(0, 0, 0, 0) / 50%|
|div.loader.l1|34×34|16px/0px/400|0px|0px|normal|0px none rgb(16, 29, 61) / 0px|
|div.loader.l2|34×34|16px/0px/400|0px|0px|normal|0px none rgb(16, 29, 61) / 0px|
|footer|1440×232|16px/normal/400|0px|0px|normal|0px none rgb(255, 255, 255) / 0px|
|div.footer-box|1180×232|16px/normal/400|40px 0px 32px|0px 130px|0px 28px|0px none rgb(255, 255, 255) / 0px|
|div.left|1180×23.8|14px/23.8px/400|0px|0px|normal|0px none rgba(255, 255, 255, 0.62) / 0px|
|div.line|1180×1|16px/normal/400|0px|22px 0px 18px|normal|0px none rgb(255, 255, 255) / 0px|
|div.right|932×64|16px/normal/400|0px|0px|12px|0px none rgb(255, 255, 255) / 0px|
|img.about-About.Us|36×36|16px/normal/400|8px|0px 10px 0px 0px|normal|0px none rgba(255, 255, 255, 0.88) / 10px|
|img.about-Disclaimer|36×36|16px/normal/400|8px|0px 10px 0px 0px|normal|0px none rgba(255, 255, 255, 0.88) / 10px|
|img.about-Contact.us|36×36|16px/normal/400|8px|0px 10px 0px 0px|normal|0px none rgba(255, 255, 255, 0.88) / 10px|
|img.about-Privacy.Policy|36×36|16px/normal/400|8px|0px 10px 0px 0px|normal|0px none rgba(255, 255, 255, 0.88) / 10px|

## 393px全元素尺寸/字号/间距索引

相同选择器的重复商家项保留首个实例；全部实例及横向坐标仍在原始JSON。不固定内容长度造成的高度。

|DOM标识|宽×高|font px/line-height/weight|padding|margin|gap|border/radius|
|---|---|---|---|---|---|---|
|header|393×50|16px/normal/400|0px 14px|0px|normal|0px none rgb(0, 0, 0) / 0px|
|div.ipadHeader|365×50|16px/normal/400|0px|0px|normal|0px none rgb(0, 0, 0) / 0px|
|a.cat|44×44|16px/normal/400|0px|0px|normal|0px none rgb(0, 0, 238) / 8px|
|img.catBut|22×22|16px/normal/400|0px|0px|normal|0px none rgb(0, 0, 238) / 0px|
|a.logo|124×28|16px/normal/400|0px|0px|normal|0px none rgb(0, 0, 238) / 0px|
|img.site-logo|124×28|16px/normal/400|0px|0px|normal|0px none rgb(0, 0, 238) / 0px|
|a.search|44×44|16px/normal/400|0px|0px|normal|0px none rgb(0, 0, 238) / 8px|
|img|20×20|16px/normal/400|0px|0px|normal|0px none rgb(0, 0, 238) / 0px|
|main.page-content|393×3659.38|16px/normal/400|0px 14px|0px|normal|0px none rgb(16, 29, 61) / 0px|
|div.container|365×3659.38|16px/normal/400|0px|0px|normal|0px none rgb(16, 29, 61) / 0px|
|div.business-detail-content-shell|365×3659.38|16px/normal/400|15px 0px 30px|0px|normal|0px none rgb(16, 29, 61) / 0px|
|div.business-detail-content-inner|365×3614.38|16px/normal/400|0px 0px 72px|0px|38px|0px none rgb(16, 29, 61) / 0px|
|div.main-content|365×1864.19|16px/normal/400|0px|0px|normal|0px none rgb(16, 29, 61) / 0px|
|div.business-detail-head-section|365×263|16px/normal/400|0px|0px 0px 22px|normal|1px solid rgb(225, 229, 235) / 14px|
|div.main-content-head|363×261|16px/normal/400|0px|0px|24px|0px none rgb(16, 29, 61) / 10px|
|div.main-content-head-inner|363×261|16px/normal/400|0px|0px|0px|0px none rgb(16, 29, 61) / 0px|
|div.main-content-head-brand|363×89|16px/normal/400|14px|0px|2px 12px| / 0px|
|div.lazy-box.main-content-head-logo|60×60|16px/normal/400|6px|0px|normal|1px solid rgb(227, 230, 235) / 10px|
|div.main-content-head-brand-name|69.06×21|16px/21px/700|0px|0px|normal|0px none rgb(32, 33, 36) / 0px|
|div.main-content-head-brand-badge|54.33×18|12px/18px/500|0px|0px|normal|0px none rgb(116, 123, 136) / 0px|
|div.main-content-head-content.main-content-head-content--no-code|363×172|16px/normal/400|18px 14px|0px|0px 18px|0px none rgb(16, 29, 61) / 0px|
|div.main-content-head-title|335×56|22px/28px/700|0px|0px|normal|0px none rgb(32, 33, 36) / 0px|
|div.main-content-head-tip|120.58×17|12px/17px/500|0px|10px 0px 0px|normal|0px none rgb(104, 115, 139) / 999px|
|a.main-content-head-button.shop-now-btn|131.39×38|12px/12px/800|0px 13px 0px 16px|15px 0px 0px|9px|0px none rgb(255, 255, 255) / 8px|
|span.shop-now-btn__label|67.39×12|12px/12px/800|0px|0px|normal|0px none rgb(255, 255, 255) / 0px|
|div.ads.gam-ad|365×17|16px/normal/400|0px|0px 0px 20px|normal|0px none rgb(16, 29, 61) / 0px|
|div.ads_placeholder|79.69×17|12px/normal/400|0px|0px|normal|0px none rgb(215, 215, 215) / 0px|
|div#gam-slot-inpage-1.gam-ad-slot.adsHeight|365×0|16px/normal/400|0px|0px|normal|0px none rgb(16, 29, 61) / 0px|
|div#google_ads_iframe_/22814497764/couponur/23368354558_0__container__|182.5×0|16px/normal/400|0px|0px|normal|0px none rgb(16, 29, 61) / 0px|
|div#google_ads_iframe_/22814497764/couponur/23368354207_0__container__|182.5×0|16px/normal/400|0px|0px|normal|0px none rgb(16, 29, 61) / 0px|
|div.main-content-list-title|365×28.59|22px/28.6px/500|0px|34px 0px 14px|normal|0px none rgb(32, 33, 36) / 0px|
|div.main-content-deal-list|365×141|16px/normal/400|0px|0px|14px|0px none rgb(16, 29, 61) / 0px|
|a.main-content-deal-list-item.deal-card--offer|365×141|16px/normal/400|0px|0px|0px|0px none rgb(16, 29, 61) / 14px|
|div.main-content-deal-list-item-brand|92×141|16px/normal/400|0px 16px|0px|normal| / 0px|
|div.lazy-box.main-content-deal-list-item-cover.is-square-image|60×60|16px/normal/400|0px|0px|normal|1px solid rgb(216, 221, 230) / 10px|
|div.main-content-deal-list-item-info|273×87|15px/normal/400|14px 12px 2px|0px|7px|0px none rgb(16, 29, 61) / 0px|
|div.main-content-deal-list-item-info-title|79.36×24|12px/24px/500|0px 9px|0px|normal|0px none rgb(85, 85, 85) / 5px|
|div.main-content-deal-list-item-info-desc|249×40|16px/20px/600|0px|0px|normal|0px none rgb(23, 25, 29) / 0px|
|div.main-content-deal-list-item-action|273×54|16px/normal/400|2px 12px 10px|0px|0px|0px none rgb(16, 29, 61) / 0px|
|button.main-content-deal-list-item-action-button.deal-cta|154×42|12px/18.858px/800|0px|0px|normal|0px none rgb(255, 255, 255) / 999px|
|span.deal-cta__label|112×42|16px/16px/700|0px 2px 1px 8px|0px|normal|0px none rgb(255, 255, 255) / 0px|
|span.deal-cta__sign|42×42|0px/0px/800|0px|0px|normal| / 0px|
|div.main-content-similar-list|365×1228|16px/normal/400|0px|0px 0px 40px|12px|0px none rgb(16, 29, 61) / 0px|
|a.main-content-deal-list-item|365×112|16px/normal/400|12px 58px 12px 12px|0px|0px 14px|1px solid rgb(229, 232, 237) / 16px|
|div.similar-store-card__foot|199×26|16px/normal/400|2px 0px 0px|0px|normal|0px none rgb(255, 47, 63) / 0px|
|div.lazy-box.main-content-deal-list-item-cover|80×80|16px/normal/400|0px|0px|normal|1px solid rgb(229, 232, 237) / 14px|
|div.site-loading-placeholder.site-loading-placeholder--medium|78×78|16px/normal/400|0px|0px|normal|0px none rgb(16, 29, 61) / 0px|
|div.spinner|34×34|16px/normal/400|0px|0px|normal|0px solid rgba(0, 0, 0, 0) / 50%|
|div.loader.l1|34×34|16px/normal/400|0px|0px|normal|0px none rgb(16, 29, 61) / 0px|
|div.loader.l2|34×34|16px/normal/400|0px|0px|normal|0px none rgb(16, 29, 61) / 0px|
|div.side-content|365×1640.19|16px/normal/400|28px 0px 0px|0px|normal| / 0px|
|div.side-content-title|365×28.59|22px/28.6px/500|0px|0px 0px 12px|normal|0px none rgb(32, 33, 36) / 0px|
|div.side-content-feature-list|365×628|16px/normal/400|4px 0px|0px 0px 38px|4px|0px none rgb(16, 29, 61) / 0px|
|a.side-content-feature-list-item|365×48|16px/normal/400|4px 42px 4px 2px|0px|10px|0px none rgb(0, 0, 238) / 0px|
|div.side-content-feature-list-item-logo|30×30|16px/0px/400|0px|0px|normal|0px none rgb(0, 0, 238) / 10px|
|img.side-content-feature-list-item-icon|30×30|16px/0px/400|0px|0px|normal|0px none rgb(0, 0, 238) / 0px|
|div.side-content-feature-list-item-title|273×20|14px/20px/500|0px 4px 0px 0px|0px|normal|0px none rgb(32, 33, 36) / 0px|
|div.side-content-title.side-content-title--with-link|365×28.59|22px/28.6px/500|0px|26px 0px 12px|10px|0px none rgb(32, 33, 36) / 0px|
|span|155.97×28.59|22px/28.6px/500|0px|0px|normal|0px none rgb(32, 33, 36) / 0px|
|div.side-content-popular-list|365×830|16px/normal/400|0px|0px 0px 34px|14px 8px|0px none rgb(16, 29, 61) / 0px|
|a.side-content-popular-list-item|116.33×122|16px/0px/400|0px|0px|6px 7px|0px none rgb(16, 29, 61) / 0px|
|div.lazy-box.side-content-popular-list-item-logo-mobile|96×96|16px/0px/400|0px|0px|normal|0px none rgb(16, 29, 61) / 14px|
|span.side-content-popular-list-item-name|116.33×20|14px/17px/500|0px 2px|0px|normal|0px none rgb(32, 34, 38) / 0px|
|footer|393×344.59|16px/normal/400|0px|0px|normal|0px none rgb(255, 255, 255) / 0px|
|div.footer-box|361×344.59|16px/normal/400|38px 0px 30px|0px 16px|0px 24px|0px none rgb(255, 255, 255) / 0px|
|div.info|361×202.59|16px/normal/400|0px|0px|normal|0px none rgb(255, 255, 255) / 0px|
|div.left|361×39.59|12px/19.8px/400|0px|0px|normal|0px none rgba(255, 255, 255, 0.62) / 0px|
|div.line|361×1|16px/normal/400|0px|20px 0px 16px|normal|0px none rgb(255, 255, 255) / 0px|
|div.right|361×126|16px/normal/400|0px|0px|10px|0px none rgb(255, 255, 255) / 0px|
|a|175.5×58|16px/normal/400|9px 10px|0px|normal|1px solid rgba(255, 255, 255, 0.12) / 10px|
|img.about-About.Us|32×32|16px/normal/400|7px|0px 8px 0px 0px|normal|0px none rgba(255, 255, 255, 0.88) / 8px|
|img.about-Disclaimer|32×32|16px/normal/400|7px|0px 8px 0px 0px|normal|0px none rgba(255, 255, 255, 0.88) / 8px|
|img.about-Contact.us|32×32|16px/normal/400|7px|0px 8px 0px 0px|normal|0px none rgba(255, 255, 255, 0.88) / 8px|
|img.about-Privacy.Policy|32×32|16px/normal/400|7px|0px 8px 0px 0px|normal|0px none rgba(255, 255, 255, 0.88) / 8px|

## 不能照搬的观察

参考12px标签/日期、38px主动作、22px主券标题、裁切预览、缺省Logo/Featured统计不能覆盖现有真实数据、可读性和点击规范。1024/768的侧栏在本次截图不可见，采用规则仍需保留所需模块并稳定重排；不以参考隐藏模块为删减授权。代码控件尺寸采用用户附图结构+44px底线，不是假称从无码参考读得。
