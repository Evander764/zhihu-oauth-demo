const byId = (id) => document.getElementById(id);

const nodes = {
  runtime: byId('runtime'),
  environment: document.querySelector('.environment'),
  login: byId('login'),
  pill: byId('status-pill'),
  callback: byId('callback-state'),
  app: byId('app-state'),
  secret: byId('secret-state'),
  note: byId('status-note'),
};

function setCheck(node, ready) {
  node.textContent = ready ? '已配置' : '待配置';
  node.className = ready ? 'ok' : 'missing';
}

async function loadStatus() {
  try {
    const response = await fetch('/api/status', { headers: { Accept: 'application/json' } });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error('状态接口不可用');

    setCheck(nodes.callback, data.checks.redirectUri);
    setCheck(nodes.app, data.checks.appId && data.checks.appKey);
    setCheck(nodes.secret, data.checks.accessSecret);

    if (data.ready) {
      nodes.runtime.textContent = 'OAuth 联调环境已就绪';
      nodes.environment.classList.add('ready');
      nodes.pill.textContent = '可以授权';
      nodes.pill.className = 'status-pill ready';
      nodes.note.textContent = '所有必要配置都在服务端。点击按钮后将前往知乎官方授权页。';
      nodes.login.textContent = '用知乎账号授权';
      nodes.login.href = '/api/oauth-start';
      nodes.login.classList.remove('disabled');
      nodes.login.removeAttribute('aria-disabled');
    } else if (data.configured && !data.callbackRegistered) {
      nodes.runtime.textContent = '等待知乎登记回调';
      nodes.pill.textContent = '待登记回调';
      nodes.pill.className = 'status-pill waiting';
      nodes.login.textContent = '等待回调登记';
      nodes.note.textContent = `请为知乎 App ${data.appId} 登记：${data.redirectUri}。登记确认后即可启用授权。`;
    } else {
      nodes.runtime.textContent = '网站已上线，等待 OAuth 凭证';
      nodes.pill.textContent = '等待配置';
      nodes.pill.className = 'status-pill waiting';
      nodes.note.textContent = '应用接入配置尚未完成，暂时无法授权。';
    }
  } catch (error) {
    nodes.runtime.textContent = '状态检查失败';
    nodes.pill.textContent = '服务异常';
    nodes.note.textContent = error.message;
  }
}

loadStatus();
