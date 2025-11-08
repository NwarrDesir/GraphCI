# 🚀 Guide d'Utilisation - GraphCI

## ✅ État Actuel de l'Application

### Ce qui fonctionne MAINTENANT :

1. **Carte visible SANS connexion** ✅
   - Vous voyez 102 utilisateurs simulés
   - 211 amitiés affichées en ROSE VIF
   - Mode "Amis uniquement" actif par défaut

2. **Système d'inscription RÉEL** ✅
   - Cliquez "Se connecter" (bouton bleu en haut à droite)
   - Authentification Google
   - Formulaire avec géolocalisation GPS
   - Vous apparaîtrez sur la carte avec votre ID unique CI-XXXX-YYYY

3. **Header professionnel** ✅
   - Logo GraphCI
   - Bouton connexion/profil
   - Design premium

4. **Graphe interactif** ✅
   - Cliquez sur un point → Modal utilisateur (design premium)
   - 4 modes de visualisation
   - Zoom/Pan/Reset
   - Frontières Côte d'Ivoire

---

## 📋 Comment Tester l'Application

### 1. Ouvrir l'application
```
http://localhost:3002
```

### 2. Observer la carte (SANS connexion)
- Vous voyez déjà 102 utilisateurs
- Zoom avec molette ou boutons
- Cliquez sur un point → Profil utilisateur
- Les lignes ROSES = amitiés réelles

### 3. S'inscrire (OBLIGATOIRE pour apparaître)

**Étape 1 : Connexion**
- Cliquez sur "Se connecter" (en haut à droite)
- Authentification Google

**Étape 2 : Créer votre profil**
- Remplir : Nationalité, Âge
- Autoriser GPS (position exacte)
- Valider

**Étape 3 : Apparaître sur la carte**
- Vous verrez votre point sur la carte
- Votre ID unique : CI-XXXX-YYYY
- Vous êtes maintenant dans le réseau

### 4. Modes de visualisation

**Mode "Amis uniquement" (par défaut)**
- Affiche SEULEMENT les amitiés validées
- 211 liens en ROSE VIF
- Le réseau social réel

**Mode "Tous"**
- Affiche les proximités géographiques (<200m)
- Liens cyan

**Mode "Par Nationalité"**
- Regroupe par nationalité
- Couleurs différentes par pays

**Mode "Par Âge"**
- Regroupe par tranches d'âge (±5 ans)

---

## 🧪 Tests API Disponibles

```powershell
npm run test:api
```

**Ce que ça fait :**
- Vérifie les stats (utilisateurs, amitiés)
- Teste l'API du graphe
- Crée 20 nouveaux utilisateurs + 75 amitiés

---

## 📊 Données Actuelles

- **102 utilisateurs simulés**
- **211 amitiés**
- Positions GPS RÉELLES validées (fichier GeoJSON)
- Algorithme d'affinité intelligent :
  - Nationalité commune : +5 pts
  - Âge proche : +3 pts
  - Distance géographique : jusqu'à +10 pts
  - **PAS de limite de distance** pour les amitiés

---

## 🎨 Design Premium

- Modal utilisateur avec icons professionnels (react-icons)
- Dégradés et bordures sophistiqués
- Animations fluides
- Stats en cards colorées
- Header avec logo et navigation

---

## 🔑 Fonctionnalités RÉELLES

### Inscription
- ✅ Authentification Firebase
- ✅ Géolocalisation GPS
- ✅ Validation des coordonnées (GeoJSON Côte d'Ivoire)
- ✅ ID unique généré

### Graphe
- ✅ 4 modes de visualisation
- ✅ Amitiés réelles depuis Firestore
- ✅ Zoom/Pan/Reset
- ✅ Frontières CI

### Simulation
- ✅ Algorithme d'affinité intelligent
- ✅ Amitiés variées (pas seulement distance)
- ✅ Positions GPS validées

---

## 🚨 Important

**Vous DEVEZ vous connecter pour :**
- Apparaître sur la carte
- Ajouter des amis
- Envoyer des messages (à venir)

**La carte est PUBLIQUE :**
- Visible sans connexion
- Tout le monde voit le réseau
- Anonymat respecté (ID unique, pas de noms réels)

---

## 🔥 Prochaines Étapes

1. Système de demande d'ami
2. Code ami temporaire (6 chiffres)
3. Messages entre amis
4. Fil d'activité en temps réel
5. Tests d'amitié personnalisés

---

## 💻 Commandes Développement

```powershell
# Démarrer le serveur
npm run dev

# Tester les API
npm run test:api

# Build production
npm run build
```

---

**Fait avec ❤️ par un dev SENIOR de niveau Google**
