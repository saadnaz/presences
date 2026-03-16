document.addEventListener('DOMContentLoaded', function () {
  // Éléments DOM
  const settingsForm = document.getElementById('settingsForm');
  const baseUrlInput = document.getElementById('baseUrl');
  const fieldCourseInput = document.getElementById('fieldCourse');
  const fieldTeacherInput = document.getElementById('fieldTeacher');
  const fieldDateInput = document.getElementById('fieldDate');
  const fieldTimeInput = document.getElementById('fieldTime');
  const fieldSessionInput = document.getElementById('fieldSession');
  const fieldStudentNameInput = document.getElementById('fieldStudentName');
  const fieldStudentFirstNameInput = document.getElementById('fieldStudentFirstName');
  const fieldStudentIdInput = document.getElementById('fieldStudentId');
  const resetBtn = document.getElementById('resetBtn');
  const testBtn = document.getElementById('testBtn');
  const testOutput = document.getElementById('testOutput');
  const generatedUrlSpan = document.getElementById('generatedUrl');
  const testQrDiv = document.getElementById('testQr');
  const profileSelect = document.getElementById('profileSelect');
  const newProfileBtn = document.getElementById('newProfileBtn');
  const deleteProfileBtn = document.getElementById('deleteProfileBtn');
  const importIdsBtn = document.getElementById('importIdsBtn');
  const pasteIdsTextarea = document.getElementById('pasteIds');

  // Valeurs par défaut (pour nouveau profil)
  const DEFAULT_VALUES = {
    BASE_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSe.../viewform',
    FIELD_COURSE: 'entry.1234567890',
    FIELD_TEACHER: 'entry.9876543210',
    FIELD_DATE: 'entry.5555555555',
    FIELD_TIME: 'entry.4444444444',
    FIELD_SESSION: 'entry.3333333333',
    FIELD_STUDENT_NAME: 'entry.2222222222',
    FIELD_STUDENT_FIRST_NAME: 'entry.1111111111',
    FIELD_STUDENT_ID: 'entry.6666666666'
  };

  // Définition des champs (label + input correspondant)
  const FIELD_DEFS = [
    { key: 'course',           label: 'Matière',              input: () => fieldCourseInput },
    { key: 'teacher',          label: 'Enseignant',           input: () => fieldTeacherInput },
    { key: 'date',             label: 'Date',                 input: () => fieldDateInput },
    { key: 'time',             label: 'Heure',                input: () => fieldTimeInput },
    { key: 'session',          label: 'ID de session',        input: () => fieldSessionInput },
    { key: 'studentName',      label: 'Nom étudiant',         input: () => fieldStudentNameInput },
    { key: 'studentFirstName', label: 'Prénom étudiant',      input: () => fieldStudentFirstNameInput },
    { key: 'studentId',        label: 'N° étudiant',          input: () => fieldStudentIdInput }
  ];

  let currentProfileId = null;

  // ---------------------------------------------------------------------------
  // Gestion des profils
  // ---------------------------------------------------------------------------

  function loadProfiles() {
    const profiles = ProfileManager.getProfiles();
    profileSelect.innerHTML = '';
    if (profiles.length === 0) {
      profileSelect.innerHTML = '<option value="">Aucun profil</option>';
      return;
    }
    const currentId = ProfileManager.getCurrentProfileId();
    profiles.forEach(profile => {
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

  function loadSettings() {
    if (!currentProfileId) {
      resetFormToDefaults();
      return;
    }
    const settings = ProfileManager.getProfileSettings(currentProfileId);
    if (!settings) {
      resetFormToDefaults();
      return;
    }
    baseUrlInput.value = settings.baseUrl || DEFAULT_VALUES.BASE_URL;
    fieldCourseInput.value = settings.fieldCourse || DEFAULT_VALUES.FIELD_COURSE;
    fieldTeacherInput.value = settings.fieldTeacher || DEFAULT_VALUES.FIELD_TEACHER;
    fieldDateInput.value = settings.fieldDate || DEFAULT_VALUES.FIELD_DATE;
    fieldTimeInput.value = settings.fieldTime || DEFAULT_VALUES.FIELD_TIME;
    fieldSessionInput.value = settings.fieldSession || DEFAULT_VALUES.FIELD_SESSION;
    fieldStudentNameInput.value = settings.fieldStudentName || DEFAULT_VALUES.FIELD_STUDENT_NAME;
    fieldStudentFirstNameInput.value = settings.fieldStudentFirstName || DEFAULT_VALUES.FIELD_STUDENT_FIRST_NAME;
    fieldStudentIdInput.value = settings.fieldStudentId || DEFAULT_VALUES.FIELD_STUDENT_ID;
  }

  function resetFormToDefaults() {
    baseUrlInput.value = DEFAULT_VALUES.BASE_URL;
    fieldCourseInput.value = DEFAULT_VALUES.FIELD_COURSE;
    fieldTeacherInput.value = DEFAULT_VALUES.FIELD_TEACHER;
    fieldDateInput.value = DEFAULT_VALUES.FIELD_DATE;
    fieldTimeInput.value = DEFAULT_VALUES.FIELD_TIME;
    fieldSessionInput.value = DEFAULT_VALUES.FIELD_SESSION;
    fieldStudentNameInput.value = DEFAULT_VALUES.FIELD_STUDENT_NAME;
    fieldStudentFirstNameInput.value = DEFAULT_VALUES.FIELD_STUDENT_FIRST_NAME;
    fieldStudentIdInput.value = DEFAULT_VALUES.FIELD_STUDENT_ID;
  }

  function saveSettings() {
    if (!currentProfileId) {
      alert('Veuillez sélectionner un profil.');
      return;
    }
    const settings = {
      baseUrl: baseUrlInput.value.trim(),
      fieldCourse: fieldCourseInput.value.trim(),
      fieldTeacher: fieldTeacherInput.value.trim(),
      fieldDate: fieldDateInput.value.trim(),
      fieldTime: fieldTimeInput.value.trim(),
      fieldSession: fieldSessionInput.value.trim(),
      fieldStudentName: fieldStudentNameInput.value.trim(),
      fieldStudentFirstName: fieldStudentFirstNameInput.value.trim(),
      fieldStudentId: fieldStudentIdInput.value.trim()
    };
    ProfileManager.saveProfileSettings(currentProfileId, settings);
    alert('Configuration enregistrée pour le profil !');
  }

  function resetToDefaults() {
    if (!currentProfileId) {
      alert('Veuillez sélectionner un profil.');
      return;
    }
    if (confirm('Voulez‑vous vraiment restaurer les valeurs par défaut pour ce profil ?')) {
      ProfileManager.saveProfileSettings(currentProfileId, DEFAULT_VALUES);
      loadSettings();
      alert('Valeurs par défaut restaurées.');
    }
  }

  function createNewProfile() {
    const name = prompt('Nom du nouveau profil :');
    if (!name) return;
    const pin = prompt('Code PIN (optionnel, laissez vide) :', '');
    const id = ProfileManager.createProfile(name, pin || '');
    ProfileManager.setCurrentProfileId(id);
    loadProfiles();
    loadSettings();
  }

  function deleteCurrentProfile() {
    if (!currentProfileId) return;
    if (confirm('Voulez‑vous vraiment supprimer ce profil ? Tous ses paramètres seront perdus.')) {
      ProfileManager.deleteProfile(currentProfileId);
      loadProfiles();
      loadSettings();
    }
  }

  // ---------------------------------------------------------------------------
  // Test / génération URL
  // ---------------------------------------------------------------------------

  function generateTestUrl() {
    if (!currentProfileId) {
      alert('Veuillez sélectionner un profil.');
      return;
    }
    const baseUrl = baseUrlInput.value.trim();
    if (!baseUrl) {
      alert("Veuillez d'abord définir l'URL de base.");
      return;
    }
    const params = new URLSearchParams({
      [fieldCourseInput.value.trim()]: 'Mathématiques',
      [fieldTeacherInput.value.trim()]: 'Dupont',
      [fieldDateInput.value.trim()]: '2026-03-11',
      [fieldTimeInput.value.trim()]: '14:00',
      [fieldSessionInput.value.trim()]: 'SESS_TEST'
    });
    const url = `${baseUrl}?${params.toString()}`;
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

  // ---------------------------------------------------------------------------
  // Import des IDs via le bookmarklet (méthode fiable — sans proxy CORS)
  //
  // Pourquoi les proxies CORS échouent :
  //   Google détecte les proxies et renvoie une page vide ou un captcha.
  //   Le bookmarklet contourne ce problème en s'exécutant directement dans
  //   le contexte de la page Google Forms ouverte dans le navigateur.
  //   Il lit window.FB_PUBLIC_LOAD_DATA_ sans restriction CORS.
  //
  // Flux :
  //   1. Enseignant ouvre le formulaire dans son navigateur
  //   2. Clique sur le favori bookmarklet → prompt avec les IDs
  //   3. Copie les IDs et les colle dans la textarea
  //   4. Clique "Importer" → showMappingPanel() s'affiche
  // ---------------------------------------------------------------------------

  /**
   * Parse et importe les IDs collés depuis le bookmarklet.
   * Accepte : virgule, espace, retour à la ligne comme séparateurs.
   */
  function importIds() {
    const raw = pasteIdsTextarea ? pasteIdsTextarea.value.trim() : '';
    if (!raw) {
      alert('Veuillez coller les IDs dans le champ texte.');
      return;
    }
    // Extraire tous les tokens au format entry.XXXXXXXXX
    const matches = raw.match(/entry\.\d+/g);
    if (!matches || matches.length === 0) {
      alert(
        'Aucun ID au format "entry.XXXXXXXXX" trouvé dans le texte collé.\n\n' +
        'Assurez-vous d\'avoir bien copié le résultat du bookmarklet.\n' +
        'Exemple attendu : entry.12345678, entry.98765432, …'
      );
      return;
    }
    // Dédupliquer en conservant l'ordre
    const seen = new Set();
    const entryIds = matches.filter(id => !seen.has(id) && seen.add(id));
    showMappingPanel(entryIds);
  }

  /**
   * Affiche le panneau d'assignation des IDs détectés.
   * Permet à l'enseignant d'associer chaque entry.xxx au bon champ du formulaire.
   */
  function showMappingPanel(entryIds) {
    const panel = document.getElementById('detectPanel');
    const mappingsDiv = document.getElementById('detectMappings');

    if (!panel || !mappingsDiv) {
      // Fallback simple : assigner dans l'ordre
      FIELD_DEFS.forEach((field, i) => {
        if (entryIds[i]) field.input().value = entryIds[i];
      });
      alert(`${entryIds.length} ID(s) détecté(s) et assignés dans l'ordre. Vérifiez les champs.`);
      return;
    }

    // Vider le panneau précédent
    mappingsDiv.innerHTML = '';

    FIELD_DEFS.forEach((field, index) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; align-items:center; gap:12px; margin-bottom:10px;';

      const lbl = document.createElement('label');
      lbl.textContent = field.label;
      lbl.style.cssText = 'min-width:160px; font-weight:bold; color:#555;';

      const sel = document.createElement('select');
      sel.id = 'map_' + field.key;
      sel.className = 'form-control';
      sel.style.cssText = 'flex:1; padding:8px 12px; border:1px solid #ccc; border-radius:6px;';

      // Option vide
      const emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = '— Ne pas remplir —';
      sel.appendChild(emptyOpt);

      // Options pour chaque entry trouvé
      entryIds.forEach((id, i) => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = id;
        // Pré-sélection par défaut dans l'ordre d'apparition
        if (i === index) opt.selected = true;
        sel.appendChild(opt);
      });

      row.appendChild(lbl);
      row.appendChild(sel);
      mappingsDiv.appendChild(row);
    });

    // Afficher le résumé du nombre d'IDs trouvés
    const info = document.getElementById('detectInfo');
    if (info) info.textContent = `✅ ${entryIds.length} champ(s) détecté(s) dans le formulaire.`;

    panel.classList.remove('hidden');
    panel.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Applique la configuration depuis le panneau de mapping vers les champs du formulaire.
   */
  function applyMapping() {
    FIELD_DEFS.forEach(field => {
      const sel = document.getElementById('map_' + field.key);
      if (sel && sel.value) {
        field.input().value = sel.value;
      }
    });
    document.getElementById('detectPanel').classList.add('hidden');
    alert("Configuration appliquée ! N'oubliez pas de cliquer sur «\u00a0Enregistrer la configuration\u00a0».");
  }

  // ---------------------------------------------------------------------------
  // Initialisation et événements
  // ---------------------------------------------------------------------------

  loadProfiles();
  loadSettings();

  profileSelect.addEventListener('change', function () {
    const selectedId = this.value;
    if (selectedId) {
      ProfileManager.setCurrentProfileId(selectedId);
      currentProfileId = selectedId;
      loadSettings();
    } else {
      currentProfileId = null;
    }
    updateDeleteButton();
  });

  newProfileBtn.addEventListener('click', createNewProfile);
  deleteProfileBtn.addEventListener('click', deleteCurrentProfile);

  settingsForm.addEventListener('submit', function (e) {
    e.preventDefault();
    saveSettings();
  });

  resetBtn.addEventListener('click', resetToDefaults);
  testBtn.addEventListener('click', generateTestUrl);
  if (importIdsBtn) importIdsBtn.addEventListener('click', importIds);

  // Boutons du panneau de mapping
  const applyMappingBtn = document.getElementById('applyMappingBtn');
  const cancelMappingBtn = document.getElementById('cancelMappingBtn');
  if (applyMappingBtn) applyMappingBtn.addEventListener('click', applyMapping);
  if (cancelMappingBtn) {
    cancelMappingBtn.addEventListener('click', () => {
      document.getElementById('detectPanel').classList.add('hidden');
    });
  }
});
