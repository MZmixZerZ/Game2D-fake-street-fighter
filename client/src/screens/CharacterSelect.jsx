import React, { useState, useEffect, useRef } from 'react'
import { CHARACTERS, GRID_ORDER } from '../game/characters'

function SpritePreview({ src, framesMax, size = 110, colorFilter = null }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.src = src
    let frame = 0, elapsed = 0, animId
    const draw = () => {
      animId = requestAnimationFrame(draw)
      elapsed++
      if (elapsed % 7 === 0) frame = (frame + 1) % framesMax
      if (!img.complete) return
      const fw = img.width / framesMax
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      if (colorFilter) ctx.filter = colorFilter
      ctx.drawImage(img, frame * fw, 0, fw, img.height, 0, 0, canvas.width, canvas.height)
      ctx.restore()
    }
    img.onload = draw
    if (img.complete) draw()
    return () => cancelAnimationFrame(animId)
  }, [src, framesMax, colorFilter])
  return <canvas ref={canvasRef} width={size} height={size} style={{ imageRendering: 'pixelated', display: 'block' }} />
}

function StatBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 6, color: '#666' }}>{label}</span>
        <span style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 6, color: color + '99' }}>{value}</span>
      </div>
      <div style={{ height: 6, background: '#111', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: `linear-gradient(90deg,${color}55,${color})`, boxShadow: `0 0 5px ${color}`, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

export default function CharacterSelect({ mode, onStart, onBack }) {
  const [p1Pick, setP1Pick] = useState('samuraiMack')
  const p2Pick = CHARACTERS[p1Pick].rival

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(180deg,#060014 0%,#0e0028 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, overflow: 'auto', padding: '12px 0' }}>

      <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 'clamp(10px,2vw,16px)', color: '#fff', textShadow: '0 0 15px #ff00aa', letterSpacing: 4 }}>
        SELECT CHARACTER
      </div>
      <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 8, color: '#555' }}>
        {mode === 'pve' ? 'PLAYER — pick your fighter (CPU gets rival)' : 'P1 — pick your fighter (P2 gets rival)'}
      </div>

      {/* VS preview strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: 'rgba(0,0,0,0.4)', border: '1px solid #1a1a1a', borderRadius: 8, padding: '8px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SpritePreview src={CHARACTERS[p1Pick].sprites.idle.imageSrc} framesMax={CHARACTERS[p1Pick].sprites.idle.framesMax} size={52} colorFilter={CHARACTERS[p1Pick].colorFilter} />
          <div>
            <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 7, color: CHARACTERS[p1Pick].color }}>{CHARACTERS[p1Pick].displayName}</div>
            <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 5, color: '#444', marginTop: 2 }}>{mode === 'pve' ? 'YOU' : 'P1'}</div>
          </div>
        </div>
        <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 18, color: '#ff00aa', textShadow: '0 0 16px #ff00aa', padding: '0 10px' }}>VS</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 7, color: CHARACTERS[p2Pick].color }}>{CHARACTERS[p2Pick].displayName}</div>
            <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 5, color: '#444', marginTop: 2 }}>{mode === 'pve' ? 'CPU' : 'P2'}</div>
          </div>
          <SpritePreview src={CHARACTERS[p2Pick].sprites.idle.imageSrc} framesMax={CHARACTERS[p2Pick].sprites.idle.framesMax} size={52} colorFilter={CHARACTERS[p2Pick].colorFilter} />
        </div>
      </div>

      {/* 3×2 Character grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, maxWidth: 860 }}>
        {GRID_ORDER.map(id => {
          const char = CHARACTERS[id]
          const isP1 = p1Pick === id
          const isP2 = p2Pick === id
          return (
            <div key={id} onClick={() => { if (!isP2) setP1Pick(id) }}
              style={{
                background: isP1 ? char.bgGlow : isP2 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
                border: `2px solid ${isP1 ? char.color : isP2 ? '#333' : '#1a1a1a'}`,
                borderRadius: 8, padding: '14px 16px',
                cursor: isP2 ? 'default' : 'pointer',
                boxShadow: isP1 ? `0 0 22px ${char.color}55, inset 0 0 16px ${char.bgGlow}` : 'none',
                transition: 'all 0.18s', position: 'relative',
                opacity: isP2 ? 0.42 : 1, userSelect: 'none'
              }}>

              {/* P1/P2 badge */}
              {(isP1 || isP2) && (
                <div style={{ position: 'absolute', top: 7, right: 9, fontFamily: "'Press Start 2P',cursive", fontSize: 7, color: isP1 ? char.color : '#444' }}>
                  {isP1 ? (mode === 'pve' ? 'YOU' : 'P1') : (mode === 'pve' ? 'CPU' : 'P2')}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <SpritePreview src={char.sprites.idle.imageSrc} framesMax={char.sprites.idle.framesMax} size={88} colorFilter={char.colorFilter} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 9, color: char.color, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{char.displayName}</div>
                  <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 6, color: '#555', marginBottom: 10 }}>{char.title}</div>
                  <StatBar label="SPD" value={char.stats.speed}   color={char.color} />
                  <StatBar label="PWR" value={char.stats.power}   color={char.color} />
                  <StatBar label="DEF" value={char.stats.defense} color={char.color} />
                </div>
              </div>

              {/* Skills */}
              <div style={{ marginTop: 10, borderTop: '1px solid #1a1a1a', paddingTop: 8 }}>
                {char.skills.map(sk => (
                  <div key={sk.name} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ minWidth: 18, height: 18, background: sk.color + '22', border: `1px solid ${sk.color}55`, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Press Start 2P',cursive", fontSize: 6, color: sk.color, flexShrink: 0 }}>
                      {sk.key.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 6, color: '#aaa', marginBottom: 1 }}>
                        {sk.name} <span style={{ color: '#444' }}>({sk.energyCost}E)</span>
                      </div>
                      <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 5, color: '#444', lineHeight: 1.6 }}>{sk.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
        <button onClick={onBack} style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 10, color: '#555', background: 'transparent', border: '2px solid #333', padding: '12px 24px', cursor: 'pointer' }}>
          ← BACK
        </button>
        <button onClick={() => onStart({ mode, p1Character: p1Pick, p2Character: p2Pick })}
          style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 11, color: '#000', background: '#ff00aa', border: '2px solid #ff00aa', padding: '14px 40px', boxShadow: '0 0 20px #ff00aa', letterSpacing: 2, cursor: 'pointer' }}>
          FIGHT! →
        </button>
      </div>
    </div>
  )
}
