# 知路 · 知乎 OAuth 联调站

一个部署在 Vercel 的最小知乎 OAuth Authorization Code Flow Demo。

当前版本可以先在没有 OAuth 凭证的情况下上线，得到固定公网地址。将该地址的 `/api/oauth-callback` 登记为知乎 OAuth 回调地址，获批后再在 Vercel 配置环境变量，即可启用登录按钮。

## 必需环境变量

| 名称 | 用途 | 是否进入浏览器 |
|---|---|---|
| `ZHIHU_OAUTH_APP_ID` | 知乎发放的应用 ID | 会出现在授权跳转 URL |
| `ZHIHU_OAUTH_APP_KEY` | OAuth 应用密钥 | 否 |
| `ZHIHU_ACCESS_SECRET` | 知乎开放平台调用凭证 | 否 |
| `ZHIHU_OAUTH_REDIRECT_URI` | 完整 HTTPS 回调地址 | 会出现在授权跳转 URL |

回调地址格式：

```text
https://<你的 Vercel 域名>/api/oauth-callback
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
