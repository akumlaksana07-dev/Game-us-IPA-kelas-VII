import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Cookie,
  Heart,
  MapPin,
  Music,
  Pause,
  Shield,
  Sparkles,
  Sun,
  UserCheck,
  Volume2,
  VolumeX,
  Wand2,
  Zap,
} from 'lucide-react';
import { COMPANIONS, EVOLUTION_THRESHOLDS, STAGE_LABELS } from '../data/companions';
import { REGION_ORDER, REGIONS } from '../data/upgrades';
import {
  CompanionId,
  CompanionProgress,
  RegionId,
} from '../types/game';

interface HudOverlayProps {
  region: RegionId;
  companionId: CompanionId;
  companionProgress: CompanionProgress;
  starCrystals: number;
  comboMultiplier: number;
  harmonyShields: number;
  hintCharges: number;
  sanctuaryLevel: number;
  nearTotemId: number | null;
  answeredCount: number;
  totalQuestions: number;
  muted: boolean;
  ambientOn: boolean;
  dockCollapsed: boolean;
  toastMessage: string | null;
  onToggleDock: () => void;
  onChangeRegion: (r: RegionId) => void;
  onToggleMute: () => void;
  onToggleAmbient: () => void;
  onOpenQuiz: () => void;
  onOpenCompanions: () => void;
  onOpenUpgrades: () => void;
  onFeedTreat: () => void;
  onOpenPause: () => void;
  onOpenDeveloper: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  region,
  companionId,
  companionProgress,
  starCrystals,
  comboMultiplier,
  harmonyShields,
  hintCharges,
  sanctuaryLevel,
  nearTotemId,
  answeredCount,
  totalQuestions,
  muted,
  ambientOn,
  dockCollapsed,
  toastMessage,
  onToggleDock,
  onChangeRegion,
  onToggleMute,
  onToggleAmbient,
  onOpenQuiz,
  onOpenCompanions,
  onOpenUpgrades,
  onFeedTreat,
  onOpenPause,
  onOpenDeveloper,
}) => {
  const def = COMPANIONS[companionId];
  const nextThreshold =
    companionProgress.highestStage === 1
      ? EVOLUTION_THRESHOLDS[2]
      : companionProgress.highestStage === 2
        ? EVOLUTION_THRESHOLDS[3]
        : EVOLUTION_THRESHOLDS[3];
  const prevThreshold =
    companionProgress.highestStage === 1
      ? 0
      : companionProgress.highestStage === 2
        ? EVOLUTION_THRESHOLDS[2]
        : 0;

  const bondPct =
    companionProgress.highestStage === 3
      ? 100
      : Math.min(
          100,
          Math.round(
            ((companionProgress.bondEnergy - prevThreshold) /
              Math.max(1, nextThreshold - prevThreshold)) *
              100,
          ),
        );

  const canEvolveNow =
    (companionProgress.highestStage === 1 &&
      companionProgress.bondEnergy >= EVOLUTION_THRESHOLDS[2]) ||
    (companionProgress.highestStage === 2 &&
      companionProgress.bondEnergy >= EVOLUTION_THRESHOLDS[3]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-5">
      {/* Top Row: Perimeter Status Clusters (Zero center occlusion) */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Top-Left: Companion & Bond Status */}
        <div className="pointer-events-auto flex flex-col gap-2 rounded-2xl border border-[#F5E6C8]/20 bg-[#141D28]/92 px-4 py-3 shadow-lg min-w-[260px] max-w-[330px]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold text-[#141D28]"
                style={{ backgroundColor: def.primaryColor }}
              >
                {def.name.charAt(0)}
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-sm font-bold text-[#FFF8EA]">
                    {def.name}
                  </span>
                  <span className="text-xs text-[#9FB3C8]">·</span>
                  <span className="text-xs font-medium text-[#F6C65B]">
                    {STAGE_LABELS[companionProgress.activeVisualStage]}
                  </span>
                </div>
                <p className="text-[11px] text-[#9FB3C8]">{def.element}</p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-xs font-semibold text-[#FFE066] font-mono-num">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{starCrystals}</span>
              </div>
              <div className="text-[11px] text-[#A2E5FA] font-mono-num">
                Kombo x{comboMultiplier.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Bond & Energy Bars */}
          <div className="space-y-1.5">
            <div>
              <div className="mb-0.5 flex items-center justify-between text-[11px] text-[#D7E0EA]">
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-[#F48FB1]" />
                  Bond Energy
                </span>
                <span className="font-mono-num text-[#F6C65B]">
                  {companionProgress.bondEnergy}
                  {companionProgress.highestStage < 3 ? ` / ${nextThreshold}` : ' (Maks)'}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#243242]">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${bondPct}%`,
                    backgroundColor: def.primaryColor,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-[11px] text-[#B7C7D8]">
              <span className="flex items-center gap-1 font-mono-num">
                <Zap className="h-3 w-3 text-[#76C893]" />
                Energi {companionProgress.energy}/100
              </span>
              <span className="flex items-center gap-2 font-mono-num">
                {harmonyShields > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[#F48FB1]">
                    <Shield className="h-3 w-3" />
                    {harmonyShields}
                  </span>
                )}
                {hintCharges > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[#F6C65B]">
                    <Sun className="h-3 w-3" />
                    {hintCharges}
                  </span>
                )}
                <span>
                  {answeredCount}/{totalQuestions}
                </span>
              </span>
            </div>
          </div>

          {canEvolveNow && (
            <button
              type="button"
              onClick={onOpenCompanions}
              className="mt-0.5 w-full rounded-xl bg-[#F6C65B] px-3 py-1.5 text-xs font-bold text-[#141D28] transition-colors hover:bg-[#FFD77A] cursor-pointer"
            >
              Siap Berevolusi! Buka Pendamping
            </button>
          )}
        </div>

        {/* Top-Right: Region Switcher + Audio + Pause */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-[#F5E6C8]/20 bg-[#141D28]/92 p-1 shadow-lg">
            <MapPin className="ml-2 mr-1 h-3.5 w-3.5 text-[#F6C65B]" />
            {REGION_ORDER.map((rid) => (
              <button
                key={rid}
                type="button"
                onClick={() => onChangeRegion(rid)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  region === rid
                    ? 'bg-[#F6C65B] text-[#141D28]'
                    : 'text-[#D7E0EA] hover:bg-[#223042]'
                }`}
              >
                {REGIONS[rid].name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-[#F5E6C8]/20 bg-[#141D28]/92 p-1 shadow-lg">
            <button
              type="button"
              onClick={onToggleAmbient}
              title={ambientOn ? 'Matikan Musik Ambient' : 'Nyalakan Musik Ambient'}
              className={`rounded-lg p-2 text-xs transition-colors cursor-pointer ${
                ambientOn
                  ? 'bg-[#76C893]/25 text-[#A7E8BD]'
                  : 'text-[#9FB3C8] hover:bg-[#223042]'
              }`}
              aria-label="Toggle Musik Ambient"
            >
              <Music className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              title={muted ? 'Nyalakan Suara' : 'Bisukan Suara'}
              className="rounded-lg p-2 text-[#D7E0EA] transition-colors hover:bg-[#223042] cursor-pointer"
              aria-label="Toggle Suara Synth"
            >
              {muted ? <VolumeX className="h-4 w-4 text-[#F38B72]" /> : <Volume2 className="h-4 w-4 text-[#F6C65B]" />}
            </button>

            <button
              type="button"
              onClick={onOpenDeveloper}
              title="Profil Pengembang"
              className="rounded-lg p-2 text-[#A2E5FA] transition-colors hover:bg-[#223042] cursor-pointer"
              aria-label="Profil Pengembang"
            >
              <UserCheck className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onOpenPause}
              title="Menu Jeda (Esc)"
              className="rounded-lg p-2 text-[#D7E0EA] transition-colors hover:bg-[#223042] cursor-pointer"
              aria-label="Menu Jeda"
            >
              <Pause className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Gentle Floating Toast / Proximity Prompt */}
      <div className="flex flex-col items-center justify-end gap-2.5">
        {toastMessage && (
          <div className="rounded-xl border border-[#F6C65B]/35 bg-[#141D28]/94 px-4 py-2 text-xs sm:text-sm font-medium text-[#FFF8EA] shadow-lg">
            {toastMessage}
          </div>
        )}

        {nearTotemId !== null && (
          <button
            type="button"
            onClick={onOpenQuiz}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-xl bg-[#F6C65B] px-5 py-2.5 text-sm font-bold text-[#141D28] shadow-xl transition-transform duration-150 hover:scale-[1.03] cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            Totem Kuis di Dekatmu — Tekan E atau Klik untuk Kuis IPA
          </button>
        )}

        {/* Collapsible Bottom Control Dock */}
        <div className="pointer-events-auto flex flex-col items-center">
          <button
            type="button"
            onClick={onToggleDock}
            className="mb-1 inline-flex items-center gap-1.5 rounded-t-xl border border-b-0 border-[#F5E6C8]/20 bg-[#141D28]/92 px-3.5 py-1 text-[11px] font-semibold text-[#D7E0EA] transition-colors hover:bg-[#1F2C3D] cursor-pointer"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Tampilkan Kontrol (H)
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Sembunyikan Kontrol (H)
              </>
            )}
          </button>

          {!dockCollapsed && (
            <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#F5E6C8]/20 bg-[#141D28]/94 px-3 py-2.5 shadow-2xl">
              <button
                type="button"
                onClick={onOpenQuiz}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F6C65B] px-4 py-2 text-xs sm:text-sm font-bold text-[#141D28] transition-colors hover:bg-[#FFD77A] cursor-pointer whitespace-nowrap shrink-0"
              >
                <Sparkles className="h-4 w-4" />
                Kuis IPA
              </button>

              <button
                type="button"
                onClick={onOpenCompanions}
                className="inline-flex items-center gap-2 rounded-xl border border-[#F5E6C8]/20 bg-[#1F2C3D] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#F4EFE4] transition-colors hover:bg-[#2A3B50] cursor-pointer whitespace-nowrap shrink-0"
              >
                <Heart className="h-4 w-4 text-[#F48FB1]" />
                Pendamping & Evolusi
              </button>

              <button
                type="button"
                onClick={onOpenUpgrades}
                className="inline-flex items-center gap-2 rounded-xl border border-[#F5E6C8]/20 bg-[#1F2C3D] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#F4EFE4] transition-colors hover:bg-[#2A3B50] cursor-pointer whitespace-nowrap shrink-0"
              >
                <Wand2 className="h-4 w-4 text-[#A2E5FA]" />
                Peningkatan
              </button>

              <button
                type="button"
                onClick={onFeedTreat}
                className="inline-flex items-center gap-2 rounded-xl border border-[#F5E6C8]/20 bg-[#1F2C3D] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#F4EFE4] transition-colors hover:bg-[#2A3B50] cursor-pointer whitespace-nowrap shrink-0"
                title={
                  sanctuaryLevel === 0
                    ? 'Buka Sanctuary Treats di menu Peningkatan'
                    : 'Beri camilan hangat (12 Kristal -> +Bond & Energi)'
                }
              >
                <Cookie className="h-4 w-4 text-[#76C893]" />
                {sanctuaryLevel > 0 ? 'Beri Camilan (12✦)' : 'Camilan (Terkunci)'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
