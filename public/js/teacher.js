document.addEventListener('DOMContentLoaded', function () {
  // Éléments DOM
  const sessionForm = document.getElementById('sessionForm');
  const qrSection = document.getElementById('qrSection');
  const qrcodeDiv = document.getElementById('qrcode');
  const qrUrlInput = document.getElementById('qrUrl');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn = document.getElementById('resetBtn');
  const newSessionBtn = document.getElementById('newSessionBtn');
  const profileSelectTeacher = document.getElementById('profileSelectTeacher');

  // Initialiser la date et l'heure actuelles
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const time = now.toTimeString().substring(0, 5);
  document.getElementById('date').value = today;
  document.getElementById('time').value = time;

  let currentQR = null;
  let currentQRUrl = '';
  let currentProfileId = null;

  // Charger les profils et remplir le select
  function loadProfiles() {
    const profiles = ProfileManager.getProfiles();
    profileSelectTeacher.innerHTML = '';
    if (profiles.length === 0) {
      profileSelectTeacher.innerHTML = '<option value="">Aucun profil</option>';
      return;
    }
    const currentId = ProfileManager.getCurrentProfileId();
    profiles.forEach(profile => {
      const option = document.createElement('option');
      option.value = profile.id;
      option.textContent = profile.name + (profile.pin ? ' (avec PIN)' : '');
      if (profile.id === currentId) option.selected = true;
      profileSelectTeacher.appendChild(option);
    });
    currentProfileId = currentId;
  }

  // Récupérer les paramètres sauvegardés du profil actuel
  function getStoredSettings() {
    if (!currentProfileId) {
      alert('Veuillez sélectionner un profil enseignant.');
      return null;
    }
    const settings = ProfileManager.getProfileSettings(currentProfileId);
    if (!settings) {
      alert('Aucun paramètre trouvé pour ce profil. Configurez-les dans les paramètres.');
      return null;
    }
    return settings;
  }

  // Générer l'URL du formulaire Google Forms
  function generateFormUrl(sessionData) {
    const settings = getStoredSettings();
    if (!settings) return null;
    // Ajouter le paramètre usp=pp_url si absent
    let baseFormUrl = settings.baseUrl.trim();
    if (!baseFormUrl.includes('?')) {
      baseFormUrl += '?usp=pp_url';
    }
    // Paramètres pré-remplis
    const params = new URLSearchParams();
    params.append(settings.fieldCourse, sessionData.course);
    params.append(settings.fieldTeacher, sessionData.teacher);
    params.append(settings.fieldDate, sessionData.date);
    params.append(settings.fieldTime, sessionData.time);
    params.append(settings.fieldSession, sessionData.sessionId);
    // Paramètres supplémentaires pour l'affichage étudiant
    params.append('course', sessionData.course);
    params.append('teacher', sessionData.teacher);
    params.append('date', sessionData.date);
    params.append('time', sessionData.time);
    params.append('sessionId', sessionData.sessionId);
    return `${baseFormUrl}&${params.toString()}`;
  }

  // Générer un ID de session unique
  function generateSessionId() {
    return 'SESS_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  }

  // Générer le QR code avec qrcodejs
  function generateQRCode(url) {
    // Effacer le précédent QR code
    qrcodeDiv.innerHTML = '';
    if (typeof QRCode === 'undefined') {
      alert('Bibliothèque QR code non chargée. Veuillez vérifier votre connexion.');
      return;
    }
    try {
      new QRCode(qrcodeDiv, {
        text: url,
        width: 250,
        height: 250,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.L,
        version: 20
      });
      // Stocker l'URL
      currentQRUrl = url;
      qrUrlInput.value = url;
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la génération du QR code');
    }
  }

  // Télécharger le QR code en image
  function downloadQRCode() {
    if (!currentQRUrl) return;
    const canvas = qrcodeDiv.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `presence_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // Copier l'URL dans le presse-papier
  function copyUrlToClipboard() {
    qrUrlInput.select();
    qrUrlInput.setSelectionRange(0, 99999); // Pour mobile
    navigator.clipboard.writeText(qrUrlInput.value)
      .then(() => {
        alert('URL copiée dans le presse-papier !');
      })
      .catch(err => {
        console.error('Erreur de copie : ', err);
        alert('Échec de la copie');
      });
  }

  // Réinitialiser le formulaire
  function resetForm() {
    sessionForm.reset();
    document.getElementById('date').value = today;
    document.getElementById('time').value = time;
    qrSection.classList.add('hidden');
    qrcodeDiv.innerHTML = '';
    currentQRUrl = '';
  }

  // Nouvelle séance (cacher QR)
  function newSession() {
    qrSection.classList.add('hidden');
    sessionForm.reset();
    document.getElementById('date').value = today;
    document.getElementById('time').value = time;
    qrcodeDiv.innerHTML = '';
    currentQRUrl = '';
    // Remonter en haut
    window.scrollTo(0, 0);
  }

  // Gestion de la soumission du formulaire
  sessionForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const course = document.getElementById('course').value.trim();
    const teacher = document.getElementById('teacher').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    if (!course || !teacher || !date || !time) {
      alert('Veuillez remplir tous les champs.');
      return;
    }

    const sessionId = generateSessionId();
    const sessionData = {
      course,
      teacher,
      date,
      time,
      sessionId
    };

    // Générer l'URL du formulaire
    const formUrl = generateFormUrl(sessionData);
    if (!formUrl) return;

    generateQRCode(formUrl);
    qrSection.classList.remove('hidden');

    // Défiler vers la section QR
    qrSection.scrollIntoView({ behavior: 'smooth' });
  });

  // Événements des boutons
  copyBtn.addEventListener('click', copyUrlToClipboard);
  downloadBtn.addEventListener('click', downloadQRCode);
  resetBtn.addEventListener('click', resetForm);
  newSessionBtn.addEventListener('click', newSession);

  // Gestion du sélecteur de profil
  profileSelectTeacher.addEventListener('change', function () {
    const selectedId = this.value;
    if (selectedId) {
      ProfileManager.setCurrentProfileId(selectedId);
      currentProfileId = selectedId;
    } else {
      currentProfileId = null;
    }
  });

  // Initialisation
  loadProfiles();

  // Message d'information sur la configuration Google Forms
  console.log('Note : Pour utiliser réellement Google Forms, vous devez créer un formulaire et mettre à jour les IDs de champs dans generateFormUrl().');
});