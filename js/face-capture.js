const BASE_URL = "http://65.0.91.196:8000";

let fcPhotoB64 = null;

// handle image selection
function handleFaceCapture(evt) {
  const file = evt.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    const result = e.target.result;

    // extract base64 ONLY
    fcPhotoB64 = result.split(',')[1];

    // preview
    const img = document.getElementById('fc-preview');
    img.src = result;
    img.classList.remove('hidden');

    document.getElementById('fc-placeholder').classList.add('hidden');
  };

  reader.readAsDataURL(file);
}

// register face
async function doFaceRegister() {
  showErr('fc-err', '');

  if (!fcPhotoB64) {
    showErr('fc-err', 'Please take or upload a photo first');
    return;
  }

  const token = localStorage.getItem("auth_token");
  if (!token) {
    showErr('fc-err', 'Not logged in. Please login again.');
    return;
  }

  setLoading('fc-btn', true, 'Registering...');

  try {
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

    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      throw new Error(
        data?.detail || 
        data?.message || 
        "Face registration failed"
      );
    }

    // success
    if (currentUser) {
      currentUser.face_registered = true;
      localStorage.setItem('auth_user', JSON.stringify(currentUser));
    }

    window.location.href = 'student-dashboard.html';

  } catch (e) {
    console.error("Face Register Error:", e);
    showErr('fc-err', e.message || "Something went wrong");
  } finally {
    setLoading('fc-btn', false, 'Register Face');
  }
}
