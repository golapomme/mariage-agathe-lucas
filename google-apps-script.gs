/**
 * MARIAGE AGATHE & LUCAS — Google Forms + Google Sheets + tableau de bord (version 2).
 *
 * Fonctions :
 *  - creerMariage()             : crée de zéro le formulaire, le tableur lié et les onglets.
 *  - migrerVersV2()             : met à jour le formulaire existant vers la version 2
 *                                 (samedi + dimanche, réponses groupées, nombre de personnes à loger).
 *  - reconstruireTableauDeBord(): recrée seulement les onglets d'exploitation.
 */

var COUCHAGES_TOTAL = 55;
var DATE_LIMITE = '10 janvier 2027';

// Intitulés des questions (utilisés aussi par les formules du tableur)
var Q = {
  prenom: 'Prénom',
  nom: 'Nom',
  nbPersonnes: 'Nombre de personnes concernées par cette réponse',
  personnes: 'Personnes concernées',
  email: 'Adresse e-mail',
  tel: 'Numéro de téléphone',
  samedi: 'Samedi 22 mai — serez-vous des nôtres ?',
  dimanche: 'Dimanche 23 mai — serez-vous au brunch ?',
  dormir: 'Souhaitez-vous dormir au domaine ?',
  nbDormir: 'Combien de personnes de votre famille dormiront sur place ?',
  regime: 'Régime alimentaire',
  allergies: 'Allergies ou intolérances alimentaires',
  chanson: 'Quelle chanson aimeriez-vous entendre pendant la soirée ?',
  artiste: 'Nom de l’artiste',
  message: 'Un petit message pour les mariés'
};

// Intitulés de la version 1 (pour la migration)
var ANCIEN = {
  civile: 'Participerez-vous à la cérémonie civile du vendredi 21 mai ?',
  religieuse: 'Participerez-vous à la cérémonie religieuse du samedi 22 mai ?',
  reception: 'Participerez-vous à la réception du samedi soir ?',
  brunch: 'Participerez-vous au brunch du dimanche 23 mai ?',
  nuits: 'Pour quelle(s) nuit(s) ?',
  contraintes: 'Avez-vous des contraintes particulières de couchage ?',
  commentaireCouchage: 'Commentaire sur l’hébergement'
};

var TXT = {
  description: 'Agathe & Lucas — samedi 22 et dimanche 23 mai 2027, en Normandie.\n\n' +
    'Quelques instants pour nous aider à organiser ce week-end inoubliable.\n' +
    'Vous pouvez répondre pour vous seul(e), pour votre couple ou pour plusieurs membres de votre famille.\n\n' +
    'Merci de nous répondre avant le ' + DATE_LIMITE + '.',
  confirmation: 'Merci, votre réponse a bien été transmise à Agathe & Lucas !\n\n' +
    'Conservez le lien « Modifier votre réponse » (une capture d’écran suffit) si vous souhaitez la changer plus tard.\n\n' +
    'À très bientôt en Normandie !',
  aideA: 'La personne qui répond, puis le nombre de personnes concernées par cette réponse.',
  aideNb: 'Vous compris. Ex. : 2 pour un couple, 4 pour une famille.',
  aidePersonnes: 'Facultatif. Ex. : Famille Martin — 2 personnes (Claire et Paul)',
  aideB: 'I — Samedi 22 mai : cérémonie religieuse à l’église Saint-Samson de Ouistreham à 14h30, puis réception au Domaine du Bû-sur-Rouvres.\n' +
    'II — Dimanche 23 mai : brunch au domaine à 10h30.',
  aideJour: 'Pour les personnes concernées par cette réponse.',
  aideC: COUCHAGES_TOTAL + ' couchages collectifs gratuits (type auberge) au domaine : L’Atelier, L’Escale et L’Étage.\n' +
    'Matelas, couettes et oreillers fournis — DRAPS ET SERVIETTES À APPORTER.\n' +
    'La répartition est organisée par les mariés : une demande ne vaut pas attribution définitive.',
  aideCouchage: 'Rappel : draps et serviettes ne sont pas fournis.',
  aideNbDormir: 'Une estimation suffit si vous ne savez pas encore.',
  aideRegime: 'Plusieurs réponses possibles. Si vous répondez pour plusieurs personnes, précisez qui est concerné dans « Autre » ou ci-dessous.'
};

