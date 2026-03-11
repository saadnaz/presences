# Déploiement en production

Ce document explique comment déployer l'application de gestion des présences sur un serveur de production.

## Options de déploiement

### 1. GitHub Pages (gratuit, statique)
- Poussez le code sur un dépôt GitHub.
- Allez dans **Settings → Pages**.
- Sélectionnez la branche source (ex. `main`) et le dossier `public`.
- L'application sera accessible à l'adresse `https://<username>.github.io/<repository>`.

**Remarque** : GitHub Pages sert les fichiers statiques, mais le Service Worker nécessite HTTPS (déjà présent). Assurez‑vous que les URLs relatives sont correctes (les liens doivent être relatifs à la racine du dépôt). Si vous déployez dans un sous‑chemin, modifiez la balise `<base>` dans les fichiers HTML ou configurez le préfixe de chemin.

### 2. Netlify (recommandé)
- Créez un compte sur [netlify.com](https://netlify.com).
- Glissez‑déposez le dossier `public` sur l'interface Netlify, ou liez votre dépôt Git.
- Netlify détectera automatiquement les fichiers statiques et déploiera.
- L'URL sera `https://<nom‑projet>.netlify.app`.

Pour une configuration avancée, créez un fichier `netlify.toml` à la racine du projet :
```toml
[build]
  publish = "public"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. Vercel
- Créez un compte sur [vercel.com](https://vercel.com).
- Importez votre dépôt Git.
- Vercel détectera automatiquement le projet statique.
- L'URL sera `https://<nom‑projet>.vercel.app`.

Ajoutez un fichier `vercel.json` à la racine pour configurer les réécritures :
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 4. Serveur web traditionnel (Apache, Nginx)
- Copiez le contenu du dossier `public` dans le répertoire web de votre serveur (ex. `/var/www/html`).
- Assurez‑vous que le serveur sert les fichiers statiques et qu'il supporte les routes HTML5 (réécriture d'URL). 
- Pour Apache, ajoutez un fichier `.htaccess` dans `public/` :
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```
- Pour Nginx, ajoutez dans la configuration du site :
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 5. Firebase Hosting
- Installez Firebase CLI : `npm install -g firebase-tools`
- Connectez‑vous : `firebase login`
- Initialisez le projet : `firebase init hosting`
- Sélectionnez le dossier `public` comme répertoire public.
- Déployez : `firebase deploy --only hosting`

## Configuration HTTPS

Toutes les plateformes ci‑dessus fournissent HTTPS automatiquement. Pour un serveur auto‑hébergé, obtenez un certificat Let's Encrypt via Certbot.

## Variables d'environnement

L'application ne nécessite pas de variables d'environnement côté serveur, car toute la configuration est stockée dans le `localStorage` du navigateur. Cependant, si vous souhaitez pré‑configurer des valeurs par défaut, vous pouvez éditer le fichier `public/js/settings.js` (const `DEFAULT_VALUES`).

## Mise à jour après déploiement

1. Modifiez les fichiers dans `public/`.
2. Poussez les changements sur Git (si déploiement via Git).
3. La plateforme de déploiement reconstruira et redéploiera automatiquement (si configuré).
4. Pour un serveur manuel, recopiez les fichiers mis à jour.

## Vérification du déploiement

Après déploiement, visitez l'URL et vérifiez que :
- La page d'accueil s'affiche.
- Les liens enseignant, étudiant et paramètres fonctionnent.
- La génération de QR code produit une URL valide (testez avec les paramètres par défaut).
- Le scanner étudiant peut accéder à la caméra (nécessite HTTPS).
- Le Service Worker est enregistré (dans les outils de développement, onglet Application).

## Dépannage

- **Les chemins des ressources (CSS, JS) sont cassés** : assurez‑vous que les chemins relatifs sont corrects par rapport à la racine du site. Si l'application est déployée dans un sous‑répertoire, utilisez une balise `<base href="/sous‑repertoire/">` dans chaque HTML.
- **Le Service Worker ne fonctionne pas** : vérifiez qu'il est servi avec l'en‑tête `Content-Type: application/javascript` et que la portée est correcte.
- **La caméra ne s'active pas** : HTTPS est obligatoire pour l'accès à la caméra sur la plupart des navigateurs.
- **Les paramètres ne persistent pas** : le `localStorage` est par origine (protocole + domaine + port). Si vous changez de domaine, les paramètres seront perdus.

## Sécurité

- L'application ne contient pas de backend sensible ; toutes les données sont stockées dans Google Sheets via Google Forms.
- Aucun token ou credential n'est inclus dans le code source.
- Assurez‑vous que le formulaire Google Forms est configuré avec les permissions appropriées (limité à votre organisation si nécessaire).

## Support

Pour toute question, consultez la documentation d'intégration Google (`docs/google‑setup.md`) ou les dépôts des plateformes de déploiement.