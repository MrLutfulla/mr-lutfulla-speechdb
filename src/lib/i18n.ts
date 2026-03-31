export type AppLang = 'uz' | 'ru' | 'en';

export const APP_LANG_KEY = 'mrl_speech_lang';

export const LANG_OPTIONS: Array<{ value: AppLang; label: string }> = [
  { value: 'uz', label: "O'zbek" },
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

export const copy = {
  uz: {
    home: 'Home',
    recordings: 'Recordings',
    dashboard: 'Dashboard',
    help: 'Yordam',
    text: 'Matn',
    emotion: 'Emotsiya',
    chooseSentence: 'Gapdan boshlashni tanlang',
    progress: 'Progress',
    emotionsPerSentence: 'Har bir gap uchun emotsiya',
    metadataTitle: "Label Ma'lumotlari",
    regionLevel1: 'Hudud (Level 1)',
    regionLevel2: 'Shahar/Tuman (Level 2, ixtiyoriy)',
  },
  ru: {
    home: 'Главная',
    recordings: 'Записи',
    dashboard: 'Панель',
    help: 'Помощь',
    text: 'Текст',
    emotion: 'Эмоция',
    chooseSentence: 'Выберите, с какого текста начать',
    progress: 'Прогресс',
    emotionsPerSentence: 'Эмоций на один текст',
    metadataTitle: 'Метки записи',
    regionLevel1: 'Регион (Level 1)',
    regionLevel2: 'Город/район (Level 2, опционально)',
  },
  en: {
    home: 'Home',
    recordings: 'Recordings',
    dashboard: 'Dashboard',
    help: 'Help',
    text: 'Text',
    emotion: 'Emotion',
    chooseSentence: 'Choose sentence to start from',
    progress: 'Progress',
    emotionsPerSentence: 'Emotions per sentence',
    metadataTitle: 'Label Metadata',
    regionLevel1: 'Region (Level 1)',
    regionLevel2: 'City/District (Level 2, optional)',
  },
} as const;
