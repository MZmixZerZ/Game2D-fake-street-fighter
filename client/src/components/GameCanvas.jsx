import React, { useRef, useEffect, useState } from 'react'
import { Fighter } from '../game/Fighter'
import { ParticleSystem } from '../game/ParticleSystem'
import { audioManager } from '../game/AudioManager'
import { rectangularCollision } from '../game/utils'
import { CHARACTERS } from '../game/characters'

const CANVAS_W  = 1024
const CANVAS_H  = 576
const GAME_TIME = 60
const FRAME_MS  = 1000 / 60

// ─── Hit registration helper: takeHit + hit-stop + combo + damage number ─────
function landHit(target, damage, x, y, gs, eff) {
  if (target.dead) return false
  target.takeHit(damage)
  gs.hitStop = Math.max(gs.hitStop, 7)
  if (eff.isP1) { gs.p1Combo++; gs.p1ComboTimer = 120 }
  else           { gs.p2Combo++; gs.p2ComboTimer = 120 }
  gs.damageNums.push({
    x: x + (Math.random() - 0.5) * 30, y,
    vy: -3, value: damage, life: 55, maxLife: 55, color: eff.skill.color
  })
  return true
}

// ─── Skill activation ─────────────────────────────────────────────────────────
function doActivateSkill(fighter, target, idx, effects, particles, isP1 = false) {
  if (!fighter.canUseSkill(idx)) { audioManager.playBlocked(); return }
  const skill = fighter.consumeSkill(idx)
  audioManager.playSkill()
  particles.emit(fighter.position.x + 25, fighter.position.y + 75, {
    count: 14, colors: [skill.color, '#fff'], speed: 5, size: 3.5, life: 28
  })
  effects.push({ id: skill.id, attacker: fighter, target, frame: 0, skill, done: false, isP1 })
}

