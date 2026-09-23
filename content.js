(() => {
  'use strict';

  if (globalThis.__teamCheckoutLinkContentLoaded) return;
  globalThis.__teamCheckoutLinkContentLoaded = true;

  const api = globalThis.browser || globalThis.chrome;
  const SESSION_URL = 'https://chatgpt.com/api/auth/session';
  const COUNTRIES = [
    ['US', '美国', 'United States', 'USD'],
    ['TH', '泰国', 'Thailand', 'THB'],
    ['PH', '菲律宾', 'Philippines', 'PHP'],
    ['EG', '埃及', 'Egypt', 'EGP'],
    ['GB', '英国', 'United Kingdom', 'GBP'],
    ['TZ', '坦桑尼亚', 'Tanzania', 'TZS'],
    ['CA', '加拿大', 'Canada', 'CAD'],
    ['AU', '澳大利亚', 'Australia', 'AUD'],
    ['JP', '日本', 'Japan', 'JPY'],
    ['KR', '韩国', 'South Korea', 'KRW'],
    ['SG', '新加坡', 'Singapore', 'SGD'],
    ['MY', '马来西亚', 'Malaysia', 'MYR'],
    ['ID', '印度尼西亚', 'Indonesia', 'IDR'],
    ['IN', '印度', 'India', 'INR'],
    ['BR', '巴西', 'Brazil', 'BRL'],
    ['MX', '墨西哥', 'Mexico', 'MXN'],
    ['TR', '土耳其', 'Türkiye', 'TRY'],
    ['ZA', '南非', 'South Africa', 'ZAR'],
    ['CI', '科特迪瓦', "Côte d'Ivoire", 'USD'],
    ['ET', '埃塞俄比亚', 'Ethiopia', 'USD'],
    ['GH', '加纳', 'Ghana', 'USD'],
    ['KE', '肯尼亚', 'Kenya', 'USD'],
    ['MU', '毛里求斯', 'Mauritius', 'USD'],
    ['UG', '乌干达', 'Uganda', 'USD'],
    ['NG', '尼日利亚', 'Nigeria', 'NGN'],
    ['AE', '阿联酋', 'United Arab Emirates', 'AED'],
    ['SA', '沙特阿拉伯', 'Saudi Arabia', 'SAR'],
    ['DE', '德国', 'Germany', 'EUR'],
    ['FR', '法国', 'France', 'EUR'],
    ['IT', '意大利', 'Italy', 'EUR'],
    ['ES', '西班牙', 'Spain', 'EUR'],
    ['NL', '荷兰', 'Netherlands', 'EUR'],
    ['NZ', '新西兰', 'New Zealand', 'NZD']
  ];

  const bridgeChannel = `teamCheckoutLink:${crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`}`;
  const pendingRequests = new Map();
  let bridgeReady = null;
  let panelRoot = null;
  let checkoutUrl = '';

  function normalizePromoCode(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (!/^https?:\/\//i.test(raw) && !/^(?:www\.)?chatgpt\.com(?:[/?#]|$)/i.test(raw)) return raw;

    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    let url;
    try { url = new URL(candidate); } catch { throw new Error('优惠链接格式无效。'); }
    if (!['chatgpt.com', 'www.chatgpt.com'].includes(url.hostname.toLowerCase())) {
      throw new Error('优惠链接必须使用官方域名。');
    }
    const queryCode = [...url.searchParams.entries()]
      .find(([key]) => key.toLowerCase() === 'promocode')?.[1];
    if (queryCode) return queryCode.trim();
    const pathMatch = url.pathname.match(/^\/p\/([^/]+)\/?$/i);
    if (pathMatch) return decodeURIComponent(pathMatch[1]).trim();
    throw new Error('优惠链接中没有找到优惠码。');
  }

  function isAllowedCheckoutUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && [
        'chatgpt.com', 'pay.openai.com', 'checkout.stripe.com'
      ].some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
    } catch {
      return false;
    }
  }

  function ensureBridge() {
    if (bridgeReady) return bridgeReady;
    bridgeReady = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${api.runtime.getURL('page-bridge.js')}?channel=${encodeURIComponent(bridgeChannel)}`;
      script.async = false;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('无法连接页面环境，请刷新后重试。'));
      (document.head || document.documentElement).appendChild(script);
    });
    return bridgeReady;
  }

  window.addEventListener('message', event => {
    const message = event.data;
    if (event.source !== window || message?.source !== bridgeChannel
      || !['checkout-response', 'price-config-response'].includes(message?.type)) return;
    const pending = pendingRequests.get(message.requestId);
    if (!pending) return;
    pendingRequests.delete(message.requestId);
    window.clearTimeout(pending.timer);
    if (message.ok) pending.resolve(message.type === 'checkout-response' ? message.url : message.data);
    else pending.reject(new Error(message.error || '生成结账链接失败。'));
  });

  function extractAccessToken(value) {
    let token = String(value || '').trim();
    if (!token) throw new Error('请输入 Session JSON 或 accessToken。');

    if (/^(?:__Secure-)?(?:next-auth\.)?session-token=/i.test(token)) {
      throw new Error('Session Cookie 不能直接用于此接口，请粘贴 /api/auth/session 返回的 JSON 或其中的 accessToken。');
    }

    if (token.startsWith('{')) {
      let session;
      try { session = JSON.parse(token); } catch { throw new Error('Session JSON 格式无效。'); }
      token = String(session?.accessToken ?? session?.access_token ?? session?.session?.accessToken ?? '').trim();
      if (!token) throw new Error('Session JSON 中没有找到 accessToken。');
    }

    token = token.replace(/^Bearer\s+/i, '').trim();
    if (!token) throw new Error('accessToken 不能为空。');
    return token;
  }

  async function requestBridge(type, payload, accessToken = '') {
    await ensureBridge();
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      const timer = window.setTimeout(() => {
        pendingRequests.delete(requestId);
        reject(new Error('请求超时，请稍后重试。'));
      }, 45000);
      pendingRequests.set(requestId, { resolve, reject, timer });
      window.postMessage({
        source: bridgeChannel,
        type,
        requestId,
        payload,
        accessToken
      }, window.location.origin);
    });
  }

  function requestCheckout(payload, accessToken = '') {
    return requestBridge('checkout-request', payload, accessToken);
  }

  function requestPriceConfigs(countryCodes) {
    return requestBridge('price-config-request', { countryCodes });
  }

  const COUNTRY_PRICE_CACHE_TTL = 30 * 60 * 1000;
  const countryPriceCache = new Map();
  const countryPriceRequests = new Map();

  function rememberCountryPrice(item) {
    const code = String(item?.data?.country_code || item?.countryCode || '').toUpperCase();
    if (!/^[A-Z]{2}$/.test(code) || !item?.data?.currency_config) return;
    countryPriceCache.set(code, { data: item.data, cachedAt: Date.now() });
  }

  async function getCountryPriceConfigs(countryCodes, force = false) {
    const codes = [...new Set(countryCodes.map(value => String(value || '').toUpperCase()))]
      .filter(code => /^[A-Z]{2}$/.test(code));
    const configs = new Map();
    const failures = [];
    const waiters = [];
    const pendingCodes = [];

    codes.forEach(code => {
      const cached = countryPriceCache.get(code);
      if (!force && cached && Date.now() - cached.cachedAt < COUNTRY_PRICE_CACHE_TTL) {
        configs.set(code, cached.data);
      } else if (countryPriceRequests.has(code)) {
        waiters.push({ code, promise: countryPriceRequests.get(code) });
      } else {
        pendingCodes.push(code);
      }
    });

    if (pendingCodes.length) {
      const batch = requestPriceConfigs(pendingCodes);
      pendingCodes.forEach(code => {
        const request = batch.then(response => {
          const item = response?.configs?.find(config =>
            String(config?.data?.country_code || config?.countryCode || '').toUpperCase() === code
          );
          if (!item?.data?.currency_config) {
            throw new Error(response?.failed?.find(message => String(message).startsWith(`${code}请求失败`))
              || `${code}官方价格配置没有返回有效数据。`);
          }
          rememberCountryPrice(item);
          return item.data;
        }).finally(() => countryPriceRequests.delete(code));
        countryPriceRequests.set(code, request);
        waiters.push({ code, promise: request });
      });
    }

    const settled = await Promise.allSettled(waiters.map(waiter => waiter.promise));
    settled.forEach((result, index) => {
      const code = waiters[index].code;
      if (result.status === 'fulfilled') configs.set(code, result.value);
      else failures.push(result.reason?.message || String(result.reason));
    });

    const values = [...configs.entries()].map(([countryCode, data]) => ({ countryCode, data }));
    return { configs: values, failed: failures };
  }

  async function getCountryPriceConfig(countryCode) {
    const code = String(countryCode || '').toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) throw new Error('国家代码无效。');
    const response = await getCountryPriceConfigs([code]);
    if (!response.configs.length) throw new Error(response.failed[0] || '官方价格配置没有返回有效数据。');
    return response.configs[0].data;
  }

  function panelMarkup() {
    return `
      <section class="tll-panel" aria-label="TEAM 结账链接生成器">
        <header class="tll-header" title="按住拖动">
          <span class="tll-logo">TL</span>
          <div class="tll-heading"><strong>teamCheckoutLink</strong><span>拖动顶部可移动 · 仅限官网页面</span></div>
          <div class="tll-header-actions">
            <button class="tll-icon-button" id="tll-collapse" type="button" title="收起" aria-label="收起面板">−</button>
            <button class="tll-icon-button" id="tll-close" type="button" title="关闭" aria-label="关闭面板">×</button>
          </div>
        </header>
        <div class="tll-body">
          <form class="tll-form" id="tll-form">
            <div class="tll-field">
              <label for="tll-workspace">工作区名称</label>
              <input id="tll-workspace" maxlength="80" value="MyTeam" required>
            </div>
            <div class="tll-grid">
              <div class="tll-field">
                <label for="tll-seats">席位数</label>
                <input id="tll-seats" type="number" min="2" max="999" value="2" required>
              </div>
              <div class="tll-field">
                <label for="tll-interval">付款周期</label>
                <select id="tll-interval"><option value="month">月付</option><option value="year">年付</option></select>
              </div>
            </div>
            <div class="tll-grid">
              <div class="tll-field">
                <label for="tll-country-search">国家 / 地区</label>
                <div class="tll-search">
                  <input id="tll-country-search" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="tll-country-dropdown" placeholder="输入中文、英文或代码" required>
                  <button class="tll-country-toggle" id="tll-country-toggle" type="button" aria-label="展开国家列表">▾</button>
                  <div class="tll-country-dropdown" id="tll-country-dropdown" role="listbox" hidden></div>
                </div>
                <input id="tll-country" type="hidden" value="US">
              </div>
              <div class="tll-field">
                <label for="tll-currency">货币 <span>自动匹配</span></label>
                <input class="tll-currency" id="tll-currency" value="USD" readonly aria-readonly="true">
              </div>
            </div>
            <p class="tll-country-price" id="tll-country-price" role="status" aria-live="polite">正在获取所选地区官方价格…</p>
            <div class="tll-field">
              <label for="tll-promo">优惠码或官方优惠链接 <span>可选</span></label>
              <div class="tll-clearable-input">
              <input id="tll-promo" maxlength="512" autocomplete="off" placeholder="PROMO2026 或粘贴优惠链接">
                <button class="tll-promo-paste" id="tll-promo-paste" type="button" title="从剪贴板粘贴优惠码" aria-label="粘贴优惠码">粘贴</button>
                <button class="tll-clear-button" id="tll-promo-clear" type="button" title="清空优惠码" aria-label="清空优惠码">清空</button>
              </div>
            </div>
            <section class="tll-session-box">
              <label class="tll-session-toggle" for="tll-manual-session">
                <span><strong>手动 Session 模式</strong><small>未登录时使用 · 默认关闭</small></span>
                <input id="tll-manual-session" type="checkbox" role="switch" aria-controls="tll-session-content" aria-expanded="false">
              </label>
              <div class="tll-session-content" id="tll-session-content" hidden>
                <p class="tll-session-guide">先在已登录账号的浏览器中打开下方地址，然后复制页面显示的完整 JSON。</p>
                <div class="tll-session-source">
                  <code title="Session 获取地址">官方 Session 获取地址</code>
                  <div class="tll-session-source-actions">
                    <button id="tll-session-open" type="button">打开获取页</button>
                    <button id="tll-session-copy-url" type="button">复制地址</button>
                  </div>
                </div>
                <label for="tll-session-value">Session JSON / accessToken</label>
                <div class="tll-session-actions">
                  <button class="tll-session-paste" id="tll-session-paste" type="button" title="从剪贴板粘贴 Session">粘贴</button>
                  <button class="tll-session-visible" id="tll-session-visible" type="button" aria-label="显示 Session" title="显示 Session">显示</button>
                  <button class="tll-session-clear" id="tll-session-clear" type="button" title="清空 Session" aria-label="清空 Session">清空</button>
                </div>
                <input class="tll-session-value" id="tll-session-value" type="password" autocomplete="off" spellcheck="false" placeholder="粘贴 Session JSON 或 accessToken">
                <p>也可只粘贴 JSON 中的 <code>accessToken</code>；不支持 Session Cookie。请勿把 Session 发送给他人。</p>
              </div>
            </section>
            <button class="tll-primary tll-generate" id="tll-generate" type="submit">生成链接</button>
          </form>
          <section class="tll-price-reference">
            <button class="tll-price-toggle" id="tll-price-toggle" type="button" aria-expanded="false" aria-haspopup="dialog" aria-controls="tll-price-modal">
              <span>各地区 2 席优惠参考</span><small>月付 · 5 折 <b id="tll-price-arrow">↗</b></small>
            </button>
          </section>
          <p class="tll-status" id="tll-status" role="status" aria-live="polite"></p>
          <section class="tll-result" id="tll-result" hidden>
            <label for="tll-result-url">结账链接</label>
            <textarea id="tll-result-url" readonly rows="3"></textarea>
            <div class="tll-actions">
              <button class="tll-secondary" id="tll-copy" type="button">复制链接</button>
              <button class="tll-primary" id="tll-open" type="button">打开结账页</button>
            </div>
          </section>
          <p class="tll-privacy">自动或手动 Token 只保留在当前页面内存中，不写入扩展存储。关闭手动模式或面板会清除输入。付款前请核对官方结账页的金额、币种和优惠。</p>
        </div>
      </section>
      <div class="tll-price-modal" id="tll-price-modal" role="dialog" aria-modal="false" aria-labelledby="tll-price-modal-title" hidden>
        <div class="tll-price-modal-backdrop" data-tll-price-close></div>
        <section class="tll-price-dialog">
          <header class="tll-price-dialog-header">
            <div><strong id="tll-price-modal-title">各地区 2 席优惠参考</strong><span>月付 · 5 折估算 · 按人民币由低到高</span></div>
            <div class="tll-price-dialog-actions">
              <button class="tll-price-refresh" id="tll-price-refresh" type="button" title="重新请求官方配置和汇率">刷新价格</button>
              <button class="tll-icon-button tll-price-close" id="tll-price-close" type="button" title="关闭" aria-label="关闭参考表">×</button>
            </div>
          </header>
          <div class="tll-price-dialog-body">
            <div class="tll-price-columns" aria-hidden="true"><span>国家 / 地区</span><span>当地货币优惠参考</span><span>约人民币 ↑</span></div>
            <div class="tll-price-list" id="tll-price-list"></div>
            <p id="tll-price-hint">首次打开时读取官方地区价格配置；之后使用当前页面缓存，可点击“刷新价格”手动更新。</p>
          </div>
        </section>
      </div>`;
  }

  function setStatus(root, message, type = '') {
    const element = root.querySelector('#tll-status');
    element.textContent = message;
    element.className = `tll-status${type ? ` tll-${type}` : ''}`;
  }

  function makeDraggable(root) {
    const handle = root.querySelector('.tll-header');
    let drag = null;

    const clampPosition = (left, top) => {
      const drawer = root.querySelector('#tll-price-modal');
      const maximumLeft = window.innerWidth - root.offsetWidth - 8;
      const attachedDrawer = drawer && !drawer.hidden && window.innerWidth > 900;
      const minimumLeft = attachedDrawer && drawer.offsetWidth + 18 <= maximumLeft
        ? drawer.offsetWidth + 18
        : 8;
      return {
        left: Math.max(minimumLeft, Math.min(left, maximumLeft)),
        top: Math.max(8, Math.min(top, window.innerHeight - Math.min(root.offsetHeight, window.innerHeight - 16) - 8))
      };
    };

    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest('button')) return;
      const rect = root.getBoundingClientRect();
      drag = { pointerId: event.pointerId, x: event.clientX - rect.left, y: event.clientY - rect.top };
      root.style.right = 'auto';
      root.style.left = `${rect.left}px`;
      root.style.top = `${rect.top}px`;
      root.classList.add('tll-dragging');
      handle.setPointerCapture(event.pointerId);
    });

    handle.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const next = clampPosition(event.clientX - drag.x, event.clientY - drag.y);
      root.style.left = `${next.left}px`;
      root.style.top = `${next.top}px`;
    });

    const finishDrag = event => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      drag = null;
      root.classList.remove('tll-dragging');
      const rect = root.getBoundingClientRect();
      api.storage.local.set({ panelPosition: { left: Math.round(rect.left), top: Math.round(rect.top) } });
    };
    handle.addEventListener('pointerup', finishDrag);
    handle.addEventListener('pointercancel', finishDrag);
  }

  function bindPanel(root) {
    const $ = selector => root.querySelector(selector);
    let selectedCountry = COUNTRIES[0];
    let visibleCountries = [];
    let activeCountryIndex = -1;
    let closeTimer = null;
    let priceRows = [];
    let priceRate = null;
    let priceLoading = false;
    let priceCachedAt = null;

    const countryLabel = country => `${country[1]}（${country[0]}）`;
    const findCountry = value => {
      const normalized = String(value || '').trim().toLocaleLowerCase();
      if (!normalized) return null;
      return COUNTRIES.find(([code, name, nameEn]) => [
        code, name, nameEn, `${name}（${code}）`, `${name} (${code})`
      ].some(candidate => candidate.toLocaleLowerCase() === normalized)) || null;
    };

    const closeCountries = () => {
      $('#tll-country-dropdown').hidden = true;
      $('#tll-country-search').setAttribute('aria-expanded', 'false');
      activeCountryIndex = -1;
    };

    function renderCurrentCountryPrice(data) {
      const currencyConfig = data?.currency_config;
      const interval = $('#tll-interval').value;
      const cycleLabel = interval === 'year' ? '年付' : '月付';
      const currency = String(currencyConfig?.symbol_code || selectedCountry[3]).toUpperCase();
      const amount = Number(currencyConfig?.business?.[interval]?.amount);
      const seats = Number($('#tll-seats').value);
      if (!Number.isFinite(amount) || amount <= 0) {
        $('#tll-country-price').textContent = `官方配置暂未提供该地区 Business ${cycleLabel}价格。`;
        return;
      }
      const billedMonths = interval === 'year' ? 12 : 1;
      const cycleUnit = interval === 'year' ? '年' : '月';
      const priceBasis = interval === 'year' ? `${formatCurrencyAmount(amount, currency)}/席·月（年付）` : `${formatCurrencyAmount(amount, currency)}/席·月`;
      const total = Number.isInteger(seats) && seats >= 2
        ? ` · ${seats}席${cycleUnit}合计 ${formatCurrencyAmount(amount * seats * billedMonths, currency)}`
        : '';
      $('#tll-country-price').textContent = `官方 Business ${cycleLabel}：${priceBasis}${total}（优惠前，最终金额以结账页为准）`;
    }

    function refreshCurrentCountryPrice() {
      const code = selectedCountry[0];
      const cached = countryPriceCache.get(code);
      if (cached && Date.now() - cached.cachedAt < COUNTRY_PRICE_CACHE_TTL) {
        renderCurrentCountryPrice(cached.data);
        return;
      }
      $('#tll-country-price').textContent = `正在获取${selectedCountry[1]} Business 官方价格…`;
      getCountryPriceConfig(code).then(data => {
        if (selectedCountry[0] === code) renderCurrentCountryPrice(data);
      }).catch(error => {
        if (selectedCountry[0] === code) {
          $('#tll-country-price').textContent = `官方价格暂不可用：${error?.message || String(error)}`;
        }
      });
    }

    const selectCountry = (country, loadPrice = true) => {
      selectedCountry = country;
      $('#tll-country-search').value = countryLabel(country);
      $('#tll-country').value = country[0];
      $('#tll-currency').value = country[3];
      closeCountries();
      renderPriceRows();
      if (loadPrice) refreshCurrentCountryPrice();
    };

    const filterCountries = query => {
      const normalized = String(query || '').trim().toLocaleLowerCase();
      if (!normalized) return COUNTRIES.slice();
      return COUNTRIES.filter(([code, name, nameEn, currency]) =>
        [code, name, nameEn, currency].some(value => value.toLocaleLowerCase().includes(normalized))
      );
    };

    const setActiveCountry = index => {
      if (!visibleCountries.length) { activeCountryIndex = -1; return; }
      activeCountryIndex = Math.max(0, Math.min(index, visibleCountries.length - 1));
      [...$('#tll-country-dropdown').querySelectorAll('.tll-country-option')].forEach((option, optionIndex) => {
        const active = optionIndex === activeCountryIndex;
        option.classList.toggle('tll-active', active);
        option.setAttribute('aria-selected', String(active));
        if (active) option.scrollIntoView({ block: 'nearest' });
      });
    };

    const renderCountries = query => {
      visibleCountries = filterCountries(query);
      activeCountryIndex = -1;
      $('#tll-country-dropdown').replaceChildren();
      if (!visibleCountries.length) {
        const empty = document.createElement('p');
        empty.className = 'tll-country-empty';
        empty.textContent = '没有匹配的国家或地区';
        $('#tll-country-dropdown').appendChild(empty);
        return;
      }
      const fragment = document.createDocumentFragment();
      visibleCountries.forEach(country => {
        const [code, name, nameEn, currency] = country;
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'tll-country-option';
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        const title = document.createElement('strong');
        title.textContent = `${name}（${code}）`;
        title.title = nameEn;
        const meta = document.createElement('span');
        meta.textContent = currency;
        option.append(title, meta);
        option.addEventListener('mousedown', event => event.preventDefault());
        option.addEventListener('click', () => selectCountry(country));
        fragment.appendChild(option);
      });
      $('#tll-country-dropdown').appendChild(fragment);
    };

    const openCountries = (showAll = false) => {
      if (closeTimer) window.clearTimeout(closeTimer);
      const matchesSelection = $('#tll-country-search').value === countryLabel(selectedCountry);
      renderCountries(showAll || matchesSelection ? '' : $('#tll-country-search').value);
      $('#tll-country-dropdown').hidden = false;
      $('#tll-country-search').setAttribute('aria-expanded', 'true');
      const index = visibleCountries.findIndex(country => country === selectedCountry);
      setActiveCountry(index >= 0 ? index : 0);
    };

    const resolveCountry = (restore = false) => {
      const match = findCountry($('#tll-country-search').value);
      if (match) { selectCountry(match); return match[0]; }
      if (restore) { selectCountry(selectedCountry); return selectedCountry[0]; }
      $('#tll-country').value = '';
      $('#tll-currency').value = '';
      return '';
    };

    function formatCurrencyAmount(amount, currency) {
      try {
        return new Intl.NumberFormat('zh-CN', {
          style: 'currency',
          currency,
          maximumFractionDigits: 2
        }).format(amount);
      } catch {
        return `${currency} ${Number(amount).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;
      }
    }

    function formatRateDate(value) {
      if (!value) return '';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).format(date);
    }

    function renderPriceRows() {
      const list = $('#tll-price-list');
      if (!list) return;
      list.replaceChildren();
      if (priceLoading) {
        const loading = document.createElement('p');
        loading.className = 'tll-price-state';
        loading.textContent = '正在获取最新地区价格与汇率…';
        list.appendChild(loading);
        return;
      }
      if (!priceRows.length) {
        const empty = document.createElement('p');
        empty.className = 'tll-price-state';
        empty.textContent = '点击上方标题获取最新参考数据。';
        list.appendChild(empty);
        return;
      }

      const fragment = document.createDocumentFragment();
      priceRows.forEach(row => {
        const country = COUNTRIES.find(([code]) => code === row.country);
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'tll-price-row';
        item.classList.toggle('tll-selected', row.country === selectedCountry[0]);
        item.disabled = !country;
        item.title = country ? `切换到${country[1]}（${row.country}）` : '该地区暂不在国家列表中';

        const countryCell = document.createElement('strong');
        countryCell.textContent = country ? `${country[1]}（${row.country}）` : row.country;
        const localCell = document.createElement('span');
        localCell.textContent = formatCurrencyAmount(row.unitAmount, row.currency);
        const cnyCell = document.createElement('small');
        cnyCell.textContent = `约 ${formatCurrencyAmount(row.unitUsd * priceRate, 'CNY')}`;
        item.append(countryCell, localCell, cnyCell);
        if (country) item.addEventListener('click', () => selectCountry(country));
        fragment.appendChild(item);
      });
      list.appendChild(fragment);
    }

    function buildOfficialPriceRows(configs, usdRates) {
      return configs.map(item => {
        const country = String(item?.data?.country_code || item?.countryCode || '').toUpperCase();
        const currencyConfig = item?.data?.currency_config;
        const currency = String(currencyConfig?.symbol_code || '').toUpperCase();
        const unitAmount = Number(currencyConfig?.business?.month?.amount);
        const localPerUsd = currency === 'USD' ? 1 : Number(usdRates?.[currency]);
        if (!/^[A-Z]{2}$/.test(country) || !/^[A-Z]{3}$/.test(currency)
          || !Number.isFinite(unitAmount) || unitAmount <= 0
          || !Number.isFinite(localPerUsd) || localPerUsd <= 0) return null;
        return { country, currency, unitAmount, unitUsd: unitAmount / localPerUsd };
      }).filter(Boolean).sort((a, b) => a.unitUsd - b.unitUsd || a.country.localeCompare(b.country));
    }

    async function loadPriceReferences(force = false) {
      if (priceLoading) return;
      if (!force && priceRows.length && priceRate) {
        renderPriceRows();
        return;
      }
      const hadCache = priceRows.length > 0 && Number.isFinite(priceRate);
      priceLoading = true;
      $('#tll-price-refresh').disabled = true;
      $('#tll-price-refresh').textContent = '刷新中…';
      $('#tll-price-hint').textContent = '正在读取官方地区价格配置和最新汇率…';
      renderPriceRows();
      try {
        const [configResponse, rateResponse] = await Promise.all([
          getCountryPriceConfigs(COUNTRIES.map(([code]) => code), force),
          api.runtime.sendMessage({ type: 'teamCheckoutLink:load-price-reference' })
        ]);
        if (!rateResponse?.ok) throw new Error(rateResponse?.error || '汇率服务没有返回有效结果。');
        const rate = Number(rateResponse.cnyRate);
        if (!Array.isArray(configResponse?.configs) || !configResponse.configs.length
          || !rateResponse.usdRates || !Number.isFinite(rate) || rate <= 0) {
          throw new Error('官方价格配置或汇率响应缺少必要字段。');
        }
        configResponse.configs.forEach(rememberCountryPrice);
        const rows = buildOfficialPriceRows(configResponse.configs, rateResponse.usdRates);
        if (!rows.length) throw new Error('官方价格配置中没有可用的 Business 月付价格。');
        priceRows = rows;
        priceRate = rate;
        priceCachedAt = new Date().toISOString();
        const cached = formatRateDate(priceCachedAt);
        const rateUpdated = formatRateDate(rateResponse.rateDate);
        const failedCount = Array.isArray(configResponse.failed) ? configResponse.failed.length : 0;
        $('#tll-price-hint').textContent = `价格来源：官方配置；缓存于 ${cached}${rateUpdated ? ` · 汇率更新 ${rateUpdated}` : ''}${failedCount ? ` · ${failedCount} 个地区暂未返回` : ''}。固定按月付、2 席、5 折参考；点击“刷新价格”可手动更新，最终金额和税费以官方结账页为准。`;
        refreshCurrentCountryPrice();
      } catch (error) {
        if (!hadCache) {
          priceRows = [];
          priceRate = null;
          priceCachedAt = null;
        }
        $('#tll-price-hint').textContent = `${force ? '刷新' : '获取'}失败：${error?.message || String(error)}。${hadCache ? '继续显示当前页面缓存。' : '请点击“刷新价格”重试。'}`;
      } finally {
        priceLoading = false;
        $('#tll-price-refresh').disabled = false;
        $('#tll-price-refresh').textContent = '刷新价格';
        renderPriceRows();
      }
    }

    selectCountry(COUNTRIES[0], false);

    $('#tll-country-search').addEventListener('focus', event => { event.currentTarget.select(); openCountries(true); });
    $('#tll-country-search').addEventListener('click', event => { event.currentTarget.select(); openCountries(true); });
    $('#tll-country-search').addEventListener('input', () => {
      $('#tll-country').value = '';
      $('#tll-currency').value = '';
      $('#tll-country-price').textContent = '选择一个国家或地区以查看当前 Business 官方价格。';
      openCountries(false);
    });
    $('#tll-seats').addEventListener('input', () => {
      const cached = countryPriceCache.get(selectedCountry[0]);
      if (cached && Date.now() - cached.cachedAt < COUNTRY_PRICE_CACHE_TTL) renderCurrentCountryPrice(cached.data);
    });
    $('#tll-interval').addEventListener('change', () => {
      const cached = countryPriceCache.get(selectedCountry[0]);
      if (cached && Date.now() - cached.cachedAt < COUNTRY_PRICE_CACHE_TTL) renderCurrentCountryPrice(cached.data);
    });
    $('#tll-country-search').addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if ($('#tll-country-dropdown').hidden) openCountries(false);
        else setActiveCountry(activeCountryIndex + 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if ($('#tll-country-dropdown').hidden) openCountries(false);
        else setActiveCountry(activeCountryIndex - 1);
      } else if (event.key === 'Enter' && !$('#tll-country-dropdown').hidden && visibleCountries[activeCountryIndex]) {
        event.preventDefault();
        selectCountry(visibleCountries[activeCountryIndex]);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        selectCountry(selectedCountry);
      }
    });
    $('#tll-country-search').addEventListener('blur', () => {
      closeTimer = window.setTimeout(() => { resolveCountry(true); closeCountries(); }, 120);
    });
    $('#tll-country-toggle').addEventListener('click', () => {
      if ($('#tll-country-dropdown').hidden) {
        $('#tll-country-search').focus();
        $('#tll-country-search').select();
        openCountries(true);
      } else closeCountries();
    });

    const closePriceModal = () => {
      $('#tll-price-modal').hidden = true;
      $('#tll-price-toggle').setAttribute('aria-expanded', 'false');
      $('#tll-price-arrow').textContent = '↗';
    };

    $('#tll-price-toggle').addEventListener('click', () => {
      $('#tll-price-modal').hidden = false;
      $('#tll-price-toggle').setAttribute('aria-expanded', 'true');
      $('#tll-price-arrow').textContent = '↙';
      const rootRect = root.getBoundingClientRect();
      const drawerWidth = $('#tll-price-modal').offsetWidth;
      const minimumLeft = drawerWidth + 18;
      if (rootRect.left < minimumLeft && minimumLeft + root.offsetWidth <= window.innerWidth - 8) {
        root.style.right = 'auto';
        root.style.left = `${minimumLeft}px`;
        api.storage.local.set({ panelPosition: { left: Math.round(minimumLeft), top: Math.round(rootRect.top) } });
      }
      $('#tll-price-close').focus();
      loadPriceReferences();
    });
    $('#tll-price-refresh').addEventListener('click', () => loadPriceReferences(true));
    $('#tll-price-close').addEventListener('click', closePriceModal);
    $('#tll-price-modal').addEventListener('click', event => {
      if (event.target.closest('[data-tll-price-close]')) closePriceModal();
    });
    $('#tll-price-modal').addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePriceModal();
        $('#tll-price-toggle').focus();
      }
    });

    $('#tll-manual-session').addEventListener('change', event => {
      const enabled = event.currentTarget.checked;
      $('#tll-session-content').hidden = !enabled;
      event.currentTarget.setAttribute('aria-expanded', String(enabled));
      if (enabled) {
        $('#tll-session-value').focus();
      } else {
        $('#tll-session-value').value = '';
        $('#tll-session-value').type = 'password';
        $('#tll-session-visible').textContent = '显示';
        $('#tll-session-visible').title = '显示 Session';
        $('#tll-session-visible').setAttribute('aria-label', '显示 Session');
      }
    });

    $('#tll-session-visible').addEventListener('click', () => {
      const input = $('#tll-session-value');
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      $('#tll-session-visible').textContent = showing ? '显示' : '隐藏';
      $('#tll-session-visible').title = showing ? '显示 Session' : '隐藏 Session';
      $('#tll-session-visible').setAttribute('aria-label', showing ? '显示 Session' : '隐藏 Session');
      input.focus();
    });

    $('#tll-session-paste').addEventListener('click', async () => {
      try {
        const value = await navigator.clipboard.readText();
        if (!value.trim()) {
          setStatus(root, '剪贴板为空，没有可粘贴的内容。', 'error');
          return;
        }
        const input = $('#tll-session-value');
        input.value = value.trim();
        input.type = 'password';
        $('#tll-session-visible').textContent = '显示';
        $('#tll-session-visible').title = '显示 Session';
        $('#tll-session-visible').setAttribute('aria-label', '显示 Session');
        setStatus(root, '已从剪贴板粘贴 Session，仅保留在当前页面内存中。', 'success');
        input.focus();
      } catch (error) {
        setStatus(root, `读取剪贴板失败：${error?.message || String(error)}。也可以直接在输入框中粘贴。`, 'error');
      }
    });

    $('#tll-promo-clear').addEventListener('click', async () => {
      $('#tll-promo').value = '';
      await api.storage.local.remove('promo');
      $('#tll-promo').focus();
    });

    $('#tll-promo-paste').addEventListener('click', async () => {
      try {
        const value = await navigator.clipboard.readText();
        if (!value.trim()) {
          setStatus(root, '剪贴板为空，没有可粘贴的优惠码。', 'error');
          return;
        }
        $('#tll-promo').value = value.trim();
        $('#tll-promo').focus();
        setStatus(root, '已从剪贴板粘贴优惠码。', 'success');
      } catch (error) {
        setStatus(root, `读取剪贴板失败：${error?.message || String(error)}。也可以直接在优惠码输入框中粘贴。`, 'error');
      }
    });

    $('#tll-session-clear').addEventListener('click', () => {
      const input = $('#tll-session-value');
      input.value = '';
      input.type = 'password';
      $('#tll-session-visible').textContent = '显示';
      $('#tll-session-visible').title = '显示 Session';
      $('#tll-session-visible').setAttribute('aria-label', '显示 Session');
      input.focus();
    });

    $('#tll-session-open').addEventListener('click', () => {
      window.open(SESSION_URL, '_blank', 'noopener,noreferrer');
    });

    $('#tll-session-copy-url').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(SESSION_URL);
      } catch {
        const input = document.createElement('textarea');
        input.value = SESSION_URL;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
      }
      setStatus(root, 'Session 获取地址已复制，请在已登录账号的浏览器中打开。', 'success');
    });

    $('#tll-collapse').addEventListener('click', async () => {
      if (!root.classList.contains('tll-collapsed')) closePriceModal();
      const collapsed = root.classList.toggle('tll-collapsed');
      $('#tll-collapse').textContent = collapsed ? '□' : '−';
      $('#tll-collapse').title = collapsed ? '展开' : '收起';
      $('#tll-collapse').setAttribute('aria-label', collapsed ? '展开面板' : '收起面板');
      await api.storage.local.set({ panelCollapsed: collapsed });
    });

    $('#tll-close').addEventListener('click', () => {
      api.storage.local.set({ panelHidden: true });
      root.remove();
      panelRoot = null;
    });

    $('#tll-form').addEventListener('submit', async event => {
      event.preventDefault();
      checkoutUrl = '';
      $('#tll-result').hidden = true;
      $('#tll-generate').disabled = true;
      $('#tll-generate').textContent = '生成中…';
      const useManualSession = $('#tll-manual-session').checked;
      setStatus(root, useManualSession
        ? '正在使用手动 Session 创建结账链接…'
        : '正在读取当前登录会话并创建结账链接…');
      try {
        const workspace = $('#tll-workspace').value.trim();
        const seats = Number($('#tll-seats').value);
        const country = resolveCountry(false);
        const currency = $('#tll-currency').value;
        const promoCode = normalizePromoCode($('#tll-promo').value);
        const accessToken = useManualSession ? extractAccessToken($('#tll-session-value').value) : '';
        if (!workspace || workspace.length > 80) throw new Error('工作区名称长度应为 1–80 个字符。');
        if (!Number.isInteger(seats) || seats < 2 || seats > 999) throw new Error('席位数必须是 2–999 的整数。');
        if (!country || !currency) throw new Error('请从搜索结果中选择国家，货币会自动匹配。');

        const payload = {
          entry_point: 'team_workspace_purchase_modal',
          plan_name: 'chatgptteamplan',
          team_plan_data: {
            workspace_name: workspace,
            price_interval: $('#tll-interval').value,
            seat_quantity: seats
          },
          billing_details: { country, currency },
          cancel_url: promoCode
            ? `https://chatgpt.com/?promoCode=${encodeURIComponent(promoCode)}`
            : 'https://chatgpt.com/',
          checkout_ui_mode: 'hosted',
          ...(promoCode ? { promo_code: promoCode } : {})
        };

        const url = await requestCheckout(payload, accessToken);
        if (!isAllowedCheckoutUrl(url)) throw new Error('返回的链接域名不在安全白名单中。');
        checkoutUrl = url;
        $('#tll-result-url').value = url;
        $('#tll-result').hidden = false;
        await api.storage.local.set({
          workspace,
          seats: String(seats),
          interval: $('#tll-interval').value,
          country,
          promo: $('#tll-promo').value.trim()
        });
        setStatus(root, '生成成功，请在官方结账页核对最终价格。', 'success');
      } catch (error) {
        setStatus(root, `生成失败：${error?.message || String(error)}`, 'error');
      } finally {
        $('#tll-generate').disabled = false;
        $('#tll-generate').textContent = '生成链接';
      }
    });

    $('#tll-copy').addEventListener('click', async () => {
      if (!checkoutUrl) return;
      try {
        await navigator.clipboard.writeText(checkoutUrl);
      } catch {
        $('#tll-result-url').select();
        document.execCommand('copy');
      }
      setStatus(root, '链接已复制。', 'success');
    });

    $('#tll-open').addEventListener('click', () => {
      if (checkoutUrl) window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    });

    api.storage.local.get([
      'workspace', 'seats', 'interval', 'country', 'promo', 'panelCollapsed', 'panelPosition'
    ]).then(saved => {
      if (saved.workspace) $('#tll-workspace').value = saved.workspace;
      if (saved.seats) $('#tll-seats').value = saved.seats;
      if (saved.interval) $('#tll-interval').value = saved.interval;
      const savedCountry = COUNTRIES.find(([code]) => code === saved.country);
      selectCountry(savedCountry || COUNTRIES[0]);
      if (saved.promo) $('#tll-promo').value = saved.promo;
      if (saved.panelCollapsed) {
        root.classList.add('tll-collapsed');
        $('#tll-collapse').textContent = '□';
        $('#tll-collapse').title = '展开';
        $('#tll-collapse').setAttribute('aria-label', '展开面板');
      }
      if (saved.panelPosition
        && Number.isFinite(saved.panelPosition.left)
        && Number.isFinite(saved.panelPosition.top)) {
        root.style.right = 'auto';
        root.style.left = `${Math.max(8, Math.min(saved.panelPosition.left, window.innerWidth - root.offsetWidth - 8))}px`;
        root.style.top = `${Math.max(8, Math.min(saved.panelPosition.top, window.innerHeight - 70))}px`;
      }
    }).catch(error => setStatus(root, `读取设置失败：${error?.message || String(error)}`, 'error'));

    makeDraggable(root);
  }

  function mountPanel() {
    if (panelRoot?.isConnected) {
      panelRoot.hidden = false;
      panelRoot.querySelector('#tll-workspace')?.focus({ preventScroll: true });
      return panelRoot;
    }
    panelRoot = document.createElement('div');
    panelRoot.id = 'tll-root';
    panelRoot.innerHTML = panelMarkup();
    (document.body || document.documentElement).appendChild(panelRoot);
    bindPanel(panelRoot);
    return panelRoot;
  }

  api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'teamCheckoutLink:show') return undefined;
    api.storage.local.set({ panelHidden: false });
    mountPanel();
    sendResponse({ ok: true });
    return false;
  });

  api.storage.local.get(['panelHidden']).then(saved => {
    if (!saved.panelHidden) mountPanel();
  });
})();
