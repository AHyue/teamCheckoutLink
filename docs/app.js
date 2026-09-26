'use strict';

const translations = {
  zh: {
    pageTitle: 'Team Checkout Link — 简体中文',
    pageDescription: 'Team Checkout Link 是一个独立开源浏览器扩展，提供同页中英切换。',
    navFeatures: '功能', navPrivacy: '隐私', navSource: '源代码', installChrome: '安装 Chrome 版', installFirefox: '安装 Firefox 版', viewSource: '查看 GitHub 源码',
    eyebrow: '独立开源浏览器扩展 · Chrome 与 Firefox 版已上架',
    heroTitleLead: '工作区结账链接，', heroTitleAccent: '清晰、快捷、由你掌控。',
    heroDescription: '在受支持的工作区网页中填写结账参数，按需生成托管结账链接，并查看地区价格与汇率换算参考。扩展提供中文界面，Session 功能默认关闭。',
    heroNote: 'Chrome 与 Firefox 商店版本：1.0.0。其他商店链接将在确认发布后补充。',
    mockWorkspace: '工作区', mockSeats: '席位', mockRegion: '地区', mockPrice: '参考价格', mockEstimate: '仅供估算', mockButton: '生成结账链接', mockFooter: '付款前请在结账页核对最终金额', chipSearch: '国家与货币自动匹配', chipSession: 'Session 默认关闭',
    featuresEyebrow: '为主动操作而设计', featuresTitle: '简单的流程，清楚的边界。', featuresIntro: '面板只在受支持的网页中工作；生成请求由用户主动发起。',
    featurePanelTitle: '页面内浮动面板', featurePanelText: '可拖动、收起或关闭，在填写工作区信息时保持页面上下文。',
    featureRegionTitle: '地区与价格参考', featureRegionText: '搜索地区，货币自动匹配；参考价按人民币排序，最终金额以结账页为准。',
    featureSessionTitle: '由用户控制的 Session', featureSessionText: '手动 Session 模式默认关闭。认证令牌只在用户主动生成链接时使用，不保存到扩展存储。',
    featureRateTitle: '有缓存的汇率换算', featureRateText: '汇率本地缓存 24 小时；手动刷新每小时最多 3 次，失败后至少等待 1 小时再试。',
    stepsEyebrow: '快速开始', stepsTitle: '三步完成操作。', stepsIntro: '扩展不会自动付款。生成链接后，请自行检查结账页面中的资格、币种、税费和金额。', readGuide: '阅读完整使用说明',
    stepOneTitle: '安装并打开受支持的网页', stepOneText: 'Chrome 版可从 Chrome 网上应用店安装，Firefox 版可从 Firefox Add-ons 安装；然后访问支持的工作区网页。',
    stepTwoTitle: '填写结账参数', stepTwoText: '选择工作区、席位、付款周期、地区和可选优惠码；普通登录会话为默认方式。',
    stepThreeTitle: '检查并继续', stepThreeText: '点击生成后检查返回的结账页面。请勿分享 Session，也不要在不确定时完成付款。',
    privacyEyebrow: '隐私与数据', privacyTitle: '数据只用于你发起的功能。',
    privacyText: '生成结账链接时，认证令牌和填写的结账参数会发送到目标网站的结账接口。扩展维护者不接收这些值；汇率服务只收到通用汇率请求。表单偏好和汇率缓存保存在浏览器本地。',
    privacyPolicy: '阅读隐私政策', githubRepo: 'GitHub 项目', privacySideFirst: '不自动付款', privacySideSecond: '不保存 Session',
    closingEyebrow: 'Chrome + Firefox · 版本 1.0.0', closingTitle: '准备好开始了吗？',
    footerDisclaimer: '独立开源项目，与目标网站或支付服务提供方无关联，也未获其认可。'
  },
  en: {
    pageTitle: 'Team Checkout Link — English',
    pageDescription: 'Team Checkout Link is an independent open-source browser extension with an in-page language switch.',
    navFeatures: 'Features', navPrivacy: 'Privacy', navSource: 'Source', installChrome: 'Get it for Chrome', installFirefox: 'Get it for Firefox', viewSource: 'View on GitHub',
    eyebrow: 'Independent open-source extension · Available for Chrome and Firefox',
    heroTitleLead: 'Workspace checkout links, ', heroTitleAccent: 'clear, quick, and in your control.',
    heroDescription: 'Enter checkout details on supported workspace pages, request a hosted checkout link when you choose, and view regional price and exchange-rate estimates. The extension interface is currently in Chinese; Manual Session is off by default.',
    heroNote: 'Chrome Web Store and Firefox Add-ons versions: 1.0.0. Links for other stores will be added after publication is confirmed.',
    mockWorkspace: 'Workspace', mockSeats: 'Seats', mockRegion: 'Region', mockPrice: 'Reference price', mockEstimate: 'Estimate only', mockButton: 'Generate checkout link', mockFooter: 'Verify the final amount on the checkout page', chipSearch: 'Automatic country and currency match', chipSession: 'Manual Session off by default',
    featuresEyebrow: 'Designed for user-initiated actions', featuresTitle: 'A simple flow with clear boundaries.', featuresIntro: 'The panel runs only on supported pages; users initiate link-generation requests.',
    featurePanelTitle: 'Floating in-page panel', featurePanelText: 'Move, collapse, or close the panel while keeping the workspace page in context.',
    featureRegionTitle: 'Regional price reference', featureRegionText: 'Search regions with automatic currency matching. Estimates are sorted by CNY; final amounts come from checkout.',
    featureSessionTitle: 'Session stays user-controlled', featureSessionText: 'Manual Session mode is off by default. Authentication tokens are used only when you request a link and are not saved in extension storage.',
    featureRateTitle: 'Cached exchange-rate estimates', featureRateText: 'Rates are cached locally for 24 hours. Manual refresh is limited to three times per hour; failed requests wait at least one hour before retrying.',
    stepsEyebrow: 'Quick start', stepsTitle: 'Three steps to get started.', stepsIntro: 'The extension does not make payments. Check eligibility, currency, taxes, and the final amount on the checkout page.', readGuide: 'Read the full user guide',
    stepOneTitle: 'Install and open a supported page', stepOneText: 'Install the Chrome version from the Chrome Web Store or the Firefox version from Firefox Add-ons, then visit a supported workspace page.',
    stepTwoTitle: 'Enter checkout details', stepTwoText: 'Choose a workspace, seats, billing interval, region, and optional promo code. The signed-in session is the default.',
    stepThreeTitle: 'Review before continuing', stepThreeText: 'Inspect the returned checkout page after generating a link. Do not share your Session or complete a purchase unless you are sure.',
    privacyEyebrow: 'Privacy and data', privacyTitle: 'Data is used for actions you initiate.',
    privacyText: 'When you request a checkout link, the authentication token and entered checkout details are sent to the target website’s checkout endpoint. The extension developer does not receive these values; the exchange-rate service receives only a generic rate request. Form preferences and rate cache are stored locally in your browser.',
    privacyPolicy: 'Read the privacy policy', githubRepo: 'GitHub repository', privacySideFirst: 'No automatic payments', privacySideSecond: 'Session is not stored',
    closingEyebrow: 'Chrome + Firefox · Version 1.0.0', closingTitle: 'Ready to get started?',
    footerDisclaimer: 'An independent open-source project. Not affiliated with or endorsed by the target website or payment providers.'
  }
};

function applyLanguage(language) {
  const copy = translations[language] || translations.zh;
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
  document.title = copy.pageTitle;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = copy.pageDescription;

  document.querySelectorAll('[data-copy]').forEach(element => {
    const value = copy[element.dataset.copy];
    if (value !== undefined) element.textContent = value;
  });
  document.querySelectorAll('[data-language]').forEach(button => {
    const active = button.dataset.language === language;
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', button.dataset.language === 'en' ? 'English' : '简体中文');
  });
  const guideLink = document.querySelector('[data-guide-link]');
  if (guideLink) guideLink.href = language === 'en' ? 'https://github.com/AHyue/teamCheckoutLink/blob/main/README.en.md#use' : 'https://github.com/AHyue/teamCheckoutLink#使用';

  const url = new URL(window.location.href);
  if (language === 'en') url.searchParams.set('lang', 'en');
  else url.searchParams.delete('lang');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

const requestedLanguage = new URLSearchParams(window.location.search).get('lang');
applyLanguage(requestedLanguage === 'en' ? 'en' : 'zh');

document.querySelectorAll('[data-language]').forEach(button => {
  button.addEventListener('click', () => applyLanguage(button.dataset.language));
});
