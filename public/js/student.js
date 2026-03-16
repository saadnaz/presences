document.addEventListener('DOMContentLoaded', function () {

  // ============================================================
  // Détection du mode : formulaire présence (URL ?d=) ou scanner
  // ============================================================
  const params  = new URLSearchParams(window.location.search);
  const encoded = params.get('d');
  const session = encoded ? ProfileManager.decodeSessionData(encoded) : null;

  if (session && session.f && session.e) {
    // ── MODE B : Formulaire présence ──────────────────────────
    initAttendanceForm(session);
  } else {
    // ── MODE A : Scanner QR ───────────────────────────────────
    initScanner();
  }

  // ============================================================
  // MODE A — Scanner QR
  // ============================================================
  function initScanner() {
    document.getElementById('scannerSection').style.display = 'block';

    const video        = document.getElementById('video');
    const canvas       = document.getElementById('canvas');
    const ctx          = canvas.getContext('2d');
    const startBtn     = document.getElementById('startBtn');
    const stopBtn      = document.getElementById('stopBtn');
    const uploadBtn    = document.getElementById('uploadBtn');
    const fileInput    = document.getElementById('fileInput');
    const resultSection = document.getElementById('scanResultSection');
    const scanMessage  = document.getElementById('scanMessage');

    let stream      = null;
    let scanning    = false;
    let scanInterval = null;
    let lastUrl     = '';

    function startCamera() {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        .then(s => {
          stream = s;
          video.srcObject = stream;
          startBtn.disabled = true;
          stopBtn.disabled  = false;
          scanning = true;
          scanInterval = setInterval(scanFrame, 400);
        })
        .catch(err => {
          console.error(err);
          showScanError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
        });
    }

    function stopCamera() {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        video.srcObject = null;
        stream = null;
      }
      scanning = false;
      startBtn.disabled = false;
      stopBtn.disabled  = true;
      if (scanInterval) { clearInterval(scanInterval); scanInterval = null; }
    }

    function scanFrame() {
      if (!scanning || video.readyState !== video.HAVE_ENOUGH_DATA) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code    = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'dontInvert' });
      if (code) handleScannedUrl(code.data);
    }

    function handleScannedUrl(url) {
      if (url === lastUrl) return;
      lastUrl = url;
      stopCamera();

      // Essayer de décoder une URL student.html?d=...
      try {
        const u       = new URL(url);
        const dParam  = u.searchParams.get('d');
        if (dParam) {
          // Rediriger vers student.html avec le paramètre d= pour afficher le formulaire
          window.location.href = 'student.html?d=' + encodeURIComponent(dParam);
          return;
        }
        // Ancienne URL direct Google Forms (rétrocompatibilité)
        if (url.includes('docs.google.com/forms')) {
          window.open(url, '_blank');
          showScanError('QR code détecté (ancien format). Ouverture du formulaire Google Forms…');
          return;
        }
      } catch (_) {}

      showScanError('QR code scanné mais format non reconnu. Assurez-vous d\'utiliser le bon QR code.');
    }

    function showScanError(msg) {
      scanMessage.textContent = msg;
      resultSection.classList.remove('hidden');
    }

    function handleImageFile(file) {
      const img    = new Image();
      const reader = new FileReader();
      reader.onload = e => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code    = jsQR(imgData.data, imgData.width, imgData.height);
          if (code) {
            handleScannedUrl(code.data);
          } else {
            showScanError('Aucun QR code trouvé dans cette image.');
            resultSection.classList.remove('hidden');
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    startBtn.addEventListener('click', startCamera);
    stopBtn.addEventListener('click', stopCamera);
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
      if (e.target.files.length > 0) handleImageFile(e.target.files[0]);
    });
  }

  // ============================================================
  // MODE B — Formulaire présence avec données de session
  // ============================================================
  function initAttendanceForm(session) {
    // Masquer le scanner, montrer le formulaire
    document.getElementById('scannerSection').style.display = 'none';
    document.getElementById('formSection').style.display    = 'block';
    document.getElementById('pageSubtitle').textContent     = 'Complétez vos informations';

    // Afficher les infos de la séance (lecture seule)
    const grid = document.getElementById('sessionInfoGrid');
    const items = [
      { icon: '📚', label: 'Cours',      value: session.c  },
      { icon: '👨‍🏫', label: 'Enseignant', value: session.t  },
      { icon: '📅', label: 'Date',       value: formatDate(session.d) },
      { icon: '⏰', label: 'Heure',      value: session.tm }
    ];
    grid.innerHTML = items.map(i =>
      `<div style="padding:10px 12px; background:white; border-radius:8px;
                  border:1px solid #c8e6c9;">
        <div style="font-size:0.8rem; color:#888;">${i.icon} ${i.label}</div>
        <div style="font-weight:bold; color:#2c3e50; margin-top:3px;">${i.value || '—'}</div>
      </div>`
    ).join('');

    // Gestion du formulaire étudiant
    const form            = document.getElementById('attendanceForm');
    const submitBtn       = document.getElementById('attendanceSubmitBtn');
    const statusDiv       = document.getElementById('attendanceStatus');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const lastName  = document.getElementById('studentLastName').value.trim();
      const firstName = document.getElementById('studentFirstName').value.trim();
      const studentId = document.getElementById('studentId').value.trim();

      if (!lastName || !firstName || !studentId) {
        showAttendanceStatus('⚠️ Veuillez remplir tous les champs.', 'error');
        return;
      }

      submitBtn.disabled   = true;
      submitBtn.textContent = '⏳ Envoi en cours…';
      showAttendanceStatus('Enregistrement de votre présence…', 'info');

      // Construire les champs à soumettre au Google Form
      const e = session.e; // entry IDs
      const fields = {};
      if (e.c  && session.c)  fields[e.c]  = session.c;
      if (e.t  && session.t)  fields[e.t]  = session.t;
      if (e.d  && session.d)  fields[e.d]  = session.d;
      if (e.tm && session.tm) fields[e.tm] = session.tm;
      if (e.s  && session.s)  fields[e.s]  = session.s;
      if (e.n)  fields[e.n]  = lastName;
      if (e.fn) fields[e.fn] = firstName;
      if (e.id) fields[e.id] = studentId;

      ProfileManager.submitToGoogleForms(session.f, fields)
        .then(() => {
          showConfirmation(session, lastName, firstName, studentId);
        })
        .catch(err => {
          console.error('Erreur soumission étudiant:', err);
          submitBtn.disabled    = false;
          submitBtn.textContent = '✅ Valider ma présence';
          showAttendanceStatus(
            '❌ Erreur réseau — vérifiez votre connexion et réessayez.',
            'error'
          );
        });
    });
  }

  // ============================================================
  // MODE C — Confirmation finale
  // ============================================================
  function showConfirmation(session, lastName, firstName, studentId) {
    document.getElementById('formSection').style.display    = 'none';
    document.getElementById('confirmSection').style.display = 'block';
    document.getElementById('pageSubtitle').textContent     = 'Présence validée';

    document.getElementById('confirmText').innerHTML =
      `<strong>${firstName} ${lastName}</strong> (${studentId})<br>` +
      `${session.c} — ${formatDate(session.d)} à ${session.tm}<br>` +
      `<small style="color:#888;">Enseignant : ${session.t}</small>`;
  }

  // ============================================================
  // Helpers
  // ============================================================
  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    } catch (_) { return dateStr; }
  }

  function showAttendanceStatus(msg, type) {
    const statusDiv = document.getElementById('attendanceStatus');
    const styles = {
      info:  'background:#d1ecf1; border:1px solid #bee5eb; color:#0c5460;',
      error: 'background:#f8d7da; border:1px solid #f5c6cb; color:#721c24;',
      ok:    'background:#d4edda; border:1px solid #c3e6cb; color:#155724;'
    };
    statusDiv.style.cssText = `display:block; padding:12px; border-radius:8px;
      margin-top:15px; ${styles[type] || styles.info}`;
    statusDiv.innerHTML = msg;
  }

});
