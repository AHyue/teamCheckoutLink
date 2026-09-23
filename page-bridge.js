(() => {
  'use strict';

  const script = document.currentScript;
  const channel = script ? new URL(script.src).searchParams.get('channel') : '';
  script?.remove();
  if (!channel) return;

  window.addEventListener('message', async event => {
    const message = event.data;
    if (event.source !== window || message?.source !== channel
      || !['checkout-request', 'price-config-request'].includes(message?.type)) return;

    const responseType = message.type === 'price-config-request'
      ? 'price-config-response'
      : 'checkout-response';

    const reply = payload => window.postMessage({
      source: channel,
      type: responseType,
      requestId: message.requestId,
      ...payload
    }, window.location.origin);

    try {
      if (message.type === 'price-config-request') {
        const countryCodes = [...new Set((message.payload?.countryCodes || [])
          .map(value => String(value || '').trim().toUpperCase())
          .filter(value => /^[A-Z]{2}$/.test(value)))];
        if (!countryCodes.length) throw new Error('没有可请求的国家代码。');

        const results = await Promise.allSettled(countryCodes.map(async countryCode => {
          const response = await fetch(`/backend-api/checkout_pricing_config/configs/${countryCode}`, {
            credentials: 'include',
            cache: 'no-store',
            headers: { Accept: 'application/json' }
          });
          const text = await response.text();
          let data = null;
          try { data = JSON.parse(text); } catch { /* Include the response in the error below. */ }
          if (!response.ok) {
            const body = (data ? JSON.stringify(data) : text.trim()).slice(0, 300);
            throw new Error(`${countryCode}请求失败（HTTP ${response.status}）${body ? `：${body}` : ''}`);
          }
          if (!data?.currency_config) throw new Error(`${countryCode}返回中没有 currency_config。`);
          return { countryCode, data };
        }));

        const configs = results
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);
        const failed = results
          .filter(result => result.status === 'rejected')
          .map(result => result.reason?.message || String(result.reason));
        if (!configs.length) throw new Error(failed[0] || '官方价格配置没有返回有效数据。');
        reply({ ok: true, data: { configs, failed } });
        return;
      }

      let accessToken = typeof message.accessToken === 'string' ? message.accessToken.trim() : '';
      const manualSession = Boolean(accessToken);
      if (!manualSession) {
        const sessionResponse = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store'
        });
        if (!sessionResponse.ok) throw new Error(`读取登录会话失败（HTTP ${sessionResponse.status}）`);
        const session = await sessionResponse.json();
        accessToken = String(session?.accessToken || '').trim();
        if (!accessToken) throw new Error('当前页面没有可用登录会话；请登录 ChatGPT，或开启手动 Session 模式。');
      }

      const response = await fetch('/backend-api/payments/checkout', {
        method: 'POST',
        credentials: manualSession ? 'omit' : 'include',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message.payload)
      });

      const text = await response.text();
      let data = null;
      try { data = JSON.parse(text); } catch { /* Keep the original text for the error message. */ }
      if (!response.ok) {
        const detailValue = data?.detail ?? data?.error?.message ?? data?.error ?? data?.message;
        const detail = typeof detailValue === 'string'
          ? detailValue
          : detailValue
            ? JSON.stringify(detailValue)
            : '服务器没有提供错误说明。';
        const responseBody = (data ? JSON.stringify(data, null, 2) : text.trim())
          .slice(0, 2000);
        const lines = [
          `请求失败（HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}）`,
          `错误信息：${detail}`
        ];
        if (responseBody) lines.push(`服务器响应：\n${responseBody}`);
        throw new Error(lines.join('\n'));
      }

      const url = data?.url || data?.stripe_hosted_url || data?.checkout_url;
      if (!url) throw new Error('接口返回中没有结账链接。');
      reply({ ok: true, url });
    } catch (error) {
      reply({ ok: false, error: error?.message || String(error) });
    }
  });
})();
