# 📝 CHECKLIST DE DÉVELOPPEMENT - MAP VENDEURS CI

## 🎯 Phase 1 : Configuration Initiale (Jour 1-2)

### Setup Projet
- [ ] Créer projet Firebase sur console.firebase.google.com
- [ ] Activer Authentication (Google + Anonyme)
- [ ] Activer Firestore Database (mode production)
- [ ] Activer Hosting
- [ ] Activer Functions (plan Blaze)
- [ ] Récupérer les identifiants Firebase
- [ ] Initialiser projet Next.js : `npx create-next-app@latest`
- [ ] Installer Firebase CLI : `npm install -g firebase-tools`
- [ ] Se connecter à Firebase : `firebase login`
- [ ] Initialiser Firebase : `firebase init`
- [ ] Créer `.env.local` avec config Firebase
- [ ] Installer toutes les dépendances : `npm install`
- [ ] Vérifier que le serveur dev démarre : `npm run dev`

---

## 🔐 Phase 2 : Authentification (Jour 3-4)

### Configuration Firebase Auth
- [ ] Créer `src/lib/firebase/config.ts`
- [ ] Créer `src/lib/firebase/auth.ts`
- [ ] Implémenter `signInWithGoogle()`
- [ ] Implémenter `signInAnonymously()`
- [ ] Implémenter `signOut()`
- [ ] Créer hook `useAuth()` dans `src/lib/hooks/useAuth.ts`
- [ ] Créer composant `AuthButton.tsx`
- [ ] Créer composant `UserProfile.tsx`
- [ ] Tester connexion Google
- [ ] Tester connexion anonyme
- [ ] Gérer les états (loading, error, success)

---

## 📍 Phase 3 : Géolocalisation & Signalement (Jour 5-7)

### Géolocalisation
- [ ] Créer `src/lib/hooks/useGeolocation.ts`
- [ ] Implémenter `getCurrentPosition()`
- [ ] Gérer les permissions navigateur
- [ ] Gérer les erreurs (refus, timeout, etc.)
- [ ] Afficher position en temps réel

### Composant de Signalement
- [ ] Créer `src/components/Report/ReportButton.tsx`
- [ ] Créer `src/components/Report/ReportModal.tsx`
- [ ] Créer `src/components/Report/ProductSelector.tsx`
- [ ] Créer liste déroulante des produits
- [ ] Créer champ optionnel "Nom du vendeur"
- [ ] Implémenter détection automatique de la ville
- [ ] Créer fonction `createReport()` dans Firestore
- [ ] Gérer l'envoi du signalement
- [ ] Afficher message de succès/erreur
- [ ] Tester avec données réelles

### Firestore Reports
- [ ] Créer collection `reports`
- [ ] Définir structure de document
- [ ] Tester écriture dans Firestore
- [ ] Vérifier dans Firebase Console

---

## 🎨 Phase 4 : Graphe Dynamique (Jour 8-12)

### Configuration Sigma.js
- [ ] Installer `sigma` et `graphology`
- [ ] Créer `src/components/Graph/GraphView.tsx`
- [ ] Initialiser Sigma dans un useEffect
- [ ] Configurer le renderer (noir/blanc)
- [ ] Implémenter zoom et pan

### Génération du Graphe
- [ ] Créer `src/lib/utils/graph.ts`
- [ ] Fonction `buildGraphFromVendors()`
- [ ] Algorithme de création des nœuds
- [ ] Algorithme de création des arêtes (distance < 200m)
- [ ] Implémenter la formule de Haversine
- [ ] Calculer positions avec ForceAtlas2
- [ ] Appliquer les couleurs par produit

### Interactions
- [ ] Créer `src/components/Graph/GraphControls.tsx`
- [ ] Boutons zoom in/out
- [ ] Bouton reset view
- [ ] Click sur nœud → afficher détails vendeur
- [ ] Hover → highlight nœud
- [ ] Créer `src/components/Graph/GraphLegend.tsx`

