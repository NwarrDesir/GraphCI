/**
 * Test Suite API - Map Vendeurs CI
 * Usage: npm run test:api
 */

const http = require('http');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const DEV_API_KEY = 'graphci-dev-secret-2025-change-in-production';

// Couleurs pour le terminal
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Utilitaires
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = body ? JSON.stringify(body) : null;
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// Tests
const tests = [
  {
    name: 'Stats API - Réseau Social',
    run: async () => {
      const res = await makeRequest('/api/stats');
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (!res.data.global) throw new Error('Missing global stats');
      log(`  → ${res.data.global.totalUsers} utilisateurs, ${res.data.global.totalFriendships} amitiés`, 'blue');
    }
  },
  {
    name: 'Graph Public API',
    run: async () => {
      const res = await makeRequest('/api/graph/public');
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (!res.data.data) throw new Error('Missing data');
      const { users, friendships, stats } = res.data.data;
      log(`  → ${users.length} users, ${friendships.length} amitiés`, 'blue');
    }
  },
  {
    name: 'Créer cluster dense (20 users + amitiés)',
    run: async () => {
      const res = await makeRequest('/api/dev/simulate/cluster', 'POST', {
        'Content-Type': 'application/json',
        'x-api-key': DEV_API_KEY
      }, { count: 20 });
      if (res.status !== 200) throw new Error(`Status ${res.status}: ${res.data?.error || 'Unknown'}`);
      log(`  → ${res.data.data.created} users, ${res.data.data.friendshipsCreated} amitiés`, 'blue');
      log(`  → ${res.data.data.location}`, 'blue');
    }
  }
];

// Exécution
(async () => {
  log('\n🧪 Test Suite API - GraphCI\n', 'blue');
  log(`Base URL: ${BASE_URL}\n`, 'yellow');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test.run();
      log(`✓ ${test.name}`, 'green');
      passed++;
    } catch (error) {
      log(`✗ ${test.name}`, 'red');
      log(`  ${error.message}`, 'red');
      failed++;
    }
  }

  log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'blue');
  log(`Résultats: ${passed} passed, ${failed} failed`, failed > 0 ? 'red' : 'green');
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`, 'blue');

  process.exit(failed > 0 ? 1 : 0);
})();
