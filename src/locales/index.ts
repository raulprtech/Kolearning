import en from './en.json';
import es from './es.json';

export const translations = {
    en,
    es,
};

export type Language = keyof typeof translations;
export type TranslationDict = typeof es;

export const languages: { code: Language; name: string }[] = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
];
