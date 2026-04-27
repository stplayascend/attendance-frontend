// login.js

// Redirect if already logged in
window.addEventListener('load', () => {
  if (authToken && currentUser) routeAfterLogin(currentUser);
});

async function doLogin() {
  showErr('login-err', '');
  const id = document.getElementById('login-id').value.trim();
  const pw = document.getElementById('login-pw').value;
  if (!id || !pw) { showErr('login-err', 'Enter your ID and password'); return; }
  setLoading('login-btn', true, 'Log In');
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: id, password: pw })
    });
    setAuth(data.token, data.user);
    routeAfterLogin(data.user);
  } catch(e) {
    showErr('login-err', e.message);
  } finally {
    setLoading('login-btn', false, 'Log In');
  }
}

// Enter key support
document.addEventListener('DOMContentLoaded', () => {
  const idEl = document.getElementById('login-id');
  const pwEl = document.getElementById('login-pw');
  if (pwEl) pwEl.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  if (idEl) idEl.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
});
