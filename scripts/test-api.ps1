# Script PowerShell de test API GraphCI
# Usage: .\test-api.ps1

$baseUrl = "http://localhost:3000"
$devKey = "dev-secret-key-change-me"

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "   TEST API GRAPHCI" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Fonction helper pour les requêtes
function Invoke-ApiCall {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [hashtable]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    $uri = "$baseUrl$Endpoint"
    $params = @{
        Uri = $uri
        Method = $Method
        Headers = $Headers
        ContentType = "application/json"
    }
    
    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }
    
    try {
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 1. Créer des utilisateurs
Write-Host "1. Creation de 10 utilisateurs..." -ForegroundColor Yellow
$usersResult = Invoke-ApiCall `
    -Endpoint "/api/dev/simulate/users" `
    -Method "POST" `
    -Body @{ count = 10 } `
    -Headers @{ "X-Dev-Key" = $devKey }

if ($usersResult -and $usersResult.success) {
    Write-Host "   ✓ $($usersResult.data.created) utilisateurs crees" -ForegroundColor Green
    $usersResult.data.users | Select-Object idUnique, nationality, commune | Format-Table -AutoSize
} else {
    Write-Host "   ✗ Echec" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# 2. Créer des amitiés
Write-Host "2. Creation de 20 liens d'amitie..." -ForegroundColor Yellow
$friendshipsResult = Invoke-ApiCall `
    -Endpoint "/api/dev/simulate/friendships" `
    -Method "POST" `
    -Body @{ count = 20 } `
    -Headers @{ "X-Dev-Key" = $devKey }

if ($friendshipsResult -and $friendshipsResult.success) {
    Write-Host "   ✓ $($friendshipsResult.data.created) amities creees" -ForegroundColor Green
} else {
    Write-Host "   ✗ Echec" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# 3. Simuler une conversation
if ($usersResult -and $usersResult.data.users.Count -ge 2) {
    Write-Host "3. Simulation d'une conversation active..." -ForegroundColor Yellow
    $user1 = $usersResult.data.users[0].id
    $user2 = $usersResult.data.users[1].id
    
    $messagesResult = Invoke-ApiCall `
        -Endpoint "/api/dev/simulate/messages" `
        -Method "POST" `
        -Body @{ 
            user1Id = $user1
            user2Id = $user2
            count = 5 
        } `
        -Headers @{ "X-Dev-Key" = $devKey }
    
    if ($messagesResult -and $messagesResult.success) {
        Write-Host "   ✓ $($messagesResult.data.created) messages echanges" -ForegroundColor Green
        Write-Host "   💡 $($messagesResult.data.note)" -ForegroundColor Cyan
    } else {
        Write-Host "   ✗ Echec" -ForegroundColor Red
    }
}

Start-Sleep -Seconds 1

# 4. Récupérer l'état du graphe
Write-Host ""
Write-Host "4. Etat du graphe public..." -ForegroundColor Yellow
$graphResult = Invoke-ApiCall -Endpoint "/api/graph/public"

if ($graphResult -and $graphResult.success) {
    $stats = $graphResult.data.stats
    Write-Host ""
    Write-Host "=======================================" -ForegroundColor Cyan
    Write-Host "   STATISTIQUES DU GRAPHE" -ForegroundColor Cyan
    Write-Host "=======================================" -ForegroundColor Cyan
    Write-Host "Utilisateurs total    : $($stats.totalUsers)" -ForegroundColor White
    Write-Host "Utilisateurs actifs   : $($stats.activeUsers)" -ForegroundColor Green
    Write-Host "Amities total         : $($stats.totalFriendships)" -ForegroundColor White
    Write-Host "Conversations actives : $($stats.activeConversations)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repartition par nationalite:" -ForegroundColor Yellow
    $stats.nationalitiesCount.PSObject.Properties | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Value)" -ForegroundColor White
    }
    Write-Host "=======================================" -ForegroundColor Cyan
} else {
    Write-Host "   ✗ Echec" -ForegroundColor Red
}

Write-Host ""
Write-Host "✨ Test termine ! Verifiez la carte sur http://localhost:3000" -ForegroundColor Green
Write-Host ""
