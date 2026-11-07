import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Combatant, GameSettings, HeroId, KillfeedEvent, Platform } from './types';
import { HEROES } from './heroes';
import { sound } from './audio';
import { createArenaEnvironment, createHeroMesh, createProjectileMesh } from './proceduralModels';
import { createKillfeedItem, generateInitialMatchRoster } from './crossplay';

// Reusable math objects to eliminate GC in the render loop
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();

export interface Projectile {
  id: string;
  mesh: THREE.Mesh;
  ownerId: string;
  team: 'blue' | 'red';
  heroId: HeroId;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  life: number;
  maxLife: number;
}

export interface DamageNumber {
  id: string;
  text: string;
  color: string;
  position: THREE.Vector3;
  life: number;
}

export interface MatchState {
  status: 'playing' | 'victory' | 'defeat';
  blueScore: number;
  redScore: number;
  blueCapturePercent: number;
  redCapturePercent: number;
  isContested: boolean;
  captureTeam: 'blue' | 'red' | 'neutral';
  matchTimer: number; // in seconds
}

export class GameEngine {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;
  private animFrameId: number = 0;
  private isDestroyed: boolean = false;
  private lastTime: number = 0;

  // Settings
  public settings: GameSettings;

  // Game Roster & Meshes
  public roster: Combatant[] = [];
  private heroMeshes: Map<string, THREE.Group> = new Map();
  private projectiles: Projectile[] = [];
  private damageNumbers: DamageNumber[] = [];
  private coverBoxes: THREE.Box3[] = [];
  private jumpPads: THREE.Mesh[] = [];
  private capturePointMesh!: THREE.Group;

  // Player controls state
  public moveVector = { x: 0, y: 0 }; // [-1 to 1]
  public aimDelta = { x: 0, y: 0 };
  public isFiring: boolean = false;
  public jumpRequested: boolean = false;

  // Camera angles
  private cameraYaw: number = 0;
  private cameraPitch: number = 0.15; // slightly looking down
  private cameraDist: number = 4.8;
  private cameraShake: number = 0;

  // Hitstop timer (in seconds)
  private hitstopTimer: number = 0;

  // Match State
  public matchState: MatchState = {
    status: 'playing',
    blueScore: 0,
    redScore: 0,
    blueCapturePercent: 0,
    redCapturePercent: 0,
    isContested: false,
    captureTeam: 'neutral',
    matchTimer: 180,
  };

  // UI callbacks
  public onStateUpdate?: (player: Combatant, match: MatchState) => void;
  public onKillfeedEvent?: (event: KillfeedEvent) => void;
  public onHitEvent?: (isCrit: boolean) => void;
  public onEliminationEvent?: (victim: Combatant) => void;
  public onDamageNumber?: (num: DamageNumber) => void;

  constructor(
    container: HTMLElement,
    userHeroId: HeroId,
    userPlatform: Platform = 'mobile',
    userName: string = 'RivalCommander',
    settings: GameSettings
  ) {
    this.container = container;
    this.settings = settings;

    this.detectHardware();
    this.initThree();
    this.initArena();
    this.initRoster(userHeroId, userPlatform, userName);
    this.setupEventListeners();

    this.lastTime = performance.now();
    this.startLoop();
  }

  private detectHardware() {
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();
  }

