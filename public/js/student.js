document.addEventListener('DOMContentLoaded', function () {

  // ============================================================
  // Détection du mode : formulaire présence (URL ?d=) ou scanner
  // ============================================================
  var params  = new URLSearchParams(window.location.search);
  var encoded = params.get('d');
  var sessionFromUrl = null;

  if (encoded) {
    try {
      sessionFromUrl = ProfileManager.decodeSessionData(encoded);
    } catch (e) {
      console.error('[Student] Erreur décodage session URL:', e);
    }
  }

  if (sessionFromUrl && sessionFromUrl.f && sessionFromUrl.e) {
    // Arrivée via lien direct (ex: caméra + partage du lien)
    showAttendanceForm(sessionFromUrl);
  } else {
    startScanner();
  }

  // ============================================================
  // MODE A — Scanner / importeur QR
  // ============================================================
  function startScanner() {
    document.getElementById('scannerSection').style.display = 'block';
    document.getElementById('formSection').style.display    = 'none';
    document.getElementById('confirmSection').style.display = 'none';

    var video      = document.getElementById('video');
    var canvas     = document.getElementById('canvas');
    var ctx        = canvas.getContext('2d');
    var startBtn   = document.getElementById('startBtn');
    var stopBtn    = document.getElementById('stopBtn');
    var fileInput  = document.getElementById('fileInput');
    var resultDiv  = document.getElementById('scanResultSection');
    var msgDiv     = document.getElementById('scanMessage');
    var previewBox = document.getElementById('imagePreviewContainer');
    var previewImg = document.getElementById('imagePreview');

    var stream       = null;
    var scanning     = false;
    var scanInterval = null;
    var lastUrl      = '';

    // ── Caméra ────────────────────────────────────────────────────
    function startCamera() {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        .then(function (s) {
          stream = s;
          video.srcObject = stream;
          startBtn.disabled = true;
          stopBtn.disabled  = false;
          scanning = true;
          scanInterval = setInterval(scanFrame, 400);
        })
        .catch(function (err) {
          console.error(err);
          showMsg('Impossible d\'accéder à la caméra. Vérifiez les permissions.', 'error');
        });
    }

    function stopCamera() {
      if (stream) {
        stream.getTracks().forEach(function (t) { t.stop(); });
        video.srcObject = null;
        stream = null;
      }
      scanning = false;
      startBtn.disabled = false;
      stopBtn.disabled  = true;
      if (scanInterval) { clearInterval(scanInterval); scanInterval = null; }
    }

    function scanFrame() {
      if (!scanning || video.readyState !== video.HAVE_ENOUGH_DATA) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var code = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'dontInvert' });
      if (code) processQrUrl(code.data);
    }

    // ── Traitement de l'URL décodée ────────────────────────────────
    function processQrUrl(url) {
      if (url === lastUrl) return;
      lastUrl = url;
      stopCamera();

      console.log('[QR] URL :', url.substring(0, 120));

      var dParam = null;
      try {
        var u = new URL(url);
        dParam = u.searchParams.get('d');
      } catch (e) {
        // URL relative ou malformée — essayer en direct
        var idx = url.indexOf('?d=');
        if (idx !== -1) dParam = url.substring(idx + 3).split('&')[0];
      }

      console.log('[QR] dParam :', dParam ? dParam.substring(0, 40) + '...' : 'absent');

      if (dParam) {
        var sess = null;
        try {
          sess = ProfileManager.decodeSessionData(dParam);
          console.log('[QR] Session décodée :', JSON.stringify(sess).substring(0, 120));
        } catch (e) {
          console.error('[QR] Erreur décodage :', e);
        }

        if (sess && sess.f && sess.e) {
          // ── TRANSITION IMMÉDIATE vers le formulaire ──────────────
          // Pas de setTimeout, pas de window.location.href
          // On cache le scanner et on affiche le formulaire dans la foulée
          showMsg(
            '<strong>✅ QR code valide — affichage du formulaire</strong>',
            'success'
          );
          // Délai minimal (1 frame) pour laisser le message s'afficher
          setTimeout(function () {
            stopCamera();
            showAttendanceForm(sess);
          }, 80);

        } else {
          var reason = !sess
            ? 'Le décodage du contenu a échoué (données corrompues).'
            : !sess.f
              ? 'URL du formulaire manquante dans le QR code.'
              : 'Identifiants de champs manquants dans le QR code.';
          showMsg(
            '<strong>❌ QR code non valide</strong><br>' + reason +
            '<br><small>Demandez à votre enseignant de regénérer le QR code depuis les Paramètres.</small>',
            'error'
          );
        }
        return;
      }

      // Ancien format Google Forms
      if (url.indexOf('docs.google.com/forms') !== -1) {
        showMsg(
          '<strong>⚠️ Ancien format détecté</strong><br>' +
          'Ce QR code provient d\'une ancienne version de l\'application.<br>' +
          'Demandez à votre enseignant de regénérer le QR code.',
          'warn'
        );
        return;
      }

      showMsg('<strong>❓ QR code non reconnu</strong><br>Utilisez bien le QR code de votre enseignant.', 'error');
    }

    // ── Import image QR ───────────────────────────────────────────
    function handleImageFile(file) {
      showMsg('⏳ Analyse de l\'image <strong>' + escHtml(file.name) + '</strong>…', 'info');

      var objUrl = URL.createObjectURL(file);
      previewImg.src  = objUrl;
      previewBox.style.display = 'block';

      var img    = new Image();
      var reader = new FileReader();

      reader.onload = function (ev) {
        img.onload = function () {
          canvas.width  = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);
          console.log('[QR] Image :', canvas.width, 'x', canvas.height);

          var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          var code = jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: 'attemptBoth'
          });
          URL.revokeObjectURL(objUrl);

          if (code) {
            processQrUrl(code.data);
          } else {
            showMsg(
              '<strong>❌ Aucun QR code trouvé</strong><br>' +
              'Résolution : ' + canvas.width + ' × ' + canvas.height + ' px<br>' +
              '<small>Utilisez l\'image originale, non recadrée.</small>',
              'error'
            );
          }
        };
        img.onerror = function () {
          showMsg('<strong>❌ Image illisible</strong>', 'error');
          URL.revokeObjectURL(objUrl);
        };
        img.src = ev.target.result;
      };
      reader.onerror = function () {
        showMsg('<strong>❌ Erreur de lecture du fichier</strong>', 'error');
      };
      reader.readAsDataURL(file);
    }

    // ── Message de statut ─────────────────────────────────────────
    function showMsg(html, type) {
      var palette = {
        success: { bg: '#d4edda', bd: '#c3e6cb', tx: '#155724' },
        info:    { bg: '#d1ecf1', bd: '#bee5eb', tx: '#0c5460' },
        warn:    { bg: '#fff3cd', bd: '#ffeeba', tx: '#856404' },
        error:   { bg: '#f8d7da', bd: '#f5c6cb', tx: '#721c24' }
      };
      var p = palette[type] || palette.info;
      msgDiv.innerHTML = html;
      msgDiv.style.cssText =
        'padding:14px 16px; border-radius:8px; line-height:1.6;' +
        'background:' + p.bg + '; border:1px solid ' + p.bd + '; color:' + p.tx + ';';
      resultDiv.classList.remove('hidden');
    }

    // ── Listeners ─────────────────────────────────────────────────
    startBtn.addEventListener('click', startCamera);
    stopBtn.addEventListener('click', stopCamera);
    fileInput.addEventListener('change', function (e) {
      if (e.target.files && e.target.files.length > 0) {
        handleImageFile(e.target.files[0]);
        // Reset pour permettre de re-sélectionner le même fichier
        setTimeout(function () { e.target.value = ''; }, 100);
      }
    });
  }

  // ============================================================
  // MODE B — Formulaire de présence
  // Appelé directement (sans rechargement de page) depuis startScanner()
  // ============================================================
  function showAttendanceForm(session) {
    console.log('[Form] Affichage formulaire, session :', JSON.stringify(session).substring(0, 120));

    // Basculer les sections
    document.getElementById('scannerSection').style.display = 'none';
    document.getElementById('formSection').style.display    = 'block';
    document.getElementById('confirmSection').style.display = 'none';
    document.getElementById('pageSubtitle').textContent     = 'Complétez vos informations';

    // Scroll vers le haut pour que l'étudiant voie le formulaire
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Bannière de confirmation de séance
    var grid = document.getElementById('sessionInfoGrid');
    if (!grid) {
      console.error('[Form] #sessionInfoGrid introuvable !');
      return;
    }
    var items = [
      { icon: '📚', label: 'Cours',      val: session.c  },
      { icon: '👨‍🏫', label: 'Enseignant', val: session.t  },
      { icon: '📅', label: 'Date',       val: formatDate(session.d) },
      { icon: '⏰', label: 'Heure',      val: session.tm }
    ];
    grid.innerHTML = items.map(function (it) {
      return '<div style="padding:10px 12px;background:white;border-radius:8px;border:1px solid #c8e6c9;">' +
        '<div style="font-size:0.8rem;color:#888;">' + it.icon + ' ' + it.label + '</div>' +
        '<div style="font-weight:bold;color:#2c3e50;margin-top:3px;">' + escHtml(it.val || '—') + '</div>' +
        '</div>';
    }).join('');

    // Vider d'éventuels champs préremplis
    document.getElementById('studentLastName').value  = '';
    document.getElementById('studentFirstName').value = '';
    document.getElementById('studentId').value        = '';

    // Mettre le focus sur le premier champ
    setTimeout(function () {
      document.getElementById('studentLastName').focus();
    }, 300);

    // Gestion de la soumission
    var form      = document.getElementById('attendanceForm');
    var submitBtn = document.getElementById('attendanceSubmitBtn');
    var statusDiv = document.getElementById('attendanceStatus');

    // Cloner le formulaire pour supprimer les anciens listeners (cas de multi-scan)
    var newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    form      = newForm;
    submitBtn = document.getElementById('attendanceSubmitBtn');

    form.addEventListener('submit', function (evt) {
      evt.preventDefault();

      var lastName  = document.getElementById('studentLastName').value.trim();
      var firstName = document.getElementById('studentFirstName').value.trim();
      var studentId = document.getElementById('studentId').value.trim();

      if (!lastName || !firstName || !studentId) {
        showStatus(statusDiv, '⚠️ Veuillez remplir tous les champs.', 'error');
        return;
      }

      submitBtn.disabled    = true;
      submitBtn.textContent = '⏳ Envoi en cours…';
      showStatus(statusDiv, 'Enregistrement de votre présence…', 'info');

      // ── Construire les champs du Google Form ────────────────────
      // Le formulaire Google a deux sections :
      //   1. Infos séance (cours, enseignant, date, heure, sessionId)  → pré-remplies via session
      //   2. Infos étudiant (nom, prénom, numéro)                      → saisies ici
      var e = session.e;   // raccourci vers les entry IDs
      var fields = {};

      // Section séance (données de l'enseignant transmises via QR)
      if (e.c  && session.c)  fields[e.c]  = session.c;
      if (e.t  && session.t)  fields[e.t]  = session.t;
      if (e.d  && session.d)  fields[e.d]  = session.d;
      if (e.tm && session.tm) fields[e.tm] = session.tm;
      if (e.s  && session.s)  fields[e.s]  = session.s;

      // Section étudiant (saisie directe)
      if (e.n)  fields[e.n]  = lastName;
      if (e.fn) fields[e.fn] = firstName;
      if (e.id) fields[e.id] = studentId;

      console.log('[Form] Soumission :', Object.keys(fields).length, 'champ(s)');

      ProfileManager.submitToGoogleForms(session.f, fields)
        .then(function () {
          showConfirmation(session, lastName, firstName, studentId);
        })
        .catch(function (err) {
          console.error('[Form] Erreur soumission :', err);
          submitBtn.disabled    = false;
          submitBtn.textContent = '✅ Valider ma présence';
          showStatus(statusDiv, '❌ Erreur réseau. Vérifiez votre connexion et réessayez.', 'error');
        });
    });
  }

  // ============================================================
  // MODE C — Confirmation finale
  // ============================================================
  function showConfirmation(session, lastName, firstName, studentId) {
    document.getElementById('formSection').style.display    = 'none';
    document.getElementById('confirmSection').style.display = 'block';
    document.getElementById('pageSubtitle').textContent     = 'Présence validée';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.getElementById('confirmText').innerHTML =
      '<strong>' + escHtml(firstName) + ' ' + escHtml(lastName) + '</strong>' +
      ' (' + escHtml(studentId) + ')<br>' +
      escHtml(session.c || '') + ' — ' + formatDate(session.d) + ' à ' + escHtml(session.tm || '') + '<br>' +
      '<small style="color:#888;">Enseignant : ' + escHtml(session.t || '') + '</small>';
  }

  // ============================================================
  // Helpers
  // ============================================================
  function formatDate(dateStr) {
    if (!dateStr) return '';
    var p = dateStr.split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : dateStr;
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showStatus(el, msg, type) {
    var s = {
      info:  'background:#d1ecf1;border:1px solid #bee5eb;color:#0c5460;',
      error: 'background:#f8d7da;border:1px solid #f5c6cb;color:#721c24;',
      ok:    'background:#d4edda;border:1px solid #c3e6cb;color:#155724;'
    };
    el.style.cssText = 'display:block;padding:12px;border-radius:8px;margin-top:15px;' + (s[type] || s.info);
    el.innerHTML = msg;
  }

});
