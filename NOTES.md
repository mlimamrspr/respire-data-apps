# Export Markets Dashboard — data app (v3)

Source de la **v3** publiée le 2026-09-01 dans la preview Lightdash `goGlobal-app`.

- App : https://app.lightdash.cloud/projects/78b99966-80cd-4b28-a060-91ab1a46b5d7/apps/742176ad-2c3f-4ec4-b551-b7941f7feff4
- Preview : `goGlobal-app` — créée avec `lightdash start-preview --name goGlobal-app --select tag:go_global --ignore-errors`
- Branche dbt correspondante : `goGlobal`

## Ce que contient ce dossier

`node_modules/` et `dist/` sont volontairement exclus — le serveur Lightdash reconstruit depuis
`src/` et le manifeste, et n'utilise jamais un build local. Pour retravailler dessus :

```bash
cd lightdash/apps/export-markets-dashboard
npm install
lightdash apps validate
npm run build            # facultatif : le build serveur fait autorité
cd ../../..
lightdash upload --project <uuid> --apps export-markets-dashboard
```

## Le code écrit à la main

| Fichier | Rôle |
|---|---|
| `src/App.jsx` | les 5 onglets, les requêtes, la mise en page |
| `src/lib/model.js` | identifiants de champs, agrégation par grain, dérivation des ratios, formats |
| `src/lib/ui.jsx` | primitives visuelles — carte, KPI, chips, encart |

Le reste (`components/ui/`, `references/`, `.claude/skills/`) vient de l'échafaudage du CLI.

## Les deux règles à ne pas oublier

**1. Notation pointée partout.** Un champ se déclare `table.champ`, jamais `table_champ`.
Le SDK qualifie un nom nu avec l'explore de la requête — ce qui double-préfixe tout champ
venant d'une table **jointe** — et il indexe les lignes de résultat sur la chaîne exacte
qu'on lui a passée (`qualifiedToShort`, `apiTransport.js:444-449`). L'identifiant qui demande
un champ et celui qui le relit doivent donc être identiques ; la forme pointée est la seule
qui survit aux deux.

Les deux bugs des v1 et v2 venaient de là, et **ni `apps validate` ni `npm run build` ne les
ont vus**. La validation signale d'ailleurs `5 of 5 data-reference call sites couldn't be
fully analyzed` : les champs venant d'une constante importée, elle ne les vérifie pas.
La seule validation qui compte ici est d'ouvrir l'app.

**2. Aucun ratio n'est interrogé.** L'app ne demande que des briques additives et dérive
COS, CAC, CPM, CPC, CPA et ROAS elle-même, **après** avoir agrégé au grain affiché
(`derive()` dans `model.js`). Deux raisons :

- moyenner sept COS quotidiens pondérerait un dimanche calme comme un mardi chargé ;
  recalculer à partir des composants donne le vrai ratio de la semaine ;
- ça contourne gratuitement le bug `dd_base` de Lightdash, qui fait échouer toute requête
  combinant deux metrics `sum_distinct` sans dimension.

## Ce qu'il reste à faire

- Boutons d'export CSV/XLSX (contrôle dédié du SDK)
- `lineage` à répandre sur les blocs pour activer « Inspect data »
- Confronter les chiffres affichés à BigQuery, comme cela a été fait pour le dashboard
