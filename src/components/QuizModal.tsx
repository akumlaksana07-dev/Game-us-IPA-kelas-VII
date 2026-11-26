import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Heart,
  HelpCircle,
  Lightbulb,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';
import { COMPANIONS } from '../data/companions';
import { CompanionId, CompanionProgress, QuizQuestion } from '../types/game';

interface QuizModalProps {
  question: QuizQuestion;
  companionId: CompanionId;
  companionProgress: CompanionProgress;
  comboMultiplier: number;
  hintCharges: number;
  hintLanternLevel: number;
  harmonyShields: number;
  magnetLevel: number;
  sanctuaryLevel: number;
  onUseHint: () => void;
  onAnswer: (isCorrect: boolean) => {
    earnedCrystals: number;
    earnedBond: number;
    shieldUsed: boolean;
    newCombo: number;
  };
  onNextQuestion: () => void;
  onClose: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  question,
  companionId,
  companionProgress,
  comboMultiplier,
  hintCharges,
  hintLanternLevel,
  harmonyShields,
  magnetLevel,
  sanctuaryLevel,
  onUseHint,
  onAnswer,
  onNextQuestion,
  onClose,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [eliminatedIndices, setEliminatedIndices] = useState<number[]>([]);
  const [hintRevealed, setHintRevealed] = useState<boolean>(false);
  const [resultInfo, setResultInfo] = useState<{
    isCorrect: boolean;
    earnedCrystals: number;
    earnedBond: number;
    shieldUsed: boolean;
    newCombo: number;
  } | null>(null);

  // Reset local state whenever question changes
  useEffect(() => {
    setSelectedIdx(null);
    setEliminatedIndices([]);
    setHintRevealed(hintLanternLevel >= 3);
    setResultInfo(null);
  }, [question.id, hintLanternLevel]);

  const def = COMPANIONS[companionId];
  const formInfo = def.forms[companionProgress.activeVisualStage];

  const handleSelectOption = (idx: number) => {
    if (resultInfo !== null || eliminatedIndices.includes(idx)) return;
    setSelectedIdx(idx);
    const isCorrect = idx === question.correctIndex;
    const outcome = onAnswer(isCorrect);
    setResultInfo({ isCorrect, ...outcome });
  };

  const handleTriggerHint = () => {
    if (resultInfo !== null || hintCharges <= 0) return;
    const wrongIndices = [0, 1, 2, 3].filter(
      (i) => i !== question.correctIndex && !eliminatedIndices.includes(i),
    );
    if (wrongIndices.length === 0 && hintRevealed) return;

    onUseHint();
    const removeCount = hintLanternLevel >= 2 ? 2 : 1;
    const shuffledWrong = [...wrongIndices].sort(() => Math.random() - 0.5);
    setEliminatedIndices((prev) => [
      ...prev,
      ...shuffledWrong.slice(0, removeCount),
    ]);
    setHintRevealed(true);
  };

