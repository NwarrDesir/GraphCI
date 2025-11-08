# 🗺️ Intégration du GeoJSON GADM - Géocodage Inverse

## ✅ Fonctionnalités Implémentées

### 1️⃣ **Affichage des Frontières de la Côte d'Ivoire**

La carte affiche maintenant **uniquement le territoire ivoirien** avec ses frontières exactes.

#### Fichiers modifiés :
- **`components/Graph/GraphView.tsx`** :
  - Import du composant `GeoJSON` de react-leaflet
  - Chargement dynamique du fichier `gadm41_CIV_3.json`
  - Affichage des frontières en blanc semi-transparent (`opacity: 0.5`)
  - Ajustement automatique du zoom sur les limites de la CI

#### Code clé :
```typescript
<LeafletGeoJSON
  data={geojsonData}
  style={{
    fillColor: 'transparent',
    fillOpacity: 0,
    color: '#FFFFFF',
    weight: 2,
    opacity: 0.5,
  }}
/>
```

---

### 2️⃣ **Localisation Automatique des Signalements**

Quand un utilisateur signale un vendeur, le système **détecte automatiquement** :
- ✅ S'il est en Côte d'Ivoire
- ✅ Sa **commune** (ex: Cocody, Yopougon)
- ✅ Son **département** (ex: Abidjan)
- ✅ Sa **région** (ex: Abidjan)

#### Fichiers créés/modifiés :
- **`lib/utils/geocoding.ts`** (nouveau) :
  - `reverseGeocode(lat, lon)` : Point-in-polygon avec Turf.js
  - `getCoteDIvoireBounds()` : Bounding box de la CI
  - `getCoteDIvoireGeometry()` : GeoJSON complet
  - `getAllCommunes()`, `getAllDepartements()`, `getAllRegions()` : Listes complètes

- **`components/Report/ReportModal.tsx`** :
  - Suppression du champ "Ville" (manuellement renseigné)
  - Ajout d'un panneau "Localisation automatique"
  - Affichage en temps réel : Région → Département → Commune
  - Validation : impossible de signaler si hors CI
  - Enregistrement dans Firestore avec `commune`, `departement`, `region`

#### Interface utilisateur :
```
📍 Localisation automatique
✅ Côte d'Ivoire
   Commune: Cocody
   Département: Abidjan
   Région: Abidjan
```

---

## 📦 Dépendances Ajoutées

```bash
npm install @turf/turf  # 143 packages (calculs géospatiaux)
```

**Turf.js** : Bibliothèque JavaScript pour les opérations géospatiales (point-in-polygon, intersections, etc.)

---

## 📁 Structure des Fichiers

```
vendeu/
├── public/
│   └── gadm41_CIV_3.json       # GeoJSON GADM (113 features)
├── lib/
│   └── utils/
│       └── geocoding.ts         # Utilitaire de géocodage inverse
├── components/
│   ├── Graph/
│   │   └── GraphView.tsx        # Affichage des frontières CI
│   └── Report/
│       └── ReportModal.tsx      # Localisation automatique
```

---

## 🔧 API Créées

### `reverseGeocode(lat: number, lon: number)`
```typescript
const info = await reverseGeocode(5.3167, -4.0167); // Abidjan
// {
//   isInCoteDIvoire: true,
//   commune: "Cocody",
//   departement: "Abidjan",
//   region: "Abidjan",
//   gid3: "CIV.1.1.3_1",
//   coordinates: { lat: 5.3167, lon: -4.0167 }
// }
```

### `getCoteDIvoireBounds()`
```typescript
const bounds = await getCoteDIvoireBounds();
// [[4.35, -8.60], [10.74, -2.49]] // [Sud-Ouest, Nord-Est]
```

### `getAllCommunes()`
```typescript
const communes = await getAllCommunes();
// ["Abengourou", "Abidjan", "Cocody", "Yopougon", ...] // 113 communes
```

---

## 🎯 Avantages

