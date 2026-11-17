/**
 * MENU « 💍 Mariage » DU TABLEUR — modifier, supprimer ou ajouter un invité.
 * Script lié au tableur « Mariage Agathe & Lucas — Réponses »
 * (Extensions > Apps Script). Fichiers : Code.gs + Editeur.html.
 *
 * Utilisation : cliquez sur la ligne d'un invité (onglet « Invités » ou
 * « Réponses »), puis menu 💍 Mariage.
 */

var RESP = 'Réponses';          // onglet des réponses brutes (lié au formulaire)
var VUE = 'Invités';            // onglet de consultation
var COL_LIGNE = 'N° ligne';     // colonne de l'onglet Invités qui pointe vers la ligne de Réponses
var OUI_NON = ['Oui', 'Non', 'Je ne sais pas encore'];

// Champs modifiables : intitulé exact de la colonne dans « Réponses »
var CHAMPS = [
  { titre: 'Prénom', type: 'texte', requis: true, groupe: 'Invité' },
  { titre: 'Nom', type: 'texte', requis: true },
  { titre: 'Adresse e-mail', court: 'E-mail', type: 'texte' },
  { titre: 'Numéro de téléphone', court: 'Téléphone', type: 'texte' },
  { titre: 'Participerez-vous à la cérémonie civile du vendredi 21 mai ?', court: 'Cérémonie civile · ven. 21', type: 'choix', options: OUI_NON, groupe: 'Présence' },
  { titre: 'Participerez-vous à la cérémonie religieuse du samedi 22 mai ?', court: 'Cérémonie religieuse · sam. 22', type: 'choix', options: OUI_NON },
  { titre: 'Participerez-vous à la réception du samedi soir ?', court: 'Réception · sam. soir', type: 'choix', options: OUI_NON },
  { titre: 'Participerez-vous au brunch du dimanche 23 mai ?', court: 'Brunch · dim. 23', type: 'choix', options: OUI_NON },
  { titre: 'Souhaitez-vous dormir au domaine ?', court: 'Dormir au domaine', type: 'choix', options: OUI_NON, groupe: 'Hébergement' },
  { titre: 'Pour quelle(s) nuit(s) ?', court: 'Nuit(s)', type: 'texte' },
  { titre: 'Avez-vous des contraintes particulières de couchage ?', court: 'Contraintes de couchage', type: 'zone' },
  { titre: 'Commentaire sur l’hébergement', court: 'Commentaire', type: 'zone' },
  { titre: 'Régime alimentaire', type: 'coches', options: ['Aucun régime particulier', 'Végétarien', 'Végétalien', 'Sans porc', 'Sans gluten'], groupe: 'Repas' },
  { titre: 'Allergies ou intolérances alimentaires', court: 'Allergies / intolérances', type: 'zone' },
  { titre: 'Quelle chanson aimeriez-vous entendre pendant la soirée ?', court: 'Chanson', type: 'texte', groupe: 'Musique' },
  { titre: 'Nom de l’artiste', court: 'Artiste', type: 'texte' },
  { titre: 'Un petit message pour les mariés', court: 'Message', type: 'zone' }
];

/* ---------- Menu ---------- */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('💍 Mariage')
    .addItem('✏️ Modifier l’invité sélectionné', 'ouvrirModification')
    .addItem('🗑️ Supprimer l’invité sélectionné', 'supprimerSelection')
    .addSeparator()
    .addItem('➕ Ajouter une réponse reçue hors formulaire', 'ouvrirAjout')
    .addToUi();
}

function ouvrirModification() {
  try { afficher_(ligneSelectionnee_()); }
  catch (e) { SpreadsheetApp.getUi().alert(e.message); }
}

function ouvrirAjout() { afficher_(0); }

function afficher_(ligne) {
  var t = HtmlService.createTemplateFromFile('Editeur');
  t.ligne = ligne;
  SpreadsheetApp.getUi().showSidebar(t.evaluate().setTitle(ligne ? 'Modifier un invité' : 'Ajouter un invité'));
}

/* ---------- Sélection ---------- */
function feuille_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(RESP);
  if (!sh) throw new Error('Onglet « ' + RESP + ' » introuvable.');
  return sh;
}

function entetes_() {
  var sh = feuille_();
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
}

