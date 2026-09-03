import { randomBytes } from 'node:crypto';
import { authorizationUrl, configuration } from '../lib/oauth.js';

export default function handler(_request, response) {
  const { values, ready } = configuration();
  if (!ready) {
    response.status(503).json({ ok: false, error: 'OAuth 尚未配置完成。' });
    return;
  }

  const state = randomBytes(24).toString('base64url');
  response.setHeader('Set-Cookie', `zhihu_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
  response.redirect(302, authorizationUrl(values.ZHIHU_OAUTH_APP_ID, values.ZHIHU_OAUTH_REDIRECT_URI, state));
}
