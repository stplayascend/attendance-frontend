# AI Attendance – Split File Structure

## Project Layout

```
ai-attendance/
├── css/
│   └── shared.css              ← All shared styles (variables, components, layout)
├── js/
│   ├── shared.js               ← API helpers, auth, utility functions (load on every page)
│   ├── login.js
│   ├── student-register.js
│   ├── teacher-register.js
│   ├── forgot-password.js
│   ├── change-password.js
│   ├── student-dashboard.js
│   ├── face-capture.js
│   ├── teacher-dashboard.js
│   ├── create-session.js
│   ├── session-detail.js
│   └── admin-dashboard.js
└── pages/
    ├── login.html              ← Entry point / sign-in
    ├── student-register.html
    ├── teacher-register.html
    ├── forgot-password.html
    ├── change-password.html
    ├── student-dashboard.html
    ├── face-capture.html
    ├── teacher-dashboard.html
    ├── create-session.html
    ├── session-detail.html     ← Takes ?id=<sessionId> query param
    ├── admin-dashboard.html
    └── config.html             ← Backend URL setup (shown if no URL configured)
```

## Page / Interface Summary

| Page | Role | Description |
|------|------|-------------|
| `login.html` | All | Sign in with USN / Employee ID / admin |
| `student-register.html` | Student | New student sign up + branch/sem/div selection |
| `teacher-register.html` | Teacher | 3-step registration with ID photo upload |
| `forgot-password.html` | All | Email OTP → reset password |
| `change-password.html` | Teacher / Student | Change or first-time set password |
| `student-dashboard.html` | Student | Attendance stats + per-session record list |
| `face-capture.html` | Student | Selfie upload for face recognition enrollment |
| `teacher-dashboard.html` | Teacher | Session list + course management |
| `create-session.html` | Teacher | Create new attendance session |
| `session-detail.html` | Teacher | Upload photos → face recognition → edit & save |
| `admin-dashboard.html` | Admin | Approve/reject teachers, manage students |
| `config.html` | Setup | Configure backend server URL |

## Setup

1. Open `js/shared.js` and update `window.BACKEND_URL` to your server address:
   ```js
   window.BACKEND_URL = 'http://YOUR_IP:8000';
   ```
2. Serve the project from a local or remote HTTP server (e.g. `npx serve .`).
3. Open `pages/login.html` in a browser.

> **Note:** Files must be served over HTTP/HTTPS — opening HTML directly via `file://` will block `fetch()` calls due to CORS restrictions.

## How Shared Files Work

Every page imports both shared files at the bottom of `<body>`:
```html
<script src="../js/shared.js"></script>
<script src="../js/page-specific.js"></script>
```

`shared.js` exposes global functions used everywhere:
- `apiFetch(path, opts)` — authenticated API calls
- `setAuth(token, user)` / `doLogout()` — session management
- `requireAuth(role)` — redirect to login if not authenticated
- `setLoading(btnId, bool, text)` — button loading state
- `showErr(id, msg)` — display/hide error messages
- `buildPills(...)` / `buildFilterPills(...)` — pill selector components
- `routeAfterLogin(user)` — redirect based on user role
