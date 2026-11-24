// MISSION 01 "AZURE COAST" — planet Aquelia: sunset ocean → red-rock canyon → fortress → sea-dragon boss MIZUCHI.
// Everything that belongs to this mission lives here: the course, height field, ground colours, decorations,
// sky palettes, the event script, boss radio, clear lines and result rules. The engine reads it as a stage
// definition (field list in src/stages/index.js).
import * as THREE from 'three';
import { G, rand, lerp, smoothstep, Simplex2, fbm2, ridged2, mulberry32, hash2, emit, after } from '../core.js';
import { spawnEnemy, makeGroup } from '../enemies.js';
import { scheduleProp, spawnProp } from '../props.js';
import { radio, tip, warning, addMarker } from '../hud.js';
import { WING, setWingStance, holdOut, kotaOr } from '../wingmen.js';
import { AudioSys } from '../audio.js';
import { crossView } from '../flyby.js';
import { D, K, vWing, snake, fromBehind, holders, ringOf, crossing, divers, turret, mine } from '../level.js';

// ============================================================ Zones & rail path
const ZONE = { canyonStart: 4400, canyonEnd: 8000, fortStart: 8000, fortEnd: 10400, boss: 10900 };
const _zw = { ocean: 1, canyon: 0, fort: 0, boss: 0 };
function zoneW(d, out = _zw) {
  const cIn = smoothstep(4400, 5000, d), cOut = smoothstep(7700, 8300, d), fOut = smoothstep(10300, 10900, d);
  out.canyon = cIn * (1 - cOut);
  out.fort = cOut * (1 - fOut);
  out.boss = fOut;
  out.ocean = Math.max(0, 1 - out.canyon - out.fort - out.boss);
  return out;
}

const _pw = { ocean: 1, canyon: 0, fort: 0, boss: 0 };
function pathX(d) {
  const w = zoneW(d, _pw);
  let x = 0;
  if (w.ocean > 0) x += w.ocean * (55 * Math.sin(d * 0.0011 + 0.6) + 22 * Math.sin(d * 0.0023 + 2.0));
  if (w.canyon > 0) x += w.canyon * (125 * Math.sin((d - 4400) * 0.0017) + 38 * Math.sin(d * 0.0041));
  if (w.fort > 0) x += w.fort * (40 * Math.sin(d * 0.0013));
  return x;
}

// ============================================================ Terrain height field
const N1 = new Simplex2(1337), N2 = new Simplex2(4242), N3 = new Simplex2(777), N4 = new Simplex2(2024);

function oceanH(x, z, adx) {
  let h = -24 + 7 * N2.noise(x * 0.01, z * 0.01);
  const n = fbm2(N1, x * 0.0028, z * 0.0028, 4);
  const isl = smoothstep(0.1, 0.48, n);
  if (isl > 0) {
    const detail = fbm2(N2, x * 0.013, z * 0.013, 3) * 0.5 + 0.5;
    const peak = 26 + 80 * ridged2(N3, x * 0.004, z * 0.004, 3);
    const corridor = smoothstep(50, 210, adx);
    h += isl * (26 + peak * detail) * lerp(0.3, 1, corridor) + isl * 3;
  }
  const far = smoothstep(650, 1500, adx);
  if (far > 0) h = Math.max(h, lerp(h, 30 + 280 * ridged2(N4, x * 0.0011, z * 0.0011, 4), far));
  return h;
}

function canyonH(x, z, adx, d) {
  const halfW = 60 + 20 * Math.sin(d * 0.0029 + 1.0) + 7 * N1.noise(d * 0.006, 7.7);
  const wallT = smoothstep(halfW, halfW + 34, adx + 5 * N2.noise(x * 0.02, z * 0.02));
  const floor = -5 + 2.5 * N2.noise(x * 0.04, z * 0.04);
  const plateau = 118 + 45 * fbm2(N3, x * 0.003, z * 0.003, 3) + 30 * smoothstep(250, 650, adx);
  let h = lerp(floor, plateau, wallT);
  if (wallT > 0.01 && wallT < 0.995) {
    const step = 13;
    const t = h / step, fl = Math.floor(t), fr = t - fl;
    h = lerp(h, (fl + smoothstep(0.55, 0.92, fr)) * step, 0.7);
  }
  h += fbm2(N4, x * 0.035, z * 0.035, 2) * 5 * wallT;
  const far = smoothstep(500, 1400, adx);
  if (far > 0) h += far * 150 * ridged2(N1, x * 0.0015, z * 0.0015, 3);
  return h;
}

