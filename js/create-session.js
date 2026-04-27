// create-session.js

let csSem     = '5';
let csDiv     = 'A';
let csLecture = '';

window.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('teacher')) return;
  initCreateSession();
});

function initCreateSession() {
  csSem = '5'; csDiv = 'A';
  const courses = currentUser?.courses || [];
  csLecture = courses[0] || '';

  buildPills('cs-sem-pills', SEMESTERS, () => csSem, v => csSem = v);
  buildPills('cs-div-pills', DIVISIONS, () => csDiv, v => csDiv = v);

  const area = document.getElementById('cs-courses-area');
  if (!courses.length) {
    area.innerHTML = `<div style="padding:14px;background:#FEF3C7;border-radius:10px;margin-top:8px">
      <div class="small">You haven't added any courses yet.
        Go to <a href="teacher-dashboard.html" style="color:var(--brand);font-weight:600">Dashboard → My Courses</a> to add.
      </div></div>`;
  } else {
    area.innerHTML = '<div class="radio-group">' + courses.map(c =>
      `<div class="radio-opt${c === csLecture ? ' active' : ''}" onclick="selectCsLecture('${c}', this)">
        <div class="radio-dot"></div>
        <div class="radio-label">${c}</div>
      </div>`).join('') + '</div>';
  }

  showErr('cs-err', '');
  setLoading('cs-btn', false, 'Create & Continue');
}

function selectCsLecture(val, el) {
  csLecture = val;
  document.querySelectorAll('#cs-courses-area .radio-opt').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
}

async function doCreateSession() {
  showErr('cs-err', '');
  if (!csLecture) { showErr('cs-err', 'Select a course'); return; }
  const from   = document.getElementById('cs-from').value.trim();
  const to     = document.getElementById('cs-to').value.trim();
  const timeRe = /^([01]?\d|2[0-3]):[0-5]\d$/;
  if (!timeRe.test(from) || !timeRe.test(to)) { showErr('cs-err', 'Time must be HH:MM'); return; }

  setLoading('cs-btn', true, 'Creating...');
  try {
    const data = await apiFetch('/sessions', {
      method: 'POST',
      body: JSON.stringify({
        semester:  csSem,
        division:  csDiv,
        lecture:   csLecture,
        time_from: from,
        time_to:   to
      })
    });
    window.location.href = `session-detail.html?id=${data.id}`;
  } catch(e) {
    showErr('cs-err', e.message);
  } finally {
    setLoading('cs-btn', false, 'Create & Continue');
  }
}
