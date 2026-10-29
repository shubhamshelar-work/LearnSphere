// tests/app.test.js
// Smoke test for the Express app. It starts the app on an ephemeral port and
// requests /api/health. No database connection is required for this route.

const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')

const app = require('../app')

function request(server, path) {
  const { port } = server.address()
  return new Promise((resolve, reject) => {
    http
      .get({ host: '127.0.0.1', port, path }, (res) => {
        let body = ''
        res.on('data', (chunk) => {
          body += chunk
        })
        res.on('end', () => resolve({ statusCode: res.statusCode, body }))
      })
      .on('error', reject)
  })
}

test('GET /api/health returns a success response', async () => {
  const server = app.listen(0)
  try {
    const res = await request(server, '/api/health')
    assert.equal(res.statusCode, 200)
    const json = JSON.parse(res.body)
    assert.equal(json.success, true)
    assert.match(json.message, /running/)
  } finally {
    server.close()
  }
})

test('unknown routes return 404 with a JSON error', async () => {
  const server = app.listen(0)
  try {
    const res = await request(server, '/api/does-not-exist')
    assert.equal(res.statusCode, 404)
    const json = JSON.parse(res.body)
    assert.equal(json.success, false)
  } finally {
    server.close()
  }
})
