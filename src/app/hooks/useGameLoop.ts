
import { useRef, useEffect, useCallback } from 'react';
import { PhysicsState, InputState } from '../../physics/types';
import { CarConfig } from '../../config/types';
import { LevelData } from '../../game/types';
import { GameLoop } from '../../game/GameLoop';
import { createInitialState } from '../../physics/factory';
import { TriggerState } from '../../game/systems/InputSystem';

export interface GameLoopCallbacks {
    onTick: (state: PhysicsState) => void;
    onMessage: (msgKey: string) => void;
}

export interface UseGameLoopOptions {
    level: LevelData;
    carConfig: CarConfig;
    getInputs: () => InputState;
    getTriggers: () => TriggerState;
    callbacks: GameLoopCallbacks;
}

export interface UseGameLoopResult {
    gameLoopRef: React.MutableRefObject<GameLoop | null>;
    initialState: PhysicsState;
    reset: (state: PhysicsState) => void;
}

export function useGameLoop(options: UseGameLoopOptions): UseGameLoopResult {
    const { level, carConfig, getInputs, getTriggers, callbacks } = options;

    const gameLoopRef = useRef<GameLoop | null>(null);
    const initialState = createInitialState(level.startPos, level.startHeading);

    useEffect(() => {
        const loop = new GameLoop(initialState, {
            getLevel: () => level,
            getConfig: () => carConfig,
            getInputs,
            getTriggers,
            callbacks: {
                onTick: callbacks.onTick,
                onMessage: callbacks.onMessage
            }
        });

        gameLoopRef.current = loop;
        loop.start();

        return () => {
            loop.stop();
        };
    }, [level, carConfig, getInputs, getTriggers, callbacks.onTick, callbacks.onMessage]);

    const reset = useCallback((state: PhysicsState) => {
        gameLoopRef.current?.reset(state);
    }, []);

    return { gameLoopRef, initialState, reset };
}