function fortH(x, z, adx) {
  let h = 1.4;
  h += smoothstep(92, 97, adx) * 5;                                   // raised decks
  h += smoothstep(176, 180, adx) * (1 - smoothstep(196, 200, adx)) * 30; // outer walls
  const far = smoothstep(320, 950, adx);
  if (far > 0) h = lerp(h, 25 + 170 * ridged2(N3, x * 0.0016, z * 0.0016, 4), far);
  return h;
}

function bossH(x, z, adx) {
  let h = -30 + 6 * N2.noise(x * 0.008, z * 0.008);
  const far = smoothstep(900, 1700, adx);
  if (far > 0) h = lerp(h, 20 + 240 * ridged2(N4, x * 0.001, z * 0.001, 4), far);
  return h;
}

const _hw = { ocean: 1, canyon: 0, fort: 0, boss: 0 };
function terrainHeight(x, z) {
  const d = -z;
  const adx = Math.abs(x - pathX(d));
  const w = zoneW(d, _hw);
  let h = 0;
  if (w.ocean > 0.001) h += w.ocean * oceanH(x, z, adx);
  if (w.canyon > 0.001) h += w.canyon * canyonH(x, z, adx, d);
  if (w.fort > 0.001) h += w.fort * fortH(x, z, adx);
  if (w.boss > 0.001) h += w.boss * bossH(x, z, adx);
  return h;
}

// ============================================================ Ground colours
const _cw = { ocean: 1, canyon: 0, fort: 0, boss: 0 };
const _col = new THREE.Color();
const PAL = {
  deep: new THREE.Color('#1f4a4f'), shallow: new THREE.Color('#3f7d6f'), sand: new THREE.Color('#e3cf98'),
  grass: new THREE.Color('#5e8f35'), grass2: new THREE.Color('#7aa845'), rock: new THREE.Color('#7b6f63'), rock2: new THREE.Color('#948a7c'),
  peak: new THREE.Color('#c8c2ba'), snow: new THREE.Color('#f1f3f6'),
  bed: new THREE.Color('#5b4636'),
  strata: ['#b4532f', '#d27b45', '#e6a468', '#9b4528', '#d98c57', '#c36a3b'].map(c => new THREE.Color(c)),
  mesa: new THREE.Color('#b27b4a'), scrub: new THREE.Color('#7e8a45'),
  metal: new THREE.Color('#2e333b'), metalLine: new THREE.Color('#4d5561'), runway: new THREE.Color('#262a31'), deck: new THREE.Color('#474d57'), wall: new THREE.Color('#2b2f37'),
  hazard: new THREE.Color('#d9a02a'), duskRock: new THREE.Color('#5d4a60'), duskPeak: new THREE.Color('#8a7690'),
};

function faceColor(x, y, z, ny, out) {
  const w = zoneW(-z, _cw);
  const jitter = 0.9 + 0.2 * hash2(Math.floor(x * 3.1), Math.floor(z * 2.7));
  let r = 0, g = 0, b = 0;
  const add = (c, k) => { r += c.r * k; g += c.g * k; b += c.b * k; };
  if (w.ocean + w.boss > 0.001) {
    const k = w.ocean + w.boss;
    let c;
    if (y < -9) c = PAL.deep;
    else if (y < -0.8) c = _col.copy(PAL.deep).lerp(PAL.shallow, (y + 9) / 8.2);
    else if (y < 2.6) c = PAL.sand;
    else if (y > 230) c = PAL.snow;
    else if (y > 140) c = PAL.peak;
    else if (ny < 0.72) c = (hash2(x | 0, z | 0) > 0.5 ? PAL.rock : PAL.rock2);
    else c = (y > 40 && ny < 0.86) ? PAL.rock2 : (hash2((x * 0.2) | 0, (z * 0.2) | 0) > 0.5 ? PAL.grass : PAL.grass2);
    add(c === _col ? _col : c, k);
  }
  if (w.canyon > 0.001) {
    let c;
    if (y < 0.5) c = PAL.bed;
    else if (ny > 0.9 && y > 80) c = hash2((x * 0.1) | 0, (z * 0.1) | 0) > 0.8 ? PAL.scrub : PAL.mesa;
    else {
      const band = Math.floor((y + 4 * N3.noise(x * 0.01, z * 0.01)) / 9);
      c = PAL.strata[((band % 6) + 6) % 6];
    }
    add(c, w.canyon);
  }
  if (w.fort > 0.001) {
    let c;
    if (y > 40) c = ny > 0.8 ? PAL.duskPeak : PAL.duskRock;
    else if (y > 20) c = PAL.wall;
    else if (y > 4) c = PAL.deck;
    else {
      // city-block pattern: dark service roads every 48 m, lighter deck plates in between
      const lx = x - pathX(-z);
      const bx = Math.floor(lx / 8), bz = Math.floor(z / 8);
      const road = (((bx % 6) + 6) % 6 === 0) || (((bz % 6) + 6) % 6 === 0);
      c = Math.abs(lx) < 10 ? PAL.runway : road ? PAL.metal : PAL.metalLine;
    }
    add(c, w.fort);
  }
  out.setRGB(r * jitter, g * jitter, b * jitter);
  return out;
}

