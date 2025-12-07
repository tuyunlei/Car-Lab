
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { PhysicsState } from '../../physics/types';
import { LevelData } from '../../game/types';
import { LessonDefinition } from '../../game/lessonTypes';
import { InstructionText } from './InstructionText';

interface GameInfoPanelProps {
    level: LevelData;
    activeLesson?: LessonDefinition;
    dashboardState: PhysicsState;
    fpsRef: React.RefObject<HTMLDivElement>;
    message?: string;
}

export const GameInfoPanel: React.FC<GameInfoPanelProps> = ({
    level,
    activeLesson,
    dashboardState,
    fpsRef,
    message
}) => {
    const { t } = useLanguage();

    return (
        <>
            <div className="absolute top-0 left-0 p-4 pointer-events-none w-full max-w-lg z-0">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 drop-shadow-md">{t(level.name)}</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm drop-shadow-sm">{t(level.description)}</p>
                
                {!activeLesson && (
                    <div className="mt-4 bg-white/90 dark:bg-slate-800/90 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-sm pointer-events-auto">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            <InstructionText textKey={level.instructions} />
                        </div>
                    </div>
                )}

                {message && (
                    <div className="mt-4 p-3 bg-blue-600/90 text-white font-bold rounded animate-bounce shadow-lg inline-block">
                        {message}
                    </div>
                )}
            </div>

            <div className="absolute top-4 right-4 text-right pointer-events-none opacity-50 z-0">
                <div ref={fpsRef} className="font-mono text-sm font-bold text-green-600 dark:text-green-400 mb-1">FPS: --</div>
                <div className="text-xs text-slate-500">{t('hud.physics')}</div>
                <div className="font-mono text-xs text-slate-600 dark:text-slate-400">
                    POS: {dashboardState.position.x.toFixed(2)}m, {dashboardState.position.y.toFixed(2)}m <br/>
                    RPM: {Math.round(dashboardState.rpm)} <br/>
                    SPEED: {dashboardState.speedKmh.toFixed(1)} km/h <br/>
                    {t('hud.state')}: {dashboardState.stoppingState} <br/>
                    {level.environment?.slope ? `${(level.environment.slope * 100).toFixed(0)}% ${t('hud.slope')}` : t('hud.flat')}
                </div>
            </div>
        </>
    );
};
