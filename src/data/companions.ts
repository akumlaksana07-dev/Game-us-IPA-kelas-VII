import { CompanionDef, CompanionId } from '../types/game';

export const EVOLUTION_THRESHOLDS: Record<1 | 2 | 3, number> = {
  1: 0,
  2: 100,
  3: 260,
};

export const STAGE_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Sproutling',
  2: 'Glowling',
  3: 'Astral Form',
};

export const COMPANIONS: Record<CompanionId, CompanionDef> = {
  fluffox: {
    id: 'fluffox',
    name: 'Lumi',
    element: 'Cahaya & Angin',
    unlockCost: 0,
    primaryColor: '#F6C65B',
    secondaryColor: '#FFF5D6',
    accentColor: '#F28B50',
    glowColor: '#FFE18C',
    personality: 'Rubah lentera yang ceria, suka mengejar kunang-kunang dan belajar hal baru.',
    forms: {
      1: {
        stage: 1,
        title: 'Lumi Sproutling',
        subtitle: 'Tahap 1 · Tunas Cahaya',
        description: 'Anak rubah kecil bermahkota tunas emas yang hangat dan penasaran.',
        elementalMove: 'Percik Lentera',
      },
      2: {
        stage: 2,
        title: 'Lumi Glowling',
        subtitle: 'Tahap 2 · Penjaga Lentera',
        description: 'Telinga berpendar dengan syal angin lembut dan ekor berkilau keemasan.',
        elementalMove: 'Gelombang Aurora',
      },
      3: {
        stage: 3,
        title: 'Lumi Astral Form',
        subtitle: 'Tahap 3 · Roh Bintang',
        description: 'Sayap cahaya surgawi dan kristal bintang mengorbit di sekeliling mahkotanya.',
        elementalMove: 'Simfoni Bintang',
      },
    },
  },
  mossbun: {
    id: 'mossbun',
    name: 'Mori',
    element: 'Alam & Daun',
    unlockCost: 90,
    primaryColor: '#76C893',
    secondaryColor: '#E9F7EC',
    accentColor: '#3D8C61',
    glowColor: '#A7E8BD',
    personality: 'Kelinci lumut yang tenang dan ramah, gemar bersantai di dekat bunga dan embun pagi.',
    forms: {
      1: {
        stage: 1,
        title: 'Mori Sproutling',
        subtitle: 'Tahap 1 · Benih Rimba',
        description: 'Kelinci mungil bertelinga daun muda yang selalu memantul pelan.',
        elementalMove: 'Embun Segar',
      },
      2: {
        stage: 2,
        title: 'Mori Glowling',
        subtitle: 'Tahap 2 · Penjaga Taman',
        description: 'Dihiasi kerah kelopak bunga dan pendar hijau zamrud yang menenangkan.',
        elementalMove: 'Tarian Kelopak',
      },
      3: {
        stage: 3,
        title: 'Mori Astral Form',
        subtitle: 'Tahap 3 · Roh Hutan Suci',
        description: 'Sayap daun kristal bercahaya dan lingkaran bunga bintang yang melayang.',
        elementalMove: 'Mekar Semesta',
      },
    },
  },
  aqualume: {
    id: 'aqualume',
    name: 'Nami',
    element: 'Air & Embun',
    unlockCost: 140,
    primaryColor: '#6CC4DF',
    secondaryColor: '#E8F9FD',
    accentColor: '#2F7FA3',
    glowColor: '#A2E5FA',
    personality: 'Roh embun biru yang lembut dan puitis, senang bermain di riak air pulau.',
    forms: {
      1: {
        stage: 1,
        title: 'Nami Sproutling',
        subtitle: 'Tahap 1 · Tetes Embun',
        description: 'Makhluk air mungil bersirip telinga bening dan gelembung mutiara.',
        elementalMove: 'Riak Mutiara',
      },
      2: {
        stage: 2,
        title: 'Nami Glowling',
        subtitle: 'Tahap 2 · Penari Ombak',
        description: 'Sirip berkilau bak safir dengan kalung tetes air yang melayang.',
        elementalMove: 'Cermin Laguna',
      },
      3: {
        stage: 3,
        title: 'Nami Astral Form',
        subtitle: 'Tahap 3 · Roh Samudra Langit',
        description: 'Sayap sirip astral dan cincin air bintang yang bercahaya lembut.',
        elementalMove: 'Air Terjun Bintang',
      },
    },
  },
  pyrokit: {
    id: 'pyrokit',
    name: 'Kori',
    element: 'Bara & Bintang',
    unlockCost: 190,
    primaryColor: '#F38B72',
    secondaryColor: '#FFF0EA',
    accentColor: '#D45643',
    glowColor: '#FFB399',
    personality: 'Anak singa bara yang hangat seperti perapian malam, setia menjaga sahabatnya.',
    forms: {
      1: {
        stage: 1,
        title: 'Kori Sproutling',
        subtitle: 'Tahap 1 · Bara Hangat',
        description: 'Kucing-singa kecil dengan ujung ekor lentera hangat dan jambul api kecil.',
        elementalMove: 'Api Unggun Mini',
      },
      2: {
        stage: 2,
        title: 'Kori Glowling',
        subtitle: 'Tahap 2 · Penjaga Perapian',
        description: 'Surai hangat keemasan dan selendang cahaya senja yang menari pelan.',
        elementalMove: 'Lentera Senja',
      },
      3: {
        stage: 3,
        title: 'Kori Astral Form',
        subtitle: 'Tahap 3 · Roh Matahari',
        description: 'Mahkota surya dan sayap bara surgawi yang memancarkan ketenangan.',
        elementalMove: 'Pelukan Surya',
      },
    },
  },
};

export const COMPANION_ORDER: CompanionId[] = [
  'fluffox',
  'mossbun',
  'aqualume',
  'pyrokit',
];
