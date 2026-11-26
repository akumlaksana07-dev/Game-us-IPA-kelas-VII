import React from 'react';
import { BookOpen, Sparkles, UserCheck } from 'lucide-react';

interface TitleScreenProps {
  answeredCount: number;
  totalQuestions: number;
  onStart: () => void;
  onOpenCompanions: () => void;
  onOpenDeveloper: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  answeredCount,
  totalQuestions,
  onStart,
  onOpenCompanions,
  onOpenDeveloper,
}) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-start px-6 sm:px-14">
      <div className="pointer-events-auto max-w-lg rounded-3xl border border-[#F5E6C8]/20 bg-[#141D28]/92 p-7 sm:p-9 shadow-2xl">
        {/* Bespoke inline SVG Title Crest */}
        <div className="mb-5 flex items-center gap-4">
          <svg
            width="56"
            height="56"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="shrink-0"
          >
            <circle cx="32" cy="32" r="29" fill="#233345" stroke="#F6C65B" strokeWidth="2" />
            <path
              d="M32 13L36.2 25.8L49 30L36.2 34.2L32 47L27.8 34.2L15 30L27.8 25.8L32 13Z"
              fill="#F6C65B"
            />
            <path
              d="M21 44C24.5 39.5 39.5 39.5 43 44"
              stroke="#76C893"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="46" cy="18" r="3" fill="#A2E5FA" />
          </svg>
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#F6C65B]">
              Petualangan Kuis IPA 3D Isometrik
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#FFF8EA] leading-tight">
              Lumina Grove
            </h1>
          </div>
        </div>

        <p className="text-sm sm:text-base leading-relaxed text-[#D7E0EA]">
          Jelajahi pulau damai, hutan berlentera, dan reruntuhan melayang bersama
          makhluk pendamping berelemen. Jawab kuis IPA dengan santai untuk memicu
          efek elemen, mengumpulkan Kristal Bintang, dan berevolusi hingga wujud Astral.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#9FB3C8]">
          <span>4 Makhluk Pendamping</span>
          <span aria-hidden="true">·</span>
          <span>3 Tahap Evolusi</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-num">
            {answeredCount}/{totalQuestions} Soal IPA Terjawab
          </span>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F6C65B] px-6 py-3 text-sm font-bold text-[#1A222D] transition-transform duration-150 hover:scale-[1.02] hover:bg-[#FFD77A] active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            Mulai Petualangan
          </button>

          <button
            type="button"
            onClick={onOpenCompanions}
            className="inline-flex items-center gap-2 rounded-xl border border-[#F5E6C8]/25 bg-[#1F2C3D] px-4 py-3 text-sm font-semibold text-[#F4EFE4] transition-colors hover:bg-[#2A3A4F] cursor-pointer whitespace-nowrap shrink-0"
          >
            <BookOpen className="h-4 w-4 text-[#76C893]" />
            Koleksi Pendamping
          </button>

          <button
            type="button"
            onClick={onOpenDeveloper}
            className="inline-flex items-center gap-2 rounded-xl border border-[#F5E6C8]/20 bg-[#1B2635] px-4 py-3 text-sm font-semibold text-[#D7E0EA] transition-colors hover:bg-[#253447] cursor-pointer whitespace-nowrap shrink-0"
          >
            <UserCheck className="h-4 w-4 text-[#A2E5FA]" />
            Profil Pengembang
          </button>
        </div>

        <p className="mt-5 border-t border-[#F5E6C8]/12 pt-4 text-xs text-[#9FB3C8]">
          WASD / Klik Tanah Gerak · E / Klik Totem Kuis · Spasi Lompat · Esc Jeda
        </p>
      </div>
    </div>
  );
};
