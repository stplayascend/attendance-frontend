// admin-dashboard.js

const ADM_SEMESTERS = ['All','1','2','3','4','5','6','7','8'];
const ADM_DIVISIONS = ['All','A','B','C','D'];

let adminTab      = 'pending';
let adminSemFilter = 'All';
let adminDivFilter = 'All';
let viewingTeacher = null;
let editingStudent = null;
let deleteTarget   = null;

window.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return;
  buildFilterPil  ls('admin-sem-pills', ADM_SEMESTERS, () => adminSemFilter, v => { adminSemFilter = v; loadAdminTab(); });
  buildFilterPills('admin-div-pills', ADM_DIVISIONS, () => adminDivFilter, v => { adminDivFilter = v; loadAdminTab(); });
  loadAdminTab();
});

// ─── TABS ───────────────────────────────────
function setAdminTab(tab) {
  adminTab = tab;
  ['pending', 'approved', 'students'].forEach(t => {
    document.getElementById('admin-tab-' + t).classList.toggle('active', t === tab);
  });
  document.getElementById('admin-student-filters').style.display = tab === 'students' ? 'block' : 'none';
  buildFilterPills('admin-sem-pills', ADM_SEMESTERS, () => adminSemFilter, v => {
  adminSemFilter = v;
  buildFilterPills('admin-sem-pills', ADM_SEMESTERS, () => adminSemFilter, arguments.callee);
  loadAdminTab();
  });
  
  buildFilterPills('admin-div-pills', ADM_DIVISIONS, () => adminDivFilter, v => {
    adminDivFilter = v;
    buildFilterPills('admin-div-pills', ADM_DIVISIONS, () => adminDivFilter, arguments.callee);
    loadAdminTab();
  });

  loadAdminTab();
}

// ─── LOAD TAB ───────────────────────────────
async function loadAdminTab() {
  const list = document.getElementById('admin-list');
  list.innerHTML = '<div class="empty-state"><i class="fa fa-circle-notch fa-spin"></i></div>';
  try {
    if (adminTab === 'students') {
      const qs = [];
      if (adminSemFilter !== 'All') qs.push('semester=' + adminSemFilter);
      if (adminDivFilter !== 'All') qs.push('division=' + adminDivFilter);
      const students = await apiFetch('/admin/students' + (qs.length ? '?' + qs.join('&') : ''));
      if (!students.length) {
        list.innerHTML = '<div class="empty-state"><span>No students</span></div>';
      } else {
        list.innerHTML = students.map(s => `
          <div class="row-item" style="gap:8px">
            <div style="flex:1;cursor:pointer"
                 onclick='openEditStudent(${JSON.stringify(s).replace(/"/g, "&quot;")})'>
              <div style="font-size:15px;font-weight:500">${s.name}</div>
              <div class="small">${s.usn} · ${s.branch || '—'} · Sem ${s.semester} · Div ${s.division}</div>
            </div>
            <button class="icon-btn"
                    onclick='openEditStudent(${JSON.stringify(s).replace(/"/g, "&quot;")})' title="Edit">
              <i class="fa fa-edit"></i>
            </button>
            <button class="icon-btn"
                    onclick="openDeleteModal('student','${s.id}','${s.name} (${s.usn})')" title="Delete">
              <i class="fa fa-trash" style="color:var(--absent)"></i>
            </button>
          </div>`).join('');
      }
    } else {
      const status   = adminTab === 'pending' ? 'pending' : 'approved';
      const teachers = await apiFetch('/admin/teachers?status=' + status);
      if (!teachers.length) {
        list.innerHTML = `<div class="empty-state"><span>${adminTab === 'pending' ? 'No pending requests' : 'No approved teachers'}</span></div>`;
      } else {
        list.innerHTML = teachers.map(t => `
          <div class="teacher-card"
               onclick='openTeacherModal(${JSON.stringify(t).replace(/"/g, "&quot;")})'>
            ${t.id_photo_base64
              ? `<img class="id-thumb" src="data:image/jpeg;base64,${t.id_photo_base64}" alt="ID"/>`
              : `<div class="id-thumb-placeholder"><i class="fa fa-user"></i></div>`}
            <div style="flex:1">
              <div class="h3" style="font-size:16px">${t.name}</div>
              <div class="small">${t.employee_id} · ${t.email || ''}</div>
              ${t.courses?.length ? `<div class="small">${t.courses.length} course${t.courses.length > 1 ? 's' : ''}</div>` : ''}
            </div>
            <i class="fa fa-chevron-right" style="color:var(--text2)"></i>
          </div>`).join('');
      }
    }
  } catch(e) {
    list.innerHTML = `<div class="empty-state"><span style="color:var(--absent)">${e.message}</span></div>`;
  }
}

