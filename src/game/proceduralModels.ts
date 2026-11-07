import * as THREE from 'three';
import { HeroId } from './types';
import { HEROES } from './heroes';

/**
 * Procedural Canvas Texture Generator for Comic Superhero Arena
 */
export function createGridTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark slate cyber-blue base
  ctx.fillStyle = '#0a1024';
  ctx.fillRect(0, 0, 512, 512);

  // Hexagonal and grid lines
  ctx.strokeStyle = '#1d3557';
  ctx.lineWidth = 2;

  const step = 64;
  for (let x = 0; x <= 512; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Cyan crosshair dots at intersections
  ctx.fillStyle = '#00d2ff';
  for (let x = 0; x <= 512; x += step) {
    for (let y = 0; y <= 512; y += step) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Comic border accent
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Create Capture Point Hologram Texture
 */
export function createCaptureRingTexture(colorHex: string = '#00d2ff'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  // Concentric comic glowing rings
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(128, 128, 110, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(128, 128, 85, 0, Math.PI * 2);
  ctx.stroke();

  // Cross lines
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(128, 10);
  ctx.lineTo(128, 246);
  ctx.moveTo(10, 128);
  ctx.lineTo(246, 128);
  ctx.stroke();

  // Central glowing core
  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 60);
  grad.addColorStop(0, colorHex);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 128, 60, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Composite Procedural Hero Model (3-12 parts)
 * Bottom-center grounded pivot at Y=0.
 */
export function createHeroMesh(heroId: HeroId, team: 'blue' | 'red'): THREE.Group {
  const group = new THREE.Group();
  group.name = `hero_${heroId}_${team}`;

  const hero = HEROES[heroId];
  const teamColor = team === 'blue' ? 0x2563eb : 0xdc2626;
  const teamAccent = team === 'blue' ? 0x60a5fa : 0xf87171;

  // Shared hero materials with varied roughness / metalness
  const armorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(hero.color),
    metalness: 0.65,
    roughness: 0.25,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: teamColor,
    metalness: 0.8,
    roughness: 0.35,
  });

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.5,
    roughness: 0.7,
  });

  const glowMat = new THREE.MeshStandardMaterial({
    color: teamAccent,
    emissive: new THREE.Color(hero.accentColor),
    emissiveIntensity: 0.8,
    roughness: 0.1,
  });

  // Scale multiplier for Titan (larger tank hit box) vs others
  const scale = heroId === 'titan' ? 1.35 : 1.0;
  const bodyRoot = new THREE.Group();
  bodyRoot.scale.set(scale, scale, scale);

  // 1. Torso / Main Chassis
  const torsoGeo = heroId === 'titan'
    ? new THREE.BoxGeometry(1.2, 1.1, 0.9)
    : new THREE.BoxGeometry(0.8, 0.95, 0.6);
  const torso = new THREE.Mesh(torsoGeo, armorMat);
  torso.position.y = 1.35;
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyRoot.add(torso);

  // 2. Chest Arc Reactor / Core Sigil (Accent glow)
  const coreGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.15, 16);
  coreGeo.rotateX(Math.PI / 2);
  const core = new THREE.Mesh(coreGeo, glowMat);
  core.position.set(0, 1.45, 0.32);
  bodyRoot.add(core);

  // 3. Head & Helmet with glowing Visor
  const headGeo = new THREE.BoxGeometry(0.48, 0.5, 0.52);
  const head = new THREE.Mesh(headGeo, secondaryMat);
  head.position.y = 2.05;
  head.castShadow = true;

  const visorGeo = new THREE.BoxGeometry(0.38, 0.14, 0.1);
  const visor = new THREE.Mesh(visorGeo, glowMat);
  visor.position.set(0, 2.06, 0.26);
  head.add(visor);
  bodyRoot.add(head);

  // 4. Heavy Shoulder Pauldrons (Left & Right)
  const pauldronGeo = heroId === 'titan'
    ? new THREE.BoxGeometry(0.55, 0.55, 0.6)
    : new THREE.BoxGeometry(0.36, 0.32, 0.42);
  
  const leftPauldron = new THREE.Mesh(pauldronGeo, secondaryMat);
  leftPauldron.position.set(-0.62, 1.7, 0);
  leftPauldron.castShadow = true;
  bodyRoot.add(leftPauldron);

  const rightPauldron = new THREE.Mesh(pauldronGeo, secondaryMat);
  rightPauldron.position.set(0.62, 1.7, 0);
  rightPauldron.castShadow = true;
  bodyRoot.add(rightPauldron);

  // 5. Arms & Weapon Gauntlets
  const armGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.7, 8);
  const leftArm = new THREE.Mesh(armGeo, darkTrimMat);
  leftArm.position.set(-0.6, 1.25, 0);
  leftArm.castShadow = true;
  bodyRoot.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, darkTrimMat);
  rightArm.position.set(0.6, 1.25, 0);
  rightArm.castShadow = true;
  bodyRoot.add(rightArm);

  // Weapon attachment on right hand
  let weaponMesh: THREE.Mesh;
  if (heroId === 'titan') {
    // Massive hammer
    const hammerGeo = new THREE.BoxGeometry(0.35, 0.6, 0.8);
    weaponMesh = new THREE.Mesh(hammerGeo, glowMat);
    weaponMesh.position.set(0.7, 0.9, 0.4);
  } else if (heroId === 'shadow') {
    // Void blade
    const bladeGeo = new THREE.BoxGeometry(0.08, 0.85, 0.25);
    weaponMesh = new THREE.Mesh(bladeGeo, glowMat);
    weaponMesh.position.set(0.68, 0.95, 0.3);
  } else {
    // Energy blaster cannon / rifle
    const blasterGeo = new THREE.CylinderGeometry(0.1, 0.14, 0.65, 8);
    blasterGeo.rotateX(Math.PI / 2);
    weaponMesh = new THREE.Mesh(blasterGeo, armorMat);
    weaponMesh.position.set(0.65, 1.05, 0.35);
  }
  weaponMesh.castShadow = true;
  bodyRoot.add(weaponMesh);

  // 6. Pelvis & Armored Legs (Left & Right grounded)
  const pelvisGeo = new THREE.BoxGeometry(0.65, 0.25, 0.5);
  const pelvis = new THREE.Mesh(pelvisGeo, darkTrimMat);
  pelvis.position.y = 0.8;
  bodyRoot.add(pelvis);

  const legGeo = new THREE.CylinderGeometry(0.16, 0.14, 0.75, 8);
  const leftLeg = new THREE.Mesh(legGeo, armorMat);
  leftLeg.position.set(-0.25, 0.45, 0);
  leftLeg.castShadow = true;
  bodyRoot.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, armorMat);
  rightLeg.position.set(0.25, 0.45, 0);
  rightLeg.castShadow = true;
  bodyRoot.add(rightLeg);

  // Boots
  const bootGeo = new THREE.BoxGeometry(0.24, 0.16, 0.38);
  const leftBoot = new THREE.Mesh(bootGeo, darkTrimMat);
  leftBoot.position.set(-0.25, 0.08, 0.06);
  bodyRoot.add(leftBoot);

  const rightBoot = new THREE.Mesh(bootGeo, darkTrimMat);
  rightBoot.position.set(0.25, 0.08, 0.06);
  bodyRoot.add(rightBoot);

  // 7. Hero Signature Back Item (Wings / Exhaust / Cape / Crystals)
  if (heroId === 'volt') {
    // Twin jet thruster wings
    const wingGeo = new THREE.BoxGeometry(0.8, 0.15, 0.08);
    wingGeo.rotateZ(0.2);
    const leftWing = new THREE.Mesh(wingGeo, glowMat);
    leftWing.position.set(-0.45, 1.6, -0.35);
    bodyRoot.add(leftWing);

    const rightWing = leftWing.clone();
    rightWing.rotation.z = -0.2;
    rightWing.position.set(0.45, 1.6, -0.35);
    bodyRoot.add(rightWing);
  } else if (heroId === 'frost') {
    // Floating cryo crystal ring
    const cryoGeo = new THREE.OctahedronGeometry(0.22);
    const cryo = new THREE.Mesh(cryoGeo, glowMat);
    cryo.position.set(0, 2.5, -0.2);
    bodyRoot.add(cryo);
  } else if (heroId === 'phantom') {
    // Orbiting astral torus
    const ringGeo = new THREE.TorusGeometry(0.6, 0.04, 8, 24);
    const astralRing = new THREE.Mesh(ringGeo, glowMat);
    astralRing.position.set(0, 1.6, -0.1);
    bodyRoot.add(astralRing);
  }

  // 8. Ground Contact Shadow
  const shadowGeo = new THREE.PlaneGeometry(1.6 * scale, 1.6 * scale);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.position.y = 0.02; // Prevents Z-fighting
  bodyRoot.add(contactShadow);

  group.add(bodyRoot);
  return group;
}

