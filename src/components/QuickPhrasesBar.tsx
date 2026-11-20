import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Language, QuickPhrase } from '../utils/aacBoardLogic';
import { THEME_STYLES } from './PictureGrid';

interface QuickPhrasesBarProps {
  phrases: QuickPhrase[];
  lang: Language;
  activePhraseId: string | null;
  onSpeakPhrase: (phrase: QuickPhrase) => void;
  onOpenMoreFolders: () => void;
}

export const QuickPhrasesBar: React.FC<QuickPhrasesBarProps> = ({
  phrases,
  lang,
  activePhraseId,
  onSpeakPhrase,
  onOpenMoreFolders,
}) => {
  return (
    <section
      aria-label={lang === 'es' ? 'Frases rápidas y más categorías' : 'Quick phrases and more categories'}
      className="w-full rounded-3xl bg-white border-2 border-slate-200/90 shadow-xs p-2 sm:p-2.5 shrink-0"
    >
      <div className="flex flex-col lg:flex-row items-stretch gap-2 sm:gap-2.5">
        {/* Quick Phrases Grid (8 one-tap phrases) */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-600 font-display">
              {lang === 'es' ? 'Frases rápidas (1 toque)' : 'Quick phrases'}
            </h2>
          </div>

          <div
            data-testid="quick-phrases-bar"
            className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2"
          >
            {phrases.map((phrase) => {
              const text = lang === 'es' ? phrase.es : phrase.en;
              const style = THEME_STYLES[phrase.colorTheme] ?? THEME_STYLES.sky;
              const isActive = activePhraseId === phrase.id;

              return (
                <button
                  key={phrase.id}
                  type="button"
                  onClick={() => onSpeakPhrase(phrase)}
                  aria-label={text}
                  className={`min-h-[54px] sm:min-h-[58px] px-2.5 sm:px-3 py-1.5 rounded-2xl border-2 border-b-4 flex items-center gap-2.5 sm:gap-3 text-left transition-transform duration-150 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                    style.cardBg
                  } ${style.border} ${
                    isActive
                      ? `${style.activeRing} -translate-y-0.5`
                      : 'active:translate-y-0.5'
                  }`}
                >
                  <span
                    data-testid="quick-phrase-icon"
                    className="text-3xl sm:text-4xl leading-none shrink-0"
                    aria-hidden="true"
                  >
                    {phrase.icon}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 font-display leading-tight line-clamp-2">
                    {text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dedicated "More" Tile to Open Category Folders (Talk, Food, Feelings, People, Places, Play) */}
        <div className="flex lg:w-44 shrink-0">
          <button
            type="button"
            data-testid="more-folders-tile"
            onClick={onOpenMoreFolders}
            className="w-full min-h-[64px] lg:min-h-full px-3.5 py-2.5 rounded-2xl border-2 border-b-[5px] border-indigo-400 border-b-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:translate-y-0.5 flex flex-row lg:flex-col items-center justify-center gap-2 text-indigo-950 transition-all cursor-pointer select-none shadow-xs focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FolderOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="text-left lg:text-center">
              <span className="block text-base sm:text-lg font-bold font-display leading-tight whitespace-nowrap">
                {lang === 'es' ? 'Más / Carpetas' : 'More'}
              </span>
              <span
                aria-hidden="true"
                className="block text-[11px] font-medium text-indigo-800 whitespace-nowrap"
              >
                {lang === 'es'
                  ? 'Hablar · Colores · Más'
                  : 'Talk · Colors · More'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
