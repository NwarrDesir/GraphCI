# 📋 INDEX - MAP VENDEURS CI

## 🎯 Objectif du Projet

Créer une **PWA collaborative** pour cartographier le commerce informel en Côte d'Ivoire via un **graphe dynamique** (sans carte géographique).

---

## 📚 Documents Disponibles

| Document | Description | Lecture |
|----------|-------------|---------|
| **[README.md](README.md)** | Vue d'ensemble du projet | 📖 5 min |
| **[SPECIFICATION_MAP_VENDEURS_CI.md](SPECIFICATION_MAP_VENDEURS_CI.md)** | Cahier des charges complet | 📘 30 min |
| **[STRUCTURE_PROJET.md](STRUCTURE_PROJET.md)** | Architecture & dossiers | 📗 15 min |
| **[GUIDE_DEMARRAGE.md](GUIDE_DEMARRAGE.md)** | Installation pas à pas | 🚀 20 min |
| **[BRIEF_DEVELOPPEUR.md](BRIEF_DEVELOPPEUR.md)** | Mission & livrables | 👨‍💻 20 min |
| **[CHECKLIST_DEV.md](CHECKLIST_DEV.md)** | Toutes les tâches à faire | ✅ 10 min |

---

## 🛠️ Fichiers de Code

| Fichier | Description | Usage |
|---------|-------------|-------|
| **[haversine.ts](haversine.ts)** | Calcul distances GPS | Prêt à utiliser |
| **[types.ts](types.ts)** | Types TypeScript | Import dans tout le projet |
| **[firebase-config.ts](firebase-config.ts)** | Config Firebase | À compléter avec vos clés |
| **[package.json](package.json)** | Dépendances npm | `npm install` |
| **[.env.example](.env.example)** | Variables d'environnement | Copier vers `.env.local` |

---

## 🚀 Par Où Commencer ?

### Pour le Chef de Projet (Melvine)