// ─── Skill VFX + damage processing ───────────────────────────────────────────
function processEffect(eff, ctx, gs, particles) {
  eff.frame++
  const { attacker, target, skill } = eff

  switch (eff.id) {

    case 'dashSlash': {
      if (eff.frame <= 15) {
        const dir = target.position.x > attacker.position.x ? 1 : -1
        attacker.position.x = Math.max(0, Math.min(1024 - attacker.width, attacker.position.x + 13 * dir))
        ctx.save(); ctx.globalAlpha = 0.22; ctx.filter = 'hue-rotate(200deg) brightness(3)'
        attacker.draw(ctx); ctx.restore()
      }
      if (eff.frame === 9 && Math.abs(attacker.position.x - target.position.x) < 200) {
        if (landHit(target, skill.damage, target.position.x + 25, target.position.y + 30, gs, eff)) {
          gs.shakeX = 10; gs.shakeY = 7
          audioManager.playHit(2)
          particles.emitHit(target.position.x + 25, target.position.y + 75, true)
        }
      }
      if (eff.frame >= 18) eff.done = true
      break
    }

    case 'bladeStorm': {
      const cx = attacker.position.x + 25, cy = attacker.position.y + 75
      const rot = (eff.frame / 45) * Math.PI * 4
      const r   = 55 + eff.frame * 1.8
      ctx.save()
      ctx.strokeStyle = `rgba(0,210,255,${1 - eff.frame / 45})`
      ctx.lineWidth = 3; ctx.shadowColor = '#00ccff'; ctx.shadowBlur = 12
      for (let i = 0; i < 6; i++) {
        const a = rot + (i / 6) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15)
        ctx.lineTo(cx + Math.cos(a) * r,  cy + Math.sin(a) * r)
        ctx.stroke()
      }
      ctx.restore()
      if (eff.frame % 6 === 0 && eff.frame < 45) particles.emitBladeArcs(cx, cy, eff.frame)
      if ([12, 25, 38].includes(eff.frame) && Math.abs(attacker.position.x - target.position.x) < 230) {
        if (landHit(target, skill.damage, target.position.x + 25, target.position.y + 30, gs, eff)) {
          gs.shakeX = 5; gs.shakeY = 3
          audioManager.playHit(1.5)
          particles.emitHit(target.position.x + 25, target.position.y + 75, true)
        }
      }
      if (eff.frame >= 48) eff.done = true
      break
    }

    case 'smokeBomb': {
      if (eff.frame === 1) {
        particles.emit(attacker.position.x + 25, attacker.position.y + 75, {
          count: 35, colors: ['#330055','#551188','#220033','#000'],
          speed: 7, size: 8, life: 50, spread: Math.PI * 2, gravity: -0.05, upBias: 0
        })
        if (Math.abs(attacker.position.x - target.position.x) < 185) {
          if (landHit(target, skill.damage, target.position.x + 25, target.position.y + 30, gs, eff)) {
            audioManager.playHit(1.8)
            particles.emitHit(target.position.x + 25, target.position.y + 75, true)
            gs.shakeX = 8; gs.shakeY = 5
          }
        }
        const gap = 70
        const nx = target.position.x > attacker.position.x
          ? target.position.x - attacker.width - gap
          : target.position.x + target.width + gap
        attacker.position.x = Math.max(0, Math.min(1024 - attacker.width, nx))
        particles.emitTeleport(attacker.position.x + 25, attacker.position.y + 75)
      }
      if (eff.frame < 40 && eff.frame % 3 === 0) {
        particles.emit(attacker.position.x + 25 + (Math.random() - 0.5) * 80, attacker.position.y + 75, {
          count: 2, colors: ['#330055','#220033'], speed: 1.5, size: 5, life: 30,
          spread: Math.PI * 2, gravity: -0.04, upBias: 0
        })
      }
      if (eff.frame >= 40) eff.done = true
      break
    }

    case 'voidSlash': {
      const cx = attacker.position.x + 25, cy = attacker.position.y + 75
      ctx.save()
      const al = Math.max(0, 1 - eff.frame / 44)
      ctx.strokeStyle = `rgba(180,80,255,${al})`
      ctx.lineWidth = 2.5; ctx.shadowColor = '#aa44ff'; ctx.shadowBlur = 14
      for (let i = 0; i < 6; i++) {
        const a = eff.frame * 0.22 + i * Math.PI / 3
        const len = 50 + 30 * Math.sin(eff.frame * 0.3 + i)
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10)
        ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len)
        ctx.stroke()
      }
      ctx.restore()
      if ([7, 14, 21, 28, 35, 42].includes(eff.frame) && Math.abs(attacker.position.x - target.position.x) < 210) {
        if (landHit(target, skill.damage, target.position.x + 25, target.position.y + 30, gs, eff)) {
          gs.shakeX = 3; gs.shakeY = 2
          audioManager.playHit(1.2)
          particles.emitHit(target.position.x + 25, target.position.y + 75, false)
        }
      }
      if (eff.frame >= 44) eff.done = true
      break
    }

    case 'shadowStep': {
      if (eff.frame === 1) {
        particles.emitTeleport(attacker.position.x + 25, attacker.position.y + 75)
        const gap = 68
        const nx = target.position.x > attacker.position.x
          ? target.position.x - attacker.width - gap
          : target.position.x + target.width + gap
        attacker.position.x = Math.max(0, Math.min(1024 - attacker.width, nx))
        particles.emitTeleport(attacker.position.x + 25, attacker.position.y + 75)
        if (landHit(target, skill.damage, target.position.x + 25, target.position.y + 30, gs, eff)) {
          gs.shakeX = 9; gs.shakeY = 6
          audioManager.playHit(1.8)
          particles.emitHit(target.position.x + 25, target.position.y + 75, true)
        }
      }
      if (eff.frame >= 16) eff.done = true
      break
    }

    case 'darkEruption': {
      const cx = attacker.position.x + 25, gY = CANVAS_H - 96
      const prog = eff.frame / 40
      ctx.save()
      ctx.strokeStyle = `rgba(160,0,255,${(1 - prog) * 0.92})`
      ctx.lineWidth = Math.max(0.5, 3.5 - prog * 2); ctx.shadowColor = '#9900ff'; ctx.shadowBlur = 18
      ctx.beginPath()
      ctx.ellipse(cx, gY - 8, 15 + 290 * prog, Math.max(1, 8 + 28 * prog * (1.2 - prog * 0.5)), 0, 0, Math.PI * 2)
      ctx.stroke()
      if (eff.frame > 6) {
        ctx.globalAlpha = (1 - prog) * 0.45; ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(cx, gY - 8, 8 + 200 * prog, Math.max(1, 5 + 18 * prog), 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()
      if (eff.frame % 5 === 0 && eff.frame < 32) {
        particles.emit(cx + 290 * prog * (Math.random() * 2 - 1), gY - 5, {
          count: 2, colors: ['#9900ff','#6600cc'], speed: 3, size: 3, life: 22,
          spread: Math.PI, gravity: -0.25, upBias: 0
        })
      }
      if (eff.frame === 22 && Math.abs(attacker.position.x - target.position.x) < 330) {
        if (landHit(target, skill.damage, target.position.x + 25, target.position.y + 30, gs, eff)) {
          target.velocity.y = -16; gs.shakeX = 14; gs.shakeY = 12
          audioManager.playHit(3)
          particles.emitDarkExplosion(target.position.x + 25, target.position.y + 75)
        }
      }
      if (eff.frame >= 42) eff.done = true
      break
    }

    case 'flameDash': {
      if (eff.frame <= 18) {
        const dir = target.position.x > attacker.position.x ? 1 : -1
        attacker.position.x = Math.max(0, Math.min(1024 - attacker.width, attacker.position.x + 14 * dir))
        if (eff.frame % 2 === 0) {
          particles.emit(attacker.position.x + 25 - dir * 30, attacker.position.y + 75, {
            count: 5, colors: ['#ff4400','#ff8800','#ffcc00'],
            speed: 3, size: 4, life: 22, spread: 1.2, gravity: -0.1, upBias: 1.5
          })
        }
        ctx.save(); ctx.globalAlpha = 0.2; ctx.filter = 'hue-rotate(20deg) brightness(2) saturate(3)'
        attacker.draw(ctx); ctx.restore()
      }
      if (eff.frame === 10 && Math.abs(attacker.position.x - target.position.x) < 200) {
        if (landHit(target, skill.damage, target.position.x + 25, target.position.y + 30, gs, eff)) {
          gs.shakeX = 11; gs.shakeY = 8
          audioManager.playHit(2.2)
          particles.emitHit(target.position.x + 25, target.position.y + 75, true)
        }
      }
      if (eff.frame >= 22) eff.done = true
      break
    }

    case 'infernoBlast': {
      const cx = attacker.position.x + 25, gY = CANVAS_H - 96
      const prog = eff.frame / 44
      ctx.save()
      ctx.strokeStyle = `rgba(255,${Math.floor(120 * (1 - prog))},0,${(1 - prog) * 0.95})`
      ctx.lineWidth = Math.max(0.5, 4 - prog * 2.5); ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 22
      ctx.beginPath()
      ctx.ellipse(cx, gY - 8, 20 + 360 * prog, Math.max(1, 10 + 35 * prog * (1.3 - prog * 0.5)), 0, 0, Math.PI * 2)
      ctx.stroke()
      if (eff.frame > 5) {
        ctx.globalAlpha = (1 - prog) * 0.4; ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(cx, gY - 8, 10 + 260 * prog, Math.max(1, 6 + 22 * prog), 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()
      if (eff.frame % 4 === 0 && eff.frame < 36) {
        const off = 360 * prog * (Math.random() * 2 - 1)
        particles.emit(cx + off, gY - 5, {
          count: 3, colors: ['#ff4400','#ff8800','#ffcc00'],
          speed: 4, size: 4, life: 28, spread: Math.PI, gravity: -0.2, upBias: 0.5
        })
      }
      if (eff.frame === 24 && Math.abs(attacker.position.x - target.position.x) < 380) {
        if (landHit(target, skill.damage, target.position.x + 25, target.position.y + 30, gs, eff)) {
          target.velocity.y = -19; gs.shakeX = 16; gs.shakeY = 14
          audioManager.playHit(3.5)
          particles.emitHit(target.position.x + 25, target.position.y + 75, true)
          particles.emit(target.position.x + 25, target.position.y + 75, {
            count: 20, colors: ['#ff4400','#ff8800','#ffcc00'],
            speed: 8, size: 5, life: 38, spread: Math.PI * 2, upBias: 3
          })
        }
      }
      if (eff.frame >= 46) eff.done = true
      break
    }

    case 'arrowBarrage': {
      if (!eff.arrows) {
        const dir = target.position.x > attacker.position.x ? 1 : -1
        eff.dir = dir
        eff.arrows = Array.from({ length: 6 }, (_, i) => ({
          x: attacker.position.x + 25 + dir * 30,
          y: attacker.position.y + 60 + (Math.random() - 0.5) * 40,
          vx: dir * (18 + Math.random() * 6),
          vy: (Math.random() - 0.5) * 3,
          delay: i * 8,
          hit: false, done: false
        }))
      }
      ctx.save()
      ctx.lineWidth = 2.5; ctx.shadowColor = '#22dd88'; ctx.shadowBlur = 10
      for (const a of eff.arrows) {
        if (eff.frame < a.delay || a.done) continue
        a.x += a.vx; a.y += a.vy
        if (a.x < -30 || a.x > CANVAS_W + 30) { a.done = true; continue }
        if (!a.hit &&
            Math.abs(a.x - (target.position.x + 25)) < 75 &&
            Math.abs(a.y - (target.position.y + 75)) < 110) {
          a.hit = true; a.done = true
          if (landHit(target, skill.damage, a.x, a.y - 20, gs, eff)) {
            gs.shakeX = 3; gs.shakeY = 2
            audioManager.playHit(0.9)
            particles.emit(a.x, a.y, {
              count: 5, colors: ['#22dd88','#88ffcc','#fff'], speed: 4, size: 2.5, life: 16
            })
          }
        }
        const al = Math.min(1, (eff.frame - a.delay) / 5)
        ctx.globalAlpha = al
        ctx.strokeStyle = `hsl(${148 + Math.random() * 20},90%,60%)`
        ctx.beginPath()
        ctx.moveTo(a.x - a.vx * 2.2, a.y - a.vy * 2.2)
        ctx.lineTo(a.x + a.vx * 0.4, a.y + a.vy * 0.4)
        ctx.stroke()
        ctx.fillStyle = '#88ffcc'; ctx.globalAlpha = al * 0.9
        ctx.beginPath(); ctx.arc(a.x + a.vx * 0.4, a.y, 3, 0, Math.PI * 2); ctx.fill()
      }
      ctx.restore()
      if (eff.frame > 55 + 6 * 8) eff.done = true
      break
    }

    case 'flipTrap': {
      if (eff.frame === 1) {
        particles.emitTeleport(attacker.position.x + 25, attacker.position.y + 75)
        const dir = target.position.x > attacker.position.x ? 1 : -1
        const nx = target.position.x + dir * (attacker.width + 65)
        attacker.position.x = Math.max(0, Math.min(CANVAS_W - attacker.width, nx))
        eff.trapX = attacker.position.x + 25
        particles.emitTeleport(attacker.position.x + 25, attacker.position.y + 75)
        // audioManager.playSkill() already called by doActivateSkill — no second call
      }
      if (eff.frame < 28) {
        const gY = CANVAS_H - 96
        const prog = eff.frame / 28
        ctx.save()
        ctx.strokeStyle = `rgba(34,221,136,${0.5 + prog * 0.5})`
        ctx.lineWidth = 2; ctx.shadowColor = '#22dd88'; ctx.shadowBlur = 12
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + eff.frame * 0.12
          ctx.beginPath()
          ctx.moveTo(eff.trapX, gY - 5)
          ctx.lineTo(eff.trapX + Math.cos(a) * (10 + 18 * prog), gY - 5 + Math.sin(a) * (8 + 12 * prog))
          ctx.stroke()
        }
        ctx.beginPath(); ctx.arc(eff.trapX, gY - 5, 5 + 12 * prog, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(136,255,204,${prog})`; ctx.stroke()
        ctx.restore()
      }
      if (eff.frame === 26) {
        const gY = CANVAS_H - 96
        if (Math.abs(eff.trapX - (target.position.x + 25)) < 130) {
          if (landHit(target, skill.damage, eff.trapX, gY - 40, gs, eff)) {
            target.velocity.y = -18; gs.shakeX = 12; gs.shakeY = 10
            audioManager.playHit(2.5)
            particles.emit(eff.trapX, gY, {
              count: 22, colors: ['#22dd88','#88ffcc','#ffffff'],
              speed: 7, size: 5, life: 38, spread: Math.PI * 2, gravity: -0.08, upBias: 3
            })
          }
        } else {
          particles.emit(eff.trapX, gY, {
            count: 10, colors: ['#22dd88','#fff'], speed: 4, size: 3, life: 24, spread: Math.PI * 2, upBias: 2
          })
        }
      }
      if (eff.frame >= 42) eff.done = true
      break
    }

    case 'arcaneSurge': {
      if (!eff.orbs) {
        const cx = attacker.position.x + 25, cy = attacker.position.y + 75
        eff.orbs = Array.from({ length: 4 }, (_, i) => ({
          x: cx, y: cy,
          angle: (i / 4) * Math.PI * 2,
          speed: 9 + i * 1.5,
          delay: i * 10,
          hit: false, done: false
        }))
      }
      const cx = attacker.position.x + 25, cy = attacker.position.y + 75
      ctx.save()
      for (const orb of eff.orbs) {
        if (eff.frame < orb.delay || orb.done) continue
        const age = eff.frame - orb.delay
        if (age < 14) {
          orb.angle += 0.42
          orb.x = cx + Math.cos(orb.angle) * (age * 4.5)
          orb.y = cy + Math.sin(orb.angle) * (age * 3.5)
        } else {
          const tx = target.position.x + 25, ty = target.position.y + 75
          const dx = tx - orb.x, dy = ty - orb.y
          const len = Math.sqrt(dx * dx + dy * dy) || 1
          orb.x += (dx / len) * orb.speed; orb.y += (dy / len) * orb.speed
          if (orb.x < -20 || orb.x > CANVAS_W + 20) orb.done = true
        }
        if (!orb.hit &&
            Math.abs(orb.x - (target.position.x + 25)) < 65 &&
            Math.abs(orb.y - (target.position.y + 75)) < 95) {
          orb.hit = true; orb.done = true
          if (landHit(target, skill.damage, orb.x, orb.y - 20, gs, eff)) {
            gs.shakeX = 5; gs.shakeY = 3
            audioManager.playHit(1.3)
            particles.emit(orb.x, orb.y, {
              count: 9, colors: ['#4488ff','#aaccff','#fff'],
              speed: 4, size: 3, life: 22, spread: Math.PI * 2, upBias: 0
            })
          }
        }
        if (!orb.done) {
          const al = Math.min(1, age / 6)
          ctx.globalAlpha = al
          ctx.fillStyle = '#4488ff'; ctx.shadowColor = '#88aaff'; ctx.shadowBlur = 18
          ctx.beginPath(); ctx.arc(orb.x, orb.y, 7, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = '#ccddff'; ctx.shadowBlur = 5
          ctx.beginPath(); ctx.arc(orb.x - 2, orb.y - 2, 2.5, 0, Math.PI * 2); ctx.fill()
        }
      }
      ctx.restore()
      if (eff.frame > 65 && eff.orbs.every(o => o.done)) eff.done = true
      if (eff.frame > 80) eff.done = true
      break
    }

    case 'gravityCollapse': {
      const cx = attacker.position.x + 25
      const gY = CANVAS_H - 96
      if (eff.frame <= 26 && !target.dead) {
        const pullStr = eff.frame * 0.28
        const dir = cx > (target.position.x + 25) ? 1 : -1
        target.position.x = Math.max(0, Math.min(CANVAS_W - target.width, target.position.x + dir * pullStr))
      }
      ctx.save()
      if (eff.frame <= 26) {
        const prog = eff.frame / 26
        for (let r = 1; r <= 4; r++) {
          const radius = 30 + r * 22 + Math.sin(eff.frame * 0.4 + r) * 6
          ctx.strokeStyle = `rgba(68,136,255,${(0.7 - r * 0.1) * (1 - prog * 0.4)})`
          ctx.lineWidth = 3 - r * 0.4; ctx.shadowColor = '#4488ff'; ctx.shadowBlur = 14
          ctx.beginPath(); ctx.arc(cx, gY - 12, radius, 0, Math.PI * 2); ctx.stroke()
        }
        if (eff.frame % 3 === 0) {
          const angle = Math.random() * Math.PI * 2, dist = 60 + Math.random() * 80
          particles.emit(cx + Math.cos(angle) * dist, gY - 12 + Math.sin(angle) * 20, {
            count: 2, colors: ['#4488ff','#2244cc'],
            speed: 2, size: 3, life: 18, spread: Math.PI * 2, gravity: 0, upBias: 0
          })
        }
      }
      if (eff.frame === 28) {
        ctx.globalAlpha = 0.45; ctx.fillStyle = '#4488ff'
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
        if (Math.abs(cx - (target.position.x + 25)) < 300) {
          if (landHit(target, skill.damage, target.position.x + 25, target.position.y + 30, gs, eff)) {
            target.velocity.y = -24; gs.shakeX = 20; gs.shakeY = 18
            audioManager.playHit(4)
            particles.emit(cx, gY - 12, {
              count: 35, colors: ['#4488ff','#88aaff','#ffffff','#2244cc'],
              speed: 12, size: 6, life: 48, spread: Math.PI * 2, gravity: 0.25, upBias: 2.5
            })
            particles.emit(target.position.x + 25, target.position.y + 75, {
              count: 15, colors: ['#4488ff','#fff'], speed: 6, size: 4, life: 28
            })
          }
        } else {
          particles.emit(cx, gY - 12, {
            count: 18, colors: ['#4488ff','#88aaff','#fff'],
            speed: 8, size: 5, life: 36, spread: Math.PI * 2, gravity: 0.2, upBias: 2
          })
        }
      }
      if (eff.frame > 28 && eff.frame <= 52) {
        const fade = 1 - (eff.frame - 28) / 24
        ctx.strokeStyle = `rgba(68,136,255,${fade * 0.5})`
        ctx.lineWidth = 2; ctx.shadowColor = '#4488ff'; ctx.shadowBlur = 8
        ctx.beginPath(); ctx.arc(cx, gY - 12, 40 + (eff.frame - 28) * 6, 0, Math.PI * 2); ctx.stroke()
      }
      ctx.restore()
      if (eff.frame >= 54) eff.done = true
      break
    }

    default: eff.done = true
  }
}

// ─── AI ── health-reactive aggression, smarter spacing & skill usage ──────────
function runAI(ai, player, frame, effects, particles) {
  if (ai.dead || player.dead) return
  const dx = player.position.x - ai.position.x
  const dist = Math.abs(dx)
  const onGround = ai.position.y >= CANVAS_H - 96 - ai.height - 2

  const healthAdv = (player.health - ai.health) / 100
  const aggression = Math.max(0.3, Math.min(1.0, 0.65 + healthAdv * 0.5))
  const attackInterval = Math.round(55 - aggression * 22)

  ai.velocity.x = 0
  if (!ai.isAttacking && ai.currentSprite !== 'takeHit') {
    const closeDist = aggression > 0.75 ? 140 : 165
    if      (dist > closeDist + 65) { ai.velocity.x = dx > 0 ? 5 : -5;   ai.switchSprite('run') }
    else if (dist > closeDist)      { ai.velocity.x = dx > 0 ? 2.5 : -2.5; ai.switchSprite('run') }
    else                            { ai.switchSprite('idle') }
  }
  if (ai.velocity.y < 0) ai.switchSprite('jump')
  else if (ai.velocity.y > 0) ai.switchSprite('fall')

  if (dist < 200 && dist > 40 && frame % attackInterval === 0 && Math.random() < 0.72 + aggression * 0.18) {
    ai.attack()
  }

  const cornered = ai.position.x < 80 || ai.position.x > CANVAS_W - 80 - ai.width
  if (onGround && frame % 95 === 0 && Math.random() < 0.22 + (cornered ? 0.30 : 0) + aggression * 0.08) {
    ai.velocity.y = -20
  }

  if (frame % 85 === 0 && dist < 280 && Math.random() < 0.50 + aggression * 0.30) {
    doActivateSkill(ai, player, 0, effects, particles, false)
  }
  if (frame % 150 === 0 && Math.random() < 0.38 + aggression * 0.20) {
    doActivateSkill(ai, player, 1, effects, particles, false)
  }
}

// ─── HUD sub-components ───────────────────────────────────────────────────────
function HealthBar({ value, color, rtl }) {
  const low = value < 25
  return (
    <div style={{ height: 22, background: '#0d0000', border: `2px solid ${color}55`, borderRadius: 2, overflow: 'hidden', direction: rtl ? 'rtl' : 'ltr' }}>
      <div style={{
        height: '100%', width: `${Math.max(0, value)}%`,
        background: low
          ? 'linear-gradient(90deg,#cc000066,#ff2200)'
          : `linear-gradient(90deg,${color}66,${color})`,
        boxShadow: `0 0 10px ${low ? '#ff2200' : color}`,
        transition: 'width 0.15s ease-out',
        animation: low ? 'hpPulse 0.55s ease-in-out infinite' : 'none'
      }} />
    </div>
  )
}

function EnergyBar({ value, rtl }) {
  return (
    <div style={{ height: 7, background: '#000015', border: '1px solid #0055aa44', borderRadius: 1, overflow: 'hidden', marginTop: 4, direction: rtl ? 'rtl' : 'ltr' }}>
      <div style={{ height: '100%', width: `${Math.max(0, value)}%`, background: 'linear-gradient(90deg,#0044cc,#00aaff)', boxShadow: '0 0 6px #00aaff88', transition: 'width 0.1s ease-out' }} />
    </div>
  )
}

function SkillSlot({ skill, cdRatio, energy, side }) {
  const avail = energy >= skill.energyCost && cdRatio === 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexDirection: side === 'right' ? 'row-reverse' : 'row' }}>
      <div style={{ position: 'relative', width: 32, height: 32, background: avail ? skill.color + '33' : '#0a0a0a', border: `2px solid ${avail ? skill.color : '#2a2a2a'}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: avail ? `0 0 10px ${skill.color}88` : 'none', overflow: 'hidden', flexShrink: 0, transition: 'all 0.15s' }}>
        {cdRatio > 0 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${cdRatio * 100}%`, background: 'rgba(0,0,0,0.78)' }} />}
        <span style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 8, color: avail ? skill.color : '#333', position: 'relative', zIndex: 1 }}>{skill.key.toUpperCase()}</span>
      </div>
      <div>
        <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 6, color: avail ? '#bbb' : '#444', lineHeight: 1.4 }}>{skill.name}</div>
        <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 5, color: avail ? skill.color + 'aa' : '#2a2a2a' }}>{skill.energyCost}E</div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GameCanvas({ config, onGameEnd }) {
  const canvasRef  = useRef(null)
  const [scale, setScale]     = useState(1)
  const [soundOn, setSoundOn] = useState(true)
  const [hudState, setHudState] = useState({
    p1Health: 100, p2Health: 100, p1Energy: 0, p2Energy: 0,
    timeLeft: GAME_TIME, p1Cooldowns: [0, 0], p2Cooldowns: [0, 0],
    phase: 'countdown', countdown: 3, fps: 0
  })

  const playerRef    = useRef(null)
  const enemyRef     = useRef(null)
  const particlesRef = useRef(null)
  const effectsRef   = useRef([])
  const keysRef      = useRef({})
  const animRef      = useRef(null)
  const timerRef     = useRef(null)
  const bgRef        = useRef(null)
  const shopRef      = useRef({ img: null, frame: 0, elapsed: 0, framesMax: 6 })
  const gsRef        = useRef({
    phase: 'countdown', timeLeft: GAME_TIME, frameCount: 0,
    shakeX: 0, shakeY: 0, p1Hit: false, p2Hit: false, ended: false,
    lastFrameTime: 0, fpsAccum: 0, fpsFrames: 0, fpsDisplay: 0,
    hitStop: 0, damageNums: [],
    p1Combo: 0, p2Combo: 0, p1ComboTimer: 0, p2ComboTimer: 0
  })
  const onEndRef   = useRef(onGameEnd)
  const configRef  = useRef(config)

  useEffect(() => { onEndRef.current = onGameEnd }, [onGameEnd])

  // Responsive canvas scale
  useEffect(() => {
    const upd = () => setScale(Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H))
    upd(); window.addEventListener('resize', upd)
    return () => window.removeEventListener('resize', upd)
  }, [])

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const cfg    = configRef.current
    const gs     = gsRef.current
    Object.assign(gs, {
      phase: 'countdown', timeLeft: GAME_TIME, frameCount: 0,
      shakeX: 0, shakeY: 0, p1Hit: false, p2Hit: false, ended: false,
      lastFrameTime: 0, fpsAccum: 0, fpsFrames: 0, fpsDisplay: 0,
      hitStop: 0, damageNums: [],
      p1Combo: 0, p2Combo: 0, p1ComboTimer: 0, p2ComboTimer: 0
    })
    effectsRef.current   = []
    particlesRef.current = new ParticleSystem()

    bgRef.current = new Image(); bgRef.current.src = '/img/background.png'
    const shop = shopRef.current
    shop.img = new Image(); shop.img.src = '/img/shop.png'; shop.frame = 0; shop.elapsed = 0

    const p1d = CHARACTERS[cfg.p1Character]
    const p2d = CHARACTERS[cfg.p2Character]

    playerRef.current = new Fighter({
      position: { x: p1d.spawnX, y: 100 },
      imageSrc: p1d.sprites.idle.imageSrc, framesMax: p1d.sprites.idle.framesMax,
      scale: p1d.scale, offset: p1d.offset, sprites: p1d.sprites,
      attackBox: p1d.attackBox, name: p1d.name, skills: p1d.skills, colorFilter: p1d.colorFilter
    })
    enemyRef.current = new Fighter({
      position: { x: p2d.spawnX, y: 100 },
      imageSrc: p2d.sprites.idle.imageSrc, framesMax: p2d.sprites.idle.framesMax,
      scale: p2d.scale, offset: p2d.offset, sprites: p2d.sprites,
      attackBox: p2d.attackBox, name: p2d.name, skills: p2d.skills, colorFilter: p2d.colorFilter
    })

    const endGame = () => {
      if (gs.ended) return
      gs.ended = true; gs.phase = 'over'
      clearTimeout(timerRef.current); audioManager.stopBGM()
      const p = playerRef.current, e = enemyRef.current
      let winner, p1Res, p2Res
      if      (p.dead && e.dead)         { winner = 'TIE'; p1Res = 'DRAW'; p2Res = 'DRAW' }
      else if (p.dead)                   { winner = 'P2';  p1Res = 'K.O.'; p2Res = 'WIN' }
      else if (e.dead)                   { winner = 'P1';  p1Res = 'WIN';  p2Res = 'K.O.' }
      else if (p.health > e.health)      { winner = 'P1';  p1Res = 'WIN';  p2Res = 'LOSE' }
      else if (e.health > p.health)      { winner = 'P2';  p1Res = 'LOSE'; p2Res = 'WIN' }
      else                               { winner = 'TIE'; p1Res = 'DRAW'; p2Res = 'DRAW' }
      if (p.dead || e.dead) audioManager.playDeath()
      setHudState(prev => ({ ...prev, phase: 'over' }))
      setTimeout(() => {
        onEndRef.current({
          winner, isKO: p.dead || e.dead, mode: cfg.mode,
          p1: { name: p1d.name, character: cfg.p1Character, health: p.health, result: p1Res },
          p2: { name: p2d.name, character: cfg.p2Character, health: e.health, result: p2Res }
        })
      }, 2600)
    }

    const startTimer = () => {
      const tick = () => {
        gs.timeLeft--
        if (gs.timeLeft <= 0 && gs.phase === 'fighting') endGame()
        else if (gs.phase === 'fighting') timerRef.current = setTimeout(tick, 1000)
      }
      timerRef.current = setTimeout(tick, 1000)
    }

    const groundY = CANVAS_H - 96 - 150 - 2
    const onKeyDown = (e) => {
      keysRef.current[e.key] = true; keysRef.current[e.key.toLowerCase()] = true
      if (gs.phase !== 'fighting') return
      const player = playerRef.current, enemy = enemyRef.current
      if (!player.dead) {
        if (e.key === 'd') player.lastKey = 'd'
        if (e.key === 'a') player.lastKey = 'a'
        if (e.key === 'w' && player.position.y >= groundY) { player.velocity.y = -20; audioManager.playJump() }
        if (e.key === ' ') { player.attack(); audioManager.playAttack() }
        if (e.key === 'q') doActivateSkill(player, enemy, 0, effectsRef.current, particlesRef.current, true)
        if (e.key === 'e') doActivateSkill(player, enemy, 1, effectsRef.current, particlesRef.current, true)
      }
      if (!enemy.dead && cfg.mode !== 'pve') {
        if (e.key === 'ArrowRight') enemy.lastKey = 'ArrowRight'
        if (e.key === 'ArrowLeft')  enemy.lastKey = 'ArrowLeft'
        if (e.key === 'ArrowUp' && enemy.position.y >= groundY) { enemy.velocity.y = -20; audioManager.playJump() }
        if (e.key === 'ArrowDown') { enemy.attack(); audioManager.playAttack() }
        if (e.key === ',') doActivateSkill(enemy, player, 0, effectsRef.current, particlesRef.current, false)
        if (e.key === '.') doActivateSkill(enemy, player, 1, effectsRef.current, particlesRef.current, false)
      }
    }
    const onKeyUp = (e) => { keysRef.current[e.key] = false; keysRef.current[e.key.toLowerCase()] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)

    audioManager.resume()
    let cdVal = 3
    setHudState(prev => ({
      ...prev, phase: 'countdown', countdown: cdVal,
      timeLeft: GAME_TIME, p1Health: 100, p2Health: 100,
      p1Energy: 0, p2Energy: 0, p1Cooldowns: [0, 0], p2Cooldowns: [0, 0]
    }))

    const countInterval = setInterval(() => {
      cdVal--
      if (cdVal > 0) {
        audioManager.playCountdown()
        setHudState(prev => ({ ...prev, countdown: cdVal }))
      } else {
        clearInterval(countInterval)
        audioManager.playFight(); gs.phase = 'fighting'
        setHudState(prev => ({ ...prev, phase: 'fighting', countdown: 0 }))
        audioManager.startBGM(); startTimer()
      }
    }, 1000)

    // ── RAF loop with 60 FPS lock ─────────────────────────────────────────────
    const loop = (timestamp) => {
      animRef.current = requestAnimationFrame(loop)

      const elapsed = timestamp - gs.lastFrameTime
      if (elapsed < FRAME_MS - 0.5) return
      gs.lastFrameTime = timestamp - (elapsed % FRAME_MS)

      gs.fpsAccum += elapsed; gs.fpsFrames++
      if (gs.fpsFrames >= 30) {
        gs.fpsDisplay = Math.round(1000 / (gs.fpsAccum / gs.fpsFrames))
        gs.fpsAccum = 0; gs.fpsFrames = 0
      }

      gs.frameCount++
      const player = playerRef.current, enemy = enemyRef.current
      if (!player || !enemy) return

      // Hit stop: freeze fighters for N frames after a heavy hit
      const frozen = gs.hitStop > 0
      if (gs.hitStop > 0) gs.hitStop--

      // Combo timer decay
      if (gs.p1ComboTimer > 0) gs.p1ComboTimer--; else gs.p1Combo = 0
      if (gs.p2ComboTimer > 0) gs.p2ComboTimer--; else gs.p2Combo = 0

      // Screen shake
      let sx = 0, sy = 0
      if (gs.shakeX > 0.5) {
        sx = (Math.random() - 0.5) * gs.shakeX * 2
        sy = (Math.random() - 0.5) * gs.shakeY * 2
        gs.shakeX *= 0.72; gs.shakeY *= 0.72
      } else { gs.shakeX = 0; gs.shakeY = 0 }

      ctx.save(); ctx.translate(sx, sy)
      ctx.fillStyle = '#000'; ctx.fillRect(-20, -20, CANVAS_W + 40, CANVAS_H + 40)

      if (bgRef.current?.complete) ctx.drawImage(bgRef.current, 0, 0, CANVAS_W, CANVAS_H)

      // Animated shop
      const s = shopRef.current
      if (s.img?.complete) {
        s.elapsed++; if (s.elapsed % 5 === 0) s.frame = (s.frame + 1) % s.framesMax
        const fw = s.img.width / s.framesMax
        ctx.drawImage(s.img, s.frame * fw, 0, fw, s.img.height, 600, 128, fw * 2.75, s.img.height * 2.75)
      }

      // Subtle brightness overlay
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      // Vignette — dramatic darkened edges
      const vg = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.3, CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.9)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(0,0,0,0.52)')
      ctx.fillStyle = vg; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      if (gs.phase === 'fighting' || gs.phase === 'over') {
        if (!frozen) { player.velocity.x = 0; enemy.velocity.x = 0 }

        if (gs.phase === 'fighting' && !player.dead && !frozen) {
          const k = keysRef.current
          if      (k['a'] && player.lastKey === 'a') { player.velocity.x = -5; player.switchSprite('run') }
          else if (k['d'] && player.lastKey === 'd') { player.velocity.x =  5; player.switchSprite('run') }
          else player.switchSprite('idle')
          if (player.velocity.y < 0) player.switchSprite('jump')
          else if (player.velocity.y > 0) player.switchSprite('fall')
        }

        if (gs.phase === 'fighting' && !enemy.dead && !frozen) {
          if (cfg.mode === 'pve') {
            runAI(enemy, player, gs.frameCount, effectsRef.current, particlesRef.current)
          } else {
            const k = keysRef.current
            if      (k['ArrowLeft']  && enemy.lastKey === 'ArrowLeft')  { enemy.velocity.x = -5; enemy.switchSprite('run') }
            else if (k['ArrowRight'] && enemy.lastKey === 'ArrowRight') { enemy.velocity.x =  5; enemy.switchSprite('run') }
            else enemy.switchSprite('idle')
            if (enemy.velocity.y < 0) enemy.switchSprite('jump')
            else if (enemy.velocity.y > 0) enemy.switchSprite('fall')
          }
        }

        player.update(ctx, CANVAS_H, frozen)
        enemy.update(ctx, CANVAS_H, frozen)

        effectsRef.current = effectsRef.current.filter(eff => {
          processEffect(eff, ctx, gs, particlesRef.current); return !eff.done
        })
        particlesRef.current.update(ctx)

        // Floating damage numbers
        gs.damageNums = gs.damageNums.filter(d => d.life > 0)
        for (const d of gs.damageNums) {
          d.y += d.vy; d.vy *= 0.88; d.life--
          const alpha = d.life / d.maxLife
          ctx.save()
          ctx.globalAlpha = alpha
          ctx.font = `900 14px 'Arial Black', Arial, sans-serif`
          ctx.textAlign = 'center'
          ctx.lineWidth = 4
          ctx.strokeStyle = 'rgba(0,0,0,0.9)'
          ctx.strokeText(`-${d.value}`, d.x, d.y)
          ctx.fillStyle = d.color
          ctx.shadowColor = d.color; ctx.shadowBlur = 8
          ctx.fillText(`-${d.value}`, d.x, d.y)
          ctx.restore()
        }

        // Combo counter (canvas-rendered, in world space)
        if (gs.p1Combo >= 2) {
          ctx.save()
          ctx.globalAlpha = Math.min(1, gs.p1ComboTimer / 30)
          ctx.font = `bold 20px Impact, 'Arial Black', sans-serif`
          ctx.textAlign = 'left'
          ctx.fillStyle = p1d.color; ctx.shadowColor = p1d.color; ctx.shadowBlur = 16
          ctx.fillText(`${gs.p1Combo} HIT COMBO!`, 24, CANVAS_H - 125)
          ctx.restore()
        }
        if (gs.p2Combo >= 2) {
          ctx.save()
          ctx.globalAlpha = Math.min(1, gs.p2ComboTimer / 30)
          ctx.font = `bold 20px Impact, 'Arial Black', sans-serif`
          ctx.textAlign = 'right'
          ctx.fillStyle = p2d.color; ctx.shadowColor = p2d.color; ctx.shadowBlur = 16
          ctx.fillText(`${gs.p2Combo} HIT COMBO!`, CANVAS_W - 24, CANVAS_H - 125)
          ctx.restore()
        }

        // Low HP danger pulse border
        if ((player.health < 25 || enemy.health < 25) && gs.phase === 'fighting') {
          const pulse = 0.12 + 0.10 * Math.sin(gs.frameCount * 0.18)
          ctx.save()
          ctx.strokeStyle = `rgba(255,0,0,${pulse})`
          ctx.lineWidth = 22
          ctx.strokeRect(0, 0, CANVAS_W, CANVAS_H)
          ctx.restore()
        }

        // Basic attack collision detection
        if (player.isAttacking && !gs.p1Hit && player.framesCurrent === p1d.attackFrame) {
          if (rectangularCollision({ rectangle1: player, rectangle2: enemy })) {
            const knockDir = player.position.x < enemy.position.x ? 1 : -1
            enemy.takeHit(20, knockDir)
            gs.hitStop = Math.max(gs.hitStop, 4)
            gs.shakeX = 6; gs.shakeY = 4
            gs.p1Combo++; gs.p1ComboTimer = 90
            gs.damageNums.push({
              x: enemy.position.x + 25 + (Math.random() - 0.5) * 30,
              y: enemy.position.y + 30, vy: -3, value: 20, life: 50, maxLife: 50, color: '#ffffff'
            })
            audioManager.playHit(1)
            particlesRef.current.emitHit(enemy.position.x + 25, enemy.position.y + 75, false)
          }
          gs.p1Hit = true
        }
        if (!player.isAttacking) gs.p1Hit = false

        if (enemy.isAttacking && !gs.p2Hit && enemy.framesCurrent === p2d.attackFrame) {
          if (rectangularCollision({ rectangle1: enemy, rectangle2: player })) {
            const knockDir = enemy.position.x < player.position.x ? 1 : -1
            player.takeHit(20, knockDir)
            gs.hitStop = Math.max(gs.hitStop, 4)
            gs.shakeX = 6; gs.shakeY = 4
            gs.p2Combo++; gs.p2ComboTimer = 90
            gs.damageNums.push({
              x: player.position.x + 25 + (Math.random() - 0.5) * 30,
              y: player.position.y + 30, vy: -3, value: 20, life: 50, maxLife: 50, color: '#ffffff'
            })
            audioManager.playHit(1)
            particlesRef.current.emitHit(player.position.x + 25, player.position.y + 75, false)
          }
          gs.p2Hit = true
        }
        if (!enemy.isAttacking) gs.p2Hit = false

        if (gs.phase === 'fighting' && (player.dead || enemy.dead)) endGame()
      }
      ctx.restore()

      // HUD sync every 4 frames
      if (gs.frameCount % 4 === 0) {
        const p = playerRef.current, e = enemyRef.current
        if (p && e) setHudState(prev => ({
          ...prev,
          p1Health: p.health, p2Health: e.health,
          p1Energy: p.energy, p2Energy: e.energy,
          timeLeft: gs.timeLeft, phase: gs.phase, fps: gs.fpsDisplay,
          p1Cooldowns: p.skillCooldowns.map((cd, i) => p1d.skills[i] ? cd / p1d.skills[i].cooldown : 0),
          p2Cooldowns: e.skillCooldowns.map((cd, i) => p2d.skills[i] ? cd / p2d.skills[i].cooldown : 0)
        }))
      }
    }
    loop(0)

    return () => {
      cancelAnimationFrame(animRef.current); clearTimeout(timerRef.current); clearInterval(countInterval)
      audioManager.stopBGM()
      window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const p1d = CHARACTERS[config.p1Character]
  const p2d = CHARACTERS[config.p2Character]

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})`, transformOrigin: 'center' }}>
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{ display: 'block' }} />

        {/* HUD overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', fontFamily: "'Press Start 2P',cursive" }}>

          {/* Health / Energy bars */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px 0' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 8, color: p1d.color, marginBottom: 4, textShadow: `0 0 8px ${p1d.color}` }}>
                {p1d.name.toUpperCase()}&nbsp;&nbsp;{config.mode === 'pvp' ? '[P1]' : '[YOU]'}
              </div>
              <HealthBar value={hudState.p1Health} color={p1d.color} />
              <EnergyBar value={hudState.p1Energy} />
            </div>

            <div style={{ width: 72, textAlign: 'center', flexShrink: 0 }}>
              <div style={{
                fontSize: 30, lineHeight: 1,
                color: hudState.timeLeft <= 10 ? '#ff3300' : '#fff',
                textShadow: `0 0 12px ${hudState.timeLeft <= 10 ? '#ff3300' : '#fff'}`,
                animation: hudState.timeLeft <= 10 && hudState.phase === 'fighting' ? 'pulse 0.5s infinite' : 'none'
              }}>
                {Math.max(0, Math.ceil(hudState.timeLeft))}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 8, color: p2d.color, marginBottom: 4, textAlign: 'right', textShadow: `0 0 8px ${p2d.color}` }}>
                {config.mode === 'pvp' ? '[P2]' : '[CPU]'}&nbsp;&nbsp;{p2d.name.toUpperCase()}
              </div>
              <HealthBar value={hudState.p2Health} color={p2d.color} rtl />
              <EnergyBar value={hudState.p2Energy} rtl />
            </div>
          </div>

          {/* Skill slots */}
          <div style={{ position: 'absolute', bottom: 10, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {p1d.skills.map((sk, i) => (
                <SkillSlot key={sk.id} skill={sk} cdRatio={hudState.p1Cooldowns[i] || 0} energy={hudState.p1Energy} side="left" />
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
              {p2d.skills.map((sk, i) => (
                <SkillSlot key={sk.id} skill={sk} cdRatio={hudState.p2Cooldowns[i] || 0} energy={hudState.p2Energy} side="right" />
              ))}
            </div>
          </div>

          {/* Countdown overlay */}
          {hudState.phase === 'countdown' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
              {hudState.countdown > 0
                ? <div key={hudState.countdown} style={{ fontSize: 110, color: '#ffcc00', textShadow: '0 0 40px #ffcc00,0 0 80px #ff8800', lineHeight: 1, animation: 'countPop 0.4s ease-out' }}>{hudState.countdown}</div>
                : <div style={{ fontSize: 64, color: '#ff0044', textShadow: '0 0 30px #ff0044,0 0 70px #ff0044', animation: 'fightBurst 0.4s ease-out', letterSpacing: 6 }}>FIGHT!</div>
              }
            </div>
          )}

          {/* KO overlay */}
          {hudState.phase === 'over' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
              <div style={{ fontSize: 80, color: '#fff', textShadow: '0 0 30px #fff,0 0 70px #ff0044', animation: 'countPop 0.5s ease-out', letterSpacing: 10 }}>K.O.</div>
            </div>
          )}
        </div>

        {/* Sound toggle + FPS */}
        <div style={{ position: 'absolute', top: 8, right: 12, display: 'flex', gap: 6, alignItems: 'center', pointerEvents: 'auto' }}>
          <span style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 7, color: '#333' }}>{hudState.fps}fps</span>
          <button
            onClick={() => { const on = audioManager.toggle(); setSoundOn(on) }}
            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid #333', color: '#888', fontFamily: "'Press Start 2P',cursive", fontSize: 9, padding: '3px 7px', cursor: 'pointer' }}
          >
            {soundOn ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes countPop  { 0%{transform:scale(2.5);opacity:0} 60%{transform:scale(0.9);opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes fightBurst{ 0%{transform:scale(0.5) rotate(-5deg);opacity:0} 50%{transform:scale(1.1) rotate(2deg);opacity:1} 100%{transform:scale(1) rotate(0deg);opacity:1} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes hpPulse   { 0%,100%{opacity:1} 50%{opacity:0.52} }
      `}</style>
    </div>
  )
}
