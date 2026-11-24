// MISSION 02 "VIOLET SARGASSO" — the Sargasso drift, a graveyard of ships under a violet nebula: open space →
// asteroid belt → derelict hulls and the rotating wreck → the Kamaitachi mercenaries → the bone works → GASHADOKURO.
// The first space stage (world.space); the engine reads this file as a stage definition (fields in index.js).
import * as THREE from 'three';
import { G, rand, clamp, lerp, smoothstep, mulberry32, emit, after, easeInOutCubic, easeOutCubic } from '../core.js';
import { scheduleProp, Prop, registerProp, hitObstacle, props } from '../props.js';
import { radio, radioBusy, tip, warning } from '../hud.js';
import { WING, setWingStance, holdOut, kotaOr } from '../wingmen.js';
import { AudioSys } from '../audio.js';
import { railFrame, railToWorld, mergeGeometries, emissiveVertexMaterial } from '../world.js';
import { paint } from '../enemies.js';
import { glow, sparks, bigFlash, addShake } from '../fx.js';
import { spaceDecor } from '../space.js';
import { startRivals, engageRivals, updateRivals, retreatRivals, clearRivals, rivalUp, rivalTargets, rivalModels, RIVALS } from '../rivals.js';
import { vWing, snake, fromBehind, holders, ringOf, crossing, divers, turret, mine } from '../level.js';

const _v = new THREE.Vector3(), _p = new THREE.Vector3(), _f = new THREE.Vector3(), _r = new THREE.Vector3();

// ============================================================ Zones & rail path
const ZONE = { rocks: 2400, grave: 4700, wreck: 5300, rival: 6200, works: 9700, boss: 10950 };
const KOTA_BACK = 8000;     // Kota, if he bailed out in mission 01, rejoins here (mid-fight with the Kamaitachi)
const WING_REAR_AT = 640;

const _zw = {};
function zoneW(d, out = _zw) {
  const r = smoothstep(2300, 2700, d) * (1 - smoothstep(4500, 4900, d));
  const g = smoothstep(4600, 5000, d) * (1 - smoothstep(6000, 6400, d));
  const k = smoothstep(6100, 6500, d) * (1 - smoothstep(9500, 9900, d));
  const w = smoothstep(9600, 10000, d) * (1 - smoothstep(10800, 11200, d));
  out.rocks = r; out.grave = g; out.rival = k; out.works = w; out.boss = smoothstep(10800, 11200, d);
  out.drift = Math.max(0, 1 - r - g - k - w - out.boss);
  return out;
}

// A gentle weave (there is nothing out here to steer around), faded out over long stretches so the course runs
// dead straight through the rotating wreck.
function pathX(d) {
  const straight = smoothstep(3900, 5100, d) * (1 - smoothstep(5900, 7000, d));
  return (1 - straight) * (40 * Math.sin(d * 0.0009 + 0.4) + 14 * Math.sin(d * 0.0021 + 1.3));
}

function decorate(ci, KIT) {
  const z = zoneW(ci * KIT.CHUNK + KIT.CHUNK / 2, {});
  return spaceDecor(ci, KIT.CHUNK, {
    rocks: Math.round(7 + 26 * z.rocks + 8 * z.grave + 8 * z.rival + 4 * z.works + 2 * z.boss),
    junk: Math.round(3 + 16 * z.grave + 8 * z.rival + 12 * z.works + 4 * z.boss),
    huge: 0.3,
    keepOut: z.boss > 0.5 ? (u, v) => u < 60 && v > 20 : null,   // the upper left stays clear for the warp after the boss
  });
}

