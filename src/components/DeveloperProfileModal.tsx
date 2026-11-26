import React from 'react';
import { Award, BookOpen, Compass, Mail, Sparkles, X } from 'lucide-react';

interface DeveloperProfileModalProps {
  totalQuestions: number;
  onClose: () => void;
}

export const DeveloperProfileModal: React.FC<DeveloperProfileModalProps> = ({
  totalQuestions,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0B1219]/75 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-[#F5E6C8]/25 bg-[#16202C] p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#F5E6C8]/12 pb-5">
          <div className="flex items-center gap-4">
            {/* Bespoke Educator-Developer Emblem */}
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="shrink-0"
            >
              <rect width="64" height="64" rx="18" fill="#233244" />
              <circle cx="32" cy="24" r="10" fill="#F6C65B" />
              <path
                d="M16 50C16 41.1634 23.1634 34 32 34C40.8366 34 48 41.1634 48 50"
                fill="#76C893"
              />
              <circle cx="50" cy="14" r="4" fill="#A2E5FA" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-[#F6C65B]">
                Profil Pengembang & Perancang Pembelajaran
              </p>
              <h2 className="font-display text-2xl font-bold text-[#FFF8EA]">
                Akum Laksana
              </h2>
              <p className="text-xs sm:text-sm text-[#B7C7D8]">
                Pendidik IPA SMP · Kreator Media Pembelajaran Interaktif 3D
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#9FB3C8] transition-colors hover:bg-[#233244] hover:text-[#FFF8EA] cursor-pointer"
            aria-label="Tutup Profil Pengembang"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <p className="text-sm leading-relaxed text-[#DDE6F0]">
            <strong className="text-[#FFF8EA]">Lumina Grove: Sahabat IPA</strong>{' '}
            dirancang untuk menghadirkan pengalaman belajar Ilmu Pengetahuan Alam
            yang hangat, santai (<em>cozy</em>), dan bebas rasa cemas. Terinspirasi
            dari ikatan persahabatan karakter seperti Pikachu dan Digimon, siswa diajak
            memahami konsep fisika dan kimia dasar sambil merawat makhluk pendamping
            menuju wujud Astral.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#F5E6C8]/12 bg-[#1C2837] p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F6C65B]">
                <BookOpen className="h-4 w-4" />
                Bank Soal Teracak
              </div>
              <p className="mt-1 font-mono-num text-lg font-bold text-[#FFF8EA]">
                {totalQuestions} Soal IPA
              </p>
              <p className="text-[11px] text-[#9FB3C8]">
                Besaran, Zat, Kalor, Massa Jenis, GLB, & Hukum Newton
              </p>
            </div>

            <div className="rounded-2xl border border-[#F5E6C8]/12 bg-[#1C2837] p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#76C893]">
                <Compass className="h-4 w-4" />
                Lingkungan 3D
              </div>
              <p className="mt-1 font-display text-lg font-bold text-[#FFF8EA]">
                3 Pulau Damai
              </p>
              <p className="text-[11px] text-[#9FB3C8]">
                Three.js Isometrik + Efek Suara Synth Prosedural
              </p>
            </div>

            <div className="rounded-2xl border border-[#F5E6C8]/12 bg-[#1C2837] p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#A2E5FA]">
                <Award className="h-4 w-4" />
                Prinsip Pedagogis
              </div>
              <p className="mt-1 font-display text-lg font-bold text-[#FFF8EA]">
                Tanpa Game Over
              </p>
              <p className="text-[11px] text-[#9FB3C8]">
                Umpan balik ramah & penjelasan singkat setiap soal
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F5E6C8]/12 bg-[#1A2533] px-4 py-3 text-xs text-[#D7E0EA]">
            <span className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#F6C65B]" />
              <span>akumlaksana07@guru.smp.belajar.id</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#9FB3C8]">
              <Sparkles className="h-3.5 w-3.5 text-[#76C893]" />
              Kurikulum IPA SMP · Edisi Petualangan Santai
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#F6C65B] px-5 py-2.5 text-sm font-bold text-[#141D28] transition-colors hover:bg-[#FFD77A] cursor-pointer"
          >
            Tutup Profil
          </button>
        </div>
      </div>
    </div>
  );
};