/**
 * Create dynamic sci-fi hero colosseum arena
 */
export function createArenaEnvironment(): {
  environmentGroup: THREE.Group;
  capturePoint: THREE.Group;
  jumpPads: THREE.Mesh[];
  coverObstacles: THREE.Box3[];
} {
  const envGroup = new THREE.Group();
  envGroup.name = 'arena_environment';
  const coverObstacles: THREE.Box3[] = [];
  const jumpPads: THREE.Mesh[] = [];

  // 1. Arena Main Floor with high-res procedural grid
  const floorGeo = new THREE.PlaneGeometry(120, 120);
  floorGeo.rotateX(-Math.PI / 2);
  const floorTex = createGridTexture();
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.7,
    metalness: 0.2,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.receiveShadow = true;
  envGroup.add(floor);

  // Outer extended terrain (prevents floating box void)
  const outerTerrainGeo = new THREE.PlaneGeometry(280, 280);
  outerTerrainGeo.rotateX(-Math.PI / 2);
  const outerTerrainMat = new THREE.MeshStandardMaterial({
    color: 0x060b18,
    roughness: 0.9,
    metalness: 0.1,
  });
  const outerTerrain = new THREE.Mesh(outerTerrainGeo, outerTerrainMat);
  outerTerrain.position.y = -0.1;
  envGroup.add(outerTerrain);

  // 2. Center Objective Capture Point
  const cpGroup = new THREE.Group();
  cpGroup.name = 'capture_point';
  cpGroup.position.set(0, 0.05, 0);

  const ringGeo = new THREE.PlaneGeometry(16, 16);
  ringGeo.rotateX(-Math.PI / 2);
  const ringTex = createCaptureRingTexture('#00d2ff');
  const ringMat = new THREE.MeshBasicMaterial({
    map: ringTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  cpGroup.add(ringMesh);

  // Central Hologram Beacon Pillar
  const beaconGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 16);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35,
    wireframe: true,
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.y = 4;
  cpGroup.add(beacon);

  envGroup.add(cpGroup);

  // 3. Tactical Cover Obstacles & Energy Columns
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.75,
    roughness: 0.25,
  });
  const neonTrimMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x00d2ff,
    emissiveIntensity: 0.6,
    roughness: 0.2,
  });

  const pillarLocations = [
    { x: -14, z: -10, w: 4, h: 5, d: 4 },
    { x: 14, z: -10, w: 4, h: 5, d: 4 },
    { x: -14, z: 10, w: 4, h: 5, d: 4 },
    { x: 14, z: 10, w: 4, h: 5, d: 4 },
    { x: -25, z: 0, w: 5, h: 4, d: 8 },
    { x: 25, z: 0, w: 5, h: 4, d: 8 },
    { x: 0, z: -28, w: 10, h: 4, d: 4 },
    { x: 0, z: 28, w: 10, h: 4, d: 4 },
  ];

  pillarLocations.forEach((loc) => {
    const colGroup = new THREE.Group();
    colGroup.position.set(loc.x, 0, loc.z);

    const colMesh = new THREE.Mesh(new THREE.BoxGeometry(loc.w, loc.h, loc.d), pillarMat);
    colMesh.position.y = loc.h / 2;
    colMesh.castShadow = true;
    colMesh.receiveShadow = true;
    colGroup.add(colMesh);

    // Glowing energy core band
    const bandMesh = new THREE.Mesh(new THREE.BoxGeometry(loc.w + 0.1, 0.4, loc.d + 0.1), neonTrimMat);
    bandMesh.position.y = loc.h / 2;
    colGroup.add(bandMesh);

    envGroup.add(colGroup);

    // Add bounding box for collision detection
    coverObstacles.push(
      new THREE.Box3(
        new THREE.Vector3(loc.x - loc.w / 2, 0, loc.z - loc.d / 2),
        new THREE.Vector3(loc.x + loc.w / 2, loc.h, loc.z + loc.d / 2)
      )
    );
  });

  // 4. Holographic Jump Pads (superhero mobility)
  const jumpPadLocations = [
    { x: -18, z: 18 },
    { x: 18, z: 18 },
    { x: -18, z: -18 },
    { x: 18, z: -18 },
  ];

  const padGeo = new THREE.CylinderGeometry(2.0, 2.2, 0.3, 24);
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0x10b981,
    emissiveIntensity: 0.7,
    roughness: 0.3,
  });

  jumpPadLocations.forEach((pos) => {
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(pos.x, 0.15, pos.z);
    pad.receiveShadow = true;
    pad.userData = { isJumpPad: true };
    envGroup.add(pad);
    jumpPads.push(pad);
  });

  // 5. Natural / Sci-Fi Perimeter Hologram Boundary
  const perimeterRadius = 55;
  const barrierGeo = new THREE.CylinderGeometry(perimeterRadius, perimeterRadius, 10, 32, 1, true);
  const barrierMat = new THREE.MeshBasicMaterial({
    color: 0x0284c7,
    wireframe: true,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
  });
  const barrier = new THREE.Mesh(barrierGeo, barrierMat);
  barrier.position.y = 5;
  envGroup.add(barrier);

  return {
    environmentGroup: envGroup,
    capturePoint: cpGroup,
    jumpPads,
    coverObstacles,
  };
}

/**
 * Create dynamic projectile mesh
 */
export function createProjectileMesh(heroId: HeroId): THREE.Mesh {
  let geo: THREE.BufferGeometry;
  let color = 0x00d2ff;

  switch (heroId) {
    case 'volt':
      geo = new THREE.SphereGeometry(0.28, 8, 8);
      color = 0x38bdf8;
      break;
    case 'titan':
      geo = new THREE.BoxGeometry(0.5, 0.5, 0.6);
      color = 0xf97316;
      break;
    case 'shadow':
      geo = new THREE.CylinderGeometry(0.35, 0.35, 0.05, 5);
      geo.rotateX(Math.PI / 2);
      color = 0xa855f7;
      break;
    case 'frost':
      geo = new THREE.ConeGeometry(0.22, 0.8, 6);
      geo.rotateX(-Math.PI / 2);
      color = 0x7dd3fc;
      break;
    case 'nova':
      geo = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8);
      geo.rotateX(Math.PI / 2);
      color = 0xfacc15;
      break;
    case 'phantom':
    default:
      geo = new THREE.IcosahedronGeometry(0.32, 1);
      color = 0x34d399;
      break;
  }

  const mat = new THREE.MeshBasicMaterial({
    color,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = false;
  return mesh;
}
