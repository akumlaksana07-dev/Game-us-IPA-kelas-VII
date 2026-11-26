import React from 'react';
import {
  CheckCircle2,
  Home,
  Lightbulb,
  Magnet,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';
import { UPGRADE_ORDER, UPGRADES } from '../data/upgrades';
import { UpgradeId } from '../types/game';

interface UpgradesModalProps {
  upgradeLevels: Record<UpgradeId, number>;
  starCrystals: number;
  onBuyUpgrade: (id: UpgradeId) => void;
  onClose: () => void;
}

const UPGRADE_ICONS: Record<UpgradeId, React.ReactNode> = {
  hintLantern: <Lightbulb className="h-5 w-5 text-[#F59E0B]" />,
  harmonyCharm: <Shield className="h-5 w-5 text-[#EC4899]" />,
  crystalMagnet: <Magnet className="h-5 w-5 text-[#38BDF8]" />,
  sanctuaryHabitats: <Home className="h-5 w-5 text-[#34D399]" />,
};

export const UpgradesModal: React.FC<UpgradesModalProps> = ({
  upgradeLevels,
  starCrystals,
  onBuyUpgrade,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0B1219]/75 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[#F5E6C8]/25 bg-[#16202C] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F5E6C8]/12 px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[#FFF8EA]">
              Menu Peningkatan & Suaka Santai
            </h2>
            <p className="text-xs text-[#9FB3C8]">
              Gunakan Kristal Bintang untuk meningkatkan 4 jalur petualangan dan membuka Area Santai 3D
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
              aria-label="Tutup Peningkatan"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 4 Upgrade Cards */}
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-6 md:grid-cols-2">
          {UPGRADE_ORDER.map((uid) => {
            const def = UPGRADES[uid];
            const level = upgradeLevels[uid];
            const isMax = level >= def.maxLevel;
            const nextCost = isMax ? 0 : def.costs[level];
            const canAfford = !isMax && starCrystals >= nextCost;

            return (
              <div
                key={uid}
                className="flex flex-col justify-between rounded-2xl border border-[#F5E6C8]/15 bg-[#1A2533] p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#223143]">
                        {UPGRADE_ICONS[uid]}
                      </span>
                      <div>
                        <h3 className="font-display text-base font-bold text-[#FFF8EA]">
                          {def.name}
                        </h3>
                        <p className="font-mono-num text-xs text-[#F6C65B]">
                          Level {level} / {def.maxLevel}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#C7D4E2]">
                    {def.shortDesc}
                  </p>

                  {/* Level Benefits */}
                  <div className="mt-3.5 space-y-1.5">
                    {def.levelBenefits.map((benefit, idx) => {
                      const unlocked = level >= idx + 1;
                      const isNext = level === idx;
                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                            unlocked
                              ? 'bg-[#1D322B] text-[#C8F3D6]'
                              : isNext
                                ? 'bg-[#223042] text-[#F6E8C8]'
                                : 'text-[#778A9E]'
                          }`}
                        >
                          <CheckCircle2
                            className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                              unlocked ? 'text-[#76C893]' : 'text-[#5A6C80]'
                            }`}
                          />
                          <span>{benefit}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F5E6C8]/10">
                  {isMax ? (
                    <div className="w-full rounded-xl bg-[#1E3A2F] py-2 text-center text-xs font-bold text-[#95E2B3]">
                      Tingkat Maksimal Tercapai
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onBuyUpgrade(uid)}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-colors ${
                        canAfford
                          ? 'bg-[#F6C65B] text-[#141D28] hover:bg-[#FFD77A] cursor-pointer'
                          : 'bg-[#222E3D] text-[#6B7E93] cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className="h-4 w-4" />
                      Tingkatkan ke Lv.{level + 1} ({nextCost} Kristal)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