// ============================================================ Sky palettes (space: mid / horizon = nebula colours)
const SPACE_BASE = { waterDeep: '#000000', waterScatter: '#000000', fogHeight: 0, fogFalloff: 0, sunDisc: 7, sunElev: 26, sunAz: 62 };   // the star off to the right lights the rocks from the side
const PALETTES = {
  nebula: {
    ...SPACE_BASE, zenith: '#07051a', mid: '#4b2694', horizon: '#c43e8e', fog: '#24143f', sun: '#fff1da', cloud: '#ffb8e6', cloudShadow: '#0b0717',
    hemiSky: '#9c88e2', hemiGround: '#2a2046', light: '#f2e8ff', sunLight: 2.6, fogDensity: 0.00032, fogStart: 280,
    glow: 0.3, cloudCover: 1.0, hemi: 1.45, stars: 1.0, exposure: 1.0, bloom: 0.55, env: 0.9,
  },
  graveyard: {
    ...SPACE_BASE, zenith: '#050616', mid: '#352684', horizon: '#2f8ea6', fog: '#16183a', sun: '#e8f0ff', cloud: '#a8f2ff', cloudShadow: '#080714',
    hemiSky: '#7f8ce0', hemiGround: '#1c1e40', light: '#e0e8ff', sunLight: 2.3, fogDensity: 0.00036, fogStart: 240,
    glow: 0.26, cloudCover: 0.9, hemi: 1.4, stars: 0.9, exposure: 1.02, bloom: 0.55, env: 0.85,
  },
  works: {
    ...SPACE_BASE, zenith: '#0a0518', mid: '#5a2482', horizon: '#e0663e', fog: '#2c1530', sun: '#ffe2c0', cloud: '#ffc79a', cloudShadow: '#0e0712',
    hemiSky: '#c08ac8', hemiGround: '#3a1e2a', light: '#ffe0c8', sunLight: 2.5, fogDensity: 0.00036, fogStart: 240,
    glow: 0.34, cloudCover: 1.0, hemi: 1.4, stars: 0.85, exposure: 1.04, bloom: 0.6, env: 0.85,
  },
  boss: {
    ...SPACE_BASE, zenith: '#0c0414', mid: '#601c6c', horizon: '#e43c6a', fog: '#2e1028', sun: '#ffd8d0', cloud: '#ffa6c8', cloudShadow: '#100510',
    hemiSky: '#c07ab8', hemiGround: '#3a1630', light: '#ffd6e0', sunLight: 2.4, fogDensity: 0.0003, fogStart: 260,
    glow: 0.36, cloudCover: 1.1, hemi: 1.45, stars: 0.9, exposure: 1.02, bloom: 0.62, env: 0.85,
  },
};
const PALETTE_KEYS = [
  { at: 0, name: 'nebula' }, { at: 4300, name: 'nebula' }, { at: 5100, name: 'graveyard' }, { at: 9100, name: 'graveyard' },
  { at: 10000, name: 'works' }, { at: 10700, name: 'works' }, { at: 11500, name: 'boss' },
];

// ============================================================ Set pieces of the bone works
let worksMat = null;
const wMat = () => worksMat || (worksMat = emissiveVertexMaterial({ roughness: 0.55, metalness: 0.45 }, 3.2));
const BONE = '#aaa28e', BONE2 = '#8a8373', STEEL = '#3e4350', HOT = '#ff8a3a', SEAM = '#b45cff';
const tubeOf = (pts, r, hex, em = 0, seg = 16) => paint(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), seg, r, 6, false), hex, em);
// half-ellipse arch over the course in the plane z (u from -A to A, apex at v0 + B)
const archPts = (A, v0, B, z, n = 9) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1) * Math.PI; return [-Math.cos(t) * A, v0 + Math.sin(t) * B, z]; });

// The skeleton under construction: rib arches over the course, a spine overhead, scaffolds and furnaces.
class Ribcage extends Prop {
  constructor(s, o) {
    super('ribcage', s, o);
    const parts = [], rnd = mulberry32(77), L = this.len;
    // ribs: tall enough to stay clear of the play area (|u| ≤ 46, v ≤ 58) all the way round
    for (let z = 0; z <= L; z += 70) {
      const k = 1 - Math.abs(z / L - 0.5) * 0.5;
      parts.push(tubeOf(archPts(110, -70, 200, -z), 5.5 * k, z % 140 ? BONE : BONE2));
      parts.push(tubeOf(archPts(108, -66, 196, -z + 4, 7), 0.8, SEAM, 1));
    }
    for (let z = -20; z <= L + 20; z += 14) parts.push(paint(new THREE.BoxGeometry(12, 9, 9).translate(0, 125, -z), z % 28 ? BONE2 : BONE), paint(new THREE.BoxGeometry(3, 8, 3).translate(0, 133, -z), STEEL));
    parts.push(paint(new THREE.CylinderGeometry(1.4, 1.4, L + 40, 6).rotateX(Math.PI / 2).translate(0, 119, -L / 2), SEAM, 1));
    for (const sx of [-1, 1]) {
      for (let z = 35; z < L; z += 70) {
        const x = sx * (78 + rnd() * 16);
        parts.push(paint(new THREE.BoxGeometry(2.4, 120, 2.4).translate(x, 0, -z), STEEL), paint(new THREE.BoxGeometry(2.4, 120, 2.4).translate(x + sx * 10, 0, -z), STEEL));
        for (let y = -40; y < 60; y += 24) parts.push(paint(new THREE.BoxGeometry(12, 1.2, 1.2).translate(x + sx * 5, y, -z), STEEL));
        parts.push(paint(new THREE.BoxGeometry(18, 1.6, 14).translate(x + sx * 4, 18 + rnd() * 20, -z), '#4a4f5c'));
      }
      for (let z = 100; z < L; z += 210) {
        parts.push(paint(new THREE.CylinderGeometry(14, 16, 50, 10).translate(sx * 150, -10, -z), '#2c2e36'));
        parts.push(paint(new THREE.CylinderGeometry(11, 11, 4, 10).translate(sx * 150, 16, -z), HOT, 1));
        parts.push(paint(new THREE.TorusGeometry(15, 1.2, 4, 12).rotateX(Math.PI / 2).translate(sx * 150, 6, -z), HOT, 1));
      }
    }
    this.mesh = new THREE.Mesh(mergeGeometries(parts), wMat());
    this.root.add(this.mesh);
  }
  update(dt) {
    // welding sparks along the bones and furnace heat
    if (Math.random() < dt * 9) {
      const z = rand(0, this.len), side = Math.random() < 0.5 ? -1 : 1;
      railToWorld(this.s + z, side * rand(70, 96), rand(-30, 60), _v);
      sparks(_v, null, 10, [6, 4, 1.6], 24, 1);
      glow(_v, 6, 5, 3, 1.2, 0.9);
    }
  }
}

