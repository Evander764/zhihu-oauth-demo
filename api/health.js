export default function handler(_request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.status(200).json({ ok: true, project: 'zhihu-oauth-demo', release: 'hackathon-app-661-v1',
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null, oauthEnabled: true });
}