// ─── TEACHER MODAL ──────────────────────────
function openTeacherModal(t) {
  viewingTeacher = t;
  document.getElementById('tm-name').textContent   = t.name;
  document.getElementById('tm-empid').textContent  = 'Employee ID: ' + t.employee_id;
  document.getElementById('tm-email').textContent  = 'Email: ' + (t.email || '—');
  document.getElementById('tm-status').textContent = 'Status: ' + t.status;

  const cs = document.getElementById('tm-courses-section');
  if (t.courses?.length) {
    cs.style.display = 'block';
    document.getElementById('tm-courses-list').innerHTML =
      t.courses.map(c => `<div style="font-size:15px;margin-top:4px">• ${c}</div>`).join('');
  } else cs.style.display = 'none';

  const ps = document.getElementById('tm-photo-section');
  if (t.id_photo_base64) {
    ps.style.display = 'block';
    document.getElementById('tm-photo').src = 'data:image/jpeg;base64,' + t.id_photo_base64;
  } else ps.style.display = 'none';

  const actions = document.getElementById('tm-actions');
  if (adminTab === 'pending') {
    actions.innerHTML = `
      <div class="btn-row" style="margin-top:20px">
        <button class="btn btn-secondary" onclick="adminReject()">
          <span style="color:var(--absent)">Reject</span>
        </button>
        <button class="btn btn-primary" onclick="adminApprove()">Approve</button>
      </div>`;
  } else {
    actions.innerHTML = `
      <button class="btn btn-secondary" style="margin-top:20px"
              onclick="openDeleteModal('teacher','${t.id}','${t.name} (${t.employee_id})')">
        <span style="color:var(--absent)">Delete Teacher</span>
      </button>`;
  }
  document.getElementById('teacher-modal').classList.add('open');
}

function closeTeacherModal() {
  document.getElementById('teacher-modal').classList.remove('open');
}

async function adminApprove() {
  try {
    const data = await apiFetch('/admin/teachers/' + viewingTeacher.id + '/approve', { method: 'POST' });
    alert(`${viewingTeacher.name} approved! Default password: ${data.default_password}. Email sent.`);
    closeTeacherModal();
    loadAdminTab();
  } catch(e) { alert(e.message); }
}

async function adminReject() {
  if (!confirm(`Reject ${viewingTeacher.name} (${viewingTeacher.employee_id})?`)) return;
  try {
    await apiFetch('/admin/teachers/' + viewingTeacher.id + '/reject', { method: 'POST' });
    closeTeacherModal();
    loadAdminTab();
  } catch(e) { alert(e.message); }
}

// ─── EDIT STUDENT MODAL ─────────────────────
function openEditStudent(s) {
  editingStudent = s;
  document.getElementById('es-usn').textContent    = s.usn;
  document.getElementById('es-name').value         = s.name;
  document.getElementById('es-email').value        = s.email  || '';
  document.getElementById('es-branch').value       = s.branch || '';
  document.getElementById('es-sem').value          = s.semester;
  document.getElementById('es-div').value          = s.division;
  document.getElementById('es-roll').value         = s.roll_number;
  document.getElementById('edit-student-modal').classList.add('open');
}

function closeEditStudentModal() {
  document.getElementById('edit-student-modal').classList.remove('open');
}

async function saveStudent() {
  if (!editingStudent) return;
  setLoading('es-save-btn', true, 'Save');
  try {
    await apiFetch('/admin/students/' + editingStudent.id, {
      method: 'PUT',
      body: JSON.stringify({
        name:        document.getElementById('es-name').value,
        email:       document.getElementById('es-email').value,
        branch:      document.getElementById('es-branch').value,
        semester:    document.getElementById('es-sem').value,
        division:    document.getElementById('es-div').value,
        roll_number: document.getElementById('es-roll').value,
      })
    });
    alert('Saved!');
    closeEditStudentModal();
    loadAdminTab();
  } catch(e) {
    alert(e.message);
  } finally {
    setLoading('es-save-btn', false, 'Save');
  }
}

// ─── DELETE MODAL ───────────────────────────
function openDeleteModal(kind, id, label) {
  deleteTarget = { kind, id, label };
  document.getElementById('del-title').textContent = `Delete ${kind}?`;
  document.getElementById('del-label').textContent = label;
  document.getElementById('del-reason').value      = '';
  document.getElementById('delete-modal').classList.add('open');
}

function closeDeleteModal() {
  document.getElementById('delete-modal').classList.remove('open');
}

async function confirmDelete() {
  if (!deleteTarget) return;
  const reason = document.getElementById('del-reason').value.trim() || 'Removed by admin';
  setLoading('del-confirm-btn', true, 'Delete');
  try {
    const url = deleteTarget.kind === 'teacher'
      ? '/admin/teachers/' + deleteTarget.id + '?reason=' + encodeURIComponent(reason)
      : '/admin/students/' + deleteTarget.id + '?reason=' + encodeURIComponent(reason);
    await apiFetch(url, { method: 'DELETE' });
    closeDeleteModal();
    closeTeacherModal();
    closeEditStudentModal();
    loadAdminTab();
  } catch(e) {
    alert(e.message);
  } finally {
    setLoading('del-confirm-btn', false, 'Delete');
  }
}
