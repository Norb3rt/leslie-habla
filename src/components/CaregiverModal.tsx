import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Plus,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  FileJson,
  Mic,
  Square,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {
  ColorTheme,
  Language,
  VocabButton,
  VocabularyData,
  formatVocabularyAsOneLineJson,
  validateNewVocabButton,
} from '../utils/aacBoardLogic';
import {
  VoiceOptionInfo,
  getAvailableVoicesForLanguage,
  speakText,
} from '../utils/speechService';

interface CaregiverModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  vocabulary: VocabularyData;
  speechRate: number;
  onChangeSpeechRate: (rate: number) => void;
  speechPitch: number;
  onChangeSpeechPitch: (pitch: number) => void;
  preferredVoiceEs: string;
  onChangePreferredVoiceEs: (uri: string) => void;
  preferredVoiceEn: string;
  onChangePreferredVoiceEn: (uri: string) => void;
  customRecordings: Record<string, string>;
  onSaveCustomRecording: (key: string, dataUrl: string) => void;
  onDeleteCustomRecording: (key: string) => void;
  playTactileChime: boolean;
  onToggleTactileChime: (enabled: boolean) => void;
  onAddCustomButton: (btn: VocabButton) => void;
  onResetVocabulary: () => void;
}

const AVAILABLE_IMAGES = [
  { label: 'Reaching Hands (I want)', path: '/images/words/i-want.svg' },
  { label: 'Blocks & Plus (More)', path: '/images/words/more.svg' },
  { label: 'Red Apple (Eat)', path: '/images/words/eat.svg' },
  { label: 'Water Cup & Straw (Drink)', path: '/images/words/drink.svg' },
  { label: 'Green Checkmark (Yes)', path: '/images/words/yes.svg' },
  { label: 'Red Cross (No)', path: '/images/words/no.svg' },
  { label: 'Helping Ring (Help)', path: '/images/words/help.svg' },
  { label: 'Raised Hand Octagon (Stop)', path: '/images/words/stop.svg' },
  { label: 'Green Forward Arrow (Go)', path: '/images/words/go.svg' },
  { label: 'Play Ball (Play)', path: '/images/words/play.svg' },
  { label: 'Checkered Flag (Finished)', path: '/images/words/finished.svg' },
  { label: 'Warm Heart (Please)', path: '/images/words/please.svg' },
];

