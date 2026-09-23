# Store listing preparation

This is a draft for marketplace submissions. Update any marked contact or public-policy URL before submitting.

## Product

- **Name:** teamCheckoutLink
- **Suggested category:** Productivity / Utilities (choose the closest available category in each store)
- **Primary listing language:** Chinese (Simplified)
- **Interface language:** Chinese (English README is provided; the extension UI is currently Chinese)
- **Privacy policy URL:** Pending public hosting. `PRIVACY.md` is prepared, but the GitHub repository is private.
- **Support URL/contact:** Pending a publicly accessible support destination.

## Short description

Chinese: `填写 Team 工作区信息，生成托管结账链接，并查看官方地区价格参考。`

English: `Create hosted Team checkout links and view official regional price references.`

## Detailed description — Chinese

teamCheckoutLink 是一个开源浏览器扩展，可在支持的官网页面填写 Team 工作区信息并生成托管结账链接。扩展提供国家和货币选择、优惠码输入、官方地区价格参考及汇率换算。用户可使用当前网页登录会话，也可主动开启手动 Session 模式。

Session 仅在当前页面内存中处理，不保存到扩展存储。扩展会将用户主动提交的结账参数发送到目标网站的官方结账接口，不会代替用户付款。

**免责声明：**本项目仅供开源交流学习和合法个人使用。请遵守目标网站条款及适用法律。不得用于欺诈、规避服务限制或风控、未经授权访问或其他违法行为。本项目非官方产品，与目标网站及支付服务提供方无关联或背书。最终资格、价格和条款以官方结账页面为准。

## Detailed description — English

teamCheckoutLink is an open-source browser extension for entering Team workspace details on supported website pages and generating a hosted checkout link. It includes country and currency selection, promo-code input, official regional price references, and exchange-rate conversion. Users can use the current website session or explicitly enable Manual Session mode.

Session values are processed only in the current page's memory and are not saved in extension storage. Checkout parameters are sent to the target website's official checkout endpoint. The extension does not submit payment on the user's behalf.

**Disclaimer:** This project is for open-source learning and discussion and lawful personal use only. Follow the target website's terms and applicable laws. Do not use it for fraud, bypassing service restrictions or risk controls, unauthorized access, or other unlawful activity. This is not an official product and is not affiliated with or endorsed by the target website or payment providers. Final eligibility, prices, and terms are determined by the official checkout page.

## Chrome Web Store privacy answers — draft

- **Single purpose:** Help users enter Team checkout details on the supported website and generate a hosted checkout link.
- **Remote code:** No. The extension fetches JSON data; it does not download or execute remotely hosted code.
- **Authentication information:** The current login access token or a manually provided `accessToken` is used for the checkout request. It is sent to the target website's official endpoint and is not sent to the extension developer.
- **User-provided content:** Workspace name and promo code are included in the checkout request to the target website. Promo code is saved locally as a form preference until cleared.
- **Clipboard:** Read only after the user selects the Paste button; used to populate the selected field.
- **Local storage:** Workspace, seats, interval, country, promo, and panel preferences.
- **Third-party request:** `open.er-api.com` receives a generic exchange-rate request, without Session or form values.
- **Permission justifications:**
  - `activeTab`: identify the active supported page when the user opens the extension popup.
  - `scripting`: restore the floating panel if it is not currently injected on the active tab.
  - `storage`: save form and panel preferences locally.
  - `clipboardRead`: support the user-triggered Paste buttons.
  - `chatgpt.com` host access: run the panel on the supported site and call its first-party session, pricing, and checkout endpoints.
  - `open.er-api.com` host access: request exchange rates for currency conversion.

## Assets and submission notes

- Extension icon: `assets/icons/icon128.png` (required by Chrome Web Store; included in extension ZIPs).
- Edge listing logo: `store-assets/edge-logo-300x300.png`.
- Small promotional tile: `store-assets/chrome-small-promo-440x280.png`.
- Store screenshot: `store-assets/store-screenshot-1280x800.png`.
- README screenshot: `assets/teamCheckoutLink-current.png` includes the new GitHub header link.
- Chrome Web Store also requires a registered developer account; official docs currently describe a one-time registration fee. Check the dashboard for the amount and payment details.
- Edge Add-ons submissions go through Microsoft Partner Center. Microsoft's current developer docs state individual account registration has no fee; account enrollment/verification is still required.
- Firefox submissions go through AMO and require a Mozilla account. The extension is unminified; if the submitted package later includes obfuscated/minified code, check AMO source-code submission requirements.
- No marketplace submission has been made.
