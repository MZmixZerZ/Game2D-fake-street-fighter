export class ParticleSystem {
  constructor() {
    this.particles = []
  }

  emit(x, y, { count = 8, colors = ['#ff6600'], speed = 4, size = 3, life = 22, spread = Math.PI * 2, gravity = 0.35, upBias = 1 } = {}) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() - 0.5) * spread
      const spd = Math.random() * speed + 0.5
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - upBias,
        size: Math.random() * size + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        life,
        maxLife: life,
        gravity
      })
    }
  }

  emitHit(x, y, isSkill = false) {
    if (isSkill) {
      this.emit(x, y, { count: 22, colors: ['#ffcc00', '#ff8800', '#ffee44'], speed: 9, size: 6, life: 42, upBias: 2 })
      this.emit(x, y, { count: 12, colors: ['#ffffff', '#ffffaa'], speed: 13, size: 2.5, life: 22, spread: Math.PI * 2, upBias: 0 })
    } else {
      this.emit(x, y, { count: 9, colors: ['#ff4400', '#ff8800', '#ffaa00'], speed: 4.5, size: 3.5, life: 22, upBias: 1.5 })
      this.emit(x, y, { count: 4, colors: ['#ffffff'], speed: 7, size: 2, life: 14, upBias: 0 })
    }
  }

  emitTeleport(x, y) {
    this.emit(x, y, { count: 28, colors: ['#bb00ff', '#7700cc', '#dd66ff', '#ffffff'], speed: 6, size: 4.5, life: 38, spread: Math.PI * 2, gravity: -0.08, upBias: 0.5 })
  }

  emitBladeArcs(x, y, frame) {
    const rotation = (frame / 45) * Math.PI * 4
    for (let i = 0; i < 6; i++) {
      const angle = rotation + (i / 6) * Math.PI * 2
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * 7,
        vy: Math.sin(angle) * 7,
        size: 3.5,
        color: i % 2 === 0 ? '#00ccff' : '#ffffff',
        life: 16,
        maxLife: 16,
        gravity: 0
      })
    }
  }

  emitDarkExplosion(x, y) {
    this.emit(x, y, { count: 18, colors: ['#8800cc', '#5500aa', '#cc44ff'], speed: 5, size: 5, life: 35, spread: Math.PI * 2, gravity: -0.1, upBias: 0 })
    this.emit(x, y, { count: 8, colors: ['#ffffff', '#ddaaff'], speed: 9, size: 2, life: 20 })
  }

  update(ctx) {
    this.particles = this.particles.filter(p => p.life > 0)
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += p.gravity
      p.vx *= 0.97
      p.life--
      const alpha = p.life / p.maxLife
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, Math.max(0.1, p.size * alpha), 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }
}