// ============================================================ Decorations (trees, rocks, buildings)
// Called for each terrain chunk; KIT holds the shared geometries/materials from world.js. Returns the meshes it added.
function decorate(ci, KIT) {
  const { CHUNK, treeGeo, rockGeo, bldgGeo, decoMat, bldgMat, lightGeo, lightGeoCyan, lightMat } = KIT;
  const list = [];
  const rnd = mulberry32(ci * 7919 + 13);
  const d0 = ci * CHUNK;
  const w = zoneW(d0 + CHUNK / 2, { ocean: 1, canyon: 0, fort: 0, boss: 0 });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  // Trees on islands (ocean) and scrub on mesas (canyon)
  if (w.ocean + w.canyon > 0.2) {
    const trees = [];
    for (let i = 0; i < 160 && trees.length < 70; i++) {
      const d = d0 + rnd() * CHUNK;
      const lx = (rnd() * 2 - 1) * 700;
      const x = pathX(d) + lx, z = -d;
      const h = terrainHeight(x, z);
      const ok = w.canyon > 0.5 ? (h > 95 && h < 200) : (h > 3.2 && h < 70);
      if (!ok) continue;
      const hx = terrainHeight(x + 3, z), hz = terrainHeight(x, z + 3);
      if (Math.abs(hx - h) > 2.4 || Math.abs(hz - h) > 2.4) continue;
      const sc = (w.canyon > 0.5 ? 0.6 : 0.8) + rnd() * 0.9;
      q.setFromAxisAngle(up, rnd() * Math.PI * 2);
      s.set(sc, sc * (0.85 + rnd() * 0.4), sc);
      p.set(x, h - 0.4, z);
      trees.push(m4.compose(p, q, s).clone());
    }
    if (trees.length) {
      const im = new THREE.InstancedMesh(treeGeo, decoMat, trees.length);
      trees.forEach((m, i) => im.setMatrixAt(i, m));
      im.castShadow = true; im.receiveShadow = true;
      im.computeBoundingSphere();
      G.scene.add(im); list.push(im);
    }
  }
  // Rocks in canyon river / ocean shallows
  if (w.canyon > 0.3 || w.ocean > 0.3) {
    const rocks = [];
    for (let i = 0; i < 40 && rocks.length < 22; i++) {
      const d = d0 + rnd() * CHUNK;
      const lx = (rnd() * 2 - 1) * (w.canyon > 0.3 ? 70 : 500);
      const x = pathX(d) + lx, z = -d;
      const h = terrainHeight(x, z);
      if (h < -3.5 || h > (w.canyon > 0.3 ? 8 : 30)) continue;
      const sc = 0.6 + rnd() * 1.6;
      q.setFromEuler(new THREE.Euler(rnd() * 0.5, rnd() * 6.28, rnd() * 0.5));
      s.set(sc, sc, sc);
      p.set(x, h, z);
      rocks.push(m4.compose(p, q, s).clone());
    }
    if (rocks.length) {
      const im = new THREE.InstancedMesh(rockGeo, decoMat, rocks.length);
      rocks.forEach((m, i) => im.setMatrixAt(i, m));
      im.castShadow = true; im.receiveShadow = true;
      im.computeBoundingSphere();
      G.scene.add(im); list.push(im);
    }
  }
  // Fortress buildings + runway lights
  if (w.fort > 0.4) {
    const bl = [], lights = [];
    for (let i = 0; i < 14; i++) {
      const d = d0 + rnd() * CHUNK;
      const side = rnd() < 0.5 ? -1 : 1;
      const lx = side * (70 + rnd() * 95);
      const x = pathX(d) + lx, z = -d;
      const base = terrainHeight(x, z);
      const hgt = 14 + rnd() * rnd() * 70;
      const wx = 10 + rnd() * 20, wz = 10 + rnd() * 22;
      q.setFromAxisAngle(up, (rnd() - 0.5) * 0.3);
      s.set(wx, hgt, wz);
      p.set(x, base - 0.5, z);
      bl.push(m4.compose(p, q, s).clone());
      if (hgt > 40) { p.set(x, base + hgt + 1.2, z); s.set(1, 1, 1); lights.push(m4.compose(p, q, s).clone()); }
    }
    // runway lights along the corridor edges
    for (let k = 0; k < CHUNK; k += 20) {
      const d = d0 + k;
      for (const side of [-1, 1]) {
        const x = pathX(d) + side * 52, z = -d;
        p.set(x, terrainHeight(x, z) + 0.4, z); s.set(0.8, 0.5, 0.8);
        lights.push(m4.compose(p, q.identity(), s).clone());
      }
    }
    if (bl.length) {
      const im = new THREE.InstancedMesh(bldgGeo, bldgMat, bl.length);
      bl.forEach((m, i) => im.setMatrixAt(i, m));
      im.castShadow = true; im.receiveShadow = true;
      im.computeBoundingSphere();
      G.scene.add(im); list.push(im);
    }
    if (lights.length) {
      const im = new THREE.InstancedMesh(lightGeo, lightMat, lights.length);
      lights.forEach((m, i) => im.setMatrixAt(i, m));
      im.computeBoundingSphere();
      G.scene.add(im); list.push(im);
    }
    // glowing runway centre-line dashes
    const dashes = [];
    for (let k = 0; k < CHUNK; k += 16) {
      const d = d0 + k;
      const x = pathX(d), z = -d;
      const slope = (pathX(d + 2) - pathX(d - 2)) * 0.25;
      q.setFromAxisAngle(up, -Math.atan(slope));
      p.set(x, terrainHeight(x, z) + 0.25, z); s.set(1, 1, 1);
      dashes.push(m4.compose(p, q, s).clone());
    }
    const dm = new THREE.InstancedMesh(lightGeoCyan, lightMat, dashes.length);
    dashes.forEach((m, i) => dm.setMatrixAt(i, m));
    dm.computeBoundingSphere();
    G.scene.add(dm); list.push(dm);
  }
  return list;
}

