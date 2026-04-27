// teacher-register.js

let trStep    = 1;
let trPhoto   = null;
let trCourses = ['', '', ''];

// ─── STEP NAVIGATION ────────────────────────
function showTrStep(n) {
  trStep = n;
  [1, 2, 3].forEach(i => {
    document.getElementById('tr-step' + i).style.display = i === n ? 'block' : 'none';
    document.getElementById('tr-dot-' + i).classList.toggle('active', i <= n);
  });
  const titles = ['', 'Basic info', 'Courses you teach', 'ID proof'];
  document.getElementById('tr-title').textContent    = 'Teacher Registration · Step ' + n + ' of 3';
  document.getElementById('tr-subtitle').textContent = titles[n];
}

function teacherRegNext(from) {
  if (from === 1) {
    const empId = document.getElementById('tr-empid').value.trim();
    const name  = document.getElementById('tr-name').value.trim();
    const email = document.getElementById('tr-email').value.trim();
    if (!empId || !name || !email) { showErr('tr-s1-err', 'Fill all fields'); return; }
    showErr('tr-s1-err', '');
    showTrStep(2);
  } else if (from === 2) {
    const filled = trCourses.filter(c => c.trim()).length;
    if (!filled) { showErr('tr-s2-err', 'Enter at least one course'); return; }
    showErr('tr-s2-err', '');
    showTrStep(3);
  }
}

function teacherRegBack() {
  if (trStep > 1) showTrStep(trStep - 1);
  else window.location.href = 'login.html';
}

// ─── COURSES ────────────────────────────────
function applyNumCourses(val) {
  const n = parseInt(val, 10);
  if (isNaN(n) || n < 1 || n > 20) return;
  const cur = trCourses.slice();
  trCourses = Array.from({ length: n }, (_, i) => cur[i] || '');
  renderTrCourses();
}

function renderTrCourses() {
  const c = document.getElementById('tr-courses-list');
  c.innerHTML = '';
  trCourses.forEach((val, i) => {
    const row       = document.createElement('div');
    row.className   = 'course-row';
    row.innerHTML   = `
      <input class="input" placeholder="Course ${i + 1}" value="${val}"
             oninput="trCourses[${i}] = this.value"/>
      <button class="trash-btn" onclick="trCourses.splice(${i},1);renderTrCourses()">
        <i class="fa fa-trash"></i>
      </button>`;
    c.appendChild(row);
  });
}

// ─── PHOTO ──────────────────────────────────
function handleTeacherPhoto(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader  = new FileReader();
  reader.onload = e => {
    trPhoto = e.target.result.split(',')[1];
    document.getElementById('tr-photo-preview').src = e.target.result;
    document.getElementById('tr-photo-preview').classList.remove('hidden');
    document.getElementById('tr-photo-placeholder').classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

// ─── SUBMIT ──────────────────────────────────
async function doTeacherRegister() {
  showErr('tr-s3-err', '');
  if (!trPhoto) { showErr('tr-s3-err', 'ID photo is required'); return; }
  const empId = document.getElementById('tr-empid').value.trim();
  const name  = document.getElementById('tr-name').value.trim();
  const email = document.getElementById('tr-email').value.trim();
  setLoading('tr-submit-btn', true, 'Submit');
  try {
    await apiFetch('/auth/register-teacher-request', {
      method: 'POST',
      body: JSON.stringify({
        employee_id:    empId,
        name, email,
        courses:        trCourses.filter(c => c.trim()),
        id_photo_base64: trPhoto
      })
    });
    [1, 2, 3].forEach(i => document.getElementById('tr-step' + i).style.display = 'none');
    document.getElementById('tr-done').style.display = 'block';
  } catch(e) {
    showErr('tr-s3-err', e.message);
  } finally {
    setLoading('tr-submit-btn', false, 'Submit');
  }
}

// ─── INIT ───────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  renderTrCourses();
});
