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
