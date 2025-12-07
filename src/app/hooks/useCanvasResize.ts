
import { useEffect, RefObject } from 'react';
import { renderService } from '../renderService';

export function useCanvasResize(canvasRef: RefObject<HTMLCanvasElement>) {
    useEffect(() => {
        const handleResize = () => {
            if (!canvasRef.current) return;

            const canvas = canvasRef.current;
            const dpr = window.devicePixelRatio || 1;
            const logicalWidth = window.innerWidth;
            const logicalHeight = window.innerHeight;

            canvas.width = logicalWidth * dpr;
            canvas.height = logicalHeight * dpr;
            canvas.style.width = `${logicalWidth}px`;
            canvas.style.height = `${logicalHeight}px`;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.scale(dpr, dpr);
                renderService.setContext(ctx, logicalWidth, logicalHeight);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, [canvasRef]);
}
