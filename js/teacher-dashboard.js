// teacher-dashboard.js

let editCourses = [];

window.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('teacher')) return;
  loadTeacherDashboard();
});

async function loadTeacherDashboard() {
  document.getElementById('td-name').textContent   = currentUser.name        || '';
  document.getElementById('td-empid').textContent  = currentUser.employee_id || '';
  updateTeacherCourseDisplay();

  document.getElementById('td-list').innerHTML =
    '<div class="empty-state"><i class="fa fa-circle-notch fa-spin"></i></div>';
  try {
    const sessions = await apiFetch('/sessions');
    const list     = document.getElementById('td-list');
    if (!sessions.length) {
      list.innerHTML = '<div class="empty-state" style="padding:40px 24px"><i class="fa fa-calendar"></i><span style="text-align:center;margin-top:8px">No sessions yet. Tap "Create New Session" to begin.</span></div>';
    } else {
      list.innerHTML = sessions.map(s => `
        <div class="row-item" style="cursor:pointer" onclick="window.location.href='session-detail.html?id=${s.id}'">
          <div style="flex:1">
            <div class="h3" style="font-size:16px">${s.lecture}</div>
            <div class="small">Sem ${s.semester} · Div ${s.division} · ${s.date}</div>
            <div class="small">${s.time_from} – ${s.time_to}</div>
          </div>
          <span class="pill-badge ${s.status}">${s.status}</span>
          <i class="fa fa-chevron-right" style="color:var(--text2);margin-left:8px"></i>
        </div>`).join('');
    }
  } catch(e) {
    document.getElementById('td-list').innerHTML =
      `<div class="empty-state"><span style="color:var(--absent)">${e.message}</span></div>`;
  }
}

function updateTeacherCourseDisplay() {
  const courses = currentUser?.courses || [];
  document.getElementById('td-course-count').textContent  = courses.length;
  document.getElementById('td-courses-preview').textContent =
    courses.length ? courses.join(' · ') : 'Tap to add courses';
}

// ─── COURSES MODAL ───────────────────────────
function openCoursesModal() {
  editCourses = [...(currentUser?.courses || [])];
  renderCoursesModal();
  document.getElementById('courses-modal').classList.add('open');
}

function closeCoursesModal() {
  document.getElementById('courses-modal').classList.remove('open');
}

function renderCoursesModal() {
  const c = document.getElementById('courses-modal-list');
  c.innerHTML = '';
  editCourses.forEach((val, i) => {
    const row      = document.createElement('div');
    row.className  = 'course-row';
    row.innerHTML  = `
      <input class="input" placeholder="Course ${i + 1}" value="${val}"
             oninput="editCourses[${i}] = this.value"/>
      <button class="trash-btn" onclick="editCourses.splice(${i},1);renderCoursesModal()">
        <i class="fa fa-trash"></i>
      </button>`;
    c.appendChild(row);
  });
}

function addCourseInput() {
  editCourses.push('');
  renderCoursesModal();
}

async function saveCourses() {
  setLoading('save-courses-btn', true, 'Save');
  try {
    await apiFetch('/teachers/me/courses', {
      method: 'PUT',
      body: JSON.stringify({ courses: editCourses.filter(c => c.trim()) })
    });
    currentUser.courses = editCourses.filter(c => c.trim());
    localStorage.setItem('auth_user', JSON.stringify(currentUser));
    updateTeacherCourseDisplay();
    closeCoursesModal();
  } catch(e) {
    alert(e.message);
  } finally {
    setLoading('save-courses-btn', false, 'Save');
  }
}
