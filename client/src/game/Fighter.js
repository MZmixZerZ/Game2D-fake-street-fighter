export class Fighter {
  constructor({ position, velocity, imageSrc, scale = 1, framesMax = 1, offset = { x: 0, y: 0 }, sprites, attackBox = { offset: {}, width: 0, height: 0 }, name = '', skills = [], colorFilter = null }) {
    this.position = { x: position.x, y: position.y }
    this.velocity = { x: 0, y: 0 }
    this.width = 50
    this.height = 150
    this.scale = scale
    this.offset = offset
    this.framesMax = framesMax
    this.framesCurrent = 0
    this.framesElapsed = 0
    this.framesHold = 5

    this.attackBox = {
      position: { x: position.x, y: position.y },
      offset: attackBox.offset,
      width: attackBox.width,
      height: attackBox.height
    }

    this.isAttacking = false
    this.attackHit = false
    this.health = 100
    this.energy = 0
    this.maxEnergy = 100
    this.dead = false
    this.currentSprite = 'idle'
    this.lastKey = ''
    this.name = name
    this.skills = skills
    this.skillCooldowns = new Array(skills.length).fill(0)
    this.hitFlash = 0
    this.colorFilter = colorFilter
    this.sprites = sprites

    this.image = new Image()
    this.image.src = imageSrc

    for (const key in sprites) {
      sprites[key].image = new Image()
      sprites[key].image.src = sprites[key].imageSrc
    }
  }

  draw(ctx) {
    ctx.save()
    if (this.hitFlash > 0) {
      ctx.filter = 'brightness(8) saturate(0)'
      ctx.globalAlpha = 0.85
      this.hitFlash--
    } else if (this.colorFilter) {
      ctx.filter = this.colorFilter
    }

    ctx.drawImage(
      this.image,
      this.framesCurrent * (this.image.width / this.framesMax),
      0,
      this.image.width / this.framesMax,
      this.image.height,
      this.position.x - this.offset.x,
      this.position.y - this.offset.y,
      (this.image.width / this.framesMax) * this.scale,
      this.image.height * this.scale
    )
    ctx.restore()
  }

  animateFrames() {
    this.framesElapsed++
    if (this.framesElapsed % this.framesHold !== 0) return

    if (this.framesCurrent < this.framesMax - 1) {
      this.framesCurrent++
      return
    }

    // Animation complete
    if (this.currentSprite === 'death') {
      this.dead = true
      return
    }
    if (this.currentSprite === 'attack1') {
      this.isAttacking = false
      this.attackHit = false
      this.switchSprite('idle')
      return
    }
    if (this.currentSprite === 'takeHit') {
      this.switchSprite('idle')
      return
    }
    this.framesCurrent = 0
  }

  update(ctx, canvasH, frozen = false) {
    this.draw(ctx)
    if (!this.dead && !frozen) this.animateFrames()

    if (frozen) return

    this.attackBox.position.x = this.position.x + this.attackBox.offset.x
    this.attackBox.position.y = this.position.y + this.attackBox.offset.y

    this.position.x += this.velocity.x
    this.position.y += this.velocity.y

    const groundY = canvasH - 96 - this.height
    if (this.position.y >= groundY) {
      this.velocity.y = 0
      this.position.y = groundY
    } else {
      this.velocity.y += 0.7
    }

    if (this.position.x < 0) this.position.x = 0
    if (this.position.x + this.width > 1024) this.position.x = 1024 - this.width

    this.skillCooldowns = this.skillCooldowns.map(cd => Math.max(0, cd - 1))

    if (!this.dead && this.energy < this.maxEnergy) {
      this.energy = Math.min(this.maxEnergy, this.energy + 0.12)
    }
  }

  attack() {
    if (this.isAttacking || this.dead) return
    this.isAttacking = true
    this.attackHit = false
    this.switchSprite('attack1')
  }

  takeHit(damage = 20, knockDir = 0) {
    if (this.dead) return
    this.health = Math.max(0, this.health - damage)
    this.hitFlash = 6
    this.energy = Math.min(this.maxEnergy, this.energy + 8)
    if (knockDir !== 0) this.velocity.x = knockDir * 6

    if (this.health <= 0) {
      this.health = 0
      this.switchSprite('death')
    } else {
      this.switchSprite('takeHit')
    }
  }

  switchSprite(sprite) {
    if (this.currentSprite === 'death') return
    if (this.currentSprite === 'attack1' && this.isAttacking && sprite !== 'takeHit' && sprite !== 'death') return
    if (this.currentSprite === 'takeHit' && this.framesCurrent < this.framesMax - 1 && sprite !== 'death') return
    if (this.currentSprite === sprite) return

    this.currentSprite = sprite
    const s = this.sprites[sprite]
    this.image = s.image
    this.framesMax = s.framesMax
    this.framesHold = s.framesHold || 5
    this.framesCurrent = 0
    this.framesElapsed = 0
  }

  canUseSkill(index) {
    if (!this.skills[index]) return false
    return !this.dead && this.energy >= this.skills[index].energyCost && this.skillCooldowns[index] === 0
  }

  consumeSkill(index) {
    const skill = this.skills[index]
    this.energy -= skill.energyCost
    this.skillCooldowns[index] = skill.cooldown
    return skill
  }
}
