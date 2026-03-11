document.addEventListener('DOMContentLoaded', function () {
  // Éléments DOM
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const canvasContext = canvas.getContext('2d');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('fileInput');
  const resultSection = document.getElementById('resultSection');
  const scanMessage = document.getElementById('scanMessage');
  const scanDetails = document.getElementById('scanDetails');
  const sessionCourse = document.getElementById('sessionCourse');
  const sessionTeacher = document.getElementById('sessionTeacher');
  const sessionDate = document.getElementById('sessionDate');
  const sessionTime = document.getElementById('sessionTime');
  const formLink = document.getElementById('formLink');
  const openFormBtn = document.getElementById('openFormBtn');
  const rescanBtn = document.getElementById('rescanBtn');

  let stream = null;
  let scanning = false;
  let scanInterval = null;
  let lastScannedUrl = '';

  // Démarrer le flux vidéo
  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      video.srcObject = stream;
      startBtn.disabled = true;
      stopBtn.disabled = false;
      scanning = true;
      scanInterval = setInterval(scanFrame, 500); // scanner toutes les 500ms
    } catch (err) {
      console.error('Erreur d\'accès à la caméra:', err);
      scanMessage.textContent = 'Impossible d\'accéder à la caméra. Vérifiez les permissions.';
      scanMessage.classList.add('error');
    }
  }

  // Arrêter la caméra
  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
      stream = null;
    }
    startBtn.disabled = false;
    stopBtn.disabled = true;
    scanning = false;
    if (scanInterval) {
      clearInterval(scanInterval);
      scanInterval = null;
    }
  }

  // Scanner une frame
  function scanFrame() {
    if (!scanning) return;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (code) {
      // QR code détecté
      handleScannedUrl(code.data);
    }
  }

  // Analyser l'URL scannée
  function handleScannedUrl(url) {
    if (url === lastScannedUrl) return; // éviter les doublons
    lastScannedUrl = url;

    // Arrêter le scanner
    stopCamera();
    scanning = false;

    // Afficher la section résultat
    resultSection.classList.remove('hidden');
    scanMessage.textContent = 'QR code scanné avec succès !';
    scanMessage.classList.remove('error');
    scanMessage.classList.add('success');

    // Parser l'URL pour extraire les paramètres
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    const course = params.get('course') || 'Non spécifié';
    const teacher = params.get('teacher') || 'Non spécifié';
    const date = params.get('date') || 'Non spécifié';
    const time = params.get('time') || 'Non spécifié';

    // Mettre à jour les détails
    sessionCourse.textContent = course;
    sessionTeacher.textContent = teacher;
    sessionDate.textContent = date;
    sessionTime.textContent = time;
    formLink.href = url;
    formLink.textContent = url.length > 50 ? url.substring(0, 50) + '...' : url;

    scanDetails.classList.remove('hidden');
  }

  // Télécharger une image
  function handleImageUpload(file) {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = function (e) {
      img.onload = function () {
        canvasContext.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          handleScannedUrl(code.data);
        } else {
          scanMessage.textContent = 'Aucun QR code trouvé dans l\'image.';
          scanMessage.classList.add('error');
          resultSection.classList.remove('hidden');
          scanDetails.classList.add('hidden');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Événements
  startBtn.addEventListener('click', startCamera);
  stopBtn.addEventListener('click', stopCamera);
  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleImageUpload(e.target.files[0]);
    }
  });
  openFormBtn.addEventListener('click', () => {
    if (lastScannedUrl) {
      window.open(lastScannedUrl, '_blank');
    } else {
      alert('Aucun QR code scanné.');
    }
  });
  rescanBtn.addEventListener('click', () => {
    resultSection.classList.add('hidden');
    lastScannedUrl = '';
    startCamera();
  });

  // Message d'information
  console.log('Scanner QR code initialisé. Assurez‑vous d\'utiliser un serveur HTTPS pour la caméra.');
});