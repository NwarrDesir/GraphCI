# 🧪 COMPTE DE TEST - GraphCI

## 📧 Identifiants

**Email**: `test@graphci.dev`  
**Mot de passe**: `GraphCI2025!`  
**ID Unique**: `CI-TEST-0001`  
**Localisation**: Abidjan, Cocody (5.3600, -4.0083)

## 🎯 Utilisation

Ce compte est un **vrai utilisateur Firebase** créé pour tester l'application depuis n'importe où dans le monde (même hors Côte d'Ivoire).

### Comment se connecter :

1. Ouvrir http://localhost:3000
2. Cliquer sur "Se connecter"
3. Entrer : `test@graphci.dev` / `GraphCI2025!`
4. L'appli charge le profil depuis Firebase

## ⚙️ Caractéristiques

- **Authentification Firebase** : Vraie authentification (pas de mock)
- **Profil Firestore** : Stocké dans la collection `users`
- **Position fixe** : Abidjan, Cocody (pas de géolocalisation automatique)
- **Couleur spéciale** : Orange vif (#FF6B35) pour se distinguer sur la carte
- **0 amis** au départ (tu peux en ajouter via l'API)

## 🔧 Créé automatiquement par le script

Le compte est créé via Firebase Admin SDK avec :
- Email/password authentication
- Document Firestore complet
- Validation GeoJSON passée (coordonnées CI valides)
