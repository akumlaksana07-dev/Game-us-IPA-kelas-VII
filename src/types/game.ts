export type RegionId = 'pulau-damai' | 'hutan-berlentera' | 'reruntuhan-melayang';

export type CompanionId = 'fluffox' | 'mossbun' | 'aqualume' | 'pyrokit';

export type EvolutionStage = 1 | 2 | 3;

export type UpgradeId =
  | 'hintLantern'
  | 'harmonyCharm'
  | 'crystalMagnet'
  | 'sanctuaryHabitats';

export type GameScreen = 'title' | 'playing';

export type ActiveModal =
  | 'none'
  | 'quiz'
  | 'companions'
  | 'upgrades'
  | 'pause'
  | 'developer';

export interface QuizQuestion {
  id: number;
  topic: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  hint: string;
  isOriginalSet?: boolean;
}

export interface CompanionFormInfo {
  stage: EvolutionStage;
  title: string;
  subtitle: string;
  description: string;
  elementalMove: string;
}

export interface CompanionDef {
  id: CompanionId;
  name: string;
  element: string;
  unlockCost: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  glowColor: string;
  personality: string;
  forms: Record<EvolutionStage, CompanionFormInfo>;
}

export interface CompanionProgress {
  unlocked: boolean;
  bondEnergy: number;
  highestStage: EvolutionStage;
  activeVisualStage: EvolutionStage;
  energy: number;
}

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  shortDesc: string;
  maxLevel: number;
  costs: number[];
  levelBenefits: string[];
  accentColor: string;
}

export interface RegionDef {
  id: RegionId;
  name: string;
  subtitle: string;
  ambiance: string;
  skyColor: string;
  fogColor: string;
  groundTint: string;
  accentColor: string;
  unlockTreatLevel?: number;
}

export interface WorldEventTrigger {
  type: 'correct' | 'wrong' | 'evolve' | 'treat' | 'crystal';
  timestamp: number;
  elementColor?: string;
}
