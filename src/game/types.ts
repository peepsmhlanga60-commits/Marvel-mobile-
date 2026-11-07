export type Platform = 'ps5' | 'pc' | 'mobile';

export type HeroId = 'volt' | 'titan' | 'shadow' | 'frost' | 'nova' | 'phantom';

export type HeroRole = 'Duelist' | 'Vanguard' | 'Strategist';

export interface AbilityDef {
  name: string;
  description: string;
  cooldown: number; // in seconds
  icon: string;
  keyHint: string;
}

export interface HeroDef {
  id: HeroId;
  name: string;
  title: string;
  role: HeroRole;
  emoji: string;
  color: string;
  accentColor: string;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  speed: number;
  primaryWeapon: {
    name: string;
    damage: number;
    fireRate: number; // shots per sec
    range: number;
    projectileSpeed: number;
    ammo: number;
    maxAmmo: number;
    reloadTime: number;
  };
  ability1: AbilityDef;
  ability2: AbilityDef;
  ultimate: {
    name: string;
    description: string;
    chargeNeeded: number;
    icon: string;
    keyHint: string;
  };
  synergyHeroId: HeroId;
  synergyName: string;
  synergyDescription: string;
  lore: string;
}

export interface PlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  damageDealt: number;
  healingDealt: number;
}

export interface KillfeedEvent {
  id: string;
  killerName: string;
  killerPlatform: Platform;
  killerHero: HeroId;
  victimName: string;
  victimPlatform: Platform;
  victimHero: HeroId;
  isHeadshot?: boolean;
  time: number;
}

export interface Combatant {
  id: string;
  name: string;
  team: 'blue' | 'red';
  isLocalPlayer: boolean;
  heroId: HeroId;
  platform: Platform;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  reloadTimer: number;
  ability1Cooldown: number;
  ability2Cooldown: number;
  ultimateCharge: number; // 0 to 100
  isUsingUltimate: boolean;
  stats: PlayerStats;
  ping: number;
  // Position and state
  position: { x: number; y: number; z: number };
  rotationY: number;
  isAlive: boolean;
  respawnTimer: number;
}

export interface GameSettings {
  touchSensitivity: number;
  aimAssist: boolean;
  autoFire: boolean;
  soundVolume: number;
  musicMuted: boolean;
  sfxMuted: boolean;
  crossplayEnabled: boolean;
  showFps: boolean;
  controlLayout: 'default' | 'compact' | 'claw';
}
