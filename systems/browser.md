# 实际浏览器与回归

结构程序使用 Node 内置模块。页面检查可以使用宿主浏览器工具，不强制一个浏览器或自动安装依赖。浏览器适配须能返回实际页面像素、交互、DOM与几何，记录真实候选和视口；截图产生不等于Agent已经看过。

`knowledge/imported/skills/coupon-detail-review/scripts/inspect-detail.mjs` 导出 inspectDetail，可传给 browser.evaluate；映射参数见 detail-standard.md。模块不存在、真实SVG绘制无法确认、未执行状态不得空通过。它不驱动浏览器，不判断美感，不替代真实复制/导航或独立实看。

本包携带 `tests/browser/coupon-detail-inspector.test.mjs` 和 `coupon-topic-inspector.test.mjs`，正反例覆盖裁切、错位、空覆盖和图标真实颜色。若宿主已有 playwright-core：

```sh
SITE_BROWSER_EXECUTABLE=/actual/chromium node --test tests/browser/*.test.mjs
```

依赖在其他目录时设置 `DA_PLAYWRIGHT_MODULE` 为该运行时导出的ES模块绝对路径或file URL。不得复制 node_modules 到分发包，也不得仅为测试静默安装浏览器。没有这两项能力记录浏览器回归 not-run；可用宿主真实浏览器执行等价正反用例并保存证据。默认不猜某台机器的Chrome位置。

真实候选还需页面全景、模块/末卡、短长内容、实际断点两侧、hover/pressed/focus/reduced-motion和状态交互。回归夹具通过不代表真实页面通过。各站的样式和DOM不要求与测试夹具相同。

`bin/inventory.mjs` 导出无宿主依赖的 captureInventory，传入task的project/page/route/modules及将保存的review-1证据路径，在实际候选browser.evaluate执行。返回观察到的模块ID、匹配数/可见数、边界、URL和视口；空选择器或无匹配不会进入观察清单。合并routes到review-1/inventory.json并保留原始输出；reconcile发现缺模块不通过。它不发现所有未标记的新组件，也不证明选择器含义正确，独立角色仍对照实际页面和原始请求，不能用覆盖整页的同一选择器伪装多个不同职责。