// Renvoie le numéro de ligne (dans « Réponses ») de l'invité sélectionné
function ligneSelectionnee_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getActiveSheet();
  var r = ss.getActiveRange().getRow();
  var aide = 'Cliquez d’abord sur la ligne d’un invité dans l’onglet « ' + VUE + ' », puis relancez la commande.';
  if (r < 2) throw new Error(aide);
  if (sh.getName() === RESP) {
    if (r > sh.getLastRow()) throw new Error(aide);
    return r;
  }
  if (sh.getName() === VUE) {
    var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var c = head.indexOf(COL_LIGNE);
    if (c < 0) throw new Error('Colonne « ' + COL_LIGNE + ' » introuvable dans l’onglet « ' + VUE + ' ».');
    var n = Number(sh.getRange(r, c + 1).getValue());
    if (!n) throw new Error(aide);
    return n;
  }
  throw new Error(aide);
}

/* ---------- Appelées par le panneau latéral ---------- */
function lireInvite(ligne) {
  var sh = feuille_(), head = entetes_();
  var vals = ligne ? sh.getRange(ligne, 1, 1, head.length).getDisplayValues()[0] : [];
  var valeurs = {};
  CHAMPS.forEach(function (c) {
    var i = head.indexOf(c.titre);
    valeurs[c.titre] = (ligne && i >= 0) ? vals[i] : '';
  });
  return { ligne: ligne, champs: CHAMPS, valeurs: valeurs };
}

function enregistrerInvite(ligne, valeurs, origine) {
  var sh = feuille_(), head = entetes_();
  var prenom = String(valeurs['Prénom'] || '').trim(), nom = String(valeurs['Nom'] || '').trim();
  if (!prenom || !nom) throw new Error('Le prénom et le nom sont obligatoires.');
  valeurs['Prénom'] = prenom; valeurs['Nom'] = nom;

  if (ligne) {
    var rng = sh.getRange(ligne, 1, 1, head.length);
    var cur = rng.getValues()[0];
    var actuel = String(cur[head.indexOf('Prénom')]).trim() + '|' + String(cur[head.indexOf('Nom')]).trim();
    if (origine && actuel !== origine) throw new Error('Cette ligne a changé entre-temps. Fermez le panneau et relancez la modification.');
    CHAMPS.forEach(function (c) {
      var i = head.indexOf(c.titre);
      if (i >= 0) cur[i] = valeurs[c.titre] || '';
    });
    rng.setValues([cur]);
    return 'Modifications enregistrées pour ' + prenom + ' ' + nom + '.';
  }

  var nouvelle = head.map(function (h, i) { return i === 0 ? new Date() : (valeurs[h] || ''); });
  sh.appendRow(nouvelle);
  sh.getRange(sh.getLastRow(), 1).setNote('Ajouté manuellement (menu Mariage)');
  return prenom + ' ' + nom + ' a été ajouté(e).';
}

/* ---------- Suppression ---------- */
function supprimerSelection() {
  var ui = SpreadsheetApp.getUi();
  try {
    var ligne = ligneSelectionnee_();
    var sh = feuille_(), head = entetes_();
    var vals = sh.getRange(ligne, 1, 1, head.length).getValues()[0];
    var prenom = vals[head.indexOf('Prénom')], nom = vals[head.indexOf('Nom')];
    var qui = (prenom + ' ' + nom).trim();
    var rep = ui.alert('Supprimer ' + qui + ' ?',
      'Sa réponse sera retirée du tableur et du formulaire. Cette action est définitive.',
      ui.ButtonSet.YES_NO);
    if (rep !== ui.Button.YES) return;
    var dansFormulaire = supprimerDuFormulaire_(vals[0], prenom);
    sh.deleteRow(ligne);
    ui.alert(qui + ' a été supprimé(e).' + (dansFormulaire ? '' :
      '\n\n(Aucune réponse correspondante dans le formulaire, par exemple pour un ajout manuel : seule la ligne du tableur a été supprimée.)'));
  } catch (e) {
    ui.alert(e.message);
  }
}

// Supprime la réponse Google Forms correspondant à la ligne (même horodatage, même prénom)
function supprimerDuFormulaire_(horodatage, prenom) {
  if (!(horodatage instanceof Date)) return false;
  var url = feuille_().getFormUrl();
  if (!url) return false;
  var form = FormApp.openByUrl(url);
  var t = horodatage.getTime();
  var cibles = form.getResponses().filter(function (r) {
    if (Math.abs(r.getTimestamp().getTime() - t) > 2000) return false;
    return r.getItemResponses().some(function (ir) {
      return ir.getItem().getTitle() === 'Prénom' && String(ir.getResponse()).trim() === String(prenom).trim();
    });
  });
  if (cibles.length !== 1) return false;
  form.deleteResponse(cibles[0].getId());
  return true;
}