export const CaregiverModal: React.FC<CaregiverModalProps> = ({
  isOpen,
  onClose,
  lang,
  vocabulary,
  speechRate,
  onChangeSpeechRate,
  speechPitch,
  onChangeSpeechPitch,
  preferredVoiceEs,
  onChangePreferredVoiceEs,
  preferredVoiceEn,
  onChangePreferredVoiceEn,
  customRecordings,
  onSaveCustomRecording,
  onDeleteCustomRecording,
  playTactileChime,
  onToggleTactileChime,
  onAddCustomButton,
  onResetVocabulary,
}) => {
  const [voicesEs, setVoicesEs] = useState<VoiceOptionInfo[]>([]);
  const [voicesEn, setVoicesEn] = useState<VoiceOptionInfo[]>([]);
  const [recordingKey, setRecordingKey] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [enLabel, setEnLabel] = useState('');
  const [enSpoken, setEnSpoken] = useState('');
  const [esLabel, setEsLabel] = useState('');
  const [esSpoken, setEsSpoken] = useState('');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('amber');
  const [selectedImage, setSelectedImage] = useState(AVAILABLE_IMAGES[0].path);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const refreshVoices = () => {
      setVoicesEs(getAvailableVoicesForLanguage('es'));
      setVoicesEn(getAvailableVoicesForLanguage('en'));
    };
    refreshVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', refreshVoices);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestVoice = (testLang: Language) => {
    const sampleText =
      testLang === 'es'
        ? 'Hola, yo quiero jugar y comer por favor'
        : 'Hello, I want to play and eat please';
    const voiceURI = testLang === 'es' ? preferredVoiceEs : preferredVoiceEn;
    speakText(sampleText, {
      lang: testLang,
      rate: speechRate,
      pitch: speechPitch,
      preferredVoiceURI: voiceURI || undefined,
      playTactileChime: false,
    });
  };

  const startRecordingWord = async (wordId: string, wordLang: Language) => {
    setMicError(null);
    const key = `${wordLang}:${wordId}`;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError(
        lang === 'es'
          ? 'Tu navegador no permite grabar micrófono en esta ventana.'
          : 'Microphone recording is not available in this browser context.'
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            onSaveCustomRecording(key, reader.result);
          }
        };
        reader.readAsDataURL(blob);
        setRecordingKey(null);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingKey(key);
    } catch {
      setMicError(
        lang === 'es'
          ? 'Permiso de micrófono denegado. Actívalo en el navegador para grabar tu propia voz.'
          : 'Microphone permission denied. Please allow microphone access to record your voice.'
      );
    }
  };

  const stopRecordingWord = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleAddButtonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const validation = validateNewVocabButton(
      {
        enLabel,
        enSpoken,
        esLabel,
        esSpoken,
        colorTheme,
        image: selectedImage,
      },
      vocabulary.buttons
    );

    if (!validation.valid || !validation.button) {
      setFormError(validation.error ?? 'Invalid button input');
      return;
    }

    onAddCustomButton(validation.button);
    setEnLabel('');
    setEnSpoken('');
    setEsLabel('');
    setEsSpoken('');
    setFormSuccess(
      lang === 'es'
        ? `Botón "${validation.button.es.label}" agregado en la posición fija #${validation.button.slot}.`
        : `Added "${validation.button.en.label}" at fixed slot #${validation.button.slot}.`
    );
  };

  const formattedJson = formatVocabularyAsOneLineJson(vocabulary);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(formattedJson);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      // Ignore clipboard permission errors in sandboxed iframes
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="caregiver-modal-title"
    >
      <div className="w-full max-w-4xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-[#FBF9F5]">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-6 h-6 text-amber-600 shrink-0" aria-hidden="true" />
            <h2
              id="caregiver-modal-title"
              className="text-xl font-bold text-slate-900 font-display"
            >
              {lang === 'es'
                ? 'Mejorar Voz Gratuita y Vocabulario JSON'
                : 'Enhance Free Browser Voice & Vocabulary JSON'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'es' ? 'Cerrar panel de ajustes' : 'Close settings panel'}
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-8">
          {/* Section 1: Free Browser Voice Selector & Quality Upgrade */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" aria-hidden="true" />
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'es'
                    ? '01. Selector de Voz Gratuita del Navegador (Voces Naturales / Google)'
                    : '01. Free Browser Voice Selector (Natural / Google Voices)'}
                </h3>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50/70 border border-amber-200/90 p-3.5 text-xs sm:text-sm text-slate-800 leading-relaxed">
              {lang === 'es' ? (
                <p>
                  <strong>¿Cómo lograr que suene mucho más humano y gratis?</strong> Hemos configurado el motor para priorizar automáticamente las voces <strong>Natural / Neural</strong> (incluidas gratis en <strong>Microsoft Edge</strong> como <em>Sabina Natural</em> o <em>Dalia Natural</em>) y las voces de alta calidad de <strong>Google Chrome</strong> (<em>Google español</em>), evitando las voces robóticas antiguas del sistema. Elige tu favorita abajo o pruébala:
                </p>
              ) : (
                <p>
                  <strong>How to get the most natural free voice:</strong> We automatically prioritize <strong>Natural / Neural</strong> voices (built into <strong>Microsoft Edge</strong> for free) and <strong>Google Chrome</strong> high-quality voices over old robotic desktop voices. Pick and test your favorite voice below:
                </p>
              )}
            </div>

            {/* Spanish & English Voice Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Spanish Voice Picker */}
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60 space-y-2.5 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="select-voice-es"
                    className="block text-xs font-bold text-slate-800"
                  >
                    {lang === 'es' ? 'Voz para Español (es)' : 'Spanish Voice (Español)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestVoice('es')}
                    className="min-h-[34px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{lang === 'es' ? 'Probar voz' : 'Test voice'}</span>
                  </button>
                </div>
                <select
                  id="select-voice-es"
                  value={preferredVoiceEs}
                  onChange={(e) => onChangePreferredVoiceEs(e.target.value)}
                  className="w-full min-w-0 min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:outline-2 focus:outline-amber-500 truncate"
                >
                  <option value="">
                    {lang === 'es'
                      ? 'Automática (Mejor voz Natural / Google disponible)'
                      : 'Auto (Best Natural / Google voice available)'}
                  </option>
                  {voicesEs.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang}) — {lang === 'es' ? v.qualityLabelEs : v.qualityLabelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* English Voice Picker */}
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60 space-y-2.5 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="select-voice-en"
                    className="block text-xs font-bold text-slate-800"
                  >
                    {lang === 'es' ? 'Voz para Inglés (en)' : 'English Voice (en)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestVoice('en')}
                    className="min-h-[34px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{lang === 'es' ? 'Probar voz' : 'Test voice'}</span>
                  </button>
                </div>
                <select
                  id="select-voice-en"
                  value={preferredVoiceEn}
                  onChange={(e) => onChangePreferredVoiceEn(e.target.value)}
                  className="w-full min-w-0 min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:outline-2 focus:outline-amber-500 truncate"
                >
                  <option value="">
                    {lang === 'es'
                      ? 'Automática (Mejor voz Natural / Google disponible)'
                      : 'Auto (Best Natural / Google voice available)'}
                  </option>
                  {voicesEn.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang}) — {lang === 'es' ? v.qualityLabelEs : v.qualityLabelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Speed, Pitch & Chime Tuning */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div className="space-y-1">
                <span className="block text-xs font-semibold text-slate-700">
                  {lang === 'es' ? 'Velocidad de pronunciación' : 'Speech Speed'}
                </span>
                <div
                  role="group"
                  aria-label={lang === 'es' ? 'Velocidad de voz' : 'Speech speed'}
                  className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl"
                >
                  {[
                    { rate: 0.8, labelEn: 'Slow (0.8x)', labelEs: 'Pausada (0.8x)' },
                    { rate: 0.92, labelEn: 'Natural (0.92x)', labelEs: 'Natural (0.92x)' },
                    { rate: 1.0, labelEn: 'Normal (1.0x)', labelEs: 'Normal (1.0x)' },
                  ].map((opt) => (
                    <button
                      key={opt.rate}
                      type="button"
                      onClick={() => onChangeSpeechRate(opt.rate)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        Math.abs(speechRate - opt.rate) < 0.03
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {lang === 'es' ? opt.labelEs : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="block text-xs font-semibold text-slate-700">
                  {lang === 'es' ? 'Tono de voz (Pitch)' : 'Voice Pitch'}
                </span>
                <div
                  role="group"
                  aria-label={lang === 'es' ? 'Tono de voz' : 'Voice pitch'}
                  className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl"
                >
                  {[
                    { pitch: 0.95, labelEn: 'Warm (0.95)', labelEs: 'Suave (0.95)' },
                    { pitch: 1.0, labelEn: 'Pure (1.0 ★)', labelEs: 'Puro sin filtro (1.0 ★)' },
                    { pitch: 1.1, labelEn: 'Bright (1.1)', labelEs: 'Infantil (1.1)' },
                  ].map((opt) => (
                    <button
                      key={opt.pitch}
                      type="button"
                      onClick={() => onChangeSpeechPitch(opt.pitch)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        Math.abs(speechPitch - opt.pitch) < 0.03
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {lang === 'es' ? opt.labelEs : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer min-h-[44px] pt-3">
                <input
                  type="checkbox"
                  checked={playTactileChime}
                  onChange={(e) => onToggleTactileChime(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span>
                  {lang === 'es'
                    ? 'Sonido musical al tocar botón'
                    : 'Play tactile chime on tap'}
                </span>
              </label>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Section 2: Record Your Own Real Family Voice (100% Free & Offline) */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'es'
                  ? '02. Opcional: Grabar Voz Familiar Real con tu Micrófono (100% Gratis)'
                  : '02. Optional: Record Real Family Voice via Microphone (100% Free)'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                {lang === 'es'
                  ? 'Si prefieres que el niño escuche la voz real de mamá, papá o un familiar en lugar de la voz sintetizada, toca "Grabar" en cualquier palabra (idioma actual: ' +
                    (lang === 'es' ? 'Español' : 'Inglés') +
                    ').'
                  : 'If you prefer the child to hear a parent or family member’s real voice instead of synthesized speech, tap "Record" on any word below.'}
              </p>
            </div>

            {micError && (
              <p role="alert" className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {micError}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {vocabulary.buttons.map((btn) => {
                const localized = btn[lang] ?? btn.en;
                const recKey = `${lang}:${btn.id}`;
                const hasCustom = Boolean(customRecordings[recKey]);
                const isRecordingThis = recordingKey === recKey;

                return (
                  <div
                    key={btn.id}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between gap-2 ${
                      hasCustom
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {String(btn.slot).padStart(2, '0')}. {localized.label}
                      </span>
                      {hasCustom && (
                        <span className="text-[11px] font-semibold text-emerald-800">
                          {lang === 'es' ? 'Grabada' : 'Recorded'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isRecordingThis ? (
                        <button
                          type="button"
                          onClick={() => startRecordingWord(btn.id, lang)}
                          className="flex-1 min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Mic className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{lang === 'es' ? 'Grabar' : 'Record'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopRecordingWord}
                          className="flex-1 min-h-[36px] px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Square className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{lang === 'es' ? 'Detener' : 'Stop'}</span>
                        </button>
                      )}

                      {hasCustom && (
                        <button
                          type="button"
                          onClick={() => onDeleteCustomRecording(recKey)}
                          aria-label={
                            lang === 'es'
                              ? `Borrar grabación de ${localized.label}`
                              : `Delete recording for ${localized.label}`
                          }
                          className="min-h-[36px] min-w-[36px] rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Section 3: Add a New Button (Preserves Fixed Slots 1..12) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'es'
                    ? '03. Agregar Nuevo Botón Bilingüe (Posición Fija)'
                    : '03. Add New Bilingual Button (Fixed Motor Position)'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  {lang === 'es'
                    ? 'Las 12 palabras básicas conservan siempre sus posiciones 01 a 12. Las palabras nuevas se agregan a partir de la posición 13.'
                    : 'The 12 core words always keep their fixed slots 01–12. New words are appended starting at slot 13 so muscle memory is preserved.'}
                </p>
              </div>
              {vocabulary.buttons.length > 12 && (
                <button
                  type="button"
                  onClick={onResetVocabulary}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{lang === 'es' ? 'Restaurar 12 básicas' : 'Reset to 12 Core Words'}</span>
                </button>
              )}
            </div>

            <form onSubmit={handleAddButtonSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label htmlFor="new-en-label" className="block text-xs font-semibold text-slate-700 mb-1">
                  English Label *
                </label>
                <input
                  id="new-en-label"
                  type="text"
                  value={enLabel}
                  onChange={(e) => setEnLabel(e.target.value)}
                  placeholder="e.g. water"
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-2 focus:outline-amber-500"
                />
              </div>

              <div>
                <label htmlFor="new-es-label" className="block text-xs font-semibold text-slate-700 mb-1">
                  Spanish Label (Español) *
                </label>
                <input
                  id="new-es-label"
                  type="text"
                  value={esLabel}
                  onChange={(e) => setEsLabel(e.target.value)}
                  placeholder="e.g. agua"
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-2 focus:outline-amber-500"
                />
              </div>

              <div>
                <label htmlFor="new-color-theme" className="block text-xs font-semibold text-slate-700 mb-1">
                  Card Color Theme
                </label>
                <select
                  id="new-color-theme"
                  value={colorTheme}
                  onChange={(e) => setColorTheme(e.target.value as ColorTheme)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-2 focus:outline-amber-500"
                >
                  <option value="amber">Warm Amber (Core / Pronouns)</option>
                  <option value="emerald">Emerald Green (Actions / Yes)</option>
                  <option value="sky">Sky Blue (Descriptors)</option>
                  <option value="teal">Teal (Food & Drink)</option>
                  <option value="rose">Coral Rose (Negation / Stop)</option>
                  <option value="violet">Soft Violet (Requests)</option>
                  <option value="orange">Bright Orange (Play)</option>
                </select>
              </div>

              <div>
                <label htmlFor="new-image-select" className="block text-xs font-semibold text-slate-700 mb-1">
                  Picture Asset
                </label>
                <select
                  id="new-image-select"
                  value={selectedImage}
                  onChange={(e) => setSelectedImage(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-2 focus:outline-amber-500"
                >
                  {AVAILABLE_IMAGES.map((img) => (
                    <option key={img.path} value={img.path}>
                      {img.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="text-xs">
                  {formError && (
                    <p role="alert" className="text-rose-600 font-semibold">
                      {formError}
                    </p>
                  )}
                  {formSuccess && (
                    <p role="status" className="text-emerald-700 font-semibold">
                      {formSuccess}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>{lang === 'es' ? 'Agregar Botón a la Cuadrícula' : 'Add Button to Grid'}</span>
                </button>
              </div>
            </form>
          </div>

          <hr className="border-slate-200" />

          {/* Section 4: Single Structured JSON File Inspector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-slate-700 shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'es'
                      ? '04. Archivo Único de Vocabulario (src/data/vocabulary.json)'
                      : '04. Single Vocabulary JSON File (src/data/vocabulary.json)'}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {lang === 'es'
                      ? 'Cada botón define su posición fija (slot), imagen, etiquetas en inglés/español y ruta de pronunciación de audio.'
                      : 'Every button defines its fixed slot, image path, English/Spanish labels, spoken text, and audio pronunciation path in one JSON file.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyJson}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copiedJson ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    <span>{lang === 'es' ? 'Copiado' : 'Copied JSON'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" aria-hidden="true" />
                    <span>{lang === 'es' ? 'Copiar JSON' : 'Copy JSON'}</span>
                  </>
                )}
              </button>
            </div>

            <pre className="w-full max-h-60 overflow-auto rounded-2xl bg-slate-950 text-slate-100 p-4 text-xs font-mono leading-relaxed">
              {formattedJson}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
