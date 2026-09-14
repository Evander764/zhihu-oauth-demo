import { configuration, cookieValue, escapeHtml, fetchJson, oauthCode, safeEqual, tokenFrom } from '../lib/oauth.js';
import { readUserData } from '../lib/user-data.js';

function htmlPage({ title, message, profile, results = [], stateVerified, error = false }) {
  const profileBlock = profile ? `<section class="card"><p class="label">授权账号</p><h2>${escapeHtml(profile.name || profile.Fullname || '已授权知乎账号')}</h2><p>${escapeHtml(profile.headline || profile.Headline || '已取得公开账号信息')}</p></section>` : '';
  const contentBlock = results.map(result => `<section class="card"><p class="label">${escapeHtml(result.name)} · ${result.status === 'success' ? '成功' : result.status === 'empty' ? '空数据' : '失败'}</p><h2>${escapeHtml(result.item?.Title || result.item?.Fullname || result.name)}</h2><p>${escapeHtml(String(result.item?.Summary || result.item?.Headline || result.item?.Description || result.message || '已返回一条公开记录。').slice(0,600))}</p></section>`).join('');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} · 知路</title><style>body{margin:0;background:#f3f7fc;color:#10233f;font-family:"PingFang SC",sans-serif}.wrap{width:min(760px,calc(100% - 32px));margin:0 auto;padding:72px 0}.mark{display:grid;place-items:center;width:42px;height:42px;border-radius:12px 4px;background:#056de8;color:#fff;font:24px "Songti SC",serif;box-shadow:6px 6px 0 #c9ddff}h1{font:700 clamp(46px,8vw,76px)/1 "Songti SC",serif;letter-spacing:-.05em;margin:34px 0 18px}.lead{color:#60708a;font-size:18px;line-height:1.7}.flag{display:inline-flex;padding:8px 12px;border-radius:999px;background:${error ? '#fff0f0' : '#e7f6ef'};color:${error ? '#a43232' : '#137a55'};font-weight:700}.card{margin-top:20px;padding:26px;border:1px solid #dbe4ef;border-radius:22px 7px;background:#fff}.card h2{margin:8px 0;font-size:24px}.card p{color:#60708a;line-height:1.65}.label{font:700 11px ui-monospace,monospace;letter-spacing:.14em;color:#056de8!important;text-transform:uppercase}.note{margin-top:28px;color:#60708a;font-size:13px}.back{display:inline-flex;margin-top:28px;color:#0049a8;font-weight:700;text-underline-offset:5px}</style></head><body><main class="wrap"><div class="mark">知</div><h1>${escapeHtml(title)}</h1><p class="lead">${escapeHtml(message)}</p><span class="flag">${error ? '授权未完成' : '授权已完成'}</span>${profileBlock}${contentBlock}<p class="note">${stateVerified ? '本次回调已完成 state 校验。' : '知乎未返回 state，本次结果仅用于临时联调，不应直接作为生产登录依据。'} OAuth Token 未写入浏览器或持久化存储。</p><a class="back" href="/">返回联调站</a></main></body></html>`;
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; base-uri 'none'; frame-ancestors 'none'");
  response.setHeader('Set-Cookie', 'zhihu_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');

  try {
    const { values, ready } = configuration();
    if (!ready) throw new Error('OAuth 服务端配置不完整。');
    const url = new URL(request.url, `https://${request.headers.host}`);
    const code = oauthCode(url);
    if (!code) throw new Error('知乎回调中没有授权码。');

    const expectedState = cookieValue(request.headers.cookie, 'zhihu_oauth_state');
    if (!expectedState) throw new Error('授权会话已过期，请从本站重新开始。');
    const returnedState = url.searchParams.get('state');
    if (returnedState && !safeEqual(returnedState, expectedState)) throw new Error('授权请求关联校验失败。');

    const form = new URLSearchParams({
      app_id: values.ZHIHU_OAUTH_APP_ID,
      app_key: values.ZHIHU_OAUTH_APP_KEY,
      grant_type: 'authorization_code',
      redirect_uri: values.ZHIHU_OAUTH_REDIRECT_URI,
      code,
    });
    const tokenPayload = await fetchJson('https://openapi.zhihu.com/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    }, 12000);
    const token = tokenFrom(tokenPayload);
    if (!token) throw new Error('知乎没有返回可用的 Access Token。');

    const commonHeaders = {
      Authorization: `Bearer ${values.ZHIHU_ACCESS_SECRET}`,
      'X-OAuth-Token': token,
      'X-Request-Timestamp': String(Math.floor(Date.now() / 1000)),
      'Content-Type': 'application/json',
    };
    const [profilePayload, results] = await Promise.all([
      fetchJson('https://openapi.zhihu.com/user', { headers: commonHeaders }, 8000).catch(() => null),
      readUserData(commonHeaders),
    ]);
    const profile = profilePayload?.data || profilePayload?.Data || profilePayload?.user || null;
    const counts = status => results.filter(item => item.status === status).length;
    response.status(200).send(htmlPage({
      title: '知乎授权成功',
      message: `本次读取：${counts('success')} 项成功，${counts('empty')} 项空数据，${counts('error')} 项失败。每类最多读取一条；再次读取需要重新授权。`,
      profile,
      results,
      stateVerified: Boolean(returnedState),
    }));
  } catch (error) {
    response.status(400).send(htmlPage({
      title: '这次授权没有完成',
      message: String(error.message || 'OAuth 请求失败').slice(0, 180),
      stateVerified: false,
      error: true,
    }));
  }
}
