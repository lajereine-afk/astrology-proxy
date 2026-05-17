const https = require('https')
const http = require('http')

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.writeHead(200)
    res.end(JSON.stringify({ status: 'ready' }))
    return
  }

  let body = ''
  req.on('data', chunk => { body += chunk.toString() })
  req.on('end', () => {
    let parsed
    try { parsed = JSON.parse(body) }
    catch(e) {
      res.writeHead(400)
      res.end(JSON.stringify({ error: 'Invalid JSON' }))
      return
    }

    const { apiKey, model, max_tokens, messages, system } = parsed
    const payload = JSON.stringify({ model, max_tokens, messages, ...(system && { system }) })

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    }

    const apiReq = https.request(options, apiRes => {
      let data = ''
      apiRes.on('data', chunk => { data += chunk })
      apiRes.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(data)
      })
    })

    apiReq.on('error', err => {
      res.writeHead(500)
      res.end(JSON.stringify({ error: err.message }))
    })

    apiReq.write(payload)
    apiReq.end()
  })
}).listen(process.env.PORT || 10000)
