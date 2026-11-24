# NOVA LANCER (노바 랜서) 🇰🇷 한글판

> 석양의 바다를 편대로 나는 랜서 대

**▶ 브라우저에서 바로 플레이: https://sigco3111.github.io/nova-lancer/**

원작: [tanuu5/nova-lancer](https://github.com/tanuu5/nova-lancer) (제작: **たぬ**, MIT License) · 원본 일본어 README는 [README.ja.md](README.ja.md)

이 저장소는 원작을 포크해 **게임 안의 모든 텍스트를 한국어로 옮긴 한글화판**입니다. 게임 로직, 캐릭터 ID, 에셋(전부 코드로 생성)은 원작 그대로입니다.

## 한글화 내용

- 메뉴, 설정, 조작 방법, 일시정지, 결과 화면, 패스워드 화면 등 UI 전체
- 미션 1 「AZURE COAST」와 미션 2 「VIOLET SARGASSO」의 무선 대사, 팁, 브리핑, 보스 연출, 미션 후 대화
- 캐릭터 소개(프로필, 종족, 나이 등), 프롤로그
- 한국어 폰트 추가 (Noto Sans KR, Google Fonts)
- 무선 대사를 읽을 때 나는 "말소리"(블립 음)가 한글 모음(ㅏ ㅓ ㅗ ㅜ ㅣ)에 맞춰 울리도록 보정
- `<html lang="ko">`로 변경

캐릭터 이름 표기: 코타(コタ), 간테츠(ガンテツ), 리오(リオ), 호 사령관(ホウ司令), 미즈치(ミズチ), 츠무지(ツムジ), 기리(キリ), 하리(ハリ), 가샤도쿠로(ガシャドクロ).

## 게임 소개

스타폭스 스타일의 3D 레일 슈팅 게임을 브라우저용으로 처음부터 만든 오리지널 작품입니다. Three.js로 그리며, 지형, 바다, 하늘, 기체, 보스는 모두 코드로 생성합니다. BGM, 효과음, 무선 캐릭터 음성(블립 음)도 Web Audio로 실시간 합성하므로 이미지와 음성 파일은 하나도 쓰지 않습니다.

| | |
| --- | --- |
| ![트윈 레이저로 적 편대를 노리는 해상전](docs/screenshots/ocean.jpg) | ![붉은 바위 협곡과 쓰러지는 바위 기둥](docs/screenshots/canyon.jpg) |
| ![네온이 빛나는 밤의 요새 도시](docs/screenshots/fortress.jpg) | ![바다에서 솟아오르는 해룡형 보스 「미즈치」](docs/screenshots/boss-rise.jpg) |

*위 스크린샷은 원작 자료이며 일본어 화면입니다. 한글판 화면은 위 플레이 링크에서 확인하세요.*

## 스테이지

**MISSION 01 「AZURE COAST」** (약 3분 + 보스전)

1. **석양의 바다**: 바위 아치, 바다에서 솟은 바위 기둥, 편대로 날아오는 적기, 쫓기는 동료기 구출
2. **붉은 바위 협곡**: 구불구불한 계곡, 쓰러지는 바위 기둥, 다리 위 포대, 기뢰
3. **밤의 요새 도시**: 네온 마천루, 대공 포화, 에너지 게이트
4. **보스 「미즈치」**: 바닷속에서 나타나는 기계 해룡. 등의 포대를 부수면 입안의 코어가 약점으로 드러납니다.

**MISSION 02 「VIOLET SARGASSO」**: 난파선이 떠다니는 사르가소 우주. 용병 카마이타치 대와 보스 「가샤도쿠로」가 등장합니다. 미션 3 이후는 원작에서도 준비 중입니다.

## 할 수 있는 것

- 샷을 길게 눌러 차지하면 락온, 유도탄으로 한꺼번에 격추
- 스마트 봄, 롤링(적 탄 튕겨내기), 부스트 / 브레이크
- 링(실드 회복), 골드 링 3개로 실드 최대치 업(3개 더 모으면 1UP), 레이저 강화, 체크포인트
- 동료기 3명(코타 / 간테츠 / 리오)과 사령부(호 사령관)의 무선. 말할 때마다 얼굴 그래픽의 입이 움직입니다
- 출격 연출, 보스 등장 연출, 승리 후 선회 카메라, 결과 화면(랭크, 메달, 하이 스코어 저장)
- 난이도 3단계, 키보드 / 마우스 / 게임패드 / 스마트폰 터치 조작 지원
- 사양이 낮으면 렌더링 해상도를 자동으로 낮춤(설정에서 화질 고정도 가능)

## 조작 방법

| 조작 | 키보드 | 게임패드 |
| --- | --- | --- |
| 이동 | W A S D / 방향키 | 왼쪽 스틱 / 십자키 |
| 샷 (길게 누르면 차지 → 떼면 락온 탄) | J / Space / Z / 좌클릭 | A |
| 스마트 봄 (한 번 더 누르면 즉시 기폭) | K / B / X / 우클릭 | B / Y |
| 부스트 | L / Shift / C | R2 |
| 브레이크 | I / V | L2 / X |
| 롤링 (재빨리 2번 누른다. 계속 누르면 기체를 기울여 날카롭게 선회) | Q / E (U / O) | L1 / R1 |
| 일시정지 | Esc / P | Start |

스마트폰에서는 화면 왼쪽 아래를 드래그해 이동하고, 오른쪽 아래 버튼으로 각 동작을 합니다. 브라우저 정책상 소리는 처음에 키를 누르거나 화면을 클릭(탭)한 뒤부터 납니다.

## 기술 정보

| 항목 | 내용 |
| --- | --- |
| 렌더링 | three.js (WebGL), 후처리(블룸, 색수차, 렌즈 플레어) |
| 오디오 | Web Audio API 실시간 합성 (BGM, 효과음, 캐릭터 블립 음) |
| 번들 | esbuild로 three.js까지 포함한 단일 `index.html` 생성 |
| 배포 | GitHub Pages (`main` 브랜치 루트의 `index.html`) |
| 언어 | JavaScript (ES modules), HTML / CSS |

### 빌드

```bash
npm install
npm run build   # index.html (단독 실행 가능한 1파일) 생성
npm run dev     # 소스를 감시하며 개발 빌드 (소스맵 포함)
```

`index.html`은 빌드로 생성되는 파일이며 GitHub Pages가 그대로 서빙합니다. 번역 텍스트는 `src/` 아래 각 파일(`src/template.html`, `src/main.js`, `src/screens.js`, `src/profiles.js`, `src/stages/*.js`)에 있고, 수정 후에는 반드시 다시 빌드해야 합니다. 폰트만 Google Fonts에서 불러옵니다.

### 파일 구성

| 파일 | 내용 |
| --- | --- |
| `src/main.js` | 기동 처리, 게임 상태 전환, 메인 루프, 연출 카메라 |
| `src/gfx.js` | 렌더러, 후처리, 하늘, 대기 안개, 환경 맵 |
| `src/world.js` | 진행 경로, 지형 스트리밍 생성, 바다, 구름, 장식 |
| `src/ship.js` | 자기 기체 모델, 조종, 피해, 추적 카메라 |
| `src/weapons.js` | 레이저, 차지 샷과 락온, 봄, 적 탄 |
| `src/enemies.js` | 적 모델, 움직임, 공격 |
| `src/boss.js` / `src/gashadokuro.js` | 보스 「미즈치」 / 「가샤도쿠로」 |
| `src/stages/` | 스테이지 진행(적 출현, 무선 대사, 브리핑) |
| `src/profiles.js` | 캐릭터 소개 |
| `src/hud.js` / `src/screens.js` | HUD, 무선 창, 메뉴, 결과, 패스워드 화면 |
| `src/audio.js` | BGM, 효과음, 캐릭터 음성 합성 |
| `src/portraits.js` | 무선 창 얼굴 그래픽 (SVG) |
| `src/template.html` | HTML과 CSS (빌드 시 스크립트 삽입) |

## 크레딧 · 라이선스

- 원작, 기획, 개발: **たぬ** ([tanuu5/nova-lancer](https://github.com/tanuu5/nova-lancer)), Claude Code × Claude Opus 5.5로 제작
- 코드: MIT License ([LICENSE](LICENSE)). 이 한글화판도 같은 라이선스와 원작 저작권 표기를 그대로 유지합니다.
- 3D 렌더링: [three.js](https://threejs.org/) (MIT License, `index.html`에 포함)
- 폰트: Russo One, Oxanium, M PLUS 1, DotGothic16, Noto Sans KR (Google Fonts, SIL Open Font License)
- 등장하는 캐릭터, 기체, 곡, 스테이지는 모두 이 작품만을 위한 오리지널이며 닌텐도 『스타폭스』 시리즈와 무관합니다.
