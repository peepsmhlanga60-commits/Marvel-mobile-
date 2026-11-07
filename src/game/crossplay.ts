import { Combatant, HeroId, KillfeedEvent, Platform } from './types';
import { HEROES } from './heroes';

export interface CrossplayLobbyPlayer {
  id: string;
  name: string;
  platform: Platform;
  heroId: HeroId;
  team: 'blue' | 'red';
  isLocalPlayer: boolean;
  ping: number;
  rank: string;
}

export const BOT_NAMES: Record<Platform, string[]> = {
  ps5: [
    'DualSense_Viper',
    'PlayStation_Pro',
    'Apex_Titan_PS',
    'KratosBlade_99',
    'DualShockPulse',
    'Ghost_Of_Tsushima',
  ],
  pc: [
    'FPS_God_Click',
    'UltraMouse_240Hz',
    'KeebWarrior_RGB',
    'V-Sync_Zero',
    'FrameRate_King',
    'SniperScope_X',
  ],
  mobile: [
    'TouchMaster_99',
    'ClawGamer_Pro',
    'ThumbTap_Demon',
    'MobileSniper_HQ',
    'ScreenSwipe_Ace',
    'OLED_Flick_Master',
  ],
};

export function getPlatformBadge(platform: Platform): { icon: string; label: string; bg: string; text: string } {
  switch (platform) {
    case 'ps5':
      return { icon: '🎮', label: 'PS5', bg: 'bg-blue-600/80', text: 'text-blue-200' };
    case 'pc':
      return { icon: '🖥️', label: 'PC', bg: 'bg-emerald-600/80', text: 'text-emerald-200' };
    case 'mobile':
      return { icon: '📱', label: 'Mobile', bg: 'bg-amber-600/80', text: 'text-amber-200' };
  }
}

export function generateInitialMatchRoster(
  userHeroId: HeroId,
  userPlatform: Platform = 'mobile',
  userName: string = 'You'
): Combatant[] {
  const heroKeys = Object.keys(HEROES) as HeroId[];

  // User combatant (Blue team)
  const userHero = HEROES[userHeroId];
  const user: Combatant = {
    id: 'user_player',
    name: userName,
    team: 'blue',
    isLocalPlayer: true,
    heroId: userHeroId,
    platform: userPlatform,
    health: userHero.health,
    maxHealth: userHero.maxHealth,
    shield: userHero.shield,
    maxShield: userHero.maxShield,
    ammo: userHero.primaryWeapon.ammo,
    maxAmmo: userHero.primaryWeapon.maxAmmo,
    isReloading: false,
    reloadTimer: 0,
    ability1Cooldown: 0,
    ability2Cooldown: 0,
    ultimateCharge: 15,
    isUsingUltimate: false,
    stats: { kills: 0, deaths: 0, assists: 0, damageDealt: 0, healingDealt: 0 },
    ping: Math.floor(14 + Math.random() * 12),
    position: { x: 0, y: 0, z: 22 },
    rotationY: 0,
    isAlive: true,
    respawnTimer: 0,
  };

  const roster: Combatant[] = [user];

  // 2 Blue Allies (with PS5 and PC platforms to showcase cross-platform play)
  const allyPlatforms: Platform[] = ['ps5', 'pc'];
  const remainingAllies = heroKeys.filter((h) => h !== userHeroId);
  const allyHeroes = remainingAllies.sort(() => 0.5 - Math.random()).slice(0, 2);

  allyHeroes.forEach((hId, i) => {
    const hero = HEROES[hId];
    const plat = allyPlatforms[i % allyPlatforms.length];
    const names = BOT_NAMES[plat];
    const name = names[Math.floor(Math.random() * names.length)];
    roster.push({
      id: `ally_${i + 1}`,
      name,
      team: 'blue',
      isLocalPlayer: false,
      heroId: hId,
      platform: plat,
      health: hero.health,
      maxHealth: hero.maxHealth,
      shield: hero.shield,
      maxShield: hero.maxShield,
      ammo: hero.primaryWeapon.ammo,
      maxAmmo: hero.primaryWeapon.maxAmmo,
      isReloading: false,
      reloadTimer: 0,
      ability1Cooldown: 0,
      ability2Cooldown: 0,
      ultimateCharge: Math.floor(Math.random() * 40),
      isUsingUltimate: false,
      stats: { kills: 0, deaths: 0, assists: 0, damageDealt: 0, healingDealt: 0 },
      ping: Math.floor(18 + Math.random() * 25),
      position: { x: (i === 0 ? -6 : 6), y: 0, z: 24 },
      rotationY: 0,
      isAlive: true,
      respawnTimer: 0,
    });
  });

  // 3 Red Enemies (mixed cross-play: PS5, PC, Mobile)
  const enemyPlatforms: Platform[] = ['ps5', 'pc', 'mobile'];
  const shuffledEnemies = [...heroKeys].sort(() => 0.5 - Math.random()).slice(0, 3);

  shuffledEnemies.forEach((hId, i) => {
    const hero = HEROES[hId];
    const plat = enemyPlatforms[i % enemyPlatforms.length];
    const names = BOT_NAMES[plat];
    const name = names[Math.floor(Math.random() * names.length)];
    roster.push({
      id: `enemy_${i + 1}`,
      name,
      team: 'red',
      isLocalPlayer: false,
      heroId: hId,
      platform: plat,
      health: hero.health,
      maxHealth: hero.maxHealth,
      shield: hero.shield,
      maxShield: hero.maxShield,
      ammo: hero.primaryWeapon.ammo,
      maxAmmo: hero.primaryWeapon.maxAmmo,
      isReloading: false,
      reloadTimer: 0,
      ability1Cooldown: 0,
      ability2Cooldown: 0,
      ultimateCharge: Math.floor(Math.random() * 35),
      isUsingUltimate: false,
      stats: { kills: 0, deaths: 0, assists: 0, damageDealt: 0, healingDealt: 0 },
      ping: Math.floor(22 + Math.random() * 30),
      position: { x: (i - 1) * 7, y: 0, z: -22 },
      rotationY: Math.PI,
      isAlive: true,
      respawnTimer: 0,
    });
  });

  return roster;
}

export function createKillfeedItem(
  killer: Combatant,
  victim: Combatant,
  isHeadshot: boolean = false
): KillfeedEvent {
  return {
    id: 'kf_' + Math.random().toString(36).substring(2, 9),
    killerName: killer.name,
    killerPlatform: killer.platform,
    killerHero: killer.heroId,
    victimName: victim.name,
    victimPlatform: victim.platform,
    victimHero: victim.heroId,
    isHeadshot,
    time: Date.now(),
  };
}
