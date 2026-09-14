# 知路 · 知乎 OAuth 联调站

一个部署在 Vercel 的最小知乎 OAuth Authorization Code Flow Demo。

本版本接入小组 App 661，复用 https://zhihu-oauth-demo.vercel.app/ 。待向知乎核对并登记的完整回调是 https://zhihu-oauth-demo.vercel.app/auth/callback 。旧的 `/api/oauth-callback` 路径继续兼容。

凭证配置与真实授权分开验收：确认回调已登记后，才启用授权按钮。授权返回后读取创作、关注、收藏夹、收藏夹内容、近期收藏五类公开数据，每类最多一条，分别报告成功、空数据或失败。

## 必需环境变量

| 名称 | 用途 | 是否进入浏览器 |
|---|---|---|
| `ZHIHU_OAUTH_APP_ID` | 知乎发放的应用 ID | 会出现在授权跳转 URL |
| `ZHIHU_OAUTH_APP_KEY` | OAuth 应用密钥 | 否 |
| `ZHIHU_ACCESS_SECRET` | 知乎开放平台调用凭证 | 否 |
| `ZHIHU_OAUTH_REDIRECT_URI` | 完整 HTTPS 回调地址 | 会出现在授权跳转 URL |
| `ZHIHU_OAUTH_CALLBACK_REGISTERED` | 真实回调登记确认后设为 `true`；缺省为未登记 | 仅返回确认状态 |

回调地址格式：

```text
https://zhihu-oauth-demo.vercel.app/auth/callback
```

## 本地检查

```bash
npm test
npm run check
```

## 安全边界

- OAuth Token 只在回调函数的一次请求中使用，不写入 Cookie、localStorage 或数据库。
- 回调兼容知乎实测的 `authorization_code` 参数和旧式 `code` 参数。
- 如果知乎没有回传 `state`，页面会明确标记为“仅适合临时联调”。在平台闭合 `state`、PKCE、scope、撤销与刷新协议前，不把此 Demo 当作生产身份系统。
- Git 仓库只保存环境变量名称，不保存任何凭证值。

接入取舍、验证方式、版面审计和回退说明见 [App 661 接入记录](docs/app-661-integration.md)。
