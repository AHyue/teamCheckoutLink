'use strict';

const api = globalThis.browser || globalThis.chrome;
const RATE_URL = 'https://open.er-api.com/v6/latest/USD';

async function fetchJson(url, label) {
  const response = await fetch(url, { cache: 'no-store' });
  const text = await response.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* Include the text in the error below. */ }
  if (!response.ok) {
    const body = (data ? JSON.stringify(data) : text.trim()).slice(0, 500);
    throw new Error(`${label}请求失败（HTTP ${response.status}）${body ? `：${body}` : ''}`);
  }
  if (!data) throw new Error(`${label}返回的不是有效 JSON。`);
  return data;
}

async function loadPriceReference() {
  const rateData = await fetchJson(RATE_URL, '实时汇率');
  const cnyRate = Number(rateData?.rates?.CNY);
  if (!Number.isFinite(cnyRate) || cnyRate <= 0 || !rateData?.rates) {
    throw new Error('汇率响应缺少必要字段。');
  }
  return {
    cnyRate,
    usdRates: rateData.rates,
    rateDate: rateData.time_last_update_utc || null
  };
}

api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'teamCheckoutLink:load-price-reference') return undefined;
  loadPriceReference()
    .then(data => sendResponse({ ok: true, ...data }))
    .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
  return true;
});
