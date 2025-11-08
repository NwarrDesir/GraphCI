# 🧪 Scripts de Test API - MAP VENDEURS CI

Ce fichier contient tous les scripts pour tester l'API et simuler l'utilisation de l'app.

---

## 🚀 Dashboard de Monitoring

**URL** : http://localhost:3001/monitor

**Fonctionnalités** :
- ✅ Voir les stats en temps réel (auto-refresh toutes les 3s)
- ✅ Créer 1, 10, 50 signalements d'un clic
- ✅ Créer un cluster de vendeurs proches
- ✅ Nettoyer les données de test
- ✅ Voir les derniers signalements
- ✅ Statistiques par ville et produit

---

## 📡 API Endpoints

### 1. GET /api/stats - Statistiques

```bash
# PowerShell
curl http://localhost:3001/api/stats

# CMD
curl http://localhost:3001/api/stats
```

**Réponse** :
```json
{
  "global": {
    "total": 150,
    "simulated": 140,
    "real": 10,
    "users": 25
  },
  "byCity": {
    "Abidjan": 45,
    "Bouaké": 30,
    "Yamoussoukro": 20
  },
  "byProduct": {
    "attiéké": 30,
    "garba": 25,
    "pain": 20
  },
  "recent": [ ... ]
}
```

---

### 2. POST /api/reports/simulate - Créer des signalements

#### Un signalement aléatoire
```bash
# PowerShell
curl -Method POST -Uri http://localhost:3001/api/reports/simulate -ContentType "application/json" -Body '{"count":1}'

# CMD avec curl (si installé)
curl -X POST http://localhost:3001/api/reports/simulate -H "Content-Type: application/json" -d "{\"count\":1}"
```

#### 10 signalements à Abidjan
```bash
# PowerShell
$body = @{
    count = 10
    city = "Abidjan"
} | ConvertTo-Json

curl -Method POST -Uri http://localhost:3001/api/reports/simulate -ContentType "application/json" -Body $body
```

#### 50 signalements d'attiéké
```bash
# PowerShell
$body = @{
    count = 50
    product = "attiéké"
} | ConvertTo-Json

curl -Method POST -Uri http://localhost:3001/api/reports/simulate -ContentType "application/json" -Body $body
```

#### 100 signalements (maximum)
```bash
# PowerShell
curl -Method POST -Uri http://localhost:3001/api/reports/simulate -ContentType "application/json" -Body '{"count":100}'
```

**Réponse** :
```json
{
  "success": true,
  "count": 10,
  "reports": [
    { "id": "abc123", "city": "Abidjan", "product": "attiéké" },
    ...
  ],
  "message": "10 signalement(s) créé(s)"
}
```

---

### 3. POST /api/reports/cluster - Créer un cluster

#### Cluster de 5 vendeurs proches à Abidjan
```bash
# PowerShell
$body = @{
    city = "Abidjan"
    product = "attiéké"
    count = 5
} | ConvertTo-Json

curl -Method POST -Uri http://localhost:3001/api/reports/cluster -ContentType "application/json" -Body $body
```

#### Cluster de 10 vendeurs avec distance personnalisée
```bash
# PowerShell
$body = @{
    city = "Bouaké"
    product = "garba"
    count = 10
    maxDistance = 0.0002  # ~20m
} | ConvertTo-Json

curl -Method POST -Uri http://localhost:3001/api/reports/cluster -ContentType "application/json" -Body $body
```

**Réponse** :
```json
{
  "success": true,
  "count": 5,
  "cluster": {
    "center": { "lat": 5.3600, "lon": -4.0083 },
    "radius": 33.3,
    "city": "Abidjan",
    "product": "attiéké"
  },
  "reports": [
    { "id": "abc", "lat": "5.360123", "lon": "-4.008234" },
    ...
  ],
  "message": "Cluster de 5 vendeurs créé à Abidjan"
}
```

---

### 4. DELETE /api/reports/clean - Nettoyer les données

#### Supprimer tous les signalements simulés
```bash
# PowerShell
curl -Method DELETE -Uri http://localhost:3001/api/reports/clean

# CMD
curl -X DELETE http://localhost:3001/api/reports/clean
```

#### Supprimer TOUS les signalements (y compris réels)
```bash
# PowerShell
curl -Method DELETE -Uri "http://localhost:3001/api/reports/clean?only_simulated=false"
```

**Réponse** :
```json
{
  "success": true,
  "deleted": 140,
  "message": "140 signalement(s) supprimé(s)"
}
```

---

## 🎬 Scénarios de Test

