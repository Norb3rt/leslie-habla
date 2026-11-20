import vocabularyJson from '../data/vocabulary.json';

export type Language = 'en' | 'es';

export type ColorTheme =
  | 'amber'
  | 'sky'
  | 'emerald'
  | 'teal'
  | 'rose'
  | 'violet'
  | 'orange';

export interface LocalizedWordContent {
  label: string;
  spoken: string;
  audio: string;
}

export interface VocabButton {
  id: string;
  slot: number;
  category: string;
  colorTheme: ColorTheme;
  image: string;
  en: LocalizedWordContent;
  es: LocalizedWordContent;
}

export interface QuickPhrase {
  id: string;
  en: string;
  es: string;
  icon: string;
  colorTheme: ColorTheme;
}

export interface CategoryFolder {
  id: string;
  en: string;
  es: string;
  icon: string;
  colorTheme: ColorTheme;
}

export interface InPhraseText {
  en?: string;
  es?: string;
}

export interface FolderWordItem {
  id: string;
  folderId: string;
  en: string;
  es: string;
  icon: string;
  swatch?: string;
  inPhrase?: InPhraseText;
  openFolderId?: string;
}

export interface BoardMeta {
  id: string;
  version: string;
  columns: number;
  rows: number;
  defaultLanguage: Language;
  supportedLanguages: Language[];
  caregiverPin?: string;
}

export interface IntroConfig {
  labelEn: string;
  labelEs: string;
  en: string;
  es: string;
  icon: string;
}

export interface VocabularyData {
  boardMeta: BoardMeta;
  intro?: IntroConfig;
  buttons: VocabButton[];
  quickPhrases: QuickPhrase[];
  folders: CategoryFolder[];
  folderItems: FolderWordItem[];
}

export interface SentenceToken {
  instanceId: string;
  buttonId: string;
}

export const DEFAULT_VOCABULARY: VocabularyData = vocabularyJson as VocabularyData;

/**
 * Ensures the 12 core buttons (or custom buttons) are mapped to their fixed motor-planning slot.
 * Slots 1..minSlots are always returned in exact slot order (never shuffled or reflowed).
 */
export function getFixedGridButtons(
  buttons: VocabButton[],
  minSlots = 12
): (VocabButton | null)[] {
  const bySlot = new Map<number, VocabButton>();
  let maxSlot = minSlots;

  for (const btn of buttons) {
    if (typeof btn.slot === 'number' && btn.slot >= 1) {
      if (!bySlot.has(btn.slot)) {
        bySlot.set(btn.slot, btn);
      }
      if (btn.slot > maxSlot) {
        maxSlot = btn.slot;
      }
    }
  }

  const totalSlots = Math.ceil(maxSlot / 4) * 4;
  const grid: (VocabButton | null)[] = [];
  for (let slot = 1; slot <= totalSlots; slot++) {
    grid.push(bySlot.get(slot) ?? null);
  }
  return grid;
}

