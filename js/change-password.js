// change-password.js

window.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  const params  = new URLSearchParams(window.location.search);
  const isFirst = params.get('first') === '1' || !!(currentUser && currentUser.must_change_password);

  document.getElementById('cp-title').textContent    = isFirst ? 'Set New Password'         : 'Change Password';
  document.getElementById('cp-subtitle').textContent = isFirst ? 'Welcome! Please set a new password.' : 'Update your account password';
  document.getElementById('cp-current-group').style.display = isFirst ? 'none'   : 'block';
  document.getElementById('cp-back-btn').style.display      = isFirst ? 'none'   : 'flex';
  document.getElementById('cp-btn').textContent             = isFirst ? 'Set Password' : 'Update Password';
});

function cpBack() {
  if (!currentUser) { window.location.href = 'login.html'; return; }
  if (currentUser.role === 'teacher') window.location.href = 'teacher-dashboard.html';
  else if (currentUser.role === 'student') window.location.href = 'student-dashboard.html';
  else window.location.href = 'login.html';
}

async function doChangePassword() {
  showErr('cp-err', '');
  const params  = new URLSearchParams(window.location.search);
  const isFirst = params.get('first') === '1' || !!(currentUser && currentUser.must_change_password);
  const cur  = document.getElementById('cp-current').value;
  const nw   = document.getElementById('cp-new').value;
  const conf = document.getElementById('cp-confirm').value;

  if (!isFirst && !cur) { showErr('cp-err', 'Enter current password'); return; }
  if (!nw)              { showErr('cp-err', 'Enter a new password'); return; }
  if (nw.length < 6)   { showErr('cp-err', 'New password must be 6+ characters'); return; }
  if (nw !== conf)      { showErr('cp-err', "Passwords don't match"); return; }

  const label = isFirst ? 'Set Password' : 'Update Password';
  setLoading('cp-btn', true, label);
  try {
    await apiFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: isFirst ? '' : cur, new_password: nw })
    });
    if (currentUser) {
      currentUser.must_change_password = false;
      localStorage.setItem('auth_user', JSON.stringify(currentUser));
    }
    alert('Password updated!');
    if (currentUser?.role === 'teacher')      window.location.href = 'teacher-dashboard.html';
    else if (currentUser?.role === 'student') window.location.href = 'student-dashboard.html';
    else window.location.href = 'login.html';
  } catch(e) {
    showErr('cp-err', e.message);
  } finally {
    setLoading('cp-btn', false, label);
  }
}
