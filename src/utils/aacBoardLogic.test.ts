import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_VOCABULARY,
  getFixedGridButtons,
  createButtonMap,
  appendWordToSentence,
  removeLastWordFromSentence,
  removeWordAtIndex,
  clearSentence,
  buildSpokenSentenceText,
  validateNewVocabButton,
  getItemsForFolder,
  verifyCaregiverPin,
  formatVocabularyAsOneLineJson,
  sanitizeSpokenText,
  getAutoOpenFolderForItem,
  getLocalizedSentenceItems,
  shouldIgnoreRepeatTap,
} from './aacBoardLogic';
import { scoreVoiceQuality } from './speechService';

test('DEFAULT_VOCABULARY contains the exact 12 required core words, 8 quick phrases, and 7 category folders including Talk, People, Places, and Colors', () => {
  const buttons = DEFAULT_VOCABULARY.buttons;
  assert.equal(buttons.length, 12);

  const expectedEn = [
    'I want',
    'more',
    'eat',
    'drink',
    'yes',
    'no',
    'help',
    'stop',
    'go',
    'play',
    'finished',
    'please',
  ];

  assert.deepEqual(
    buttons.map((b) => b.en.label),
    expectedEn
  );

  const expectedQuickPhrasesEn = [
    'I need the bathroom',
    "I'm hungry",
    "I'm thirsty",
    "I'm tired",
    "I don't feel good",
    'Thank you',
    'I love you',
    'Come here',
  ];
  assert.deepEqual(
    DEFAULT_VOCABULARY.quickPhrases.map((q) => q.en),
    expectedQuickPhrasesEn
  );

  const expectedFoldersEn = ['Talk', 'Food', 'Feelings', 'People', 'Places', 'Play', 'Colors'];
  assert.deepEqual(
    DEFAULT_VOCABULARY.folders.map((f) => f.en),
    expectedFoldersEn
  );

  const colorItems = getItemsForFolder(DEFAULT_VOCABULARY.folderItems, 'colors');
  assert.equal(colorItems.length, 11);
  assert.equal(colorItems[0].en, 'red');
  assert.equal(colorItems[0].es, 'rojo');
  assert.ok(colorItems.every((c) => /^#[0-9A-Fa-f]{6}$/.test(c.swatch ?? '')));

  const talkItems = getItemsForFolder(DEFAULT_VOCABULARY.folderItems, 'talk');
  assert.deepEqual(
    talkItems.map((t) => t.en),
    [
      'Can you help me?',
      'Can I have ___?',
      'Can we go ___?',
      'My turn',
      'I want to talk',
      "I don't understand",
      'Say it again',
      "Wait I'm thinking",
      "I'm happy",
      "I'm sad",
      "I'm mad",
      "I'm scared",
      'It hurts',
    ]
  );

  for (const folder of DEFAULT_VOCABULARY.folders) {
    const items = getItemsForFolder(DEFAULT_VOCABULARY.folderItems, folder.id);
    assert.ok(items.length >= 5, `Folder ${folder.id} should have items`);
  }
});

test('getFixedGridButtons preserves exact motor-planning slot positions even if input array is reversed', () => {
  const reversed = [...DEFAULT_VOCABULARY.buttons].reverse();
  const grid = getFixedGridButtons(reversed, 12);
  assert.equal(grid.length, 12);
  assert.equal(grid[0]?.id, 'i-want');
  assert.equal(grid[1]?.id, 'more');
  assert.equal(grid[11]?.id, 'please');
});

test('sentence operations append core and folder words, backspace, remove at index, and clear deterministically', () => {
  let sentence = clearSentence();
  assert.equal(sentence.length, 0);

  sentence = appendWordToSentence(sentence, 'i-want', 14, () => 'tok-1');
  sentence = appendWordToSentence(sentence, 'food-cookie', 14, () => 'tok-2');
  sentence = appendWordToSentence(sentence, 'please', 14, () => 'tok-3');

  assert.equal(sentence.length, 3);

  const map = createButtonMap(
    DEFAULT_VOCABULARY.buttons,
    DEFAULT_VOCABULARY.folderItems,
    DEFAULT_VOCABULARY.folders
  );
  assert.equal(buildSpokenSentenceText(sentence, map, 'en'), 'I want cookie please');
  assert.equal(buildSpokenSentenceText(sentence, map, 'es'), 'Yo quiero galleta por favor');

  const afterBackspace = removeLastWordFromSentence(sentence);
  assert.equal(buildSpokenSentenceText(afterBackspace, map, 'en'), 'I want cookie');

  const afterRemoveMiddle = removeWordAtIndex(afterBackspace, 1);
  assert.equal(buildSpokenSentenceText(afterRemoveMiddle, map, 'en'), 'I want');

  assert.equal(clearSentence().length, 0);
});

test('validateNewVocabButton enforces required bilingual fields and assigns next fixed slot', () => {
  const emptyCheck = validateNewVocabButton(
    { enLabel: '   ', esLabel: 'agua' },
    DEFAULT_VOCABULARY.buttons
  );
  assert.equal(emptyCheck.valid, false);

  const validCheck = validateNewVocabButton(
    { enLabel: 'water', esLabel: 'agua', category: 'action', colorTheme: 'teal' },
    DEFAULT_VOCABULARY.buttons
  );
  assert.equal(validCheck.valid, true);
  assert.equal(validCheck.button?.slot, 13);
});

test('verifyCaregiverPin validates 4-digit PIN and formatVocabularyAsOneLineJson keeps items on single lines', () => {
  assert.equal(verifyCaregiverPin('1234', '1234'), true);
  assert.equal(verifyCaregiverPin('0000', '1234'), false);
  assert.equal(verifyCaregiverPin('123', '1234'), false);

  const formatted = formatVocabularyAsOneLineJson(DEFAULT_VOCABULARY);
  const parsed = JSON.parse(formatted);
  assert.equal(parsed.quickPhrases.length, 8);
  assert.equal(parsed.folders.length, 7);
  assert.ok(parsed.intro?.es.includes('Leslie Navarrete'));
  assert.ok(parsed.intro?.en.includes('Leslie Navarrete'));
  assert.equal(sanitizeSpokenText('Can I have ___?'), 'Can I have?');
  assert.equal(sanitizeSpokenText('¿Podemos ir a ___?'), '¿Podemos ir a?');
});

test('slot-filling phrases map to Food and Places folders and use inPhrase for display and speech with label fallback', () => {
  assert.equal(getAutoOpenFolderForItem({ id: 'talk-can-i-have' }), 'food');
  assert.equal(getAutoOpenFolderForItem({ id: 'talk-can-we-go' }), 'places');
  assert.equal(getAutoOpenFolderForItem({ id: 'talk-my-turn' }), null);

  for (const folderId of ['food', 'places', 'play']) {
    const items = getItemsForFolder(DEFAULT_VOCABULARY.folderItems, folderId);
    for (const item of items) {
      assert.ok(item.inPhrase?.en?.trim(), `${item.id} should have inPhrase.en`);
      assert.ok(item.inPhrase?.es?.trim(), `${item.id} should have inPhrase.es`);
    }
  }

  const customItems = [
    ...DEFAULT_VOCABULARY.folderItems,
    { id: 'food-custom-no-phrase', folderId: 'food', en: 'grapes', es: 'uvas', icon: '🍇' },
  ];
  const map = createButtonMap(
    DEFAULT_VOCABULARY.buttons,
    customItems,
    DEFAULT_VOCABULARY.folders
  );

  let haveSentence = clearSentence();
  haveSentence = appendWordToSentence(haveSentence, 'talk-can-i-have', 14, () => 't1');
  haveSentence = appendWordToSentence(haveSentence, 'food-cookie', 14, () => 't2');
  assert.equal(buildSpokenSentenceText(haveSentence, map, 'en'), 'Can I have a cookie?');
  assert.equal(buildSpokenSentenceText(haveSentence, map, 'es'), '¿Me das una galleta?');
  assert.equal(getLocalizedSentenceItems(haveSentence, map, 'en')[1].label, 'a cookie');
  assert.equal(getLocalizedSentenceItems(haveSentence, map, 'es')[1].label, 'una galleta');

  let waterSentence = clearSentence();
  waterSentence = appendWordToSentence(waterSentence, 'talk-can-i-have', 14, () => 'w1');
  waterSentence = appendWordToSentence(waterSentence, 'food-water', 14, () => 'w2');
  assert.equal(buildSpokenSentenceText(waterSentence, map, 'en'), 'Can I have some water?');
  assert.equal(buildSpokenSentenceText(waterSentence, map, 'es'), '¿Me das agua?');
  assert.equal(getLocalizedSentenceItems(waterSentence, map, 'en')[1].label, 'some water');
  assert.equal(getLocalizedSentenceItems(waterSentence, map, 'es')[1].label, 'agua');

  let goSentence = clearSentence();
  goSentence = appendWordToSentence(goSentence, 'talk-can-we-go', 14, () => 'g1');
  goSentence = appendWordToSentence(goSentence, 'place-park', 14, () => 'g2');
  assert.equal(buildSpokenSentenceText(goSentence, map, 'en'), 'Can we go to the park?');
  assert.equal(buildSpokenSentenceText(goSentence, map, 'es'), '¿Podemos ir al parque?');
  assert.equal(getLocalizedSentenceItems(goSentence, map, 'en')[1].label, 'to the park');
  assert.equal(getLocalizedSentenceItems(goSentence, map, 'es')[1].label, 'al parque');

  // Plain label used when NOT appended to a "___" phrase
  let normalSentence = clearSentence();
  normalSentence = appendWordToSentence(normalSentence, 'i-want', 14, () => 'n1');
  normalSentence = appendWordToSentence(normalSentence, 'food-cookie', 14, () => 'n2');
  assert.equal(getLocalizedSentenceItems(normalSentence, map, 'en')[1].label, 'cookie');
  assert.equal(buildSpokenSentenceText(normalSentence, map, 'en'), 'I want cookie');

  // Missing inPhrase falls back to plain label
  let fallbackSentence = clearSentence();
  fallbackSentence = appendWordToSentence(fallbackSentence, 'talk-can-i-have', 14, () => 'f1');
  fallbackSentence = appendWordToSentence(fallbackSentence, 'food-custom-no-phrase', 14, () => 'f2');
  assert.equal(getLocalizedSentenceItems(fallbackSentence, map, 'en')[1].label, 'grapes');
  assert.equal(buildSpokenSentenceText(fallbackSentence, map, 'en'), 'Can I have grapes?');
  assert.equal(buildSpokenSentenceText(fallbackSentence, map, 'es'), '¿Me das uvas?');
});

test('scoreVoiceQuality ranks free Natural/Neural and Google voices above robotic desktop voices', () => {
  const roboticDesktop = {
    name: 'Microsoft Sabina Desktop - Spanish (Mexico)',
    lang: 'es-MX',
    localService: true,
    default: true,
    voiceURI: 'ms-sabina-desktop',
  } as SpeechSynthesisVoice;

  const googleChromeVoice = {
    name: 'Google español de Estados Unidos',
    lang: 'es-US',
    localService: false,
    default: false,
    voiceURI: 'google-es-us',
  } as SpeechSynthesisVoice;

  const edgeNaturalVoice = {
    name: 'Microsoft Dalia Online (Natural) - Spanish (Mexico)',
    lang: 'es-MX',
    localService: false,
    default: false,
    voiceURI: 'ms-dalia-natural',
  } as SpeechSynthesisVoice;

  const edgeMaleNatural = {
    name: 'Microsoft Jorge Online (Natural) - Spanish (Mexico)',
    lang: 'es-MX',
    localService: false,
    default: false,
    voiceURI: 'ms-jorge-natural',
  } as SpeechSynthesisVoice;

  const scoreRobotic = scoreVoiceQuality(roboticDesktop, 'es');
  const scoreGoogle = scoreVoiceQuality(googleChromeVoice, 'es');
  const scoreNaturalFemale = scoreVoiceQuality(edgeNaturalVoice, 'es');
  const scoreNaturalMale = scoreVoiceQuality(edgeMaleNatural, 'es');

  assert.ok(scoreGoogle > scoreRobotic);
  assert.ok(scoreNaturalFemale > scoreGoogle);
  assert.ok(scoreNaturalFemale > scoreNaturalMale);
});

test('shouldIgnoreRepeatTap blocks rapid duplicate taps on same button and allows different buttons or delayed taps', () => {
  assert.equal(shouldIgnoreRepeatTap(null, 'word:eat', 1000, 500), false);
  assert.equal(
    shouldIgnoreRepeatTap({ key: 'word:eat', timestamp: 1000 }, 'word:eat', 1300, 500),
    true
  );
  assert.equal(
    shouldIgnoreRepeatTap({ key: 'word:eat', timestamp: 1000 }, 'word:eat', 1550, 500),
    false
  );
  assert.equal(
    shouldIgnoreRepeatTap({ key: 'word:eat', timestamp: 1000 }, 'word:drink', 1100, 500),
    false
  );
  assert.equal(
    shouldIgnoreRepeatTap({ key: 'word:eat', timestamp: 1000 }, 'word:eat', 1050, 0),
    false
  );
});
