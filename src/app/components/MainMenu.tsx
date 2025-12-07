
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { GameProgress, LessonUnlockStatus } from '../../game/progress';
import { LessonDefinition, CourseCategory } from '../../game/lessonTypes';
import { ALL_COURSES } from '../../config/courses';
import { AppGameMode, GameMode } from '../../game/types';

interface MainMenuProps {
    gameMode: AppGameMode;
    activeLesson: LessonDefinition | undefined;
    progress: GameProgress;
    onClose: () => void;
    onEnterSandbox: () => void;
    onStartLesson: (lesson: LessonDefinition) => void;
    onOpenControls: () => void;
    onOpenTests: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
    gameMode,
    activeLesson,
    progress,
    onClose,
    onEnterSandbox,
    onStartLesson,
    onOpenControls,
    onOpenTests
}) => {
    const { t } = useLanguage();

    const getLessonStatusIcon = (status: LessonUnlockStatus) => {
        if (status === 'LOCKED') return <span className="text-slate-400">🔒</span>;
        if (status === 'COMPLETED') return <span className="text-green-500 font-bold">✓</span>;
        return null;
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-200/50 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-8">
            <div className="max-w-5xl w-full bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-end mb-8 border-b border-slate-200 dark:border-slate-700 pb-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('menu.title')}</h2>
                        <p className="text-slate-500 dark:text-slate-400">{t('menu.desc')}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        {t('menu.close')}
                    </button>
                </div>

                {ALL_COURSES.map(course => {
                    const isExamCategory = course.category === CourseCategory.SUBJECT_2_EXAM;
                    const headerColor = isExamCategory ? 'text-red-500 dark:text-red-400' : 'text-blue-500 dark:text-blue-400';
                    const dotColor = isExamCategory ? 'bg-red-500' : 'bg-blue-500';

                    return (
                        <div key={course.id} className="mb-10 animate-fade-in">
                            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${headerColor}`}>
                                <span className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`}></span>
                                {t(course.titleKey)}
                                <span className="text-slate-400 font-normal normal-case ml-2">- {t(course.descriptionKey)}</span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {course.lessons.map((lesson) => {
                                    const status = progress[lesson.id]?.status || 'LOCKED';
                                    const isLocked = status === 'LOCKED';
                                    
                                    const cardBaseClass = isExamCategory 
                                        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700'
                                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700';

                                    const cardLockedClass = 'opacity-50 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed grayscale';
                                    
                                    const ringClass = isExamCategory ? 'ring-red-500' : 'ring-blue-500';
                                    const titleClass = isLocked ? 'text-slate-500' : (isExamCategory ? 'text-slate-800 dark:text-red-100' : 'text-slate-800 dark:text-blue-100');
                                    const descClass = isLocked ? 'text-slate-400' : (isExamCategory ? 'text-slate-600 dark:text-red-200/70' : 'text-slate-600 dark:text-blue-200/70');
                                    const tagClass = isExamCategory ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' : 'bg-white/50 dark:bg-black/20 text-blue-700 dark:text-blue-300';

                                    return (
                                        <button 
                                            key={lesson.id}
                                            onClick={() => onStartLesson(lesson)}
                                            disabled={isLocked}
                                            className={`
                                                text-left p-5 rounded-xl border transition-all group relative overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md
                                                ${isLocked ? cardLockedClass : cardBaseClass}
                                                ${activeLesson?.id === lesson.id && gameMode === 'LESSON' ? `ring-2 ${ringClass}` : ''}
                                            `}
                                        >
                                            <div className="flex-1 mb-2">
                                                <div className="flex justify-between items-start mb-1">
                                                        <h3 className={`text-base font-bold z-10 relative ${titleClass}`}>
                                                        {t(lesson.titleKey)}
                                                    </h3>
                                                    <div className="z-10 relative">
                                                        {getLessonStatusIcon(status)}
                                                    </div>
                                                </div>
                                                
                                                <p className={`text-xs z-10 relative mt-1 line-clamp-3 ${descClass}`}>
                                                    {isLocked ? t('menu.locked') : t(lesson.descriptionKey)}
                                                </p>
                                            </div>
                                            {!isLocked && (
                                                <div className={`mt-auto pt-2 border-t flex gap-1 flex-wrap ${isExamCategory ? 'border-red-200 dark:border-red-800/30' : 'border-blue-200 dark:border-blue-800/30'}`}>
                                                    {lesson.skills.slice(0, 3).map(skill => (
                                                        <span key={skill} className={`px-1.5 py-0.5 rounded text-[10px] font-bold opacity-70 ${tagClass}`}>
                                                            {skill.replace('_', ' ')}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 border-t border-slate-200 dark:border-slate-800 pt-8">{t('menu.free_practice')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <button 
                            onClick={onEnterSandbox}
                            className={`group text-left p-6 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                            gameMode === GameMode.SANDBOX
                            ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/30' 
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-750 hover:border-indigo-400 dark:hover:border-slate-500 hover:shadow-md'
                        }`}
                    >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>
                            </div>
                        <h3 className={`text-lg font-bold mb-2 ${gameMode === GameMode.SANDBOX ? 'text-white' : 'text-slate-800 dark:text-indigo-100'}`}>{t('mode.sandbox.name')}</h3>
                        <p className={`text-sm ${gameMode === GameMode.SANDBOX ? 'text-indigo-100' : 'text-slate-500 dark:text-indigo-200'}`}>
                            {t('mode.sandbox.desc')}
                        </p>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button 
                            onClick={onOpenControls}
                            className="group text-left p-6 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-750 hover:border-orange-400 dark:hover:border-slate-500 hover:shadow-md transition-all duration-200 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                        </div>
                        <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-orange-100 flex items-center gap-2">
                            {t('controls.title')}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {t('controls.desc')}
                        </p>
                    </button>

                    <button 
                            onClick={onOpenTests}
                            className="group text-left p-6 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-750 hover:border-green-400 dark:hover:border-slate-500 hover:shadow-md transition-all duration-200 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-green-100 flex items-center gap-2">
                            {t('mode.tests.name')}
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-xs rounded border border-green-200 dark:border-green-700">UNIT TESTS</span>
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {t('mode.tests.desc')}
                        </p>
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-sm text-slate-500">
                    <div>
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">{t('help.basic')}</h4>
                        <div className="grid grid-cols-2 gap-2 font-mono">
                            <span>{t('key.throttle')}</span>
                            <span>{t('key.brake')}</span>
                            <span>{t('key.steer')}</span>
                            <span>{t('key.clutch')}</span>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">{t('help.advanced')}</h4>
                        <div className="grid grid-cols-2 gap-2 font-mono">
                            <span>{t('key.shift')}</span>
                            <span>{t('key.start_engine')}</span>
                            <span>{t('key.reset')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
