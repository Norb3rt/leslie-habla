import React, { useState } from 'react';
import { Volume2, Trash2, Delete, MessageSquare } from 'lucide-react';
import { Language, VocabButton } from '../utils/aacBoardLogic';

export interface SentenceDisplayItem {
  instanceId: string;
  button: VocabButton & { iconEmoji?: string };
  label: string;
  spoken: string;
  audio: string;
}

interface SentenceBarProps {
  items: SentenceDisplayItem[];
  lang: Language;
  activeSpeakingInstanceId: string | null;
  isSpeakingSentence: boolean;
  onSpeakSentence: () => void;
  onClearSentence: () => void;
  onBackspace: () => void;
  onTapSentenceWord: (item: SentenceDisplayItem) => void;
}

export const SentenceBar: React.FC<SentenceBarProps> = ({
  items,
  lang,
  activeSpeakingInstanceId,
  isSpeakingSentence,
  onSpeakSentence,
  onClearSentence,
  onBackspace,
  onTapSentenceWord,
}) => {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const hasWords = items.length > 0;

  return (
    <section
      aria-label={lang === 'es' ? 'Barra de oración' : 'Sentence bar'}
      className="w-full rounded-3xl bg-white border-2 border-slate-200/90 shadow-xs p-2 sm:p-2.5 shrink-0"
    >
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
        {/* Word Strip Container */}
        <div
          data-testid="sentence-strip"
          aria-live="polite"
          className="flex-1 min-h-[74px] sm:min-h-[80px] rounded-2xl bg-[#FBF9F5] border-2 border-dashed border-slate-300 px-3 py-1.5 flex items-center gap-2 overflow-x-auto"
        >
          {!hasWords ? (
            <div className="w-full flex items-center justify-center gap-2.5 text-slate-500 py-1.5 px-2 text-center">
              <MessageSquare className="w-5 h-5 text-amber-500 shrink-0" aria-hidden="true" />
              <span className="text-sm sm:text-base font-semibold font-display">
                {lang === 'es'
                  ? 'Toca los botones para formar una oración'
                  : 'Tap buttons below to build a sentence'}
              </span>
            </div>
          ) : (
            items.map((item, idx) => {
              const isCurrentlySpeaking = activeSpeakingInstanceId === item.instanceId;
              const imgFailed = failedImages[item.button.id];
              return (
                <button
                  key={item.instanceId}
                  type="button"
                  onClick={() => onTapSentenceWord(item)}
                  aria-label={`${lang === 'es' ? 'Palabra en oración' : 'Sentence word'} ${idx + 1}: ${item.label}`}
                  className={`group relative min-h-[62px] min-w-[74px] sm:min-h-[66px] sm:min-w-[82px] px-2.5 py-1 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-transform shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${
                    isCurrentlySpeaking
                      ? 'bg-amber-100 border-amber-500 scale-105 shadow-md'
                      : 'bg-white border-slate-200 hover:border-amber-400 active:scale-95 shadow-xs'
                  }`}
                >
                  <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center">
                    {item.button.iconEmoji ? (
                      <span className="text-2xl sm:text-3xl leading-none" aria-hidden="true">
                        {item.button.iconEmoji}
                      </span>
                    ) : !imgFailed && item.button.image ? (
                      <img
                        src={item.button.image}
                        alt={item.label}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [item.button.id]: true }))
                        }
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-900">
                        {item.label.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 font-display whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Big Action Controls: Speak, Backspace, Clear */}
        <div className="flex items-stretch gap-2 shrink-0">
          {/* Primary Speak Whole Sentence Button */}
          <button
            type="button"
            onClick={onSpeakSentence}
            disabled={!hasWords}
            aria-label={lang === 'es' ? 'Hablar toda la oración' : 'Speak whole sentence'}
            className={`flex-1 lg:flex-initial min-h-[56px] sm:min-h-[74px] min-w-[112px] sm:min-w-[128px] px-4 py-2 rounded-2xl border-b-4 font-display font-bold text-base sm:text-lg flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
              !hasWords
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                : isSpeakingSentence
                ? 'bg-emerald-600 border-emerald-800 text-white scale-[1.02] shadow-md'
                : 'bg-emerald-600 hover:bg-emerald-500 active:translate-y-0.5 border-emerald-800 text-white shadow-sm'
            }`}
          >
            <Volume2 className="w-6 h-6 shrink-0" aria-hidden="true" />
            <span>{lang === 'es' ? 'Hablar' : 'Speak'}</span>
          </button>

          {/* Backspace / Remove Last Word Button */}
          <button
            type="button"
            onClick={onBackspace}
            disabled={!hasWords}
            aria-label={lang === 'es' ? 'Atrás: borrar última palabra' : 'Undo: delete last word'}
            className={`min-h-[56px] sm:min-h-[74px] min-w-[62px] sm:min-w-[72px] px-3 py-2 rounded-2xl border-b-4 font-display font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${
              !hasWords
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-amber-100 hover:bg-amber-200 active:translate-y-0.5 border-amber-300 text-amber-950'
            }`}
          >
            <Delete className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{lang === 'es' ? 'Atrás' : 'Undo'}</span>
          </button>

          {/* Clear Whole Sentence Button */}
          <button
            type="button"
            onClick={onClearSentence}
            disabled={!hasWords}
            aria-label={lang === 'es' ? 'Limpiar oración' : 'Clear sentence'}
            className={`min-h-[56px] sm:min-h-[74px] min-w-[80px] sm:min-w-[96px] px-3.5 py-2 rounded-2xl border-b-4 font-display font-bold text-sm sm:text-base flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 ${
              !hasWords
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-rose-600 hover:bg-rose-500 active:translate-y-0.5 border-rose-800 text-white shadow-sm'
            }`}
          >
            <Trash2 className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{lang === 'es' ? 'Limpiar' : 'Clear'}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
