import { configuration } from '../lib/oauth.js';

export default function handler(_request, response) {
  const { checks, ready } = configuration();
  response.setHeader('Cache-Control', 'no-store');
  response.status(200).json({ ok: true, ready, checks });
}
