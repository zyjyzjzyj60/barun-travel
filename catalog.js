const bilingual = (ko, zh) => ({ ko, zh });

const xianImages = [
  { position: 1, url: "/assets/xian-terracotta.webp", alt: bilingual("병마용", "兵马俑"), author: "scott1346", sourceUrl: "https://commons.wikimedia.org/wiki/File:Terra_Cotta_army.jpg", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/" },
  { position: 2, url: "/assets/xian-huaqing.webp", alt: bilingual("화청궁", "华清宫"), author: "Fernando", sourceUrl: "https://commons.wikimedia.org/wiki/File:Huaqing_(35109621691).jpg", license: "CC BY-SA 2.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/" },
  { position: 3, url: "/assets/xian-pagoda.webp", alt: bilingual("대안탑", "大雁塔"), author: "Kevin Poh", sourceUrl: "https://commons.wikimedia.org/wiki/File:Big_Wild_Goose_Pagoda_(3515721587).jpg", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/" },
  { position: 4, url: "/assets/xian-city-wall.webp", alt: bilingual("서안 성벽", "西安城墙"), author: "Gary Todd", sourceUrl: "https://commons.wikimedia.org/wiki/File:Xi%27an_City_Wall_(9912110523).jpg", license: "CC0 1.0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/" }
];

const catalog = [
  {
    id: "xian-4d",
    title: bilingual("서안, 천년의 시간을 걷다", "西安，行走在千年时间里"),
    subtitle: bilingual("인천에서 직항으로 떠나는 3박 4일, 진·당의 기억", "仁川直飞 3 晚 4 日，遇见秦与唐的记忆"),
    duration: bilingual("3박 4일", "3晚4日"),
    departure: bilingual("인천국제공항", "仁川国际机场"),
    airline: bilingual("대한항공 직항", "大韩航空直飞"),
    destination: bilingual("중국 · 시안", "中国 · 西安"),
    description: bilingual("처음 서안을 만나는 여행자를 위한 핵심 여정입니다. 병마용의 시간, 화청궁의 산자락, 성벽 위의 바람과 대당불야성의 밤을 한 호흡으로 잇습니다.", "为第一次探访西安的旅客安排的核心路线：从兵马俑的时间、华清宫的山色，到城墙上的风与大唐不夜城的夜色。"),
    tag: bilingual("역사 도시", "历史古都"),
    theme: "xian",
    heroImage: "/assets/xian-terracotta.webp",
    map: { viewBox: "0 0 740 248", nodes: [
      { label: bilingual("인천", "仁川"), x: 64, y: 124, day: 1 }, { label: bilingual("시안", "西安"), x: 258, y: 124, day: 1 }, { label: bilingual("린퉁", "临潼"), x: 413, y: 78, day: 2 }, { label: bilingual("대안탑", "大雁塔"), x: 540, y: 161, day: 3 }, { label: bilingual("인천", "仁川"), x: 676, y: 124, day: 4 }
    ] },
    highlights: [
      bilingual("대한항공 인천 직항", "大韩航空仁川直飞"), bilingual("병마용·화청궁 핵심 관람", "兵马俑、华清宫核心游览"), bilingual("성벽 라이딩과 야경 산책", "城墙骑行与夜景漫步"), bilingual("3박 연박으로 짐 이동 최소화", "3晚连住，减少行李移动")
    ],
    itinerary: [
      { day: 1, title: bilingual("인천 → 시안 | 장안의 첫 밤", "仁川 → 西安｜长安的第一夜"), route: bilingual("인천국제공항 · 시안 도착 · 대당불야성 주변", "仁川国际机场 · 抵达西安 · 大唐不夜城周边"), transport: bilingual("대한항공 직항 · 전용 차량", "大韩航空直飞 · 专车接送"), meals: bilingual("석식", "晚餐"), hotel: bilingual("시안 시내 호텔", "西安市区酒店"), note: bilingual("항공편 도착 시간에 맞춰 공항 픽업과 체크인을 진행합니다.", "根据航班抵达时间安排接机与入住。"), spots: [
        { name: bilingual("대안탑 일대의 야경", "大雁塔周边夜景"), intro: bilingual("첫날 저녁은 대안탑 일대의 빛과 광장을 천천히 만나는 시간입니다. 실제 야간 동선은 항공편과 현지 운영에 따라 조정됩니다.", "首晚在大雁塔一带放慢脚步，感受广场与夜色；具体夜间动线以航班与当地安排为准。"), image: "/assets/xian-pagoda.webp", imageAlt: bilingual("대안탑", "大雁塔") }
      ] },
      { day: 2, title: bilingual("진시황의 시간과 화청궁", "秦始皇的时间与华清宫"), route: bilingual("시안 · 린퉁 · 시안", "西安 · 临潼 · 西安"), transport: bilingual("전용 관광 차량", "专属旅游巴士"), meals: bilingual("조식 / 중식 / 석식", "早 / 中 / 晚"), hotel: bilingual("시안 시내 호텔", "西安市区酒店"), note: bilingual("유적지 관람 순서는 당일 예약 상황과 혼잡도에 따라 조정될 수 있습니다.", "景区游览顺序可能随预约与客流情况调整。"), spots: [
        { name: bilingual("진시황 병마용 박물관", "秦始皇兵马俑博物馆"), intro: bilingual("진시황릉을 지키던 도용과 말의 군단을 가까이에서 관람합니다. 관람 구역과 해설 시간은 현장 운영을 따릅니다.", "近距离观看守护秦始皇陵的陶俑与陶马军阵，参观区域与讲解时间以现场运营为准。"), image: "/assets/xian-terracotta.webp", imageAlt: bilingual("병마용", "兵马俑") },
        { name: bilingual("화청궁", "华清宫"), intro: bilingual("리산 기슭의 온천 유적과 당대 궁원 문화를 살펴보는 코스입니다.", "在骊山脚下了解温泉遗址与唐代宫苑文化。"), image: "/assets/xian-huaqing.webp", imageAlt: bilingual("화청궁", "华清宫") }
      ] },
      { day: 3, title: bilingual("성벽 위의 바람, 대안탑의 오후", "城墙上的风，大雁塔的午后"), route: bilingual("시안 성벽 · 대안탑 · 시내", "西安城墙 · 大雁塔 · 市区"), transport: bilingual("전용 차량 · 도보", "专车 · 步行"), meals: bilingual("조식 / 중식 / 석식", "早 / 中 / 晚"), hotel: bilingual("시안 시내 호텔", "西安市区酒店"), note: bilingual("성벽 자전거 체험은 날씨와 현장 운영 상황에 따라 도보 관람으로 변경될 수 있습니다.", "城墙骑行可能因天气或现场运营改为步行参观。"), spots: [
        { name: bilingual("서안 성벽", "西安城墙"), intro: bilingual("도시의 윤곽을 따라 걷거나 자전거로 이동하며 고도와 현대 시가지의 대비를 느껴봅니다.", "沿城市轮廓步行或骑行，感受古城格局与现代街区的对照。"), image: "/assets/xian-city-wall.webp", imageAlt: bilingual("서안 성벽", "西安城墙") },
        { name: bilingual("대안탑·대자은사", "大雁塔与大慈恩寺"), intro: bilingual("현장 관람 범위 안에서 현장 안내에 따라 탑과 사찰 일대를 둘러봅니다.", "在现场开放范围内，依照导览参观宝塔与寺院一带。"), image: "/assets/xian-pagoda.webp", imageAlt: bilingual("대안탑", "大雁塔") }
      ] },
      { day: 4, title: bilingual("시안 → 인천 | 다음 장으로", "西安 → 仁川｜前往下一章"), route: bilingual("호텔 · 시안 공항 · 인천", "酒店 · 西安机场 · 仁川"), transport: bilingual("전용 차량 · 대한항공", "专车 · 大韩航空"), meals: bilingual("조식", "早餐"), hotel: bilingual("", ""), note: bilingual("출발 전 자유 시간과 공항 이동은 확정 항공편 시간을 기준으로 안내합니다.", "离店前自由时间与送机安排以最终航班时间为准。"), spots: [] }
    ],
    included: [bilingual("왕복 항공권 및 세금", "往返机票及税费"), bilingual("일정상 숙박과 식사", "行程所列住宿与餐食"), bilingual("일정상 입장료와 전용 차량", "行程所列门票与专属车辆"), bilingual("현지 가이드 서비스", "当地导游服务")],
    excluded: [bilingual("가이드·기사 경비", "导游与司机服务费"), bilingual("개인 경비와 선택 일정", "个人消费与自选项目"), bilingual("일정에 없는 식사", "行程未列餐食")],
    notes: [bilingual("본 페이지의 일정·가격·좌석은 공개 시연용입니다. 실제 출발은 운영자 확인 후 확정됩니다.", "本页行程、价格与余位用于公开演示，实际出发以运营方确认通知为准。"), bilingual("이 시연 사이트에는 여권 번호나 결제 카드 정보를 입력하지 마세요.", "请勿在本演示站填写护照号码、支付卡等敏感信息。")],
    images: xianImages
  },
  {
    id: "silkroad-11d",
    title: bilingual("실크로드, 사막과 천산 사이", "丝绸之路，穿行沙漠与天山之间"),
    subtitle: bilingual("시안에서 우루무치까지, 10박 11일의 대륙 횡단", "从西安到乌鲁木齐，10 晚 11 日的横贯之旅"),
    duration: bilingual("10박 11일", "10晚11日"),
    departure: bilingual("인천국제공항", "仁川国际机场"),
    airline: bilingual("대한항공 및 현지 교통", "大韩航空及当地交通"),
    destination: bilingual("중국 · 간쑤 · 신장", "中国 · 甘肃 · 新疆"),
    description: bilingual("서안에서 출발해 천수·란저우·장예·가욕관·둔황·투루판·우루무치로 이어지는 장거리 여정입니다. 고속철·차량·국내선 이동이 섞여 있어 날마다 다른 풍경과 이동 리듬을 만납니다.", "从西安出发，经天水、兰州、张掖、嘉峪关、敦煌、吐鲁番至乌鲁木齐的长线旅程。高铁、车辆与国内航段交织，每天都有不同风景与移动节奏。"),
    tag: bilingual("대륙 횡단", "横贯大陆"),
    theme: "silk",
    heroImage: "/assets/silk-danxia.webp",
    map: { viewBox: "0 0 960 288", nodes: [
      { label: bilingual("인천", "仁川"), x: 56, y: 148, day: 1 }, { label: bilingual("시안", "西安"), x: 168, y: 142, day: 1 }, { label: bilingual("천수", "天水"), x: 275, y: 94, day: 3 }, { label: bilingual("란저우", "兰州"), x: 362, y: 128, day: 3 }, { label: bilingual("장예", "张掖"), x: 485, y: 92, day: 5 }, { label: bilingual("가욕관", "嘉峪关"), x: 581, y: 132, day: 6 }, { label: bilingual("둔황", "敦煌"), x: 675, y: 91, day: 7 }, { label: bilingual("투루판", "吐鲁番"), x: 776, y: 162, day: 9 }, { label: bilingual("우루무치", "乌鲁木齐"), x: 896, y: 109, day: 10 }
    ] },
    highlights: [bilingual("맥적산·막고굴 등 석굴 문화", "麦积山、莫高窟等石窟文化"), bilingual("장예 단샤와 쿠무타거 사막", "张掖丹霞与库木塔格沙漠"), bilingual("가욕관에서 천산천지까지", "从嘉峪关到天山天池"), bilingual("고속철·전용 차량·국내선 이동", "高铁、专车与国内航段组合")],
    itinerary: [
      { day: 1, title: bilingual("인천 → 시안 | 실크로드의 문", "仁川 → 西安｜丝路之门"), route: bilingual("인천 · 시안", "仁川 · 西安"), transport: bilingual("대한항공 · 전용 차량", "大韩航空 · 专车"), meals: bilingual("석식", "晚餐"), hotel: bilingual("시안 시내 호텔", "西安市区酒店"), note: bilingual("도착 후 호텔 체크인과 휴식을 우선합니다.", "抵达后优先安排入住与休息。"), spots: [{ name: bilingual("대당불야성 주변", "大唐不夜城周边"), intro: bilingual("도착 시간에 여유가 있을 때 시안의 야간 분위기를 가볍게 만납니다.", "若抵达时间允许，轻松感受西安的夜间氛围。"), image: "/assets/xian-pagoda.webp", imageAlt: bilingual("대안탑", "大雁塔") }] },
      { day: 2, title: bilingual("시안 | 제국의 시작", "西安｜帝国的起点"), route: bilingual("시안 · 린퉁 · 시안", "西安 · 临潼 · 西安"), transport: bilingual("전용 관광 차량", "专属旅游巴士"), meals: bilingual("조식 / 중식 / 석식", "早 / 中 / 晚"), hotel: bilingual("시안 시내 호텔", "西安市区酒店"), note: bilingual("다음 날의 장거리 이동 전, 시안 핵심 유적을 집중해 봅니다.", "在长距离移动开始前集中游览西安核心遗产。"), spots: [{ name: bilingual("병마용", "兵马俑"), intro: bilingual("서안 동선의 대표 유적을 관람하며 장거리 실크로드 여행의 역사적 출발점을 만납니다.", "参观西安东线代表遗址，为丝路长线旅程开启历史起点。"), image: "/assets/xian-terracotta.webp", imageAlt: bilingual("병마용", "兵马俑") }, { name: bilingual("화청궁", "华清宫"), intro: bilingual("리산 아래의 온천 유적과 궁원 문화를 둘러봅니다.", "游览骊山脚下的温泉遗址与宫苑文化。"), image: "/assets/xian-huaqing.webp", imageAlt: bilingual("화청궁", "华清宫") }] },
      { day: 3, title: bilingual("시안 → 천수 → 란저우", "西安 → 天水 → 兰州"), route: bilingual("시안 · 천수 · 란저우", "西安 · 天水 · 兰州"), transport: bilingual("고속철 · 전용 차량", "高铁 · 专车"), meals: bilingual("조식 / 중식 / 석식", "早 / 中 / 晚"), hotel: bilingual("란저우 시내 호텔", "兰州市区酒店"), note: bilingual("열차 시간에 따라 맥적산 관람과 도시 이동의 순서가 조정될 수 있습니다.", "麦积山游览与城市移动顺序可能随列车时刻调整。"), spots: [{ name: bilingual("맥적산 석굴", "麦积山石窟"), intro: bilingual("절벽에 층층이 이어진 석굴군을 외부 동선과 현장 개방 범위에 따라 관람합니다.", "依照外部步道与开放范围，参观层叠于崖壁的石窟群。"), image: "/assets/silk-maijishan.webp", imageAlt: bilingual("맥적산 석굴", "麦积山石窟") }] },
      { day: 4, title: bilingual("란저우 → 장예 | 황하에서 하서주랑으로", "兰州 → 张掖｜从黄河到河西走廊"), route: bilingual("란저우 · 장예", "兰州 · 张掖"), transport: bilingual("고속철 · 전용 차량", "高铁 · 专车"), meals: bilingual("조식 / 중식 / 석식", "早 / 中 / 晚"), hotel: bilingual("장예 시내 호텔", "张掖市区酒店"), note: bilingual("도시 산책과 고속철 이동이 함께 있는 날입니다.", "当天包含城市漫步与高铁移动。"), spots: [{ name: bilingual("황하 풍정선", "黄河风情线"), intro: bilingual("란저우의 강변 풍경을 짧게 둘러본 뒤 하서주랑 방향으로 이동합니다.", "简要感受兰州黄河岸线风景后，向河西走廊方向移动。"), image: "/assets/silk-lanzhou.webp", imageAlt: bilingual("란저우 황허", "兰州黄河") }] },
      { day: 5, title: bilingual("장예 → 가욕관 | 색으로 된 지층", "张掖 → 嘉峪关｜地层写成的颜色"), route: bilingual("장예 · 가욕관", "张掖 · 嘉峪关"), transport: bilingual("전용 관광 차량", "专属旅游巴士"), meals: bilingual("조식 / 중식 / 석식", "早 / 中 / 晚"), hotel: bilingual("가욕관 시내 호텔", "嘉峪关市区酒店"), note: bilingual("일조와 날씨에 따라 단샤 지형의 색감이 달라집니다.", "丹霞地貌的色彩会随日照与天气变化。"), spots: [{ name: bilingual("장예 단샤 국가 지질공원", "张掖丹霞国家地质公园"), intro: bilingual("층층이 겹친 지질의 색과 선을 전망 구간에서 감상합니다.", "在观景区域欣赏层叠地层形成的色彩与线条。"), image: "/assets/silk-danxia.webp", imageAlt: bilingual("장예 단샤", "张掖丹霞") }, { name: bilingual("장예 대불사", "张掖大佛寺"), intro: bilingual("이동 전후 현장 운영 시간에 맞춰 사찰 유적을 둘러봅니다.", "视现场开放时间安排参观寺院遗址。"), image: "/assets/silk-danxia.webp", imageAlt: bilingual("장예 단샤", "张掖丹霞") }] },
      { day: 6, title: bilingual("가욕관 → 둔황 | 장성의 서쪽 끝", "嘉峪关 → 敦煌｜长城的西端"), route: bilingual("가욕관 · 둔황", "嘉峪关 · 敦煌"), transport: bilingual("전용 관광 차량", "专属旅游巴士"), meals: bilingual("조식 / 중식 / 석식", "早 / 中 / 晚"), hotel: bilingual("둔황 시내 호텔", "敦煌市区酒店"), note: bilingual("오후에는 사막 도시 둔황까지 차량으로 이동합니다.", "下午乘车前往沙漠绿洲城市敦煌。"), spots: [{ name: bilingual("가욕관 관성", "嘉峪关关城"), intro: bilingual("만리장성 서단의 관문 유적을 보며 하서주랑의 지리적 감각을 잡습니다.", "参观长城西端关隘遗址，理解河西走廊的地理尺度。"), image: "/assets/silk-jiayuguan.webp", imageAlt: bilingual("가욕관", "嘉峪关") }] },
      { day: 7, title: bilingual("둔황 | 석굴과 모래의 시간", "敦煌｜石窟与沙的时间"), route: bilingual("둔황 · 막고굴 · 명사산", "敦煌 · 莫高窟 · 鸣沙山"), transport: bilingual("전용 관광 차량", "专属旅游巴士"), meals: bilingual("조식 / 중식 / 석식", "早 / 中 / 晚"), hotel: bilingual("둔황 시내 호텔", "敦煌市区酒店"), note: bilingual("막고굴 예약 가능 구역과 명사산 체험 여부는 현지 예약·기상 조건을 따릅니다.", "莫高窟开放区域及鸣沙山体验以预约、天气与现场安排为准。"), spots: [{ name: bilingual("막고굴", "莫高窟"), intro: bilingual("실크로드 불교 예술의 대표 유적을 예약된 개방 범위에서 관람합니다.", "在预约开放范围内参观丝路佛教艺术代表遗产。"), image: "/assets/silk-mogao.webp", imageAlt: bilingual("막고굴", "莫高窟") }, { name: bilingual("명사산·월아천", "鸣沙山·月牙泉"), intro: bilingual("사구와 오아시스가 만나는 풍경을 보고, 선택 체험은 현장 조건에 따라 안내합니다.", "观看沙丘与绿洲相遇的景观；可选体验以现场条件为准。"), image: "/assets/silk-crescent.webp", imageAlt: bilingual("월아천", "月牙泉") }] },
      { day: 8, title: bilingual("둔황 → 선산 → 투루판", "敦煌 → 鄯善 → 吐鲁番"), route: bilingual("둔황 · 선산 · 투루판", "敦煌 · 鄯善 · 吐鲁番"), transport: bilingual("전용 관광 차량", "专属旅游巴士"), meals: bilingual("조식 / 중식 / 석식", "早 / 中 / 晚"), hotel: bilingual("투루판 시내 호텔", "吐鲁番市区酒店"), note: bilingual("장거리 차량 이동이 포함된 날로, 휴식 정차를 운영합니다.", "当天包含较长车程，按运营安排设置休息停靠。"), spots: [{ name: bilingual("쿠무타거 사막", "库木塔格沙漠"), intro: bilingual("도시와 맞닿은 사막 풍경을 관람하며 신장 구간으로 넘어갑니다.", "观赏与城市相接的沙漠景观，进入新疆路段。"), image: "/assets/silk-kumtag.webp", imageAlt: bilingual("쿠무타거 사막", "库木塔格沙漠") }] },
      { day: 9, title: bilingual("투루판 | 불의 산과 지하 수로", "吐鲁番｜火焰与地下水路"), route: bilingual("투루판 · 화염산 · 포도구 · 교하고성", "吐鲁番 · 火焰山 · 葡萄沟 · 交河故城"), transport: bilingual("전용 관광 차량", "专属旅游巴士"), meals: bilingual("조식 / 중식 / 석식", "早 / 中 / 晚"), hotel: bilingual("투루판 시내 호텔", "吐鲁番市区酒店"), note: bilingual("계절에 따라 포도밭 풍경과 야외 관람 체감 온도가 크게 달라질 수 있습니다.", "葡萄园景观与户外体感温度会随季节显著变化。"), spots: [{ name: bilingual("화염산", "火焰山"), intro: bilingual("붉은 능선과 침식 지형이 만드는 건조한 풍경을 봅니다.", "观看红色山脊与侵蚀地貌形成的干燥景观。"), image: "/assets/silk-flame.webp", imageAlt: bilingual("화염산", "火焰山") }, { name: bilingual("교하고성", "交河故城"), intro: bilingual("고대 도시 유적은 개방 동선과 보존 규정에 따라 관람합니다.", "依照开放路线与保护规定参观古城遗址。"), image: "/assets/silk-jiaohe.webp", imageAlt: bilingual("교하고성", "交河故城") }] },
      { day: 10, title: bilingual("투루판 → 우루무치 | 천산 아래", "吐鲁番 → 乌鲁木齐｜天山脚下"), route: bilingual("투루판 · 우루무치 · 천산천지", "吐鲁番 · 乌鲁木齐 · 天山天池"), transport: bilingual("고속철 · 전용 차량", "高铁 · 专车"), meals: bilingual("조식 / 중식 / 석식", "早 / 中 / 晚"), hotel: bilingual("우루무치 시내 호텔", "乌鲁木齐市区酒店"), note: bilingual("산악 지역 관람은 날씨와 도로 통제 가능성을 고려해 안내합니다.", "山区游览将考虑天气与道路管制情况安排。"), spots: [{ name: bilingual("천산천지", "天山天池"), intro: bilingual("보그다봉 아래의 호수 풍경을 현장 기상과 개방 범위에 맞춰 감상합니다.", "在现场天气与开放范围允许时欣赏博格达峰下的湖景。"), image: "/assets/silk-tianchi.webp", imageAlt: bilingual("천산천지", "天山天池") }, { name: bilingual("국제 대바자", "国际大巴扎"), intro: bilingual("도시의 저녁 시간에 시장 일대를 둘러봅니다. 쇼핑은 선택 사항입니다.", "傍晚逛城市市集一带，购物为自愿选择。"), image: "/assets/silk-bazaar.webp", imageAlt: bilingual("국제 대바자", "国际大巴扎") }] },
      { day: 11, title: bilingual("우루무치 → 인천 | 여행의 끝", "乌鲁木齐 → 仁川｜旅程终章"), route: bilingual("우루무치 · 경유지 · 인천", "乌鲁木齐 · 中转地 · 仁川"), transport: bilingual("국내선 · 국제선", "国内航段 · 国际航段"), meals: bilingual("조식", "早餐"), hotel: bilingual("", ""), note: bilingual("최종 항공편과 환승 시간에 맞춰 공항 이동을 안내합니다.", "根据最终航班与转机时间安排送机。"), spots: [] }
    ],
    included: [bilingual("왕복 국제선 및 일정상 국내 교통", "往返国际航段及行程所列国内交通"), bilingual("일정상 숙박·식사·입장료", "行程所列住宿、餐食与门票"), bilingual("고속철과 전용 차량", "高铁与专属车辆"), bilingual("현지 가이드 서비스", "当地导游服务")],
    excluded: [bilingual("가이드·기사 경비", "导游与司机服务费"), bilingual("개인 경비와 선택 체험", "个人消费与自选体验"), bilingual("일정에 없는 식사", "行程未列餐食")],
    notes: [bilingual("장거리 이동과 야외 관람이 많은 일정입니다. 열차·항공·날씨에 따라 일자별 순서가 조정될 수 있습니다.", "本路线包含较多长距离移动与户外参观，日程顺序可能受车次、航班与天气影响调整。"), bilingual("본 페이지의 일정·가격·좌석은 공개 시연용입니다. 실제 출발은 운영자 확인 후 확정됩니다.", "本页行程、价格与余位用于公开演示，实际出发以运营方确认通知为准。"), bilingual("이 시연 사이트에는 여권 번호나 결제 카드 정보를 입력하지 마세요.", "请勿在本演示站填写护照号码、支付卡等敏感信息。")],
    images: [
      { position: 1, url: "/assets/silk-danxia.webp", alt: bilingual("장예 단샤", "张掖丹霞"), author: "Yao Yao", sourceUrl: "https://unsplash.com/photos/rocky-mountain-photography-eAcEdHXDWVI", license: "Unsplash License", licenseUrl: "https://unsplash.com/license" },
      { position: 2, url: "/assets/silk-jiayuguan.webp", alt: bilingual("가욕관", "嘉峪关"), author: "Chawy", sourceUrl: "https://unsplash.com/photos/a-view-of-the-great-wall-of-china-2lWVm8P3VaI", license: "Unsplash License", licenseUrl: "https://unsplash.com/license" },
      { position: 3, url: "/assets/silk-crescent.webp", alt: bilingual("명사산 월아천", "鸣沙山月牙泉"), author: "Jeremy Huang", sourceUrl: "https://unsplash.com/photos/desert-oasis-with-crescent-shaped-lake-and-sand-dunes-l0QQuEHULaA", license: "Unsplash License", licenseUrl: "https://unsplash.com/license" },
      { position: 4, url: "/assets/silk-flame.webp", alt: bilingual("투루판 화염산", "吐鲁番火焰山"), author: "Christoph Theisinger", sourceUrl: "https://unsplash.com/photos/brown-sand-near-brown-mountain-during-daytime-B4mV8nB8pGA", license: "Unsplash License", licenseUrl: "https://unsplash.com/license" },
      { position: 5, url: "/assets/silk-tianchi.webp", alt: bilingual("천산천지", "天山天池"), author: "ダモ リ", sourceUrl: "https://unsplash.com/photos/a-frozen-lake-surrounded-by-mountains-and-snow-RL2VOUUOWvM", license: "Unsplash License", licenseUrl: "https://unsplash.com/license" },
      { position: 6, url: "/assets/silk-lanzhou.webp", alt: bilingual("란저우 황허", "兰州黄河"), author: "Howei Wang", sourceUrl: "https://unsplash.com/photos/a-metal-bridge-with-a-tower-in-the-background-_igov0xzRRE", license: "Unsplash License", licenseUrl: "https://unsplash.com/license" },
      { position: 7, url: "/assets/silk-kumtag.webp", alt: bilingual("쿠무타거 사막", "库木塔格沙漠"), author: "Sami Chau", sourceUrl: "https://unsplash.com/photos/a-person-standing-in-the-middle-of-a-desert-0k7RXb_8rII", license: "Unsplash License", licenseUrl: "https://unsplash.com/license" }
    ]
  }
];

module.exports = { catalog, bilingual };
