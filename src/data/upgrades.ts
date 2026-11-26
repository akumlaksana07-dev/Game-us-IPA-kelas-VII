import { RegionDef, RegionId, UpgradeDef, UpgradeId } from '../types/game';

export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  hintLantern: {
    id: 'hintLantern',
    name: 'Hint Lantern (Lentera Petunjuk)',
    shortDesc: 'Menyediakan lentera petunjuk saat kuis untuk menyingkirkan opsi pengecoh dan memberi sorotan konsep.',
    maxLevel: 4,
    costs: [35, 65, 105, 160],
    levelBenefits: [
      'Lv 1: 2 muatan petunjuk per sesi · hapus 1 opsi salah',
      'Lv 2: 3 muatan petunjuk · hapus 2 opsi salah (50/50)',
      'Lv 3: 4 muatan petunjuk + petunjuk konsep IPA muncul otomatis',
      'Lv 4: 6 muatan petunjuk + pulih 1 muatan tiap 3 kombo benar',
    ],
    accentColor: '#F59E0B',
  },
  harmonyCharm: {
    id: 'harmonyCharm',
    name: 'Harmony Charm (Pelindung Kombo)',
    shortDesc: 'Melindungi pengali kombo agar tidak turun saat jawaban keliru, menjaga suasana tetap tenang.',
    maxLevel: 4,
    costs: [45, 80, 125, 185],
    levelBenefits: [
      'Lv 1: 1 Perisai Harmoni per perjalanan',
      'Lv 2: 2 Perisai Harmoni per perjalanan',
      'Lv 3: 3 Perisai Harmoni + pulih +5 Energi saat salah',
      'Lv 4: 4 Perisai Harmoni + isi ulang perisai di Area Santai',
    ],
    accentColor: '#EC4899',
  },
  crystalMagnet: {
    id: 'crystalMagnet',
    name: 'Crystal Magnet (Magnet Kristal)',
    shortDesc: 'Menarik Kristal Bintang dari jarak lebih jauh di peta 3D dan menambah perolehan kristal & Bond Energy.',
    maxLevel: 4,
    costs: [40, 75, 120, 175],
    levelBenefits: [
      'Lv 1: +20% Kristal Bintang & Bond Energy · radius magnet 4.5m',
      'Lv 2: +40% Kristal Bintang & Bond Energy · radius magnet 6.0m',
      'Lv 3: +65% Kristal Bintang & Bond Energy · radius magnet 7.5m',
      'Lv 4: +90% Kristal Bintang & Bond Energy · tarik otomatis di pulau',
    ],
    accentColor: '#38BDF8',
  },
  sanctuaryHabitats: {
    id: 'sanctuaryHabitats',
    name: 'Sanctuary Treats & Habitats',
    shortDesc: 'Membuka camilan hangat dan area santai 3D baru (Gazebo Teh, Ayunan Bintang, Kolam Teratai) di pulau.',
    maxLevel: 4,
    costs: [50, 90, 140, 200],
    levelBenefits: [
      'Lv 1: Membuka Camilan Bintang & Gazebo Teh Hangat di pulau',
      'Lv 2: Membuka Ayunan Cahaya Bintang (+25% Bond dari camilan)',
      'Lv 3: Membuka Kolam Teratai Beruap (pulihkan Energi otomatis)',
      'Lv 4: Semua Area Santai memancarkan aura +10 Bond pasif tiap kuis',
    ],
    accentColor: '#34D399',
  },
};

export const UPGRADE_ORDER: UpgradeId[] = [
  'hintLantern',
  'harmonyCharm',
  'crystalMagnet',
  'sanctuaryHabitats',
];

export const REGIONS: Record<RegionId, RegionDef> = {
  'pulau-damai': {
    id: 'pulau-damai',
    name: 'Pulau Damai',
    subtitle: 'Padang Rumput Pagi & Laguna Tenang',
    ambiance: 'Cahaya pagi keemasan, jembatan kayu, dan bunga sakura bergoyang lembut.',
    skyColor: '#A9D6E5',
    fogColor: '#CDE8EC',
    groundTint: '#7BC47F',
    accentColor: '#4BA36E',
  },
  'hutan-berlentera': {
    id: 'hutan-berlentera',
    name: 'Hutan Berlentera',
    subtitle: 'Rimba Senja & Lentera Kunang-Kunang',
    ambiance: 'Pohon lumut rimbun, lentera kertas hangat, dan kelap-kelip kunang-kunang.',
    skyColor: '#25354B',
    fogColor: '#2D4159',
    groundTint: '#4A7C64',
    accentColor: '#F3B44C',
  },
  'reruntuhan-melayang': {
    id: 'reruntuhan-melayang',
    name: 'Reruntuhan Melayang',
    subtitle: 'Suaka Langit & Pilar Kristal Kuno',
    ambiance: 'Batu pulau melayang, pilar rune bercahaya, dan kabut bintang yang hening.',
    skyColor: '#3B365E',
    fogColor: '#52497A',
    groundTint: '#8F96B8',
    accentColor: '#9FE0F7',
  },
};

export const REGION_ORDER: RegionId[] = [
  'pulau-damai',
  'hutan-berlentera',
  'reruntuhan-melayang',
];

export const COMBO_TIERS = [1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5] as const;
