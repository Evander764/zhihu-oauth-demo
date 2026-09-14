import { timingSafeEqual } from 'node:crypto';

export const requiredKeys = [
  'ZHIHU_OAUTH_APP_ID',
  'ZHIHU_OAUTH_APP_KEY',
  'ZHIHU_ACCESS_SECRET',
  'ZHIHU_OAUTH_REDIRECT_URI',
];

export function configuration(env = process.env) {
  const values = Object.fromEntries(requiredKeys.map((key) => [key, String(env[key] || '').trim()]));
  const checks = {
    appId: /^\d+$/.test(values.ZHIHU_OAUTH_APP_ID),
    appKey: Boolean(values.ZHIHU_OAUTH_APP_KEY),
    accessSecret: Boolean(values.ZHIHU_ACCESS_SECRET),
    redirectUri: isPublicCallback(values.ZHIHU_OAUTH_REDIRECT_URI),
  };
  const configured = Object.values(checks).every(Boolean);
  const callbackRegistered = env.ZHIHU_OAUTH_CALLBACK_REGISTERED === 'true';
  return { values, checks, configured, callbackRegistered, ready: configured && callbackRegistered };
}

export function isPublicCallback(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    const local = ['localhost', '::1', '0.0.0.0'].includes(host) || host.endsWith('.localhost') ||
      /^(127|10)\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
    return url.protocol === 'https:' && !local && !url.username && !url.password && !url.search && !url.hash &&
      ['/auth/callback', '/api/oauth-callback'].includes(url.pathname);
  } catch {
    return false;
  }
}

export function authorizationUrl(appId, redirectUri, state) {
  const url = new URL('https://openapi.zhihu.com/authorize');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('app_id', appId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);
  return url.toString();
}

export function cookieValue(cookieHeader, key) {
  const item = String(cookieHeader || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${key}=`));
  return item ? decodeURIComponent(item.slice(key.length + 1)) : '';
}

export function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function oauthCode(url) {
  return url.searchParams.get('authorization_code') || url.searchParams.get('code') || '';
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

export function tokenFrom(payload) {
  return payload?.access_token || payload?.data?.access_token || payload?.Data?.access_token || '';
}

export async function fetchJson(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`知乎接口返回 HTTP ${response.status}`);
    return payload;
  } finally {
    clearTimeout(timer);
  }
}
