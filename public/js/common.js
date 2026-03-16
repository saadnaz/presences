// Gestion multi‑utilisateur avec localStorage

const STORAGE_KEY_PROFILES = 'presence_profiles';
const STORAGE_KEY_CURRENT_PROFILE = 'presence_current_profile';
const STORAGE_PREFIX_SETTINGS = 'presence_settings_';

// Récupérer la liste des profils
function getProfiles() {
  const data = localStorage.getItem(STORAGE_KEY_PROFILES);
  return data ? JSON.parse(data) : [];
}

// Sauvegarder la liste des profils
function saveProfiles(profiles) {
  localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
}

// Récupérer l'ID du profil actif
function getCurrentProfileId() {
  return localStorage.getItem(STORAGE_KEY_CURRENT_PROFILE) || null;
}

// Définir le profil actif
function setCurrentProfileId(id) {
  localStorage.setItem(STORAGE_KEY_CURRENT_PROFILE, id);
}

// Créer un nouveau profil
function createProfile(name, pin = '') {
  const profiles = getProfiles();
  const id = 'PROF_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  const newProfile = { id, name, pin };
  profiles.push(newProfile);
  saveProfiles(profiles);
  // Créer des paramètres par défaut pour ce profil
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

// Supprimer un profil (et ses paramètres)
function deleteProfile(id) {
  const profiles = getProfiles().filter(p => p.id !== id);
  saveProfiles(profiles);
  localStorage.removeItem(STORAGE_PREFIX_SETTINGS + id);
  // Si le profil supprimé était le profil actif, on efface la sélection
  if (getCurrentProfileId() === id) {
    localStorage.removeItem(STORAGE_KEY_CURRENT_PROFILE);
  }
}

// Récupérer les paramètres d'un profil
function getProfileSettings(profileId) {
  const key = STORAGE_PREFIX_SETTINGS + profileId;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

// Sauvegarder les paramètres d'un profil
function saveProfileSettings(profileId, settings) {
  const key = STORAGE_PREFIX_SETTINGS + profileId;
  localStorage.setItem(key, JSON.stringify(settings));
}

// Récupérer les paramètres du profil actif (pour compatibilité)
function getCurrentProfileSettings() {
  const profileId = getCurrentProfileId();
  if (!profileId) return null;
  return getProfileSettings(profileId);
}

// Exporter les fonctions
window.ProfileManager = {
  getProfiles,
  saveProfiles,
  getCurrentProfileId,
  setCurrentProfileId,
  createProfile,
  deleteProfile,
  getProfileSettings,
  saveProfileSettings,
  getCurrentProfileSettings
};

// Initialisation : créer un profil par défaut si aucun n'existe
(function initProfiles() {
  const profiles = getProfiles();
  if (profiles.length === 0) {
    const defaultId = createProfile('Principal');
    setCurrentProfileId(defaultId);
  }
})();