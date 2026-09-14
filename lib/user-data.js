import { fetchJson } from './oauth.js';

export const interfaces = [
  { id: 'contents', name: '我的创作', endpoint: '/api/v1/user/contents' },
  { id: 'followees', name: '我的关注', endpoint: '/api/v1/user/followees' },
  { id: 'favlists', name: '收藏夹', endpoint: '/api/v1/user/favlists' },
  { id: 'favlist_contents', name: '收藏夹内容', endpoint: '/api/v1/user/favlist_contents' },
  { id: 'collections', name: '近期收藏', endpoint: '/api/v1/user/collections' },
];

export async function readUserData(headers, requestJson = fetchJson) {
  if (!headers['X-OAuth-Token']) throw new Error('缺少用户授权，不能改用开发者本人数据。');
  const results = [];
  let favlistToken;
  for (const definition of interfaces) {
    if (definition.id === 'favlist_contents' && !favlistToken) {
      const parent = results.find(item => item.id === 'favlists');
      results.push({ ...definition, status: parent?.status === 'empty' ? 'empty' : 'error', item: null,
        message: parent?.status === 'empty' ? '账号没有可供测试的收藏夹。' : '未取得有效收藏夹标识，无法验证此项。' });
      continue;
    }
    const query = { Limit: '1' };
    if (definition.id === 'contents') Object.assign(query, { ContentType: 'all', Offset: '0', SortField: 'ts', SortOrder: 'desc' });
    if (definition.id === 'followees') query.Offset = '0';
    if (definition.id === 'favlist_contents') Object.assign(query, { FavlistUrlToken: String(favlistToken), Offset: '0' });
    try {
      const payload = await requestJson(`https://developer.zhihu.com${definition.endpoint}?${new URLSearchParams(query)}`, { headers }, 8000);
      if (payload?.Code !== 0) throw new Error(`接口返回错误码 ${Number.isFinite(payload?.Code) ? payload.Code : 'unknown'}`);
      if (!Array.isArray(payload?.Data?.Items)) throw new Error('接口缺少预期的数据列表。');
      const item = payload.Data.Items[0] || null;
      if (definition.id === 'favlists') favlistToken = item?.UrlToken;
      results.push({ ...definition, status: item ? 'success' : 'empty', item, message: item ? null : '请求成功，账号暂无此类公开数据。' });
    } catch (error) {
      results.push({ ...definition, status: 'error', item: null, message: error.name === 'AbortError' ? '请求超时，请稍后重新授权测试。' : '接口读取失败，请检查授权、额度与平台状态。' });
    }
  }
  return results;
}
