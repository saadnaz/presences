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

  // Clés de stockage
  const STORAGE_KEYS = {
    BASE_URL: 'presence_base_url',
    FIELD_COURSE: 'presence_field_course',
    FIELD_TEACHER: 'presence_field_teacher',
    FIELD_DATE: 'presence_field_date',
    FIELD_TIME: 'presence_field_time',
    FIELD_SESSION: 'presence_field_session',
    FIELD_STUDENT_NAME: 'presence_field_student_name',
    FIELD_STUDENT_FIRST_NAME: 'presence_field_student_first_name',
    FIELD_STUDENT_ID: 'presence_field_student_id'
  };

  // Valeurs par défaut (exemple)
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

  // Charger les paramètres sauvegardés
  function loadSettings() {
    baseUrlInput.value = localStorage.getItem(STORAGE_KEYS.BASE_URL) || DEFAULT_VALUES.BASE_URL;
    fieldCourseInput.value = localStorage.getItem(STORAGE_KEYS.FIELD_COURSE) || DEFAULT_VALUES.FIELD_COURSE;
    fieldTeacherInput.value = localStorage.getItem(STORAGE_KEYS.FIELD_TEACHER) || DEFAULT_VALUES.FIELD_TEACHER;
    fieldDateInput.value = localStorage.getItem(STORAGE_KEYS.FIELD_DATE) || DEFAULT_VALUES.FIELD_DATE;
    fieldTimeInput.value = localStorage.getItem(STORAGE_KEYS.FIELD_TIME) || DEFAULT_VALUES.FIELD_TIME;
    fieldSessionInput.value = localStorage.getItem(STORAGE_KEYS.FIELD_SESSION) || DEFAULT_VALUES.FIELD_SESSION;
    fieldStudentNameInput.value = localStorage.getItem(STORAGE_KEYS.FIELD_STUDENT_NAME) || DEFAULT_VALUES.FIELD_STUDENT_NAME;
    fieldStudentFirstNameInput.value = localStorage.getItem(STORAGE_KEYS.FIELD_STUDENT_FIRST_NAME) || DEFAULT_VALUES.FIELD_STUDENT_FIRST_NAME;
    fieldStudentIdInput.value = localStorage.getItem(STORAGE_KEYS.FIELD_STUDENT_ID) || DEFAULT_VALUES.FIELD_STUDENT_ID;
  }

  // Sauvegarder les paramètres
  function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.BASE_URL, baseUrlInput.value.trim());
    localStorage.setItem(STORAGE_KEYS.FIELD_COURSE, fieldCourseInput.value.trim());
    localStorage.setItem(STORAGE_KEYS.FIELD_TEACHER, fieldTeacherInput.value.trim());
    localStorage.setItem(STORAGE_KEYS.FIELD_DATE, fieldDateInput.value.trim());
    localStorage.setItem(STORAGE_KEYS.FIELD_TIME, fieldTimeInput.value.trim());
    localStorage.setItem(STORAGE_KEYS.FIELD_SESSION, fieldSessionInput.value.trim());
    localStorage.setItem(STORAGE_KEYS.FIELD_STUDENT_NAME, fieldStudentNameInput.value.trim());
    localStorage.setItem(STORAGE_KEYS.FIELD_STUDENT_FIRST_NAME, fieldStudentFirstNameInput.value.trim());
    localStorage.setItem(STORAGE_KEYS.FIELD_STUDENT_ID, fieldStudentIdInput.value.trim());
    alert('Configuration enregistrée !');
  }

  // Restaurer les valeurs par défaut
  function resetToDefaults() {
    if (confirm('Voulez‑vous vraiment restaurer les valeurs par défaut ? Votre configuration actuelle sera perdue.')) {
      localStorage.clear();
      loadSettings();
      alert('Valeurs par défaut restaurées.');
    }
  }

  // Générer une URL de test
  function generateTestUrl() {
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

  // Événements
  settingsForm.addEventListener('submit', function (e) {
    e.preventDefault();
    saveSettings();
  });

  resetBtn.addEventListener('click', resetToDefaults);
  testBtn.addEventListener('click', generateTestUrl);

  // Initialisation
  loadSettings();
});