import React from 'react';
import { Home, Play, RotateCcw, Shuffle, UserCheck, X } from 'lucide-react';

interface PauseModalProps {
  answeredCount: number;
  totalQuestions: number;
  onResume: () => void;
  onReshuffleDeck: () => void;
  onOpenDeveloper: () => void;
  onBackToTitle: () => void;
  onResetProgress: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  answeredCount,
  totalQuestions,
  onResume,
  onReshuffleDeck,
  onOpenDeveloper,
  onBackToTitle,
  onResetProgress,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0B1219]/75 p-4">
      <div className="w-full max-w-md rounded-3xl border border-[#F5E6C8]/25 bg-[#16202C] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#F5E6C8]/12 pb-3.5">
          <div>
            <h2 className="font-display text-xl font-bold text-[#FFF8EA]">
              Istirahat Sejenak
            </h2>
            <p className="font-mono-num text-xs text-[#9FB3C8]">
              Progres Soal: {answeredCount}/{totalQuestions} Terjawab
            </p>
          </div>
          <button
            type="button"
            onClick={onResume}
            className="rounded-xl p-2 text-[#9FB3C8] hover:bg-[#233244] hover:text-[#FFF8EA] cursor-pointer"
            aria-label="Lanjutkan"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={onResume}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F6C65B] py-2.5 text-sm font-bold text-[#141D28] transition-colors hover:bg-[#FFD77A] cursor-pointer"
          >
            <Play className="h-4 w-4" />
            Lanjutkan Petualangan
          </button>

          <button
            type="button"
            onClick={onReshuffleDeck}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#F5E6C8]/18 bg-[#1E2A3A] py-2.5 text-sm font-semibold text-[#EEF3F8] transition-colors hover:bg-[#27374B] cursor-pointer"
          >
            <Shuffle className="h-4 w-4 text-[#A2E5FA]" />
            Acak Ulang Urutan 80 Soal
          </button>

          <button
            type="button"
            onClick={onOpenDeveloper}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#F5E6C8]/18 bg-[#1E2A3A] py-2.5 text-sm font-semibold text-[#EEF3F8] transition-colors hover:bg-[#27374B] cursor-pointer"
          >
            <UserCheck className="h-4 w-4 text-[#76C893]" />
            Profil Pengembang
          </button>

          <button
            type="button"
            onClick={onBackToTitle}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#F5E6C8]/18 bg-[#1E2A3A] py-2.5 text-sm font-semibold text-[#EEF3F8] transition-colors hover:bg-[#27374B] cursor-pointer"
          >
            <Home className="h-4 w-4 text-[#F6C65B]" />
            Kembali ke Layar Judul
          </button>

          <button
            type="button"
            onClick={onResetProgress}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E08E79]/30 bg-[#2A2125] py-2.5 text-xs font-semibold text-[#F4B4A4] transition-colors hover:bg-[#382A30] cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Mulai Ulang Semua Progres
          </button>
        </div>
      </div>
    </div>
  );
};