### Hook de Récupération des Vendeurs
- [ ] Créer `src/lib/hooks/useVendors.ts`
- [ ] Query Firestore `vendors`
- [ ] Appliquer les filtres (ville, produit, date)
- [ ] Gérer loading state
- [ ] Gérer erreurs
- [ ] Auto-refresh toutes les 30s

---

## ⚙️ Phase 5 : Cloud Functions (Jour 13-17)

### Structure Functions
- [ ] Créer `functions/src/index.ts`
- [ ] Créer `functions/src/utils/haversine.ts`
- [ ] Copier la fonction Haversine côté serveur
- [ ] Créer types partagés

### Trigger onReportCreated
- [ ] Créer `functions/src/triggers/onReportCreated.ts`
- [ ] Écouter `onCreate` sur collection `reports`
- [ ] Récupérer lat, lon, product, city
- [ ] Query vendeurs existants (même produit)
- [ ] Calculer distances avec Haversine
- [ ] Si distance < 30m → update vendor existant
- [ ] Sinon → créer nouveau vendor
- [ ] Incrémenter compteur signalements
- [ ] Mettre à jour `last_seen`
- [ ] Logger les actions

### Tests Functions
- [ ] Créer `functions/src/__tests__/onReportCreated.test.ts`
- [ ] Tester création nouveau vendeur
- [ ] Tester fusion avec vendeur existant
- [ ] Tester cas limites (distance exactement 30m)
- [ ] Tester avec plusieurs vendeurs proches

### Déploiement Functions
- [ ] `cd functions && npm install`
- [ ] `firebase deploy --only functions`
- [ ] Vérifier logs dans Firebase Console
- [ ] Tester en conditions réelles

---

## 🔍 Phase 6 : Filtres & UI (Jour 18-20)

### Composants de Filtres
- [ ] Créer `src/components/Filters/CityFilter.tsx`
- [ ] Créer `src/components/Filters/ProductFilter.tsx`
- [ ] Créer `src/components/Filters/DateFilter.tsx`
- [ ] Implémenter sélecteurs avec Headless UI
- [ ] Gérer l'état des filtres (Context ou Zustand)
- [ ] Appliquer filtres sur query Firestore
- [ ] Animer transitions des filtres

### Styling Global
- [ ] Créer `src/styles/globals.css`
- [ ] Configurer Tailwind (noir/blanc)
- [ ] Créer classes utilitaires custom
- [ ] Responsive mobile-first
- [ ] Dark mode uniquement

---

## 📊 Phase 7 : Statistiques & Analytics (Jour 21-24)

### Cloud Function updateStats
- [ ] Créer `functions/src/triggers/updateStats.ts`
- [ ] Fonction planifiée (1×/jour)
- [ ] Calculer distance moyenne par ville/produit
- [ ] Compter vendeurs actifs
- [ ] Identifier produit le plus signalé
- [ ] Stocker dans collection `stats`

### Page Statistiques
- [ ] Créer `src/app/stats/page.tsx`
- [ ] Créer `src/components/Stats/StatsOverview.tsx`
- [ ] Créer `src/components/Stats/CityStats.tsx`
- [ ] Créer `src/components/Stats/ProductChart.tsx`
- [ ] Intégrer Chart.js (bar, pie, line)
- [ ] Afficher KPIs (total vendeurs, distance moy, etc.)
- [ ] Créer tableaux de données
- [ ] Ajouter export CSV (optionnel)

---

## 📱 Phase 8 : PWA (Jour 25-27)

### Configuration PWA
- [ ] Créer `public/manifest.json`
- [ ] Générer icônes PWA (192x192, 512x512)
- [ ] Créer `public/sw.js` (Service Worker)
- [ ] Configurer next.config.js pour PWA
- [ ] Implémenter cache strategy
- [ ] Tester installation sur mobile
- [ ] Tester mode offline (signalements en queue)

