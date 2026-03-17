// ============================================================
// ProfileManager — gestion multi-profils avec localStorage
// ============================================================

const STORAGE_KEY_PROFILES = 'presence_profiles';
const STORAGE_KEY_CURRENT_PROFILE = 'presence_current_profile';
const STORAGE_PREFIX_SETTINGS = 'presence_settings_';

function getProfiles() {
  const data = localStorage.getItem(STORAGE_KEY_PROFILES);
  return data ? JSON.parse(data) : [];
}

function saveProfiles(profiles) {
  localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
}

function getCurrentProfileId() {
  return localStorage.getItem(STORAGE_KEY_CURRENT_PROFILE) || null;
}

function setCurrentProfileId(id) {
  localStorage.setItem(STORAGE_KEY_CURRENT_PROFILE, id);
}

function createProfile(name, pin = '') {
  const profiles = getProfiles();
  const id = 'PROF_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  profiles.push({ id, name, pin });
  saveProfiles(profiles);
  const defaultSettings = {
    baseUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSe.../viewform',
    fieldCourse: 'entry.1234567890',
    fieldTeacher: 'entry.9876543210',
    fieldDate: 'entry.5555555555',
    fieldTime: 'entry.4444444444',
    fieldSession: 'entry.3333333333',
    fieldStudentName: 'entry.2222222222',
    fieldStudentFirstName: 'entry.1111111111',
    fieldStudentId: 'entry.6666666666'
  };
  saveProfileSettings(id, defaultSettings);
  return id;
}

function deleteProfile(id) {
  const profiles = getProfiles().filter(p => p.id !== id);
  saveProfiles(profiles);
  localStorage.removeItem(STORAGE_PREFIX_SETTINGS + id);
  if (getCurrentProfileId() === id) {
    localStorage.removeItem(STORAGE_KEY_CURRENT_PROFILE);
  }
}

function getProfileSettings(profileId) {
  const data = localStorage.getItem(STORAGE_PREFIX_SETTINGS + profileId);
  return data ? JSON.parse(data) : null;
}

function saveProfileSettings(profileId, settings) {
  localStorage.setItem(STORAGE_PREFIX_SETTINGS + profileId, JSON.stringify(settings));
}

function getCurrentProfileSettings() {
  const profileId = getCurrentProfileId();
  if (!profileId) return null;
  return getProfileSettings(profileId);
}

// ============================================================
// Vérification du PIN
// ============================================================

/**
 * Vérifie le PIN saisi pour un profil donné.
 * Retourne true si le profil n'a pas de PIN ou si le PIN est correct.
 */
function verifyPin(profileId, enteredPin) {
  const profiles = getProfiles();
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return false;
  if (!profile.pin) return true; // Pas de PIN configuré
  return profile.pin === String(enteredPin).trim();
}

// ============================================================
// Soumission Google Forms (sans backend, no-cors)
// ============================================================

/**
 * Soumet des données à un Google Form via fetch no-cors.
 *
 * Google Forms ne supporte pas CORS : la réponse sera toujours
 * "opaque" (on ne peut pas lire le statut). Si la requête réussit
 * au niveau réseau, la Promise resolve — si le réseau coupe, elle
 * rejette.
 *
 * @param {string} responseUrl  URL /formResponse du formulaire
 * @param {Object} fields       { 'entry.xxx': 'valeur', ... }
 * @returns {Promise}
 */
function submitToGoogleForms(responseUrl, fields) {
  const body = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
    .join('&');

  return fetch(responseUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
}

/**
 * Construit l'URL /formResponse depuis l'URL /viewform.
 */
function getFormResponseUrl(baseUrl) {
  return baseUrl
    .replace('/viewform', '/formResponse')
    .split('?')[0]; // retirer tout paramètre
}

// ============================================================
// Encodage / décodage des données de session dans l'URL QR
// ============================================================

/**
 * Encode un objet JS en base64-URL-safe pour l'intégrer dans une URL.
 * Utilisé pour passer les données de session de teacher.html → student.html.
 */
function encodeSessionData(data) {
  try {
    const json = JSON.stringify(data);
    console.log('encodeSessionData json:', json);
    // btoa ne supporte pas les caractères non-ASCII → encodeURIComponent d'abord
    const encoded = btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    console.log('encodeSessionData encoded:', encoded);
    return encoded;
  } catch (e) {
    console.error('encodeSessionData error:', e);
    return null;
  }
}

/**
 * Décode une chaîne base64-URL-safe en objet JS.
 */
function decodeSessionData(encoded) {
  console.log('decodeSessionData encoded:', encoded, 'length:', encoded.length, 'first10:', encoded.substring(0, 10));
  try {
    // Restaurer les caractères base64 standard
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    // Rajouter le padding si nécessaire
    const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
    console.log('b64:', b64, 'padded:', padded);
    const decoded = JSON.parse(decodeURIComponent(escape(atob(padded))));
    console.log('decoded session:', decoded);
    return decoded;
  } catch (e) {
    console.error('decodeSessionData error:', e);
    return null;
  }
}

// ============================================================
// Export global
// ============================================================

window.ProfileManager = {
  getProfiles,
  saveProfiles,
  getCurrentProfileId,
  setCurrentProfileId,
  createProfile,
  deleteProfile,
  getProfileSettings,
  saveProfileSettings,
  getCurrentProfileSettings,
  verifyPin,
  submitToGoogleForms,
  getFormResponseUrl,
  encodeSessionData,
  decodeSessionData
};

// Initialisation : créer un profil par défaut si aucun n'existe
(function initProfiles() {
  if (getProfiles().length === 0) {
    const defaultId = createProfile('Principal');
    setCurrentProfileId(defaultId);
  }
})();
