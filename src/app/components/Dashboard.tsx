
import React from 'react';
import { PhysicsState } from '../../physics/types';
import { CarConfig } from '../../config/types';
import { Gauge } from './dashboard/Gauge';
import { SteeringWheelDisplay } from './dashboard/SteeringWheelDisplay';
import { HandbrakeLever } from './dashboard/HandbrakeLever';
import { TelemetryBar } from './dashboard/TelemetryBar';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { DASHBOARD_CONSTANTS } from '../constants';

interface DashboardProps {
    state: PhysicsState;
    config: CarConfig;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, config }) => {
    const { t } = useLanguage();
    const { isDark } = useTheme();

    const maxRPM = Math.ceil(config.engine.maxRPM / DASHBOARD_CONSTANTS.RPM_GAUGE_ROUND_UNIT) * DASHBOARD_CONSTANTS.RPM_GAUGE_ROUND_UNIT;
    
    // RPM Zones configuration
    const rpmZones = [
        { min: 0, max: DASHBOARD_CONSTANTS.STALL_ZONE_MAX_RPM, color: '#ef4444', opacity: 0.3, width: 4 }, // Stall danger
        { min: config.engine.idleRPM - 100, max: config.engine.idleRPM + 100, color: '#22c55e', opacity: 0.3, width: 4 }, // Idle target
        { min: config.engine.redlineRPM, max: maxRPM, color: '#ef4444', opacity: 0.8, width: 8 } // Redline
    ];

    const isStalled = state.stalled;
    const isEngineOn = state.engineOn;

    return (
        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-center gap-8 pointer-events-none select-none bg-gradient-to-t from-slate-50/90 to-transparent dark:from-slate-900/90 transition-colors duration-300">
            
            {/* Left Block: Pedal Inputs */}
            <div className="flex gap-4 items-end pb-2">
                <TelemetryBar value={state.clutchPosition} color="bg-blue-500" label={t('dash.clutch')} isDark={isDark} />
                <TelemetryBar value={state.brakeInput} color="bg-red-500" label={t('dash.brake')} isDark={isDark} />
                <TelemetryBar value={state.throttleInput} color="bg-green-500" label={t('dash.throttle')} isDark={isDark} />
            </div>

            {/* Center Block: Main Gauges */}
            <div className="flex gap-2 items-end relative">
                {/* Status Indicators */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-4">
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full border transition-colors ${isEngineOn ? 'bg-green-500/20 border-green-500 text-green-600 dark:text-green-400' : 'bg-slate-500/20 border-slate-500 text-slate-500'}`}>
                        <div className={`w-2 h-2 rounded-full ${isEngineOn ? 'bg-green-500 shadow-[0_0_5px_currentColor]' : 'bg-slate-500'}`} />
                        <span className="text-[10px] font-bold uppercase">{t('dash.engine_status')}</span>
                    </div>
                    
                    {isStalled && (
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50">
                            <span className="text-xs font-bold uppercase">⚠️ {t('dash.stall_warning')}</span>
                        </div>
                    )}
                </div>

                {/* RPM Gauge */}
                <Gauge 
                    value={state.rpm} 
                    valueAccessor={(s) => s.rpm}
                    max={maxRPM} 
                    label={t('dash.rpm')} 
                    unit="r/min" 
                    zones={rpmZones}
                    majorTicksCount={maxRPM / 1000}
                    labelDivider={1000}
                    isDark={isDark}
                />
                
                {/* Digital Gear Display */}
                <div className="flex flex-col items-center justify-end pb-8">
                    <div className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center mb-2 shadow-inner bg-slate-100 dark:bg-slate-800 transition-colors ${state.gear === 0 ? 'border-green-500/50' : 'border-slate-300 dark:border-slate-600'}`}>
                        <span className={`text-3xl font-black font-mono ${state.gear === 0 ? 'text-green-600 dark:text-green-400' : (state.gear < 0 ? 'text-red-500' : 'text-slate-800 dark:text-white')}`}>
                            {state.gear === 0 ? 'N' : (state.gear === -1 ? 'R' : state.gear)}
                        </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">{t('dash.gear')}</span>
                </div>

                {/* Speedometer */}
                <Gauge 
                    value={state.speedKmh} 
                    valueAccessor={(s) => s.speedKmh}
                    max={200} 
                    label={t('dash.speed')} 
                    unit="km/h" 
                    majorTicksCount={10}
                    minorTicksPerMajor={1}
                    isDark={isDark}
                />
            </div>

            {/* Right Block: Steering & Handbrake */}
            <div className="flex gap-6 items-end pb-2">
                <SteeringWheelDisplay angle={state.steeringWheelAngle} isDark={isDark} />
                <HandbrakeLever value={state.handbrakeInput} isDark={isDark} />
            </div>
        </div>
    );
};