### Avant :
- ❌ Carte affiche les pays limitrophes (Ghana, Burkina Faso, Mali...)
- ❌ Utilisateur doit sélectionner manuellement sa ville
- ❌ Risque d'erreurs (mauvaise sélection)
- ❌ Données incohérentes (ex: "Abidjan" alors qu'il est à Korhogo)

### Après :
- ✅ Carte parfaitement découpée sur la Côte d'Ivoire
- ✅ Localisation **automatique** précise au niveau commune
- ✅ Validation : impossible de signaler si hors CI
- ✅ Données **fiables** et **structurées** (région/département/commune)
- ✅ Exploitation future : statistiques par commune, heatmaps, analyses géographiques

---

## 🚀 Données Firestore Enrichies

Chaque signalement contient maintenant :

```typescript
{
  lat: 5.3167,
  lon: -4.0167,
  product: "garba",
  vendor_name: "Tante Marie",
  city: "Cocody",           // ← Commune (principal)
  region: "Abidjan",        // ← Niveau 1
  departement: "Abidjan",   // ← Niveau 2
  commune: "Cocody",        // ← Niveau 3 (précis)
  timestamp: Timestamp,
  user_id: "abc123"
}
```

---

## 📊 Utilisations Futures

### 1. Statistiques par Commune
```typescript
const vendorsCocody = vendors.filter(v => v.commune === "Cocody");
const vendorsYopougon = vendors.filter(v => v.commune === "Yopougon");
```

### 2. Heatmap par Densité
Afficher les zones les plus denses en vendeurs sur la carte.

### 3. Analyses Régionales
Comparer l'économie informelle entre régions (Abidjan vs Bouaké vs Korhogo).

### 4. Filtres Avancés
Ajouter un filtre par commune dans `Filters.tsx`.

### 5. Recherche Géographique
"Trouve-moi les vendeurs de garba à Cocody".

---

## 🧪 Test

1. Lance le serveur dev :
```bash
npm run dev
```

2. Clique sur "Signaler un vendeur"

3. Attends la géolocalisation

4. Vérifie que la **localisation automatique** s'affiche :
   - ✅ Côte d'Ivoire
   - Commune, Département, Région

5. Soumet le formulaire

6. Vérifie dans Firebase que les champs `commune`, `departement`, `region` sont remplis

---

## 🔍 Debug

Si la localisation ne fonctionne pas :

### 1. Vérifier le fichier GeoJSON
```bash
curl http://localhost:3001/gadm41_CIV_3.json
```
Doit retourner le fichier JSON (pas une 404).

### 2. Console Browser
```javascript
fetch('/gadm41_CIV_3.json')
  .then(r => r.json())
  .then(d => console.log('Features:', d.features.length));
// Doit afficher: Features: 113
```

### 3. Test manuel
```javascript
import { reverseGeocode } from '@/lib/utils/geocoding';

const info = await reverseGeocode(5.3167, -4.0167); // Abidjan
console.log(info);
// Doit afficher l'objet LocationInfo
```

---

## ✅ Résultat Final

🎯 **Objectif atteint** :
1. ✅ Carte découpée sur la Côte d'Ivoire uniquement
2. ✅ Localisation automatique des signalements (commune/département/région)
3. ✅ Aucune saisie manuelle requise
4. ✅ Données structurées et exploitables
5. ✅ Build réussi (214 kB page principale)

---

## 📝 Notes Techniques

### Performance
- **Cache** : Le fichier GeoJSON est chargé une seule fois et mis en cache
- **Point-in-polygon** : Algorithme optimisé de Turf.js (O(n) avec n = 113 features)
- **Lazy loading** : Le fichier est chargé uniquement côté client (pas de SSR)

### Précision
- **GADM Niveau 3** : Découpage administratif le plus précis (communes)
- **113 features** : Toutes les communes de Côte d'Ivoire
- **Point-in-polygon exact** : Turf.js utilise l'algorithme ray-casting

### Maintenance
- Pour mettre à jour les frontières : remplacer `public/gadm41_CIV_3.json`
- Le fichier GADM est officiel et mis à jour régulièrement par l'université de Berkeley

---

**Développé avec ❤️ pour le projet MAP VENDEURS CI** 🇨🇮
