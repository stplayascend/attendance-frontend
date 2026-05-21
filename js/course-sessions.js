
const CS_SEMESTERS = ['All','1','2','3','4','5','6','7','8'];
const CS_DIVISIONS = ['All','A','B','C','D'];

let csCourseName = '';
let csCourseCode = '';
let csSem = 'All';
let csDiv = 'All';
let csAll = [];           
let csMergeMode = false;
let csSelected = new Set();

window.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('teacher')) return;
  const params = new URLSearchParams(location.search);
  csCourseName = params.get('name') || '';
  csCourseCode = params.get('code') || '';
  document.getElementById('cs-title').textContent = csCourseName;
  document.getElementById('cs-sub').textContent   = csCourseCode || '—';

  buildFilterPills('cs-sem-pills', CS_SEMESTERS, () => csSem, v => { csSem = v; render(); });
  buildFilterPills('cs-div-pills', CS_DIVISIONS, () => csDiv, v => { csDiv = v; render(); });

  load();
});

async function load() {
  const list = document.getElementById('cs-list');
  list.innerHTML = '<div class="empty-state"><i class="fa fa-circle-notch fa-spin"></i></div>';
  try {
    const all = await apiFetch('/sessions');
    csAll = all.filter(s => s.lecture === csCourseName);
    render();
  } catch(e) {
    list.innerHTML = `<div class="empty-state"><span style="color:var(--absent)">${e.message}</span></div>`;
  }
}

function filtered() {
  return csAll.filter(s =>
    (csSem === 'All' || String(s.semester) === csSem) &&
    (csDiv === 'All' || String(s.division) === csDiv)
  );
}

function render() {
  const list = document.getElementById('cs-list');
  const items = filtered();

  if (!items.length) {
    list.innerHTML = `<div class="empty-state" style="padding:40px 24px">
      <i class="fa fa-calendar"></i>
      <span style="text-align:center;margin-top:8px">No sessions for this filter.</span></div>`;
    return;
  }

  list.innerHTML = items.map(s => {
    const checked = csSelected.has(s.id) ? 'checked' : '';
    const checkbox = csMergeMode
      ? `<input type="checkbox" ${checked} onchange="toggleSel('${s.id}', this.checked)"
                style="width:20px;height:20px;margin-right:10px"/>`
      : '';
    const click = csMergeMode
      ? ''
      : `onclick="window.location.href='session-detail.html?id=${s.id}'"`;
    return `
      <div class="row-item" style="cursor:${csMergeMode?'default':'pointer'}" ${click}>
        ${checkbox}
        <div style="flex:1">
          <div class="h3" style="font-size:16px">${s.lecture}</div>
          <div class="small">Sem ${s.semester} · Div ${s.division} · ${s.date}</div>
          <div class="small">${s.time_from} – ${s.time_to}</div>
        </div>
        <span class="pill-badge ${s.status}">${s.status}</span>
      </div>`;
  }).join('');
  document.getElementById('cs-sel-count').textContent = csSelected.size;
}

function enterMergeMode() {
  csMergeMode = true;
  csSelected.clear();
  document.getElementById('cs-bottom-bar').style.display = 'none';
  document.getElementById('cs-merge-bar').style.display  = 'flex';
  render();
}
function exitMergeMode() {
  csMergeMode = false;
  csSelected.clear();
  document.getElementById('cs-bottom-bar').style.display = 'flex';
  document.getElementById('cs-merge-bar').style.display  = 'none';
  render();
}
function toggleSel(id, checked) {
  if (checked) csSelected.add(id); else csSelected.delete(id);
  document.getElementById('cs-sel-count').textContent = csSelected.size;
}

async function exportMerged() {
  if (!csSelected.size) { alert('Select at least one session'); return; }
  setLoading('cs-export-btn', true, 'Export CSV');
  try {
    const fname = `attendance_${csCourseName.replace(/\s+/g,'_')}_merged.csv`;
    await apiDownloadPost('/sessions/export-merged',
      { session_ids: [...csSelected] }, fname);
    exitMergeMode();
  } catch(e) {
    alert(e.message);
  } finally {
    setLoading('cs-export-btn', false,
      `<i class="fa fa-download"></i> Export CSV (<span id="cs-sel-count">${csSelected.size}</span>)`);
  }
}
