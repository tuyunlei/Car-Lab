
import React, { useRef, useState, useCallback } from 'react';
import { CarConfig } from '../../config/types';
import { LevelData, GameCanvasMode } from '../../game/types';
import { LessonDefinition } from '../../game/lessonTypes';
import { renderService } from '../renderService';
import { Dashboard } from './Dashboard';
import { useInputControl } from '../hooks/useInputControl';
import { useGameLoop } from '../hooks/useGameLoop';
import { useLessonRuntime } from '../hooks/useLessonRuntime';
import { useCanvasResize } from '../hooks/useCanvasResize';
import { useFpsCounter } from '../hooks/useFpsCounter';
import { useThrottledDashboard } from '../hooks/useThrottledDashboard';
import { GameLoopProvider, useGameLoopSetter } from '../contexts/GameLoopContext';
import { getSafetyInputs } from '../../game/systems/InputSystem';
import { LessonOverlay } from './LessonOverlay';
import { GameInfoPanel } from './GameInfoPanel';
import { useLanguage } from '../contexts/LanguageContext';
import { TIMING_CONSTANTS } from '../constants';

interface GameCanvasProps {
    level: LevelData;
    mode: GameCanvasMode;
    carConfig: CarConfig;
    activeLesson?: LessonDefinition;
    onExit?: () => void;
    onLessonFinish?: (lessonId: string, result: 'success' | 'failed') => void;
}

const GameCanvasContent: React.FC<GameCanvasProps> = (props) => {
    const { level, mode, carConfig, activeLesson, onExit, onLessonFinish } = props;
    const { t } = useLanguage();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const setGameStateRef = useGameLoopSetter();
    const { inputsRef, consumeTriggers } = useInputControl();
    const [message, setMessage] = useState<string>('');

    // Custom Hooks
    useCanvasResize(canvasRef);
    const { fpsRef, updateFps } = useFpsCounter();
    const { dashboardState, updateDashboard } = useThrottledDashboard(level);

    // Track lesson status for input filtering
    const lessonStatusRef = useRef<string>('idle'); 

    const getInputs = useCallback(() => {
        if (activeLesson && (lessonStatusRef.current === 'success' || lessonStatusRef.current === 'failed')) {
            return getSafetyInputs();
        }
        return inputsRef.current;
    }, [activeLesson, inputsRef]);

    const consumeTriggersSafe = useCallback(() => {
        if (activeLesson && (lessonStatusRef.current === 'success' || lessonStatusRef.current === 'failed')) {
            consumeTriggers(); // Consume to clear but return empty
            return { 
                toggleEngine: false, shiftUp: false, shiftDown: false, reset: false, toggleHandbrake: false,
                setVirtualThrottleFull: false, setVirtualThrottleZero: false,
                setVirtualBrakeFull: false, setVirtualBrakeZero: false,
                setVirtualClutchFull: false, setVirtualClutchZero: false,
                setVirtualSteeringLeftFull: false, setVirtualSteeringRightFull: false
            };
        }
        return consumeTriggers();
    }, [activeLesson, consumeTriggers]);

    const showMessage = useCallback((msgKey: string) => {
        setMessage(t(msgKey));
        setTimeout(() => setMessage(''), TIMING_CONSTANTS.MESSAGE_DISPLAY_DURATION);
    }, [t]);

    const { gameLoopRef, initialState } = useGameLoop({
        level,
        carConfig,
        getInputs,
        getTriggers: consumeTriggersSafe,
        callbacks: {
            onTick: (newState) => {
                setGameStateRef(newState);
                renderService.render(newState, carConfig, level.objects);
                updateFps();
                updateDashboard(newState, gameLoopRef.current);
            },
            onMessage: showMessage
        }
    });

    const { lessonState, lessonStatus, activeHint, retry } = useLessonRuntime({
        activeLesson,
        gameLoopRef,
        startPos: level.startPos,
        startHeading: level.startHeading,
        onLessonFinish
    });

    // Update the ref for input system
    lessonStatusRef.current = lessonStatus;

    return (
        <div className="relative w-full h-full bg-slate-50 dark:bg-[#0f172a] overflow-hidden cursor-crosshair">
            <canvas ref={canvasRef} className="block touch-none" />

            <GameInfoPanel
                level={level}
                activeLesson={activeLesson}
                dashboardState={dashboardState}
                fpsRef={fpsRef}
                message={message}
            />

            {activeLesson && lessonState && (
                <LessonOverlay
                    lesson={activeLesson}
                    state={lessonState}
                    activeHint={activeHint}
                    onRetry={retry}
                    onExit={() => onExit && onExit()}
                />
            )}

            <Dashboard state={dashboardState} config={carConfig} />
        </div>
    );
};

export const GameCanvas: React.FC<GameCanvasProps> = (props) => (
    <GameLoopProvider>
        <GameCanvasContent {...props} />
    </GameLoopProvider>
);
