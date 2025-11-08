# 🧪 Guide du Simulateur de Développement

## 🎯 Objectif

Le **Simulateur** permet de tester l'application **MAP VENDEURS CI** depuis n'importe où dans le monde (France, etc.) **sans avoir besoin d'être physiquement en Côte d'Ivoire**.

---

## 📍 Pourquoi un Simulateur ?

### Problème
- L'application utilise la **géolocalisation GPS réelle**
- En développant depuis la France, les coordonnées GPS sont en Europe
- Impossible de tester les fonctionnalités avec des données réalistes de Côte d'Ivoire

### Solution
Le simulateur génère automatiquement :
- ✅ **Coordonnées GPS réelles** des villes ivoiriennes (Abidjan, Bouaké, etc.)
- ✅ **Noms de vendeurs** typiques (Tante Marie, Amadou, Kouassi...)
- ✅ **Produits variés** (attiéké, alloco, garba, etc.)
- ✅ **Distribution géographique réaliste**

---

## 🚀 Comment l'utiliser

### 1. Accès au Simulateur

Le panneau apparaît automatiquement en **mode développement** :

```
📍 Écran principal
└─ Bouton violet en bas à droite (🧪 icône de fiole)
   └─ Cliquez pour ouvrir le panneau
```

**Conditions :**
- ✅ Vous devez être **connecté** (Google ou Anonyme)
- ✅ Mode **development** (`npm run dev`)
- ❌ Invisible en **production** (sécurité)

---

### 2. Options Disponibles

#### 🎲 **1 signalement aléatoire**
Crée un seul signalement avec :
- Ville aléatoire (ou sélectionnée)
- Produit aléatoire
- Coordonnées GPS réelles
- 50% de chance d'avoir un nom de vendeur

**Usage :** Test rapide, ajout ponctuel

---

#### 📊 **N signalements multiples**
Crée plusieurs signalements (1-100) :
- Entrez le nombre désiré
- Cliquez sur le bouton
- Distribution automatique dans toutes les villes

**Usage :** Peupler rapidement la base de données

**Exemple :**
```
10 signalements → 10 vendeurs répartis dans différentes villes
```

---

#### 🎯 **Cluster de 5 vendeurs proches**
Crée 5 signalements **à moins de 30 mètres** :
- Même produit
- Même zone géographique
- Coordonnées très proches

**Usage :** Tester la **fusion automatique** des vendeurs

**Important :** Cette fonctionnalité teste le futur système de Cloud Functions qui doit fusionner les signalements proches automatiquement.

---

#### 🌍 **Scénario complet (36 signalements)**
Crée un jeu de données réaliste :
- **5 vendeurs** en cluster à Abidjan (attiéké)
- **3 vendeurs** en cluster à Abidjan (poisson braisé)
- **8 vendeurs** dispersés à Bouaké
- **5 vendeurs** à Yamoussoukro
- **15 vendeurs** dans d'autres villes

**Usage :** Test complet de l'application, démonstration

---

## 🗺️ Coordonnées GPS Réelles

Le simulateur utilise les **vraies coordonnées** des villes :

| Ville | Latitude | Longitude | Rayon |
|-------|----------|-----------|-------|
| **Abidjan** | 5.3600 | -4.0083 | ~5 km |
| **Bouaké** | 7.6900 | -5.0300 | ~3 km |
| **Daloa** | 6.8800 | -6.4500 | ~2 km |
| **Yamoussoukro** | 6.8276 | -5.2893 | ~3 km |
| **San-Pédro** | 4.7500 | -6.6333 | ~2 km |
| **Korhogo** | 9.4581 | -5.6296 | ~2 km |
| **Man** | 7.4125 | -7.5544 | ~2 km |
| **Gagnoa** | 6.1319 | -5.9506 | ~2 km |
| **Divo** | 5.8372 | -5.3572 | ~2 km |
| **Abengourou** | 6.7294 | -3.4961 | ~2 km |

**Algorithme :**
```typescript
// Génère un point aléatoire dans le rayon de la ville
const randomOffset = () => (Math.random() - 0.5) * 2 * cityRadius;
lat = cityLat + randomOffset();
lon = cityLon + randomOffset();
```

---

## 👥 Noms de Vendeurs

Liste des noms utilisés (typiquement ivoiriens) :

```
Tante Marie, Amadou, Fatou, Kouassi, Adjoua,
Yao, Akissi, Kouamé, Aya, Bamba, Affoué,
N'Guessan, Mariam, Koffi, Assita
```

**Probabilité :** 50% de chance d'avoir un nom (réaliste)

---

## 🧪 Cas d'Usage Pratiques

### Cas 1 : Test Initial (Base de données vide)
```
1. Connectez-vous
2. Ouvrez le simulateur
3. Cliquez "Scénario complet (36 signalements)"
4. Attendez 2-3 secondes
5. Vérifiez le graphe → Vous devriez voir des nœuds !
```

---

### Cas 2 : Test de Filtres
```
1. Créez 20 signalements multiples (sans ville)
2. Fermez le simulateur
3. Ouvrez les filtres (en haut à gauche)
4. Filtrez par ville : Abidjan
5. Observez le graphe se mettre à jour
```

---

### Cas 3 : Test de Fusion (<30m)
```
1. Ouvrez le simulateur
2. Sélectionnez ville : Abidjan
3. Cliquez "Cluster de 5 vendeurs proches"
4. Vérifiez dans Firestore :
   - Collection /reports
   - 5 documents créés
   - Coordonnées très proches
```