// ============================================================ Sky palettes along the course
const PALETTES = {
  sunset: {
    zenith: '#2a58a6', mid: '#9dc0e8', horizon: '#ffc38c', fog: '#f0b88f', sun: '#ffd6a0', cloud: '#fff1e2', cloudShadow: '#a08aa6',
    hemiSky: '#a8c2ee', hemiGround: '#6d5242', waterDeep: '#0b3550', waterScatter: '#1d6a70', light: '#ffd9ae',
    sunElev: 11, sunAz: -38, sunDisc: 10, sunLight: 2.7, fogDensity: 0.0007, fogStart: 220, fogHeight: 0.0009, fogFalloff: 0.016,
    glow: 0.34, cloudCover: 0.36, hemi: 1.0, stars: 0, exposure: 0.92, bloom: 0.42, env: 0.85,
  },
  canyon: {
    zenith: '#3160ae', mid: '#a3c2e6', horizon: '#ffb37a', fog: '#eba47c', sun: '#ffcf96', cloud: '#ffeedd', cloudShadow: '#b08a8e',
    hemiSky: '#b4c6ea', hemiGround: '#7f4b31', waterDeep: '#1f3a3d', waterScatter: '#3d6552', light: '#ffcf98',
    sunElev: 15, sunAz: -42, sunDisc: 10, sunLight: 3.0, fogDensity: 0.00062, fogStart: 240, fogHeight: 0.0012, fogFalloff: 0.012,
    glow: 0.34, cloudCover: 0.3, hemi: 0.95, stars: 0, exposure: 0.92, bloom: 0.42, env: 0.8,
  },
  dusk: {
    zenith: '#1a1d52', mid: '#9a5c9c', horizon: '#ff8c6e', fog: '#b9657e', sun: '#ff9b6e', cloud: '#ffb0a8', cloudShadow: '#5a3a6e',
    hemiSky: '#7a78c0', hemiGround: '#3f2d40', waterDeep: '#141638', waterScatter: '#3a2b62', light: '#ffab86',
    sunElev: 4.5, sunAz: -30, sunDisc: 9, sunLight: 2.0, fogDensity: 0.0007, fogStart: 200, fogHeight: 0.001, fogFalloff: 0.014,
    glow: 0.5, cloudCover: 0.5, hemi: 1.05, stars: 0.25, exposure: 1.05, bloom: 0.58, env: 0.8,
  },
  twilight: {
    zenith: '#0b1236', mid: '#5a4696', horizon: '#e27566', fog: '#6e4c7e', sun: '#ff8456', cloud: '#e98a90', cloudShadow: '#2b2248',
    hemiSky: '#6c78c8', hemiGround: '#2c2340', waterDeep: '#0b1030', waterScatter: '#2c2c6a', light: '#ffb49a',
    sunElev: 1.4, sunAz: -24, sunDisc: 9, sunLight: 1.5, fogDensity: 0.00062, fogStart: 220, fogHeight: 0.0008, fogFalloff: 0.014,
    glow: 0.6, cloudCover: 0.35, hemi: 1.15, stars: 0.85, exposure: 1.1, bloom: 0.6, env: 0.9,
  },
};
const PALETTE_KEYS = [
  { at: 0, name: 'sunset' }, { at: 4200, name: 'sunset' }, { at: 5400, name: 'canyon' }, { at: 7400, name: 'canyon' },
  { at: 8600, name: 'dusk' }, { at: 10200, name: 'dusk' }, { at: 11300, name: 'twilight' },
];

