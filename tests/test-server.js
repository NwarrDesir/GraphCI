/**
 * Test API simple - Debug
 */

const http = require('http');

console.log('🔍 Test de connexion au serveur...\n');

// Test 1: Port 3000
http.get('http://localhost:3000/', (res) => {
  console.log('✅ Port 3000: Server répond (Status:', res.statusCode, ')');
  res.on('data', () => {});
  res.on('end', () => {
    testAPI();
  });
}).on('error', (e) => {
  console.log('❌ Port 3000: Erreur -', e.message);
  // Essayer port 3003
  testPort3003();
});

function testPort3003() {
  http.get('http://localhost:3003/', (res) => {
    console.log('✅ Port 3003: Server répond (Status:', res.statusCode, ')');
    res.on('data', () => {});
    res.on('end', () => {
      testAPIOn3003();
    });
  }).on('error', (e) => {
    console.log('❌ Port 3003: Erreur -', e.message);
    console.log('\n⚠️  Aucun serveur ne répond ! Lance: npm run dev');
  });
}

function testAPI() {
  console.log('\n🧪 Test API /api/users...\n');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/users?limit=2',
    method: 'GET',
    headers: {
      'x-api-key': 'graphci-dev-secret-2025-change-in-production'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log('✅ API Response:', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('❌ Invalid JSON:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.log('❌ API Error:', e.message);
  });

  req.end();
}

function testAPIOn3003() {
  console.log('\n🧪 Test API /api/users sur port 3003...\n');
  
  const options = {
    hostname: 'localhost',
    port: 3003,
    path: '/api/users?limit=2',
    method: 'GET',
    headers: {
      'x-api-key': 'graphci-dev-secret-2025-change-in-production'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log('✅ API Response:', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('❌ Invalid JSON:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.log('❌ API Error:', e.message);
  });

  req.end();
}
