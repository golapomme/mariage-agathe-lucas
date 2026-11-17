# Site de mariage — Agathe & Lucas · 21 & 22 mai 2027

> **En ligne :** https://golapomme.github.io/mariage-agathe-lucas/
>
> | | Lien |
> |---|---|
> | Formulaire (lien invités) | https://docs.google.com/forms/d/e/1FAIpQLSeMwUPZs_3w3ASEm2F7NYRsGuaWLL5ZWKnDQ_XUmB3mNw3AMw/viewform |
> | Modifier le formulaire | https://docs.google.com/forms/d/13U4rc7AHxGZVkDGcZtFbBOJtygYr15AT-bNmmqlztX8/edit |
> | Tableur des réponses + tableau de bord | https://docs.google.com/spreadsheets/d/1LHAwqEcM5tatPhNg6HB6D-p5kPgezwk7Y3RxAQOBlC0/edit |
> | Script Apps Script | https://script.google.com/home/projects/1JTYF8qgoGvolHRe2HHEOCZJjYSZ8p2FrMvDgc7spN1nYjtBEyoSSIU6w/edit |
>
> Tout appartient au compte Google axeldavidlebastard@gmail.com. Pour donner accès aux mariés : bouton **Partager** du tableur et du formulaire → rôle *Éditeur*.
>
> **Mettre à jour le site :** modifier `index.html` directement sur GitHub (icône crayon → *Commit changes*) ; la nouvelle version est en ligne en 1 à 2 minutes.

Guide complet : mise en place du formulaire, du tableur, personnalisation et mise en ligne.

**Contenu du dossier**

| Fichier | Rôle |
|---|---|
| `index.html` | Le site complet (HTML + CSS + JavaScript, aucune dépendance hormis Google Fonts) |
| `google-apps-script.gs` | Script qui crée automatiquement le Google Forms, le Google Sheets lié et le tableau de bord |
| `README.md` | Ce guide |
| `photos/` *(à créer)* | Vos photos |

---

## 1. Direction artistique

**« Le faire-part éditorial »** : un site qui se lit comme un faire-part de papeterie fine mis en page par un magazine.

- **Palette** : ivoire `#FAF7F2` en fond, bordeaux `#682F40` pour les accents et les actions, rose poudré `#E8C8C5` et champagne `#D6C1A3` en touches, anthracite `#292524` pour le texte et les sections sombres.
- **Typographies** : *Cormorant Garamond* (titres, très fins, grands corps), *DM Sans* (textes et petites capitales espacées), *Pinyon Script* (manuscrite, uniquement pour le « & », « Nous nous marions » et la signature).
- **Composition** : numérotation romaine des sections (I à IX) comme dans un magazine, grands blancs, filets fins à la place des icônes, photo du couple dans une arche cernée d'un filet champagne, un seul brin végétal en pied de page.
- **Mouvement** : apparition des prénoms lettre par lettre, révélation de la photo en rideau, apparitions douces au défilement, disque vinyle qui tourne dans la section playlist. Tout est désactivé si le téléphone de l'invité demande moins d'animations.
- **Ouverture en enveloppe** (facultative) : un cachet de cire « A&L » à toucher. Elle ne s'affiche qu'une fois par visite, se passe en un clic, et ne s'affiche pas quand on arrive par un lien direct (ex. `…/#rsvp`). Pour la retirer : `envelopeIntro: false`.

---

## 2. Créer le formulaire et le tableur (méthode automatique, recommandée)

Le script crée en une fois le formulaire **avec ses conditions d'affichage**, le tableur lié et cinq onglets d'exploitation.

