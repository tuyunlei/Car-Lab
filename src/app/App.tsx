
import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { SandboxControls } from './components/SandboxControls';
import { UnitTests } from './components/UnitTests';
import { ControlsSettings } from './components/ControlsSettings';
import { LevelData, GameMode, AppGameMode } from '../game/types';
import { CarConfig } from '../config/types';
import { LEVELS } from '../config/levels';
import { DEFAULT_CAR_CONFIG } from '../config/cars';
import { useLanguage } from './contexts/LanguageContext';
import { useTheme } from './contexts/ThemeContext';
import { ControlsProvider } from './contexts/ControlsContext';
import { ALL_COURSES } from '../config/courses'; 
import { LessonDefinition, CourseCategory } from '../game/lessonTypes';
import { loadProgress, saveProgress, updateProgress, GameProgress, LessonStatus } from '../game/progress';

const AppContent: React.FC = () => {
  const [currentLevel, setCurrentLevel] = useState<LevelData>(LEVELS[0]);
  const [gameMode, setGameMode] = useState<AppGameMode>(GameMode.LEVELS);
  const [carConfig, setCarConfig] = useState<CarConfig>(DEFAULT_CAR_CONFIG);
  const [activeLesson, setActiveLesson] = useState<LessonDefinition | undefined>(undefined);
  
  // Default to MENU open so we don't drop user into the first level immediately
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [showTests, setShowTests] = useState(false);
  const [showControls, setShowControls] = useState(false);
  
  // Progress State
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress());

  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  const enterSandbox = () => {
      setGameMode(GameMode.SANDBOX);
      setActiveLesson(undefined);
      setIsMenuOpen(false);
  };

  const startLesson = (lesson: LessonDefinition) => {
      const status = progress[lesson.id]?.status || 'LOCKED';
      if (status === 'LOCKED') return; // Prevent locked levels

      const targetLevel = LEVELS.find(l => l.id === lesson.levelId);
      if (targetLevel) {
          setCurrentLevel(targetLevel);
          setActiveLesson(lesson);
          setGameMode('LESSON');
          setIsMenuOpen(false);
      } else {
          console.error(`Level ${lesson.levelId} not found for lesson ${lesson.id}`);
      }
  };

  const handleLessonFinish = (lessonId: string, result: 'success' | 'failed') => {
      if (result === 'success') {
          const newProgress = updateProgress(progress, lessonId, result);
          setProgress(newProgress);
          saveProgress(newProgress);
      }
  };

  const exitLesson = () => {
      setActiveLesson(undefined);
      setGameMode(GameMode.LEVELS);
      setIsMenuOpen(true);
  };

  const openTests = () => {
      setShowTests(true);
      setIsMenuOpen(false);
  };

  const openControls = () => {
      setShowControls(true);
      setIsMenuOpen(false);
  };

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

  const getLessonStatusIcon = (status: LessonStatus) => {
      if (status === 'LOCKED') return <span className="text-slate-400">🔒</span>;
      if (status === 'COMPLETED') return <span className="text-green-500 font-bold">✓</span>;
      return null; 
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 relative transition-colors duration-300">
        {/* Top Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 z-20 shadow-sm dark:shadow-none transition-colors duration-300">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                     <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                     <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t('app.title')}</h1>
                </div>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                    {gameMode === GameMode.SANDBOX ? t('app.mode.sandbox') : 
                     gameMode === 'LESSON' ? (activeLesson ? t(activeLesson.titleKey) : 'Lesson') :
                     t(currentLevel.name)}
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
                    onClick={() => setIsMenuOpen(true)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    {t('menu.switch')}
                </button>
            </div>
        </div>

        {/* Level Selection Modal */}
        {isMenuOpen && (
            <div className="fixed inset-0 z-50 bg-slate-200/50 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-8">
                <div className="max-w-5xl w-full bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-end mb-8 border-b border-slate-200 dark:border-slate-700 pb-4">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('menu.title')}</h2>
                            <p className="text-slate-500 dark:text-slate-400">{t('menu.desc')}</p>
                        </div>
                        <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                            {t('menu.close')}
                        </button>
                    </div>

                    {/* Dynamic Course Sections */}
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
                                        
                                        // Dynamic Styling for Exam Cards
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
                                                onClick={() => startLesson(lesson)}
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
                        {/* Sandbox Card */}
                        <button 
                             onClick={enterSandbox}
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
                        {/* Controls Settings Card */}
                         <button 
                             onClick={openControls}
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

                        {/* Unit Tests Card */}
                        <button 
                             onClick={openTests}
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
        )}

        {/* Unit Tests Overlay */}
        {showTests && <UnitTests onClose={() => setShowTests(false)} />}
        
        {/* Controls Settings Overlay */}
        {showControls && <ControlsSettings onClose={() => setShowControls(false)} />}

        {/* Main Canvas Area */}
        <div className="w-full h-full pt-16 relative">
            <GameCanvas 
                key={`${currentLevel.id}-${gameMode}-${language}`} 
                level={currentLevel} 
                mode={gameMode}
                carConfig={carConfig}
                activeLesson={activeLesson}
                onExit={exitLesson}
                onLessonFinish={handleLessonFinish}
            />

            {/* Sandbox Overlay */}
            {gameMode === GameMode.SANDBOX && (
                <SandboxControls config={carConfig} onUpdate={setCarConfig} />
            )}
        </div>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <ControlsProvider>
            <AppContent />
        </ControlsProvider>
    );
}

export default App;
