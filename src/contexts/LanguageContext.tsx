"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, languages } from '@/locales';

type TranslationKeys = string;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKeys, params?: Record<string, string | number>) => string;
    availableLanguages: typeof languages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>('es');

    useEffect(() => {
        const savedLanguage = localStorage.getItem('kolearning_language') as Language;
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
            setLanguageState(savedLanguage);
        } else {
            // Try to detect browser language
            const browserLang = navigator.language.split('-')[0];
            if (browserLang === 'en' || browserLang === 'es') {
                setLanguageState(browserLang as Language);
            }
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('kolearning_language', lang);
        document.documentElement.lang = lang;
    };

    const t = (keyPath: string, params?: Record<string, string | number>): string => {
        const keys = keyPath.split('.');
        let translation: any = translations[language];

        for (const key of keys) {
            if (translation && translation[key]) {
                translation = translation[key];
            } else {
                console.warn(`Translation key not found: ${keyPath} for language: ${language}`);
                return keyPath;
            }
        }

        if (typeof translation !== 'string') {
            console.warn(`Translation key is not a string: ${keyPath}`);
            return keyPath;
        }

        let result = translation;
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                result = result.replace(`{{${key}}}`, String(value));
            });
        }

        return result;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, availableLanguages: languages }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