// One low rib across the course: pass under it or over it.
class LowRib extends Prop {
  constructor(s, o) {
    super('lowrib', s, o);
    this.pts = archPts(70, -10, 54, 0, 15);
    this.mesh = new THREE.Mesh(mergeGeometries([tubeOf(this.pts, 4.6, BONE, 0, 24), tubeOf(archPts(70, -8, 51.5, 3, 15), 0.7, SEAM, 1, 24)]), wMat());
    this.mesh.castShadow = true;
    this.root.add(this.mesh);
  }
  update(dt) {
    const r = this.rel();
    if (Math.abs(r.ds) < 5 && G.player.alive) {
      let best = 1e9, bv = 0;
      for (const [x, y] of this.pts) { const d = Math.hypot(G.player.u - x, G.player.v - y); if (d < best) { best = d; bv = y; } }
      if (best < 4.6 + 2.4) hitObstacle(0, G.player.v > bv ? 1 : -1);
    }
  }
}
registerProp('ribcage', Ribcage);
registerProp('lowrib', LowRib);

// ============================================================ The warp after the boss: the finished skeleton is taken away
const WARP = { on: false, t: 0, group: null, ring: null, frame: null };
const WARP_AT = { rel: 1150, u: -330, v: 280 };   // rail-relative position of the gate (up and to the left)