// ============================================================ Script
const WING_REAR_AT = 640;   // the wingmen fly in front until here, then mostly behind the camera

function script(at) {
  // ===== OCEAN =====
  at(120, () => radio('hou', '여기는 호. 소속 불명기 편대를 포착했다. 전 기체, 요격하라!', { hold: 2.2 }));
  at(520, () => radio('kota', '좋았어, 간다! 대장, 확실히 따라갈게!'));
  at(330, () => tip(`${K('W')}${K('A')}${K('S')}${K('D')} / 방향키: 이동  ${K('J')} / ${K('Space')}: 샷`, 6, '왼쪽 아래를 드래그해 이동 / FIRE로 샷'));
  at(WING_REAR_AT, () => setWingStance('rear', 0.5));   // after Kota's "I'll stick with you": the squadron drops back to cover the leader
  at(700, () => { vWing('dart', 5, 760, 20, { noFire: true }); });
  at(820, () => radio('gantetsu', '전방에 적 편대. 침착하게 한 기씩 확실히 떨어뜨려라.'));
  at(1250, () => snake('dart', 5, 720, 18, 20));
  at(1400, () => { scheduleNow('ring', 1750, { u: -8, v: 18 }); });
  at(960, () => radio('rio', '전방에 링이에요. 통과하면 실드가 회복돼요.'));
  at(1700, () => { fromBehind('dart', 6); radio('kota', '뒤에서 와! 지나가게 둔 뒤에 쏴버려!', { prio: 1 }); });
  at(2150, () => crossing('dart', 5, 230, 1, 24));
  at(2350, () => radio('gantetsu', '바위 아치다. 빠져나가라!'));
  at(2500, () => { holders('raptor', 2, 170); });
  at(2560, () => { radio('gantetsu', '적 탄은 롤링으로 튕겨낼 수 있다. 기울이는 키를 재빨리 2번 눌러라!', { prio: 1 }); tip(`${K('Q')} / ${K('E')} 재빨리 2번: 롤링 (적 탄 튕겨내기)`, 7, 'ROLL 버튼: 롤링 (적 탄 튕겨내기)'); });
  at(3000, () => { ringOf('drone', 8, 190, { r: 20 }); radio('rio', '샷을 길게 눌러 차지하세요! 락온해서 한꺼번에 날려버려요!', { prio: 1 }); tip(`샷 길게 누르기 → 차지 완료 후 떼기: 락온 탄`, 7, 'FIRE 길게 누르기 → 떼기: 락온 탄'); });
  at(3400, () => { holders('carrier', 1, 150, { carry: 'laser', carryIndex: 0, stay: 8, v: 24 }); snake('dart', 3, 650, -20, 26); radio('kota', '저 수송기, 뭔가 싣고 있어! 격추해!'); });
  at(3850, () => rescueKota());
  at(4300, () => { fromBehind('interceptor', 4, { stay: 5 }); });
  at(4500, () => { radio('gantetsu', '협곡에 들어간다. 암벽에 긁히지 마라.'); tip(`${K('L')} / ${K('Shift')}: 부스트  ${K('I')} / ${K('V')}: 브레이크`, 6, 'BOOST / BRAKE 버튼으로 가속 · 감속'); });
  at(4680, () => { gunshipFlyby(); });

  // ===== CANYON =====
  at(4950, () => radio('rio', '바위 기둥이 쓰러져요! 쏘면 부서져요!', { prio: 1 }));
  at(5250, () => divers('dart', 4));
  at(5500, () => { turret(5850, -34); turret(5930, 30); turret(6010, -12); });
  at(5900, () => { holders('raptor', 1, 160, { v: 22 }); snake('dart', 4, 700, 10, 22, { au: 18 }); });
  at(6150, () => { radio('rio', '중간 지점 통과. 좋은 페이스예요, 대장.'); });
  at(6300, () => { turret(6720, -26, { onGround: false, v: 33 }); turret(6720, 26, { onGround: false, v: 33 }); radio('gantetsu', '다리 위에 포대다. 아래로 지나가거나 먼저 부숴라!'); });
  at(6700, () => { ringOf('drone', 10, 200, { r: 22, v: 30 }); });
  at(7050, () => { for (let i = 0; i < 8; i++) mine(7450 + i * 45, rand(-30, 30), rand(10, 40)); kotaOr('기뢰다! 가까이 가면 폭발해!', 'rio', '기뢰예요! 가까이 가면 폭발해요!'); });
  at(7300, () => { fromBehind('interceptor', 5); kotaOr('또 뒤야! 끈질기네, 정말!', 'gantetsu', '또 뒤다. 지나가게 둔 뒤에 쏴라.', { prio: 1 }); });
  at(7700, () => { holders('raptor', 2, 170, { v: 30 }); crossing('drone', 6, 240, -1, 20); });

  // ===== FORTRESS =====
  at(7900, () => radio('hou', '전방에 적 전선 기지를 확인. 방어망을 돌파하라!', { hold: 2 }));
  at(8150, () => { turret(8600, -60, { type: 'aagun' }); turret(8700, 60, { type: 'aagun' }); turret(8850, -58, { type: 'aagun' }); });
  at(8300, () => { divers('interceptor', 4); });
  at(8650, () => { radio('gantetsu', '에너지 게이트다! 양옆의 발생 장치를 쏴라!', { prio: 1 }); });
  at(8900, () => { vWing('dart', 7, 700, 24, { speed: 34 }); });
  at(9250, () => { turret(9600, -40); turret(9660, 40); turret(9760, 0); turret(9850, -20, { type: 'aagun' }); });
  at(9500, () => { crossing('dart', 6, 220, -1, 30); });
  at(9800, () => { fromBehind('interceptor', 6); holders('raptor', 2, 190, { v: 34 }); });
  at(10150, () => { ringOf('drone', 10, 200, { r: 24, v: 28 }); });
  at(10350, () => radio('gantetsu', '기지를 빠져나간다! 전 기체, 상승해서 바다로 나가라!'));

  // ===== BOSS =====
  at(10550, () => { radio('hou', '잠깐… 바닷속에서 거대 반응! 경계하라!', { prio: 2, hold: 1.4 }); warning(true); AudioSys.stopMusic(1.2); G.warnLoop = AudioSys.loop('siren'); });
  at(10720, () => { G.run.checkpoint = 10700; });
  at(10760, () => { warning(false); if (G.warnLoop) { G.warnLoop.stop(0.5); G.warnLoop = null; } emit('bossStart'); });

  // ----- props -----
  scheduleProp('ring', 1150, { u: 0, v: 22 });
  scheduleProp('arch', 2650, { u: 0 });
  scheduleProp('ring', 2650, { u: 0, v: 14 });
  scheduleProp('fragment', 2650, { u: 0, v: 53 });   // 槍のかけら①: over the arch instead of through it
  scheduleProp('stack', 2960, { u: -28, scale: 1 });
  scheduleProp('stack', 3080, { u: 32, scale: 1.1 });
  scheduleProp('stack', 3230, { u: 2, scale: 0.9 });
  scheduleProp('ring', 3600, { u: 20, v: 30 });
  scheduleProp('ring', 4150, { kind: 'gold', u: -34, v: 9 });
  scheduleProp('pillar', 5350, { u: 36, side: 1 });
  scheduleProp('ring', 5500, { u: 0, v: 18 });
  scheduleProp('pillar', 5750, { u: -36, side: -1 });
  scheduleProp('ring', 6100, { kind: 'check', u: 0, v: 24 });
  scheduleProp('bridge', 6720, { u: 0, v: 30 });
  scheduleProp('ring', 6720, { u: 0, v: 14 });
  scheduleProp('ring', 6900, { kind: 'gold', u: 38, v: 50 });
  scheduleProp('pillar', 7250, { u: 34, side: 1, maxAngle: 1.0 });
  scheduleProp('ring', 7600, { u: -14, v: 26 });
  scheduleProp('tower', 8400, { u: -24, h: 95 });
  scheduleProp('tower', 8520, { u: 26, h: 75 });
  scheduleProp('tower', 8640, { u: 0, h: 38 });
  scheduleProp('gate', 9050, { u: 0, w: 30 });
  scheduleProp('ring', 9250, { u: 0, v: 20 });
  scheduleProp('tower', 9450, { u: 30, h: 110 });
  scheduleProp('tower', 9560, { u: -30, h: 85 });
  scheduleProp('gate', 9900, { u: 0, w: 28 });
  scheduleProp('ring', 10000, { kind: 'gold', u: 0, v: 56 });
  scheduleProp('ring', 10300, { u: 0, v: 26 });
}

