document.addEventListener('DOMContentLoaded', function () {

  // ============================================================
  // Éléments DOM
  // ============================================================
  const sessionForm = document.getElementById('sessionForm');
  const qrSection = document.getElementById('qrSection');
  const qrcodeDiv = document.getElementById('qrcode');
  const qrUrlInput = document.getElementById('qrUrl');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn = document.getElementById('resetBtn');
  const newSessionBtn = document.getElementById('newSessionBtn');
  const profileSelectTeacher = document.getElementById('profileSelectTeacher');
  const submitStatus = document.getElementById('submitStatus');
  const sessionSummary = document.getElementById('sessionSummary');
  const pinModal = document.getElementById('pinModal');
  const pinInput = document.getElementById('pinInput');
  const pinSubmitBtn = document.getElementById('pinSubmitBtn');
  const pinError = document.getElementById('pinError');

  let currentProfileId = null;
  let currentQRUrl = '';

  // ============================================================
  // Initialisation date/heure
  // ============================================================
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const curTime = now.toTimeString().substring(0, 5);
  document.getElementById('date').value = today;
  document.getElementById('time').value = curTime;

  // ============================================================
  // Gestion des profils
  // ============================================================
  function loadProfiles() {
    const profiles = ProfileManager.getProfiles();
    profileSelectTeacher.innerHTML = '';
    if (profiles.length === 0) {
      profileSelectTeacher.innerHTML = '<option value="">Aucun profil — configurez dans Paramètres</option>';
      return;
    }
    const currentId = ProfileManager.getCurrentProfileId();
    profiles.forEach(profile => {
      const opt = document.createElement('option');
      opt.value = profile.id;
      opt.textContent = profile.name + (profile.pin ? ' 🔐' : '');
      if (profile.id === currentId) opt.selected = true;
      profileSelectTeacher.appendChild(opt);
    });
    currentProfileId = currentId;
  }

  function getSettings() {
    if (!currentProfileId) {
      alert('Veuillez sélectionner un profil enseignant.\nSi vous n\'en avez pas, créez-en un dans Paramètres.');
      return null;
    }
    const s = ProfileManager.getProfileSettings(currentProfileId);
    if (!s || !s.baseUrl || s.baseUrl.includes('...')) {
      alert('Le profil n\'est pas encore configuré.\nRendez-vous dans Paramètres pour saisir l\'URL de votre Google Form et les IDs des champs.');
      return null;
    }

    // Vérifier que les IDs des champs étudiant sont configurés (pas des placeholders)
    const defaultIds = [
      'entry.2222222222', 'entry.1111111111', 'entry.6666666666',
      'entry.1234567890', 'entry.9876543210', 'entry.5555555555',
      'entry.4444444444', 'entry.3333333333'
    ];
    const studentFields = [
      { key: 'fieldStudentName',      label: 'Nom étudiant' },
      { key: 'fieldStudentFirstName', label: 'Prénom étudiant' },
      { key: 'fieldStudentId',        label: 'Numéro étudiant' }
    ];
    const unconfigured = studentFields.filter(f =>
      !s[f.key] || defaultIds.includes(s[f.key])
    );
    if (unconfigured.length > 0) {
      alert(
        'Les champs suivants ne sont pas encore configurés :\n' +
        unconfigured.map(f => '  • ' + f.label).join('\n') +
        '\n\nRendez-vous dans Paramètres → utilisez le bookmarklet pour récupérer les IDs de votre Google Form.\n' +
        'Ces IDs sont nécessaires pour que les données des étudiants s\'enregistrent correctement.'
      );
      return null;
    }

    return s;
  }

  // ============================================================
  // Vérification du PIN
  // ============================================================
  function checkPinAccess() {
    if (!currentProfileId) return;
    const profiles = ProfileManager.getProfiles();
    const profile = profiles.find(p => p.id === currentProfileId);
    if (profile && profile.pin) {
      pinModal.style.display = 'flex';
      setTimeout(() => pinInput.focus(), 100);
    }
  }

  function validatePin() {
    const entered = pinInput.value;
    if (ProfileManager.verifyPin(currentProfileId, entered)) {
      pinModal.style.display = 'none';
      pinError.style.display = 'none';
      pinInput.value = '';
    } else {
      pinError.style.display = 'block';
      pinInput.value = '';
      pinInput.focus();
    }
  }

  pinSubmitBtn.addEventListener('click', validatePin);
  pinInput.addEventListener('keypress', e => { if (e.key === 'Enter') validatePin(); });

  // Lancer la vérification au chargement
  loadProfiles();
  checkPinAccess();

  // ============================================================
  // Changement de profil → vérifier le nouveau PIN
  // ============================================================
  profileSelectTeacher.addEventListener('change', function () {
    currentProfileId = this.value || null;
    if (currentProfileId) {
      ProfileManager.setCurrentProfileId(currentProfileId);
      checkPinAccess();
    }
  });

  // ============================================================
  // Génération d'un ID de séance unique
  // ============================================================
  function generateSessionId() {
    return 'SESS_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // ============================================================
  // Affichage du statut de soumission
  // ============================================================
  function showStatus(msg, type = 'info') {
    const colors = {
      info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' },
      success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
      error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' }
    };
    const c = colors[type] || colors.info;
    submitStatus.style.cssText =
      `display:block; background:${c.bg}; border:1px solid ${c.border};
       color:${c.text}; padding:12px 16px; border-radius:8px; margin-top:15px;`;
    submitStatus.innerHTML = msg;
  }

  // ============================================================
  // Soumission de la séance au Google Forms (enregistrement enseignant)
  // ============================================================
  function submitTeacherSession(settings, sessionData) {
    const responseUrl = ProfileManager.getFormResponseUrl(settings.baseUrl);

    const fields = {
      [settings.fieldCourse]: sessionData.course,
      [settings.fieldTeacher]: sessionData.teacher,
      [settings.fieldDate]: sessionData.date,
      [settings.fieldTime]: sessionData.time,
      [settings.fieldSession]: sessionData.sessionId
      // Champs étudiant laissés vides intentionnellement (ligne de séance)
    };

    showStatus('⏳ Enregistrement de la séance dans Google Sheets…');

    ProfileManager.submitToGoogleForms(responseUrl, fields)
      .then(() => {
        showStatus(
          '✅ <strong>Séance enregistrée dans Google Sheets.</strong><br>' +
          '<small>Les étudiants peuvent maintenant scanner le QR code ci-dessous.</small>',
          'success'
        );
      })
      .catch(err => {
        console.error('Erreur soumission enseignant:', err);
        showStatus(
          '⚠️ <strong>Impossible d\'enregistrer automatiquement</strong> (erreur réseau).<br>' +
          '<small>Le QR code reste fonctionnel — les présences étudiants seront bien enregistrées.</small>',
          'error'
        );
      });
  }

  // ============================================================
  // Construction de l'URL QR pour les étudiants
  // (pointe vers student.html dans l'app, avec toutes les données encodées)
  // ============================================================
  function buildStudentUrl(settings, sessionData) {
    // URL de base de l'app (adapte selon l'environnement : local, GitHub Pages, etc.)
    const path = window.location.pathname;
    const directory = path.substring(0, path.lastIndexOf('/') + 1);
    const base = window.location.origin + directory + 'student.html';

    // Données encodées dans l'URL (base64 JSON)
    const payload = ProfileManager.encodeSessionData({
      f:  ProfileManager.getFormResponseUrl(settings.baseUrl), // URL /formResponse
      ps: settings.formSections || 1,        // nombre de sections (pageHistory)
      c:  sessionData.course,
      t:  sessionData.teacher,
      d:  sessionData.date,
      tm: sessionData.time,
      s:  sessionData.sessionId,
      e: {                                   // entry IDs des champs
        c:  settings.fieldCourse,
        t:  settings.fieldTeacher,
        d:  settings.fieldDate,
        tm: settings.fieldTime,
        s:  settings.fieldSession,
        n:  settings.fieldStudentName,
        fn: settings.fieldStudentFirstName,
        id: settings.fieldStudentId
      }
    });

    const url = `${base}?d=${payload}`;
    console.log('URL étudiante générée:', url);
    console.log('Payload:', payload);
    return url;
  }

  // ============================================================
  // Génération du QR code
  // ============================================================
  function generateQRCode(url) {
    qrcodeDiv.innerHTML = '';
    if (typeof QRCode === 'undefined') {
      alert('Bibliothèque QR code non disponible. Vérifiez votre connexion internet.');
      return false;
    }
    try {
      new QRCode(qrcodeDiv, {
        text: url,
        width: 260,
        height: 260,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M,
        version: 20
      });
      currentQRUrl = url;
      qrUrlInput.value = url;
      return true;
    } catch (err) {
      console.error('QR generation error:', err);
      alert('Erreur lors de la génération du QR code : ' + err.message);
      return false;
    }
  }

  // ============================================================
  // Affichage du résumé de la séance
  // ============================================================
  function renderSessionSummary(sessionData) {
    const items = [
      { icon: '📚', label: 'Cours', value: sessionData.course },
      { icon: '👨‍🏫', label: 'Enseignant', value: sessionData.teacher },
      { icon: '📅', label: 'Date', value: sessionData.date },
      { icon: '⏰', label: 'Heure', value: sessionData.time },
      { icon: '🔑', label: 'Session ID', value: sessionData.sessionId }
    ];
    sessionSummary.innerHTML = items.map(i =>
      `<div style="flex:1; min-width:140px; font-size:0.9rem;">
        <span style="font-weight:bold; color:#555;">${i.icon} ${i.label} :</span><br>
        <span style="color:#2c3e50;">${i.value}</span>
      </div>`
    ).join('');
  }

  // ============================================================
  // Soumission du formulaire enseignant
  // ============================================================
  sessionForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const settings = getSettings();
    if (!settings) return;

    const course = document.getElementById('course').value.trim();
    const teacher = document.getElementById('teacher').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    if (!course || !teacher || !date || !time) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const sessionData = {
      course,
      teacher,
      date,
      time,
      sessionId: generateSessionId()
    };

    // Construire l'URL étudiante (pointe vers student.html avec toutes les données encodées)
    const studentUrl = buildStudentUrl(settings, sessionData);

    // Générer le QR code
    if (!generateQRCode(studentUrl)) return;

    // Afficher confirmation + résumé + section QR
    // Note : l'enseignant ne soumet plus de ligne séparée dans Google Sheets.
    // Chaque étudiant créera sa propre ligne complète (infos séance + infos personnelles).
    showStatus(
      '✅ <strong>QR code prêt.</strong><br>' +
      '<small>Chaque étudiant qui scanne ce code ajoute une ligne dans Google Sheets avec ses informations et les données de la séance.</small>',
      'success'
    );
    renderSessionSummary(sessionData);
    qrSection.classList.remove('hidden');
    qrSection.scrollIntoView({ behavior: 'smooth' });
  });

  // ============================================================
  // Actions sur les boutons
  // ============================================================
  copyBtn.addEventListener('click', () => {
    if (!currentQRUrl) return;
    navigator.clipboard.writeText(currentQRUrl)
      .then(() => alert('Lien copié dans le presse-papiers !'))
      .catch(() => {
        qrUrlInput.select();
        document.execCommand('copy');
        alert('Lien copié !');
      });
  });

  downloadBtn.addEventListener('click', () => {
    const canvas = qrcodeDiv.querySelector('canvas');
    if (!canvas) { alert('QR code non disponible.'); return; }
    const link = document.createElement('a');
    link.download = `presence_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  function resetForm() {
    sessionForm.reset();
    document.getElementById('date').value = today;
    document.getElementById('time').value = curTime;
    qrSection.classList.add('hidden');
    submitStatus.style.display = 'none';
    qrcodeDiv.innerHTML = '';
    currentQRUrl = '';
  }

  resetBtn.addEventListener('click', resetForm);
  newSessionBtn.addEventListener('click', () => {
    resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
