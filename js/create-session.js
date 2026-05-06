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
  // courses can be strings (legacy) or {name,code}
  const raw = currentUser?.courses || [];
  const courses = raw.map(c => typeof c === 'string' ? {name:c,code:''} : c);
  csLecture = courses[0]?.name || '';
  csCourseCode = courses[0]?.code || '';

  buildPills('cs-sem-pills', SEMESTERS, () => csSem, v => csSem = v);
  buildPills('cs-div-pills', DIVISIONS, () => csDiv, v => csDiv = v);

  const area = document.getElementById('cs-courses-area');
  if (!courses.length) {
    area.innerHTML = `<div class="small">No courses. Add them in Dashboard.</div>`;
  } else {
    area.innerHTML = '<div class="radio-list">' + courses.map((c,i) =>
      `<div class="radio-opt ${i===0?'active':''}"
            onclick="selectCsLecture('${c.name.replace(/'/g,"\\'")}','${(c.code||'').replace(/'/g,"\\'")}', this)">
         ${c.name}${c.code?` <span class="small">(${c.code})</span>`:''}
       </div>`
    ).join('') + '</div>';
  }
  showErr('cs-err','');
  setLoading('cs-btn', false, 'Create & Continue');
}

function selectCsLecture(name, code, el) {
  csLecture    = name;
  csCourseCode = code;
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
