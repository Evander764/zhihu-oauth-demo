import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/oauth-callback.js';

function response() {
  return { headers: {}, code: null, body: '', setHeader(k,v){this.headers[k]=v;},
    status(code){this.code=code;return this;}, send(body){this.body=body;return this;} };
}

test('callback uses all five authorized-user APIs and never returns credentials', async () => {
  const originalFetch = globalThis.fetch;
  const env = { ZHIHU_OAUTH_APP_ID:'661', ZHIHU_OAUTH_APP_KEY:'fixture-app-key',
    ZHIHU_ACCESS_SECRET:'fixture-platform-secret', ZHIHU_OAUTH_REDIRECT_URI:'https://demo.example.com/auth/callback',
    ZHIHU_OAUTH_CALLBACK_REGISTERED:'true' };
  const saved = Object.fromEntries(Object.keys(env).map(key=>[key,process.env[key]]));
  Object.assign(process.env,env);
  const requested=[];
  globalThis.fetch=async (url,options)=>{
    const parsed=new URL(url);requested.push(parsed.pathname);
    if(parsed.pathname==='/access_token')return {ok:true,json:async()=>({access_token:'fixture-oauth-token'})};
    assert.equal(options.headers['X-OAuth-Token'],'fixture-oauth-token');
    return {ok:true,json:async()=>parsed.pathname==='/user'?{data:{name:'测试账号'}}:{Code:0,Data:{Items:[{Title:'示例内容',UrlToken:42}]}}};
  };
  try {
    const out=response();
    await handler({url:'/auth/callback?authorization_code=fixture-code&state=nonce',headers:{host:'demo.example.com',cookie:'zhihu_oauth_state=nonce'}},out);
    assert.equal(out.code,200);
    assert.equal(requested.filter(path=>path.startsWith('/api/v1/user/')).length,5);
    assert.ok(out.body.includes('5 项成功'));
    for(const value of ['fixture-app-key','fixture-platform-secret','fixture-oauth-token','fixture-code'])assert.ok(!out.body.includes(value));
    const mismatch=response();requested.length=0;
    await handler({url:'/auth/callback?authorization_code=fixture-code&state=wrong',headers:{host:'demo.example.com',cookie:'zhihu_oauth_state=nonce'}},mismatch);
    assert.equal(mismatch.code,400);assert.equal(requested.length,0);
  } finally {
    globalThis.fetch=originalFetch;
    for(const [key,value] of Object.entries(saved)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
  }
});
