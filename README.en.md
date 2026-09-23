# Team Checkout Link

[简体中文](README.md) | [English](README.en.md)

A browser extension that adds a movable floating panel to supported website pages. It uses the current signed-in session or a manually provided session access token to submit Team checkout parameters and display the hosted checkout link.

## Supported browsers

- Google Chrome
- Microsoft Edge
- Brave
- Opera
- Firefox 109+

Chrome, Edge, Brave, and Opera use `manifest.json`. The build script uses `manifest.firefox.json` for Firefox.

Run `build.ps1` to create the unpacked builds under `dist\chromium`, `dist\edge`, and `dist\firefox`, plus ZIP packages for each browser.

Safari is not currently packaged. Its WebExtension requires conversion, signing, and installation through Xcode.

## Install

### Chrome, Edge, Brave, and Opera

1. Open the browser's extension management page (`chrome://extensions`, `edge://extensions`, `brave://extensions`, or `opera://extensions`).
2. Enable Developer mode.
3. Select **Load unpacked**.
4. Choose `D:\teamCheckoutLink`.

For Edge, you can also load `D:\teamCheckoutLink\dist\edge` or use `dist\teamCheckoutLink-edge.zip` as a package for distribution.

### Firefox

1. Run `build.ps1`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Select **Load Temporary Add-on**.
4. Choose `dist\firefox\manifest.json`.

Temporary Firefox add-ons are removed when the browser restarts. Long-term distribution requires signing or an enterprise deployment policy.

## Use

1. Open `https://chatgpt.com/`. Use the existing signed-in session, or enable **Manual Session** to use a manually provided token.
2. The floating panel appears on the right. Drag its header to move it, use `−` to collapse it, and use `×` to close it. Select the GitHub icon in the header to open the project repository. Its position and collapsed/hidden states are saved.
3. If you close the panel, use the extension button and select **Show floating tool** to bring it back.
4. Enter a workspace name, seat count, billing interval, country, and optional promo code. Search countries by Chinese name, English name, or country code. Currency is selected automatically. The official pre-discount Business price below the country selector updates with the selected country, seats, and billing interval.
5. Select **Regional 2-seat price reference** to open the side panel. Prices are sorted from lowest to highest by the approximate CNY amount. Exchange-rate data is cached in local extension storage for 24 hours and refreshed automatically the next time the reference table is opened after expiry. Users can refresh rates manually up to three times per rolling hour; after a failed request, retries wait at least one hour. The table includes an ExchangeRate-API attribution link. Selecting a country in the reference list also updates the form.
6. The promo code and manual Session fields both have a **Paste** button. You can also paste with the keyboard.
7. For manual Session mode, enable the switch, open or copy the session endpoint `https://chatgpt.com/api/auth/session` in a browser signed into the account, then paste the full JSON response or its `accessToken`. A Session Cookie cannot replace a Bearer access token. Do not share your Session.
8. Select **Generate link**, then copy or open the returned checkout page.

## Disclaimer

Team Checkout Link is an open-source project for learning and discussion and for lawful personal use. Users must follow the target website's terms and applicable laws. Do not use this project for fraud, bypassing service restrictions or risk controls, unauthorized access, or any other unlawful activity. This is not an official product of, and is not affiliated with or endorsed by, the target website or payment providers. Users are responsible for confirming eligibility, prices, and checkout terms, and for their own use of the project.

## Privacy and limitations

See the full [Privacy Policy](PRIVACY.md).

- Automatically retrieved or manually entered `accessToken` values stay in page memory. They are not sent to the extension popup or written to extension storage. Turning off Manual Session or closing the floating panel clears the entered value.
- The extension stores workspace, seat, interval, country, promo, panel position, and panel visibility preferences locally. The local exchange-rate cache does not contain your Session or form data.
- Regional prices are read from the same-origin official pricing configuration endpoint at `chatgpt.com/backend-api/checkout_pricing_config/configs/{country code}`. The public exchange-rate endpoint is `open.er-api.com`. Regional pricing configuration is cached in page memory; exchange-rate data is cached in local extension storage for 24 hours and automatically refreshed the next time the reference table is opened after expiry. Manual rate refresh is limited to three requests per rolling hour, and failed requests wait at least one hour before retrying. The table includes an ExchangeRate-API attribution link.
- Pricing requests do not include the manually entered `accessToken`. As same-origin requests, the browser may include site cookies according to its normal rules.
- The reference table is a monthly, two-seat, 50%-discount estimate. Exchange rates are used only for approximate CNY conversion. Eligibility, final prices, and taxes are determined by the official checkout page.
- The extension does not submit payment or bypass eligibility, regional, pricing, tax, or risk checks.
- When checkout returns an HTTP error, the panel shows the status, error description, and up to 2,000 characters of the response body.
- The extension uses internal website endpoints, which may change.
- Use the extension only with your own account and verify the final amount and terms on the official checkout page.

## License

Apache License 2.0. See [LICENSE](LICENSE).