1. ✅ **Lire** : `README.md` → vue d'ensemble
2. ✅ **Lire** : `BRIEF_DEVELOPPEUR.md` → comprendre ce qui est attendu
3. ✅ **Remettre** : Tous ces fichiers au développeur
4. ✅ **Créer** : Projet Firebase sur [console.firebase.google.com](https://console.firebase.google.com/)
5. ✅ **Activer** : Authentication, Firestore, Functions, Hosting
6. ✅ **Partager** : Identifiants Firebase avec le développeur

### Pour le Développeur

1. ✅ **Lire** : `BRIEF_DEVELOPPEUR.md` → mission complète
2. ✅ **Lire** : `GUIDE_DEMARRAGE.md` → installation
3. ✅ **Suivre** : `CHECKLIST_DEV.md` → toutes les tâches
4. ✅ **Installer** : Node.js, Firebase CLI, dépendances
5. ✅ **Configurer** : `.env.local` avec clés Firebase
6. ✅ **Démarrer** : `npm run dev`
7. ✅ **Développer** : Sprint par sprint (6 sprints de 5 jours)

---

## 🔑 Fonctionnalités Clés

### 1. Signalement GPS
Un citoyen signale un vendeur → géolocalisation automatique → enregistré dans Firestore

### 2. Fusion Automatique
Si 2 signalements du même produit à moins de 30m → **fusionnés en 1 vendeur unique**

### 3. Graphe Dynamique
Les vendeurs s'affichent comme un **réseau de nœuds** reliés par des arêtes (distance ou produit)

### 4. Statistiques
Dashboard avec :
- Distance moyenne entre vendeurs
- Produits les plus fréquents
- Répartition par ville
- Évolution temporelle

---

## 📊 Technologies

```
Frontend : Next.js 14 + TypeScript + Tailwind CSS + Sigma.js
Backend  : Firebase (Auth, Firestore, Functions, Hosting)
GPS      : Formule de Haversine (fournie)
PWA      : Manifest + Service Worker
```

---

## ⏱️ Timeline

```
Sprint 1 (5j) : Auth + Signalement
Sprint 2 (5j) : Graphe dynamique
Sprint 3 (7j) : Cloud Functions + Fusion
Sprint 4 (7j) : Stats + Filtres
Sprint 5 (3j) : PWA + Optimisations
Sprint 6 (3j) : Tests + Déploiement
────────────────────────────────────
Total    : 30 jours
```

---

## ✅ Critères de Réussite

### Fonctionnel
- [x] Signalement de vendeur avec GPS ✅
- [x] Graphe dynamique interactif ✅
- [x] Fusion automatique < 30m ✅
- [x] Filtres par ville/produit ✅
- [x] Dashboard statistiques ✅
- [x] PWA installable ✅

### Technique
- [x] TypeScript strict ✅
- [x] Firebase uniquement ✅
- [x] Pas de carte géographique ✅
- [x] Thème noir/blanc ✅
- [x] Responsive mobile ✅
- [x] Lighthouse > 90 ✅

---

## 🎨 Design

**Couleurs :**
- Fond : Noir `#000000`
- Texte : Blanc `#FFFFFF`
- Produits : Couleurs variées (voir `types.ts`)

**Style :**
- Graphe : Nœuds blancs, arêtes fines, fond noir
- UI : Minimaliste, moderne, fluide
- Animations : Smooth, 60 FPS

---

## 📍 Villes Principales

```
Abidjan, Bouaké, Daloa, Yamoussoukro, Korhogo,
San-Pédro, Man, Gagnoa, Divo, Abengourou
```

---

## 🍽️ Produits Vendus

```
garba, pain, fruits, eau, riz, attiéké, alloco,
poulet braisé, poisson braisé, arachides,
bananes plantain, légumes, vêtements, chaussures,
téléphones, autre
```

---

## 📞 Support

**Chef de Projet** : Melvine  
**Email** : [à définir]  
**Durée** : 30 jours  
**Budget** : À définir

---

## 🏁 Livrable Final

**URL Production** : `https://map-vendeurs-ci.web.app`

**Contenu :**
- ✅ Application PWA fonctionnelle
- ✅ Cloud Functions déployées
- ✅ Base Firestore avec données de test
- ✅ Documentation complète
- ✅ Code source commenté
- ✅ Guide de déploiement

---

## 💡 Notes Importantes

### ⚠️ À RESPECTER ABSOLUMENT

1. **Distance de fusion = 30 mètres** (ni plus, ni moins)
2. **Formule de Haversine exacte** (fournie dans `haversine.ts`)
3. **Pas de carte Google Maps** (uniquement graphe abstrait)
4. **Thème noir/blanc strict** (sauf couleurs produits)
5. **Firebase uniquement** (pas d'autre backend)
6. **TypeScript strict** (pas de `any`)

### 💚 BONUS APPRÉCIÉS

- Mode offline avancé
- Export CSV
- Notifications push
- Tests E2E
- API publique

---

## 🗂️ Ordre de Lecture Recommandé

**Pour comprendre le projet rapidement :**

```
1. INDEX.md (ce fichier)          → 5 min  ✅ Vous êtes ici
2. README.md                       → 5 min  📖 Vue d'ensemble
3. BRIEF_DEVELOPPEUR.md           → 20 min 👨‍💻 Mission complète
4. GUIDE_DEMARRAGE.md             → 20 min 🚀 Installation
5. CHECKLIST_DEV.md               → 10 min ✅ Tâches à faire
                                   ───────
                                   Total : ~1 heure
```

**Pour développer :**

```
6. SPECIFICATION_MAP_VENDEURS_CI.md → 30 min 📘 Cahier des charges
7. STRUCTURE_PROJET.md             → 15 min 📗 Architecture
8. haversine.ts                    → 10 min 🧮 Code GPS
9. types.ts                        → 10 min 🔧 Types TypeScript
                                    ───────
                                    Total : ~2 heures
```

---

## ✨ Quick Start (3 Commandes)

```powershell
# 1. Installer
npm install

# 2. Configurer
copy .env.example .env.local
# Puis éditer .env.local avec vos clés Firebase

# 3. Lancer
npm run dev
```

**Naviguer vers** : [http://localhost:3000](http://localhost:3000)

---

## 🎯 Prochaine Action

### Si vous êtes le Chef de Projet :
➡️ Lire **`BRIEF_DEVELOPPEUR.md`** et le remettre au développeur

### Si vous êtes le Développeur :
➡️ Lire **`GUIDE_DEMARRAGE.md`** et commencer l'installation

---

<div align="center">

**📖 Toute la documentation est prête !**

**🚀 Prêt à démarrer le développement**

**🇨🇮 Fait avec ❤️ pour la Côte d'Ivoire**

[⬆ Retour en haut](#-index---map-vendeurs-ci)

</div>
