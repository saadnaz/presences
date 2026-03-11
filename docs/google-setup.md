# Intégration Google Forms & Google Sheets

Cette documentation explique comment connecter l'application de gestion des présences à Google Forms et Google Sheets pour enregistrer automatiquement les présences des étudiants.

## Principe

1. L'enseignant génère un QR code contenant une URL vers un formulaire Google Forms pré‑rempli avec les informations de la séance (matière, enseignant, date, heure, ID de session).
2. L'étudiant scanne le QR code et est redirigé vers ce formulaire.
3. L'étudiant remplit ses informations (nom, prénom, numéro d'étudiant) et soumet.
4. Les réponses sont automatiquement enregistrées dans une feuille Google Sheets.
5. L'enseignant peut visualiser les présences dans le Sheets.

## Compte administrateur

L'application utilise Google Forms et Google Sheets comme backend. **Le compte Google qui crée le formulaire sera le compte administrateur** des données. Les étapes suivantes doivent être effectuées avec le compte Google de l'établissement ou de l'enseignant qui doit gérer les présences.

Si vous avez plusieurs enseignants, chacun peut créer son propre formulaire (ou partager le même formulaire avec des IDs de champs distincts). L'application permet de configurer une seule intégration à la fois via la page de paramétrage (`settings.html`).

## Étapes de configuration

### 1. Créer un Google Form

- Allez sur [forms.google.com](https://forms.google.com) et créez un nouveau formulaire.
- Ajoutez les champs suivants (ajustez selon vos besoins) :
  - **Matière** : champ texte court (pré‑rempli via l'URL)
  - **Enseignant** : champ texte court (pré‑rempli)
  - **Date de la séance** : champ date (pré‑rempli)
  - **Heure de début** : champ heure (pré‑rempli)
  - **ID de session** : champ texte court (caché, pré‑rempli)
  - **Nom de l'étudiant** : champ texte court (obligatoire)
  - **Prénom** : champ texte court (obligatoire)
  - **Numéro d'étudiant** : champ texte court (obligatoire)
  - **Timestamp** : horodatage automatique (activé dans les paramètres du formulaire)

### 2. Obtenir les IDs des champs

Chaque champ a un identifiant unique (entry.xxxxxxx). Pour le trouver :
- Ouvrez le formulaire en mode édition.
- Cliquez sur les trois points (⋮) → **Afficher le code source** (ou utilisez l'outil de développement du navigateur).
- Cherchez `name="entry.xxxxxxx"` pour chaque champ. Notez ces IDs.

Exemple :
- Matière : `entry.1234567890`
- Enseignant : `entry.9876543210`
- Date : `entry.5555555555`
- Heure : `entry.4444444444`
- ID session : `entry.3333333333`
- Nom : `entry.2222222222`
- Prénom : `entry.1111111111`
- Numéro étudiant : `entry.6666666666`

### 3. Activer la collecte des adresses e‑mail (optionnel)

Dans les paramètres du formulaire (engrenage), activez « Collecter les adresses e‑mail » si vous souhaitez identifier les étudiants via leur compte Google.

### 4. Lier le formulaire à une feuille Google Sheets

- Dans l'onglet **Réponses** du formulaire, cliquez sur l'icône verte Sheets.
- Créez une nouvelle feuille ou liez‑en une existante. Toutes les soumissions y apparaîtront.

### 5. Générer l'URL pré‑remplie

L'URL de base de votre formulaire ressemble à :
```
https://docs.google.com/forms/d/e/XXXXXXXXXXXXXXX/viewform
```

Pour la pré‑remplir, ajoutez des paramètres `?usp=pp_url&entry.xxxxxxx=valeur`.

Exemple complet :
```
https://docs.google.com/forms/d/e/XXXXXXXXXXXXXXX/viewform?usp=pp_url&entry.1234567890=Mathématiques&entry.9876543210=Dupont&entry.5555555555=2026-03-11&entry.4444444444=14:00&entry.3333333333=SESS_123456
```

### 6. Configurer l'application via la page de paramétrage

L'application dispose d'une page de paramétrage intégrée qui simplifie la configuration. Au lieu de modifier le code, il suffit de :

1. Accédez à la page **Paramètres** (lien disponible sur la page d'accueil, ou ouvrez `settings.html`).
2. Remplissez l'**URL de base du formulaire** (l'URL complète de votre formulaire Google Forms, sans les paramètres).
3. Remplissez les **IDs des champs** (entry.xxxxxxx) pour chaque information (matière, enseignant, date, heure, ID de session, nom étudiant, prénom, numéro).
4. Cliquez sur **Enregistrer la configuration**.

Les paramètres sont sauvegardés localement dans votre navigateur et utilisés automatiquement lors de la génération des QR codes.

Vous pouvez également tester la génération d'URL directement depuis cette page avec le bouton **Tester la génération d'URL**.

### 7. Tester

- Générez un QR code avec l'interface enseignant.
- Scannez‑le avec l'interface étudiant (ou directement avec un téléphone).
- Vérifiez que le formulaire s'ouvre avec les champs pré‑remplis.
- Soumettez une réponse et vérifiez qu'elle apparaît bien dans la feuille Google Sheets.

## Automatisation avancée (optionnel)

Si vous souhaitez traiter les données (envoi de confirmation, statistiques), vous pouvez utiliser **Google Apps Script** attaché au Sheets.

Exemple de script qui envoie un e‑mail de confirmation :

```javascript
function onFormSubmit(e) {
    const sheet = e.source.getActiveSheet();
    const row = e.range.getRow();
    const data = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
    const email = data[1]; // supposant que la colonne B est l'e‑mail
    const name = data[2];
    const course = data[3];
    const subject = 'Confirmation de présence';
    const body = `Bonjour ${name},\nVotre présence au cours de ${course} a été enregistrée avec succès.`;
    MailApp.sendEmail(email, subject, body);
}
```

Pour l'activer : dans le Sheets, cliquez sur **Extensions → Apps Script**, collez le code et configurez un déclencheur `On form submit`.

## Dépannage

- **Les champs ne se pré‑remplissent pas** : vérifiez les IDs et l'URL (elle doit contenir `?usp=pp_url`).
- **Accès refusé** : assurez‑vous que le formulaire est accessible par « Toute personne avec le lien » (paramètres de partage).
- **La feuille Sheets ne se met pas à jour** : vérifiez le lien dans l'onglet Réponses du formulaire.
- **Le QR code ne fonctionne pas sur certains téléphones** : utilisez une URL courte (avec un service de raccourcissement) si l'URL est trop longue.

## Ressources

- [Documentation Google Forms pré‑remplis](https://developers.google.com/forms/prefill)
- [Créer un formulaire Google](https://support.google.com/docs/answer/6281888)
- [Google Apps Script](https://developers.google.com/apps-script)

---

Une fois l'intégration terminée, votre système de gestion des présences est opérationnel. Les données seront stockées en toute sécurité dans votre Google Drive et accessibles depuis n'importe quel appareil.