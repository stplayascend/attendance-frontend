let editCourses = []; // [{name, code}]
let allSessions = [];

window.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('teacher')) return;
  loadTeacherDashboard();
});

// Backwards-compat: old data may have courses as ["X","Y"] strings
function normalizeCourses(arr) {
  return (arr || []).map(c =>
    typeof c === 'string' ? { name: c, code: '' } : { name: c.name||'', code: c.code||'' }
  );
}

async function loadTeacherDashboard() {
  document.getElementById('td-name').textContent  = currentUser.name        || '';
  document.getElementById('td-empid').textContent = currentUser.employee_id || '';

  const list = document.getElementById('td-course-list');
  list.innerHTML = '<div class="empty-state"><i class="fa fa-circle-notch fa-spin"></i></div>';

  try {
    // refresh teacher profile so courses are up to date
    const me = await apiFetch('/teachers/me');
    currentUser.courses = normalizeCourses(me.courses);
    localStorage.setItem('auth_user', JSON.stringify(currentUser));

    allSessions = await apiFetch('/sessions');

    renderCourseFolders();
    updateTeacherCourseDisplay();
  } catch(e) {
    list.innerHTML = `<div class="empty-state"><span style="color:var(--absent)">${e.message}</span></div>`;
  }
}

function updateTeacherCourseDisplay() {
  const courses = currentUser?.courses || [];
  document.getElementById('td-course-count').textContent = courses.length;
  document.getElementById('td-courses-preview').textContent =
    courses.length ? courses.map(c => c.name + (c.code?` (${c.code})`:'')).join(' · ')
                   : 'Tap to add courses';
}

function renderCourseFolders() {
  const list = document.getElementById('td-course-list');
  const courses = currentUser?.courses || [];
  if (!courses.length) {
    list.innerHTML = `<div class="empty-state" style="padding:40px 24px">
       <i class="fa fa-book"></i>
       <span style="text-align:center;margin-top:8px">No courses yet. Tap "My Courses" to add.</span></div>`;
    return;
  }
  // count of sessions per course (matched by lecture name)
  const countByName = {};
  allSessions.forEach(s => {
    countByName[s.lecture] = (countByName[s.lecture] || 0) + 1;
  });

  list.innerHTML = courses.map(c => {
    const total = countByName[c.name] || 0;
    return `
    <div class="row-item" style="cursor:pointer"
         onclick="window.location.href='course-sessions.html?name=${encodeURIComponent(c.name)}&code=${encodeURIComponent(c.code||'')}'">
      <div style="flex:1">
        <div class="h3" style="font-size:16px">${c.name}</div>
        <div class="small">${c.code ? c.code + ' · ' : ''}Total classes conducted: <b>${total}</b></div>
      </div>
      <i class="fa fa-chevron-right" style="color:var(--text2)"></i>
    </div>`;
  }).join('');
}

// ─── COURSES MODAL (now name + code) ─────────
function openCoursesModal() {
  editCourses = (currentUser?.courses || []).map(c => ({...c}));
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
    const row = document.createElement('div');
    row.className = 'course-row';
    row.innerHTML = `
      <input class="input" placeholder="Course ${i + 1} name" value="${val.name||''}"
             oninput="editCourses[${i}].name = this.value"/>
      <input class="input" placeholder="Code" value="${val.code||''}"
             style="max-width:120px;text-transform:uppercase"
             oninput="editCourses[${i}].code = this.value.toUpperCase()"/>
      <button class="trash-btn" onclick="editCourses.splice(${i},1);renderCoursesModal()">
        <i class="fa fa-trash"></i>
      </button>`;
    c.appendChild(row);
  });
}
function addCourseInput() {
  editCourses.push({name:'',code:''});
  renderCoursesModal();
}
async function saveCourses() {
  setLoading('save-courses-btn', true, 'Save');
  try {
    const cleaned = editCourses
      .filter(c => (c.name||'').trim())
      .map(c => ({ name: c.name.trim(), code: (c.code||'').trim().toUpperCase() }));
    await apiFetch('/teachers/me/courses', {
      method: 'PUT',
      body: JSON.stringify({ courses: cleaned })
    });
    currentUser.courses = cleaned;
    localStorage.setItem('auth_user', JSON.stringify(currentUser));
    updateTeacherCourseDisplay();
    renderCourseFolders();
    closeCoursesModal();
  } catch(e) {
    alert(e.message);
  } finally {
    setLoading('save-courses-btn', false, 'Save');
  }
}
