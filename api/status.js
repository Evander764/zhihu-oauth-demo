import { configuration } from '../lib/oauth.js';

export default function handler(_request, response) {
  const { values, checks, ready, configured, callbackRegistered } = configuration();
  response.setHeader('Cache-Control', 'no-store');
  response.status(200).json({ ok: true, ready, configured, callbackRegistered, checks,
    appId: values.ZHIHU_OAUTH_APP_ID || null,
    redirectUri: checks.redirectUri ? values.ZHIHU_OAUTH_REDIRECT_URI : null,
    authorized: false, sessionMode: 'single_callback_request', interfaceCount: 5,
  });
}
