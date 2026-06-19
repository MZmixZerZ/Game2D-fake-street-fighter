import React, { useEffect, useState, useRef } from 'react'
import { submitMatch } from '../api'
import { socket } from '../socket'
import { CHARACTERS, CHAR_ABBREV } from '../game/characters'

function LeaderboardTable({ rows }) {
  if (!rows.length) return (
    <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 7, color: '#333', textAlign: 'center', padding: 12 }}>
      NO RECORDS YET
    </div>
  )
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {['#','NAME','W','L','T','FAV'].map(h => (
            <th key={h} style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 6, color: '#555', padding: '4px 6px', textAlign: h === 'NAME' ? 'left' : 'center', borderBottom: '1px solid #1a1a1a' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.name} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
            <td style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 6, color: i === 0 ? '#ffcc00' : i === 1 ? '#aaa' : i === 2 ? '#cd7f32' : '#444', padding: '5px 6px', textAlign: 'center' }}>{i + 1}</td>
            <td style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 6, color: '#ccc', padding: '5px 6px', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</td>
            <td style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 6, color: '#44ff88', padding: '5px 6px', textAlign: 'center' }}>{r.wins}</td>
            <td style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 6, color: '#ff4444', padding: '5px 6px', textAlign: 'center' }}>{r.losses}</td>
            <td style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 6, color: '#888',    padding: '5px 6px', textAlign: 'center' }}>{r.ties}</td>
            <td style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 6, color: CHARACTERS[r.favChar]?.color || '#555', padding: '5px 6px', textAlign: 'center' }}>
              {CHAR_ABBREV[r.favChar] || '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function ResultScreen({ result, onRestart, onMenu }) {
  const [visible, setVisible]         = useState(false)
  const [p1Name, setP1Name]           = useState('')
  const [p2Name, setP2Name]           = useState('')
  const [submitted, setSubmitted]     = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [showLB, setShowLB]           = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(true); setTimeout(() => inputRef.current?.focus(), 100) }, 200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const handler = (lb) => setLeaderboard(lb)
    socket.on('leaderboard:update', handler)
    return () => socket.off('leaderboard:update', handler)
  }, [])

  if (!result) return null

  const { winner, p1, p2, isKO, mode } = result
  const isTie = winner === 'TIE'
  const winnerName  = isTie ? null : (winner === 'P1' ? p1.name : p2.name)
  const winnerColor = winner === 'P1' ? (CHARACTERS[p1.character]?.color || '#00ccff')
    : winner === 'P2' ? (CHARACTERS[p2.character]?.color || '#ff4444') : '#ffcc00'
  const isPvE = mode === 'pve'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!p1Name.trim()) return
    setSubmitting(true)
    await submitMatch({
      p1Name: p1Name.trim(),
      p2Name: isPvE ? 'CPU' : (p2Name.trim() || 'P2'),
      p1Character: p1.character, p2Character: p2.character,
      winner, isKO, p1Health: p1.health, p2Health: p2.health, mode
    })
    setSubmitted(true); setShowLB(true); setSubmitting(false)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(180deg,#040010 0%,#090020 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, overflow: 'auto', padding: '20px 0' }}>
      {visible && (
        <>
          {/* Result header */}
          <div style={{ textAlign: 'center', animation: 'slidein 0.4s ease-out' }}>
            <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 'clamp(9px,1.5vw,15px)', color: '#666', letterSpacing: 6, marginBottom: 10 }}>
              {isKO ? 'K . O .' : 'TIME  OUT'}
            </div>
            {isTie ? (
              <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 'clamp(22px,5vw,50px)', color: '#ffcc00', textShadow: '0 0 28px #ffcc00', letterSpacing: 8 }}>DRAW</div>
            ) : (
              <>
                <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 'clamp(11px,2vw,20px)', color: winnerColor, textShadow: `0 0 18px ${winnerColor}`, marginBottom: 6 }}>{winnerName}</div>
                <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 'clamp(26px,5.5vw,56px)', color: winnerColor, textShadow: `0 0 28px ${winnerColor},0 0 56px ${winnerColor}`, letterSpacing: 6 }}>WINS!</div>
              </>
            )}
          </div>

          {/* Score cards */}
          <div style={{ display: 'flex', gap: 20 }}>
            {[{ data: p1, label: isPvE ? 'YOU' : 'P1' }, { data: p2, label: isPvE ? 'CPU' : 'P2' }].map(({ data, label }) => {
              const col = CHARACTERS[data.character]?.color || '#888'
              return (
                <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: `2px solid ${col}44`, borderRadius: 8, padding: '14px 22px', textAlign: 'center', minWidth: 160, boxShadow: data.result.includes('WIN') ? `0 0 14px ${col}44` : 'none' }}>
                  <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 7, color: col, marginBottom: 5 }}>{label}</div>
                  <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 8, color: '#ccc', marginBottom: 8 }}>{data.name}</div>
                  <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 18, color: data.result.includes('WIN') ? col : '#555', textShadow: data.result.includes('WIN') ? `0 0 10px ${col}` : 'none' }}>{data.result}</div>
                  <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 7, color: '#444', marginTop: 7 }}>HP {Math.round(data.health)}%</div>
                  <div style={{ height: 5, background: '#111', borderRadius: 2, marginTop: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${data.health}%`, background: col, boxShadow: `0 0 5px ${col}`, transition: 'width 1s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Score submission */}
          {!submitted ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '16px 24px', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a', borderRadius: 8, minWidth: 320 }}>
              <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 8, color: '#888', letterSpacing: 2, marginBottom: 4 }}>SAVE SCORE</div>
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 6, color: '#555', marginBottom: 4 }}>{isPvE ? 'YOUR NAME' : 'P1 NAME'}</div>
                  <input ref={inputRef} value={p1Name} onChange={e => setP1Name(e.target.value)} maxLength={16} placeholder="ENTER NAME"
                    style={{ width: '100%', boxSizing: 'border-box', background: '#0d0d0d', border: '1px solid #333', color: '#fff', fontFamily: "'Press Start 2P',cursive", fontSize: 9, padding: '8px 10px', outline: 'none' }} />
                </div>
                {!isPvE && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 6, color: '#555', marginBottom: 4 }}>P2 NAME</div>
                    <input value={p2Name} onChange={e => setP2Name(e.target.value)} maxLength={16} placeholder="ENTER NAME"
                      style={{ width: '100%', boxSizing: 'border-box', background: '#0d0d0d', border: '1px solid #333', color: '#fff', fontFamily: "'Press Start 2P',cursive", fontSize: 9, padding: '8px 10px', outline: 'none' }} />
                  </div>
                )}
              </div>
              <button type="submit" disabled={!p1Name.trim() || submitting}
                style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 9, color: p1Name.trim() && !submitting ? '#000' : '#444', background: p1Name.trim() && !submitting ? '#00ccff' : '#111', border: `1px solid ${p1Name.trim() && !submitting ? '#00ccff' : '#222'}`, padding: '10px 28px', cursor: p1Name.trim() && !submitting ? 'pointer' : 'default', boxShadow: p1Name.trim() && !submitting ? '0 0 14px #00ccff55' : 'none', transition: 'all 0.15s' }}>
                {submitting ? 'SAVING…' : 'SUBMIT →'}
              </button>
            </form>
          ) : (
            <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 8, color: '#44ff88', textShadow: '0 0 10px #44ff88' }}>✓ SCORE SAVED</div>
          )}

          {/* Leaderboard */}
          {submitted && (
            <div style={{ width: 'clamp(300px,50vw,500px)', background: 'rgba(0,0,0,0.6)', border: '1px solid #222', borderRadius: 8, overflow: 'hidden' }}>
              <button onClick={() => setShowLB(v => !v)} style={{ width: '100%', fontFamily: "'Press Start 2P',cursive", fontSize: 8, color: '#ffcc00', background: 'transparent', border: 'none', borderBottom: '1px solid #1a1a1a', padding: '10px 0', cursor: 'pointer', letterSpacing: 2 }}>
                {showLB ? '▲' : '▼'} LEADERBOARD
              </button>
              {showLB && (
                <div style={{ padding: '8px 12px', maxHeight: 240, overflowY: 'auto' }}>
                  <LeaderboardTable rows={leaderboard} />
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: 14, marginTop: 8, animation: 'fadeIn 0.5s 0.4s both' }}>
            <button onClick={onMenu} style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 10, color: '#555', background: 'transparent', border: '2px solid #333', padding: '12px 24px', cursor: 'pointer' }}>
              ← MENU
            </button>
            <button onClick={onRestart} style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 11, color: '#000', background: '#ff00aa', border: '2px solid #ff00aa', padding: '14px 40px', boxShadow: '0 0 20px #ff00aa', letterSpacing: 2, cursor: 'pointer' }}>
              REMATCH!
            </button>
          </div>
        </>
      )}
      <style>{`
        @keyframes slidein { from{transform:translateY(-30px);opacity:0} to{transform:none;opacity:1} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
      `}</style>
    </div>
  )
}
