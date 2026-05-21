// student-dashboard.js

window.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('student')) return;
  loadStudentDashboard();
});

async function loadStudentDashboard() {
  document.getElementById('sd-name').textContent = currentUser.name || '';
  document.getElementById('sd-info').textContent =
    [currentUser.usn, currentUser.branch, 'Sem ' + currentUser.semester, 'Div ' + currentUser.division]
      .filter(Boolean).join(' · ');
  document.getElementById('sd-face-banner').style.display =
    currentUser.face_registered ? 'none' : 'flex';

  document.getElementById('sd-list').innerHTML =
    '<div class="empty-state"><i class="fa fa-circle-notch fa-spin"></i></div>';

  try {
    const data    = await apiFetch('/attendance/student');
    const pct     = data.percentage || 0;
    const pctEl   = document.getElementById('sd-pct');
    pctEl.textContent = pct.toFixed(1) + '%';
    pctEl.style.color = pct >= 75 ? 'var(--present)' : pct >= 50 ? 'var(--warning)' : 'var(--absent)';

    document.getElementById('sd-present').textContent = data.present || 0;
    document.getElementById('sd-absent').textContent  = data.absent  || 0;
    document.getElementById('sd-total').textContent   = data.total   || 0;

    const records = data.records || [];
    const list    = document.getElementById('sd-list');
    if (!records.length) {
      list.innerHTML = '<div class="empty-state"><i class="fa fa-inbox"></i><span>No attendance records yet</span></div>';
    } else {
      list.innerHTML = records.map(r => `
        <div class="row-item">
          <div style="flex:1">
            <div style="font-size:15px;font-weight:500">${r.lecture}</div>
            <div class="small">${r.date} · ${r.time_from}–${r.time_to}</div>
          </div>
          <div class="badge ${r.status}">${r.status.toUpperCase()}</div>
        </div>`).join('');
    }
  } catch(e) {
    document.getElementById('sd-list').innerHTML =
      `<div class="empty-state"><span style="color:var(--absent)">${e.message}</span></div>`;
  }
}
