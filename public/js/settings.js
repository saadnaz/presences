// ============================================================
// Settings — version simplifiée
//
// L'URL du formulaire Google Forms et la table des IDs des champs
// sont désormais entièrement fournies par le fichier mapping-id.json
// livré avec l'application. L'enseignant n'a plus qu'à cliquer sur
// le bouton « Lier à Google Form » pour associer son profil au
// formulaire officiel.
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  // ── Éléments DOM ──────────────────────────────────────────────
  const baseUrlDisplay    = document.getElementById('baseUrlDisplay');
  const bindFormBtn       = document.getElementById('bindFormBtn');
  const bindStatus        = document.getElementById('bindStatus');
  const resetBtn          = document.getElementById('resetBtn');
  const testBtn           = document.getElementById('testBtn');
  const testOutput        = document.getElementById('testOutput');
  const generatedUrlSpan  = document.getElementById('generatedUrl');
  const testQrDiv         = document.getElementById('testQr');
  const profileSelect     = document.getElementById('profileSelect');
  const newProfileBtn     = document.getElementById('newProfileBtn');
  const deleteProfileBtn  = document.getElementById('deleteProfileBtn');

  // ── État local ────────────────────────────────────────────────
  let currentProfileId = null;
  let officialMapping  = null;  // contenu de mapping-id.json (chargé une fois)

  // ============================================================
  // 1. Chargement de la configuration officielle (mapping-id.json)
  // ============================================================

  /**
   * Charge le fichier mapping-id.json livré avec l'application.
   * Met à jour l'affichage de l'URL en lecture seule.
   */
  function loadOfficialMapping() {
    baseUrlDisplay.value = 'Chargement…';
    return fetch('mapping-id.json?_=' + Date.now())
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        officialMapping = data;
        baseUrlDisplay.value = data.baseUrl || '(URL non définie dans mapping-id.json)';
        return data;
      })
      .catch(function (err) {
        console.error('[Settings] Impossible de charger mapping-id.json :', err);
        baseUrlDisplay.value = '';
        baseUrlDisplay.placeholder = '❌ Fichier mapping-id.json introuvable';
        showBindStatus(
          '❌ Impossible de charger la configuration officielle (mapping-id.json). ' +
          'Contactez l\'administrateur de l\'application.',
          'error'
        );
        return null;
      });
  }

  // ============================================================
  // 2. Gestion des profils
  // ============================================================

  function loadProfiles() {
    const profiles = ProfileManager.getProfiles();
    profileSelect.innerHTML = '';
    if (profiles.length === 0) {
      profileSelect.innerHTML = '<option value="">Aucun profil</option>';
      currentProfileId = null;
      updateDeleteButton();
      return;
    }
    const currentId = ProfileManager.getCurrentProfileId();
    profiles.forEach(function (profile) {
      const option = document.createElement('option');
      option.value = profile.id;
      option.textContent = profile.name + (profile.pin ? ' (avec PIN)' : '');
      if (profile.id === currentId) option.selected = true;
      profileSelect.appendChild(option);
    });
    currentProfileId = currentId;
    updateDeleteButton();
  }

  function updateDeleteButton() {
    deleteProfileBtn.disabled = !currentProfileId;
  }

  function createNewProfile() {
    const name = prompt('Nom du nouveau profil :');
    if (!name) return;
    const pin = prompt('Code PIN (optionnel, laissez vide) :', '');
    const id = ProfileManager.createProfile(name, pin || '');
    ProfileManager.setCurrentProfileId(id);
    loadProfiles();
    refreshBindStatus();
  }

  function deleteCurrentProfile() {
    if (!currentProfileId) return;
    if (confirm('Voulez-vous vraiment supprimer ce profil ? Tous ses paramètres seront perdus.')) {
      ProfileManager.deleteProfile(currentProfileId);
      loadProfiles();
      refreshBindStatus();
    }
  }

  // ============================================================
  // 3. Liaison du profil avec le formulaire officiel
  // ============================================================

  /**
   * Indique si le profil courant est déjà lié au formulaire officiel.
   */
  function isProfileBound() {
    if (!currentProfileId || !officialMapping) return false;
    const s = ProfileManager.getProfileSettings(currentProfileId);
    if (!s) return false;
    return s.baseUrl === officialMapping.baseUrl
        && s.fieldCourse
        && s.fieldCourse.indexOf('entry.') === 0
        && s.fieldCourse !== 'entry.1234567890'; // pas la valeur placeholder
  }

  /**
   * Lie le profil courant au formulaire officiel en copiant la configuration
   * de mapping-id.json dans les paramètres du profil.
   */
  function bindProfileToForm() {
    if (!currentProfileId) {
      alert('Veuillez d\'abord sélectionner ou créer un profil.');
      return;
    }
    if (!officialMapping) {
      alert('La configuration officielle n\'est pas chargée. Rechargez la page.');
      return;
    }

    const m = officialMapping.mapping || {};
    const settings = {
      baseUrl: officialMapping.baseUrl,
      formSections: officialMapping.sections || 1,
      fieldCourse:            m.matiere           || '',
      fieldTeacher:           m.enseignant        || '',
      fieldDate:              m.date              || '',
      fieldTime:              m.heure             || '',
      fieldSession:           m.id_session        || '',
      fieldStudentName:       m.nom_etudiant      || '',
      fieldStudentFirstName:  m.prenom_etudiant   || '',
      fieldStudentId:         m.numero_etudiant   || '',
      fieldStudentGender:     m.genre             || ''
    };

    ProfileManager.saveProfileSettings(currentProfileId, settings);
    refreshBindStatus();

    showBindStatus(
      '✅ Profil lié avec succès au formulaire Google Forms officiel. ' +
      'Vous pouvez maintenant utiliser l\'interface enseignant.',
      'success'
    );
  }

  /**
   * Délie le profil courant (restaure des valeurs vides).
   */
  function unbindProfile() {
    if (!currentProfileId) {
      alert('Veuillez sélectionner un profil.');
      return;
    }
    if (!confirm('Voulez-vous vraiment délier ce profil du formulaire ?')) return;

    ProfileManager.saveProfileSettings(currentProfileId, {
      baseUrl: '',
      formSections: 1,
      fieldCourse: '',
      fieldTeacher: '',
      fieldDate: '',
      fieldTime: '',
      fieldSession: '',
      fieldStudentName: '',
      fieldStudentFirstName: '',
      fieldStudentId: '',
      fieldStudentGender: ''
    });
    refreshBindStatus();
    showBindStatus('ℹ️ Profil délié du formulaire.', 'info');
  }

  /**
   * Met à jour le bouton et le badge de statut selon l'état du profil.
   */
  function refreshBindStatus() {
    if (!currentProfileId) {
      bindFormBtn.disabled = true;
      bindFormBtn.textContent = '🔗 Lier à Google Form';
      showBindStatus('ℹ️ Sélectionnez ou créez un profil pour le lier au formulaire.', 'info');
      return;
    }
    bindFormBtn.disabled = false;
    if (isProfileBound()) {
      bindFormBtn.textContent = '🔄 Re-synchroniser avec Google Form';
      showBindStatus(
        '✅ Ce profil est lié au formulaire officiel. ' +
        'Cliquez sur « Re-synchroniser » si la configuration de l\'app a changé.',
        'success'
      );
    } else {
      bindFormBtn.textContent = '🔗 Lier à Google Form';
      showBindStatus(
        '⚠️ Ce profil n\'est pas encore lié. Cliquez sur le bouton pour terminer la configuration.',
        'warning'
      );
    }
  }

  function showBindStatus(message, level) {
    if (!bindStatus) return;
    const styles = {
      success: { bg: '#e8f5e9', border: '#4CAF50', color: '#2e7d32' },
      warning: { bg: '#fff8e1', border: '#FFC107', color: '#e65100' },
      error:   { bg: '#ffebee', border: '#e53935', color: '#b71c1c' },
      info:    { bg: '#e3f2fd', border: '#2196F3', color: '#1565c0' }
    };
    const s = styles[level] || styles.info;
    bindStatus.style.display         = 'block';
    bindStatus.style.background      = s.bg;
    bindStatus.style.border          = '2px solid ' + s.border;
    bindStatus.style.color           = s.color;
    bindStatus.style.fontWeight      = 'bold';
    bindStatus.textContent           = message;
  }

  // ============================================================
  // 4. Test / génération URL
  // ============================================================

  function generateTestUrl() {
    if (!currentProfileId) {
      alert('Veuillez sélectionner un profil.');
      return;
    }
    const settings = ProfileManager.getProfileSettings(currentProfileId);
    if (!settings || !settings.baseUrl) {
      alert('Ce profil n\'est pas lié au formulaire. Cliquez d\'abord sur « Lier à Google Form ».');
      return;
    }
    const params = new URLSearchParams({
      [settings.fieldCourse]:  'Mathématiques',
      [settings.fieldTeacher]: 'Dupont',
      [settings.fieldDate]:    '2026-04-21',
      [settings.fieldTime]:    '14:00',
      [settings.fieldSession]: 'SESS_TEST'
    });
    const url = settings.baseUrl + '?' + params.toString();
    generatedUrlSpan.textContent = url;
    testOutput.classList.remove('hidden');

    testQrDiv.innerHTML = '';
    if (typeof QRCode === 'undefined') {
      alert('Bibliothèque QR code non chargée.');
      return;
    }
    try {
      new QRCode(testQrDiv, {
        text: url,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H,
        version: 16
      });
    } catch (error) {
      console.error(error);
    }
  }

  // ============================================================
  // 5. Initialisation
  // ============================================================

  loadProfiles();
  loadOfficialMapping().then(function () {
    refreshBindStatus();
  });

  profileSelect.addEventListener('change', function () {
    const selectedId = this.value;
    if (selectedId) {
      ProfileManager.setCurrentProfileId(selectedId);
      currentProfileId = selectedId;
    } else {
      currentProfileId = null;
    }
    updateDeleteButton();
    refreshBindStatus();
  });

  newProfileBtn.addEventListener('click', createNewProfile);
  deleteProfileBtn.addEventListener('click', deleteCurrentProfile);
  bindFormBtn.addEventListener('click', bindProfileToForm);
  resetBtn.addEventListener('click', unbindProfile);
  testBtn.addEventListener('click', generateTestUrl);
});
