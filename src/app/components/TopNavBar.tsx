
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { AppGameMode, GameMode, LevelData } from '../../game/types';
import { LessonDefinition } from '../../game/lessonTypes';

interface TopNavBarProps {
    gameMode: AppGameMode;
    activeLesson: LessonDefinition | undefined;
    currentLevel: LevelData;
    onMenuOpen: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
    gameMode,
    activeLesson,
    currentLevel,
    onMenuOpen
}) => {
    const { t, language, setLanguage } = useLanguage();
    const { theme, setTheme } = useTheme();

    const toggleLanguage = () => {
        setLanguage(language === 'zh-CN' ? 'en-US' : 'zh-CN');
    };

    const cycleTheme = () => {
        if (theme === 'auto') setTheme('light');
        else if (theme === 'light') setTheme('dark');
        else setTheme('auto');
    };

    const getThemeIcon = () => {
        if (theme === 'auto') return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
        if (theme === 'light') return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
        return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
    };

    const getDisplayTitle = () => {
        if (gameMode === GameMode.SANDBOX) return t('app.mode.sandbox');
        if (gameMode === 'LESSON') return activeLesson ? t(activeLesson.titleKey) : 'Lesson';
        return t(currentLevel.name);
    };

    return (
        <div className="absolute top-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 z-20 shadow-sm dark:shadow-none transition-colors duration-300">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                     <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                     <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t('app.title')}</h1>
                </div>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                    {getDisplayTitle()}
                </div>
            </div>

            <div className="flex gap-4">
                <button 
                    onClick={cycleTheme}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300 transition-all"
                    title={`Theme: ${theme}`}
                >
                    {getThemeIcon()}
                </button>

                <button 
                    onClick={toggleLanguage}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold font-mono text-slate-600 dark:text-slate-300 transition-all"
                >
                    {language === 'zh-CN' ? 'EN' : '中文'}
                </button>

                <button 
                    onClick={onMenuOpen}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    {t('menu.switch')}
                </button>
            </div>
        </div>
    );
};
