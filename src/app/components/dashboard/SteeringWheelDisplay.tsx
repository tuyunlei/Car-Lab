
import React, { useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { PhysicsState } from '../../../physics/types';
import { lerp } from '../../../utils/math';

interface SteeringWheelDisplayProps {
    angle: number; // Fallback / Initial value
    latestStateRef?: React.MutableRefObject<PhysicsState>; // High frequency source
    isDark?: boolean;
}

export const SteeringWheelDisplay: React.FC<SteeringWheelDisplayProps> = ({ angle, latestStateRef, isDark }) => {
    const { t } = useLanguage();
    
    // Direct DOM access for rotation
    const wheelRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);

    // Keep track of current visual angle for lerping inside RAF
    const currentAngleRef = useRef(angle);

    useEffect(() => {
        if (!latestStateRef || !wheelRef.current) return;

        let rafId: number;

        const loop = () => {
            const target = latestStateRef.current.steeringWheelAngle;
            // Smoothly interpolate (Visual Smoothing)
            // Using 0.3 factor gives a snappy but smooth feel at 60fps
            currentAngleRef.current = lerp(currentAngleRef.current, target, 0.3);
            
            // 1. Rotate Wheel
            if (wheelRef.current) {
                wheelRef.current.style.transform = `rotate(${currentAngleRef.current}deg)`;
            }

            // 2. Update Text (Optional, prevents text jitter if updated too fast, but RAF is fine)
            if (textRef.current) {
                const rounded = Math.round(currentAngleRef.current);
                textRef.current.textContent = `${rounded}°`;
                
                // Update color based on angle severity (Dynamic Logic in RAF)
                if (Math.abs(rounded) > 360) {
                    textRef.current.className = 'text-[9px] font-mono text-red-400';
                } else {
                    textRef.current.className = `text-[9px] font-mono ${isDark ? 'text-slate-600' : 'text-slate-500'}`;
                }
            }

            rafId = requestAnimationFrame(loop);
        };

        rafId = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(rafId);
    }, [latestStateRef, isDark]);

    // If no ref provided (e.g. legacy/testing), fallback to React prop
    const style = latestStateRef ? {} : { transform: `rotate(${angle}deg)` };

    return (
        <div className="flex flex-col items-center gap-1">
             <div className={`w-32 h-32 rounded-full border-4 relative flex items-center justify-center shadow-inner overflow-hidden ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-slate-200'}`}>
                <div 
                    ref={wheelRef}
                    className="w-full h-full relative will-change-transform" // Hint to browser for GPU layer
                    style={style}
                >
                    <div className={`absolute inset-0 rounded-full border-2 opacity-50 ${isDark ? 'border-slate-600' : 'border-slate-400'}`}></div>
                    <div className={`absolute top-1/2 left-0 w-full h-2 -mt-1 ${isDark ? 'bg-slate-900' : 'bg-slate-400'}`}></div> 
                    <div className={`absolute top-1/2 left-1/2 w-2 h-1/2 -ml-1 ${isDark ? 'bg-slate-900' : 'bg-slate-400'}`}></div> 
                    <div className="absolute top-0 left-1/2 w-1 h-4 bg-red-500 -ml-0.5 z-10"></div>
                </div>

                <div className={`absolute w-8 h-8 rounded-full border z-20 flex items-center justify-center ${isDark ? 'bg-slate-900 border-slate-600' : 'bg-slate-100 border-slate-400'}`}>
                     <div className={`w-6 h-6 rounded-full border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-slate-300'}`}></div>
                </div>
             </div>
             <div className="flex flex-col items-center -mt-1">
                 <span className="text-[10px] font-mono text-slate-500 font-bold">{t('dash.steer')}</span>
                 <span ref={textRef} className={`text-[9px] font-mono ${Math.abs(angle) > 360 ? 'text-red-400' : (isDark ? 'text-slate-600' : 'text-slate-500')}`}>
                     {Math.round(angle)}°
                 </span>
             </div>
        </div>
    );
};
