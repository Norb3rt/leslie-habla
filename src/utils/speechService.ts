import { Language } from './aacBoardLogic';

export interface SpeechOptions {
  lang: Language;
  rate?: number;
  pitch?: number;
  preferredVoiceURI?: string;
  audioPath?: string;
  customAudioDataUrl?: string;
  playTactileChime?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface VoiceOptionInfo {
  voiceURI: string;
  name: string;
  lang: string;
  qualityTier: 'natural' | 'high' | 'standard';
  qualityLabelEs: string;
  qualityLabelEn: string;
}

/**
 * Plays a gentle audio file from public/audio/... if available.
 */
export function playAudioAsset(audioPath?: string, volume = 0.25): void {
  if (!audioPath || typeof window === 'undefined' || typeof Audio === 'undefined') {
    return;
  }
  try {
    const audio = new Audio(audioPath);
    audio.volume = volume;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Ignore autoplay restrictions in headless or un-interacted frames
      });
    }
  } catch {
    // Ignore audio fallback errors
  }
}

const FEMALE_VOICE_KEYWORDS = [
  'dalia',
  'paulina',
  'paloma',
  'mónica',
  'monica',
  'sabina',
  'elena',
  'laura',
  'lucía',
  'lucia',
  'sofía',
  'sofia',
  'salomé',
  'salome',
  'andrea',
  'camila',
  'catalina',
  'valeria',
  'ximena',
  'tania',
  'karla',
  'maría',
  'maria',
  'helena',
  'jenny',
  'aria',
  'ana',
  'ava',
  'emma',
  'michelle',
  'samantha',
  'victoria',
  'karen',
  'zoë',
  'zoe',
  'allison',
  'susan',
  'zira',
  'hazel',
  'libby',
  'sonia',
  'natasha',
  'clara',
  'female',
  'mujer',
  'femenina',
];

const MALE_VOICE_KEYWORDS = [
  'jorge',
  'diego',
  'raúl',
  'raul',
  'pablo',
  'carlos',
  'miguel',
  'álvaro',
  'alvaro',
  'david',
  'mark',
  'guy',
  'andrew',
  'brian',
  'christopher',
  'eric',
  'roger',
  'steffan',
  'daniel',
  'alex',
  'fred',
  'reed',
  'ralph',
  'tom',
  'aaron',
  'arthur',
  'oliver',
  'martin',
  'juan',
  'enrique',
  'tomás',
  'tomas',
  'emilio',
  'alonso',
  'gerardo',
  'rodrigo',
  'sebastián',
  'sebastian',
  'mateo',
  'male',
  'hombre',
];

function hasVoiceKeyword(nameLower: string, keywords: string[]): boolean {
  return keywords.some((kw) => new RegExp(`(^|[^a-záéíóúñü])${kw}([^a-záéíóúñü]|$)`, 'i').test(nameLower));
}

/**
 * Scores a browser SpeechSynthesisVoice so that free Neural / Natural / Google / Enhanced
 * female voices are always prioritized over male or legacy robotic desktop voices.
 */
export function scoreVoiceQuality(voice: SpeechSynthesisVoice, targetLang: Language): number {
  const nameLower = voice.name.toLowerCase();
  const langLower = voice.lang.toLowerCase().replace('_', '-');
  const targetPrefix = targetLang === 'es' ? 'es' : 'en';

  if (!langLower.startsWith(targetPrefix)) {
    return -1000;
  }

  let score = 0;

  // Prefer Latin American / US / Spain mainstream locales first
  if (targetLang === 'es') {
    if (langLower === 'es-mx' || langLower === 'es-us' || langLower === 'es-419') score += 30;
    else if (langLower === 'es-es' || langLower === 'es-co' || langLower === 'es-ar') score += 25;
    else score += 15;
  } else {
    if (langLower === 'en-us') score += 30;
    else if (langLower === 'en-gb' || langLower === 'en-au' || langLower === 'en-ca') score += 25;
    else score += 15;
  }

  // Tier 1: Microsoft Edge / Windows 11 Free Natural & Neural voices (sound human & warm)
  if (
    nameLower.includes('natural') ||
    nameLower.includes('neural') ||
    nameLower.includes('online')
  ) {
    score += 120;
  }

  // Tier 2: Chrome Google voices & Apple Enhanced/Premium voices
  if (
    nameLower.includes('google') ||
    nameLower.includes('premium') ||
    nameLower.includes('enhanced') ||
    nameLower.includes('siri')
  ) {
    score += 95;
  }

  // Tier 3: Prioritize natural female voices for Leslie
  if (hasVoiceKeyword(nameLower, FEMALE_VOICE_KEYWORDS)) {
    score += 55;
  } else if (hasVoiceKeyword(nameLower, MALE_VOICE_KEYWORDS)) {
    score -= 50;
  }

  // Penalize robotic legacy desktop synthesizers
  if (nameLower.includes('desktop') || nameLower.includes('espeak') || nameLower.includes('festival')) {
    score -= 60;
  }

  return score;
}

