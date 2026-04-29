// ─────────────────────────────────────────────
//  shared.js  –  API helpers, auth, utilities
// ─────────────────────────────────────────────

// ✅ SET YOUR BACKEND URL HERE (no trailing slash)
window.BACKEND_URL = 'http://65.0.91.196:8000';

// ─── CONSTANTS ───────────────────────────────
const BRANCHES  = ['CSE','ISE','ECE','EEE','ME','CV','AIDS','AIML'];
const SEMESTERS = ['1','2','3','4','5','6','7','8'];
const DIVISIONS = ['A','B','C','D'];

// ─── STATE ───────────────────────────────────
let authToken   = localStorage.getItem('auth_token');
let currentUser = JSON.parse(localStorage.getItem('auth_user') || 'null');

// ─── AUTH HELPERS ────────────────────────────
function setAuth(token, user) {
  authToken   = token;
  currentUser = user;
  localStorage.setItem('auth_token',  token);
  localStorage.setItem('auth_user', JSON.stringify(user));
}

function doLogout() {
  authToken   = null;
  currentUser = null;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  window.location.href = 'login.html';
}

// ─── API ─────────────────────────────────────
function getBase() {
  return window.BACKEND_URL || localStorage.getItem('backend_url') || '';
}

async function apiFetch(path, opts = {}) {
  const base = getBase();
  if (!base) { window.location.href = 'config.html'; throw new Error('No backend URL'); }
  const url = base + '/api' + path;
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
  const res  = await fetch(url, { ...opts, headers });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) {
    const d = data.detail;
    if (Array.isArray(d))        throw new Error(d.map(e => e.msg || JSON.stringify(e)).join(' '));
    if (typeof d === 'string')   throw new Error(d);
    if (d && d.msg)              throw new Error(d.msg);
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

async function apiDownload(path, filename) {
  const base = getBase();
  const res  = await fetch(base + '/api' + path, {
    headers: { 'Authorization': 'Bearer ' + authToken }
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// ─── UI HELPERS ──────────────────────────────
function setLoading(btnId, loading, text) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading ? '<span class="spinner"></span>' : text;
}

function showErr(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg || '';
  el.style.display = msg ? 'block' : 'none';
}

function buildPills(containerId, options, getCurrentVal, onSelect) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = '';
  options.forEach(opt => {
    const b = document.createElement('button');
    b.className = 'pill' + (opt === getCurrentVal() ? ' active' : '');
    b.textContent = opt;
    b.onclick = () => {
      onSelect(opt);
      buildPills(containerId, options, getCurrentVal, onSelect);
    };
    c.appendChild(b);
  });
}

function buildFilterPills(containerId, options, getVal, onSelect) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = '';
  options.forEach(opt => {
    const b = document.createElement('button');
    b.className = 'filter-pill' + (opt === getVal() ? ' active' : '');
    b.textContent = opt;
    b.onclick = () => {
      onSelect(opt);
      buildFilterPills(containerId, options, getVal, onSelect);
    };
    c.appendChild(b);
  });
}

// ─── ROUTE AFTER LOGIN ───────────────────────
function routeAfterLogin(user) {
  if (user.role === 'admin') {
    window.location.href = 'admin-dashboard.html';
  } else if (user.role === 'teacher') {
    if (user.must_change_password) {
      window.location.href = 'change-password.html?first=1';
    } else {
      window.location.href = 'teacher-dashboard.html';
    }
  } else {
    if (!user.face_registered) {
      window.location.href = 'face-capture.html';
    } else {
      window.location.href = 'student-dashboard.html';
    }
  }
}

// ─── AUTH GUARD (call at top of protected pages) ──
function requireAuth(role) {
  if (!authToken || !currentUser) {
    window.location.href = 'login.html';
    return false;
  }
  if (role && currentUser.role !== role) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}
