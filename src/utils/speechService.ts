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

/**
 * Scores a browser SpeechSynthesisVoice so that free Neural / Natural / Google / Enhanced
 * voices are always prioritized over old robotic OS desktop voices.
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

  // Tier 3: Friendly high-clarity voices across platforms
  if (
    nameLower.includes('sabina') ||
    nameLower.includes('dalia') ||
    nameLower.includes('paulina') ||
    nameLower.includes('mónica') ||
    nameLower.includes('monica') ||
    nameLower.includes('elena') ||
    nameLower.includes('paloma') ||
    nameLower.includes('aria') ||
    nameLower.includes('jenny') ||
    nameLower.includes('ana') ||
    nameLower.includes('samantha') ||
    nameLower.includes('ava')
  ) {
    score += 35;
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

/**
 * Speaks a single word or phrase using custom recorded audio (if provided) or
 * the highest-quality free Web Speech API voice available.
 */
export function speakText(text: string, options: SpeechOptions): void {
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
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
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
        onEnd?.();
      }
    };

    utterance.onstart = () => {
      onStart?.();
    };
    utterance.onend = finishOnce;
    utterance.onerror = finishOnce;

    onStart?.();
    window.speechSynthesis.speak(utterance);

    // Safety fallback timer in case headless browser speechSynthesis never fires onend
    const estimatedMs = Math.max(550, Math.min(3500, text.split(/\s+/).length * 420));
    setTimeout(finishOnce, estimatedMs);
  } catch {
    onStart?.();
    setTimeout(() => onEnd?.(), 400);
  }
}
