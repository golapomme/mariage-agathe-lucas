/**
 * MARIAGE AGATHE & LUCAS — Création automatique du Google Forms,
 * du Google Sheets lié et du tableau de bord.
 *
 * 1. script.google.com > Nouveau projet > coller ce fichier > Enregistrer.
 * 2. Vérifier NUITS_DISPONIBLES.
 * 3. Exécuter « creerMariage » (une seule fois) et autoriser.
 * 4. Le journal d'exécution affiche le lien du formulaire et du tableur.
 */

// Nuits réellement proposées au domaine (ajouter le vendredi seulement si confirmé)
var NUITS_DISPONIBLES = ['Nuit du samedi 22 au dimanche 23 mai'];
var COUCHAGES_TOTAL = 55;

// Intitulés des questions (utilisés aussi par les formules du tableur)
var Q = {
  prenom: 'Prénom',
  nom: 'Nom',
  email: 'Adresse e-mail',
  tel: 'Numéro de téléphone',
  civile: 'Participerez-vous à la cérémonie civile du vendredi 21 mai ?',
  religieuse: 'Participerez-vous à la cérémonie religieuse du samedi 22 mai ?',
  reception: 'Participerez-vous à la réception du samedi soir ?',
  brunch: 'Participerez-vous au brunch du dimanche 23 mai ?',
  dormir: 'Souhaitez-vous dormir au domaine ?',
  nuits: 'Pour quelle(s) nuit(s) ?',
  contraintes: 'Avez-vous des contraintes particulières de couchage ?',
  commentaireCouchage: 'Commentaire sur l’hébergement',
  regime: 'Régime alimentaire',
  allergies: 'Allergies ou intolérances alimentaires',
  chanson: 'Quelle chanson aimeriez-vous entendre pendant la soirée ?',
  artiste: 'Nom de l’artiste',
  message: 'Un petit message pour les mariés'
};

var OUI_NON = ['Oui', 'Non', 'Je ne sais pas encore'];
var INCERTAIN = 'Je ne sais pas encore';
var AUCUN_REGIME = 'Aucun régime particulier';
var RESP = 'Réponses';
var C = { bordeaux: '#682F40', ivoire: '#FAF7F2', rose: '#E8C8C5', champagne: '#D6C1A3', anthracite: '#292524', ivoireFonce: '#F3EDE4', gris: '#7A716C' };

/* ============ 1. FONCTION PRINCIPALE ============ */
function creerMariage() {
  var form = creerFormulaire_();
  var ss = SpreadsheetApp.create('Mariage Agathe & Lucas — Réponses');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();
  Utilities.sleep(4000);

  var book = null, linked = null;
  for (var i = 0; i < 6 && !linked; i++) {
    book = SpreadsheetApp.openById(ss.getId());
    linked = book.getSheets().filter(function (s) { return s.getFormUrl(); })[0];
    if (!linked) Utilities.sleep(3000);
  }
  if (!linked) throw new Error('Onglet des réponses introuvable : relancez reconstruireTableauDeBord() dans une minute.');
  linked.setName(RESP);
  book.getSheets().forEach(function (s) {
    if (s.getName() !== RESP && s.getLastRow() === 0) { try { book.deleteSheet(s); } catch (e) {} }
  });

  construireOnglets_(book, form);

  Logger.log('LIEN DU FORMULAIRE (à coller dans CONFIG.googleFormUrl) : ' + form.getPublishedUrl());
  Logger.log('Modifier le formulaire : ' + form.getEditUrl());
  Logger.log('Tableur des réponses : ' + book.getUrl());
}

/** Recrée seulement les onglets d'exploitation. */
function reconstruireTableauDeBord() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID'), formId = props.getProperty('FORM_ID');
  if (!id) throw new Error('Lancez d’abord creerMariage().');
  var book = SpreadsheetApp.openById(id);
  ['Tableau de bord', 'Invités', 'Couchages', 'Régimes & allergies', 'Musique & messages'].forEach(function (n) {
    var s = book.getSheetByName(n); if (s) book.deleteSheet(s);
  });
  construireOnglets_(book, FormApp.openById(formId));
}