var OUI_NON = ['Oui', 'Non', 'Je ne sais pas encore'];
var INCERTAIN = 'Je ne sais pas encore';
var AUCUN_REGIME = 'Aucun régime particulier';
var RESP = 'Réponses';
var C = { vert: '#56694C', vertNuit: '#3B4A35', ivoire: '#F8F7F2', sauge: '#A7B496', sageClair: '#DDE4D3', champagne: '#CDBF9E', encre: '#262A24', fond: '#EEF0E6', gris: '#6F7569' };

/* ============ 1. CRÉATION COMPLÈTE ============ */
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

/* ============ 2. LE FORMULAIRE (version 2) ============ */
function nombre_(min, max, aide) {
  return FormApp.createTextValidation().requireNumberBetween(min, max).setHelpText(aide).build();
}

function creerFormulaire_() {
  var form = FormApp.create('Mariage Agathe & Lucas — Confirmation de présence');
  form.setTitle('Serez-vous des nôtres ?')
    .setDescription(TXT.description)
    .setCollectEmail(false)
    .setAllowResponseEdits(true)
    .setLimitOneResponsePerUser(false)
    .setProgressBar(true)
    .setShowLinkToRespondAgain(false)
    .setConfirmationMessage(TXT.confirmation);

  // A. Vous
  form.addSectionHeaderItem().setTitle('A. Vous').setHelpText(TXT.aideA);
  form.addTextItem().setTitle(Q.prenom).setRequired(true);
  form.addTextItem().setTitle(Q.nom).setRequired(true);
  form.addTextItem().setTitle(Q.nbPersonnes).setHelpText(TXT.aideNb).setRequired(true)
    .setValidation(nombre_(1, 30, 'Indiquez un nombre (ex. : 2).'));
  form.addTextItem().setTitle(Q.personnes).setHelpText(TXT.aidePersonnes);
  form.addTextItem().setTitle(Q.email).setHelpText('Facultatif.')
    .setValidation(FormApp.createTextValidation().requireTextIsEmail().setHelpText('Adresse e-mail invalide.').build());
  form.addTextItem().setTitle(Q.tel).setHelpText('Facultatif.');

  // B. Présence (samedi + dimanche)
  form.addPageBreakItem().setTitle('B. Votre présence').setHelpText(TXT.aideB);
  form.addMultipleChoiceItem().setTitle(Q.samedi).setHelpText(TXT.aideJour).setChoiceValues(OUI_NON).setRequired(true);
  form.addMultipleChoiceItem().setTitle(Q.dimanche).setHelpText(TXT.aideJour).setChoiceValues(OUI_NON).setRequired(true);

  // C. Hébergement (question d'aiguillage)
  form.addPageBreakItem().setTitle('C. Hébergement').setHelpText(TXT.aideC);
  var dormir = form.addMultipleChoiceItem().setTitle(Q.dormir).setRequired(true);

  // Nombre de personnes à loger (si Oui / Je ne sais pas encore)
  var pageCouchage = form.addPageBreakItem().setTitle('Votre couchage').setHelpText(TXT.aideCouchage);
  form.addTextItem().setTitle(Q.nbDormir).setHelpText(TXT.aideNbDormir).setRequired(true)
    .setValidation(nombre_(1, COUCHAGES_TOTAL, 'Indiquez un nombre (ex. : 2).'));

  // D. Régimes
  var pageRegime = form.addPageBreakItem().setTitle('D. Régimes alimentaires et allergies');
  form.addCheckboxItem().setTitle(Q.regime)
    .setChoiceValues([AUCUN_REGIME, 'Végétarien', 'Végétalien', 'Sans porc', 'Sans gluten'])
    .showOtherOption(true).setHelpText(TXT.aideRegime).setRequired(true);
  form.addParagraphTextItem().setTitle(Q.allergies).setHelpText('Merci de détailler (aliment, gravité, personne concernée). Laissez vide si aucune.');

  // E. Musique
  form.addPageBreakItem().setTitle('E. Ambiance et musique')
    .setHelpText('Une chanson, un souvenir, une envie de danser… Aidez-nous à composer la bande-son de notre soirée.');
  form.addTextItem().setTitle(Q.chanson);
  form.addTextItem().setTitle(Q.artiste);
  form.addParagraphTextItem().setTitle(Q.message).setHelpText('Facultatif.');

  dormir.setChoices([
    dormir.createChoice('Oui', pageCouchage),
    dormir.createChoice('Non', pageRegime),
    dormir.createChoice(INCERTAIN, pageCouchage)
  ]);

  PropertiesService.getScriptProperties().setProperty('FORM_ID', form.getId());
  return form;
}

