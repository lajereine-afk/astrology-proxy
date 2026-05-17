const http = require('http')
const https = require('https')

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  let body = ''
  req.on('data', chunk => body += chunk)
  req.on('end', () => {
    try {
      const parsed = JSON.parse(body)
      const { apiKey, ...payload } = parsed

      const postData = JSON.stringify(payload)
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(postData)
        }
      }

      const apiReq = https.request(options, apiRes => {
        let data = ''
        apiRes.on('data', chunk => data += chunk)
        apiRes.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(data)
        })
      })

      apiReq.on('error', err => {
        res.writeHead(500)
        res.end(JSON.stringify({ error: err.message }))
      })

      apiReq.write(postData)
      apiReq.end()
    } catch (err) {
      res.writeHead(500)
      res.end(JSON.stringify({ error: err.message }))
    }
  })
})

server.listen(process.env.PORT || 3000)