### Scénario 1 : Test Initial (Base vide)

```bash
# 1. Vérifier que la base est vide
curl http://localhost:3001/api/stats

# 2. Créer 10 signalements de test
curl -Method POST -Uri http://localhost:3001/api/stats -ContentType "application/json" -Body '{"count":10}'

# 3. Vérifier les stats
curl http://localhost:3001/api/stats

# 4. Ouvrir l'app et voir le graphe : http://localhost:3001
```

---

### Scénario 2 : Remplissage Progressif

```bash
# Créer signalements progressivement et observer l'évolution

# Vague 1 : Abidjan
curl -Method POST -Uri http://localhost:3001/api/reports/simulate -ContentType "application/json" -Body '{"count":20,"city":"Abidjan"}'

# Attendre 5 secondes, observer le graphe

# Vague 2 : Bouaké
curl -Method POST -Uri http://localhost:3001/api/reports/simulate -ContentType "application/json" -Body '{"count":15,"city":"Bouaké"}'

# Attendre 5 secondes, observer le graphe

# Vague 3 : Autres villes
curl -Method POST -Uri http://localhost:3001/api/reports/simulate -ContentType "application/json" -Body '{"count":30}'

# Observer l'évolution finale
```

---

### Scénario 3 : Test de Clusters

```bash
# Créer 3 clusters dans des villes différentes

# Cluster 1 : Abidjan (attiéké)
$body1 = @{ city = "Abidjan"; product = "attiéké"; count = 7 } | ConvertTo-Json
curl -Method POST -Uri http://localhost:3001/api/reports/cluster -ContentType "application/json" -Body $body1

# Cluster 2 : Bouaké (garba)
$body2 = @{ city = "Bouaké"; product = "garba"; count = 5 } | ConvertTo-Json
curl -Method POST -Uri http://localhost:3001/api/reports/cluster -ContentType "application/json" -Body $body2

# Cluster 3 : Yamoussoukro (pain)
$body3 = @{ city = "Yamoussoukro"; product = "pain"; count = 6 } | ConvertTo-Json
curl -Method POST -Uri http://localhost:3001/api/reports/cluster -ContentType "application/json" -Body $body3

# Observer les clusters dans le graphe (zoom sur chaque ville)
```

---

### Scénario 4 : Stress Test

```bash
# Créer beaucoup de signalements rapidement

# Batch 1
curl -Method POST -Uri http://localhost:3001/api/reports/simulate -ContentType "application/json" -Body '{"count":100}'

# Batch 2
curl -Method POST -Uri http://localhost:3001/api/reports/simulate -ContentType "application/json" -Body '{"count":100}'

# Batch 3
curl -Method POST -Uri http://localhost:3001/api/reports/simulate -ContentType "application/json" -Body '{"count":100}'

# Vérifier les stats
curl http://localhost:3001/api/stats

# Observer les performances du graphe avec 300+ signalements
```

---

### Scénario 5 : Test de Filtres

```bash
# 1. Créer des signalements dans plusieurs villes
curl -Method POST -Uri http://localhost:3001/api/reports/simulate -ContentType "application/json" -Body '{"count":20,"city":"Abidjan"}'
curl -Method POST -Uri http://localhost:3001/api/reports/simulate -ContentType "application/json" -Body '{"count":20,"city":"Bouaké"}'
curl -Method POST -Uri http://localhost:3001/api/reports/simulate -ContentType "application/json" -Body '{"count":20,"city":"Daloa"}'

# 2. Ouvrir l'app : http://localhost:3001
# 3. Tester les filtres :
#    - Filtrer par ville : Abidjan
#    - Filtrer par produit : attiéké
#    - Filtrer par période : 7 derniers jours
```

---

## 🔄 Script d'Observation Continue

### PowerShell : Monitoring en boucle

```powershell
# script_monitor.ps1
while ($true) {
    Clear-Host
    Write-Host "===== MAP VENDEURS CI - STATS =====" -ForegroundColor Cyan
    Write-Host ""
    
    $stats = curl -Uri http://localhost:3001/api/stats | ConvertFrom-Json
    
    Write-Host "Total signalements : $($stats.global.total)" -ForegroundColor Green
    Write-Host "Simulés           : $($stats.global.simulated)" -ForegroundColor Yellow
    Write-Host "Réels             : $($stats.global.real)" -ForegroundColor Blue
    Write-Host "Utilisateurs      : $($stats.global.users)" -ForegroundColor Magenta
    Write-Host ""
    
    Write-Host "Top 5 Villes :" -ForegroundColor Cyan
    $stats.byCity.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 5 | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value)"
    }
    
    Write-Host ""
    Write-Host "Dernière mise à jour : $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
    Write-Host "Appuyez sur Ctrl+C pour arrêter"
    
    Start-Sleep -Seconds 3
}
```

