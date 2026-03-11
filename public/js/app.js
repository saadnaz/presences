// Enregistrement du Service Worker pour la PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker enregistré avec succès:', registration.scope);
      })
      .catch(error => {
        console.log('Échec de l\'enregistrement du Service Worker:', error);
      });
  });
}

// Fonction pour afficher un message toast
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s;
    `;
  if (type === 'success') toast.style.backgroundColor = '#4CAF50';
  else if (type === 'error') toast.style.backgroundColor = '#f44336';
  else toast.style.backgroundColor = '#2196F3';

  document.body.appendChild(toast);
  setTimeout(() => toast.style.opacity = '1', 10);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}

// Détecter si l'app est installée en mode standalone
function isRunningStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

// Ajouter un événement pour installer la PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Afficher un bouton d'installation personnalisé si besoin
  const installBtn = document.getElementById('installBtn');
  if (installBtn) {
    installBtn.style.display = 'block';
    installBtn.addEventListener('click', () => {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Utilisateur a installé la PWA');
        }
        deferredPrompt = null;
      });
    });
  }
});

// Vérifier la connexion réseau
function updateOnlineStatus() {
  if (navigator.onLine) {
    showToast('Vous êtes de nouveau en ligne', 'success');
  } else {
    showToast('Vous êtes hors ligne. Les fonctionnalités peuvent être limitées.', 'error');
  }
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Initialisation
document.addEventListener('DOMContentLoaded', function () {
  console.log('Application de gestion des présences chargée.');
  if (isRunningStandalone()) {
    console.log('Application exécutée en mode standalone.');
  }
});