**Note :** La fusion automatique nécessite les Cloud Functions (Phase 2)

---

### Cas 4 : Stress Test (Performance)
```
1. Créez 100 signalements multiples
2. Observez la performance du graphe
3. Testez le zoom/pan
4. Vérifiez les statistiques
```

---

## 🔍 Marqueur de Simulation

Tous les signalements créés par le simulateur ont un champ spécial :

```typescript
{
  lat: 5.3612,
  lon: -4.0095,
  product: 'attiéké',
  city: 'Abidjan',
  timestamp: Timestamp.now(),
  user_id: 'simulator',
  simulated: true // 👈 Marqueur de données de test
}
```

**Avantage :** Facile à identifier/supprimer les données de test

**Requête Firestore pour nettoyer :**
```javascript
// Supprimer toutes les données simulées
const simulatedReports = await getDocs(
  query(collection(db, 'reports'), where('simulated', '==', true))
);
simulatedReports.forEach(doc => deleteDoc(doc.ref));
```

---

## ⚠️ Limitations

### 1. Géolocalisation Réelle vs Simulée
- ❌ Le simulateur **ne teste pas** la géolocalisation HTML5
- ✅ Il crée directement des données avec coordonnées
- Pour tester la géolocalisation : utiliser le bouton de signalement normal

### 2. Permissions
- Le simulateur nécessite une connexion Firebase
- En production, le panneau est complètement invisible

### 3. Performance
- Limité à 100 signalements par action
- Pour plus : utiliser plusieurs fois ou script backend

---

## 🛠️ API du Simulateur

### Fonctions Exportées

```typescript
// lib/utils/simulator.ts

// Génère des coordonnées GPS dans une ville
generateRandomCoordinates(city: string): { lat: number; lon: number }

// Génère un nom de vendeur (50% de chance)
generateRandomVendorName(): string | undefined

// Génère un produit aléatoire
generateRandomProduct(): Product

// Génère une ville aléatoire
generateRandomCity(): string

// Génère un signalement complet
generateRandomReport(city?: string): SimulatedReport

// Génère N signalements
generateMultipleReports(count: number, city?: string): SimulatedReport[]

// Génère un cluster de vendeurs proches
generateCluster(
  city: string,
  product: Product,
  count: number = 3,
  maxDistance: number = 0.0003 // ~30m
): SimulatedReport[]

// Génère un scénario de test complet
generateTestScenario(): SimulatedReport[]
```

---

## 🎨 Interface Utilisateur

Le panneau du simulateur utilise **React Icons** (professionnel) :

| Icône | Signification |
|-------|---------------|
| 🧪 (FaFlask) | Bouton d'ouverture |
| 🎲 (FaRandom) | Signalement aléatoire |
| 📊 (FaLayerGroup) | Signalements multiples |
| 🎯 (FaLayerGroup) | Cluster de vendeurs |
| 💾 (FaDatabase) | Scénario complet |
| ❌ (FaTimes) | Fermer le panneau |

---

## 📝 Exemple de Code

### Utiliser le simulateur programmatiquement

```typescript
import { generateTestScenario } from '@/lib/utils/simulator';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase/config';

// Créer 36 signalements de test
async function seedDatabase() {
  const reports = generateTestScenario();
  
  for (const report of reports) {
    await addDoc(collection(db, COLLECTIONS.REPORTS), {
      ...report,
      timestamp: Timestamp.now(),
      user_id: 'seed-script',
      simulated: true,
    });
  }
  
  console.log(`✅ ${reports.length} signalements créés`);
}
```

---

## 🔒 Sécurité

### Mode Production
En production (`npm run build` + `npm start`) :
- ❌ Le simulateur n'apparaît **jamais**
- Condition : `process.env.NODE_ENV === 'development'`

### Marqueur de Données
- Toutes les données simulées ont `simulated: true`
- Facile à filtrer ou supprimer

### Permissions Firestore
Les règles Firestore doivent autoriser l'écriture :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /reports/{reportId} {
      allow create: if request.auth != null;
    }
  }
}
```

---

## 🎓 Résumé

| Feature | Description |
|---------|-------------|
| **Accès** | Bouton violet (🧪) en bas à droite |
| **Conditions** | Connecté + Mode dev |
| **Villes** | 10 villes ivoiriennes réelles |
| **Coordonnées** | GPS réelles (Lat/Lon) |
| **Noms** | 15 noms typiques ivoiriens |
| **Marqueur** | `simulated: true` |
| **Limite** | 100 signalements par action |
| **Production** | Invisible (sécurité) |

---

## 🚀 Quick Start

```bash
# 1. Lancer l'application
npm run dev

# 2. Se connecter (Google ou Anonyme)
# 3. Cliquer sur le bouton violet (🧪)
# 4. Cliquer "Scénario complet"
# 5. Voir le graphe se peupler !
```

---

## 📞 Support

**Problème : Le bouton n'apparaît pas**
- Vérifiez que vous êtes connecté
- Vérifiez `NODE_ENV=development`
- Vérifiez la console pour des erreurs

**Problème : Erreur lors de la création**
- Vérifiez Firebase config dans `.env.local`
- Vérifiez les règles Firestore
- Vérifiez la connexion internet

---

<div align="center">

**🧪 DÉVELOPPEZ SANS FRONTIÈRES ! 🇨🇮**

**Testez depuis la France avec des données ivoiriennes réelles**

</div>