function warpModel() {
  if (WARP.group) return WARP.group;
  const g = new THREE.Group();
  // the frame: a spine of welded hull sections with rib hoops, far bigger than anything else out here
  const parts = [], rnd = mulberry32(5);
  for (let i = 0; i < 26; i++) {
    const z = i * 26, k = Math.sin((i + 1) / 27 * Math.PI);
    parts.push(paint(new THREE.CylinderGeometry(9, 10, 18, 8).rotateX(Math.PI / 2).translate(0, Math.sin(i * 0.3) * 6, -z), i % 2 ? BONE : BONE2));
    if (i > 2 && i < 22 && i % 2 === 0) {
      const R = 30 + 70 * k;
      parts.push(tubeOf(archPts(R, Math.sin(i * 0.3) * 6, R * 0.8, -z, 9), 3.2, BONE));
      parts.push(tubeOf(archPts(R, Math.sin(i * 0.3) * 6, -R * 0.8, -z, 9), 3.2, BONE2));
    }
    if (rnd() < 0.4) parts.push(paint(new THREE.BoxGeometry(2, 2, 2).translate(rand(-30, 30), rand(-30, 30), -z), HOT, 1));
  }
  parts.push(paint(new THREE.IcosahedronGeometry(26, 1).scale(1, 0.85, 1.25).translate(0, 4, 30), BONE));
  WARP.frame = new THREE.Mesh(mergeGeometries(parts), wMat());
  g.add(WARP.frame);
  // the gate: a swirling disc drawn on one quad
  WARP.ring = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uA: { value: 0 } },
    vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`uniform float uT; uniform float uA; varying vec2 vUv;
      void main(){
        vec2 p = (vUv - 0.5) * 2.0; float d = length(p), a = atan(p.y, p.x);
        float rim = exp(-pow((d - 0.82) / 0.07, 2.0));
        float swirl = 0.5 + 0.5 * sin(a * 6.0 + d * 14.0 - uT * 6.0);
        float inner = smoothstep(0.85, 0.0, d) * (0.35 + 0.4 * swirl);
        vec3 c = vec3(0.7, 0.4, 1.6) * rim * 2.2 + mix(vec3(0.15, 0.05, 0.4), vec3(0.6, 0.9, 1.8), swirl) * inner;
        gl_FragColor = vec4(c * uA * smoothstep(1.0, 0.92, d), 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }));
  WARP.ring.renderOrder = 6;
  g.add(WARP.ring);
  g.visible = false;
  WARP.group = g;
  return g;
}
function startWarp() {
  warpModel();
  G.scene.add(WARP.group);
  WARP.on = true; WARP.t = 0; WARP.group.visible = true; WARP.flashed = false;
  AudioSys.sfx('roar', { vol: 0.5, pitch: 0.45 });
}
function stopWarp() { if (WARP.group) { WARP.group.visible = false; G.scene.remove(WARP.group); } WARP.on = false; }
// gate opens (0–1 s), the frame slides in and shrinks into it (1–4.4 s), the gate snaps shut (4.6 s)
function updateWarp(dt) {
  if (!WARP.on) return;
  const t = (WARP.t += dt), g = WARP.group, d = G.rail.d;
  railFrame(d + WARP_AT.rel, _p, _f, _r);
  railToWorld(d + WARP_AT.rel, WARP_AT.u, WARP_AT.v, g.position);
  g.rotation.set(0, Math.atan2(-_f.x, -_f.z), 0);
  const open = t < 4.6 ? easeOutCubic(clamp(t / 1.0, 0, 1)) : clamp(1 - (t - 4.6) / 0.25, 0, 1);
  const R = 210 * open;
  WARP.ring.scale.setScalar(Math.max(0.01, R * 2.2));
  WARP.ring.material.uniforms.uT.value = t;
  WARP.ring.material.uniforms.uA.value = open;
  // the frame is a serpent's spine and ribs, kilometres long, drawn in head first
  const k = easeInOutCubic(clamp((t - 0.6) / 3.8, 0, 1));
  WARP.frame.position.set(lerp(1100, 0, k), lerp(-420, 0, k), lerp(900, -100, k));
  WARP.frame.rotation.set(lerp(0.15, 0, k), lerp(-1.0, -0.15, k), lerp(0.25, 0, k));
  WARP.frame.scale.setScalar(Math.max(0.01, 2.3 * (1 - smoothstep(0.7, 1, k))));
  WARP.frame.visible = k < 0.999;
  if (open > 0.05) { g.updateMatrixWorld(); glow(_v.set(0, 0, 0).applyMatrix4(g.matrixWorld), R * 1.3, 1.0, 0.5, 2.2, 0.5 * open); }
  if (t > 4.6 && !WARP.flashed) { WARP.flashed = true; bigFlash(0.7, [0.85, 0.7, 1]); AudioSys.sfx('bombBlast', { vol: 0.6, pitch: 0.6 }); addShake(0.3); }
  if (t > 5.2) stopWarp();
}
// Camera for the warp: behind and below the leader, looking past him at the gate.
function warpShot(t, o, ship) {
  if (t < 4.4) return false;
  if (!WARP.group) return false;
  railFrame(G.rail.d, _p, _f, _r);
  const k = clamp((t - 4.4) / 9, 0, 1);
  o.pos.copy(ship.pos).addScaledVector(_f, -24 - 6 * k).addScaledVector(_r, 12).setY(ship.pos.y - 5 + 2 * k);
  // look between the leader and the gate, leaning toward the gate
  railToWorld(G.rail.d + WARP_AT.rel, WARP_AT.u, WARP_AT.v, _v);
  _v.sub(o.pos).normalize();
  o.target.subVectors(ship.pos, o.pos).normalize().addScaledVector(_v, 1.6).add(o.pos);
  o.fov = 56;
  return true;
}

// ============================================================ Script
// Scripted exchanges that must keep their order: each line (or function) waits until the radio is free; lines not
// yet said when the course reaches `until` are dropped (functions still run), so a talk never spills into the next scene.
const SEQ = [];
const sayBy = (until, ...lines) => { for (const L of lines) SEQ.push({ L, until }); };
const say = (...lines) => sayBy(G.rail.d + 1500, ...lines);
function updateSeq() {
  while (SEQ.length && G.rail.d > SEQ[0].until) { const { L } = SEQ.shift(); if (typeof L === 'function') L(); }   // actions still run
  if (SEQ.length && !radioBusy()) { const { L } = SEQ.shift(); if (typeof L === 'function') L(); else radio(...L); }
}

function script(at) {
  // ===== DRIFT =====
  at(120, () => radio('hou', '사르가소 우주에 진입했다. 신호의 발신원은 이 안쪽이다.', { hold: 2.2 }));
  at(520, () => kotaOr('우와, 우주다! 별이 엄청 가까워!', 'rio', '코타는 아케보노에서 수리 중이에요. 당분간 3기로 가요.'));
  at(WING_REAR_AT, () => setWingStance('rear', 0.5));
  at(700, () => vWing('dart', 5, 760, 26, { noFire: true }));
  at(820, () => radio('gantetsu', '무인기다. 위로든 아래로든 돌아 들어가게 두지 마라.'));
  at(1100, () => ringOf('drone', 8, 200, { r: 20, v: 30 }));
  at(1250, () => radio('rio', '떠다니는 바위나 잔해 중에는 쏘면 부서지는 것도 있어요.'));
  at(1400, () => snake('dart', 5, 720, -20, 24));
  at(1650, () => { fromBehind('dart', 6); kotaOr('뒤에서도 와! 지나가게 둔 뒤에 쏴버려!', 'gantetsu', '뒤다. 지나가게 둔 뒤에 쏴라.', { prio: 1 }); });
  at(1900, () => crossing('drone', 6, 230, 1, 30));
  at(2150, () => holders('raptor', 2, 170, { v: 30 }));
  at(2300, () => radio('gantetsu', '소행성대다. 큰 바위는 피하고, 작은 건 부수고 나아가라.'));

  // ===== ASTEROID BELT =====
  at(2600, () => snake('interceptor', 4, 700, 18, 32));
  at(2800, () => { for (let i = 0; i < 8; i++) mine(3150 + i * 55, rand(-36, 36), rand(10, 50)); });
  at(3000, () => { holders('carrier', 1, 150, { carry: 'laser', carryIndex: 0, stay: 8, v: 28 }); kotaOr('저 수송기, 뭔가 싣고 있어! 격추해!', 'rio', '저 수송기, 뭔가 싣고 있어요. 격추해요!'); });
  at(3300, () => divers('dart', 4));
  at(3550, () => radio('rio', '전방에 커다란 암괴!', { prio: 1 }));
  at(3680, () => radio('gantetsu', '오른쪽으로 빠져나가라!', { prio: 1, hold: 1.2 }));
  at(3800, () => fromBehind('interceptor', 4));
  at(4100, () => ringOf('drone', 10, 200, { r: 22, v: 28 }));
  at(4400, () => crossing('dart', 6, 220, -1, 30));
  at(4600, () => radio('hou', '전방에 대형함 잔해를 다수 확인. …여기가 「배의 무덤」인가.', { hold: 2 }));

  // ===== SHIP GRAVEYARD =====
  at(4800, () => { holders('raptor', 2, 170, { v: 26 }); turret(5150, 62, { onGround: false, v: 33 }); turret(5230, 58, { onGround: false, v: 33 }); });
  at(5000, () => radio('gantetsu', '앞의 배… 아직 돌고 있다.', { prio: 1 }));
  at(5130, () => radio('rio', '안으로 빠져나가는 수밖에 없어요! 격벽의 구멍을 통과해요!', { prio: 1 }));
  at(5200, () => tip('회전하는 격벽의 구멍을 빠져나가라', 4));
  at(5380, () => ringOf('drone', 6, 170, { r: 13, v: 30, stay: 4 }));
  at(5760, () => kotaOr('휴, 빠져나왔다…!', 'rio', '휴… 빠져나왔네요.'));
  at(5850, () => crossing('drone', 6, 230, 1, 26));
  at(6120, () => radio('rio', '중간 지점이에요. …잠깐, 뭔가 와요.'));

  // ===== KAMAITACHI ===== (they talk on the way in and only fight once the exchange is over)
  at(6250, () => {
    G.run.rivalsDown = 0; G.run.rivalsBeaten = false; G.run.saidHired = false;   // (again after a restart from the checkpoint)
    radio('rio', '후방에서 고속 기체 3기! 무인기가 아니에요!', { prio: 2, hold: 1.4 });
    after(0.6, () => startRivals(onRival));
    say(['tsumuji', '어이, 병아리들! 우리는 카마이타치 대다!', { hold: 1.3 }], ['kiri', '…벤다.', { hold: 1.0 }], ['hari', '저, 저기… 죄송해요!', { hold: 1.2 }],
      ['gantetsu', '용병인가. …누구에게 고용됐지.', { hold: 1.2 }], () => engageRivals(), ['tsumuji', '나리의 의뢰라서 말이야. 나쁘게 생각 마라!']);
  });
  at(7700, () => engageRivals());   // in case the radio was held up
  at(KOTA_BACK, () => kotaReturns());
  at(9600, () => {
    if (!RIVALS.list.some(r => r.alive)) return;
    if (rivalUp('tsumuji')) radio('tsumuji', '쳇, 시간 다 됐네. 보수만큼은 일했다고!', { prio: 1 });
    if (rivalUp('kiri')) radio('kiri', '…다음엔 벤다.');
    retreatRivals();
    afterRivals();
  });

  // ===== BONE WORKS =====
  at(9950, () => sayBy(10700, ['hou', '발신원이 가깝다. …뭐지, 저건.', { prio: 1, hold: 1.4 }], ['rio', '무인기가 잔해를 녹여서 뭔가를 조립하고 있어요…!']));
  at(10100, () => { holders('raptor', 2, 170, { v: 30 }); turret(10320, -44, { onGround: false, v: 8 }); turret(10400, 44, { onGround: false, v: 8 }); });
  at(10250, () => ringOf('drone', 10, 200, { r: 22, v: 30 }));
  at(10450, () => fromBehind('interceptor', 5));
  at(10560, () => radio('gantetsu', '뼈 아래로 지나가라. 머리 부딪히지 마라!', { prio: 1 }));

  // ===== BOSS =====
  at(10750, () => { radio('hou', '잠깐… 주위의 잔해가 움직이고 있다! 모여들고 있어!', { prio: 2, hold: 1.4 }); warning(true); AudioSys.stopMusic(1.2); G.warnLoop = AudioSys.loop('siren'); });
  at(10900, () => { G.run.checkpoint = 10900; });
  at(10950, () => { warning(false); if (G.warnLoop) { G.warnLoop.stop(0.5); G.warnLoop = null; } emit('bossStart'); });

  // ----- props -----
  scheduleProp('ring', 1150, { u: 0, v: 26 });
  scheduleProp('ring', 1800, { u: -20, v: 34 });
  scheduleProp('ring', 2650, { u: 18, v: 22 });
  scheduleProp('ring', 3350, { kind: 'gold', u: -40, v: 50 });
  scheduleProp('ring', 4200, { u: 0, v: 30 });
  scheduleProp('ring', 4900, { u: -10, v: 28 });
  scheduleProp('ring', 5470, { u: 0, v: 30 });
  scheduleProp('ring', 5590, { kind: 'gold', u: 30, v: 48 });
  scheduleProp('ring', 6050, { kind: 'check', u: 0, v: 28 });
  scheduleProp('ring', 7300, { u: 20, v: 30 });
  scheduleProp('ring', 8300, { u: -20, v: 26 });
  scheduleProp('ring', 9100, { u: 0, v: 34 });
  scheduleProp('ring', 9900, { u: 0, v: 22 });
  scheduleProp('ring', 10370, { kind: 'gold', u: 0, v: 55 });
  scheduleProp('ring', 10520, { u: -16, v: 24 });
  // asteroid belt: big rocks to fly around, small ones to break
  for (const [s, u, v, r] of [[2700, 30, 40, 14], [2850, -32, 14, 12], [3050, 6, 46, 16], [3200, -20, 30, 10], [3450, 36, 10, 13], [4250, 28, 26, 15], [4450, -30, 44, 12]]) scheduleProp('rock', s, { u, v, r, seed: s });
  scheduleProp('rock', 3900, { u: -12, v: 24, r: 26, seed: 1 });
  scheduleProp('fragment', 3900, { u: -42, v: 5 });   // 槍のかけら②: in the narrow gap left of the big rock ("右へ抜けろ")
  for (const [s, u, v, r] of [[2560, -10, 24, 5], [2760, 14, 32, 4.5], [2960, -24, 40, 5.5], [3130, 22, 18, 4], [3260, -4, 12, 5], [3520, -18, 44, 4.5], [3640, 12, 30, 6],
    [4020, 30, 46, 4.5], [4110, -2, 14, 5], [4320, -14, 34, 5], [4520, 8, 20, 4.5], [4660, 24, 40, 5], [5060, -26, 36, 4], [5130, 10, 16, 4.5]]) scheduleProp('rubble', s, { u, v, r, seed: s });
  // ship graveyard
  scheduleProp('hulk', 4750, { u: -104, v: 22, r: 36, len: 330, roll: 0.3, seed: 3 });
  scheduleProp('hulk', 4880, { u: 108, v: 52, r: 30, len: 300, roll: 1.2, seed: 4 });
  scheduleProp('hulk', 5000, { u: 66, v: 6, r: 22, len: 170, roll: 2.1, seed: 5 });
  scheduleProp('spinwreck', 5300, {
    len: 420, r: 62, v: 30, spin: 0.3,
    walls: [{ at: 110, holes: [[0, 25, 15], [0, -25, 15]] }, { at: 220, holes: [[25, 0, 15], [-25, 0, 15]] }, { at: 330, holes: [[0, 23, 17.5]] }],
  });
  scheduleProp('hulk', 8300, { u: -96, v: 70, r: 28, len: 260, roll: 0.8, seed: 6 });
  // bone works
  scheduleProp('ribcage', 9980, { len: 560 });
  scheduleProp('lowrib', 10650, {});
}

// Kamaitachi radio and score (rivals.js calls back here).
function onRival(type, r) {
  const run = G.run;
  if (type === 'wave') radio('gantetsu', '충격파다! 고리의 안이나 바깥으로 빠져나가라!', { prio: 1 });
  else if (type === 'dash') kotaOr('기리가 뒤로 돌아갔어! 온다!', 'rio', '기리가 뒤로 돌아갔어요! 와요!', { prio: 1 });
  else if (type === 'repair') { radio('hari', '혀, 형, 지금 고칠게…!', { prio: 1 }); after(2.6, () => radio('gantetsu', '정비 담당을 먼저 떨어뜨려라. 끝이 없다.')); }
  else if (type === 'flinch' && !run.saidFlinch) { run.saidFlinch = true; radio('hari', '히익!? 쏘, 쏘지 마요!'); }
  else if (type === 'waveHit' && !run.saidWaveHit) { run.saidWaveHit = true; radio('gantetsu', '태세를 정비하라!', { hold: 1 }); }
  else if (type === 'cut' && !run.saidCut) { run.saidCut = true; radio('rio', '기리의 칼날, 정면으로 맞으면 위험해요!'); }
  else if (type === 'down') {
    run.rivalsDown = (run.rivalsDown || 0) + 1;
    const pts = { tsumuji: [5, 3000], kiri: [5, 3000], hari: [3, 1500] }[r.id];
    run.hits += pts[0];
    emit('bonus', pts[1], r.pos.clone(), `${r.def.name} +${pts[0]}`);
    const line = { tsumuji: '크악!? 제법이잖아…!', kiri: '…불찰.', hari: '미, 미안, 먼저 물러날게…!' }[r.id];
    radio(r.id, line, { prio: 1 });
    if (!rivalUp('tsumuji') && !rivalUp('kiri') && !run.rivalsBeaten) {
      run.rivalsBeaten = true;
      say(['tsumuji', '쳇, 철수다! 두고 보자, 랜서 대!'], () => { if (rivalUp('hari')) radio('hari', '기, 기다려, 형!'); retreatRivals(); });
      afterRivals();
    }
  }
}

// once the mercenaries have gone: who hired them? (said before the bone works come into view)
function afterRivals() {
  if (G.run.saidHired) return;
  G.run.saidHired = true;
  sayBy(9950, ['rio', '「나리」… 뒤에 누군가 있는 거네요.', { hold: 1.4 }], ['gantetsu', '적에게는 지휘관이 있다는 뜻이다.', { hold: 1.4 }]);
}

function kotaReturns() {
  const kota = WING.byId.kota;
  if (!kota.gone) return;
  kota.show(); kota.reset(); holdOut(kota, 6);
  G.run.kotaBack = true;
  radio('kota', '기다렸지, 대장! 랜서 2, 전선 복귀!', { prio: 1 });
  after(2.8, () => radio('rio', '코타! 수리가 제시간에 끝났군요!'));
}

// ------------------------------------------------------------ Boss radio
let saidCharge = false;   // the swipe warning is given once per session
function onBossPhase(p) {
  if (p === 1) radio('rio', '빛나는 팔 관절을 쏴요! 팔째로 무너뜨릴 수 있을 거예요!', { prio: 1 });
  if (p === 2) radio('rio', '두개골이 열렸어요! 안의 코어를 노려요!', { prio: 2 });
  if (p === 3) { radio('gashadokuro', '…뼈…뼈를, 내놔라…', { prio: 2, hold: 1.2 }); kotaOr('아직도 움직여!? 끈질기네!', 'gantetsu', '아직도 움직이나… 끈질기군.'); }
  if (p === 4 && !G.run.saidRebuild) { G.run.saidRebuild = true; kotaOr('또 조립됐어!?', 'rio', '또 조립되고 있어요…!', { prio: 1 }); after(2.2, () => radio('gantetsu', '몇 번이든 무너뜨려라. 속을 칠 때까지다.')); }
  if (p === 5 && !G.run.saidLone) { G.run.saidLone = true; radio('rio', '무너뜨린 팔이 돌아가고 있어요…! 양팔을 연속으로 무너뜨려요!', { prio: 1 }); }
}
function onBossCharge() { if (!saidCharge) { saidCharge = true; radio('gantetsu', '팔이 온다! 위나 아래로 피하라!', { prio: 2, hold: 1 }); } }
function onBossDying() { radio('gashadokuro', '가…가가…뼈, 로…돌아, 간다…', { prio: 2, hold: 0.8 }); }
function onBossPartDown(left) { if (left === 1) radio('rio', '한쪽 팔이 무너졌어요! 나머지 한쪽도!', { prio: 1 }); }

// ------------------------------------------------------------ Definition
export default {
  id: 'violet',
  no: 2,
  title: 'VIOLET SARGASSO',
  place: '사르가소 우주',
  sub: '사르가소 우주  배의 무덤',
  resultSub: '사르가소 우주 배의 무덤 돌파',
  music: 'stage2',
  bossAt: 10750,
  checkpoints: [0, 6050, 10900],
  wingRearAt: WING_REAR_AT,
  world: { space: { band: [0.3, 1, -0.25] }, zones: ZONE, zoneW, pathX, decorate, palettes: PALETTES, paletteKeys: PALETTE_KEYS },
  script,
  onSetup(d, run) {
    clearRivals(); stopWarp(); SEQ.length = 0;
    if ((run.squad & 1) && d < KOTA_BACK) WING.byId.kota.hide();   // still being repaired after mission 01
  },
  onUpdate(dt) { updateRivals(dt); updateWarp(dt); if (G.state === 'play') updateSeq(); },
  onExit() { clearRivals(); stopWarp(); SEQ.length = 0; },
  warm: () => [...rivalModels(), warpModel()],
  boss: {
    id: 'gashadokuro', en: 'GASHADOKURO', title: '기계수  가샤도쿠로', bar: '기계수 가샤도쿠로', bannerAt: 4.4,
    introLines: [
      { who: 'gashadokuro', text: '…뼈, 모자라. 네 뼈도…내놔라.', hold: 0.8 },
      { who: 'rio', text: '잔해가 모여서… 해골이 됐어!?', hold: 0.8 },
      { who: 'gantetsu', text: '…옛날이야기에 나오는 「가샤도쿠로」 그 자체로군.', hold: 0.8 },
      { who: 'hou', text: '이후 목표를 「가샤도쿠로」로 호칭한다. 각 기체, 요격하라!', hold: 1.2 },
    ],
  },
  onBossPhase, onBossCharge, onBossDying, onBossPartDown,
  // The finished skeleton the drones were building is pulled into a warp and taken away (its answer comes in 06).
  // The radio stays quiet while the gate is open: on phones the radio panel sits across the top of the screen.
  clearTime: 14.6,
  onClear(run) {
    after(1.4, () => kotaOr('해냈다! 해골이 산산조각 났어!', 'rio', '목표, 침묵. …해냈어요, 대장.', { prio: 2 }));
    after(2.6, () => radio('hou', '잘했다. …잠깐, 우주 안쪽에 거대한 중력 반응!', { prio: 1, hold: 1.0 }));
    after(4.4, () => { startWarp(); bigFlash(0.5, [0.8, 0.6, 1]); });
    after(10.0, () => { radio('gantetsu', '…가져가 버렸나.', { prio: 1, hold: 1.0 }); radio('rio', '저건… 대체 무슨 뼈인 거죠?', { hold: 2.0 }); });
  },
  clearShot: warpShot,
  onFragment() {
    radio('rio', G.run.frags & 1 ? '또 저 빛…! 아퀘리아의 조각과 같은 금속이에요.' : '이 빛… 오래된 금속 조각? 난파선의 짐일까요.', { prio: 1 });
  },
  absent(run) { return []; },   // Kota is back by the end of the mission in any case
  rank: { S: 120, A: 95, B: 65, medal: 110 },
  resultNote(run) { return `카마이타치 대 격퇴 <b>${run.rivalsDown || 0}/3</b>` + (run.gotFrag ? '  창 조각 <b>획득</b>' : ''); },
  squadAfter(run, squad) { return squad & ~1; },   // Kota's repairs are done

  // ---- story mode
  map: { target: 'sargasso' },
  briefing: {
    lines: (carry) => [
      { who: 'hou', text: '랜서 대, 미즈치 잔해의 신호를 추적한 결과가 나왔다.' },
      { who: 'rio', text: '발신원은 사르가소 우주. 오래된 난파선이 흘러드는 「배의 무덤」이에요.' },
      { who: 'rio', text: '신호는 지금도 계속 나오고 있어요. 우주 안쪽에서 무언가가 움직이고 있어요.' },
      { who: 'hou', text: '소행성대와 잔해 사이를 빠져나가 발신원을 찾아내라.' },
      ...(carry && carry.squad & 1 ? [{ who: 'hou', text: '코타의 기체는 수리 중이다. 끝나는 대로 합류시키겠다.' }] : []),
      { who: 'hou', text: '무엇이 기다리고 있을지 모른다. …방심하지 마라, 랜서 1.' },
    ],
    objective: '사르가소 우주를 빠져나가 신호의 발신원을 찾아내라',
  },
  talk: [
    { who: 'rio', text: '가샤도쿠로의 잔해를 조사했어요. 그건 골격을 조립하는 현장의 「파수꾼」이었던 것 같아요.' },
    { who: 'gantetsu', text: '…실려 간 뼈는 어디로 갔지.' },
    { who: 'rio', text: '워프 목적지는 추적하지 못했어요. 하지만 그 형태… 배의 골조가 아니에요. 생물의 골격이에요.' },
    { who: 'kota', text: '그렇게 커다란 생물이 있을 리 없지…?' },
    { who: 'hou', text: '용병이 말한 「나리」도 신경 쓰인다. …적에게는 우두머리가 있다.' },
    { who: 'rio', text: '단서가 하나 더 있어요. 기계수가 행성 아리디아의 오래된 유적을 파헤치고 있어요.' },
    { who: 'hou', text: '다음 목표는 아리디아다. 랜서 대, 보급을 서둘러라.' },
  ],

  // dev-build test bot: shoot the rivals too, and steer for the open hole of the rotating wreck
  botTargets: () => rivalTargets(),
  botSteer() {
    for (const p of props) if (p.type === 'spinwreck') { const h = p.nextHole(); if (h) return h; }
    return null;
  },
};