**Utilisation** :
```bash
# Sauvegarder le script dans script_monitor.ps1
# Lancer :
.\script_monitor.ps1
```

---

## 🎯 Script de Test Automatique Complet

```powershell
# test_complet.ps1
Write-Host "===== TEST AUTOMATIQUE - MAP VENDEURS CI =====" -ForegroundColor Cyan
Write-Host ""

# 1. Nettoyer
Write-Host "[1/6] Nettoyage de la base..." -ForegroundColor Yellow
curl -Method DELETE -Uri http://localhost:3001/api/reports/clean | Out-Null
Start-Sleep -Seconds 2

# 2. Vérifier base vide
Write-Host "[2/6] Vérification base vide..." -ForegroundColor Yellow
$stats = curl -Uri http://localhost:3001/api/stats | ConvertFrom-Json
Write-Host "  Total : $($stats.global.total)" -ForegroundColor Gray
Start-Sleep -Seconds 2

# 3. Créer signalements Abidjan
Write-Host "[3/6] Création de 20 signalements à Abidjan..." -ForegroundColor Yellow
curl -Method POST -Uri http://localhost:3001/api/reports/simulate -ContentType "application/json" -Body '{"count":20,"city":"Abidjan"}' | Out-Null
Start-Sleep -Seconds 2

# 4. Créer un cluster
Write-Host "[4/6] Création d'un cluster de 5 vendeurs..." -ForegroundColor Yellow
$bodyCluster = @{ city = "Bouaké"; product = "garba"; count = 5 } | ConvertTo-Json
curl -Method POST -Uri http://localhost:3001/api/reports/cluster -ContentType "application/json" -Body $bodyCluster | Out-Null
Start-Sleep -Seconds 2

# 5. Créer signalements aléatoires
Write-Host "[5/6] Création de 30 signalements aléatoires..." -ForegroundColor Yellow
curl -Method POST -Uri http://localhost:3001/api/reports/simulate -ContentType "application/json" -Body '{"count":30}' | Out-Null
Start-Sleep -Seconds 2

# 6. Stats finales
Write-Host "[6/6] Statistiques finales..." -ForegroundColor Yellow
$finalStats = curl -Uri http://localhost:3001/api/stats | ConvertFrom-Json
Write-Host ""
Write-Host "===== RÉSULTATS =====" -ForegroundColor Green
Write-Host "Total signalements : $($finalStats.global.total)" -ForegroundColor Green
Write-Host "Par ville :"
$finalStats.byCity.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Gray
}
Write-Host ""
Write-Host "✅ Test terminé ! Ouvrez http://localhost:3001 pour voir le résultat" -ForegroundColor Green
```

**Utilisation** :
```bash
.\test_complet.ps1
```

---

## 📊 URLs Importantes

| URL | Description |
|-----|-------------|
| `http://localhost:3001` | Application principale (graphe) |
| `http://localhost:3001/monitor` | Dashboard de monitoring |
| `http://localhost:3001/api/stats` | API Statistiques (GET) |
| `http://localhost:3001/api/reports/simulate` | API Simulation (POST) |
| `http://localhost:3001/api/reports/cluster` | API Cluster (POST) |
| `http://localhost:3001/api/reports/clean` | API Nettoyage (DELETE) |

---

## 🔥 Utilisation Recommandée

### Workflow de Test

```
1. Ouvrir le dashboard : http://localhost:3001/monitor
2. Cliquer sur les boutons pour créer des signalements
3. Observer l'évolution en temps réel (auto-refresh 3s)
4. Ouvrir l'app principale dans un autre onglet : http://localhost:3001
5. Voir les signalements apparaître sur le graphe
6. Tester les filtres, zoom, pan
7. Nettoyer quand terminé
```

### Test depuis PowerShell

```
1. Ouvrir PowerShell
2. Lancer le script de monitoring : .\script_monitor.ps1
3. Dans un autre terminal, créer des signalements avec curl
4. Observer les stats s'actualiser en temps réel
```

---

<div align="center">

## 🎯 TU PEUX MAINTENANT TESTER L'APP EN DIRECT !

**Dashboard** : http://localhost:3001/monitor

**API** : Tous les endpoints sont prêts

**Scripts** : PowerShell inclus pour automation

</div>