/* ============ 2. LE FORMULAIRE ============ */
function creerFormulaire_() {
  var form = FormApp.create('Mariage Agathe & Lucas — Confirmation de présence');
  form.setTitle('Serez-vous des nôtres ?')
    .setDescription('Agathe & Lucas — 21 & 22 mai 2027, Normandie.\n\n' +
      'Quelques instants pour nous aider à organiser ce week-end inoubliable.\n' +
      'Merci de remplir UNE RÉPONSE PAR PERSONNE (adultes comme enfants) : à la fin, cliquez sur « Envoyer une autre réponse » pour la personne qui vous accompagne.')
    .setCollectEmail(false)
    .setAllowResponseEdits(true)
    .setLimitOneResponsePerUser(false)
    .setProgressBar(true)
    .setShowLinkToRespondAgain(true)
    .setConfirmationMessage('Merci, votre réponse a bien été transmise à Agathe & Lucas !\n\n' +
      'Conservez le lien « Modifier votre réponse » (une capture d’écran suffit) si vous souhaitez la changer plus tard.\n' +
      'Vous répondez pour plusieurs personnes ? Cliquez sur « Envoyer une autre réponse ».\n\n' +
      'À très bientôt en Normandie !');

  // A. Identification
  form.addSectionHeaderItem().setTitle('A. Vous').setHelpText('Une réponse = une personne.');
  form.addTextItem().setTitle(Q.prenom).setRequired(true);
  form.addTextItem().setTitle(Q.nom).setRequired(true);
  form.addTextItem().setTitle(Q.email).setHelpText('Facultatif.')
    .setValidation(FormApp.createTextValidation().requireTextIsEmail().setHelpText('Adresse e-mail invalide.').build());
  form.addTextItem().setTitle(Q.tel).setHelpText('Facultatif.');

  // B. Présence
  form.addPageBreakItem().setTitle('B. Votre présence')
    .setHelpText('Vendredi 21 mai : cérémonie civile à la mairie de Colombelles (16h30 – 17h).\n' +
      'Samedi 22 mai : cérémonie religieuse à l’église Saint-Samson de Ouistreham (14h30), puis réception au Domaine du Bû-sur-Rouvres.\n' +
      'Dimanche 23 mai : brunch au domaine (10h30).');
  [Q.civile, Q.religieuse, Q.reception, Q.brunch].forEach(function (t) {
    form.addMultipleChoiceItem().setTitle(t).setChoiceValues(OUI_NON).setRequired(true);
  });

  // C. Hébergement (question d'aiguillage)
  form.addPageBreakItem().setTitle('C. Hébergement')
    .setHelpText(COUCHAGES_TOTAL + ' couchages collectifs gratuits (type auberge) au domaine : L’Atelier, L’Escale et L’Étage.\n' +
      'Matelas, couettes et oreillers fournis — DRAPS ET SERVIETTES À APPORTER.\n' +
      'La répartition est organisée par les mariés : une demande ne vaut pas attribution définitive.');
  var dormir = form.addMultipleChoiceItem().setTitle(Q.dormir).setRequired(true);

  // Détails couchage (si Oui / Je ne sais pas encore)
  var pageDetails = form.addPageBreakItem().setTitle('Votre couchage').setHelpText('Rappel : draps et serviettes ne sont pas fournis.');
  form.addCheckboxItem().setTitle(Q.nuits).setChoiceValues(NUITS_DISPONIBLES).setRequired(true);
  form.addParagraphTextItem().setTitle(Q.contraintes)
    .setHelpText('Ex. : enfant en bas âge, difficulté à monter un étage, souhait d’être près de certaines personnes…');
  form.addParagraphTextItem().setTitle(Q.commentaireCouchage).setHelpText('Facultatif.');

  // D. Régimes
  var pageRegime = form.addPageBreakItem().setTitle('D. Régimes alimentaires et allergies');
  form.addCheckboxItem().setTitle(Q.regime)
    .setChoiceValues([AUCUN_REGIME, 'Végétarien', 'Végétalien', 'Sans porc', 'Sans gluten'])
    .showOtherOption(true)
    .setHelpText('Plusieurs réponses possibles. « Autre » pour préciser.')
    .setRequired(true);
  form.addParagraphTextItem().setTitle(Q.allergies).setHelpText('Merci de détailler (aliment, gravité). Laissez vide si aucune.');

  // E. Musique
  form.addPageBreakItem().setTitle('E. Ambiance et musique')
    .setHelpText('Une chanson, un souvenir, une envie de danser… Aidez-nous à composer la bande-son de notre soirée.');
  form.addTextItem().setTitle(Q.chanson);
  form.addTextItem().setTitle(Q.artiste);
  form.addParagraphTextItem().setTitle(Q.message).setHelpText('Facultatif.');

  // Logique conditionnelle
  dormir.setChoices([
    dormir.createChoice('Oui', pageDetails),
    dormir.createChoice('Non', pageRegime),
    dormir.createChoice(INCERTAIN, pageDetails)
  ]);

  PropertiesService.getScriptProperties().setProperty('FORM_ID', form.getId());
  return form;
}

