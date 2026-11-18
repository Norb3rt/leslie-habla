/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Globe, Lock, LockOpen, SlidersHorizontal } from 'lucide-react';
import {
  CategoryFolder,
  DEFAULT_VOCABULARY,
  FolderWordItem,
  Language,
  QuickPhrase,
  SentenceToken,
  VocabButton,
  VocabularyData,
  appendWordToSentence,
  buildSpokenSentenceText,
  clearSentence,
  createButtonMap,
  getAutoOpenFolderForItem,
  getFixedGridButtons,
  getLocalizedSentenceItems,
  removeLastWordFromSentence,
  sanitizeSpokenText,
} from './utils/aacBoardLogic';
import { speakText } from './utils/speechService';
import { SentenceBar, SentenceDisplayItem } from './components/SentenceBar';
import { PictureGrid } from './components/PictureGrid';
import { QuickPhrasesBar } from './components/QuickPhrasesBar';
import { CategoryFoldersView } from './components/CategoryFoldersView';
import { PinLockModal } from './components/PinLockModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CaregiverModal } from './components/CaregiverModal';

const STORAGE_KEYS = {
  LANG: 'pictovoice_lang_v1',
  CUSTOM_BUTTONS: 'pictovoice_custom_buttons_v1',
  SPEECH_RATE: 'pictovoice_speech_rate_v2',
  SPEECH_PITCH: 'pictovoice_speech_pitch_v2',
  VOICE_ES: 'pictovoice_voice_es_v1',
  VOICE_EN: 'pictovoice_voice_en_v1',
  CUSTOM_RECORDINGS: 'pictovoice_custom_recordings_v1',
  TACTILE_CHIME: 'pictovoice_tactile_chime_v2',
  CAREGIVER_PIN: 'pictovoice_caregiver_pin_v1',
};

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LANG);
      return saved === 'es' ? 'es' : 'en';
    } catch {
      return DEFAULT_VOCABULARY.boardMeta.defaultLanguage;
    }
  });

  const [customButtons, setCustomButtons] = useState<VocabButton[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_BUTTONS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [speechRate, setSpeechRate] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(STORAGE_KEYS.SPEECH_RATE));
      return saved >= 0.5 && saved <= 1.5 ? saved : 0.92;
    } catch {
      return 0.92;
    }
  });

  const [speechPitch, setSpeechPitch] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(STORAGE_KEYS.SPEECH_PITCH));
      return saved >= 0.5 && saved <= 1.5 ? saved : 1.0;
    } catch {
      return 1.0;
    }
  });

  const [preferredVoiceEs, setPreferredVoiceEs] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.VOICE_ES) ?? '';
    } catch {
      return '';
    }
  });

  const [preferredVoiceEn, setPreferredVoiceEn] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.VOICE_EN) ?? '';
    } catch {
      return '';
    }
  });

  const [customRecordings, setCustomRecordings] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_RECORDINGS);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });

  const [playTactileChime, setPlayTactileChime] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TACTILE_CHIME);
      return saved === null ? false : saved === 'true';
    } catch {
      return false;
    }
  });

  const [sentence, setSentence] = useState<SentenceToken[]>([]);
  const [activeButtonId, setActiveButtonId] = useState<string | null>(null);
  const [activePhraseId, setActivePhraseId] = useState<string | null>(null);
  const [activeSpeakingInstanceId, setActiveSpeakingInstanceId] = useState<string | null>(null);
  const [isSpeakingSentence, setIsSpeakingSentence] = useState(false);

  // "More" Category Folders navigation state
  const [isMoreFoldersOpen, setIsMoreFoldersOpen] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [awaitingSlotCompletion, setAwaitingSlotCompletion] = useState(false);

  // 4-Digit PIN Caregiver Lock state ("Voice & JSON" and "Install App" hidden behind PIN)
  const [caregiverPin, setCaregiverPin] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CAREGIVER_PIN);
      return saved && /^\d{4}$/.test(saved)
        ? saved
        : DEFAULT_VOCABULARY.boardMeta.caregiverPin ?? '1234';
    } catch {
      return DEFAULT_VOCABULARY.boardMeta.caregiverPin ?? '1234';
    }
  });
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isCaregiverModalOpen, setIsCaregiverModalOpen] = useState(false);

  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LANG, lang);
      document.documentElement.lang = lang;
    } catch {
      // Ignore storage write errors
    }
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_BUTTONS, JSON.stringify(customButtons));
    } catch {
      // Ignore storage write errors
    }
  }, [customButtons]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SPEECH_RATE, String(speechRate));
    } catch {
      // Ignore storage write errors
    }
  }, [speechRate]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SPEECH_PITCH, String(speechPitch));
    } catch {
      // Ignore storage write errors
    }
  }, [speechPitch]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VOICE_ES, preferredVoiceEs);
    } catch {
      // Ignore storage write errors
    }
  }, [preferredVoiceEs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VOICE_EN, preferredVoiceEn);
    } catch {
      // Ignore storage write errors
    }
  }, [preferredVoiceEn]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_RECORDINGS, JSON.stringify(customRecordings));
    } catch {
      // Ignore storage write errors
    }
  }, [customRecordings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TACTILE_CHIME, String(playTactileChime));
    } catch {
      // Ignore storage write errors
    }
  }, [playTactileChime]);

  useEffect(() => {
    try {
      if (/^\d{4}$/.test(caregiverPin)) {
        localStorage.setItem(STORAGE_KEYS.CAREGIVER_PIN, caregiverPin);
      }
    } catch {
      // Ignore storage write errors
    }
  }, [caregiverPin]);

  const vocabulary: VocabularyData = useMemo(
    () => ({
      ...DEFAULT_VOCABULARY,
      boardMeta: {
        ...DEFAULT_VOCABULARY.boardMeta,
        caregiverPin,
      },
      buttons: [...DEFAULT_VOCABULARY.buttons, ...customButtons],
    }),
    [caregiverPin, customButtons]
  );

  const buttonMap = useMemo(
    () =>
      createButtonMap(
        vocabulary.buttons,
        vocabulary.folderItems,
        vocabulary.folders
      ),
    [vocabulary.buttons, vocabulary.folderItems, vocabulary.folders]
  );

  const fixedGridSlots = useMemo(
    () => getFixedGridButtons(vocabulary.buttons, 12),
    [vocabulary.buttons]
  );

  const localizedSentenceItems = useMemo(
    () => getLocalizedSentenceItems(sentence, buttonMap, lang),
    [sentence, buttonMap, lang]
  );

  const activePreferredVoiceURI = lang === 'es' ? preferredVoiceEs : preferredVoiceEn;

  const clearScheduledTimers = () => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  };

  const handleSelectWord = (button: VocabButton) => {
    clearScheduledTimers();
    setIsSpeakingSentence(false);
    setActiveSpeakingInstanceId(null);

    const updated = appendWordToSentence(sentence, button.id);
    setSentence(updated);

    const localized = button[lang] ?? button.en;
    setActiveButtonId(button.id);

    const customRec = customRecordings[`${lang}:${button.id}`];

    speakText(localized.spoken, {
      lang,
      rate: speechRate,
      pitch: speechPitch,
      preferredVoiceURI: activePreferredVoiceURI || undefined,
      audioPath: localized.audio,
      customAudioDataUrl: customRec,
      playTactileChime,
      onEnd: () => {
        setActiveButtonId((prev) => (prev === button.id ? null : prev));
      },
    });
  };

  const handleSelectFolderWord = (item: FolderWordItem, _folder: CategoryFolder) => {
    clearScheduledTimers();
    setIsSpeakingSentence(false);
    setActiveSpeakingInstanceId(null);

    const updated = appendWordToSentence(sentence, item.id);
    setSentence(updated);

    const targetFolder = getAutoOpenFolderForItem(item);
    if (targetFolder) {
      setAwaitingSlotCompletion(true);
      setIsMoreFoldersOpen(true);
      setActiveFolderId(targetFolder);
      return;
    }

    if (awaitingSlotCompletion) {
      setAwaitingSlotCompletion(false);
      setActiveFolderId(null);
      setIsMoreFoldersOpen(false);
      return;
    }

    const rawText = lang === 'es' ? item.es : item.en;
    const spokenText = sanitizeSpokenText(rawText);
    setActiveButtonId(item.id);

    speakText(spokenText, {
      lang,
      rate: speechRate,
      pitch: speechPitch,
      preferredVoiceURI: activePreferredVoiceURI || undefined,
      playTactileChime,
      onEnd: () => {
        setActiveButtonId((prev) => (prev === item.id ? null : prev));
      },
    });
  };

  const handleSpeakQuickPhrase = (phrase: QuickPhrase) => {
    clearScheduledTimers();
    setIsSpeakingSentence(false);
    setActiveSpeakingInstanceId(null);

    const spokenText = lang === 'es' ? phrase.es : phrase.en;
    setActivePhraseId(phrase.id);

    speakText(spokenText, {
      lang,
      rate: speechRate,
      pitch: speechPitch,
      preferredVoiceURI: activePreferredVoiceURI || undefined,
      playTactileChime,
      onEnd: () => {
        setActivePhraseId((prev) => (prev === phrase.id ? null : prev));
      },
    });
  };

  const handleTapSentenceWord = (item: SentenceDisplayItem) => {
    clearScheduledTimers();
    setIsSpeakingSentence(false);
    setActiveSpeakingInstanceId(item.instanceId);

    const customRec = customRecordings[`${lang}:${item.button.id}`];

    speakText(item.spoken, {
      lang,
      rate: speechRate,
      pitch: speechPitch,
      preferredVoiceURI: activePreferredVoiceURI || undefined,
      audioPath: item.audio,
      customAudioDataUrl: customRec,
      playTactileChime,
      onEnd: () => {
        setActiveSpeakingInstanceId((prev) =>
          prev === item.instanceId ? null : prev
        );
      },
    });
  };

  const handleSpeakSentence = () => {
    if (localizedSentenceItems.length === 0) return;

    clearScheduledTimers();
    const fullText = buildSpokenSentenceText(sentence, buttonMap, lang);
    setIsSpeakingSentence(true);

    const perWordMs = Math.max(380, Math.round(460 / speechRate));
    localizedSentenceItems.forEach((item, index) => {
      const timerId = window.setTimeout(() => {
        setActiveSpeakingInstanceId(item.instanceId);
      }, index * perWordMs);
      timersRef.current.push(timerId);
    });

    const firstAudio = localizedSentenceItems[0]?.audio;
    speakText(fullText, {
      lang,
      rate: speechRate,
      pitch: speechPitch,
      preferredVoiceURI: activePreferredVoiceURI || undefined,
      audioPath: firstAudio,
      playTactileChime,
      onEnd: () => {
        const endTimer = window.setTimeout(() => {
          setIsSpeakingSentence(false);
          setActiveSpeakingInstanceId(null);
        }, 200);
        timersRef.current.push(endTimer);
      },
    });
  };

  const handleBackspace = () => {
    clearScheduledTimers();
    setIsSpeakingSentence(false);
    setActiveSpeakingInstanceId(null);
    setSentence((prev) => removeLastWordFromSentence(prev));
  };

  const handleClearSentence = () => {
    clearScheduledTimers();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingSentence(false);
    setActiveSpeakingInstanceId(null);
    setActiveButtonId(null);
    setAwaitingSlotCompletion(false);
    setSentence(clearSentence());
  };

  const handleFolderBack = () => {
    setAwaitingSlotCompletion(false);
    if (activeFolderId) {
      setActiveFolderId(null);
    } else {
      setIsMoreFoldersOpen(false);
    }
  };

  const handleAddCustomButton = (newBtn: VocabButton) => {
    setCustomButtons((prev) => [...prev, newBtn]);
  };

  const handleResetVocabulary = () => {
    setCustomButtons([]);
  };

  const handleSaveCustomRecording = (key: string, dataUrl: string) => {
    setCustomRecordings((prev) => ({ ...prev, [key]: dataUrl }));
  };

  const handleDeleteCustomRecording = (key: string) => {
    setCustomRecordings((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#FBF9F5] text-slate-900 ${
        !isMoreFoldersOpen ? 'lg:h-dvh lg:overflow-hidden' : ''
      }`}
    >
      {/* Top Bar: 3-Zone Contract */}
      <header className="w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xs shrink-0">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand Title */}
          <a
            href="#main-board"
            onClick={(e) => {
              e.preventDefault();
              setAwaitingSlotCompletion(false);
              setIsMoreFoldersOpen(false);
              setActiveFolderId(null);
            }}
            className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
          >
            PictoVoice
          </a>

          {/* Zone 2: Bilingual Toggle (English / Español) */}
          <div
            role="group"
            aria-label={lang === 'es' ? 'Selector de idioma' : 'Language selector'}
            className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80"
          >
            <Globe className="w-4 h-4 text-slate-500 ml-2 hidden sm:inline shrink-0" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
              className={`min-h-[38px] px-3 py-1 rounded-lg text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                lang === 'en'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang('es')}
              aria-pressed={lang === 'es'}
              className={`min-h-[38px] px-3 py-1 rounded-lg text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                lang === 'es'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Español
            </button>
          </div>

          {/* Zone 3: 4-Digit PIN Gate for Caregiver Controls ("Voice & JSON" and "Install App") */}
          <div className="flex items-center gap-2 shrink-0">
            {!isPinUnlocked ? (
              <button
                type="button"
                data-testid="caregiver-pin-trigger"
                onClick={() => setIsPinModalOpen(true)}
                aria-label={
                  lang === 'es'
                    ? 'PIN Adultos: desbloquear ajustes con PIN de 4 dígitos'
                    : 'PIN Lock: unlock settings with 4-digit PIN'
                }
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
                <span>{lang === 'es' ? 'PIN Adultos' : 'PIN Lock'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCaregiverModalOpen(true)}
                  aria-label={
                    lang === 'es'
                      ? 'Cambiar Voz / JSON: abrir voz del navegador y vocabulario'
                      : 'Voice & JSON'
                  }
                  className="min-h-[42px] px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-slate-900 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                  <span>{lang === 'es' ? 'Cambiar Voz / JSON' : 'Voice & JSON'}</span>
                </button>

                <PWAInstallButton lang={lang} />

                <button
                  type="button"
                  onClick={() => {
                    setIsPinUnlocked(false);
                    setIsCaregiverModalOpen(false);
                  }}
                  aria-label={lang === 'es' ? 'Bloquear controles de adulto' : 'Lock caregiver controls'}
                  className="min-h-[42px] min-w-[42px] px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <LockOpen className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Full-Width Centered AAC Workspace */}
      <main
        id="main-board"
        className={`flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex flex-col justify-center gap-2 sm:gap-2.5 ${
          !isMoreFoldersOpen ? 'lg:min-h-0' : ''
        }`}
      >
        {/* Top Sentence Bar */}
        <SentenceBar
          items={localizedSentenceItems}
          lang={lang}
          activeSpeakingInstanceId={activeSpeakingInstanceId}
          isSpeakingSentence={isSpeakingSentence}
          onSpeakSentence={handleSpeakSentence}
          onClearSentence={handleClearSentence}
          onBackspace={handleBackspace}
          onTapSentenceWord={handleTapSentenceWord}
        />

        {/* Fixed 12-Word Home Grid OR Category Folders View */}
        {!isMoreFoldersOpen ? (
          <PictureGrid
            gridSlots={fixedGridSlots}
            lang={lang}
            activeButtonId={activeButtonId}
            onSelectWord={handleSelectWord}
          />
        ) : (
          <CategoryFoldersView
            folders={vocabulary.folders}
            folderItems={vocabulary.folderItems}
            activeFolderId={activeFolderId}
            lang={lang}
            activeItemId={activeButtonId}
            onSelectFolder={(folderId) => setActiveFolderId(folderId)}
            onSelectFolderWord={handleSelectFolderWord}
            onBack={handleFolderBack}
          />
        )}

        {/* Quick Phrases Bar Below the Grid + "More" Category Folders Tile */}
        <QuickPhrasesBar
          phrases={vocabulary.quickPhrases}
          lang={lang}
          activePhraseId={activePhraseId}
          onSpeakPhrase={handleSpeakQuickPhrase}
          onOpenMoreFolders={() => {
            setAwaitingSlotCompletion(false);
            setIsMoreFoldersOpen(true);
            setActiveFolderId(null);
          }}
        />
      </main>

      {/* 4-Digit PIN Lock Modal */}
      <PinLockModal
        isOpen={isPinModalOpen}
        lang={lang}
        expectedPin={caregiverPin}
        onClose={() => setIsPinModalOpen(false)}
        onUnlockSuccess={() => {
          setIsPinModalOpen(false);
          setIsPinUnlocked(true);
        }}
        onChangePin={(newPin) => setCaregiverPin(newPin)}
      />

      {/* Caregiver / Voice & JSON Manager Modal */}
      <CaregiverModal
        isOpen={isCaregiverModalOpen}
        onClose={() => setIsCaregiverModalOpen(false)}
        lang={lang}
        vocabulary={vocabulary}
        speechRate={speechRate}
        onChangeSpeechRate={setSpeechRate}
        speechPitch={speechPitch}
        onChangeSpeechPitch={setSpeechPitch}
        preferredVoiceEs={preferredVoiceEs}
        onChangePreferredVoiceEs={setPreferredVoiceEs}
        preferredVoiceEn={preferredVoiceEn}
        onChangePreferredVoiceEn={setPreferredVoiceEn}
        customRecordings={customRecordings}
        onSaveCustomRecording={handleSaveCustomRecording}
        onDeleteCustomRecording={handleDeleteCustomRecording}
        playTactileChime={playTactileChime}
        onToggleTactileChime={setPlayTactileChime}
        onAddCustomButton={handleAddCustomButton}
        onResetVocabulary={handleResetVocabulary}
      />

      {/* Offline Status Banner */}
      <OfflineIndicator lang={lang} />
    </div>
  );
}
