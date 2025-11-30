
import { ScenarioContext } from './context';

export interface LaunchOptions {
    targetThrottle: number;
    clutchReleaseFrames: number;
    holdFrames?: number;
}

/**
 * Simulates a standardized manual transmission launch sequence:
 * 1. Assumes 1st gear is already selected.
 * 2. Linearly releases clutch from 1.0 to 0.0 over `clutchReleaseFrames`.
 * 3. Holds the `targetThrottle` constantly during release.
 * 4. Optionally holds the final state for `holdFrames`.
 */
export const simulateLaunchSequence = (
    ctx: ScenarioContext, 
    options: LaunchOptions
) => {
    const { targetThrottle, clutchReleaseFrames, holdFrames = 0 } = options;

    // Phase 1: Clutch Release
    for (let i = 0; i < clutchReleaseFrames; i++) {
        const progress = i / clutchReleaseFrames;
        // Linear release: 1.0 (Pressed) -> 0.0 (Engaged)
        const clutchInput = 1.0 - progress;
        
        ctx.simulate(1, { 
            throttleAnalog: targetThrottle, 
            clutchAnalog: clutchInput 
        });
    }

    // Phase 2: Fully Engaged Hold
    if (holdFrames > 0) {
        ctx.simulate(holdFrames, { 
            throttleAnalog: targetThrottle, 
            clutchAnalog: 0.0 
        });
    }
};
