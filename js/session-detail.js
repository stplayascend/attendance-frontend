// session-detail.js

let sessionData    = null;
let sessionAttRows = null;
let sessionImages  = [];   // base64 strings
let sessionSummary = null;

window.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('teacher')) return;
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { window.location.href = 'teacher-dashboard.html'; return; }
  loadSessionDetail(id);
});

// ─── LOAD ───────────────────────────────────
async function loadSessionDetail(id) {
  try {
    const sess = await apiFetch('/sessions/' + id);
    sessionData = sess;

    document.getElementById('sess-title').textContent    = sess.lecture;
    document.getElementById('sess-subtitle').textContent =
      `Sem ${sess.semester} · Div ${sess.division} · ${sess.date} · ${sess.time_from}–${sess.time_to}`;

    if (sess.status === 'completed') {
      document.getElementById('sess-status-badge').innerHTML =
        '<span class="status-badge" style="background:#D1FAE5;color:var(--present)">COMPLETED</span>';
      const studs  = await apiFetch('/sessions/' + id + '/students');
      const attMap = {};
      (sess.attendance || []).forEach(e => attMap[e.student_id] = e.status);
      sessionAttRows = studs.map(s => ({
        student_id: s.id, name: s.name, usn: s.usn,
        roll_number: s.roll_number,
        status: attMap[s.id] || 'absent',
        similarity: null
      }));
      sessionAttRows.sort((a, b) => String(a.roll_number).localeCompare(String(b.roll_number)));
      renderSessionAttendance();
    } else {
      renderSessionCapture();
    }
  } catch(e) {
    document.getElementById('sess-body').innerHTML =
      `<div class="empty-state"><span style="color:var(--absent)">${e.message}</span></div>`;
  }
}

// ─── CAPTURE VIEW ───────────────────────────
function renderSessionCapture() {
  const body = document.getElementById('sess-body');
  body.innerHTML = `
    <div class="label" style="margin-top:16px">Classroom photos (${sessionImages.length}/5)</div>
    <div class="thumbs-grid" id="sess-thumbs"></div>
    <button class="btn btn-primary" style="margin-top:24px" id="sess-recognize-btn"
            onclick="runRecognize()" ${!sessionImages.length ? 'disabled' : ''}>
      Run Face Recognition
    </button>
    <div style="text-align:center;padding:14px">
      <button class="link" onclick="loadRosterManually()">Or take attendance manually →</button>
    </div>`;
  renderThumbs();
}

function renderThumbs() {
  const c = document.getElementById('sess-thumbs');
  if (!c) return;

  let html = sessionImages.map((b64, i) => `
    <div class="thumb-wrap">
      <img class="thumb" src="data:image/jpeg;base64,${b64}"/>
      <button class="thumb-remove" onclick="removeSessionImage(${i})">
        <i class="fa fa-times"></i>
      </button>
    </div>`).join('');

  if (sessionImages.length < 5) {
    html += `
      <label class="add-tile" style="cursor:pointer">
        <i class="fa fa-camera"></i><span>Camera</span>
        <input type="file" accept="image/*" capture="environment" style="display:none"
               onchange="addSessionImage(event)"/>
      </label>
      <label class="add-tile" style="cursor:pointer">
        <i class="fa fa-image"></i><span>Gallery</span>
        <input type="file" accept="image/*" multiple style="display:none"
               onchange="addSessionImages(event)"/>
      </label>`;
  }
  c.innerHTML = html;

  const lbl = c.previousElementSibling;
  if (lbl) lbl.textContent = `Classroom photos (${sessionImages.length}/5)`;
  const btn = document.getElementById('sess-recognize-btn');
  if (btn) btn.disabled = !sessionImages.length;
}

function addSessionImage(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader  = new FileReader();
  reader.onload = e => {
    sessionImages = [...sessionImages, e.target.result.split(',')[1]].slice(0, 5);
    renderThumbs();
  };
  reader.readAsDataURL(file);
}

function addSessionImages(evt) {
  const files  = Array.from(evt.target.files).slice(0, 5 - sessionImages.length);
  let loaded   = 0;
  const newImgs = [];
  files.forEach(file => {
    const reader  = new FileReader();
    reader.onload = e => {
      newImgs.push(e.target.result.split(',')[1]);
      loaded++;
      if (loaded === files.length) {
        sessionImages = [...sessionImages, ...newImgs].slice(0, 5);
        renderThumbs();
      }
    };
    reader.readAsDataURL(file);
  });
}

function removeSessionImage(idx) {
  sessionImages.splice(idx, 1);
  renderSessionCapture();
}

