// face-capture.js

let fcPhotoB64 = null;

window.addEventListener('DOMContentLoaded', () => requireAuth('student'));

function handleFaceCapture(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader  = new FileReader();
  reader.onload = e => {
    fcPhotoB64 = e.target.result.split(',')[1];
    document.getElementById('fc-preview').src = e.target.result;
    document.getElementById('fc-preview').classList.remove('hidden');
    document.getElementById('fc-placeholder').classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

async function doFaceRegister() {
  showErr('fc-err', '');
  if (!fcPhotoB64) { showErr('fc-err', 'Please take or upload a photo first'); return; }
  setLoading('fc-btn', true, 'Registering...');
  try {
    await apiFetch('/students/me/face', {
      method: 'POST',
      body: JSON.stringify({ image_base64: fcPhotoB64 })
    });
    if (currentUser) {
      currentUser.face_registered = true;
      localStorage.setItem('auth_user', JSON.stringify(currentUser));
    }
    window.location.href = 'student-dashboard.html';
  } catch(e) {
    showErr('fc-err', e.message);
  } finally {
    setLoading('fc-btn', false, 'Register Face');
  }
}
