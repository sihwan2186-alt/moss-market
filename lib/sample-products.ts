import type { Locale } from '@/lib/i18n'

type SampleProductTranslation = {
  name: string
  description: string
}

export type SampleProduct = {
  seedKey: string
  name: string
  description: string
  price: number
  images: string[]
  stock: number
  category: 'Accessories' | 'Audio' | 'Bags' | 'General' | 'Home' | 'Kitchen' | 'Shoes' | 'Travel'
  featured: boolean
  translations: {
    ko: SampleProductTranslation
  }
}

export const sampleProducts: SampleProduct[] = [
  {
    seedKey: 'everyday-canvas-tote',
    name: 'Everyday Canvas Tote',
    description: 'A roomy tote bag for market runs, office commutes, and weekend trips.',
    price: 39,
    images: ['https://picsum.photos/seed/moss-everyday-canvas-tote/900/675'],
    stock: 14,
    category: 'Bags',
    featured: true,
    translations: {
      ko: {
        name: '데일리 캔버스 토트',
        description: '장보기, 출근, 주말 여행까지 여유롭게 담기는 넉넉한 토트백입니다.',
      },
    },
  },
  {
    seedKey: 'minimal-desk-lamp',
    name: 'Minimal Desk Lamp',
    description: 'Soft ambient light with a clean silhouette that fits modern rooms.',
    price: 64,
    images: ['https://picsum.photos/seed/moss-minimal-desk-lamp/900/675'],
    stock: 9,
    category: 'Home',
    featured: true,
    translations: {
      ko: {
        name: '미니멀 데스크 램프',
        description: '모던한 공간에 잘 어울리는, 부드러운 무드 조명을 더해주는 미니멀 램프입니다.',
      },
    },
  },
  {
    seedKey: 'cloud-runner-sneakers',
    name: 'Cloud Runner Sneakers',
    description: 'Breathable daily sneakers with a light foam sole and neutral palette.',
    price: 89,
    images: ['https://picsum.photos/seed/moss-cloud-runner-sneakers/900/675'],
    stock: 18,
    category: 'Shoes',
    featured: false,
    translations: {
      ko: {
        name: '클라우드 러너 스니커즈',
        description: '가벼운 폼 솔과 차분한 컬러가 어우러진 통기성 좋은 데일리 스니커즈입니다.',
      },
    },
  },
  {
    seedKey: 'stoneware-mug-set',
    name: 'Stoneware Mug Set',
    description: 'Hand-finished mugs designed for slow mornings and warm drinks.',
    price: 28,
    images: ['https://picsum.photos/seed/moss-stoneware-mug-set/900/675'],
    stock: 24,
    category: 'Kitchen',
    featured: false,
    translations: {
      ko: {
        name: '스톤웨어 머그 세트',
        description: '느긋한 아침과 따뜻한 음료를 위해 손맛 있게 마감한 머그 세트입니다.',
      },
    },
  },
  {
    seedKey: 'studio-headphones',
    name: 'Studio Headphones',
    description: 'Comfortable over-ear headphones for focused work sessions and late-night listening.',
    price: 119,
    images: ['https://picsum.photos/seed/moss-studio-headphones/900/675'],
    stock: 11,
    category: 'Audio',
    featured: true,
    translations: {
      ko: {
        name: '스튜디오 헤드폰',
        description: '집중이 필요한 작업과 늦은 밤 감상에 어울리는 편안한 오버이어 헤드폰입니다.',
      },
    },
  },
  {
    seedKey: 'heritage-wristwatch',
    name: 'Heritage Wristwatch',
    description: 'A clean everyday watch with a brushed metal case and classic leather strap.',
    price: 149,
    images: ['https://picsum.photos/seed/moss-heritage-wristwatch/900/675'],
    stock: 7,
    category: 'Accessories',
    featured: false,
    translations: {
      ko: {
        name: '헤리티지 손목시계',
        description: '브러시드 메탈 케이스와 클래식한 가죽 스트랩이 돋보이는 데일리 워치입니다.',
      },
    },
  },
  {
    seedKey: 'indoor-plant-stand',
    name: 'Indoor Plant Stand',
    description: 'A compact stand that gives your favorite houseplants a brighter corner of the room.',
    price: 52,
    images: ['https://picsum.photos/seed/moss-indoor-plant-stand/900/675'],
    stock: 16,
    category: 'Home',
    featured: false,
    translations: {
      ko: {
        name: '인도어 플랜트 스탠드',
        description: '좋아하는 식물을 방 안의 더 밝은 자리로 돋보이게 해주는 컴팩트한 스탠드입니다.',
      },
    },
  },
  {
    seedKey: 'pour-over-coffee-kit',
    name: 'Pour-Over Coffee Kit',
    description: 'A simple brew set with a dripper, server, and filters for calm weekend mornings.',
    price: 46,
    images: ['https://picsum.photos/seed/moss-pour-over-coffee-kit/900/675'],
    stock: 19,
    category: 'Kitchen',
    featured: true,
    translations: {
      ko: {
        name: '푸어오버 커피 키트',
        description: '차분한 주말 아침을 위한 드리퍼, 서버, 필터 구성의 심플한 브루잉 세트입니다.',
      },
    },
  },
  {
    seedKey: 'weekend-duffel',
    name: 'Weekend Duffel',
    description: 'A lightweight carry bag sized for overnight trips, gym sessions, and quick getaways.',
    price: 79,
    images: ['https://picsum.photos/seed/moss-weekend-duffel/900/675'],
    stock: 12,
    category: 'Travel',
    featured: false,
    translations: {
      ko: {
        name: '위켄드 더플백',
        description: '하룻밤 여행, 헬스장, 가벼운 외출에 맞춘 경량 더플백입니다.',
      },
    },
  },
  {
    seedKey: 'wool-lounge-blanket',
    name: 'Wool Lounge Blanket',
    description: 'A soft textured blanket for reading chairs, sofas, and cooler evenings at home.',
    price: 58,
    images: ['https://picsum.photos/seed/moss-wool-lounge-blanket/900/675'],
    stock: 15,
    category: 'Home',
    featured: false,
    translations: {
      ko: {
        name: '울 라운지 블랭킷',
        description: '독서 의자, 소파, 선선한 저녁과 잘 어울리는 부드러운 텍스처의 울 블랭킷입니다.',
      },
    },
  },
  {
    seedKey: 'commuter-backpack',
    name: 'Commuter Backpack',
    description: 'A structured backpack with padded straps and quick-access pockets for daily carry.',
    price: 72,
    images: ['https://picsum.photos/seed/moss-commuter-backpack/900/675'],
    stock: 13,
    category: 'Bags',
    featured: true,
    translations: {
      ko: {
        name: '커뮤터 백팩',
        description: '패딩 스트랩과 빠른 수납 포켓을 갖춘, 매일 들기 좋은 구조감 있는 백팩입니다.',
      },
    },
  },
  {
    seedKey: 'ceramic-serving-bowl',
    name: 'Ceramic Serving Bowl',
    description: 'A glazed bowl sized for salads, pasta, and generous family-style dinners.',
    price: 34,
    images: ['https://picsum.photos/seed/moss-ceramic-serving-bowl/900/675'],
    stock: 20,
    category: 'Kitchen',
    featured: false,
    translations: {
      ko: {
        name: '세라믹 서빙 볼',
        description: '샐러드, 파스타, 홈파티 요리를 넉넉하게 담기 좋은 유약 마감의 서빙 볼입니다.',
      },
    },
  },
  {
    seedKey: 'linen-table-runner',
    name: 'Linen Table Runner',
    description: 'A relaxed linen runner that softens your table setting with subtle texture.',
    price: 31,
    images: ['https://picsum.photos/seed/moss-linen-table-runner/900/675'],
    stock: 17,
    category: 'Home',
    featured: false,
    translations: {
      ko: {
        name: '리넨 테이블 러너',
        description: '은은한 텍스처로 식탁 분위기를 부드럽게 정리해주는 내추럴 리넨 러너입니다.',
      },
    },
  },
  {
    seedKey: 'trail-flask-bottle',
    name: 'Trail Flask Bottle',
    description: 'An insulated bottle that keeps drinks cold on hikes, commutes, and long study days.',
    price: 26,
    images: ['https://picsum.photos/seed/moss-trail-flask-bottle/900/675'],
    stock: 23,
    category: 'Travel',
    featured: false,
    translations: {
      ko: {
        name: '트레일 플라스크 보틀',
        description: '등산, 출근, 긴 공부 시간에도 음료 온도를 오래 지켜주는 보온 보냉 보틀입니다.',
      },
    },
  },
  {
    seedKey: 'everyday-knit-beanie',
    name: 'Everyday Knit Beanie',
    description: 'A soft knit beanie with a close fit for chilly mornings and easy layering.',
    price: 22,
    images: ['https://picsum.photos/seed/moss-everyday-knit-beanie/900/675'],
    stock: 27,
    category: 'Accessories',
    featured: false,
    translations: {
      ko: {
        name: '에브리데이 니트 비니',
        description: '쌀쌀한 아침에 가볍게 쓰기 좋은 밀착 핏의 부드러운 니트 비니입니다.',
      },
    },
  },
  {
    seedKey: 'motion-bluetooth-speaker',
    name: 'Motion Bluetooth Speaker',
    description: 'A compact speaker with balanced sound for desks, kitchens, and small gatherings.',
    price: 96,
    images: ['https://picsum.photos/seed/moss-motion-bluetooth-speaker/900/675'],
    stock: 10,
    category: 'Audio',
    featured: true,
    translations: {
      ko: {
        name: '모션 블루투스 스피커',
        description: '책상, 주방, 작은 모임 공간에 잘 어울리는 균형 잡힌 사운드의 컴팩트 스피커입니다.',
      },
    },
  },
  {
    seedKey: 'cedar-cutting-board',
    name: 'Cedar Cutting Board',
    description: 'A durable prep board with warm wood grain for everyday slicing and serving.',
    price: 41,
    images: ['https://picsum.photos/seed/moss-cedar-cutting-board/900/675'],
    stock: 14,
    category: 'Kitchen',
    featured: false,
    translations: {
      ko: {
        name: '시더 커팅 보드',
        description: '매일의 손질과 플레이팅에 모두 잘 어울리는 따뜻한 우드 그레인의 내구성 좋은 보드입니다.',
      },
    },
  },
  {
    seedKey: 'nomad-passport-holder',
    name: 'Nomad Passport Holder',
    description: 'A slim travel organizer for passports, cards, and folded itineraries.',
    price: 37,
    images: ['https://picsum.photos/seed/moss-nomad-passport-holder/900/675'],
    stock: 22,
    category: 'Travel',
    featured: false,
    translations: {
      ko: {
        name: '노마드 여권 홀더',
        description: '여권, 카드, 여행 일정을 슬림하게 정리할 수 있는 실용적인 여행용 홀더입니다.',
      },
    },
  },
  {
    seedKey: 'slip-on-city-loafers',
    name: 'Slip-On City Loafers',
    description: 'Polished slip-on loafers built for office looks and easy weekend walks.',
    price: 94,
    images: ['https://picsum.photos/seed/moss-slip-on-city-loafers/900/675'],
    stock: 8,
    category: 'Shoes',
    featured: false,
    translations: {
      ko: {
        name: '슬립온 시티 로퍼',
        description: '오피스 룩과 주말 산책 모두에 어울리는 단정한 실루엣의 슬립온 로퍼입니다.',
      },
    },
  },
  {
    seedKey: 'matte-water-bottle',
    name: 'Matte Water Bottle',
    description: 'A matte-finish bottle that fits cup holders, tote bags, and busy routines.',
    price: 24,
    images: ['https://picsum.photos/seed/moss-matte-water-bottle/900/675'],
    stock: 30,
    category: 'General',
    featured: false,
    translations: {
      ko: {
        name: '매트 워터 보틀',
        description: '컵홀더와 토트백에 쏙 들어가 바쁜 일상 속에서 쓰기 좋은 매트 질감의 보틀입니다.',
      },
    },
  },
  {
    seedKey: 'desk-organizer-tray',
    name: 'Desk Organizer Tray',
    description: 'A low-profile tray for pens, chargers, keys, and all the small things on your desk.',
    price: 29,
    images: ['https://picsum.photos/seed/moss-desk-organizer-tray/900/675'],
    stock: 18,
    category: 'Home',
    featured: false,
    translations: {
      ko: {
        name: '데스크 오거나이저 트레이',
        description: '펜, 충전기, 열쇠처럼 자잘한 물건을 책상 위에서 정돈해주는 낮은 트레이입니다.',
      },
    },
  },
  {
    seedKey: 'noise-isolating-earbuds',
    name: 'Noise-Isolating Earbuds',
    description: 'Pocket-friendly earbuds that cut distractions during commutes and focused work.',
    price: 88,
    images: ['https://picsum.photos/seed/moss-noise-isolating-earbuds/900/675'],
    stock: 16,
    category: 'Audio',
    featured: true,
    translations: {
      ko: {
        name: '노이즈 차단 이어버드',
        description: '출퇴근길과 집중 시간이 더 편안해지도록 주변 소음을 줄여주는 휴대용 이어버드입니다.',
      },
    },
  },
  {
    seedKey: 'soft-stripe-bath-towel',
    name: 'Soft Stripe Bath Towel',
    description: 'A plush striped towel that dries quickly and feels soft after every wash.',
    price: 27,
    images: ['https://picsum.photos/seed/moss-soft-stripe-bath-towel/900/675'],
    stock: 26,
    category: 'Home',
    featured: false,
    translations: {
      ko: {
        name: '소프트 스트라이프 배스 타월',
        description: '세탁 후에도 부드럽고 빨리 마르는 포근한 촉감의 스트라이프 타월입니다.',
      },
    },
  },
  {
    seedKey: 'carry-on-packing-cubes',
    name: 'Carry-On Packing Cubes',
    description: 'A matching set of packing cubes that keeps luggage neat and easy to unpack.',
    price: 33,
    images: ['https://picsum.photos/seed/moss-carry-on-packing-cubes/900/675'],
    stock: 21,
    category: 'Travel',
    featured: false,
    translations: {
      ko: {
        name: '캐리온 패킹 큐브',
        description: '짐을 깔끔하게 정리하고 도착 후에도 쉽게 꺼낼 수 있게 도와주는 패킹 큐브 세트입니다.',
      },
    },
  },
  {
    seedKey: 'leather-card-wallet',
    name: 'Leather Card Wallet',
    description: 'A slim wallet that carries daily cards without adding bulk to your pocket.',
    price: 49,
    images: ['https://picsum.photos/seed/moss-leather-card-wallet/900/675'],
    stock: 17,
    category: 'Accessories',
    featured: false,
    translations: {
      ko: {
        name: '레더 카드 월렛',
        description: '주머니를 두껍게 만들지 않으면서 필수 카드를 깔끔하게 담는 슬림한 지갑입니다.',
      },
    },
  },
  {
    seedKey: 'everyday-chef-knife',
    name: 'Everyday Chef Knife',
    description: 'A balanced chef knife made for prep work, weeknight dinners, and confident slicing.',
    price: 84,
    images: ['https://picsum.photos/seed/moss-everyday-chef-knife/900/675'],
    stock: 9,
    category: 'Kitchen',
    featured: true,
    translations: {
      ko: {
        name: '에브리데이 셰프 나이프',
        description: '손질과 요리 준비를 더 편안하게 해주는 균형감 좋은 데일리 셰프 나이프입니다.',
      },
    },
  },
  {
    seedKey: 'harbor-windbreaker',
    name: 'Harbor Windbreaker',
    description: 'A lightweight windbreaker that packs down small for travel and changing weather.',
    price: 109,
    images: ['https://picsum.photos/seed/moss-harbor-windbreaker/900/675'],
    stock: 11,
    category: 'Travel',
    featured: false,
    translations: {
      ko: {
        name: '하버 윈드브레이커',
        description: '여행 가방에 가볍게 넣어두기 좋은, 변덕스러운 날씨에 대응하는 경량 윈드브레이커입니다.',
      },
    },
  },
  {
    seedKey: 'canvas-apron',
    name: 'Canvas Apron',
    description: 'A sturdy apron with adjustable ties for cooking, pottery, or weekend projects.',
    price: 35,
    images: ['https://picsum.photos/seed/moss-canvas-apron/900/675'],
    stock: 14,
    category: 'Kitchen',
    featured: false,
    translations: {
      ko: {
        name: '캔버스 에이프런',
        description: '요리, 도예, 주말 작업 시간에 두루 잘 어울리는 튼튼한 캔버스 에이프런입니다.',
      },
    },
  },
  {
    seedKey: 'compact-yoga-mat',
    name: 'Compact Yoga Mat',
    description: 'A grippy mat with easy roll-up storage for stretching, yoga, and home workouts.',
    price: 44,
    images: ['https://picsum.photos/seed/moss-compact-yoga-mat/900/675'],
    stock: 19,
    category: 'General',
    featured: false,
    translations: {
      ko: {
        name: '컴팩트 요가 매트',
        description: '스트레칭, 요가, 홈트레이닝에 쓰기 좋고 보관도 쉬운 그립감 좋은 매트입니다.',
      },
    },
  },
  {
    seedKey: 'orbit-alarm-clock',
    name: 'Orbit Alarm Clock',
    description: 'A simple bedside clock with a quiet movement and clear display for early starts.',
    price: 47,
    images: ['https://picsum.photos/seed/moss-orbit-alarm-clock/900/675'],
    stock: 12,
    category: 'Home',
    featured: true,
    translations: {
      ko: {
        name: '오빗 알람 클록',
        description: '조용한 무브먼트와 깔끔한 화면으로 이른 아침을 편안하게 시작하게 해주는 탁상 시계입니다.',
      },
    },
  },
]

export type SeedProductRecord = Omit<SampleProduct, 'translations'>

export const seedProducts: SeedProductRecord[] = sampleProducts.map((product) => ({
  seedKey: product.seedKey,
  name: product.name,
  description: product.description,
  price: product.price,
  images: product.images,
  stock: product.stock,
  category: product.category,
  featured: product.featured,
}))

export const deprecatedSampleProductNames = [
  'Metro Crossbody Pouch',
  'Glass Meal Prep Box',
  'Linen Floor Cushion',
  'Pace Training Shorts',
  'Summit Lace Boots',
] as const

const nameTranslations = {
  ko: Object.fromEntries(sampleProducts.map((product) => [product.name, product.translations.ko.name])),
} as const

const descriptionTranslations = {
  ko: Object.fromEntries(sampleProducts.map((product) => [product.description, product.translations.ko.description])),
} as const

export function translateProductName(name: string, locale: Locale) {
  if (locale === 'en') {
    return name
  }

  return nameTranslations[locale][name] ?? name
}

export function translateProductDescription(description: string, locale: Locale) {
  if (locale === 'en') {
    return description
  }

  return descriptionTranslations[locale][description] ?? description
}
