'use strict';

const api = globalThis.browser || globalThis.chrome;
const RATE_URL = 'https://open.er-api.com/v6/latest/USD';
const RATE_CACHE_KEY = 'exchangeRateCacheV1';
const RATE_RETRY_AFTER_KEY = 'exchangeRateRetryAfter';
const RATE_MANUAL_ATTEMPTS_KEY = 'exchangeRateManualAttempts';
const RATE_CACHE_TTL = 24 * 60 * 60 * 1000;
const RATE_RETRY_COOLDOWN = 60 * 60 * 1000;
const RATE_MANUAL_WINDOW = 60 * 60 * 1000;
const RATE_MANUAL_LIMIT = 3;
let pendingRateRequest = null;

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

async function loadPriceReference(force = false) {
  const stored = await api.storage.local.get([
    RATE_CACHE_KEY,
    RATE_RETRY_AFTER_KEY,
    RATE_MANUAL_ATTEMPTS_KEY
  ]);
  const cached = stored[RATE_CACHE_KEY];
  const cachedAt = Number(cached?.cachedAt);
  const now = Date.now();
  const hasCachedRates = Number.isFinite(Number(cached?.cnyRate))
    && Number(cached.cnyRate) > 0
    && cached?.usdRates
    && typeof cached.usdRates === 'object'
    && Number.isFinite(Number(cached.usdRates.CNY))
    && Number(cached.usdRates.CNY) > 0;

  if (pendingRateRequest) return pendingRateRequest;
  if (!force && hasCachedRates && now - cachedAt >= 0 && now - cachedAt < RATE_CACHE_TTL) {
    return { ...cached, cached: true, stale: false };
  }

  const retryAfter = Number(stored[RATE_RETRY_AFTER_KEY]);
  if (retryAfter > now) {
    if (hasCachedRates) return { ...cached, cached: true, stale: true, retryBlocked: true };
    throw new Error('上次汇率请求失败，请至少等待 1 小时后再重试。');
  }

  const manualAttempts = (Array.isArray(stored[RATE_MANUAL_ATTEMPTS_KEY])
    ? stored[RATE_MANUAL_ATTEMPTS_KEY] : [])
    .map(Number)
    .filter(timestamp => Number.isFinite(timestamp) && timestamp <= now && now - timestamp < RATE_MANUAL_WINDOW);
  if (force && manualAttempts.length >= RATE_MANUAL_LIMIT) {
    const nextAllowedAt = Math.min(...manualAttempts) + RATE_MANUAL_WINDOW;
    const minutesRemaining = Math.max(1, Math.ceil((nextAllowedAt - now) / 60000));
    throw new Error(`手动刷新每小时最多 ${RATE_MANUAL_LIMIT} 次，请约 ${minutesRemaining} 分钟后再试。`);
  }

  pendingRateRequest = (async () => {
    try {
      if (force) {
        manualAttempts.push(now);
        await api.storage.local.set({ [RATE_MANUAL_ATTEMPTS_KEY]: manualAttempts });
      }
      const rateData = await fetchJson(RATE_URL, '实时汇率');
      const cnyRate = Number(rateData?.rates?.CNY);
      if (!Number.isFinite(cnyRate) || cnyRate <= 0 || !rateData?.rates) {
        throw new Error('汇率响应缺少必要字段。');
      }
      const result = {
        cnyRate,
        usdRates: rateData.rates,
        rateDate: rateData.time_last_update_utc || null,
        cachedAt: Date.now()
      };
      await api.storage.local.set({ [RATE_CACHE_KEY]: result, [RATE_RETRY_AFTER_KEY]: 0 });
      return { ...result, cached: false, stale: false };
    } catch (error) {
      await api.storage.local.set({ [RATE_RETRY_AFTER_KEY]: Date.now() + RATE_RETRY_COOLDOWN });
      if (hasCachedRates) {
        return { ...cached, cached: true, stale: true, retryBlocked: true, refreshError: error?.message || String(error) };
      }
      throw error;
    } finally {
      pendingRateRequest = null;
    }
  })();
  return pendingRateRequest;
}

api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'teamCheckoutLink:load-price-reference') return undefined;
  loadPriceReference(Boolean(message.force))
    .then(data => sendResponse({ ok: true, ...data }))
    .catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
  return true;
});
