# teamCheckoutLink

[简体中文](README.md) | [English](README.en.md)

一个无需服务器的浏览器扩展。访问支持的官网页面时，它会显示可拖动的悬浮面板，使用当前登录会话或用户手动提供的 Session access token 提交团队结账参数，并显示官方托管结账链接。

## 支持的浏览器

- Google Chrome
- Microsoft Edge
- Brave
- Opera
- Firefox 109+

Chrome、Edge、Brave 和 Opera 使用 `manifest.json`。Firefox 打包时使用 `manifest.firefox.json` 替换 `manifest.json`。

运行 `build.ps1` 后会分别生成 `dist\chromium`、`dist\edge` 和 `dist\firefox`，其中 Edge 包与 Chromium 包使用相同的扩展标准，但单独命名便于安装和分发。

Safari 的 WebExtension 需要使用 Xcode 转换、签名和安装，本项目当前不提供 Safari 安装包。

## Chromium 浏览器安装

1. 打开扩展管理页：
   - Chrome：`chrome://extensions`
   - Edge：`edge://extensions`
   - Brave：`brave://extensions`
   - Opera：`opera://extensions`
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择本项目目录 `D:\teamCheckoutLink`。

Edge 也可以直接选择打包后的 `D:\teamCheckoutLink\dist\edge` 目录；ZIP 文件为 `dist\teamCheckoutLink-edge.zip`。

## Firefox 临时安装

1. 运行 `build.ps1` 生成 Firefox 包目录。
2. 打开 `about:debugging#/runtime/this-firefox`。
3. 点击“临时载入附加组件”。
4. 选择 `dist\firefox\manifest.json`。

Firefox 的临时扩展在浏览器重启后会被移除。长期安装需要签名或企业策略部署。

## 使用

1. 打开 `https://chatgpt.com/`。通常可直接登录自己的账号；不想在当前浏览器登录时，也可以使用默认关闭的“手动 Session 模式”。
2. 页面右侧会自动显示悬浮工具；拖动顶部可移动位置，点击 `−` 可收起，点击 `×` 可关闭。点击标题栏的 GitHub 图标可打开项目仓库。位置、收起和关闭状态都会保存。
3. 关闭后不会在刷新时反复弹出；如需恢复，点击浏览器工具栏中的扩展图标，再点击“显示悬浮工具”。
4. 填写工作区、席位、周期、国家和优惠码；点击国家框会展开列表，输入中文、英文或两位代码可搜索，货币会自动匹配且不可手动修改。国家选择下方显示官方 Business 优惠前价格，并根据席位数和付款周期更新；年付显示折合月价及年度合计。
5. 点击“各地区 2 席优惠参考”会在悬浮工具左侧展开同高的参考栏，拖动主面板时会一起移动，右侧页面仍可操作。价格按折合人民币由低到高排列；首次打开时读取官网地区价格配置和最新汇率，之后使用当前页面内存缓存，需要更新时点击“刷新价格”。点击参考表中的地区可切换国家。
6. 优惠码和手动 Session 输入框均可使用“粘贴”按钮读取剪贴板，也可以直接键盘粘贴。
7. 如需手动 Session，开启对应开关。点击“打开获取页”，或复制 `https://chatgpt.com/api/auth/session` 后在已登录目标账号的浏览器中打开，再粘贴页面返回的完整 JSON 或其中的 `accessToken`。普通 Session Cookie 不能替代 Bearer access token，请勿把 Session 发送给他人。
8. 点击“生成链接”，成功后复制或打开结账页。

## 免责声明

teamCheckoutLink 是开源交流学习项目，供合法学习和个人使用。使用者须遵守目标网站的服务条款及适用法律；不得将本项目用于欺诈、规避服务限制或风控、未经授权访问，或其他违法用途。本项目不是目标网站或支付服务提供方的官方产品，与其无隶属或背书关系。使用者应自行确认资格、价格和结账条款，并对自己的使用行为负责。

## 隐私与限制

- 自动读取或手动粘贴的 `accessToken` 只保留在当前网页内存中，不会发送给扩展弹窗，也不会写入扩展存储。关闭手动模式或悬浮面板会清除手动输入。
- 扩展只保存工作区、席位、地区、货币和优惠码等表单偏好。
- 地区参考表从官网同源价格配置地址读取数据，并从 `open.er-api.com` 读取公开汇率；首次打开后缓存在当前页面内存中，仅在用户点击“刷新价格”时重新请求，不写入扩展存储。
- 价格配置请求不会附加手动 `accessToken`；由于它是 `chatgpt.com` 同源请求，浏览器可能按正常规则携带该站点 Cookie。
- 参考表固定按月付、2 席、5 折估算，实时汇率只用于人民币换算，最终优惠资格、金额和税费以官方结账页为准。
- 扩展不会自动付款，也不会绕过资格、地区、价格、税费或风控校验。
- 生成接口返回 4xx/5xx 时，悬浮面板会显示 HTTP 状态、错误说明和服务器响应正文（最多 2000 个字符）。
- 使用的是目标网站内部接口，接口发生变化时可能需要更新扩展。
- 请仅用于自己的账号，并在官方结账页面确认最终金额和条款。

## 许可证

本项目采用 Apache License 2.0，详见 `LICENSE`。

## 文件结构

```text
teamCheckoutLink/
├─ LICENSE
├─ README.md
├─ README.en.md
├─ PRIVACY.md
├─ STORE-LISTING.md
├─ manifest.json
├─ manifest.firefox.json
├─ popup.html
├─ popup.css
├─ popup.js
├─ content.css
├─ content.js
├─ page-bridge.js
├─ background.js
├─ build.ps1
├─ assets/
│  ├─ teamCheckoutLink.png
│  ├─ teamCheckoutLink-current.png
│  └─ icons/
│     ├─ teamCheckoutLink.svg
│     ├─ icon16.png
│     ├─ icon48.png
│     └─ icon128.png
└─ store-assets/
   ├─ edge-logo-300x300.png
   ├─ chrome-small-promo-440x280.png
   └─ store-screenshot-1280x800.png
```