/* ============ 3. MIGRATION DU FORMULAIRE EXISTANT VERS LA V2 ============ */
function migrerVersV2() {
  var props = PropertiesService.getScriptProperties();
  var form = FormApp.openById(props.getProperty('FORM_ID'));
  function trouve(titre) { return form.getItems().filter(function (it) { return it.getTitle() === titre; })[0]; }

  // Textes généraux
  form.setDescription(TXT.description).setConfirmationMessage(TXT.confirmation).setShowLinkToRespondAgain(false);

  // Questions retirées : vendredi, église, nuit, contraintes, commentaire
  [ANCIEN.civile, ANCIEN.religieuse, ANCIEN.nuits, ANCIEN.contraintes, ANCIEN.commentaireCouchage].forEach(function (t) {
    var it = trouve(t); if (it) form.deleteItem(it);
  });

  // Une question par jour : samedi 22 et dimanche 23
  var sam = trouve(ANCIEN.reception); if (sam) sam.asMultipleChoiceItem().setTitle(Q.samedi).setHelpText(TXT.aideJour);
  var dim = trouve(ANCIEN.brunch); if (dim) dim.asMultipleChoiceItem().setTitle(Q.dimanche).setHelpText(TXT.aideJour);

  // Textes d'aide des sections
  var a = trouve('A. Vous'); if (a) a.setHelpText(TXT.aideA);
  var b = trouve('B. Votre présence'); if (b) b.asPageBreakItem().setHelpText(TXT.aideB);
  var c = trouve('C. Hébergement'); if (c) c.asPageBreakItem().setHelpText(TXT.aideC);
  var pc = trouve('Votre couchage'); if (pc) pc.asPageBreakItem().setHelpText(TXT.aideCouchage);
  var reg = trouve(Q.regime); if (reg) reg.setHelpText(TXT.aideRegime);
  var al = trouve(Q.allergies); if (al) al.setHelpText('Merci de détailler (aliment, gravité, personne concernée). Laissez vide si aucune.');

  // Réponse groupée : nombre de personnes + noms, juste après « Nom »
  if (!trouve(Q.nbPersonnes)) {
    var nb = form.addTextItem().setTitle(Q.nbPersonnes).setHelpText(TXT.aideNb).setRequired(true)
      .setValidation(nombre_(1, 30, 'Indiquez un nombre (ex. : 2).'));
    var noms = form.addTextItem().setTitle(Q.personnes).setHelpText(TXT.aidePersonnes);
    var iNom = trouve(Q.nom).getIndex();
    form.moveItem(nb.getIndex(), iNom + 1);
    form.moveItem(noms.getIndex(), iNom + 2);
  }

  // Nombre de personnes à loger, sur la page « Votre couchage »
  if (!trouve(Q.nbDormir) && pc) {
    var nd = form.addTextItem().setTitle(Q.nbDormir).setHelpText(TXT.aideNbDormir).setRequired(true)
      .setValidation(nombre_(1, COUCHAGES_TOTAL, 'Indiquez un nombre (ex. : 2).'));
    form.moveItem(nd.getIndex(), trouve('Votre couchage').getIndex() + 1);
  }

  // Tableur : en-têtes renommés, anciennes colonnes masquées
  SpreadsheetApp.flush();
  Utilities.sleep(4000);
  var book = SpreadsheetApp.openById(props.getProperty('SHEET_ID'));
  var resp = book.getSheetByName(RESP);
  var head = resp.getRange(1, 1, 1, resp.getLastColumn()).getValues()[0];
  [[ANCIEN.reception, Q.samedi], [ANCIEN.brunch, Q.dimanche]].forEach(function (p) {
    var i = head.indexOf(p[0]);
    if (i >= 0 && head.indexOf(p[1]) < 0) resp.getRange(1, i + 1).setValue(p[1]);
  });
  head = resp.getRange(1, 1, 1, resp.getLastColumn()).getValues()[0];
  [ANCIEN.civile, ANCIEN.religieuse, ANCIEN.nuits, ANCIEN.contraintes, ANCIEN.commentaireCouchage].forEach(function (t) {
    var i = head.indexOf(t); if (i >= 0) resp.hideColumns(i + 1);
  });

  reconstruireTableauDeBord();
  Logger.log('Questions : ' + form.getItems().map(function (it) { return it.getTitle(); }).join(' | '));
  Logger.log('En-têtes : ' + resp.getRange(1, 1, 1, resp.getLastColumn()).getValues()[0].join(' | '));
}

