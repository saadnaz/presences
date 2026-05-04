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
  const profileStatusLine = document.getElementById('profileStatusLine');
  const submitStatus = document.getElementById('submitStatus');
  const sessionSummary = document.getElementById('sessionSummary');
  const pinModal = document.getElementById('pinModal');
  const pinInput = document.getElementById('pinInput');
  const pinSubmitBtn = document.getElementById('pinSubmitBtn');
  const pinError = document.getElementById('pinError');

  // Modale « Gérer et synchroniser le profil »
  const manageProfileBtn      = document.getElementById('manageProfileBtn');
  const profileModal          = document.getElementById('profileModal');
  const profileModalCloseBtn  = document.getElementById('profileModalCloseBtn');
  const modalFormUrl          = document.getElementById('modalFormUrl');
  const modalProfileSelect    = document.getElementById('modalProfileSelect');
  const modalBindStatus       = document.getElementById('modalBindStatus');
  const modalSyncBtn          = document.getElementById('modalSyncBtn');
  const modalNewProfileBtn    = document.getElementById('modalNewProfileBtn');
  const modalDeleteProfileBtn = document.getElementById('modalDeleteProfileBtn');

  let currentProfileId = null;
  let currentQRUrl = '';
  let officialMapping = null; // contenu de mapping-id.json (chargé une fois)

  // ============================================================
  // Initialisation date/heure
  // ============================================================
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const curTime = now.toTimeString().substring(0, 5);
  document.getElementById('date').value = today;
  document.getElementById('time').value = curTime;

  // ============================================================
  // Chargement du mapping officiel (public/mapping-id.json)
  // ============================================================
  function loadOfficialMapping() {
    return fetch('mapping-id.json?_=' + Date.now())
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        officialMapping = data;
        if (modalFormUrl) modalFormUrl.value = data.baseUrl || '(URL non définie)';
        return data;
      })
      .catch(function (err) {
        console.error('[Teacher] Impossible de charger mapping-id.json :', err);
        if (modalFormUrl) {
          modalFormUrl.value = '';
          modalFormUrl.placeholder = '❌ mapping-id.json introuvable';
        }
        return null;
      });
  }

  // ============================================================
  // Gestion des profils
  // ============================================================
  function loadProfiles() {
    const profiles = ProfileManager.getProfiles();
    profileSelectTeacher.innerHTML = '';
    if (profiles.length === 0) {
      profileSelectTeacher.innerHTML = '<option value="">Aucun profil — cliquez sur « Gérer et synchroniser »</option>';
      currentProfileId = null;
      refreshProfileStatusLine();
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
    refreshProfileStatusLine();
  }

  /**
   * Indique si un profil est déjà synchronisé avec le formulaire officiel.
   */
  function isProfileBound(profileId) {
    if (!profileId || !officialMapping) return false;
    const s = ProfileManager.getProfileSettings(profileId);
    if (!s || !s.baseUrl) return false;
    if (s.baseUrl !== officialMapping.baseUrl) return false;
    if (!s.fieldCourse || s.fieldCourse.indexOf('entry.') !== 0) return false;
    const placeholders = [
      'entry.1234567890', 'entry.9876543210', 'entry.5555555555',
      'entry.4444444444', 'entry.3333333333', 'entry.2222222222',
      'entry.1111111111', 'entry.6666666666', 'entry.7777777777'
    ];
    return !placeholders.includes(s.fieldCourse);
  }

  /**
   * Copie l'intégralité du mapping officiel dans les paramètres du profil.
   */
  function bindProfileToOfficialForm(profileId) {
    if (!profileId || !officialMapping) return false;
    const m = officialMapping.mapping || {};
    ProfileManager.saveProfileSettings(profileId, {
      baseUrl: officialMapping.baseUrl,
      formSections: officialMapping.sections || 1,
      fieldCourse:            m.matiere          || '',
      fieldTeacher:           m.enseignant       || '',
      fieldCohort:            m.cohorte          || '',
      fieldDate:              m.date             || '',
      fieldTime:              m.heure            || '',
      fieldSession:           m.id_session       || '',
      fieldStudentName:       m.nom_etudiant     || '',
      fieldStudentFirstName:  m.prenom_etudiant  || '',
      fieldStudentId:         m.numero_etudiant  || '',
      fieldStudentGender:     m.genre            || ''
    });
    return true;
  }

  function refreshProfileStatusLine() {
    if (!profileStatusLine) return;
    if (!currentProfileId) {
      profileStatusLine.innerHTML =
        '<span style="color:#e65100;">⚠️ Aucun profil actif. Cliquez sur « Gérer et synchroniser le profil » pour commencer.</span>';
      return;
    }
    if (!officialMapping) {
      profileStatusLine.innerHTML =
        '<span style="color:#888;">⏳ Chargement de la configuration officielle…</span>';
      return;
    }
    if (isProfileBound(currentProfileId)) {
      profileStatusLine.innerHTML =
        '<span style="color:#2e7d32;">✅ Profil synchronisé avec Google Form — prêt à l\'emploi.</span>';
    } else {
      profileStatusLine.innerHTML =
        '<span style="color:#e65100;">⚠️ Profil non synchronisé. Cliquez sur « Gérer et synchroniser le profil ».</span>';
    }
  }

  function getSettings() {
    if (!currentProfileId) {
      alert('Aucun profil actif.\nCliquez sur « Gérer et synchroniser le profil » pour en créer un.');
      openProfileModal();
      return null;
    }

    // Auto-synchronisation silencieuse si non lié mais mapping chargé
    if (!isProfileBound(currentProfileId) && officialMapping) {
      bindProfileToOfficialForm(currentProfileId);
      refreshProfileStatusLine();
    }

    const s = ProfileManager.getProfileSettings(currentProfileId);
    if (!s || !s.baseUrl) {
      alert('Impossible de synchroniser le profil avec le formulaire.\nVérifiez votre connexion et réessayez.');
      openProfileModal();
      return null;
    }
    return s;
  }

  // ============================================================
  // Modale « Gérer et synchroniser le profil »
  // ============================================================
  function populateModalProfileSelect() {
    if (!modalProfileSelect) return;
    const profiles = ProfileManager.getProfiles();
    modalProfileSelect.innerHTML = '';
    if (profiles.length === 0) {
      modalProfileSelect.innerHTML = '<option value="">— Aucun profil. Créez-en un ci-dessous —</option>';
      return;
    }
    profiles.forEach(function (p) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name + (p.pin ? ' 🔐' : '');
      if (p.id === currentProfileId) opt.selected = true;
      modalProfileSelect.appendChild(opt);
    });
  }

  function showModalStatus(message, level) {
    if (!modalBindStatus) return;
    const styles = {
      success: { bg: '#e8f5e9', border: '#4CAF50', color: '#2e7d32' },
      warning: { bg: '#fff8e1', border: '#FFC107', color: '#e65100' },
      error:   { bg: '#ffebee', border: '#e53935', color: '#b71c1c' },
      info:    { bg: '#e3f2fd', border: '#2196F3', color: '#1565c0' }
    };
    const s = styles[level] || styles.info;
    modalBindStatus.style.display    = 'block';
    modalBindStatus.style.background = s.bg;
    modalBindStatus.style.border     = '2px solid ' + s.border;
    modalBindStatus.style.color      = s.color;
    modalBindStatus.textContent      = message;
  }

  function refreshModalStatus() {
    if (!currentProfileId) {
      showModalStatus('ℹ️ Aucun profil sélectionné. Créez-en un pour commencer.', 'info');
      modalSyncBtn.disabled = true;
      modalDeleteProfileBtn.disabled = true;
      return;
    }
    modalSyncBtn.disabled = false;
    modalDeleteProfileBtn.disabled = false;
    if (!officialMapping) {
      showModalStatus('⏳ Chargement de la configuration officielle…', 'info');
      return;
    }
    if (isProfileBound(currentProfileId)) {
      showModalStatus('✅ Profil synchronisé avec Google Form.', 'success');
      modalSyncBtn.textContent = '🔄 Re-synchroniser ce profil';
    } else {
      showModalStatus('⚠️ Profil non synchronisé — cliquez sur le bouton ci-dessous.', 'warning');
      modalSyncBtn.textContent = '🔗 Synchroniser ce profil avec Google Form';
    }
  }

  function openProfileModal() {
    populateModalProfileSelect();
    refreshModalStatus();
    profileModal.style.display = 'flex';
  }

  function closeProfileModal() {
    profileModal.style.display = 'none';
  }

  function modalCreateNewProfile() {
    const name = prompt('Nom du nouveau profil :');
    if (!name) return;
    const pin = prompt('Code PIN (optionnel, laissez vide pour aucun) :', '');
    const id = ProfileManager.createProfile(name, pin || '');
    ProfileManager.setCurrentProfileId(id);
    currentProfileId = id;

    // Synchronisation automatique immédiate
    if (officialMapping) {
      bindProfileToOfficialForm(id);
    }

    populateModalProfileSelect();
    loadProfiles();
    refreshModalStatus();
    refreshProfileStatusLine();
    showModalStatus('✅ Profil « ' + name + ' » créé et synchronisé avec Google Form.', 'success');
  }

  function modalSyncCurrentProfile() {
    if (!currentProfileId) {
      showModalStatus('⚠️ Sélectionnez d\'abord un profil ou créez-en un.', 'warning');
      return;
    }
    if (!officialMapping) {
      showModalStatus('❌ Configuration officielle indisponible. Rechargez la page.', 'error');
      return;
    }
    bindProfileToOfficialForm(currentProfileId);
    refreshModalStatus();
    refreshProfileStatusLine();
    showModalStatus('✅ Profil synchronisé avec succès.', 'success');
  }

  function modalDeleteCurrentProfile() {
    if (!currentProfileId) return;
    if (!confirm('Supprimer définitivement ce profil ?')) return;
    ProfileManager.deleteProfile(currentProfileId);
    currentProfileId = ProfileManager.getCurrentProfileId();
    populateModalProfileSelect();
    loadProfiles();
    refreshModalStatus();
    refreshProfileStatusLine();
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
  loadOfficialMapping().then(function () {
    // Auto-synchroniser silencieusement le profil actif s'il ne l'est pas
    if (currentProfileId && officialMapping && !isProfileBound(currentProfileId)) {
      bindProfileToOfficialForm(currentProfileId);
    }
    refreshProfileStatusLine();
  });

  // ============================================================
  // Changement de profil → vérifier le nouveau PIN
  // ============================================================
  profileSelectTeacher.addEventListener('change', function () {
    currentProfileId = this.value || null;
    if (currentProfileId) {
      ProfileManager.setCurrentProfileId(currentProfileId);
      checkPinAccess();
      // Auto-synchronisation silencieuse si besoin
      if (officialMapping && !isProfileBound(currentProfileId)) {
        bindProfileToOfficialForm(currentProfileId);
      }
    }
    refreshProfileStatusLine();
  });

  // ============================================================
  // Boutons de la modale « Gérer et synchroniser le profil »
  // ============================================================
  if (manageProfileBtn)      manageProfileBtn.addEventListener('click', openProfileModal);
  if (profileModalCloseBtn)  profileModalCloseBtn.addEventListener('click', closeProfileModal);
  if (modalNewProfileBtn)    modalNewProfileBtn.addEventListener('click', modalCreateNewProfile);
  if (modalSyncBtn)          modalSyncBtn.addEventListener('click', modalSyncCurrentProfile);
  if (modalDeleteProfileBtn) modalDeleteProfileBtn.addEventListener('click', modalDeleteCurrentProfile);
  if (modalProfileSelect) {
    modalProfileSelect.addEventListener('change', function () {
      currentProfileId = this.value || null;
      if (currentProfileId) ProfileManager.setCurrentProfileId(currentProfileId);
      loadProfiles();
      refreshModalStatus();
    });
  }
  // Fermer la modale en cliquant sur le fond
  if (profileModal) {
    profileModal.addEventListener('click', function (e) {
      if (e.target === profileModal) closeProfileModal();
    });
  }

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
      co: sessionData.cohorte,
      d:  sessionData.date,
      tm: sessionData.time,
      s:  sessionData.sessionId,
      e: {                                   // entry IDs des champs
        c:  settings.fieldCourse,
        t:  settings.fieldTeacher,
        co: settings.fieldCohort,
        d:  settings.fieldDate,
        tm: settings.fieldTime,
        s:  settings.fieldSession,
        n:  settings.fieldStudentName,
        fn: settings.fieldStudentFirstName,
        id: settings.fieldStudentId,
        g:  settings.fieldStudentGender
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
      { icon: '🎯', label: 'Cohorte', value: sessionData.cohorte },
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
    const cohorte = document.getElementById('cohorte').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    if (!course || !teacher || !cohorte || !date || !time) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const sessionData = {
      course,
      teacher,
      cohorte,
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