async function runRecognize() {
  const btn = document.getElementById('sess-recognize-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Recognizing…'; }
  try {
    const data = await apiFetch('/sessions/' + sessionData.id + '/recognize', {
      method: 'POST',
      body: JSON.stringify({ images_base64: sessionImages, threshold: 0.4 })
    });
    sessionAttRows = data.attendance;
    sessionSummary = {
      detected: data.total_faces_detected,
      matched:  data.total_matched,
      total:    data.total_students
    };
    renderSessionAttendance();
  } catch(e) {
    alert('Recognition failed: ' + e.message);
    if (btn) { btn.disabled = false; btn.innerHTML = 'Run Face Recognition'; }
  }
}

async function loadRosterManually() {
  try {
    const studs    = await apiFetch('/sessions/' + sessionData.id + '/students');
    sessionAttRows = studs.map(s => ({
      student_id: s.id, name: s.name, usn: s.usn,
      roll_number: s.roll_number, status: 'absent', similarity: null
    }));
    sessionAttRows.sort((a, b) => String(a.roll_number).localeCompare(String(b.roll_number)));
    sessionSummary = { detected: 0, matched: 0, total: sessionAttRows.length };
    renderSessionAttendance();
  } catch(e) { alert(e.message); }
}

// ─── ATTENDANCE VIEW ─────────────────────────
function renderSessionAttendance() {
  const isCompleted  = sessionData?.status === 'completed';
  const presentCount = sessionAttRows?.filter(r => r.status === 'present').length ?? 0;
  let html = '';

  if (sessionSummary) {
    html += `<div class="summary-card">
      <div class="summary-item">
        <div class="summary-num">${sessionSummary.detected}</div>
        <div class="small">Detected</div>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <div class="summary-num" style="color:var(--present)">${presentCount}</div>
        <div class="small">Present</div>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <div class="summary-num">${sessionSummary.total}</div>
        <div class="small">Total</div>
      </div>
    </div>`;
  }

  html += '<div class="label" style="margin-top:16px">Review &amp; edit</div>';

  if (!sessionAttRows || !sessionAttRows.length) {
    html += `<div class="empty-state" style="padding:20px 0">
      <span>No students enrolled in Sem ${sessionData.semester} Div ${sessionData.division}.</span>
    </div>`;
  } else {
    html += sessionAttRows.map((r, i) => `
      <div class="att-row">
        <div style="flex:1">
          <div style="font-size:15px;font-weight:500">${r.name}</div>
          <div class="small">${r.usn} · Roll ${r.roll_number}${r.similarity != null ? ' · sim ' + r.similarity.toFixed(2) : ''}</div>
        </div>
        <span class="badge ${r.status}" style="margin-right:8px">${r.status.toUpperCase()}</span>
        <label class="toggle-wrap">
          <input type="checkbox" ${r.status === 'present' ? 'checked' : ''}
                 onchange="toggleAttRow(${i}, this.checked)"/>
          <span class="toggle-slider"></span>
        </label>
      </div>`).join('');
  }

  if (isCompleted) {
    html += `<button class="btn btn-secondary" style="margin-top:16px" onclick="exportSessionCsv()">
      <i class="fa fa-download"></i> Export CSV
    </button>`;
  }

  document.getElementById('sess-body').innerHTML = html;

  if (sessionAttRows && sessionAttRows.length > 0) {
    const bar = document.getElementById('sess-bottom-bar');
    bar.style.display = 'block';
    document.getElementById('sess-save-btn').textContent =
      (isCompleted ? 'Save Changes' : 'Save Attendance') + ` (${presentCount}/${sessionAttRows.length})`;
  }
}

function toggleAttRow(idx, checked) {
  if (!sessionAttRows) return;
  sessionAttRows[idx].status = checked ? 'present' : 'absent';
  const presentCount = sessionAttRows.filter(r => r.status === 'present').length;
  const isCompleted  = sessionData?.status === 'completed';
  document.getElementById('sess-save-btn').textContent =
    (isCompleted ? 'Save Changes' : 'Save Attendance') + ` (${presentCount}/${sessionAttRows.length})`;
}

async function saveAttendance() {
  if (!sessionAttRows) return;
  const btn = document.getElementById('sess-save-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  try {
    await apiFetch('/sessions/' + sessionData.id + '/save-attendance', {
      method: 'POST',
      body: JSON.stringify({
        entries: sessionAttRows.map(r => ({ student_id: r.student_id, status: r.status }))
      })
    });
    alert('Attendance saved & students notified.');
    window.location.href = 'teacher-dashboard.html';
  } catch(e) {
    alert('Save failed: ' + e.message);
    btn.disabled = false;
    btn.textContent = 'Save Attendance';
  }
}

async function exportSessionCsv() {
  try {
    const fname = `attendance_${sessionData.lecture.replace(/\s+/g, '_')}_${sessionData.date}.csv`;
    await apiDownload('/sessions/' + sessionData.id + '/export', fname);
  } catch(e) { alert(e.message); }
}
