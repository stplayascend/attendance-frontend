// student-register.js

let srBranch = 'CSE';
let srSem    = '5';
let srDiv    = 'A';

window.addEventListener('DOMContentLoaded', () => {
  buildPills('sr-branch-pills', BRANCHES,  () => srBranch, v => srBranch = v);
  buildPills('sr-sem-pills',    SEMESTERS, () => srSem,    v => srSem    = v);
  buildPills('sr-div-pills',    DIVISIONS, () => srDiv,    v => srDiv    = v);
});

async function doStudentRegister() {
  showErr('sr-err', '');
  const name  = document.getElementById('sr-name').value.trim();
  const usn   = document.getElementById('sr-usn').value.trim().toUpperCase();
  const email = document.getElementById('sr-email').value.trim();
  const roll  = document.getElementById('sr-roll').value.trim();
  const pw    = document.getElementById('sr-pw').value;

  if (!name || !usn || !email || !roll || !pw) {
    showErr('sr-err', 'Please fill all required fields'); return;
  }
  if (pw.length < 6) {
    showErr('sr-err', 'Password must be 6+ characters'); return;
  }

  setLoading('sr-btn', true, 'Continue to Face Capture →');
  try {
    const data = await apiFetch('/auth/register-student', {
      method: 'POST',
      body: JSON.stringify({
        name, usn, email,
        roll_number: roll,
        branch: srBranch,
        semester: srSem,
        division: srDiv,
        password: pw
      })
    });
    setAuth(data.token, data.user);
    window.location.href = 'face-capture.html';
  } catch(e) {
    showErr('sr-err', e.message);
  } finally {
    setLoading('sr-btn', false, 'Continue to Face Capture →');
  }
}
