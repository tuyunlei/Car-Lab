
import { useRef } from 'react';
import { TIMING_CONSTANTS } from '../constants';

export function useFpsCounter() {
    const fpsRef = useRef<HTMLDivElement>(null);
    const stats = useRef({ frames: 0, lastTime: performance.now() });

    const updateFps = () => {
        const now = performance.now();
        stats.current.frames++;
        if (now - stats.current.lastTime >= TIMING_CONSTANTS.FPS_CALC_INTERVAL) {
            const fps = Math.round((stats.current.frames * 1000) / (now - stats.current.lastTime));
            if (fpsRef.current) {
                fpsRef.current.textContent = `FPS: ${fps}`;
            }
            stats.current.frames = 0;
            stats.current.lastTime = now;
        }
    };

    return { fpsRef, updateFps };
}
