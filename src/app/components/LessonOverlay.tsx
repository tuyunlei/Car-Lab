
import React from 'react';
import { LessonDefinition } from '../../game/lessonTypes';
import { LessonRuntimeState } from '../../game/lessonRuntime';
import { useLanguage } from '../contexts/LanguageContext';

interface LessonOverlayProps {
    lesson: LessonDefinition;
    state: LessonRuntimeState;
    activeHint: string | null;
    onRetry: () => void;
    onExit: () => void;
}

const GradeBadge = ({ grade }: { grade: string }) => {
    let color = 'bg-slate-500';
    if (grade === 'S') color = 'bg-yellow-500 shadow-yellow-500/50 shadow-lg';
    else if (grade === 'A') color = 'bg-green-500';
    else if (grade === 'B') color = 'bg-blue-500';
    else if (grade === 'C') color = 'bg-orange-500';
    else if (grade === 'D') color = 'bg-red-500';

    return (
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-4xl font-black text-white border-4 border-white/20 ${color}`}>
            {grade}
        </div>
    );
};

export const LessonOverlay: React.FC<LessonOverlayProps> = ({ lesson, state, activeHint, onRetry, onExit }) => {
    const { t } = useLanguage();
    const { status, objectives, result, stats, failureReason } = state;

    const isSuccess = status === 'success';
    const isFailed = status === 'failed';
    const isEnded = isSuccess || isFailed;

    const failCode = failureReason?.code || 'generic';
    const failDescKey = `lesson.fail.${failCode}`;

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
            {/* Top Left: Objectives Panel */}
            <div className="pointer-events-auto w-80 self-start">
                 <div className={`
                    p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-500
                    ${isSuccess ? 'bg-green-900/95 border-green-500 translate-x-4 opacity-0 hidden' : // Hide objective panel on success to focus on result
                      isFailed ? 'bg-red-900/90 border-red-500' : 
                      'bg-slate-900/80 border-slate-700'}
                `}>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h6 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                {t('lesson.current_task')}
                            </h6>
                            <h3 className="text-lg font-bold text-white leading-tight">
                                {t(lesson.titleKey)}
                            </h3>
                        </div>
                        
                        <div className={`px-2 py-1 rounded text-xs font-bold uppercase
                            ${isFailed ? 'bg-red-500 text-white' : 'bg-blue-600 text-white animate-pulse'}
                        `}>
                            {isFailed ? t('lesson.status.failed') : t('lesson.status.running')}
                        </div>
                    </div>

                    <div className="space-y-2 mt-4">
                        {lesson.objectives.map(obj => {
                            const objState = objectives.get(obj.id);
                            const isCompleted = objState?.status === 'completed';
                            const isHolding = (objState?.currentHoldMs || 0) > 0 && !isCompleted;
                            
                            const progress = obj.mustHoldForMs 
                                ? Math.min(1.0, (objState?.currentHoldMs || 0) / obj.mustHoldForMs)
                                : 0;

                            return (
                                <div key={obj.id} className="relative">
                                    <div className={`flex items-center gap-3 p-2 rounded border transition-all
                                        ${isCompleted 
                                            ? 'bg-green-500/20 border-green-500/50' 
                                            : 'bg-slate-800/50 border-slate-700'}
                                    `}>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border
                                            ${isCompleted 
                                                ? 'bg-green-500 border-green-400 text-white' 
                                                : 'bg-slate-700 border-slate-600 text-slate-400'}
                                        `}>
                                            {isCompleted ? '✓' : (isHolding ? '⋯' : '○')}
                                        </div>

                                        <div className="flex-1">
                                            <span className={`text-sm font-medium ${isCompleted ? 'text-green-100' : 'text-slate-300'}`}>
                                                {t(obj.titleKey)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {isHolding && !isCompleted && (
                                        <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500 transition-all duration-75 ease-linear"
                                            style={{ width: `${progress * 100}%` }} 
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {isFailed && (
                        <div className="mt-4 p-3 bg-red-950/50 border border-red-800 rounded text-xs text-red-200">
                            <strong>{t('lesson.fail_reason')}:</strong><br/>
                            {failCode === 'score_too_low' 
                                ? `${t('lesson.fail.score_too_low')} (${failureReason?.meta?.score}/${failureReason?.meta?.passingScore})` 
                                : t(failDescKey)}
                        </div>
                    )}

                    {isFailed && (
                        <div className="mt-6 flex gap-2 animate-fade-in">
                            <button 
                                onClick={onRetry}
                                className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-xs font-bold text-white uppercase tracking-wider transition-colors"
                            >
                                {t('lesson.action.retry')}
                            </button>
                            <button 
                                onClick={onExit}
                                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs font-bold text-slate-300 uppercase tracking-wider transition-colors"
                            >
                                {t('lesson.action.menu')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom: Hint Bubble */}
            {activeHint && !isEnded && (
                <div className="self-center mb-32 animate-fade-in-up pointer-events-auto">
                    <div className="bg-blue-600/90 text-white px-6 py-3 rounded-full shadow-lg border border-blue-400/50 flex items-center gap-3 backdrop-blur-sm">
                        <span className="text-xl">💡</span>
                        <span className="font-bold text-sm">{t(activeHint)}</span>
                    </div>
                </div>
            )}

            {/* Center: Success/Result Modal */}
            {isSuccess && result && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
                        {/* Confetti / Glow effect background */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-yellow-500 to-green-500"></div>
                        
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                    {t('lesson.status.success')}
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">{t(lesson.titleKey)}</p>
                            </div>
                            <GradeBadge grade={result.grade} />
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                                <span className="text-slate-400 text-sm font-bold uppercase">{t('lesson.result.score')}</span>
                                <span className="text-4xl font-mono font-bold text-white">{result.score}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-slate-800/50 p-2 rounded">
                                    <span className="block text-slate-500 text-xs uppercase">{t('lesson.result.time')}</span>
                                    <span className="font-mono text-slate-200">{(result.elapsedMs / 1000).toFixed(1)}s</span>
                                </div>
                                <div className="bg-slate-800/50 p-2 rounded">
                                    <span className="block text-slate-500 text-xs uppercase">{t('lesson.result.stalls')}</span>
                                    <span className={`font-mono ${result.stallCount > 0 ? 'text-red-400' : 'text-slate-200'}`}>{result.stallCount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                             <button 
                                onClick={onRetry}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors border border-slate-600"
                            >
                                {t('lesson.action.retry')}
                            </button>
                            <button 
                                onClick={onExit}
                                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg shadow-green-900/20 transition-colors"
                            >
                                {t('lesson.action.next')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
