const express  = require('express')
const http     = require('http')
const cors     = require('cors')
const path     = require('path')
const { Server } = require('socket.io')

const app    = express()
const server = http.createServer(app)
const io     = new Server(server, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json())

// ─── In-memory store ────────────────────────────────────────────────────────
const matches = []           // raw match records
const players = new Map()    // name → { wins, losses, ties, charWins, lastPlayed }

function upsertPlayer(name, char, result) {
  if (!name || name === 'CPU') return
  if (!players.has(name)) {
    players.set(name, { wins: 0, losses: 0, ties: 0, charWins: {}, lastPlayed: '' })
  }
  const p = players.get(name)
  if (result === 'win')       p.wins++
  else if (result === 'loss') p.losses++
  else                        p.ties++
  p.charWins[char] = (p.charWins[char] || 0) + (result === 'win' ? 1 : 0)
  p.lastPlayed = new Date().toISOString()
}

function buildLeaderboard() {
  return Array.from(players.entries())
    .map(([name, s]) => ({
      name,
      wins:       s.wins,
      losses:     s.losses,
      ties:       s.ties,
      favChar:    Object.entries(s.charWins).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
      lastPlayed: s.lastPlayed
    }))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
    .slice(0, 10)
}

// ─── REST Endpoints ──────────────────────────────────────────────────────────
app.get('/api/ping', (_req, res) => res.json({ status: 'ok', matches: matches.length }))

app.get('/api/leaderboard', (_req, res) => res.json(buildLeaderboard()))

app.get('/api/stats', (_req, res) => {
  const charCount = {}
  matches.forEach(m => {
    charCount[m.p1Character] = (charCount[m.p1Character] || 0) + 1
    charCount[m.p2Character] = (charCount[m.p2Character] || 0) + 1
  })
  res.json({
    totalMatches:  matches.length,
    popularChars:  Object.entries(charCount).sort((a, b) => b[1] - a[1]),
    recentMatches: matches.slice(-5).reverse()
  })
})

app.post('/api/match', (req, res) => {
  const { p1Name, p2Name, p1Character, p2Character, winner, p1Health, p2Health, isKO, mode } = req.body
  if (!p1Name) return res.status(400).json({ error: 'p1Name required' })

  const record = {
    p1Name, p2Name: p2Name || 'CPU',
    p1Character, p2Character,
    winner, p1Health, p2Health,
    isKO: !!isKO, mode,
    timestamp: new Date().toISOString()
  }
  matches.push(record)

  if (winner === 'P1') {
    upsertPlayer(p1Name, p1Character, 'win');  upsertPlayer(p2Name, p2Character, 'loss')
  } else if (winner === 'P2') {
    upsertPlayer(p1Name, p1Character, 'loss'); upsertPlayer(p2Name, p2Character, 'win')
  } else {
    upsertPlayer(p1Name, p1Character, 'tie');  upsertPlayer(p2Name, p2Character, 'tie')
  }

  const lb = buildLeaderboard()
  io.emit('leaderboard:update', lb)        // broadcast to all connected clients
  res.json({ success: true, leaderboard: lb })
})

// ─── Socket.io ───────────────────────────────────────────────────────────────
io.on('connection', socket => {
  console.log('Client connected:', socket.id)
  socket.emit('leaderboard:update', buildLeaderboard())  // send current lb on connect

  socket.on('disconnect', () => console.log('Client disconnected:', socket.id))
})

// ─── Production static serving ───────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')))
  app.get('*', (_req, res) =>
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'))
  )
}

const PORT = process.env.PORT || 3001
server.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`))