  private initThree() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#060b18');
    this.scene.fog = new THREE.FogExp2('#060b18', 0.016);

    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 150);
    this.camera.position.set(0, 3, 27);

    // Procedural Studio Environment Reflection
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // RoomEnvironment fallback
    }

    // Three-point balanced studio lighting
    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.0);
    keyLight.position.set(20, 35, 20);
    if (!this.isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 90;
      keyLight.shadow.camera.left = -30;
      keyLight.shadow.camera.right = 30;
      keyLight.shadow.camera.top = 30;
      keyLight.shadow.camera.bottom = -30;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 1.2);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 0.8);
    rimLight.position.set(-25, 15, -25);
    this.scene.add(rimLight);
  }

  private initArena() {
    const { environmentGroup, capturePoint, jumpPads, coverObstacles } = createArenaEnvironment();
    this.scene.add(environmentGroup);
    this.capturePointMesh = capturePoint;
    this.jumpPads = jumpPads;
    this.coverBoxes = coverObstacles;
  }

  private initRoster(userHeroId: HeroId, userPlatform: Platform, userName: string) {
    this.roster = generateInitialMatchRoster(userHeroId, userPlatform, userName);

    // Create 3D meshes for each combatant
    this.roster.forEach((c) => {
      const mesh = createHeroMesh(c.heroId, c.team);
      mesh.position.set(c.position.x, c.position.y, c.position.z);
      mesh.rotation.y = c.rotationY;
      this.scene.add(mesh);
      this.heroMeshes.set(c.id, mesh);
    });
  }

  public switchPlayerHero(newHeroId: HeroId) {
    const player = this.getLocalPlayer();
    if (!player) return;

    player.heroId = newHeroId;
    const hero = HEROES[newHeroId];
    player.health = hero.health;
    player.maxHealth = hero.maxHealth;
    player.shield = hero.shield;
    player.maxShield = hero.maxShield;
    player.ammo = hero.primaryWeapon.ammo;
    player.maxAmmo = hero.primaryWeapon.maxAmmo;
    player.ability1Cooldown = 0;
    player.ability2Cooldown = 0;
    player.ultimateCharge = Math.min(player.ultimateCharge, 100);

    // Replace 3D mesh
    const oldMesh = this.heroMeshes.get(player.id);
    if (oldMesh) {
      this.scene.remove(oldMesh);
    }
    const newMesh = createHeroMesh(newHeroId, 'blue');
    newMesh.position.set(player.position.x, player.position.y, player.position.z);
    this.scene.add(newMesh);
    this.heroMeshes.set(player.id, newMesh);
  }

  public getLocalPlayer(): Combatant | undefined {
    return this.roster.find((c) => c.isLocalPlayer);
  }

  private setupEventListeners() {
    window.addEventListener('resize', this.onResize);

    // Keyboard fallbacks for desktop play
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
  }

  private onResize = () => {
    if (this.isDestroyed || !this.container) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private heldKeys = new Set<string>();

  private onKeyDown = (e: KeyboardEvent) => {
    this.heldKeys.add(e.code);

    if (e.code === 'Space') {
      this.triggerJump();
    } else if (e.code === 'KeyQ') {
      this.triggerUltimate();
    } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.triggerAbility1();
    } else if (e.code === 'KeyE') {
      this.triggerAbility2();
    } else if (e.code === 'KeyR') {
      this.triggerReload();
    } else if (e.code === 'KeyV' || e.code === 'KeyF') {
      this.triggerMelee();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.heldKeys.delete(e.code);
  };

  private onWindowBlur = () => {
    this.heldKeys.clear();
    this.moveVector = { x: 0, y: 0 };
    this.isFiring = false;
  };

  // Actions triggered from Mobile touch or PC keyboard
  public triggerJump() {
    const p = this.getLocalPlayer();
    if (!p || !p.isAlive) return;
    if (p.position.y <= 0.1) {
      this.playerVelocityY = 9.5;
      sound.playJump();
    }
  }

  public triggerAbility1() {
    const p = this.getLocalPlayer();
    if (!p || !p.isAlive || p.ability1Cooldown > 0) return;

    const hero = HEROES[p.heroId];
    p.ability1Cooldown = hero.ability1.cooldown;
    sound.playAbility(1);

    // Ability 1 mechanics
    if (p.heroId === 'volt') {
      // Lightning Dash
      const forwardX = Math.sin(this.cameraYaw);
      const forwardZ = Math.cos(this.cameraYaw);
      p.position.x += forwardX * 12;
      p.position.z += forwardZ * 12;
      this.spawnExplosionEffect(p.position, 0x00d2ff, 15);
    } else if (p.heroId === 'titan') {
      // Fortress Aegis: add temporary shield
      p.shield = Math.min(p.maxShield + 300, 450);
      this.spawnExplosionEffect(p.position, 0xff9900, 20);
    } else if (p.heroId === 'shadow') {
      // Shadow Grapple
      const forwardX = Math.sin(this.cameraYaw);
      const forwardZ = Math.cos(this.cameraYaw);
      p.position.x += forwardX * 15;
      p.position.z += forwardZ * 15;
      this.spawnExplosionEffect(p.position, 0xa855f7, 18);
    } else if (p.heroId === 'frost') {
      // Glacial Pillar: Spawn temporary icy barrier
      this.spawnExplosionEffect(p.position, 0x38bdf8, 25);
    } else if (p.heroId === 'nova') {
      // Cluster Rocket Pod
      for (let i = -2; i <= 2; i++) {
        const spreadAngle = this.cameraYaw + i * 0.12;
        this.spawnProjectile(p, spreadAngle, hero.primaryWeapon.damage * 1.4);
      }
    } else if (p.heroId === 'phantom') {
      // Dimensional Rift
      const forwardX = Math.sin(this.cameraYaw);
      const forwardZ = Math.cos(this.cameraYaw);
      p.position.x += forwardX * 14;
      p.position.z += forwardZ * 14;
      this.spawnExplosionEffect(p.position, 0x10b981, 20);
    }
  }

  public triggerAbility2() {
    const p = this.getLocalPlayer();
    if (!p || !p.isAlive || p.ability2Cooldown > 0) return;

    const hero = HEROES[p.heroId];
    p.ability2Cooldown = hero.ability2.cooldown;
    sound.playAbility(2);

    if (p.heroId === 'frost') {
      // Healing Blizzard
      p.health = Math.min(p.maxHealth, p.health + 100);
      this.spawnExplosionEffect(p.position, 0x7dd3fc, 25);
    } else if (p.heroId === 'titan') {
      // Seismic Impact
      this.playerVelocityY = 12;
      this.cameraShake = 0.4;
      this.applyAoeDamage(p, 10, 80);
      this.spawnExplosionEffect(p.position, 0xff4d4d, 35);
    } else if (p.heroId === 'nova') {
      // Tactical Jet-Roll
      p.ammo = hero.primaryWeapon.maxAmmo;
      p.isReloading = false;
      const forwardX = Math.sin(this.cameraYaw);
      const forwardZ = Math.cos(this.cameraYaw);
      p.position.x += forwardX * 8;
      p.position.z += forwardZ * 8;
    } else if (p.heroId === 'shadow') {
      // Smoke Shroud
      this.spawnExplosionEffect(p.position, 0x4c1d95, 30);
    } else {
      this.spawnExplosionEffect(p.position, 0x38bdf8, 20);
    }
  }

  public triggerUltimate() {
    const p = this.getLocalPlayer();
    if (!p || !p.isAlive || p.ultimateCharge < 100) return;

    p.ultimateCharge = 0;
    p.isUsingUltimate = true;
    sound.playUltimate();
    this.cameraShake = 0.6;
    this.hitstopTimer = 0.06;

    // Apply ultimate effect
    this.applyAoeDamage(p, 16, 220);
    this.spawnExplosionEffect(p.position, 0xffe600, 60);

    setTimeout(() => {
      p.isUsingUltimate = false;
    }, 2500);
  }

  public triggerReload() {
    const p = this.getLocalPlayer();
    if (!p || !p.isAlive || p.isReloading || p.ammo >= p.maxAmmo) return;
    p.isReloading = true;
    const hero = HEROES[p.heroId];
    p.reloadTimer = hero.primaryWeapon.reloadTime;
  }

  public triggerMelee() {
    const p = this.getLocalPlayer();
    if (!p || !p.isAlive) return;
    sound.playHit(true);
    this.cameraShake = 0.25;
    this.applyAoeDamage(p, 4.0, 75);
  }

  private applyAoeDamage(source: Combatant, radius: number, damage: number) {
    this.roster.forEach((target) => {
      if (target.team !== source.team && target.isAlive) {
        const dx = target.position.x - source.position.x;
        const dz = target.position.z - source.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= radius) {
          this.applyDamage(source, target, damage, false);
        }
      }
    });
  }

  private spawnExplosionEffect(pos: { x: number; y: number; z: number }, colorHex: number, count: number = 20) {
    const geo = new THREE.SphereGeometry(0.18, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(geo, mat);
      p.position.set(pos.x, pos.y + 1, pos.z);
      this.scene.add(p);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        Math.random() * 8 + 2,
        (Math.random() - 0.5) * 14
      );

      // Temporary particle animation
      let pLife = 0.45;
      const step = () => {
        pLife -= 0.03;
        p.position.addScaledVector(vel, 0.03);
        if (pLife > 0 && !this.isDestroyed) {
          requestAnimationFrame(step);
        } else {
          this.scene.remove(p);
          geo.dispose();
          mat.dispose();
        }
      };
      step();
    }
  }

  private spawnProjectile(owner: Combatant, angleY: number, customDamage?: number) {
    const hero = HEROES[owner.heroId];
    const mesh = createProjectileMesh(owner.heroId);

    const spawnY = owner.position.y + (owner.heroId === 'titan' ? 1.6 : 1.3);
    const offsetX = Math.sin(angleY) * 1.0;
    const offsetZ = Math.cos(angleY) * 1.0;

    mesh.position.set(owner.position.x + offsetX, spawnY, owner.position.z + offsetZ);
    mesh.rotation.y = angleY;
    this.scene.add(mesh);

    const speed = hero.primaryWeapon.projectileSpeed;
    const vel = new THREE.Vector3(Math.sin(angleY) * speed, 0, Math.cos(angleY) * speed);

    this.projectiles.push({
      id: 'proj_' + Math.random().toString(36).substring(2, 8),
      mesh,
      ownerId: owner.id,
      team: owner.team,
      heroId: owner.heroId,
      position: mesh.position,
      velocity: vel,
      damage: customDamage || hero.primaryWeapon.damage,
      life: 0,
      maxLife: 2.2,
    });
  }

  private applyDamage(attacker: Combatant, victim: Combatant, damage: number, isHeadshot: boolean) {
    if (!victim.isAlive) return;

    let finalDamage = damage;
    if (isHeadshot) {
      finalDamage = Math.round(damage * 1.75);
    }

    // Shield absorbs first
    if (victim.shield > 0) {
      if (victim.shield >= finalDamage) {
        victim.shield -= finalDamage;
        finalDamage = 0;
      } else {
        finalDamage -= victim.shield;
        victim.shield = 0;
      }
    }

    if (finalDamage > 0) {
      victim.health = Math.max(0, victim.health - finalDamage);
    }

    attacker.stats.damageDealt += damage;

    // Give ultimate charge based on damage dealt
    attacker.ultimateCharge = Math.min(100, attacker.ultimateCharge + Math.round(damage * 0.18));

    // Audio & Feedback for local player
    if (attacker.isLocalPlayer) {
      sound.playHit(isHeadshot);
      this.onHitEvent?.(isHeadshot);
      this.cameraShake = Math.min(0.3, this.cameraShake + 0.08);
      if (isHeadshot) {
        this.hitstopTimer = 0.05; // Hitstop impact!
      }
    } else if (victim.isLocalPlayer) {
      this.cameraShake = Math.min(0.5, this.cameraShake + 0.15);
    }

    // Elimination check
    if (victim.health <= 0 && victim.isAlive) {
      victim.isAlive = false;
      victim.respawnTimer = 6.0;
      victim.stats.deaths++;
      attacker.stats.kills++;

      // Hide mesh
      const victimMesh = this.heroMeshes.get(victim.id);
      if (victimMesh) {
        victimMesh.visible = false;
      }

      // Killfeed event
      const kfEvent = createKillfeedItem(attacker, victim, isHeadshot);
      this.onKillfeedEvent?.(kfEvent);

      if (attacker.isLocalPlayer) {
        sound.playElimination();
        this.onEliminationEvent?.(victim);
      }
    }
  }

  // Player physics state
  private playerVelocityY: number = 0;
  private primaryFireTimer: number = 0;

  private startLoop() {
    const tick = () => {
      if (this.isDestroyed) return;

      const now = performance.now();
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;

      // Clamp frame delta time as required by game craft guidelines
      const dt = Math.min(rawDt, 0.05);

      // Hitstop simulation pause
      if (this.hitstopTimer > 0) {
        this.hitstopTimer -= dt;
      } else {
        this.updateSimulation(dt);
      }

      this.updateCamera(dt);
      this.renderer.render(this.scene, this.camera);

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  private updateSimulation(dt: number) {
    const player = this.getLocalPlayer();

    // 1. Update Match Timer and Capture Point
    this.updateMatchState(dt);

    if (player && player.isAlive) {
      this.updatePlayerMovement(player, dt);
      this.updatePlayerCombat(player, dt);
    }

    // 2. Update Bots AI
    this.updateBotsAI(dt);

    // 3. Update Respawns
    this.updateRespawns(dt);

    // 4. Update Projectiles
    this.updateProjectiles(dt);

    // 5. Update Jump Pads
    this.checkJumpPads();

    // 6. Notify React UI
    if (player) {
      this.onStateUpdate?.(player, this.matchState);
    }
  }

  private updatePlayerMovement(player: Combatant, dt: number) {
    const hero = HEROES[player.heroId];

    // Combine touch joystick and keyboard WASD
    let inputX = this.moveVector.x;
    let inputZ = this.moveVector.y;

    if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) inputX -= 1;
    if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) inputX += 1;
    if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) inputZ += 1;
    if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) inputZ -= 1;

    // Normalize
    const len = Math.sqrt(inputX * inputX + inputZ * inputZ);
    if (len > 1) {
      inputX /= len;
      inputZ /= len;
    }

    // Camera relative direction
    const forwardX = Math.sin(this.cameraYaw);
    const forwardZ = Math.cos(this.cameraYaw);
    const rightX = Math.cos(this.cameraYaw);
    const rightZ = -Math.sin(this.cameraYaw);

    const moveX = (rightX * inputX + forwardX * inputZ) * hero.speed * dt;
    const moveZ = (rightZ * inputX + forwardZ * inputZ) * hero.speed * dt;

    // Target position candidate
    const nextX = player.position.x + moveX;
    const nextZ = player.position.z + moveZ;

    // Bounds limit (stay inside arena radius 52)
    const distFromCenter = Math.sqrt(nextX * nextX + nextZ * nextZ);
    if (distFromCenter < 52) {
      player.position.x = nextX;
      player.position.z = nextZ;
    }

    // Gravity & Vertical physics
    this.playerVelocityY -= 24 * dt;
    player.position.y += this.playerVelocityY * dt;

    if (player.position.y <= 0) {
      player.position.y = 0;
      this.playerVelocityY = 0;
    }

    // Face camera direction
    player.rotationY = this.cameraYaw;

    // Update 3D mesh
    const mesh = this.heroMeshes.get(player.id);
    if (mesh) {
      mesh.position.set(player.position.x, player.position.y, player.position.z);
      mesh.rotation.y = player.rotationY;
    }
  }

  private updatePlayerCombat(player: Combatant, dt: number) {
    const hero = HEROES[player.heroId];

    // Reload timer
    if (player.isReloading) {
      player.reloadTimer -= dt;
      if (player.reloadTimer <= 0) {
        player.isReloading = false;
        player.ammo = player.maxAmmo;
      }
    }

    // Ability cooldowns
    if (player.ability1Cooldown > 0) player.ability1Cooldown -= dt;
    if (player.ability2Cooldown > 0) player.ability2Cooldown -= dt;

    // Passive Ultimate charge generation
    player.ultimateCharge = Math.min(100, player.ultimateCharge + dt * 1.5);

    // Primary weapon fire
    this.primaryFireTimer -= dt;
    const isWantsFire = this.isFiring || this.settings.autoFire;

    if (isWantsFire && !player.isReloading && player.ammo > 0 && this.primaryFireTimer <= 0) {
      this.primaryFireTimer = 1 / hero.primaryWeapon.fireRate;
      player.ammo--;

      sound.playPrimaryFire(player.heroId);
      this.spawnProjectile(player, this.cameraYaw);

      if (player.ammo <= 0) {
        this.triggerReload();
      }
    }
  }

  private updateBotsAI(dt: number) {
    this.roster.forEach((bot) => {
      if (bot.isLocalPlayer || !bot.isAlive) return;

      const hero = HEROES[bot.heroId];

      // Cooldowns
      if (bot.ability1Cooldown > 0) bot.ability1Cooldown -= dt;
      if (bot.ability2Cooldown > 0) bot.ability2Cooldown -= dt;

      // Find nearest opposing target
      let target: Combatant | null = null;
      let minDist = 999;

      for (const other of this.roster) {
        if (other.team !== bot.team && other.isAlive) {
          const dx = other.position.x - bot.position.x;
          const dz = other.position.z - bot.position.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < minDist) {
            minDist = d;
            target = other;
          }
        }
      }

      // Target direction (either toward enemy or toward center objective point)
      let destX = 0;
      let destZ = 0;

      if (target && minDist < 28) {
        destX = target.position.x;
        destZ = target.position.z;

        // Aim towards target
        const aimAngle = Math.atan2(destX - bot.position.x, destZ - bot.position.z);
        bot.rotationY = aimAngle;

        // Bot primary firing
        if (Math.random() < 0.04) {
          this.spawnProjectile(bot, aimAngle);
        }

        // Random bot ability usage
        if (bot.ability1Cooldown <= 0 && Math.random() < 0.01) {
          bot.ability1Cooldown = hero.ability1.cooldown;
        }
      } else {
        // Move towards center point
        destX = 0;
        destZ = 0;
      }

      // Move toward destination if too far
      const dx = destX - bot.position.x;
      const dz = destZ - bot.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 6) {
        const speed = hero.speed * 0.75 * dt;
        bot.position.x += (dx / dist) * speed;
        bot.position.z += (dz / dist) * speed;
        bot.rotationY = Math.atan2(dx, dz);
      }

      // Update mesh
      const mesh = this.heroMeshes.get(bot.id);
      if (mesh) {
        mesh.visible = true;
        mesh.position.set(bot.position.x, bot.position.y, bot.position.z);
        mesh.rotation.y = bot.rotationY;
      }
    });
  }

  private updateRespawns(dt: number) {
    this.roster.forEach((c) => {
      if (!c.isAlive) {
        c.respawnTimer -= dt;
        if (c.respawnTimer <= 0) {
          c.isAlive = true;
          const hero = HEROES[c.heroId];
          c.health = hero.health;
          c.shield = hero.shield;
          c.ammo = hero.primaryWeapon.ammo;
          c.isReloading = false;

          // Spawn location
          const spawnZ = c.team === 'blue' ? 24 : -24;
          c.position.x = (Math.random() - 0.5) * 16;
          c.position.y = 0;
          c.position.z = spawnZ;

          const mesh = this.heroMeshes.get(c.id);
          if (mesh) {
            mesh.visible = true;
            mesh.position.set(c.position.x, 0, c.position.z);
          }
        }
      }
    });
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life += dt;
      p.position.addScaledVector(p.velocity, dt);

      // Check collision with enemy combatants
      let hit = false;
      for (const combatant of this.roster) {
        if (combatant.team !== p.team && combatant.isAlive) {
          const hitRadius = combatant.heroId === 'titan' ? 1.4 : 1.0;
          const targetY = combatant.position.y + 1.2;

          const dx = p.position.x - combatant.position.x;
          const dy = p.position.y - targetY;
          const dz = p.position.z - combatant.position.z;
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < hitRadius * hitRadius) {
            hit = true;
            const attacker = this.roster.find((c) => c.id === p.ownerId) || combatant;
            const isHeadshot = dy > 0.45;
            this.applyDamage(attacker, combatant, p.damage, isHeadshot);
            this.spawnExplosionEffect(p.position, isHeadshot ? 0xff0000 : 0x00d2ff, 12);
            break;
          }
        }
      }

      // Check range or out of bounds
      if (hit || p.life >= p.maxLife || Math.abs(p.position.x) > 60 || Math.abs(p.position.z) > 60) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        if (Array.isArray(p.mesh.material)) {
          p.mesh.material.forEach((m) => m.dispose());
        } else {
          p.mesh.material.dispose();
        }
        this.projectiles.splice(i, 1);
      }
    }
  }

  private checkJumpPads() {
    const player = this.getLocalPlayer();
    if (!player || !player.isAlive) return;

    this.jumpPads.forEach((pad) => {
      const dx = player.position.x - pad.position.x;
      const dz = player.position.z - pad.position.z;
      if (dx * dx + dz * dz < 4.0 && player.position.y < 0.5) {
        this.playerVelocityY = 18; // Super jump!
        sound.playJump();
        this.cameraShake = 0.3;
      }
    });
  }

  private updateMatchState(dt: number) {
    if (this.matchState.status !== 'playing') return;

    this.matchState.matchTimer -= dt;

    // Count players on capture point (radius 8m around center 0,0)
    let blueInPoint = 0;
    let redInPoint = 0;

    this.roster.forEach((c) => {
      if (c.isAlive) {
        const distSq = c.position.x * c.position.x + c.position.z * c.position.z;
        if (distSq <= 64) {
          if (c.team === 'blue') blueInPoint++;
          else redInPoint++;
        }
      }
    });

    // Check contest
    this.matchState.isContested = blueInPoint > 0 && redInPoint > 0;

    if (!this.matchState.isContested) {
      if (blueInPoint > 0) {
        this.matchState.captureTeam = 'blue';
        this.matchState.blueCapturePercent = Math.min(100, this.matchState.blueCapturePercent + dt * 4.5);
      } else if (redInPoint > 0) {
        this.matchState.captureTeam = 'red';
        this.matchState.redCapturePercent = Math.min(100, this.matchState.redCapturePercent + dt * 4.5);
      }
    }

    // Win conditions
    if (this.matchState.blueCapturePercent >= 100) {
      this.matchState.status = 'victory';
      sound.playVictory();
    } else if (this.matchState.redCapturePercent >= 100 || this.matchState.matchTimer <= 0) {
      this.matchState.status = 'defeat';
      sound.playDefeat();
    }

    // Rotate capture point rings
    if (this.capturePointMesh) {
      this.capturePointMesh.rotation.y += dt * 0.4;
    }
  }

  private updateCamera(dt: number) {
    const player = this.getLocalPlayer();
    if (!player) return;

    // Apply touch aim delta or mouse aim
    const sens = this.settings.touchSensitivity * 0.0035;
    this.cameraYaw -= this.aimDelta.x * sens;
    this.cameraPitch = Math.max(-0.4, Math.min(0.7, this.cameraPitch - this.aimDelta.y * sens));

    // Reset delta
    this.aimDelta.x = 0;
    this.aimDelta.y = 0;

    // Camera shake decay
    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - dt * 2.0);
    }
    const shakeOffsetX = (Math.random() - 0.5) * this.cameraShake * 0.5;
    const shakeOffsetY = (Math.random() - 0.5) * this.cameraShake * 0.5;

    // Ideal camera position behind player (over-the-shoulder Marvel Rivals style)
    const shoulderOffsetRight = 0.9;
    const targetX = player.position.x - Math.sin(this.cameraYaw) * this.cameraDist + Math.cos(this.cameraYaw) * shoulderOffsetRight;
    const targetY = player.position.y + 2.0 + Math.sin(this.cameraPitch) * this.cameraDist;
    const targetZ = player.position.z - Math.cos(this.cameraYaw) * this.cameraDist - Math.sin(this.cameraYaw) * shoulderOffsetRight;

    _camTarget.set(targetX + shakeOffsetX, Math.max(0.6, targetY + shakeOffsetY), targetZ);

    // Smooth damping for camera position
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camTarget.x, 14, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camTarget.y, 14, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _camTarget.z, 14, dt);

    // Camera look target (head height with over-the-shoulder offset)
    _lookTarget.set(
      player.position.x + Math.sin(this.cameraYaw) * 15,
      player.position.y + 1.6 - Math.sin(this.cameraPitch) * 10,
      player.position.z + Math.cos(this.cameraYaw) * 15
    );

    this.camera.lookAt(_lookTarget);
  }

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    }
  }
}