### Optimisations
- [ ] Lazy loading des composants
- [ ] Code splitting
- [ ] Optimiser images
- [ ] Minification JS/CSS
- [ ] Lighthouse score > 90

---

## 🗄️ Phase 9 : Données de Test (Jour 28)

### Script de Seed
- [ ] Créer `scripts/seed.ts`
- [ ] Générer 100 vendeurs fictifs
- [ ] Répartir sur Abidjan, Bouaké, Yamoussoukro
- [ ] Variété de produits
- [ ] Dates aléatoires (30 derniers jours)
- [ ] Exécuter : `npx ts-node scripts/seed.ts`

### Vérification
- [ ] Vérifier dans Firestore Console
- [ ] Tester le graphe avec données réelles
- [ ] Tester les filtres
- [ ] Tester les stats

---

## 🧪 Phase 10 : Tests (Jour 29)

### Tests Unitaires
- [ ] Configurer Jest
- [ ] Tester `haversine.ts`
- [ ] Tester `graph.ts`
- [ ] Tester hooks (`useAuth`, `useVendors`)
- [ ] Coverage > 70%

### Tests Composants
- [ ] Tester `ReportModal`
- [ ] Tester `GraphView`
- [ ] Tester filtres

### Tests E2E (optionnel)
- [ ] Configurer Playwright
- [ ] Test : Signaler un vendeur
- [ ] Test : Filtrer le graphe
- [ ] Test : Voir les stats

---

## 🚀 Phase 11 : Déploiement (Jour 30)

### Préparation
- [ ] Vérifier toutes les variables d'environnement
- [ ] Nettoyer le code (linting)
- [ ] Optimiser les performances
- [ ] Tester build production : `npm run build`
- [ ] Vérifier qu'il n'y a pas d'erreurs

### Déploiement Firebase
- [ ] Déployer Firestore rules : `firebase deploy --only firestore:rules`
- [ ] Déployer Functions : `firebase deploy --only functions`
- [ ] Déployer Hosting : `firebase deploy --only hosting`
- [ ] Vérifier URL : `https://map-vendeurs-ci.web.app`

### Post-Déploiement
- [ ] Tester sur mobile (Android + iOS)
- [ ] Tester installation PWA
- [ ] Tester toutes les fonctionnalités en prod
- [ ] Vérifier les logs Firebase
- [ ] Configurer monitoring (optionnel)

---

## 📝 Phase 12 : Documentation Finale (Bonus)

- [ ] Compléter README.md
- [ ] Documenter l'architecture
- [ ] Créer guide utilisateur
- [ ] Documenter l'API (Cloud Functions)
- [ ] Créer changelog
- [ ] Préparer présentation du projet

---

## ✅ Critères de Validation

### Fonctionnel
- [ ] Un utilisateur peut se connecter (Google ou anonyme)
- [ ] Un utilisateur peut signaler un vendeur avec géoloc
- [ ] Le graphe s'affiche correctement
- [ ] Les vendeurs proches sont fusionnés automatiquement
- [ ] Les filtres fonctionnent (ville, produit, date)
- [ ] Les stats sont calculées et affichées
- [ ] La PWA est installable sur mobile

### Technique
- [ ] Code TypeScript strict (pas d'erreurs)
- [ ] Règles Firestore sécurisées
- [ ] Cloud Functions opérationnelles
- [ ] Build production sans erreurs
- [ ] Lighthouse score > 90
- [ ] Responsive sur tous devices

### Design
- [ ] Thème noir/blanc respecté
- [ ] Interface fluide et intuitive
- [ ] Animations smooth
- [ ] Pas de carte géographique externe
- [ ] Graphe organique et lisible

---

**🎉 Projet Terminé !**

Date de début : _______________  
Date de fin : _______________  
Durée totale : _______________

**Livrable final** : `https://map-vendeurs-ci.web.app`
