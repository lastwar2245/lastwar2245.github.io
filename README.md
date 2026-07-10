# LastWar2245 — GitHub Pages

Site communautaire LastWar2245 compatible avec GitHub Pages.

## Structure

```text
/
├── index.html              # Accueil FR / EN
├── fr/index.html           # Version française
├── en/index.html           # Version anglaise / structure prête
├── assets/
│   ├── css/style.css       # CSS partagé, titres pliables et ancres de section
│   ├── js/app.js           # JS partagé : menu, navigation, titres/visualisations pliables
│   ├── images/recap_vs/    # Images récap VS, suffixées par langue
│   ├── images/site/        # Images d'interface du site, dont EN en construction
│   └── fichiers images existants
└── .nojekyll               # Désactive le traitement Jekyll côté GitHub Pages
```

## Mise en ligne

1. Créer le dépôt `lastwar2245.github.io` sur le compte GitHub `lastwar2245`.
2. Envoyer tous les fichiers de ce dossier à la racine du dépôt.
3. Aller dans **Settings → Pages**.
4. Source : **Deploy from a branch**.
5. Branch : **main** / folder **/** root.
6. Attendre le déploiement.

URL attendue : `https://lastwar2245.github.io/`

## Logique FR / EN

- `fr/index.html` contient le sommaire français.
- `en/index.html` contient le sommaire anglais.
- Les deux versions partagent les mêmes assets, le même CSS et le même JavaScript.
- Pour ajouter une page future, garder la même logique :
  - `fr/nom-page.html`
  - `en/nom-page.html`

## Règles d'édition

Ne pas renommer les fichiers du dossier `assets/` sans mettre à jour les liens dans les pages HTML.

### Images récap VS

Les images récap VS sont rangées dans :

```text
assets/images/recap_vs/
```

Convention de nommage :

```text
recap_lundi_v1_FR.png
recap_lundi_v1_EN.png
```

- `_FR` = image française active.
- `_EN` = future image anglaise, à ajouter quand la traduction visuelle sera prête.

Tant que les images anglaises n'existent pas, la page EN peut continuer à pointer vers les images `_FR` pour éviter les liens cassés.


## Mise à jour V4

- Les titres H2 à H5 sont repliés par défaut.
- Les titres restent dépliables/repliables via l’icône `▸ / ▾`.
- Les ancres `#` restent disponibles pour les liens directs.
- Le fichier `.nojekyll` est inclus à la racine pour GitHub Pages.

## Mise à jour V5

- Ajout d'une image `assets/images/site/under_construction_EN.svg`.
- Sur l'accueil, la carte EN affiche l'image "EN version under construction" et renvoie vers `en/`.
- La page `en/index.html` affiche aussi un statut clair : version EN en construction.
- Workflow retenu : finaliser `fr/index.html`, copier la structure validée vers `en/index.html`, puis traduire avec ChatGPT section par section.
- Les titres H2 à H5 restent repliés par défaut.


## Erreur 404

Le fichier `404.html` contient une page d’erreur personnalisée pour GitHub Pages.


## Version v7 — titres hiérarchiques dans “Fiches par jour”

- Les jours de la section `Fiches par jour` sont maintenant de vrais titres `H3`.
- Les liens du menu latéral pointent directement vers ces titres `H3`.
- Les titres H2 à H5 restent repliés par défaut au chargement.
- Le menu latéral affiche les jours comme des sous-titres hiérarchiques.


## Architecture multilingue

- `fr/` : version source et référence.
- `en/`, `pt/`, `de/` : traductions temporaires assistées par IA.
- `chroniquestaverne/` : page intégrée des Chroniques du Tavernier DB71.
- `assets/css/style.css` : style partagé des guides.
- `assets/css/portal.css` : style partagé de l’accueil, de la page 404 et des pages simples.
- `assets/js/app.js` : interactions partagées (menus, titres pliables, ancres).

Pour la maintenance, modifier d’abord `fr/index.html`, puis régénérer les traductions. Éviter de recopier du CSS dans chaque page : placer les règles communes dans `assets/css/`.
