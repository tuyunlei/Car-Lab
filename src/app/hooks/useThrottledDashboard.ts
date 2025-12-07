
import { useState, useRef, useCallback } from 'react';
import { PhysicsState } from '../../physics/types';
import { LevelData } from '../../game/types';
import { createInitialState } from '../../physics/factory';
import { TIMING_CONSTANTS } from '../constants';
import { GameLoop } from '../../game/GameLoop';

export function useThrottledDashboard(level: LevelData) {
    const [dashboardState, setDashboardState] = useState<PhysicsState>(() => createInitialState(level.startPos, level.startHeading));
    const lastUiUpdateRef = useRef<number>(0);

    const updateDashboard = useCallback((newState: PhysicsState, gameLoop: GameLoop | null) => {
        const now = performance.now();
        if (now - lastUiUpdateRef.current >= TIMING_CONSTANTS.UI_UPDATE_INTERVAL) {
            setDashboardState({ ...newState });
            lastUiUpdateRef.current = now;
        }
    }, []);

    return { dashboardState, updateDashboard };
}