function scheduleNow(type, s, o) { spawnProp(type, s, o); }

// Gunship crossing overhead, carrying a bomb
function gunshipFlyby() {
  spawnEnemy('gunship', 'flyby', { s: D() + 900, dist: 260, enter: 4, close: 3, u0: 80, su: -8, v: 40, life: 20 }, { carry: 'bomb' });
  radio('gantetsu', '대형함이다! 포격에 주의하면서 집중 공격하라!', { prio: 1 });
  tip(`대형함에는 ${K('K')} / ${K('B')} 스마트 봄이 효과적`, 5, '대형함에는 BOMB이 효과적');
}

// Wingman rescue event
function rescueKota() {
  const kota = WING.byId.kota;
  if (!kota || kota.gone) return;
  kota.mode = 'chased'; kota.modeT = 0;
  radio('kota', '으악! 뒤를 잡혔어! 대장, 도와줘!', { prio: 2 });
  const anchor = kota;
  const marker = addMarker(kota.pos, 'KOTA', '#ffb070');
  let resolved = false;
  const group = makeGroup(() => {
    if (resolved) return;
    resolved = true;
    marker.active = false;
    kota.mode = 'formation'; kota.modeT = 0; kota.barrelRoll();
    holdOut(kota, 5);
    if (group.byPlayer > 0) { G.run.savedKota = true; emit('bonus', 3000, kota.pos.clone(), 'RESCUE +3000'); }
    radio('kota', '살았다! 대장, 은혜는 잊지 않을게!', { prio: 1 });
  });
  for (let i = 0; i < 3; i++) {
    spawnEnemy('dart', 'chase', { anchor, back: 20 + i * 9, ou: (i - 1) * 7, ov: (i - 1) * 3, ph: i, s: kota.s - 40, u: kota.u, v: kota.v }, { group, noFire: true });
  }
  after(16, () => {
    if (resolved) return;
    resolved = true;
    marker.active = false;
    kota.mode = 'retreat'; kota.modeT = 0; kota.damaged = true;
    G.run.kotaLost = true;
    radio('kota', '윽… 피탄됐어! 미안, 잠깐 이탈할게!', { prio: 1 });
  });
}

