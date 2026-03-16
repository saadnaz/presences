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
  const autoDetectBtn = document.getElementById('autoDetectBtn');

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

  let currentProfileId = null;

  // Charger la liste des profils et remplir le select
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

  // Mettre à jour l'état du bouton Supprimer
  function updateDeleteButton() {
    deleteProfileBtn.disabled = !currentProfileId;
  }

  // Charger les paramètres du profil sélectionné dans le formulaire
  function loadSettings() {
    if (!currentProfileId) {
      // Aucun profil sélectionné, vider les champs
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

  // Réinitialiser le formulaire aux valeurs par défaut
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

  // Sauvegarder les paramètres du profil actuel
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

  // Restaurer les valeurs par défaut pour le profil actuel
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

  // Générer une URL de test avec les paramètres actuels
  function generateTestUrl() {
    if (!currentProfileId) {
      alert('Veuillez sélectionner un profil.');
      return;
    }
    const baseUrl = baseUrlInput.value.trim();
    if (!baseUrl) {
      alert('Veuillez d\'abord définir l\'URL de base.');
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

    // Générer QR code avec qrcodejs
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

  // Détecter automatiquement les IDs des champs depuis l'URL du formulaire
  function detectFieldIds() {
    const baseUrl = baseUrlInput.value.trim();
    if (!baseUrl) {
      alert('Veuillez d\'abord saisir l\'URL de base du formulaire.');
      return;
    }

    // Liste de proxys CORS (en cas d'indisponibilité de l'un)
    const proxyTemplates = [
      'https://corsproxy.io/?{url}',
      'https://api.allorigins.win/raw?url={url}',
      'https://api.codetabs.com/v1/proxy?quest={url}'
    ];

    autoDetectBtn.disabled = true;
    autoDetectBtn.textContent = 'Détection en cours...';

    // Fonction récursive pour essayer chaque proxy
    const tryProxy = (index) => {
      if (index >= proxyTemplates.length) {
        alert('Tous les proxys CORS ont échoué. Vérifiez votre connexion ou essayez manuellement.');
        autoDetectBtn.disabled = false;
        autoDetectBtn.textContent = 'Auto‑détecter les IDs';
        return;
      }

      const proxyUrl = proxyTemplates[index].replace('{url}', encodeURIComponent(baseUrl));
      console.log(`Essai du proxy ${index}: ${proxyUrl}`);

      fetch(proxyUrl)
        .then(response => {
          if (!response.ok) throw new Error(`Proxy ${index} : ${response.status} ${response.statusText}`);
          return response.text();
        })
        .then(html => {
          console.log('HTML reçu, longueur:', html.length);
          // Parser le HTML pour extraire les noms des champs entry.
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          // Sélectionner tous les inputs, textarea, select dont le name commence par "entry."
          const inputs = doc.querySelectorAll('input[name^="entry."], textarea[name^="entry."], select[name^="entry."]');
          // Extraire les noms et filtrer ceux qui correspondent au motif entry.xxxx
          const entryIds = Array.from(inputs).map(el => el.name).filter(name => /^entry\.[0-9]+/.test(name));

          if (entryIds.length === 0) {
            // Aucun champ entry. trouvé, afficher un extrait du HTML pour débogage
            console.warn('Aucun champ entry. trouvé. Extrait du HTML:', html.substring(0, 1000));
            alert('Aucun champ "entry." trouvé dans le formulaire. Vérifiez que l\'URL est correcte, que le formulaire est publié et qu\'il contient des champs de type texte. Vous pouvez aussi consulter la console pour plus de détails.');
            autoDetectBtn.disabled = false;
            autoDetectBtn.textContent = 'Auto‑détecter les IDs';
            return;
          }

          console.log('IDs trouvés:', entryIds);
          // Remplir les champs avec les IDs trouvés (dans l'ordre d'apparition)
          // Nous assumons que l'ordre correspond à: course, teacher, date, time, session, studentName, studentFirstName, studentId
          // Si plus d'IDs que de champs, on ignore les excédents ; si moins, on laisse les autres vides.
          const fieldOrder = [
            fieldCourseInput,
            fieldTeacherInput,
            fieldDateInput,
            fieldTimeInput,
            fieldSessionInput,
            fieldStudentNameInput,
            fieldStudentFirstNameInput,
            fieldStudentIdInput
          ];

          entryIds.slice(0, fieldOrder.length).forEach((entryId, index) => {
            fieldOrder[index].value = entryId;
          });

          alert(`Détection terminée : ${entryIds.length} champ(s) trouvé(s). Les IDs ont été remplis.`);
          autoDetectBtn.disabled = false;
          autoDetectBtn.textContent = 'Auto‑détecter les IDs';
        })
        .catch(error => {
          console.error(`Proxy ${index} a échoué:`, error);
          // Essayer le proxy suivant
          tryProxy(index + 1);
        });
    };

    tryProxy(0);
  }

  // Créer un nouveau profil
  function createNewProfile() {
    const name = prompt('Nom du nouveau profil :');
    if (!name) return;
    const pin = prompt('Code PIN (optionnel, laissez vide) :', '');
    const id = ProfileManager.createProfile(name, pin || '');
    ProfileManager.setCurrentProfileId(id);
    loadProfiles();
    loadSettings();
  }

  // Supprimer le profil actuel
  function deleteCurrentProfile() {
    if (!currentProfileId) return;
    if (confirm('Voulez‑vous vraiment supprimer ce profil ? Tous ses paramètres seront perdus.')) {
      ProfileManager.deleteProfile(currentProfileId);
      loadProfiles();
      loadSettings();
    }
  }

  // Initialisation
  loadProfiles();
  loadSettings();

  // Événements
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
  autoDetectBtn.addEventListener('click', detectFieldIds);
});