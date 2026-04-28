const BASE_URL = "http://65.0.91.196:8000";

async function doFaceRegister() {
  showErr('fc-err', '');
  if (!fcPhotoB64) { showErr('fc-err', 'Please take or upload a photo first'); return; }

  setLoading('fc-btn', true, 'Registering...');

  try {
    const formData = new FormData();

    const byteString = atob(fcPhotoB64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([arrayBuffer], { type: "image/jpeg" });

    formData.append("file", blob, "face.jpg");

    const res = await fetch(`${BASE_URL}/api/upload-face`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        Accept: "application/json"
      }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Face registration failed");
    }

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
