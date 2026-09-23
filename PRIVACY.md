# Privacy Policy / 隐私政策

**Last updated / 更新日期: September 23, 2026**

[简体中文](#简体中文) | [English](#english)

## 简体中文

teamCheckoutLink 是开源浏览器扩展。本政策说明扩展在用户主动使用时如何处理信息。

### 处理的信息

- 为生成结账链接，扩展使用当前网页登录会话，或用户手动提供的 Session JSON / `accessToken`。手动输入的 Session 仅在当前页面内存中处理，不写入扩展存储。
- 生成请求会把认证令牌及用户填写的工作区名称、席位数、付款周期、国家/地区和优惠码发送到目标网站的官方结账接口，以返回托管结账链接。扩展开发者不接收这些内容。
- 用户点击“粘贴”时，扩展读取剪贴板文本并填入对应字段；扩展不会在后台读取剪贴板。
- 扩展在浏览器本地保存工作区、席位数、付款周期、国家/地区、优惠码及面板位置、展开状态等偏好。用户可使用清空控件移除优惠码或 Session；Session 本身不保存。
- 价格参考会请求目标网站同源的地区价格配置，并向 `open.er-api.com` 请求公开汇率。汇率请求不包含用户填写的 Session、令牌、优惠码或工作区名称。价格响应仅缓存在当前页面内存中。

### 信息使用与共享

信息仅用于用户触发的结账链接生成、显示地区价格参考以及保存扩展偏好。结账请求发往目标网站；扩展不运营用于收集上述信息的服务器，也不出售或出租用户信息。目标网站及其结账服务可能依其自身政策处理收到的数据。

### 保存与安全

Session / `accessToken` 只在页面内存中使用。普通表单偏好保存在浏览器扩展本地存储中，直到用户清除、覆盖或卸载扩展。汇率和价格缓存随页面关闭而清除。

### 联系方式

请通过项目仓库联系维护者：<https://github.com/AHyue/teamCheckoutLink>。商店发布前需将本政策放在商店审核者和用户无需授权即可访问的公开网址。

## English

teamCheckoutLink is an open-source browser extension. This policy explains how the extension handles information when you choose to use it.

### Information processed

- To generate a checkout link, the extension uses the current website session or a Session JSON / `accessToken` that you enter manually. A manually entered Session is processed only in the current page's memory and is not written to extension storage.
- A generation request sends the authentication token and the workspace name, seat count, billing interval, country/region, and promo code you entered to the target website's official checkout endpoint so it can return a hosted checkout link. The extension developer does not receive this information.
- When you select **Paste**, the extension reads clipboard text and puts it in the corresponding field. It does not read the clipboard in the background.
- The extension stores workspace, seat count, billing interval, country/region, promo code, panel position, and panel display preferences locally in the browser. You can clear the promo code or Session using the clear controls. Session values are not stored.
- The price reference requests regional pricing configuration from the target website's same-origin endpoint and public exchange rates from `open.er-api.com`. The exchange-rate request does not include your Session, token, promo code, or workspace name. Price responses are cached only in the current page's memory.

### Use and sharing

Information is used only for link generation initiated by you, regional price references, and extension preferences. Checkout requests go to the target website. The extension developer does not operate a server that collects this information and does not sell or rent user information. The target website and its checkout providers may process submitted data under their own policies.

### Retention and security

Session / `accessToken` values are used only in page memory. Form preferences are stored in the browser's local extension storage until cleared, replaced, or the extension is uninstalled. Price and exchange-rate caches are cleared when the page closes.

### Contact

Contact the maintainer through the project repository: <https://github.com/AHyue/teamCheckoutLink>. Before store submission, this policy must be hosted at a public URL that reviewers and users can access without authorization.
