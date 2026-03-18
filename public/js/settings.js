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
  const formSectionsSelect = document.getElementById('formSections');

  // Valeurs par défaut (pour nouveau profil)
  const DEFAULT_VALUES = {
    BASE_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSe.../viewform',
    FORM_SECTIONS: 1,
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
    if (formSectionsSelect) formSectionsSelect.value = String(settings.formSections || DEFAULT_VALUES.FORM_SECTIONS);
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
    if (formSectionsSelect) formSectionsSelect.value = String(DEFAULT_VALUES.FORM_SECTIONS);
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
      formSections: formSectionsSelect ? parseInt(formSectionsSelect.value, 10) : 1,
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
   * Supporte deux formats :
   *   - Nouveau (avec labels) : "Nom du champ : entry.12345678"
   *   - Ancien (IDs seuls)   : "entry.12345678, entry.98765432"
   *
   * Détecte automatiquement le nombre de sections si la ligne
   * "SECTIONS:N" est présente dans la sortie du bookmarklet.
   */
  function importIds() {
    const raw = pasteIdsTextarea ? pasteIdsTextarea.value.trim() : '';
    if (!raw) {
      alert('Veuillez coller le résultat du bookmarklet dans le champ texte.');
      return;
    }

    // ── Détecter le nombre de sections (ligne "SECTIONS:N") ────────
    const sectionsMatch = raw.match(/SECTIONS:(\d+)/i);
    if (sectionsMatch && formSectionsSelect) {
      const detectedSections = parseInt(sectionsMatch[1], 10);
      if (detectedSections >= 1 && detectedSections <= 4) {
        formSectionsSelect.value = String(detectedSections);
      }
    }

    // ── Parser les lignes avec labels ──────────────────────────────
    // Format : "Label : entry.XXXXXXXXX"
    const labeledEntries = [];
    const lines = raw.split('\n');
    lines.forEach(function (line) {
      const m = line.match(/^(.+?)\s*:\s*(entry\.\d+)/i);
      if (m) {
        labeledEntries.push({ label: m[1].trim(), id: m[2].trim() });
      }
    });

    if (labeledEntries.length > 0) {
      // Nouveau format avec labels → auto-mapping intelligent
      autoAssignFromLabels(labeledEntries);
      return;
    }

    // ── Ancien format : IDs seuls ──────────────────────────────────
    const matches = raw.match(/entry\.\d+/g);
    if (!matches || matches.length === 0) {
      alert(
        'Aucun ID au format "entry.XXXXXXXXX" trouvé.\n\n' +
        'Assurez-vous d\'avoir copié le résultat complet du bookmarklet.'
      );
      return;
    }
    const seen = new Set();
    const entryIds = matches.filter(id => !seen.has(id) && seen.add(id));
    showMappingPanel(entryIds.map(id => ({ label: id, id })));
  }

  /**
   * Auto-mapping intelligent basé sur les labels des champs du formulaire.
   * Utilise des mots-clés pour deviner quel champ correspond à quel entry ID.
   */
  function autoAssignFromLabels(labeledEntries) {
    // Mots-clés par champ (ordre : plus spécifique d'abord)
    const KEYWORDS = {
      fieldStudentFirstName: ['prénom', 'prenom', 'first name', 'firstname', 'given'],
      fieldStudentName:      ['nom', 'name', 'last name', 'lastname', 'family'],
      fieldStudentId:        ['numéro', 'numero', 'matricule', 'student id', 'étudiant id', 'id étudiant', 'id'],
      fieldCourse:           ['matière', 'matiere', 'cours', 'course', 'module', 'subject'],
      fieldTeacher:          ['enseignant', 'teacher', 'prof', 'formateur'],
      fieldDate:             ['date'],
      fieldTime:             ['heure', 'time', 'horaire'],
      fieldSession:          ['session', 'séance', 'seance', 'id session', 'session id']
    };

    const assigned = {};

    // Pour chaque champ cible, trouver le meilleur candidat par mots-clés
    Object.entries(KEYWORDS).forEach(([fieldKey, keywords]) => {
      for (const kw of keywords) {
        const match = labeledEntries.find(e =>
          e.label.toLowerCase().includes(kw) && !Object.values(assigned).includes(e.id)
        );
        if (match) {
          assigned[fieldKey] = match.id;
          break;
        }
      }
    });

    // Appliquer les assignations trouvées
    let countAssigned = 0;
    const fieldInputs = {
      fieldCourse:           fieldCourseInput,
      fieldTeacher:          fieldTeacherInput,
      fieldDate:             fieldDateInput,
      fieldTime:             fieldTimeInput,
      fieldSession:          fieldSessionInput,
      fieldStudentName:      fieldStudentNameInput,
      fieldStudentFirstName: fieldStudentFirstNameInput,
      fieldStudentId:        fieldStudentIdInput
    };
    Object.entries(assigned).forEach(([fieldKey, entryId]) => {
      if (fieldInputs[fieldKey] && entryId) {
        fieldInputs[fieldKey].value = entryId;
        countAssigned++;
      }
    });

    // Les champs non auto-assignés → afficher le panneau de mapping manuel
    const unassigned = labeledEntries.filter(e => !Object.values(assigned).includes(e.id));
    const totalFields = labeledEntries.length;

    if (countAssigned === totalFields || unassigned.length === 0) {
      alert(
        `✅ ${countAssigned} champ(s) assigné(s) automatiquement sur ${totalFields}.\n\n` +
        'Vérifiez les champs ci-dessous puis cliquez sur « Enregistrer la configuration ».'
      );
    } else {
      // Afficher le panneau pour les non-assignés
      showMappingPanel(labeledEntries);
      const info = document.getElementById('detectInfo');
      if (info) info.textContent =
        `✅ ${countAssigned} champ(s) auto-assigné(s). ` +
        `Vérifiez et complétez les ${unassigned.length} champ(s) restant(s).`;
    }
  }

  /**
   * Affiche le panneau d'assignation manuelle.
   * @param {Array} entries  Tableau de {label, id} ou simples chaînes entry.xxx
   */
  function showMappingPanel(entries) {
    const panel = document.getElementById('detectPanel');
    const mappingsDiv = document.getElementById('detectMappings');

    // Normaliser : accepte [{label,id}] ou ['entry.xxx']
    const normalized = entries.map(e =>
      typeof e === 'string' ? { label: e, id: e } : e
    );

    if (!panel || !mappingsDiv) {
      // Fallback simple
      FIELD_DEFS.forEach((field, i) => {
        if (normalized[i]) field.input().value = normalized[i].id;
      });
      alert(`${normalized.length} ID(s) assigné(s) dans l'ordre. Vérifiez les champs.`);
      return;
    }

    // Lire les valeurs actuelles pour pré-sélectionner
    const currentValues = {
      course:           fieldCourseInput.value,
      teacher:          fieldTeacherInput.value,
      date:             fieldDateInput.value,
      time:             fieldTimeInput.value,
      session:          fieldSessionInput.value,
      studentName:      fieldStudentNameInput.value,
      studentFirstName: fieldStudentFirstNameInput.value,
      studentId:        fieldStudentIdInput.value
    };

    mappingsDiv.innerHTML = '';

    FIELD_DEFS.forEach((field) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; align-items:center; gap:12px; margin-bottom:10px; flex-wrap:wrap;';

      const lbl = document.createElement('label');
      lbl.textContent = field.label;
      lbl.style.cssText = 'min-width:160px; font-weight:bold; color:#555;';

      const sel = document.createElement('select');
      sel.id = 'map_' + field.key;
      sel.className = 'form-control';
      sel.style.cssText = 'flex:1; min-width:200px; padding:8px 12px; border:1px solid #ccc; border-radius:6px;';

      const emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = '— Ne pas remplir —';
      sel.appendChild(emptyOpt);

      normalized.forEach((entry) => {
        const opt = document.createElement('option');
        opt.value = entry.id;
        opt.textContent = entry.label !== entry.id
          ? entry.label + ' (' + entry.id + ')'
          : entry.id;
        // Pré-sélectionner si déjà assigné ou si valeur courante correspond
        if (entry.id === currentValues[field.key]) opt.selected = true;
        sel.appendChild(opt);
      });

      row.appendChild(lbl);
      row.appendChild(sel);
      mappingsDiv.appendChild(row);
    });

    const info = document.getElementById('detectInfo');
    if (info) info.textContent = `${normalized.length} champ(s) détecté(s) dans le formulaire. Vérifiez les associations.`;

    panel.classList.remove('hidden');
    panel.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Applique la configuration depuis le panneau de mapping vers les champs du formulaire.
   */
  function applyMapping() {
    let count = 0;
    FIELD_DEFS.forEach(field => {
      const sel = document.getElementById('map_' + field.key);
      if (sel && sel.value) {
        field.input().value = sel.value;
        count++;
      }
    });
    document.getElementById('detectPanel').classList.add('hidden');
    alert(`${count} champ(s) appliqué(s).\nN'oubliez pas de cliquer sur « Enregistrer la configuration ».`);
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

  // ── Bouton : charger le mapping depuis mapping-id.json ──────────────────
  const loadMappingFileBtn = document.getElementById('loadMappingFileBtn');
  const loadMappingFileMsg = document.getElementById('loadMappingFileMsg');

  function showLoadMsg(text, ok) {
    if (!loadMappingFileMsg) return;
    loadMappingFileMsg.style.display = 'inline';
    loadMappingFileMsg.style.color = ok ? '#2e7d32' : '#b71c1c';
    loadMappingFileMsg.textContent = text;
    if (ok) setTimeout(function () { loadMappingFileMsg.style.display = 'none'; }, 4000);
  }

  if (loadMappingFileBtn) {
    loadMappingFileBtn.addEventListener('click', function () {
      loadMappingFileBtn.disabled = true;
      loadMappingFileBtn.textContent = '⏳ Chargement…';

      fetch('mapping-id.json?_=' + Date.now())
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (data) {
          loadMappingFileBtn.disabled = false;
          loadMappingFileBtn.textContent = '📂 Charger mapping-id.json';

          // 1. URL de base
          if (data.baseUrl && baseUrlInput) {
            baseUrlInput.value = data.baseUrl;
          }

          // 2. Nombre de sections
          if (data.sections && formSectionsSelect) {
            var s = parseInt(data.sections, 10);
            if (s >= 1 && s <= 4) formSectionsSelect.value = String(s);
          }

          // 3. Mapping → réutilise autoAssignFromLabels (remplace _ par espace pour la correspondance)
          if (data.mapping && typeof data.mapping === 'object') {
            var entries = Object.entries(data.mapping).map(function (kv) {
              return { label: kv[0].replace(/_/g, ' '), id: kv[1] };
            });
            if (entries.length > 0) {
              autoAssignFromLabels(entries);
              showLoadMsg('✅ ' + entries.length + ' champ(s) chargé(s) depuis mapping-id.json', true);
            } else {
              showLoadMsg('⚠️ Aucun champ trouvé dans mapping-id.json', false);
            }
          } else {
            showLoadMsg('⚠️ Clé "mapping" absente du fichier JSON', false);
          }
        })
        .catch(function (err) {
          loadMappingFileBtn.disabled = false;
          loadMappingFileBtn.textContent = '📂 Charger mapping-id.json';
          console.error('[Mapping] Erreur fetch :', err);
          showLoadMsg('❌ Fichier mapping-id.json introuvable ou invalide', false);
        });
    });
  }

  // ── Bouton mobile : copier le code du bookmarklet dans le presse-papier ──
  const copyBookmarkletBtn = document.getElementById('copyBookmarkletBtn');
  if (copyBookmarkletBtn) {
    copyBookmarkletBtn.addEventListener('click', function () {
      const link = document.getElementById('bookmarkletLink');
      if (!link) return;
      const code = link.getAttribute('href');
      const msg = document.getElementById('copyBookmarkletMsg');

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function () {
          if (msg) { msg.style.display = 'inline'; setTimeout(function () { msg.style.display = 'none'; }, 2500); }
        }).catch(function () {
          fallbackCopy(code, msg);
        });
      } else {
        fallbackCopy(code, msg);
      }
    });
  }

  function fallbackCopy(text, msgEl) {
    // Fallback pour navigateurs sans Clipboard API (ex : Android WebView)
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      if (msgEl) { msgEl.style.display = 'inline'; setTimeout(function () { msgEl.style.display = 'none'; }, 2500); }
    } catch (e) {
      alert('Impossible de copier automatiquement.\nCopiez manuellement le contenu de la zone texte ci-dessus.');
    }
    document.body.removeChild(ta);
  }
});
