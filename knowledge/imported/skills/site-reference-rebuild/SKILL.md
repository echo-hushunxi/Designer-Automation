---
name: site-reference-rebuild
description: 每次根据用户提供的参考站提取布局与风格，用真实 Coupon 数据重建完整站点。
---

# 参考站重建

用户要求模仿、参考或还原网站时使用。先调用 `site_harness(action="engineering")` 读取版本化规则，再以 `mode="reference-rebuild"`、`referenceUrl` 或 `referenceArchivePath`、新 projectId/slug 导入完整 SiteFly 源码。参考不是固定模板，Sunclip 只是案例。复用生成引擎不等于复用它的皮肤。

## HTML ZIP 参考

用户可在 Harness 原生「参考站重建」中选择 HTML ZIP，附件经原生上传进入当前消息。使用该附件提供的实际主机路径传入 `referenceArchivePath`，与 `referenceUrl` 二选一；`origin` 仍是完整 SiteFly 引擎源码，ZIP 只作参考。支持 ZIP32 的 stored/deflate、目录和注释、根目录或子目录 HTML（含 htm）；限制原包 64 MiB、解压 256 MiB、单文件 64 MiB、条目 20000。损坏、加密、ZIP64、路径越界和符号链接会拒绝，不可绕过校验。

导入返回 `referenceRebuild.archive`：原包与解压页面分别保存在 source 内的 archivePath 和 sitePath；archiveHash/siteHash 随项目绑定并在构建时复验，entryPoint 是自动选择的入口，pages 列出可分析页面。不要执行包内安装/构建脚本。用隔离浏览器的 file:// 打开解压页面，不要将不可信 HTML 托管在 Harness 登录同源下。相对资源优先，缺失外链或无法呈现时如实记录，不能声称还原已通过。

ZIP 的 referenceUrl 是 `reference-zip://<原包 SHA256>/`，作为稳定来源标识，不是浏览器地址。capture.url 填该标识加实际 HTML 的 URL 编码相对路径（例如 site/index.html）；另在 browserUrl 字段记录实际打开的 file:// 地址。截图仍必须由真实浏览器产生；分析和 benchmark 使用绑定的逻辑 referenceUrl，审核对照冻结的截图与解压文件。切换参考 ZIP 必须创建新项目。

## 方向与证据

导入会安装 `docs/reference-contract.json` 与 `docs/reference-rebuild.json`。先完成分析，不能用空模板构建。每个 capture 记录 `{id,url,path,sha256,capturedAt,width,height}`；path 是源码内真实 PNG/JPEG/WebP 截图的相对路径，桌面 >=1024px、手机 <=414px 均须有截图。使用真实浏览器观察，不可生成图片伪装参考截图。网址参考的 URL 必须与本次 referenceUrl 同源；ZIP 参考遵守上述逻辑来源规则。截图需覆盖首两屏和主要模块；阻断访问时如实保留缺项，获得用户提供证据后继续。

analysis 八维均写 observed（具体观察）、decision（保留/适配的做法）、reason（理由），包括模块顺序、列宽比例、图像占比、字重层级、卡片结构、间距、手机重排、动效有无。另完成标准 docs/site-design.json 和真实内容 provenance。参考风格优先于新设计的“三个差异”要求，不能为了原创性改掉用户要求还原的布局。可读性、真实数据、详情业务约束仍优先。

## 实现

使用 site-data 公共 API 冻结快照驱动 SSR、搜索、客户端和详情；保留真实 ID、券码、到期日与商家身份。参考图片只按明确可用来源使用，其他视觉重建并记录素材来源，不搬入外站脚本、品牌身份或跟踪代码。

首页、店铺、列表、详情与 About/Disclaimer/Contact/Privacy 都写入 routes（相对 ZIP 站点根目录的 .html 路径）。首页阶段可只实现首页和四个信息页，全站阶段补齐四类业务页。每页保留 `<footer>` 与四个真实信息页链接。不得存在收藏或列表复制。详情代码先掩码，复制核对剪贴板与失败提示，无码跳转和过期禁用遵守原业务协议。

## 验收

先 homepage-direction，作者实看交接，再委派只读独立 site_design_review 完整一轮。审核者必须读取本构建冻结的 referenceRebuild、截图及分析，对照当前目标，不把另一站当作目标。benchmark.references 至少一个 source 与 referenceUrl 完全一致，并列出已看 captureIds；仍保留另一优秀参考用于质量校准。

新增覆盖项 reference-fidelity、footer-pages、get-deal-before-copy、forbidden-ui、motion-safety 必须有实际浏览器证据；没有动画也要实看并记录。首两屏和参考对照在首页阶段执行，复制流程在全站阶段执行。每个版式维度的对照说明包含参考观察、实际观察及必要差异。遵守标准字号、44px 操作区域、320px 与手机/桌面覆盖、键盘、搜索空态、刷新、过期、推荐和真实 ZIP file:// 检查。

集中记录所有问题，统一修复后新构建复验。自动静态检查仅拦截已知结构问题，不能证明视觉一致、没有隐藏收藏功能、复制成功或用户认可。结论区分 automatic / browser / offline / independent / user；未执行记录 not-run。有硬规则失败或 major 问题不得 ready/release。最终验收必须是 full-site。

规则跟随项目冻结；切换参考或修改分析后须重新通过首页方向。不得删除 manifest、改模式或伪造 review 绕过。工程更新不追溯改写旧站、旧包或旧审核。
