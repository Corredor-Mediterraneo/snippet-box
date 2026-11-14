#!/usr/bin/env node
/**
 * Benchmark script for Snippet Box API endpoints.
 * Measures latency of key endpoints and outputs a JSON score.
 * Usage: node bench/medir.js [--holdout]
 */

const http = require('http');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const SNIPPET_COUNT = process.env.SNIPPET_COUNT || 50;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData ? Buffer.byteLength(postData) : 0
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function measureEndpoint(name, fn) {
  const times = [];
  for (let i = 0; i < 3; i++) {
    const start = Date.now();
    await fn();
    const elapsed = Date.now() - start;
    times.push(elapsed);
  }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  console.error(`${name}: ${avg.toFixed(2)}ms avg`);
  return avg;
}

async function setupTestData() {
  // Create test snippets
  const snippets = [];
  for (let i = 0; i < SNIPPET_COUNT; i++) {
    const snippet = {
      title: `Test Snippet ${i}`,
      description: `Description for snippet ${i}`,
      language: 'javascript',
      code: `// Snippet ${i}\nconsole.log('Hello ${i}');`,
      docs: `Documentation for snippet ${i}`,
      tags: ['test', 'javascript']
    };
    const res = await request('POST', '/api/snippets', snippet);
    if (res.status === 201) {
      const parsed = JSON.parse(res.data);
      snippets.push(parsed.data);
    }
  }
  return snippets;
}

async function cleanupTestData(snippets) {
  for (const snippet of snippets) {
    await request('DELETE', `/api/snippets/${snippet.id}`);
  }
}

async function main() {
  console.error('Starting benchmark...');
  
  // Check if server is running
  try {
    await request('GET', '/api/snippets');
  } catch (err) {
    console.error('ERROR: Server not running at ' + BASE_URL);
    process.exit(1);
  }

  // Setup test data
  console.error('Setting up test data...');
  const snippets = await setupTestData();
  console.error(`Created ${snippets.length} test snippets`);

  try {
    // Measure endpoints
    const getAllTime = await measureEndpoint('GET /api/snippets', () =>
      request('GET', '/api/snippets')
    );

    const getOneTime = await measureEndpoint('GET /api/snippets/:id', () =>
      request('GET', `/api/snippets/${snippets[0]?.id || 1}`)
    );

    const searchTime = await measureEndpoint('POST /api/snippets/search', () =>
      request('POST', '/api/snippets/search', {
        query: 'Test',
        tags: [],
        languages: ['javascript']
      })
    );

    const createTime = await measureEndpoint('POST /api/snippets', () =>
      request('POST', '/api/snippets', {
        title: 'Benchmark Snippet',
        language: 'javascript',
        code: 'console.log("benchmark");',
        tags: ['benchmark']
      })
    );

    // Calculate score: lower latency = higher score
    // Base score of 100, penalize for high latency
    const weights = { getAll: 0.3, getOne: 0.2, search: 0.3, create: 0.2 };
    const penalties = {
      getAll: Math.min(getAllTime / 10, 50),  // 100ms target
      getOne: Math.min(getOneTime / 5, 25),    // 50ms target
      search: Math.min(searchTime / 10, 50),   // 100ms target
      create: Math.min(createTime / 10, 50)    // 100ms target
    };
    
    const totalPenalty = 
      penalties.getAll * weights.getAll +
      penalties.getOne * weights.getOne +
      penalties.search * weights.search +
      penalties.create * weights.create;
    
    const score = Math.max(0, 100 - totalPenalty);
    
    // Output JSON for avo
    console.log(JSON.stringify({ f: score }));
    
  } finally {
    // Cleanup
    console.error('Cleaning up test data...');
    await cleanupTestData(snippets);
  }
}

main().catch(err => {
  console.error('Benchmark failed:', err);
  console.log(JSON.stringify({ f: 0 }));
  process.exit(1);
});