/* ============ 4. ONGLETS + TABLEAU DE BORD ============ */
// Colonne d'une question dans l'onglet Réponses, retrouvée par son intitulé
function col_(title) {
  // INDIRECT : la plage ne se décale pas quand Google Forms insère une nouvelle réponse
  return "INDEX(INDIRECT(\"'" + RESP + "'!A2:AZ2000\"),0,MATCH(\"" + title + "\",'" + RESP + "'!$1:$1,0))";
}
function cols_(list) { return 'HSTACK(' + list.map(function (c) { return col_(c[1]); }).join(',') + ')'; }
function eq_(title, v) { return '(' + col_(title) + '="' + v + '")'; }
function spark_(cell, max, c1, c2) {
  return '=SPARKLINE(' + cell + ',VSTACK(HSTACK("charttype","bar"),HSTACK("max",' + max + '),HSTACK("color1","' + c1 + '")' +
    (c2 ? ',HSTACK("color2","' + c2 + '")' : '') + '))';
}

function construireOnglets_(book, form) {
  // Les formules sont écrites en syntaxe anglaise : on passe temporairement le tableur en en_US
  var locInit = book.getSpreadsheetLocale();
  book.setSpreadsheetLocale('en_US');
  SpreadsheetApp.flush();
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', book.getId());
  var has = col_(Q.prenom) + '<>""';
  var hasN = '(' + has + ')';
  var pers = 'IF(' + col_(Q.nbPersonnes) + '="",1,' + col_(Q.nbPersonnes) + ')';                // personnes par réponse (1 si vide)
  var loger = 'IF(' + col_(Q.nbDormir) + '="",' + pers + ',' + col_(Q.nbDormir) + ')';          // personnes à loger
  var numLigne = 'SEQUENCE(ROWS(INDEX(INDIRECT("\'' + RESP + '\'!A2:AZ2000"),0,1)))+1';         // n° de ligne dans Réponses

  // Invités
  var inv = book.insertSheet('Invités', 0);
  var invCols = [['Prénom', Q.prenom], ['Nom', Q.nom], ['Nb pers.', Q.nbPersonnes], ['Personnes concernées', Q.personnes],
    ['I · Samedi 22', Q.samedi], ['II · Dimanche 23', Q.dimanche], ['Couchage', Q.dormir], ['Nb à loger', Q.nbDormir],
    ['Régime', Q.regime], ['Allergies', Q.allergies], ['E-mail', Q.email], ['Téléphone', Q.tel], ['Message', Q.message]];
  inv.getRange(1, 1, 1, invCols.length + 1).setValues([invCols.map(function (c) { return c[0]; }).concat(['N° ligne'])]);
  inv.getRange('A2').setFormula('=IFERROR(SORT(FILTER(' + cols_(invCols).slice(0, -1) + ',' + numLigne + '),' + has + '),2,TRUE,1,TRUE),"En attente des premières réponses")');
  styleTable_(inv, invCols.length + 1, [120, 140, 80, 240, 120, 130, 140, 90, 200, 240, 220, 140, 300, 70]);
  var area = inv.getRange(2, 5, 1999, 3);
  inv.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Oui').setBackground('#E5EEDF').setFontColor('#2F5D2A').setRanges([area]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Non').setBackground('#F3E6E3').setFontColor('#7A2B2B').setRanges([area]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(INCERTAIN).setBackground('#FFF4D6').setFontColor('#6B4E10').setRanges([area]).build()
  ]);

  // Couchages
  var cou = book.insertSheet('Couchages', 1);
  var couCols = [['Prénom', Q.prenom], ['Nom', Q.nom], ['Demande', Q.dormir], ['Personnes à loger', Q.nbDormir], ['Personnes concernées', Q.personnes], ['Téléphone', Q.tel], ['E-mail', Q.email]];
  cou.getRange(1, 1, 1, couCols.length + 1).setValues([couCols.map(function (c) { return c[0]; }).concat(['Espace attribué (à remplir)'])]);
  cou.getRange('A2').setFormula('=IFERROR(SORT(FILTER(' + cols_(couCols) + ',' + col_(Q.dormir) + '<>"Non",' + col_(Q.dormir) + '<>"",' + has + '),3,FALSE,2,TRUE),"Aucune demande pour l\'instant")');
  styleTable_(cou, couCols.length + 1, [120, 140, 160, 130, 260, 140, 220, 200]);
  cou.getRange('H2:H200').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['L’Atelier', 'L’Escale', 'L’Étage', 'Pas de place'], true).build());
  cou.getRange('H1').setNote('Saisie manuelle : si une réponse arrive ou change, l’ordre des lignes peut bouger. Vérifiez avant de communiquer les attributions.');

  // Régimes & allergies
  var reg = book.insertSheet('Régimes & allergies', 2);
  var regCols = [['Prénom', Q.prenom], ['Nom', Q.nom], ['Personnes concernées', Q.personnes], ['Régime', Q.regime], ['Allergies / intolérances', Q.allergies], ['I · Samedi 22', Q.samedi], ['II · Dimanche 23', Q.dimanche]];
  reg.getRange(1, 1, 1, regCols.length).setValues([regCols.map(function (c) { return c[0]; })]);
  reg.getRange('A2').setFormula('=IFERROR(SORT(FILTER(' + cols_(regCols) + ',' + has + ',(' + col_(Q.regime) + '<>"' + AUCUN_REGIME + '")+(LEN(' + col_(Q.allergies) + ')>0)),2,TRUE),"Aucun régime particulier signalé")');
  styleTable_(reg, regCols.length, [120, 140, 240, 240, 320, 120, 130]);

  // Musique & messages
  var mus = book.insertSheet('Musique & messages', 3);
  var musCols = [['Chanson', Q.chanson], ['Artiste', Q.artiste], ['Proposée par', Q.prenom], ['Nom', Q.nom], ['Message aux mariés', Q.message]];
  mus.getRange(1, 1, 1, musCols.length).setValues([musCols.map(function (c) { return c[0]; })]);
  mus.getRange('A2').setFormula('=IFERROR(FILTER(' + cols_(musCols) + ',' + has + ',(LEN(' + col_(Q.chanson) + ')>0)+(LEN(' + col_(Q.message) + ')>0)),"Aucune suggestion pour l\'instant")');
  styleTable_(mus, musCols.length, [260, 200, 130, 140, 420]);

  // Tableau de bord
  var db = book.insertSheet('Tableau de bord', 0);
  db.setHiddenGridlines(true);
  db.getRange('A1:H40').setFontFamily('Georgia').setFontColor(C.encre).setBackground(C.ivoire);
  db.setColumnWidth(1, 30); db.setColumnWidth(2, 360); db.setColumnWidths(3, 4, 120); db.setColumnWidth(7, 260); db.setColumnWidth(8, 30);
  db.getRange('B2').setValue('Agathe & Lucas — Tableau de bord').setFontSize(22).setFontColor(C.vert);
  db.getRange('B3').setFormula('="Mis à jour automatiquement · "&TEXT(NOW(),"dd/mm/yyyy hh:mm")').setFontSize(10).setFontColor(C.gris).setFontStyle('italic');

  function line(r) { db.getRange(r, 2, 1, 6).setBorder(null, null, true, null, null, null, C.champagne, SpreadsheetApp.BorderStyle.SOLID); }
  function kpi(r, label, formula, note) {
    db.getRange(r, 2).setValue(label).setFontSize(12);
    db.getRange(r, 3).setFormula(formula).setFontSize(20).setFontColor(C.vert).setHorizontalAlignment('center');
    if (note) { db.getRange(r, 4, 1, 3).merge(); db.getRange(r, 4).setValue(note).setFontSize(10).setFontColor(C.gris).setFontStyle('italic'); }
    line(r);
  }
  function sp(expr) { return '=SUMPRODUCT(ARRAYFORMULA(' + expr + '))'; }

  section_(db, 5, 'Vue d’ensemble');
  kpi(6, 'Nombre de réponses (couples, familles…)', '=COUNTIF(' + col_(Q.prenom) + ',"?*")', 'Une réponse peut concerner plusieurs personnes');
  kpi(7, 'Nombre total de personnes concernées', sp(hasN + '*' + pers), 'Somme des « nombre de personnes »');
  kpi(8, 'Réponses avec au moins un « Je ne sais pas encore »',
    sp(hasN + '*((' + [Q.samedi, Q.dimanche, Q.dormir].map(function (q) { return eq_(q, INCERTAIN); }).join('+') + ')>0)'), 'Familles à relancer');
  kpi(9, 'Réponses signalant un régime particulier',
    sp(hasN + '*(LEN(' + col_(Q.regime) + ')>0)*(' + col_(Q.regime) + '<>"' + AUCUN_REGIME + '")'), 'Détail dans l’onglet « Régimes & allergies »');
  kpi(10, 'Réponses signalant une allergie ou intolérance', sp(hasN + '*(LEN(' + col_(Q.allergies) + ')>0)'), '');

  section_(db, 12, 'Présences (en nombre de personnes)');
  db.getRange(13, 2, 1, 5).setValues([['Jour', 'Oui', 'Incertain', 'Non', 'Taux de oui']])
    .setFontFamily('Arial').setFontSize(9).setFontColor(C.gris).setFontWeight('bold');
  [[Q.samedi, 'I — Samedi 22 mai'], [Q.dimanche, 'II — Dimanche 23 mai · brunch']].forEach(function (e, i) {
    var r = 14 + i, q = e[0];
    db.getRange(r, 2).setValue(e[1]).setFontSize(12);
    db.getRange(r, 3).setFormula(sp(eq_(q, 'Oui') + '*' + pers)).setFontSize(18).setFontColor(C.vert);
    db.getRange(r, 4).setFormula(sp(eq_(q, INCERTAIN) + '*' + pers)).setFontSize(14);
    db.getRange(r, 5).setFormula(sp(eq_(q, 'Non') + '*' + pers)).setFontSize(14);
    db.getRange(r, 6).setFormula('=IFERROR(C' + r + '/$C$7,0)').setNumberFormat('0%').setFontSize(12);
    db.getRange(r, 7).setFormula(spark_('C' + r, 'MAX(1,$C$7)', C.vert));
    line(r);
  });
  db.getRange('C14:F15').setHorizontalAlignment('center');

  section_(db, 17, 'Couchages au domaine');
  kpi(18, 'Réponses demandant un couchage', '=COUNTIF(' + col_(Q.dormir) + ',"Oui")', 'Couples ou familles');
  kpi(19, 'Personnes à loger (demandes fermes)', sp(eq_(Q.dormir, 'Oui') + '*' + loger), '');
  kpi(20, 'Personnes à loger (demandes incertaines)', sp(eq_(Q.dormir, INCERTAIN) + '*' + loger), '');
  kpi(21, 'Couchages disponibles', '=' + COUCHAGES_TOTAL, '');
  kpi(22, 'Places restantes (sur demandes fermes)', '=C21-C19', 'Négatif = plus de demandes que de places');
  db.getRange(23, 2).setValue('Taux de remplissage').setFontSize(12);
  db.getRange(23, 3).setFormula('=IFERROR(C19/C21,0)').setNumberFormat('0%').setFontSize(18).setFontColor(C.vert).setHorizontalAlignment('center');
  db.getRange(23, 4, 1, 3).merge();
  db.getRange(23, 4).setFormula(spark_('C19', 'C21', C.vert, C.sageClair));
  db.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenNumberLessThan(0).setFontColor('#B3261E').setBackground('#F6E4E4').setRanges([db.getRange('C22')]).build()
  ]);

  section_(db, 25, 'Régimes alimentaires (nombre de réponses concernées)');
  ['Végétarien', 'Végétalien', 'Sans porc', 'Sans gluten'].forEach(function (r, i) {
    db.getRange(26 + i, 2).setValue(r).setFontSize(12);
    db.getRange(26 + i, 3).setFormula('=COUNTIF(' + col_(Q.regime) + ',"*' + r + '*")').setFontSize(16).setFontColor(C.vert).setHorizontalAlignment('center');
    line(26 + i);
  });
  db.getRange(30, 2).setValue('Autre (voir onglet « Régimes & allergies »)').setFontSize(12);
  db.getRange(30, 3).setFormula(sp(hasN + '*(LEN(' + col_(Q.regime) + ')>0)' +
    [AUCUN_REGIME, 'Végétarien', 'Végétalien', 'Sans porc', 'Sans gluten'].map(function (r) { return '*ISERROR(SEARCH("' + r + '",' + col_(Q.regime) + '))'; }).join('')))
    .setFontSize(16).setFontColor(C.vert).setHorizontalAlignment('center');
  line(30);

  section_(db, 32, 'Liens utiles');
  db.getRange(33, 2).setValue('Formulaire (à partager / intégrer)');
  db.getRange(33, 3, 1, 5).merge(); db.getRange(33, 3).setValue(form.getPublishedUrl()).setFontFamily('Arial').setFontSize(9);
  db.getRange(34, 2).setValue('Modifier le formulaire');
  db.getRange(34, 3, 1, 5).merge(); db.getRange(34, 3).setValue(form.getEditUrl()).setFontFamily('Arial').setFontSize(9);
  db.getRange(35, 2).setValue('Date limite de réponse');
  db.getRange(35, 3, 1, 5).merge(); db.getRange(35, 3).setValue(DATE_LIMITE).setFontFamily('Arial').setFontSize(10);

  db.setFrozenRows(3);
  book.setActiveSheet(db);
  SpreadsheetApp.flush();
  book.setSpreadsheetLocale(locInit);
}

function section_(sh, row, title) {
  sh.getRange(row, 2, 1, 6).merge();
  sh.getRange(row, 2).setValue(title.toUpperCase()).setFontFamily('Arial').setFontSize(9).setFontWeight('bold').setFontColor(C.vert);
  sh.getRange(row, 2, 1, 6).setBackground(C.fond);
  sh.setRowHeight(row, 28);
}

function styleTable_(sh, nCols, widths) {
  var band = sh.getRange(1, 1, 2000, nCols).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
  band.setHeaderRowColor(C.vert).setFirstRowColor('#FFFFFF').setSecondRowColor(C.fond);
  sh.getRange(1, 1, 1, nCols).setFontColor(C.ivoire).setFontWeight('bold').setFontFamily('Arial').setFontSize(10).setVerticalAlignment('middle');
  sh.getRange(2, 1, 1999, nCols).setFontFamily('Arial').setFontSize(10).setVerticalAlignment('top').setWrap(true);
  sh.setFrozenRows(1);
  sh.setRowHeight(1, 34);
  widths.forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
}