export function classifyVoiceQuality(voice: SpeechSynthesisVoice): {
  qualityTier: 'natural' | 'high' | 'standard';
  qualityLabelEs: string;
  qualityLabelEn: string;
} {
  const nameLower = voice.name.toLowerCase();
  if (nameLower.includes('natural') || nameLower.includes('neural')) {
    return {
      qualityTier: 'natural',
      qualityLabelEs: '★ Voz Natural (Ultra realista)',
      qualityLabelEn: '★ Natural Voice (Ultra realistic)',
    };
  }
  if (
    nameLower.includes('google') ||
    nameLower.includes('premium') ||
    nameLower.includes('enhanced') ||
    nameLower.includes('online')
  ) {
    return {
      qualityTier: 'high',
      qualityLabelEs: '★ Alta calidad (Google / Mejorada)',
      qualityLabelEn: '★ High Quality (Google / Enhanced)',
    };
  }
  return {
    qualityTier: 'standard',
    qualityLabelEs: 'Voz estándar del sistema',
    qualityLabelEn: 'Standard system voice',
  };
}

/**
 * Returns all available browser voices for a given language, sorted from best to standard quality.
 */
export function getAvailableVoicesForLanguage(lang: Language): VoiceOptionInfo[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  const voices = window.speechSynthesis.getVoices() || [];
  const targetPrefix = lang === 'es' ? 'es' : 'en';

  const matching = voices
    .filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(targetPrefix))
    .sort((a, b) => scoreVoiceQuality(b, lang) - scoreVoiceQuality(a, lang));

  return matching.map((v) => {
    const q = classifyVoiceQuality(v);
    return {
      voiceURI: v.voiceURI,
      name: v.name,
      lang: v.lang,
      ...q,
    };
  });
}

/**
 * Selects the best matching Web Speech API voice for English or Spanish,
 * respecting the user's preferredVoiceURI if selected.
 */
export function selectBestVoice(
  lang: Language,
  preferredVoiceURI?: string
): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  if (preferredVoiceURI) {
    const exactChosen = voices.find((v) => v.voiceURI === preferredVoiceURI || v.name === preferredVoiceURI);
    if (exactChosen) return exactChosen;
  }

  const targetPrefix = lang === 'es' ? 'es' : 'en';
  const candidates = voices
    .filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(targetPrefix))
    .sort((a, b) => scoreVoiceQuality(b, lang) - scoreVoiceQuality(a, lang));

  return candidates[0] ?? null;
}

// Retain the currently speaking utterance so Chromium/WebKit GC does not drop playback
let activeUtterance: SpeechSynthesisUtterance | null = null;

// Pre-warm browser voice list so the very first tap uses the best available voice
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.getVoices();
    if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        window.speechSynthesis.getVoices();
      });
    }
  } catch {
    // Ignore voice preload errors in restricted environments
  }
}

/**
 * Speaks a single word or phrase using custom recorded audio (if provided) or
 * the highest-quality free Web Speech API voice available.
 */
export function speakText(text: string, options: SpeechOptions): void {
  const cleanText = (text ?? '').trim();
  const {
    lang,
    rate = 0.92,
    pitch = 1.0,
    preferredVoiceURI,
    audioPath,
    customAudioDataUrl,
    playTactileChime = false,
    onStart,
    onEnd,
  } = options;

  if (!cleanText && !customAudioDataUrl) {
    onEnd?.();
    return;
  }

  // If caregiver recorded a real human voice clip for this word, play it directly
  if (customAudioDataUrl && typeof window !== 'undefined' && typeof Audio !== 'undefined') {
    try {
      const customAudio = new Audio(customAudioDataUrl);
      customAudio.onplay = () => onStart?.();
      customAudio.onended = () => onEnd?.();
      customAudio.onerror = () => onEnd?.();
      onStart?.();
      customAudio.play().catch(() => onEnd?.());
      return;
    } catch {
      // Fall through to Web Speech API
    }
  }

  if (playTactileChime && audioPath) {
    playAudioAsset(audioPath, 0.14);
  }

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onStart?.();
    setTimeout(() => onEnd?.(), 350);
    return;
  }

  try {
    const synth = window.speechSynthesis;

    // Only cancel when actually speaking or queued to avoid Chrome's cancel-before-speak swallow bug
    if (synth.speaking || synth.pending) {
      synth.cancel();
    }
    if (synth.paused) {
      synth.resume();
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const chosenVoice = selectBestVoice(lang, preferredVoiceURI);

    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    } else {
      utterance.lang = lang === 'es' ? 'es-MX' : 'en-US';
    }

    utterance.rate = rate;
    utterance.pitch = pitch;

    let finished = false;
    const finishOnce = () => {
      if (!finished) {
        finished = true;
        if (activeUtterance === utterance) {
          activeUtterance = null;
        }
        onEnd?.();
      }
    };

    utterance.onstart = () => {
      onStart?.();
    };
    utterance.onend = finishOnce;
    utterance.onerror = finishOnce;

    activeUtterance = utterance;
    onStart?.();
    synth.speak(utterance);

    // Safety fallback timer in case headless browser speechSynthesis never fires onend
    const estimatedMs = Math.max(550, Math.min(4000, cleanText.split(/\s+/).length * 460));
    setTimeout(finishOnce, estimatedMs);
  } catch {
    onStart?.();
    setTimeout(() => onEnd?.(), 400);
  }
}