// ------------------------------------------------------------ Boss radio
let firstCharge = true;   // the beam warning is given once per session
function onBossPhase(p) {
  if (p === 1) { radio('rio', '먼저 등에 있는 포대를 공격하세요!', { prio: 1 }); }
  if (p === 2) { radio('rio', '포대 전멸! 입이 열리는 순간 안의 코어를 노려요!', { prio: 2 }); }
  if (p === 3) { radio('mizuchi', '…배제… 배제, 한다…', { prio: 2, hold: 1.2 }); kotaOr('화, 화났어!? 다들 조심해!', 'rio', '움직임이 달라졌어요…! 다들 조심해요!'); }
}
function onBossCharge() { if (firstCharge) { firstCharge = false; radio('gantetsu', '빔이 온다! 사선에서 벗어나라!', { prio: 2, hold: 1 }); } }
function onBossDying() { radio('mizuchi', '가…가가…기능, 정…지…', { prio: 2, hold: 0.8 }); }
function onBossPartDown(left) {   // turrets left on the back (6 at first)
  if (left === 5) kotaOr('하나 부쉈어! 그 기세야!', 'gantetsu', '하나 부쉈다. 그 기세다.');
  if (left === 2) radio('rio', '포대, 2기 남았어요!');
}

// ------------------------------------------------------------ Definition
export default {
  id: 'azure',
  no: 1,
  title: 'AZURE COAST',
  place: '행성 아퀘리아',
  sub: '행성 아퀘리아  연안 방어선',           // mission-start banner
  resultSub: '행성 아퀘리아 연안 방어선 돌파',  // results panel
  music: 'stage1',
  bossAt: 10500,                  // a restart past here is the boss restart (no stage music, BOSS banner)
  checkpoints: [0, 6100, 10700],  // supply ring, boss approach (set by the ring and by the script)
  wingRearAt: WING_REAR_AT,
  attract: [150, 3800],           // title-screen fly-through over the sunset sea
  world: { zones: ZONE, zoneW, pathX, terrainHeight, faceColor, decorate, palettes: PALETTES, paletteKeys: PALETTE_KEYS, water: true, clouds: true },
  script,
  // restarting past the rescue after Kota bailed out: he stays out of the fight
  onSetup(d, run) { if (run.kotaLost && d > 3850) WING.byId.kota.hide(); },
  // The first machine beast: Rio recognises the sea dragon of her grandmother's tales, and HQ adopts the name.
  boss: {
    id: 'mizuchi', en: 'MIZUCHI', title: '기계수  미즈치', bar: '기계수 미즈치', bannerAt: 4.6,
    introLines: [
      { who: 'mizuchi', text: '…침입자 확인. 배제한다.', hold: 0.8 },
      { who: 'rio', text: '미즈치… 할머니의 옛날이야기에 나오는 바다 용과 똑같아…!', hold: 1.0 },
      { who: 'hou', text: '…이후 목표를 「미즈치」로 호칭한다. 각 기체, 요격하라!', hold: 1.2 },
    ],
  },
  onBossPhase, onBossCharge, onBossDying, onBossPartDown,
  // While the squadron circles, a black machine crosses far above (it returns in mission 04). The radio is quiet
  // while it passes: on phones the radio panel sits across the top of the screen, where the sky is.
  clearTime: 13.6,
  onClear(run) {
    after(1.4, () => run.kotaLost
      ? radio('rio', '목표의 침묵을 확인. …훌륭해요, 대장.', { prio: 2 })
      : radio('kota', '해냈다! 대장, 최고야!', { prio: 2 }));
    after(1.6, () => radio('hou', '잘했다, 랜서 대. 아퀘리아는 지켜졌다.', { hold: 1.2 }));
    after(7.0, () => { crossView('ibuki'); AudioSys.sfx('roll', { vol: 0.45, pitch: 0.6 }); });
    after(9.2, () => { radio('gantetsu', '…방금 그 기체는…', { prio: 1, hold: 1.6 }); radio('rio', '…레이더에는 아무것도 잡히지 않았어요.', { hold: 1.6 }); });
  },
  onFragment() { radio('rio', '방금 그 빛… 무언가의 파편? 꽤 오래된 금속 같아요…', { prio: 1 }); },
  absent(run) { return run.kotaLost ? ['kota'] : []; },   // wingmen missing from the clear formation
  rank: { S: 125, A: 100, B: 70, medal: 115 },             // hits needed (S also needs no deaths)
  resultNote(run) { return (run.savedKota ? '코타 구출 <b>성공</b>' : '코타 구출 <b>실패</b>') + (run.gotFrag ? '  창 조각 <b>획득</b>' : ''); },
  squadAfter(run, squad) { return run.kotaLost ? squad | 1 : squad; },   // Kota bailed out: under repair at the start of mission 02

  // ---- story mode
  map: { target: 'aquelia' },
  briefing: {
    lines: [
      { who: 'hou', text: '랜서 대, 들리는가. 호다.' },
      { who: 'hou', text: '한 시간 전, 행성 아퀘리아 연안에 소속 불명의 기계 군단이 상륙했다.' },
      { who: 'hou', text: '적은 바다에서 잇따라 나타나 연안에 전선 기지를 구축하고 있다.' },
      { who: 'hou', text: '해상으로 진입해 협곡을 지나 적의 전선 기지를 돌파하라.' },
      { who: 'hou', text: '…무리하지 마라, 랜서 1. 전원 함께 돌아와라.' },
    ],
    objective: '아퀘리아 연안의 적 부대를 격파하고 전선 기지를 돌파하라',
  },
  talk: [
    { who: 'rio', text: '미즈치의 잔해에서 신호를 포착했어요. 어딘가를 향해 무언가를 계속 보내고 있어요.' },
    { who: 'rio', text: '발신원은… 사르가소 우주. 난파선이 떠다니는 「배의 무덤」이에요.' },
    { who: 'gantetsu', text: '…그런 곳에 대체 뭐가 있다는 거지.' },
    { who: 'hou', text: '확인하는 수밖에 없겠지. 랜서 대, 보급이 끝나는 대로 사르가소로 향하라.' },
    { who: 'kota', text: '쉴 틈이 없네…. 그래도 가자, 대장!' },
  ],
};
