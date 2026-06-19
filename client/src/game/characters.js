// Single source of truth for all character data
export const CHARACTERS = {
  samuraiMack: {
    name: 'Samurai Mack', displayName: 'SAMURAI MACK',
    title: 'The Swift Blade',
    color: '#00ccff', bgGlow: 'rgba(0,180,255,0.12)',
    spawnX: 200, scale: 2.5, offset: { x: 215, y: 157 },
    colorFilter: null,
    sprites: {
      idle:    { imageSrc: '/img/samuraiMack/Idle.png',           framesMax: 8 },
      run:     { imageSrc: '/img/samuraiMack/Run.png',            framesMax: 8 },
      jump:    { imageSrc: '/img/samuraiMack/Jump.png',           framesMax: 2 },
      fall:    { imageSrc: '/img/samuraiMack/Fall.png',           framesMax: 2 },
      attack1: { imageSrc: '/img/samuraiMack/Attack1.png',        framesMax: 6, framesHold: 4 },
      takeHit: { imageSrc: '/img/samuraiMack/TakeHit-white.png',  framesMax: 4 },
      death:   { imageSrc: '/img/samuraiMack/Death.png',          framesMax: 6 }
    },
    attackBox: { offset: { x: 100, y: 50 }, width: 160, height: 50 },
    attackFrame: 4,
    stats: { speed: 90, power: 65, defense: 60 },
    rival: 'kenji',
    skills: [
      { id: 'dashSlash',  name: 'Dash Slash',  key: 'q', energyCost: 30, cooldown: 150, damage: 30, color: '#00ccff', desc: 'Rush forward — devastating slash' },
      { id: 'bladeStorm', name: 'Blade Storm', key: 'e', energyCost: 50, cooldown: 200, damage: 15, color: '#ffaa00', desc: 'Spinning arcs deal 3 hits rapidly' }
    ]
  },

  shadowMack: {
    name: 'Shadow Mack', displayName: 'SHADOW MACK',
    title: 'Void Incarnate',
    color: '#9944ff', bgGlow: 'rgba(120,0,200,0.14)',
    spawnX: 200, scale: 2.5, offset: { x: 215, y: 157 },
    colorFilter: 'hue-rotate(245deg) brightness(0.70) saturate(2.2)',
    sprites: {
      idle:    { imageSrc: '/img/samuraiMack/Idle.png',           framesMax: 8 },
      run:     { imageSrc: '/img/samuraiMack/Run.png',            framesMax: 8 },
      jump:    { imageSrc: '/img/samuraiMack/Jump.png',           framesMax: 2 },
      fall:    { imageSrc: '/img/samuraiMack/Fall.png',           framesMax: 2 },
      attack1: { imageSrc: '/img/samuraiMack/Attack1.png',        framesMax: 6, framesHold: 4 },
      takeHit: { imageSrc: '/img/samuraiMack/TakeHit-white.png',  framesMax: 4 },
      death:   { imageSrc: '/img/samuraiMack/Death.png',          framesMax: 6 }
    },
    attackBox: { offset: { x: 100, y: 50 }, width: 160, height: 50 },
    attackFrame: 4,
    stats: { speed: 80, power: 78, defense: 65 },
    rival: 'blazeKenji',
    skills: [
      { id: 'smokeBomb', name: 'Smoke Bomb', key: 'q', energyCost: 35, cooldown: 170, damage: 25, color: '#7722cc', desc: 'Vanish & reappear near enemy with blast' },
      { id: 'voidSlash', name: 'Void Slash', key: 'e', energyCost: 55, cooldown: 220, damage: 10, color: '#bb44ff', desc: '6 dark energy strikes in rapid succession' }
    ]
  },

  huntress: {
    name: 'Huntress', displayName: 'HUNTRESS',
    title: 'The Swift Predator',
    color: '#22dd88', bgGlow: 'rgba(10,180,100,0.13)',
    spawnX: 200, scale: 2.5, offset: { x: 152, y: 95 },
    colorFilter: null,
    sprites: {
      idle:    { imageSrc: '/img/Huntress/Sprites/Idle.png',    framesMax: 8 },
      run:     { imageSrc: '/img/Huntress/Sprites/Run.png',     framesMax: 8 },
      jump:    { imageSrc: '/img/Huntress/Sprites/Jump.png',    framesMax: 2 },
      fall:    { imageSrc: '/img/Huntress/Sprites/Fall.png',    framesMax: 2 },
      attack1: { imageSrc: '/img/Huntress/Sprites/Attack1.png', framesMax: 5, framesHold: 4 },
      takeHit: { imageSrc: '/img/Huntress/Sprites/TakeHit.png', framesMax: 3 },
      death:   { imageSrc: '/img/Huntress/Sprites/Death.png',   framesMax: 8 }
    },
    attackBox: { offset: { x: 100, y: 50 }, width: 160, height: 50 },
    attackFrame: 3,
    stats: { speed: 95, power: 55, defense: 45 },
    rival: 'wizard',
    skills: [
      { id: 'arrowBarrage', name: 'Arrow Barrage', key: 'q', energyCost: 40, cooldown: 180, damage: 18, color: '#22dd88', desc: '6 arrows fire in rapid succession' },
      { id: 'flipTrap',     name: 'Flip Trap',     key: 'e', energyCost: 55, cooldown: 250, damage: 45, color: '#88ffcc', desc: 'Teleport behind enemy + drop exploding trap' }
    ]
  },

  kenji: {
    name: 'Kenji', displayName: 'KENJI',
    title: 'Shadow Warrior',
    color: '#ff4444', bgGlow: 'rgba(200,0,0,0.12)',
    spawnX: 750, scale: 2.5, offset: { x: 215, y: 167 },
    colorFilter: null,
    sprites: {
      idle:    { imageSrc: '/img/kenji/Idle.png',     framesMax: 4 },
      run:     { imageSrc: '/img/kenji/Run.png',      framesMax: 8 },
      jump:    { imageSrc: '/img/kenji/Jump.png',     framesMax: 2 },
      fall:    { imageSrc: '/img/kenji/Fall.png',     framesMax: 2 },
      attack1: { imageSrc: '/img/kenji/Attack1.png',  framesMax: 4, framesHold: 4 },
      takeHit: { imageSrc: '/img/kenji/Take hit.png', framesMax: 3 },
      death:   { imageSrc: '/img/kenji/Death.png',    framesMax: 7 }
    },
    attackBox: { offset: { x: -170, y: 50 }, width: 170, height: 50 },
    attackFrame: 2,
    stats: { speed: 60, power: 90, defense: 75 },
    rival: 'samuraiMack',
    skills: [
      { id: 'shadowStep',   name: 'Shadow Step',   key: ',', energyCost: 35, cooldown: 160, damage: 25, color: '#aa00ff', desc: 'Teleport behind opponent & strike' },
      { id: 'darkEruption', name: 'Dark Eruption', key: '.', energyCost: 60, cooldown: 280, damage: 40, color: '#6600cc', desc: 'Ground shockwave of dark energy' }
    ]
  },

  blazeKenji: {
    name: 'Blaze Kenji', displayName: 'BLAZE KENJI',
    title: 'Inferno Warrior',
    color: '#ff6600', bgGlow: 'rgba(220,80,0,0.14)',
    spawnX: 750, scale: 2.5, offset: { x: 215, y: 167 },
    colorFilter: 'hue-rotate(28deg) saturate(4.5) brightness(1.15)',
    sprites: {
      idle:    { imageSrc: '/img/kenji/Idle.png',     framesMax: 4 },
      run:     { imageSrc: '/img/kenji/Run.png',      framesMax: 8 },
      jump:    { imageSrc: '/img/kenji/Jump.png',     framesMax: 2 },
      fall:    { imageSrc: '/img/kenji/Fall.png',     framesMax: 2 },
      attack1: { imageSrc: '/img/kenji/Attack1.png',  framesMax: 4, framesHold: 4 },
      takeHit: { imageSrc: '/img/kenji/Take hit.png', framesMax: 3 },
      death:   { imageSrc: '/img/kenji/Death.png',    framesMax: 7 }
    },
    attackBox: { offset: { x: -170, y: 50 }, width: 170, height: 50 },
    attackFrame: 2,
    stats: { speed: 68, power: 98, defense: 70 },
    rival: 'shadowMack',
    skills: [
      { id: 'flameDash',    name: 'Flame Dash',    key: ',', energyCost: 40, cooldown: 170, damage: 35, color: '#ff6600', desc: 'Fire-trail dash through the enemy' },
      { id: 'infernoBlast', name: 'Inferno Blast', key: '.', energyCost: 65, cooldown: 300, damage: 50, color: '#ff2200', desc: 'Massive fire eruption — wide AoE' }
    ]
  },

  wizard: {
    name: 'Wizard', displayName: 'WIZARD',
    title: 'The Arcane Destroyer',
    color: '#4488ff', bgGlow: 'rgba(30,80,220,0.13)',
    spawnX: 750, scale: 1.3, offset: { x: 115, y: 21 },
    colorFilter: null,
    sprites: {
      idle:    { imageSrc: '/img/Wizard Pack/Idle.png',    framesMax: 6 },
      run:     { imageSrc: '/img/Wizard Pack/Run.png',     framesMax: 8 },
      jump:    { imageSrc: '/img/Wizard Pack/Jump.png',    framesMax: 2 },
      fall:    { imageSrc: '/img/Wizard Pack/Fall.png',    framesMax: 2 },
      attack1: { imageSrc: '/img/Wizard Pack/Attack1.png', framesMax: 8, framesHold: 4 },
      takeHit: { imageSrc: '/img/Wizard Pack/Hit.png',     framesMax: 4 },
      death:   { imageSrc: '/img/Wizard Pack/Death.png',   framesMax: 7 }
    },
    attackBox: { offset: { x: -170, y: 50 }, width: 170, height: 50 },
    attackFrame: 4,
    stats: { speed: 50, power: 100, defense: 35 },
    rival: 'huntress',
    skills: [
      { id: 'arcaneSurge',     name: 'Arcane Surge',    key: ',', energyCost: 35, cooldown: 160, damage: 22, color: '#4488ff', desc: '4 homing orbs spiral then converge on enemy' },
      { id: 'gravityCollapse', name: 'Gravity Collapse', key: '.', energyCost: 70, cooldown: 320, damage: 60, color: '#2255dd', desc: 'Drag enemy in with gravity field — then explode' }
    ]
  }
}

export const GRID_ORDER = ['samuraiMack', 'shadowMack', 'huntress', 'kenji', 'blazeKenji', 'wizard']

export const CHAR_ABBREV = {
  samuraiMack: 'SMK', shadowMack: 'SDW', blazeKenji: 'BLZ',
  kenji: 'KNJ', huntress: 'HNT', wizard: 'WIZ'
}
