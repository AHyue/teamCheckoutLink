'use strict';

const api = globalThis.browser || globalThis.chrome;
const $ = id => document.getElementById(id);

function isSupportedSiteUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'chatgpt.com';
  } catch {
    return false;
  }
}

async function activeTab() {
  const tabs = await api.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function ensurePanel(tabId) {
  try {
    await api.tabs.sendMessage(tabId, { type: 'teamCheckoutLink:show' });
    return;
  } catch {
    await api.scripting.insertCSS({ target: { tabId }, files: ['content.css'] });
    await api.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
    await api.tabs.sendMessage(tabId, { type: 'teamCheckoutLink:show' });
  }
}

async function refreshState() {
  const tab = await activeTab();
  const supported = Boolean(tab?.id && isSupportedSiteUrl(tab.url));
  $('showPanel').hidden = !supported;
  $('openSite').hidden = supported;
  $('status').textContent = supported
    ? '当前是支持的官网页面，可显示或恢复悬浮工具。'
    : '请先打开支持的官网页面并登录。';
  $('status').className = supported ? 'status' : 'status error';
}

$('showPanel').addEventListener('click', async () => {
  $('showPanel').disabled = true;
  try {
    const tab = await activeTab();
    if (!tab?.id || !isSupportedSiteUrl(tab.url)) throw new Error('当前页面不是支持的官网。');
    await ensurePanel(tab.id);
    window.close();
  } catch (error) {
    $('status').textContent = `无法显示：${error?.message || String(error)}`;
    $('status').className = 'status error';
    $('showPanel').disabled = false;
  }
});

$('openSite').addEventListener('click', async () => {
  await api.storage.local.set({ panelHidden: false });
  await api.tabs.create({ url: 'https://chatgpt.com/' });
});

refreshState().catch(error => {
  $('status').textContent = `检查失败：${error?.message || String(error)}`;
  $('status').className = 'status error';
});
