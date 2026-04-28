const BASE_URL = "http://65.0.91.196:8000";

async function doFaceRegister() {
  showErr('fc-err', '');

  if (!fcPhotoB64) {
    showErr('fc-err', 'Please take or upload a photo first');
    return;
  }

  setLoading('fc-btn', true, 'Registering...');

  try {
    const res = await fetch(`${BASE_URL}/api/upload-face`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
      },
      body: JSON.stringify({
        image_base64: fcPhotoB64
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.detail || "Face registration failed");
    }

    // success
    if (currentUser) {
      currentUser.face_registered = true;
      localStorage.setItem('auth_user', JSON.stringify(currentUser));
    }

    window.location.href = 'student-dashboard.html';

  } catch (e) {
    console.error(e);
    showErr('fc-err', e.message);
  } finally {
    setLoading('fc-btn', false, 'Register Face');
  }
}