/* ============ 3. ONGLETS + TABLEAU DE BORD ============ */
// Colonne d'une question dans l'onglet Réponses, retrouvée par son intitulé
function col_(title) {
  return "INDEX('" + RESP + "'!$A$2:$AZ$2000,0,MATCH(\"" + title + "\",'" + RESP + "'!$1:$1,0))";
}
function cols_(list) { return 'HSTACK(' + list.map(function (c) { return col_(c[1]); }).join(',') + ')'; }
function eq_(title, v) { return '(' + col_(title) + '="' + v + '")'; }
function spark_(cell, max, c1, c2) {
  return '=SPARKLINE(' + cell + ',VSTACK(HSTACK("charttype","bar"),HSTACK("max",' + max + '),HSTACK("color1","' + c1 + '")' +
    (c2 ? ',HSTACK("color2","' + c2 + '")' : '') + '))';
}

function construireOnglets_(book, form) {
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', book.getId());
  var has = col_(Q.prenom) + '<>""';
  var hasN = '(' + has + ')';

  // Invités
  var inv = book.insertSheet('Invités', 0);
  var invCols = [['Prénom', Q.prenom], ['Nom', Q.nom], ['Civile (ven.)', Q.civile], ['Religieuse (sam.)', Q.religieuse],
    ['Réception (sam.)', Q.reception], ['Brunch (dim.)', Q.brunch], ['Couchage', Q.dormir], ['Nuit(s)', Q.nuits],
    ['Régime', Q.regime], ['Allergies', Q.allergies], ['E-mail', Q.email], ['Téléphone', Q.tel], ['Message', Q.message]];
  inv.getRange(1, 1, 1, invCols.length).setValues([invCols.map(function (c) { return c[0]; })]);
  inv.getRange('A2').setFormula('=IFERROR(SORT(FILTER(' + cols_(invCols) + ',' + has + '),2,TRUE,1,TRUE),"En attente des premières réponses")');
  styleTable_(inv, invCols.length, [120, 140, 120, 130, 130, 120, 140, 220, 200, 240, 220, 140, 300]);
  var area = inv.getRange(2, 3, 1999, 5);
  inv.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Oui').setBackground('#E7F0E4').setFontColor('#2F5D2A').setRanges([area]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Non').setBackground('#F6E4E4').setFontColor('#7A2B2B').setRanges([area]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(INCERTAIN).setBackground('#FFF4D6').setFontColor('#6B4E10').setRanges([area]).build()
  ]);

  // Couchages
  var cou = book.insertSheet('Couchages', 1);
  var couCols = [['Prénom', Q.prenom], ['Nom', Q.nom], ['Demande', Q.dormir], ['Nuit(s)', Q.nuits], ['Contraintes', Q.contraintes], ['Commentaire', Q.commentaireCouchage], ['Téléphone', Q.tel]];
  cou.getRange(1, 1, 1, couCols.length + 1).setValues([couCols.map(function (c) { return c[0]; }).concat(['Espace attribué (à remplir)'])]);
  cou.getRange('A2').setFormula('=IFERROR(SORT(FILTER(' + cols_(couCols) + ',' + col_(Q.dormir) + '<>"Non",' + col_(Q.dormir) + '<>"",' + has + '),3,FALSE,2,TRUE),"Aucune demande pour l\'instant")');
  styleTable_(cou, couCols.length + 1, [120, 140, 160, 240, 300, 260, 140, 200]);
  cou.getRange('H2:H200').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['L’Atelier', 'L’Escale', 'L’Étage', 'Pas de place'], true).build());
  cou.getRange('H1').setNote('Saisie manuelle : si une réponse arrive ou change, l’ordre des lignes peut bouger. Vérifiez avant de communiquer les attributions.');

  // Régimes & allergies
  var reg = book.insertSheet('Régimes & allergies', 2);
  var regCols = [['Prénom', Q.prenom], ['Nom', Q.nom], ['Régime', Q.regime], ['Allergies / intolérances', Q.allergies], ['Réception (sam.)', Q.reception], ['Brunch (dim.)', Q.brunch]];
  reg.getRange(1, 1, 1, regCols.length).setValues([regCols.map(function (c) { return c[0]; })]);
  reg.getRange('A2').setFormula('=IFERROR(SORT(FILTER(' + cols_(regCols) + ',' + has + ',(' + col_(Q.regime) + '<>"' + AUCUN_REGIME + '")+(LEN(' + col_(Q.allergies) + ')>0)),2,TRUE),"Aucun régime particulier signalé")');
  styleTable_(reg, regCols.length, [120, 140, 240, 320, 130, 120]);

  // Musique & messages
  var mus = book.insertSheet('Musique & messages', 3);
  var musCols = [['Chanson', Q.chanson], ['Artiste', Q.artiste], ['Proposée par', Q.prenom], ['Nom', Q.nom], ['Message aux mariés', Q.message]];
  mus.getRange(1, 1, 1, musCols.length).setValues([musCols.map(function (c) { return c[0]; })]);
  mus.getRange('A2').setFormula('=IFERROR(FILTER(' + cols_(musCols) + ',' + has + ',(LEN(' + col_(Q.chanson) + ')>0)+(LEN(' + col_(Q.message) + ')>0)),"Aucune suggestion pour l\'instant")');
  styleTable_(mus, musCols.length, [260, 200, 130, 140, 420]);

  // Tableau de bord
  var db = book.insertSheet('Tableau de bord', 0);
  db.setHiddenGridlines(true);
  db.getRange('A1:H40').setFontFamily('Georgia').setFontColor(C.anthracite).setBackground(C.ivoire);
  db.setColumnWidth(1, 30); db.setColumnWidth(2, 340); db.setColumnWidths(3, 4, 120); db.setColumnWidth(7, 260); db.setColumnWidth(8, 30);
  db.getRange('B2').setValue('Agathe & Lucas — Tableau de bord').setFontSize(22).setFontColor(C.bordeaux);
  db.getRange('B3').setFormula('="Mis à jour automatiquement · "&TEXT(NOW(),"dd/mm/yyyy hh:mm")').setFontSize(10).setFontColor(C.gris).setFontStyle('italic');

  function line(r) { db.getRange(r, 2, 1, 6).setBorder(null, null, true, null, null, null, C.champagne, SpreadsheetApp.BorderStyle.SOLID); }
  function kpi(r, label, formula, note) {
    db.getRange(r, 2).setValue(label).setFontSize(12);
    db.getRange(r, 3).setFormula(formula).setFontSize(20).setFontColor(C.bordeaux).setHorizontalAlignment('center');
    if (note) { db.getRange(r, 4, 1, 3).merge(); db.getRange(r, 4).setValue(note).setFontSize(10).setFontColor(C.gris).setFontStyle('italic'); }
    line(r);
  }

  section_(db, 5, 'Vue d’ensemble');
  kpi(6, 'Nombre total de réponses', '=COUNTIF(' + col_(Q.prenom) + ',"?*")', 'Une réponse = une personne');
  kpi(7, 'Réponses avec au moins un « Je ne sais pas encore »',
    '=SUMPRODUCT(' + hasN + '*((' + [Q.civile, Q.religieuse, Q.reception, Q.brunch, Q.dormir].map(function (q) { return eq_(q, INCERTAIN); }).join('+') + ')>0))',
    'Invités à relancer');
  kpi(8, 'Invités ayant un régime particulier',
    '=SUMPRODUCT(' + hasN + '*(LEN(' + col_(Q.regime) + ')>0)*(' + col_(Q.regime) + '<>"' + AUCUN_REGIME + '"))', 'Détail dans l’onglet « Régimes & allergies »');
  kpi(9, 'Invités signalant une allergie ou intolérance', '=SUMPRODUCT(' + hasN + '*(LEN(' + col_(Q.allergies) + ')>0))', '');

  section_(db, 11, 'Présences par événement');
  db.getRange(12, 2, 1, 5).setValues([['Événement', 'Oui', 'Incertain', 'Non', 'Taux de oui']])
    .setFontFamily('Arial').setFontSize(9).setFontColor(C.gris).setFontWeight('bold');
  [[Q.civile, 'Cérémonie civile — ven. 21'], [Q.religieuse, 'Cérémonie religieuse — sam. 22'], [Q.reception, 'Réception — sam. 22 soir'], [Q.brunch, 'Brunch — dim. 23']]
    .forEach(function (e, i) {
      var r = 13 + i, q = e[0];
      db.getRange(r, 2).setValue(e[1]).setFontSize(12);
      db.getRange(r, 3).setFormula('=COUNTIF(' + col_(q) + ',"Oui")').setFontSize(18).setFontColor(C.bordeaux);
      db.getRange(r, 4).setFormula('=COUNTIF(' + col_(q) + ',"' + INCERTAIN + '")').setFontSize(14);
      db.getRange(r, 5).setFormula('=COUNTIF(' + col_(q) + ',"Non")').setFontSize(14);
      db.getRange(r, 6).setFormula('=IFERROR(C' + r + '/$C$6,0)').setNumberFormat('0%').setFontSize(12);
      db.getRange(r, 7).setFormula(spark_('C' + r, 'MAX(1,$C$6)', C.bordeaux));
      line(r);
    });
  db.getRange('C13:F16').setHorizontalAlignment('center');

  section_(db, 18, 'Couchages au domaine');
  kpi(19, 'Demandes de couchage (Oui)', '=COUNTIF(' + col_(Q.dormir) + ',"Oui")', '');
  kpi(20, 'Demandes incertaines', '=COUNTIF(' + col_(Q.dormir) + ',"' + INCERTAIN + '")', '');
  kpi(21, 'Couchages disponibles', '=' + COUCHAGES_TOTAL, '');
  kpi(22, 'Places restantes (sur demandes fermes)', '=C21-C19', 'Négatif = plus de demandes que de places');
  db.getRange(23, 2).setValue('Taux de remplissage').setFontSize(12);
  db.getRange(23, 3).setFormula('=IFERROR(C19/C21,0)').setNumberFormat('0%').setFontSize(18).setFontColor(C.bordeaux).setHorizontalAlignment('center');
  db.getRange(23, 4, 1, 3).merge();
  db.getRange(23, 4).setFormula(spark_('C19', 'C21', C.bordeaux, C.rose));
  db.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenNumberLessThan(0).setFontColor('#B3261E').setBackground('#F6E4E4').setRanges([db.getRange('C22')]).build()
  ]);

  section_(db, 25, 'Régimes alimentaires (nombre de personnes)');
  ['Végétarien', 'Végétalien', 'Sans porc', 'Sans gluten'].forEach(function (r, i) {
    db.getRange(26 + i, 2).setValue(r).setFontSize(12);
    db.getRange(26 + i, 3).setFormula('=COUNTIF(' + col_(Q.regime) + ',"*' + r + '*")').setFontSize(16).setFontColor(C.bordeaux).setHorizontalAlignment('center');
    line(26 + i);
  });
  db.getRange(30, 2).setValue('Autre (voir onglet « Régimes & allergies »)').setFontSize(12);
  db.getRange(30, 3).setFormula('=SUMPRODUCT(' + hasN + '*(LEN(' + col_(Q.regime) + ')>0)' +
    [AUCUN_REGIME, 'Végétarien', 'Végétalien', 'Sans porc', 'Sans gluten'].map(function (r) { return '*ISERROR(SEARCH("' + r + '",' + col_(Q.regime) + '))'; }).join('') + ')')
    .setFontSize(16).setFontColor(C.bordeaux).setHorizontalAlignment('center');
  line(30);

  section_(db, 32, 'Liens utiles');
  db.getRange(33, 2).setValue('Formulaire (à partager / intégrer)');
  db.getRange(33, 3, 1, 5).merge(); db.getRange(33, 3).setValue(form.getPublishedUrl()).setFontFamily('Arial').setFontSize(9);
  db.getRange(34, 2).setValue('Modifier le formulaire');
  db.getRange(34, 3, 1, 5).merge(); db.getRange(34, 3).setValue(form.getEditUrl()).setFontFamily('Arial').setFontSize(9);

  db.setFrozenRows(3);
  book.setActiveSheet(db);
}

function section_(sh, row, title) {
  sh.getRange(row, 2, 1, 6).merge();
  sh.getRange(row, 2).setValue(title.toUpperCase()).setFontFamily('Arial').setFontSize(9).setFontWeight('bold').setFontColor(C.bordeaux);
  sh.getRange(row, 2, 1, 6).setBackground(C.ivoireFonce);
  sh.setRowHeight(row, 28);
}

function styleTable_(sh, nCols, widths) {
  var band = sh.getRange(1, 1, 2000, nCols).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
  band.setHeaderRowColor(C.bordeaux).setFirstRowColor('#FFFFFF').setSecondRowColor(C.ivoireFonce);
  sh.getRange(1, 1, 1, nCols).setFontColor(C.ivoire).setFontWeight('bold').setFontFamily('Arial').setFontSize(10).setVerticalAlignment('middle');
  sh.getRange(2, 1, 1999, nCols).setFontFamily('Arial').setFontSize(10).setVerticalAlignment('top').setWrap(true);
  sh.setFrozenRows(1);
  sh.setRowHeight(1, 34);
  widths.forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
}
