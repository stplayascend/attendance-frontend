// forgot-password.js

async function fpSendOtp() {
  showErr('fp-s1-err', '');
  const email = document.getElementById('fp-email').value.trim();
  if (!email) { showErr('fp-s1-err', 'Enter your email'); return; }
  setLoading('fp-send-btn', true, 'Send Code');
  try {
    await apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
    document.getElementById('fp-email-show').textContent = email;
    document.getElementById('fp-step1').style.display    = 'none';
    document.getElementById('fp-step2').style.display    = 'block';
    document.getElementById('fp-title').textContent      = 'Reset Password';
    document.getElementById('fp-subtitle').textContent   = 'Check your email for a 6-digit code';
  } catch(e) {
    showErr('fp-s1-err', e.message);
  } finally {
    setLoading('fp-send-btn', false, 'Send Code');
  }
}

async function fpReset() {
  showErr('fp-s2-err', '');
  const email = document.getElementById('fp-email').value.trim();
  const otp   = document.getElementById('fp-otp').value.trim();
  const pw    = document.getElementById('fp-newpw').value;
  if (!otp || otp.length < 6) { showErr('fp-s2-err', 'Enter the 6-digit code'); return; }
  if (pw.length < 6)          { showErr('fp-s2-err', 'Password must be 6+ characters'); return; }
  setLoading('fp-reset-btn', true, 'Reset Password');
  try {
    await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, new_password: pw })
    });
    alert('Password reset! You can now log in with the new password.');
    window.location.href = 'login.html';
  } catch(e) {
    showErr('fp-s2-err', e.message);
  } finally {
    setLoading('fp-reset-btn', false, 'Reset Password');
  }
}

function fpBack() {
  document.getElementById('fp-step1').style.display  = 'block';
  document.getElementById('fp-step2').style.display  = 'none';
  document.getElementById('fp-title').textContent    = 'Forgot Password';
  document.getElementById('fp-subtitle').textContent = 'Enter the email you registered with';
}