export function sanitizeSpokenText(text: string): string {
  return (text ?? '')
    .replace(/_+/g, '')
    .replace(/\s+([?!.,])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Creates a fast lookup map by button ID, including folder items converted to virtual buttons
 * so folder words can also be added to the sentence bar seamlessly.
 */
export type MappedVocabButton = VocabButton & {
  iconEmoji?: string;
  swatch?: string;
  inPhrase?: InPhraseText;
};

export function createButtonMap(
  buttons: VocabButton[],
  folderItems: FolderWordItem[] = [],
  folders: CategoryFolder[] = []
): Map<string, MappedVocabButton> {
  const map = new Map<string, MappedVocabButton>();
  for (const btn of buttons) {
    map.set(btn.id, btn);
  }
  const folderThemeMap = new Map<string, ColorTheme>();
  for (const f of folders) {
    folderThemeMap.set(f.id, f.colorTheme);
  }
  folderItems.forEach((item, idx) => {
    if (!map.has(item.id)) {
      map.set(item.id, {
        id: item.id,
        slot: 100 + idx,
        category: item.folderId,
        colorTheme: folderThemeMap.get(item.folderId) ?? 'sky',
        image: '',
        iconEmoji: item.icon,
        swatch: item.swatch,
        inPhrase: item.inPhrase,
        en: { label: item.en, spoken: sanitizeSpokenText(item.en), audio: '' },
        es: { label: item.es, spoken: sanitizeSpokenText(item.es), audio: '' },
      });
    }
  });
  return map;
}

/**
 * Returns all items belonging to a specific category folder ID.
 */
export function getItemsForFolder(
  folderItems: FolderWordItem[],
  folderId: string
): FolderWordItem[] {
  return folderItems.filter((item) => item.folderId === folderId);
}

const DEFAULT_AUTO_OPEN_FOLDERS: Record<string, string> = {
  'talk-can-i-have': 'food',
  'talk-can-we-go': 'places',
};

/**
 * Returns the category folder ID to open automatically after tapping a slot-template phrase
 * (e.g. "Can I have ___?" -> "food", "Can we go ___?" -> "places").
 */
export function getAutoOpenFolderForItem(
  item: Pick<FolderWordItem, 'id' | 'openFolderId'>
): string | null {
  return item.openFolderId ?? DEFAULT_AUTO_OPEN_FOLDERS[item.id] ?? null;
}

export interface TapRecord {
  key: string;
  timestamp: number;
}

/**
 * Anti-double-tap filter: ignores accidental rapid repeat taps on the same button
 * within guardMs while allowing immediate taps on different buttons.
 */
export function shouldIgnoreRepeatTap(
  lastTap: TapRecord | null,
  buttonKey: string,
  nowMs: number,
  guardMs: number
): boolean {
  if (!guardMs || guardMs <= 0 || !lastTap) return false;
  return lastTap.key === buttonKey && nowMs - lastTap.timestamp < guardMs;
}

/**
 * Verifies the 4-digit caregiver PIN.
 */
export function verifyCaregiverPin(entered: string, targetPin = '1234'): boolean {
  const cleanEntered = (entered ?? '').trim();
  const cleanTarget = (targetPin ?? '1234').trim();
  return /^\d{4}$/.test(cleanEntered) && cleanEntered === cleanTarget;
}

/**
 * Formats the VocabularyData so every item in buttons, quickPhrases, folders, and folderItems
 * is a clean one-line JSON object for effortless maintenance.
 */
export function formatVocabularyAsOneLineJson(data: VocabularyData): string {
  const lines: string[] = ['{'];
  lines.push(`  "boardMeta": ${JSON.stringify(data.boardMeta)},`);
  if (data.intro) {
    lines.push(`  "intro": ${JSON.stringify(data.intro)},`);
  }

  const formatArray = <T>(key: string, arr: T[], isLast: boolean) => {
    lines.push(`  "${key}": [`);
    arr.forEach((item, idx) => {
      const comma = idx < arr.length - 1 ? ',' : '';
      lines.push(`    ${JSON.stringify(item)}${comma}`);
    });
    lines.push(`  ]${isLast ? '' : ','}`);
  };

  formatArray('buttons', data.buttons, false);
  formatArray('quickPhrases', data.quickPhrases ?? [], false);
  formatArray('folders', data.folders ?? [], false);
  formatArray('folderItems', data.folderItems ?? [], true);

  lines.push('}');
  return lines.join('\n');
}

/**
 * Appends a tapped word button to the sentence bar.
 */
export function appendWordToSentence(
  sentence: SentenceToken[],
  buttonId: string,
  maxTokens = 14,
  idGenerator: () => string = () => `${buttonId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
): SentenceToken[] {
  if (!buttonId || sentence.length >= maxTokens) {
    return sentence;
  }
  return [
    ...sentence,
    {
      instanceId: idGenerator(),
      buttonId,
    },
  ];
}

/**
 * Removes the last word token from the sentence bar (Backspace).
 */
export function removeLastWordFromSentence(sentence: SentenceToken[]): SentenceToken[] {
  if (sentence.length === 0) return sentence;
  return sentence.slice(0, -1);
}

/**
 * Removes a word token at a specific index in the sentence bar.
 */
export function removeWordAtIndex(sentence: SentenceToken[], index: number): SentenceToken[] {
  if (index < 0 || index >= sentence.length) return sentence;
  return sentence.filter((_, idx) => idx !== index);
}

/**
 * Clears all words from the sentence bar.
 */
export function clearSentence(): SentenceToken[] {
  return [];
}

function getPhraseFillText(
  btn: MappedVocabButton,
  lang: Language
): string {
  const content = btn[lang] ?? btn.en;
  const inPhrase = btn.inPhrase?.[lang]?.trim();
  if (inPhrase) return inPhrase;
  return content?.spoken?.trim() || content?.label?.trim() || '';
}

/**
 * Builds the full spoken sentence in the active language (English or Spanish).
 */
export function buildSpokenSentenceText(
  sentence: SentenceToken[],
  buttonMap: Map<string, MappedVocabButton>,
  lang: Language
): string {
  const words: string[] = [];
  for (let i = 0; i < sentence.length; i++) {
    const token = sentence[i];
    const btn = buttonMap.get(token.buttonId);
    if (!btn) continue;

    const localized = btn[lang] ?? btn.en;
    const rawLabel = localized?.label ?? '';
    const spokenPart = localized?.spoken?.trim() ?? '';

    if (/_+/.test(rawLabel) && i + 1 < sentence.length) {
      const nextBtn = buttonMap.get(sentence[i + 1].buttonId);
      const nextSpoken = nextBtn ? getPhraseFillText(nextBtn, lang) : '';
      if (nextSpoken) {
        let filled: string;
        if (
          lang === 'es' &&
          /\ba\s+_+/.test(rawLabel) &&
          /^(?:al|a|afuera)\b/i.test(nextSpoken)
        ) {
          filled = rawLabel.replace(/\ba\s+_+/, nextSpoken);
        } else {
          filled = rawLabel.replace(/_+/, nextSpoken);
        }
        words.push(filled.replace(/\s+/g, ' ').trim());
        i++; // Consumed next token into the blank
        continue;
      }
    }

    if (spokenPart) {
      words.push(spokenPart);
    }
  }
  return words.join(' ');
}

/**
 * Builds the individual localized words array for sequential highlighting & speech.
 */
export function getLocalizedSentenceItems(
  sentence: SentenceToken[],
  buttonMap: Map<string, MappedVocabButton>,
  lang: Language
): Array<{
  instanceId: string;
  button: MappedVocabButton;
  label: string;
  spoken: string;
  audio: string;
}> {
  const items: Array<{
    instanceId: string;
    button: MappedVocabButton;
    label: string;
    spoken: string;
    audio: string;
  }> = [];

  for (let i = 0; i < sentence.length; i++) {
    const token = sentence[i];
    const btn = buttonMap.get(token.buttonId);
    if (!btn) continue;

    const content = btn[lang] ?? btn.en;
    const prevBtn = i > 0 ? buttonMap.get(sentence[i - 1].buttonId) : undefined;
    const prevLabel = (prevBtn?.[lang] ?? prevBtn?.en)?.label ?? '';
    const isAfterBlankPhrase = /_+/.test(prevLabel);
    const inPhraseText = isAfterBlankPhrase ? btn.inPhrase?.[lang]?.trim() : undefined;

    items.push({
      instanceId: token.instanceId,
      button: btn,
      label: inPhraseText || content.label,
      spoken: inPhraseText ? sanitizeSpokenText(inPhraseText) : content.spoken,
      audio: content.audio,
    });
  }
  return items;
}

/**
 * Validates a new button entry added via the Caregiver JSON Editor so existing slots never shift.
 */
export function validateNewVocabButton(
  input: {
    enLabel: string;
    enSpoken?: string;
    esLabel: string;
    esSpoken?: string;
    colorTheme?: ColorTheme;
    category?: string;
    image?: string;
  },
  existingButtons: VocabButton[]
): { valid: boolean; error?: string; button?: VocabButton } {
  const enLabel = (input.enLabel ?? '').trim();
  const esLabel = (input.esLabel ?? '').trim();

  if (!enLabel) {
    return { valid: false, error: 'English label is required.' };
  }
  if (!esLabel) {
    return { valid: false, error: 'Spanish label (Español) is required.' };
  }

  const slug = enLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `word-${existingButtons.length + 1}`;

  if (existingButtons.some((b) => b.id === slug)) {
    return {
      valid: false,
      error: `A button with ID "${slug}" already exists on the board.`,
    };
  }

  const maxSlot = existingButtons.reduce((max, b) => Math.max(max, b.slot), 12);
  const nextSlot = maxSlot + 1;

  const enSpoken = (input.enSpoken ?? '').trim() || enLabel;
  const esSpoken = (input.esSpoken ?? '').trim() || esLabel;

  const newButton: VocabButton = {
    id: slug,
    slot: nextSlot,
    category: input.category || 'core',
    colorTheme: input.colorTheme || 'amber',
    image: input.image || '/images/words/i-want.svg',
    en: {
      label: enLabel,
      spoken: enSpoken,
      audio: `/audio/en/${slug}.wav`,
    },
    es: {
      label: esLabel,
      spoken: esSpoken,
      audio: `/audio/es/${slug}.wav`,
    },
  };

  return { valid: true, button: newButton };
}