  // Keyboard shortcuts 1-4 and Enter
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (resultInfo === null) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = Number(e.key) - 1;
          handleSelectOption(idx);
        }
      } else if (e.key === 'Enter') {
        onNextQuestion();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0B1219]/70 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-[#F5E6C8]/25 bg-[#16202C] p-6 sm:p-7 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#F5E6C8]/12 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#9FB3C8]">
              <span className="font-semibold text-[#F6C65B]">{question.topic}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">Kombo x{comboMultiplier.toFixed(2)}</span>
              {harmonyShields > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-[#F48FB1]">
                    <Shield className="h-3.5 w-3.5" />
                    Perisai {harmonyShields}
                  </span>
                </>
              )}
              {magnetLevel > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#A2E5FA]">Magnet Lv.{magnetLevel}</span>
                </>
              )}
              {sanctuaryLevel >= 4 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#76C893]">+10 Bond Suaka</span>
                </>
              )}
            </div>
            <h2 className="mt-1.5 font-display text-lg sm:text-xl font-bold text-[#FFF8EA]">
              Pertemuan Cahaya bersama {def.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#9FB3C8] transition-colors hover:bg-[#233244] hover:text-[#FFF8EA] cursor-pointer"
            aria-label="Tutup Kuis"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Question Body */}
        <div className="mt-5">
          <p className="text-base sm:text-lg font-medium leading-relaxed text-[#F5EFE2]">
            {question.question}
          </p>

          {/* Hint Lantern Box */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            {hintRevealed ? (
              <div className="flex items-start gap-2 rounded-xl border border-[#F6C65B]/30 bg-[#232D3B] px-3.5 py-2 text-xs text-[#FFE599]">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#F6C65B]" />
                <span>{question.hint}</span>
              </div>
            ) : (
              <span className="text-xs text-[#8FA3B8]">
                Pilih jawaban yang paling tepat (atau tekan tombol 1–4).
              </span>
            )}

            {resultInfo === null && (
              <button
                type="button"
                onClick={handleTriggerHint}
                disabled={hintCharges <= 0}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  hintCharges > 0
                    ? 'bg-[#2C3B4E] text-[#F6C65B] hover:bg-[#384A61] cursor-pointer'
                    : 'bg-[#1D2733] text-[#5F7185] cursor-not-allowed'
                }`}
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Lentera Petunjuk ({hintCharges})
              </button>
            )}
          </div>

          {/* Options */}
          <div className="mt-4 grid grid-cols-1 gap-2.5">
            {question.options.map((opt, idx) => {
              const isEliminated = eliminatedIndices.includes(idx);
              const isChosen = selectedIdx === idx;
              const isCorrectOpt = idx === question.correctIndex;

              let btnStyle =
                'border-[#F5E6C8]/15 bg-[#1E2A38] text-[#EEF3F8] hover:border-[#F6C65B]/55 hover:bg-[#263547] cursor-pointer';

              if (isEliminated) {
                btnStyle =
                  'border-[#F5E6C8]/5 bg-[#151D27] text-[#546578] line-through cursor-not-allowed opacity-55';
              } else if (resultInfo !== null) {
                if (isCorrectOpt) {
                  btnStyle =
                    'border-[#76C893] bg-[#1E3A2F] text-[#E6FAEE]';
                } else if (isChosen && !isCorrectOpt) {
                  btnStyle =
                    'border-[#E08E79] bg-[#362628] text-[#FADCD4]';
                } else {
                  btnStyle =
                    'border-[#F5E6C8]/10 bg-[#19232F] text-[#7D90A4]';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isEliminated || resultInfo !== null}
                  onClick={() => handleSelectOption(idx)}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm sm:text-base transition-colors ${btnStyle}`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#121A24]/70 font-mono-num text-xs font-bold text-[#F6C65B]">
                    {optionLetters[idx]}
                  </span>
                  <span className="flex-1 leading-snug">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Friendly Feedback Panel */}
        {resultInfo !== null && (
          <div
            className={`mt-5 rounded-2xl border p-4 ${
              resultInfo.isCorrect
                ? 'border-[#76C893]/40 bg-[#182E26]'
                : 'border-[#E9A978]/40 bg-[#282328]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {resultInfo.isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-[#76C893]" />
                ) : (
                  <HelpCircle className="h-5 w-5 text-[#F3B44C]" />
                )}
                <span className="font-display text-base font-bold text-[#FFF8EA]">
                  {resultInfo.isCorrect
                    ? `${def.name} melancarkan ${formInfo.elementalMove}!`
                    : resultInfo.shieldUsed
                      ? 'Perisai Harmoni menjaga kombomu!'
                      : 'Tidak apa-apa, mari pelajari bersama!'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold font-mono-num">
                {resultInfo.isCorrect ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-[#FFE066]">
                      <Sparkles className="h-3.5 w-3.5" />+{resultInfo.earnedCrystals} Kristal
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#F48FB1]">
                      <Heart className="h-3.5 w-3.5" />+{resultInfo.earnedBond} Bond
                    </span>
                    <span className="text-[#A2E5FA]">
                      Kombo x{resultInfo.newCombo.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-[#F6C65B]">
                    Kombo kini x{resultInfo.newCombo.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#DDE6F0]">
              {question.explanation}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#F5E6C8]/20 bg-[#1B2635] px-4 py-2 text-xs sm:text-sm font-semibold text-[#D7E0EA] transition-colors hover:bg-[#243245] cursor-pointer"
              >
                Kembali Jelajah
              </button>
              <button
                type="button"
                onClick={onNextQuestion}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#F6C65B] px-5 py-2 text-xs sm:text-sm font-bold text-[#141D28] transition-colors hover:bg-[#FFD77A] cursor-pointer"
              >
                Soal Berikutnya (Enter)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
