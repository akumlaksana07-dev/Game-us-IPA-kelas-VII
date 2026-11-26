import React from 'react';
import { Check, Cookie, Heart, Lock, Sparkles, Star, X } from 'lucide-react';
import {
  COMPANION_ORDER,
  COMPANIONS,
  EVOLUTION_THRESHOLDS,
  STAGE_LABELS,
} from '../data/companions';
import {
  CompanionId,
  CompanionProgress,
  EvolutionStage,
} from '../types/game';

interface CompanionModalProps {
  activeCompanionId: CompanionId;
  companionsProgress: Record<CompanionId, CompanionProgress>;
  starCrystals: number;
  sanctuaryLevel: number;
  onSelectCompanion: (id: CompanionId) => void;
  onUnlockCompanion: (id: CompanionId) => void;
  onEvolveCompanion: (id: CompanionId) => void;
  onSetVisualStage: (id: CompanionId, stage: EvolutionStage) => void;
  onFeedTreat: () => void;
  onClose: () => void;
}

export const CompanionModal: React.FC<CompanionModalProps> = ({
  activeCompanionId,
  companionsProgress,
  starCrystals,
  sanctuaryLevel,
  onSelectCompanion,
  onUnlockCompanion,
  onEvolveCompanion,
  onSetVisualStage,
  onFeedTreat,
  onClose,
}) => {
  const activeDef = COMPANIONS[activeCompanionId];
  const activeProg = companionsProgress[activeCompanionId];

  const canEvolveTo2 =
    activeProg.highestStage === 1 &&
    activeProg.bondEnergy >= EVOLUTION_THRESHOLDS[2];
  const canEvolveTo3 =
    activeProg.highestStage === 2 &&
    activeProg.bondEnergy >= EVOLUTION_THRESHOLDS[3];
  const canEvolve = canEvolveTo2 || canEvolveTo3;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0B1219]/75 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[#F5E6C8]/25 bg-[#16202C] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F5E6C8]/12 px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[#FFF8EA]">
              Koleksi & Evolusi Pendamping
            </h2>
            <p className="text-xs text-[#9FB3C8]">
              Bangun Bond Energy melalui kuis IPA & camilan santai · Kamu bebas memilih kembali bentuk sebelumnya
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F2C3D] px-3 py-1.5 font-mono-num text-xs font-bold text-[#FFE066]">
              <Sparkles className="h-3.5 w-3.5" />
              {starCrystals} Kristal
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-[#9FB3C8] transition-colors hover:bg-[#233244] hover:text-[#FFF8EA] cursor-pointer"
              aria-label="Tutup Koleksi"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-5 overflow-y-auto p-6 md:grid-cols-12">
          {/* Companion Roster List */}
          <div className="space-y-2.5 md:col-span-5">
            {COMPANION_ORDER.map((cid) => {
              const def = COMPANIONS[cid];
              const prog = companionsProgress[cid];
              const isSelected = cid === activeCompanionId;

              return (
                <div
                  key={cid}
                  className={`rounded-2xl border p-3.5 transition-colors ${
                    isSelected
                      ? 'border-[#F6C65B] bg-[#202D3E]'
                      : 'border-[#F5E6C8]/12 bg-[#1A2533]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-base font-bold text-[#141D28]"
                        style={{ backgroundColor: def.primaryColor }}
                      >
                        {def.name.charAt(0)}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display text-sm font-bold text-[#FFF8EA]">
                            {def.name}
                          </span>
                          {prog.unlocked && (
                            <span className="text-[11px] text-[#F6C65B]">
                              · {STAGE_LABELS[prog.activeVisualStage]}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#9FB3C8]">{def.element}</p>
                      </div>
                    </div>

                    {prog.unlocked ? (
                      <button
                        type="button"
                        onClick={() => onSelectCompanion(cid)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          isSelected
                            ? 'bg-[#76C893] text-[#122019]'
                            : 'bg-[#29394D] text-[#EEF3F8] hover:bg-[#344860]'
                        }`}
                      >
                        {isSelected ? 'Aktif' : 'Pilih'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={starCrystals < def.unlockCost}
                        onClick={() => onUnlockCompanion(cid)}
                        className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                          starCrystals >= def.unlockCost
                            ? 'bg-[#F6C65B] text-[#141D28] hover:bg-[#FFD77A] cursor-pointer'
                            : 'bg-[#232F3E] text-[#6B7D91] cursor-not-allowed'
                        }`}
                      >
                        <Lock className="h-3 w-3" />
                        {def.unlockCost}✦
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Companion Detail & Evolution Stages */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#F5E6C8]/14 bg-[#1A2533] p-5 md:col-span-7">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-[#F6C65B]">
                    {activeDef.element}
                  </span>
                  <h3 className="font-display text-2xl font-bold text-[#FFF8EA]">
                    {activeDef.forms[activeProg.activeVisualStage].title}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-[#C7D4E2]">
                    {activeDef.personality}
                  </p>
                </div>

                <div className="text-right font-mono-num">
                  <div className="flex items-center justify-end gap-1 text-sm font-bold text-[#F48FB1]">
                    <Heart className="h-4 w-4" />
                    {activeProg.bondEnergy} Bond
                  </div>
                  <div className="text-xs text-[#9FB3C8]">
                    Energi {activeProg.energy}/100
                  </div>
                </div>
              </div>

              {/* Evolution Path & Form Selector */}
              <div className="mt-5 space-y-2.5">
                <p className="text-xs font-semibold text-[#D7E0EA]">
                  Tahap Evolusi & Pilihan Wujud Aktif
                </p>

                {([1, 2, 3] as EvolutionStage[]).map((stage) => {
                  const info = activeDef.forms[stage];
                  const isUnlocked = activeProg.highestStage >= stage;
                  const isActiveForm = activeProg.activeVisualStage === stage;
                  const threshold = EVOLUTION_THRESHOLDS[stage];

                  return (
                    <div
                      key={stage}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
                        isActiveForm
                          ? 'border-[#F6C65B] bg-[#243244]'
                          : isUnlocked
                            ? 'border-[#F5E6C8]/15 bg-[#1E2A3A]'
                            : 'border-[#F5E6C8]/8 bg-[#151E29] opacity-75'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-bold text-[#FFF8EA]">
                            {STAGE_LABELS[stage]}
                          </span>
                          <span className="text-xs text-[#9FB3C8]">
                            · {info.elementalMove}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[#B7C7D8]">
                          {info.description}
                        </p>
                      </div>

                      {isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => onSetVisualStage(activeCompanionId, stage)}
                          className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                            isActiveForm
                              ? 'bg-[#F6C65B] text-[#141D28]'
                              : 'bg-[#2C3C50] text-[#EEF3F8] hover:bg-[#374B63]'
                          }`}
                        >
                          {isActiveForm && <Check className="h-3.5 w-3.5" />}
                          {isActiveForm ? 'Dipakai' : 'Pakai Wujud'}
                        </button>
                      ) : (
                        <span className="font-mono-num text-xs text-[#8FA3B8] whitespace-nowrap shrink-0">
                          Butuh {threshold} Bond
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Footer: Evolve or Feed Treat */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#F5E6C8]/12 pt-4">
              <button
                type="button"
                onClick={onFeedTreat}
                className="inline-flex items-center gap-2 rounded-xl border border-[#76C893]/40 bg-[#1C332B] px-4 py-2 text-xs sm:text-sm font-semibold text-[#C9F4D8] transition-colors hover:bg-[#244338] cursor-pointer"
              >
                <Cookie className="h-4 w-4 text-[#76C893]" />
                {sanctuaryLevel > 0
                  ? 'Beri Camilan Santai (12✦ → +22 Bond)'
                  : 'Buka Camilan di Menu Peningkatan'}
              </button>

              {canEvolve && (
                <button
                  type="button"
                  onClick={() => onEvolveCompanion(activeCompanionId)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F6C65B] px-5 py-2 text-xs sm:text-sm font-bold text-[#141D28] transition-transform hover:scale-[1.02] hover:bg-[#FFD77A] cursor-pointer"
                >
                  <Star className="h-4 w-4" />
                  Berevolusi ke {STAGE_LABELS[(activeProg.highestStage + 1) as EvolutionStage]}!
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
