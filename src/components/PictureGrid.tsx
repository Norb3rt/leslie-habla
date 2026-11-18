import React, { useState } from 'react';
import { ColorTheme, Language, VocabButton } from '../utils/aacBoardLogic';

interface PictureGridProps {
  gridSlots: (VocabButton | null)[];
  lang: Language;
  activeButtonId: string | null;
  onSelectWord: (button: VocabButton) => void;
}

export const THEME_STYLES: Record<
  ColorTheme,
  {
    cardBg: string;
    border: string;
    activeRing: string;
  }
> = {
  amber: {
    cardBg: 'bg-[#FFFBEB] hover:bg-[#FEF3C7]',
    border: 'border-amber-300 border-b-amber-400',
    activeRing: 'ring-4 ring-amber-400 bg-amber-100',
  },
  sky: {
    cardBg: 'bg-[#F0F9FF] hover:bg-[#E0F2FE]',
    border: 'border-sky-300 border-b-sky-400',
    activeRing: 'ring-4 ring-sky-400 bg-sky-100',
  },
  emerald: {
    cardBg: 'bg-[#ECFDF5] hover:bg-[#D1FAE5]',
    border: 'border-emerald-300 border-b-emerald-400',
    activeRing: 'ring-4 ring-emerald-400 bg-emerald-100',
  },
  teal: {
    cardBg: 'bg-[#F0FDFA] hover:bg-[#CCFBF1]',
    border: 'border-teal-300 border-b-teal-400',
    activeRing: 'ring-4 ring-teal-400 bg-teal-100',
  },
  rose: {
    cardBg: 'bg-[#FFF1F2] hover:bg-[#FFE4E6]',
    border: 'border-rose-300 border-b-rose-400',
    activeRing: 'ring-4 ring-rose-400 bg-rose-100',
  },
  violet: {
    cardBg: 'bg-[#F5F3FF] hover:bg-[#EDE9FE]',
    border: 'border-violet-300 border-b-violet-400',
    activeRing: 'ring-4 ring-violet-400 bg-violet-100',
  },
  orange: {
    cardBg: 'bg-[#FFF7ED] hover:bg-[#FFEDD5]',
    border: 'border-orange-300 border-b-orange-400',
    activeRing: 'ring-4 ring-orange-400 bg-orange-100',
  },
};

export const PictureGrid: React.FC<PictureGridProps> = ({
  gridSlots,
  lang,
  activeButtonId,
  onSelectWord,
}) => {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <section
      aria-label={
        lang === 'es'
          ? 'Cuadrícula fija de botones de comunicación'
          : 'Fixed communication picture button grid'
      }
      className="w-full lg:flex-1 lg:min-h-0 flex flex-col"
    >
      <div
        data-testid="aac-picture-grid"
        className="grid grid-cols-3 sm:grid-cols-4 lg:grid-rows-3 gap-2 sm:gap-3 w-full lg:h-full"
      >
        {gridSlots.map((btn, index) => {
          const slotNumber = index + 1;

          if (!btn) {
            return (
              <div
                key={`empty-slot-${slotNumber}`}
                aria-hidden="true"
                className="min-h-[98px] sm:min-h-[112px] lg:min-h-0 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/40"
              />
            );
          }

          const localized = btn[lang] ?? btn.en;
          const secondaryLang = lang === 'en' ? btn.es : btn.en;
          const style = THEME_STYLES[btn.colorTheme] ?? THEME_STYLES.amber;
          const isSpeakingThis = activeButtonId === btn.id;
          const imageFailed = failedImages[btn.id];

          return (
            <button
              key={btn.id}
              type="button"
              data-slot={btn.slot}
              data-word-id={btn.id}
              onClick={() => onSelectWord(btn)}
              className={`group relative min-h-[98px] sm:min-h-[112px] lg:min-h-0 p-2 sm:p-2.5 rounded-3xl border-2 border-b-[5px] flex flex-col items-center justify-between transition-transform duration-150 cursor-pointer select-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                style.cardBg
              } ${style.border} ${
                isSpeakingThis
                  ? `${style.activeRing} -translate-y-0.5`
                  : 'active:translate-y-1 shadow-xs'
              }`}
            >
              {/* Quiet Secondary Language Hint (Top-Right, no slot numbers) */}
              <div
                aria-hidden="true"
                className="w-full flex items-center justify-end text-[11px] sm:text-xs"
              >
                <span className="text-slate-600 font-sans font-medium truncate max-w-[110px]">
                  {secondaryLang.label}
                </span>
              </div>

              {/* Large High-Contrast Picture Illustration */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 xl:w-16 xl:h-16 flex items-center justify-center transition-transform duration-150 group-hover:scale-105 shrink min-h-0">
                {!imageFailed ? (
                  <img
                    src={btn.image}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [btn.id]: true }))
                    }
                    className="w-full h-full object-contain pointer-events-none drop-shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/80 border border-slate-200 flex items-center justify-center text-lg font-bold text-slate-800 font-display">
                    {localized.label.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Primary Spoken Word Label */}
              <div className="w-full text-center">
                <span className="block text-base sm:text-xl xl:text-2xl leading-tight font-bold text-slate-900 font-display tracking-tight whitespace-nowrap truncate">
                  {localized.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
