// face-capture.js

const BASE_URL = "http://65.0.91.196:8000";

let fcPhotoB64 = null;

// Ensure user is logged in
window.addEventListener('DOMContentLoaded', () => requireAuth('student'));

// Handle image capture / upload
function handleFaceCapture(evt) {
  const file = evt.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = e => {
    const base64Full = e.target.result;

    // Extract only base64 part (remove data:image/...;base64,)
    fcPhotoB64 = base64Full.split(',')[1];

    // Preview image
    const preview = document.getElementById('fc-preview');
    preview.src = base64Full;
    preview.classList.remove('hidden');

    document.getElementById('fc-placeholder').classList.add('hidden');
  };

  reader.readAsDataURL(file);
}

// Register face
async function doFaceRegister() {
  showErr('fc-err', '');

  if (!fcPhotoB64) {
    showErr('fc-err', 'Please take or upload a photo first');
    return;
  }

  setLoading('fc-btn', true, 'Registering...');

  try {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      throw new Error("User not authenticated. Please login again.");
    }

    // 🔥 CORRECT REQUEST (BASE64 JSON)
    const res = await fetch(`${BASE_URL}/api/upload-face`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        image_base64: fcPhotoB64
      })
    });

    // Handle response
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Face registration failed");
    }

    // Success
    if (currentUser) {
      currentUser.face_registered = true;
      localStorage.setItem('auth_user', JSON.stringify(currentUser));
    }

    // Redirect
    window.location.href = 'student-dashboard.html';

  } catch (e) {
    console.error("Face register error:", e);
    showErr('fc-err', e.message);
  } finally {
    setLoading('fc-btn', false, 'Register Face');
  }
}
