// Character page entries (title → キャラクター). Texts only tell what the player could know at the start;
// anyone marked `known: false` shows as ??? until they have been met in the game (campaign.markSeen).
// face: portrait id (portraits.js; null = no face), ship: whose 3D ship the title camera circles while selected.
export const PROFILES = [
  {
    id: 'lancer1', group: '랜서 대', role: 'LANCER 1 · 대장', nameJa: '랜서 1', name: 'LANCER 1', face: null, ship: 'player', known: true,
    stats: [['소속', '신생 랜서 대'], ['기체', '흰색에 파랑과 주황']],
    text: '신생 랜서 대의 대장. 사관학교를 수석으로 졸업한 젊은 에이스이며 간테츠의 제자. 선대 대장기를 이어받은 후계기에 탄다. 무선으로는 말하지 않는다——그것은 바로 당신 자신이니까.',
    line: null,
  },
  {
    id: 'kota', group: '랜서 대', role: 'LANCER 2', nameJa: '코타', name: 'KOTA', face: 'kota', ship: 'kota', known: true,
    stats: [['종족', '레서판다'], ['나이', '18'], ['컬러', '주황'], ['1인칭', '나(보쿠)']],
    text: '활발하고 수다쟁이에 겁이 없다. 실력은 좋지만 너무 깊이 파고들어서 자주 적에게 쫓겨 다닌다. 숲의 행성 실바 출신. 가슴의 별 와펜은 어릴 때 에어쇼에서 동경하던 파일럿에게 받은 보물.',
    line: '좋았어, 간다! 대장, 확실히 따라갈게!',
  },
  {
    id: 'gantetsu', group: '랜서 대', role: 'LANCER 3', nameJa: '간테츠', name: 'GANTETSU', face: 'gantetsu', ship: 'gantetsu', known: true,
    stats: [['종족', '일본오소리'], ['나이', '52'], ['컬러', '올리브'], ['1인칭', '나(오레)']],
    text: '과묵하다. 입을 열면 짧고 정확한 조언을 한다. 고글과 얼굴의 흉터가 트레이드마크. 구 랜서 대의 고참으로, 대 해산 후에는 사관학교 교관으로서 대장과 코타를 단련시켰다.',
    line: '진정해라. 한 기씩, 확실하게다.',
  },
  {
    id: 'rio', group: '랜서 대', role: 'LANCER 4', nameJa: '리오', name: 'RIO', face: 'rio', ship: 'rio', known: true,
    stats: [['종족', '수달'], ['나이', '24'], ['컬러', '터키석색'], ['1인칭', '나(와타시)']],
    text: '냉정한 전자전 · 해석 담당. 한쪽 눈의 소형 모니터로 적을 해석한다. 말투는 부드럽지만 판단은 누구보다 빠르다. 바다의 행성 아퀘리아의 어촌 출신으로, 할머니에게 옛날이야기를 들으며 자랐다.',
    line: '해석은 저한테 맡겨요. 대장은 앞만 보세요.',
  },
  {
    id: 'hou', group: '사령부', role: 'COMMAND', nameJa: '호 사령관', name: 'HOU', face: 'hou', ship: null, known: true,
    stats: [['종족', '수리부엉이'], ['나이', '64'], ['컬러', '골드'], ['1인칭', '나(와타시)']],
    text: '모함 아케보노의 사령관. 엄격하며 무선에서는 말수가 적다. 옛날이야기 연구가이기도 해서, 전설의 「창 든 자」에서 따와 랜서 대라고 이름 붙였다.',
    line: '무리하지 마라, 랜서 1.',
  },
  {
    id: 'ibuki', group: '???', role: '???', nameJa: '이부키', name: 'IBUKI', face: 'ibuki', ship: null, known: false,
    stats: [['종족', '눈표범'], ['나이', '38']],
    text: '검은 기체를 타는 정체불명의 파일럿.',
    line: null,
  },
  {
    id: 'tsumuji', group: '카마이타치 대', role: 'KAMAITACHI 1', nameJa: '츠무지', name: 'TSUMUJI', face: 'tsumuji', ship: null, known: false,
    stats: [['종족', '족제비'], ['입장', '장남 · 리더'], ['컬러', '그린'], ['1인칭', '나(오레)']],
    text: '용병 카마이타치 대의 리더. 삼남매의 장남. 촐싹대며 도발을 아주 좋아한다. 낫 모양 날개로 날고, 회오리바람 고리(충격파)로 상대의 태세를 무너뜨린다. 「나리」라 부르는 누군가에게 고용되어 있다.',
    line: '어이, 병아리들! 우리는 카마이타치 대다!',
  },
  {
    id: 'kiri', group: '카마이타치 대', role: 'KAMAITACHI 2', nameJa: '기리', name: 'KIRI', face: 'kiri', ship: null, known: false,
    stats: [['종족', '족제비'], ['입장', '장녀'], ['컬러', '크림슨']],
    text: '카마이타치 대의 장녀. 말이 없고 차갑다. 등 뒤로 돌아 들어와 칼날 날개로 일직선으로 베고 지나간다.',
    line: '…벤다.',
  },
  {
    id: 'hari', group: '카마이타치 대', role: 'KAMAITACHI 3', nameJa: '하리', name: 'HARI', face: 'hari', ship: null, known: false,
    stats: [['종족', '족제비'], ['입장', '막내 · 정비사'], ['컬러', '옐로']],
    text: '카마이타치 대의 막내. 소심하지만 정비 실력은 천재적이다. 전투 중에 형과 누나의 기체를 수리 빔으로 고쳐버린다.',
    line: '저, 저기… 죄송해요!',
  },
  {
    id: 'mizuchi', group: '기계수', role: 'MACHINE BEAST', nameJa: '미즈치', name: 'MIZUCHI', face: 'mizuchi', ship: null, known: false,
    stats: [['옛날이야기', '미즈치(蛟): 물에 사는 용'], ['출현', '행성 아퀘리아']],
    text: '바다에서 나타난 용의 모습을 한 기계수. 리오의 할머니가 들려주던 옛날이야기 속 바다 용과 꼭 닮아서 이 이름으로 불리게 되었다. 등에 포대를 늘어놓고 입안의 코어에서 소사 빔을 쏜다. 더듬거리는 말을 한다.',
    line: '…침입자 확인. 배제한다.',
  },
  {
    id: 'gashadokuro', group: '기계수', role: 'MACHINE BEAST', nameJa: '가샤도쿠로', name: 'GASHADOKURO', face: 'gashadokuro', ship: null, known: false,
    stats: [['옛날이야기', '가샤도쿠로(がしゃどくろ): 거대한 해골'], ['출현', '사르가소 우주']],
    text: '배의 무덤에서 난파선 잔해가 모여 만들어진 거대한 해골 모양의 기계수. 팔 관절을 부수면 산산이 무너지지만, 잠시 후 다시 조립된다. 두개골 안에 코어가 있다.',
    line: '…뼈, 모자라. 네 뼈도…내놔라.',
  },
];
