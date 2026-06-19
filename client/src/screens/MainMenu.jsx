import React, { useState, useEffect, useRef } from 'react'
import { socket } from '../socket'
import { CHARACTERS, CHAR_ABBREV } from '../game/characters'

function LiveLeaderboard({ rows, online }) {
  return (
    <div style={{ width: 260, background: 'rgba(0,0,0,0.72)', border: '1px solid #1a1a1a', borderRadius: 8, overflow: 'hidden', backdropFilter: 'blur(6px)' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 7, color: '#ffcc00', letterSpacing: 2 }}>LEADERBOARD</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: online ? '#44ff88' : '#555', boxShadow: online ? '0 0 6px #44ff88' : 'none', display: 'inline-block' }} />
          <span style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 5, color: online ? '#44ff88' : '#555' }}>LIVE</span>
        </span>
      </div>
      {rows.length === 0 ? (
        <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 6, color: '#333', textAlign: 'center', padding: 14 }}>BE THE FIRST!</div>
      ) : (
        <div style={{ padding: '6px 12px 10px' }}>
          {rows.slice(0, 8).map((r, i) => (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: i < rows.length - 1 ? '1px solid #0d0d0d' : 'none' }}>
              <span style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 6, color: i === 0 ? '#ffcc00' : i === 1 ? '#aaa' : i === 2 ? '#cd7f32' : '#333', minWidth: 14, textAlign: 'right' }}>{i + 1}</span>
              <span style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 6, color: '#bbb', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              <span style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 6, color: '#44ff88' }}>{r.wins}W</span>
              <span style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 5, color: CHARACTERS[r.favChar]?.color || '#444' }}>
                {CHAR_ABBREV[r.favChar] || ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MainMenu({ onStart }) {
  const canvasRef = useRef(null)
  const [hovered, setHovered]   = useState(null)
  const [leaderboard, setLB]    = useState([])
  const [online, setOnline]     = useState(false)
  const [showLB, setShowLB]     = useState(true)

  useEffect(() => {
    const onLB   = (lb) => { setLB(lb); setOnline(true) }
    const onConn  = () => setOnline(true)
    const onDisc  = () => setOnline(false)
    socket.on('leaderboard:update', onLB)
    socket.on('connect',    onConn)
    socket.on('disconnect', onDisc)
    if (socket.connected) setOnline(true)
    return () => {
      socket.off('leaderboard:update', onLB)
      socket.off('connect',    onConn)
      socket.off('disconnect', onDisc)
    }
  }, [])

  // Animated particle background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width  = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const colors = ['#ff00aa','#00ccff','#ff6600','#aa00ff','#9944ff','#22dd88']
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6, vy: -Math.random() * 0.75 - 0.2,
      size:  Math.random() * 2.4 + 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random()
    }))
    let animId
    const draw = () => {
      animId = requestAnimationFrame(draw)
      ctx.fillStyle = 'rgba(0,0,0,0.13)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.alpha += 0.013
        if (p.y < 0 || p.alpha > 1.5) {
          p.x = Math.random() * canvas.width; p.y = canvas.height + 8; p.alpha = 0
        }
        const a = Math.sin(p.alpha * Math.PI)
        ctx.save(); ctx.globalAlpha = Math.max(0, a * 0.65)
        ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 6
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      }
    }
    draw()
    return () => cancelAnimationFrame(animId)
  }, [])

  const buttons = [
    { label: '⚔  PLAYER VS PLAYER', mode: 'pvp', color: '#00ccff' },
    { label: '🤖  PLAYER VS AI',     mode: 'pve', color: '#ff6600' }
  ]

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg,#060010 0%,#12003a 50%,#060010 100%)' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 40 }}>

        {/* Title + buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 'clamp(18px,4vw,42px)', color: '#fff', textShadow: '0 0 20px #ff00aa,0 0 50px #ff00aa', letterSpacing: 6, lineHeight: 1.4 }}>STREET</div>
            <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 'clamp(18px,4vw,42px)', color: '#ff00aa', textShadow: '0 0 20px #fff,0 0 50px #ff00aa', letterSpacing: 6, lineHeight: 1.4 }}>FIGHTER</div>
            <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 'clamp(8px,1.4vw,12px)', color: '#555', letterSpacing: 10, marginTop: 8 }}>2 D  E D I T I O N</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {buttons.map(({ label, mode, color }) => (
              <button key={mode} onClick={() => onStart(mode)}
                onMouseEnter={() => setHovered(mode)} onMouseLeave={() => setHovered(null)}
                style={{
                  fontFamily: "'Press Start 2P',cursive", fontSize: 'clamp(9px,1.3vw,13px)',
                  color: hovered === mode ? '#000' : color,
                  background: hovered === mode ? color : 'transparent',
                  border: `2px solid ${color}`, padding: '16px 44px', minWidth: 300,
                  transition: 'all 0.12s',
                  boxShadow: hovered === mode ? `0 0 24px ${color},0 0 4px ${color}` : `0 0 8px ${color}44`,
                  letterSpacing: 2, cursor: 'pointer'
                }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 40, fontFamily: "'Press Start 2P',cursive", fontSize: 7, color: '#2a2a2a', textAlign: 'center', lineHeight: 2.2 }}>
            <div>P1: A D W  SPACE | Q E (skills)</div>
            <div>P2: ← → ↑  ↓   | , . (skills)</div>
          </div>

          <div style={{ marginTop: 24, fontFamily: "'Press Start 2P',cursive", fontSize: 8, color: '#2a2a2a', animation: 'blink 1.2s step-end infinite' }}>
            INSERT COIN TO PLAY
          </div>
        </div>

        {/* Leaderboard panel */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setShowLB(v => !v)} style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 7, color: '#444', background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: 1 }}>
            {showLB ? '▲ HIDE' : '▼ SHOW'} RANKING
          </button>
          {showLB && <LiveLeaderboard rows={leaderboard} online={online} />}
        </div>
      </div>

      <style>{`@keyframes blink { 0%,100%{opacity:0.8} 50%{opacity:0.15} }`}</style>
    </div>
  )
}
