# Gestion des Présences - Solution PWA avec QR Code

Une application web progressive (PWA) permettant aux enseignants de générer des QR codes pour les séances de cours, et aux étudiants de scanner ces codes pour enregistrer leur présence. Les données sont stockées dans Google Sheets via Google Forms.

## Fonctionnalités

- **Interface enseignant** : génération de QR codes contenant un lien vers un formulaire Google Forms pré‑rempli avec les détails de la séance (matière, enseignant, date, heure, ID de session).
- **Interface étudiant** : scanner de QR code via la caméra du téléphone ou téléchargement d'une image, redirection automatique vers le formulaire de présence.
- **PWA** : installation sur l'écran d'accueil, fonctionnement hors‑ligne partiel, expérience native.
- **Intégration Google** : utilisation de Google Forms pour collecter les réponses et Google Sheets pour stocker les données.
- **Responsive** : adapté aux mobiles, tablettes et ordinateurs.

## Structure du projet

```
presence/
├── public/                     # Fichiers statiques
│   ├── index.html             # Page d'accueil
│   ├── teacher.html           # Interface enseignant
│   ├── student.html           # Interface étudiant
│   ├── css/style.css          # Styles communs
│   ├── js/
│   │   ├── app.js             # Logique PWA commune
│   │   ├── teacher.js         # Génération QR code
│   │   └── student.js         # Scanner QR code
│   ├── manifest.json          # Manifeste PWA
│   └── sw.js                  # Service Worker
├── docs/google-setup.md       # Guide d'intégration Google
└── README.md                  # Ce fichier
```

## Démarrage rapide

### Option 1 – Sans installation
Ouvrez directement `public/index.html` dans un navigateur (certaines fonctionnalités, comme le Service Worker ou la caméra, peuvent nécessiter un serveur HTTP).

### Option 2 – Avec un serveur local (recommandé)
Utilisez `npx` pour lancer un serveur HTTP statique sans rien installer.

```bash
npx serve public
```

Ouvrez ensuite [http://localhost:3000](http://localhost:3000).

### Option 3 – Avec npm
Si vous avez Node.js et npm, vous pouvez installer les dépendances de développement et lancer le serveur via les scripts définis dans `package.json`.

```bash
npm install
npm start
```

Cela lancera également un serveur sur le port 3000.

### Option 4 – Live Server (VSCode)
Si vous utilisez Visual Studio Code, l'extension **Live Server** permet de servir le projet en un clic.

Quelle que soit la méthode, assurez‑vous d'utiliser **HTTP** (et non `file://`) pour que le Service Worker et l'accès à la caméra fonctionnent correctement.

## Configuration Google Forms/Sheets

Pour que l'application fonctionne pleinement, vous devez configurer un formulaire Google Forms et le lier à une feuille Google Sheets. Suivez le guide détaillé dans [docs/google-setup.md](docs/google-setup.md).

### Étapes résumées

1. Créez un formulaire Google avec les champs nécessaires.
2. Obtenez les IDs des champs (entry.xxxxxxx).
3. Liez le formulaire à une feuille Google Sheets.
4. Mettez à jour l'URL de base et les IDs dans `public/js/teacher.js`.
5. Testez la génération et le scan.

## Déploiement

L'application est une PWA statique, déployable sur n'importe quel hébergement web (GitHub Pages, Netlify, Vercel, Firebase Hosting, etc.).

### Déploiement sur GitHub Pages

1. Poussez le projet sur un dépôt GitHub.
2. Allez dans **Settings → Pages**.
3. Sélectionnez la branche `main` et le dossier `/public` (ou la racine si le projet est structuré ainsi).
4. L'application sera accessible à l'adresse `https://username.github.io/repo`.

### Déploiement sur Netlify

- Drag‑and‑drop du dossier `public` sur [netlify.com](https://netlify.com).

## Technologies utilisées

- HTML5, CSS3, JavaScript (ES6)
- [qrcode.js](https://github.com/davidshimjs/qrcodejs) – génération de QR codes côté client
- [jsQR](https://github.com/cozmo/jsQR) – décodage de QR codes côté client
- Service Workers – mise en cache et fonctionnement hors‑ligne
- Web App Manifest – installation PWA
- Google Forms API – pré‑remplissage d'URL

## Améliorations possibles

- Authentification des enseignants et étudiants (via Google OAuth).
- Tableau de bord de visualisation des présences intégré.
- Notifications push pour rappeler les séances.
- Export des données en PDF/Excel.
- Intégration avec Google Classroom (API).
- Multi‑utilisateur avec gestion des rôles.

## Licence

Ce projet est fourni sous licence MIT. Utilisez‑le librement pour vos besoins éducatifs ou professionnels.

## Auteur

Solution développée pour répondre au besoin de gestion des présences dans les établissements d'enseignement.

---

**Remarque** : Cette application ne stocke aucune donnée en propre ; elle repose entièrement sur les services Google (Forms, Sheets) pour la persistance. Assurez‑vous de respecter les politiques de confidentialité de votre institution.