1. Connectez-vous au compte Google qui doit **posséder** les réponses (celui d'Agathe ou de Lucas).
2. Ouvrez <https://script.google.com> → **Nouveau projet**.
3. Effacez le contenu, collez tout `google-apps-script.gs`, enregistrez (Ctrl + S).
4. **Vérifiez `NUITS_DISPONIBLES`** en haut du script. Par défaut, seule la nuit du samedi au dimanche est proposée. Ajoutez celle du vendredi uniquement si elle est réellement possible.
5. Dans la liste des fonctions, choisissez **`creerMariage`** → **Exécuter**.
6. Autorisez l'accès. Si Google affiche « application non validée », cliquez sur *Paramètres avancés* puis *Accéder au projet* : c'est votre propre script.
7. Ouvrez le **Journal d'exécution** : vous y trouvez
   - le **lien du formulaire** (finit par `/viewform`) → à coller dans le site ;
   - le lien pour **modifier** le formulaire ;
   - le lien du **tableur**.

> Ne lancez `creerMariage` qu'une seule fois : chaque exécution crée un nouveau formulaire.

### Réglages à vérifier ensuite dans Google Forms (⚙ Paramètres)

- **Réponses → Collecter les adresses e-mail** : *Ne pas collecter* (l'e-mail est une question facultative du formulaire).
- **Limiter à une réponse** : **désactivé**. Sinon un compte Google devient obligatoire.
- **Autoriser la modification après envoi** : activé (déjà fait par le script).
- **Présentation → Afficher le lien pour envoyer une autre réponse** : activé (pour répondre pour son conjoint ou ses enfants).
- Si vous utilisez un compte Google Workspace (professionnel ou scolaire), décochez **« Limiter aux utilisateurs de [organisation] »**. Utilisez de préférence un compte Gmail personnel.

---

## 3. Structure exacte du questionnaire

Une réponse = **une personne**. C'est le seul moyen fiable de compter les couverts, les régimes et les couchages.

| Section | Question | Type | Obligatoire | Choix / remarque |
|---|---|---|---|---|
| **A. Vous** | Prénom | Réponse courte | ✔ | |
| | Nom | Réponse courte | ✔ | |
| | Adresse e-mail | Réponse courte (validation e-mail) | | |
| | Numéro de téléphone | Réponse courte | | |
| **B. Votre présence** | Participerez-vous à la cérémonie civile du vendredi 21 mai ? | Choix multiples | ✔ | Oui / Non / Je ne sais pas encore |
| | … cérémonie religieuse du samedi 22 mai ? | Choix multiples | ✔ | idem |
| | … réception du samedi soir ? | Choix multiples | ✔ | idem |
| | … brunch du dimanche 23 mai ? | Choix multiples | ✔ | idem |
| **C. Hébergement** | Souhaitez-vous dormir au domaine ? | Choix multiples **avec aiguillage** | ✔ | **Oui → « Votre couchage »** · **Je ne sais pas encore → « Votre couchage »** · **Non → section D** |
| **Votre couchage** *(affichée seulement si Oui ou Je ne sais pas encore)* | Pour quelle(s) nuit(s) ? | Cases à cocher | ✔ | Nuits de `NUITS_DISPONIBLES` |
| | Avez-vous des contraintes particulières de couchage ? | Paragraphe | | |
| | Commentaire sur l'hébergement | Paragraphe | | Rappel « draps et serviettes à apporter » dans l'en-tête de section |
| **D. Régimes** | Régime alimentaire | Cases à cocher + « Autre » | ✔ | Aucun régime particulier, Végétarien, Végétalien, Sans porc, Sans gluten, Autre (texte libre) |
| | Allergies ou intolérances alimentaires | Paragraphe | | |
| **E. Musique** | Quelle chanson aimeriez-vous entendre pendant la soirée ? | Réponse courte | | |
| | Nom de l'artiste | Réponse courte | | |
| | Un petit message pour les mariés | Paragraphe | | |
| **Confirmation** | Message personnalisé + lien « Modifier votre réponse » + « Envoyer une autre réponse » | | | |

**Création manuelle (sans script)** : reproduisez ce tableau dans Google Forms. Pour l'aiguillage, placez la question « Souhaitez-vous dormir au domaine ? » seule dans sa section, ouvrez le menu ⋮ de la question → *Aller à la section en fonction de la réponse*, et choisissez la section cible pour chaque réponse. Gardez **exactement** les mêmes intitulés si vous voulez utiliser le tableau de bord du script (relancez alors seulement `reconstruireTableauDeBord` après avoir relié le tableur).

---

## 4. Le tableur Google Sheets

Toutes les réponses arrivent automatiquement dans l'onglet **`Réponses`**. N'y touchez pas : ni tri, ni colonne ajoutée, ni ligne supprimée à la main. Les autres onglets se mettent à jour tout seuls.

| Onglet | Contenu |
|---|---|
| **Tableau de bord** | Nombre total de réponses · invités à relancer (au moins un « Je ne sais pas encore ») · présents par événement (Oui / Incertain / Non, taux, barre) · couchages demandés sur 55, places restantes (en rouge si négatif) et taux de remplissage · nombre de régimes particuliers et d'allergies, détail par régime · liens utiles |
| **Invités** | Liste nominative triée par nom : présences des 4 moments (en couleur), couchage, régime, allergies, coordonnées, message |
| **Couchages** | Toutes les demandes (Oui / Incertain) avec nuits et contraintes, plus une colonne **« Espace attribué »** (menu : L'Atelier / L'Escale / L'Étage / Pas de place) |
| **Régimes & allergies** | Les personnes concernées seulement, avec leur présence à la réception et au brunch : prêt à transmettre au traiteur |
| **Musique & messages** | Chansons et artistes proposés, et les mots laissés aux mariés : prêt à transmettre au DJ |

**Bon à savoir**

- Les formules retrouvent chaque question **par son intitulé** : vous pouvez réordonner le formulaire sans rien casser. Si vous **renommez** une question, mettez à jour l'objet `Q` du script puis lancez `reconstruireTableauDeBord`.
- La colonne « Espace attribué » de l'onglet Couchages est saisie à la main à côté d'une liste qui se trie automatiquement : si une réponse arrive ou change, l'ordre des lignes peut bouger. Pour les attributions définitives, copiez la liste (*Coller spécial → valeurs uniquement*) dans un nouvel onglet.
- Si un invité répond deux fois par erreur, supprimez le doublon dans **Google Forms → Réponses → Individuelle** (corbeille). Le tableur s'aligne.
- Notifications : dans Forms → *Réponses* → ⋮ → **Recevoir des notifications par e-mail pour les nouvelles réponses**.
- Partagez le tableur avec l'autre marié via **Partager** → rôle *Éditeur*. Ne le rendez jamais public.

---

## 5. Brancher le formulaire sur le site

Dans `index.html`, cherchez le bloc `CONFIG` (vers la fin du fichier) :

```js
googleFormUrl: "https://docs.google.com/forms/d/e/1FAIpQL.../viewform",
```

- Collez le lien `/viewform` donné par le script, ou celui de *Envoyer → onglet 🔗*. Le site ajoute lui-même `?embedded=true`.
- Évitez le lien court `forms.gle/...` : il ne s'intègre pas dans la page (le site affichera seulement un bouton qui ouvre le formulaire dans un nouvel onglet).
- **Tant que ce champ est vide**, la section affiche un bandeau **« Mode démonstration »** : aucune réponse ne peut être envoyée, et seul un bouton « Répondre par e-mail » est proposé. Rien n'est jamais simulé.
- Une fois branché : le formulaire s'affiche dans une carte ivoire, avec en dessous un lien « Ouvrir le questionnaire dans un nouvel onglet ». À chaque changement de page du formulaire, la page remonte automatiquement en haut de la carte.
- Si le formulaire paraît coupé ou laisse trop de blanc : ajustez `formHeight: { mobile: 1650, desktop: 1450 }`.

**Les boutons « Demander un couchage » et « Proposer une chanson »** mènent au formulaire, car Google Forms ne permet pas d'ouvrir directement une section précise. La partie musique est la dernière étape.

---

## 6. Personnaliser le site

Tout se fait dans le bloc `CONFIG`, en haut du `<script>` de `index.html`. Ouvrez le fichier avec un éditeur de texte (Bloc-notes, ou mieux, [VS Code](https://code.visualstudio.com/)).

### Textes
`nameA`, `nameB`, `tagline`, `dateLabel`, `place`, `story` (un paragraphe par ligne du tableau), `signature`, `faq` (questions / réponses, HTML autorisé), `privacy`, `contacts`.

### Programme et lieux
Tableaux `days` et `venues`. Chaque étape accepte `time`, `title`, `text`, `address`, `map` (adresse utilisée pour l'itinéraire) et `tag` (ex. `"À confirmer"`). `soft: true` affiche l'horaire en italique pour les moments sans heure précise (« Ensuite », « À l'arrivée »).

### Photos
1. Créez un dossier `photos/` à côté de `index.html`.
2. Récupérez vos photos d'origine (idéalement les fichiers originaux plutôt que les versions compressées par Wix).
3. Redimensionnez et compressez-les (<https://squoosh.app>, format WebP ou JPG, moins de 400 Ko) :

| Emplacement | Clé | Format conseillé |
|---|---|---|
| Accueil (arche) | `hero` | Portrait 1200 × 1600 |
| Notre histoire (grande) | `story` | Portrait 1200 × 1500 |
| Notre histoire (petite) | `story2` | Carré 800 × 800 |
| Mairie / Église / Domaine | `mairie`, `eglise`, `domaine` | Portrait 1200 × 1500 |

4. Renseignez par exemple `hero: "photos/hero.webp"`. Un emplacement vide affiche un monogramme « A&L — Photo à venir » : aucune image fictive n'est imposée.

> Photos actuellement en ligne sur le site Wix (à télécharger, puis à placer dans `photos/` ; éviter de les lier directement, elles disparaîtraient avec le site Wix) :
> `a3c367_32081b857fe54604814f08ab2c3a5609~mv2.jpeg`, `a3c367_505e57987d3b48ab94fbd4174b5a49df~mv2.jpg`, `a3c367_6c8fd9efcd7047d9a006973239cf6ee2~mv2.jpg`, `a3c367_1f78eb3caec048218572b0a72c859455~mv2.jpg`, `a3c367_09e201344abf4156b0d9cb0b8eba5a52~mv2.webp` (préfixe `https://static.wixstatic.com/media/`).

### Couleurs et polices
En haut du `<style>`, bloc `:root` : changez `--bordeaux`, `--rose`, etc. Toute la charte suit. Pour changer de police, remplacez le lien Google Fonts dans le `<head>` et les variables `--serif`, `--sans`, `--script`.

### Aperçu dans WhatsApp
Une fois le site en ligne, déposez une photo `photos/partage.jpg` (1200 × 630), puis décommentez la balise `og:image` dans le `<head>` en y mettant l'**URL complète** (ex. `https://agathe-et-lucas.netlify.app/photos/partage.jpg`).

---

## 7. Mettre le site en ligne

### Option A — Netlify Drop (la plus simple, 2 minutes, gratuit)
1. Rassemblez `index.html` et le dossier `photos/` dans un dossier, par exemple `mariage/`.
2. Allez sur <https://app.netlify.com/drop> et glissez-y le dossier.
3. Créez un compte gratuit pour conserver le site, puis *Site configuration → Change site name* → `agathe-et-lucas` → adresse `https://agathe-et-lucas.netlify.app`.
4. Pour mettre à jour : *Deploys* → glissez à nouveau le dossier.

### Option B — GitHub Pages
1. Créez un dépôt (ex. `mariage`) sur <https://github.com>, ajoutez `index.html` et `photos/` (*Add file → Upload files*).
2. *Settings → Pages → Branch : main / root → Save*.
3. Le site est publié sur `https://VOTRE-PSEUDO.github.io/mariage/` en une à deux minutes.

### Nom de domaine personnalisé (facultatif)
Achetez par exemple `agathe-et-lucas.fr` (environ 10 € par an chez OVH, Gandi…) puis reliez-le dans Netlify : *Domain management → Add a domain*. Le HTTPS est automatique.

---

## 8. Tester avant d'envoyer

- [ ] Ouvrir le site **sur un téléphone** (iPhone et Android si possible), depuis le lien envoyé dans WhatsApp.
- [ ] Envoyer une **réponse test** complète, vérifier qu'elle apparaît dans *Réponses*, *Invités* et le *Tableau de bord*.
- [ ] Tester les deux branches de l'hébergement (Oui → questions de couchage ; Non → passage direct aux régimes).
- [ ] Tester sur un navigateur **non connecté** à Google (navigation privée) : aucun compte ne doit être demandé.
- [ ] Cliquer sur tous les liens d'itinéraire et les adresses e-mail.
- [ ] **Supprimer la réponse test** (Forms → Réponses → Individuelle → corbeille).

## 9. Partager aux invités

Message type pour WhatsApp, SMS ou e-mail :

> Bonjour ! 💌 Nous nous marions les 21 et 22 mai 2027 en Normandie. Programme, lieux, hébergement… tout est ici : https://agathe-et-lucas.netlify.app
> Merci de nous répondre **avant le [date]** (une réponse par personne). Agathe & Lucas

- Pour envoyer directement vers la réponse : ajoutez `#rsvp` à la fin du lien (l'enveloppe ne s'affiche pas dans ce cas).
- Pour les invités moins à l'aise avec le numérique, un QR code sur le faire-part papier fonctionne très bien : générez-le sur <https://www.qr-code-generator.com> ou dans Chrome (*Partager → Créer un code QR*).
- Relance : l'indicateur « invités à relancer » du tableau de bord liste les « Je ne sais pas encore » ; le filtre de l'onglet *Invités* vous donne leurs noms.

---

## 10. Points à confirmer avant publication

Ces éléments sont volontairement affichés comme « à confirmer » ou laissés de côté plutôt qu'inventés :

1. **Horaire de la cérémonie civile** : le brief indique **16h30 – 17h**, l'ancien site Wix affiche **17h30**. C'est l'horaire du brief qui est utilisé ; à corriger dans `CONFIG.days` si besoin.
2. **Après la mairie** : le brief parle d'un verre partagé puis d'un restaurant éventuel, le site Wix d'un moment en famille proche. Vérifiez quels invités sont concernés.
3. **Nuits proposées au domaine** : seule la nuit du samedi au dimanche est proposée dans le formulaire.
4. **Stationnement** : la FAQ annonce « précisé prochainement ».
5. **Mention de confidentialité** : elle promet une suppression des données après l'événement. Pensez à la faire, ou modifiez le texte (`CONFIG.privacy`).
6. **Date limite de réponse** : à ajouter dans `CONFIG.faq` ou dans le message d'envoi.
