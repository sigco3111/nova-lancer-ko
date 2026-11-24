// Stage definitions in story order. A definition holds everything one mission needs; azure.js is the reference
// for a planet, violet.js for space.
//   id, no, title, place, sub, resultSub      names for banners and panels
//   music, bossAt, checkpoints, wingRearAt     course pacing (bossAt: restarts past it skip the stage music)
//   attract                                    rail range for the title fly-through (first stage only)
//   world: { zoneW, pathX, terrainHeight, faceColor, decorate, palettes, paletteKeys, water, clouds }
//          or { space: true | { band }, zoneW, pathX, decorate, palettes, paletteKeys } (no terrain, sea or gravity;
//          nebula sky — see world.useStageWorld)
//   script(at)                                 registers events with at(distance, fn) and schedules props
//   onSetup(d, run), onClear(run), absent(run) hooks around (re)starts and the clear sequence
//   onUpdate(dt, gameplay), onExit()           every simulated frame (the stage's own actors); when another stage is loaded
//   warm()                                     objects whose shaders to compile while the screen is black before the mission
//   boss: { id, en, title, bar, introLines: [{ who, text, hold }], bannerAt }
//          + onBossPhase(p) / onBossCharge() / onBossDying() / onBossPartDown(partsLeft)
//   clearTime, clearShot(t, cam, ship)         length of the clear orbit (default 8.5 s); a camera of its own (return true)
//   onFragment()                               reaction to the spear fragment
//   rank: { S, A, B, medal }, resultNote(run)  results screen
//   map: { target }                            star-map body highlighted in the briefing (see screens.js)
//   briefing: { lines: [{ who, text }] | (carry) => lines, objective }, talk: [{ who, text }] (story mode, after the results)
//   squadAfter(run, squad)                     wingmen still under repair when the next stage starts (bit 0 = Kota)
//   botTargets(), botSteer()                   dev-build test bot: extra things to shoot; a (u, v) to steer for
import azure from './azure.js';
import violet from './violet.js';

// The seven missions of the story, in order. `def` is the stage definition once the mission has been built.
export const MISSIONS = [
  { no: 1, id: 'azure', title: 'AZURE COAST', place: '행성 아퀘리아', def: azure },
  { no: 2, id: 'violet', title: 'VIOLET SARGASSO', place: '사르가소 우주', def: violet },
  { no: 3, id: 'amber', title: 'AMBER DUNES', place: '행성 아리디아' },
  { no: 4, id: 'white', title: 'WHITE SILENCE', place: '행성 글라시아' },
  { no: 5, id: 'emerald', title: 'EMERALD STORM', place: '행성 실바' },
  { no: 6, id: 'scarlet', title: 'SCARLET FORGE', place: '행성 이그니아' },
  { no: 7, id: 'night', title: 'LONG NIGHT', place: '항성 아마테라' },
];

export const STAGES = MISSIONS.filter(m => m.def).map(m => m.def);

// Title → ストーリー → プロローグ (also shown once before the first briefing). One string per page.
export const PROLOGUE = [
  '5년 전.\n얼음 행성 글라시아의 고대 유적에서 연합 조사대에 이변이 닥쳤다.\n호위를 맡았던 정예 비행대 「랜서」의 대장은 조사대를 탈출시키기 위해 유적에 남았고, 끝내 돌아오지 않았다.\n사건은 사고로 처리되었고 랜서 대는 해산했다.',
  '그리고 현재.\n호 사령관 휘하에서 랜서 대는 새롭게 다시 태어났다.\n그 대장기 「랜서 1」에 타는 것은 바로 당신이다.',
  '어느 날, 바다의 행성 아퀘리아에 소속 불명의 기계 군단이 나타난다——.',
];
