
import React, { useRef, useEffect } from 'react';
import { PhysicsState, CarConfig } from '../types';

interface DashboardProps {
  state: PhysicsState;
  config: CarConfig;
}

// ------------------- Helper Functions -------------------

const mapValueToAngle = (value: number, min: number, max: number) => {
    const clamped = Math.min(max, Math.max(min, value));
    const ratio = (clamped - min) / (max - min);
    return -135 + ratio * 270;
};

const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: cx + (radius * Math.cos(angleInRadians)),
    y: cy + (radius * Math.sin(angleInRadians))
  };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    if (endAngle - startAngle >= 360) {
        endAngle = startAngle + 359.99;
    }
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
};

// ------------------- Sub-Components -------------------

interface Zone {
    min: number;
    max: number;
    color: string;
    width?: number;
    opacity?: number;
}

const Gauge = ({ 
    value, 
    min = 0, 
    max, 
    label, 
    unit, 
    zones = [], 
    majorTicksCount = 5, 
    minorTicksPerMajor = 4,
    labelDivider = 1
}: { 
    value: number; 
    min?: number; 
    max: number; 
    label: string; 
    unit: string; 
    zones?: Zone[]; 
    majorTicksCount?: number; 
    minorTicksPerMajor?: number;
    labelDivider?: number;
}) => {
    const CX = 64;
    const CY = 64;
    const RADIUS = 56;
    const START_ANGLE = -135;
    const END_ANGLE = 135;
    const currentAngle = mapValueToAngle(value, min, max);

    // Generate Ticks
    const ticks = [];
    const totalRange = max - min;
    const majorStep = totalRange / majorTicksCount;
    
    for (let v = min; v <= max; v += majorStep) {
        const angle = mapValueToAngle(v, min, max);
        const p1 = polarToCartesian(CX, CY, RADIUS, angle);
        const p2 = polarToCartesian(CX, CY, RADIUS - 8, angle);
        
        ticks.push(
            <line key={`maj-${v}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#e2e8f0" strokeWidth="2" />
        );

        const labelRadius = RADIUS - 18;
        const pLabel = polarToCartesian(CX, CY, labelRadius, angle);
        ticks.push(
            <text key={`lbl-${v}`} x={pLabel.x} y={pLabel.y} fill="#94a3b8" fontSize="8" fontWeight="600" textAnchor="middle" dominantBaseline="middle" fontFamily="monospace">
                {Math.round(v / labelDivider)}
            </text>
        );

        if (v < max) {
            const minorStep = majorStep / (minorTicksPerMajor + 1);
            for (let m = 1; m <= minorTicksPerMajor; m++) {
                const minorV = v + m * minorStep;
                if (minorV > max) break;
                const mAngle = mapValueToAngle(minorV, min, max);
                const mp1 = polarToCartesian(CX, CY, RADIUS, mAngle);
                const mp2 = polarToCartesian(CX, CY, RADIUS - 4, mAngle);
                ticks.push(
                    <line key={`min-${minorV}`} x1={mp1.x} y1={mp1.y} x2={mp2.x} y2={mp2.y} stroke="#64748b" strokeWidth="1" />
                );
            }
        }
    }

    return (
        <div className="relative w-48 h-48 flex items-center justify-center">
             <svg width="100%" height="100%" viewBox="0 0 128 128" className="overflow-visible select-none">
                 <defs>
                    <linearGradient id="needle-gradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#b91c1c" />
                    </linearGradient>
                 </defs>
                 <path d={describeArc(CX, CY, RADIUS, START_ANGLE, END_ANGLE)} fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round"/>
                 {zones.map((zone, i) => {
                     const zMin = Math.max(min, zone.min);
                     const zMax = Math.min(max, zone.max);
                     if (zMin >= zMax) return null;
                     const start = mapValueToAngle(zMin, min, max);
                     const end = mapValueToAngle(zMax, min, max);
                     return <path key={`zone-${i}`} d={describeArc(CX, CY, RADIUS, start, end)} fill="none" stroke={zone.color} strokeWidth={zone.width || 6} strokeOpacity={zone.opacity || 1} strokeLinecap="butt"/>;
                 })}
                 <g>{ticks}</g>
                 <g transform={`rotate(${currentAngle}, ${CX}, ${CY})`}>
                     <path d={`M${CX-1},${CY} L${CX},${CY-RADIUS+4} L${CX+1},${CY}`} fill="black" opacity="0.3" filter="blur(2px)" transform="translate(1, 1)"/>
                     <path d={`M${CX-2},${CY+8} L${CX},${CY-RADIUS+2} L${CX+2},${CY+8}`} fill="url(#needle-gradient)" />
                     <circle cx={CX} cy={CY} r="3" fill="#cbd5e1" />
                     <circle cx={CX} cy={CY} r="1.5" fill="#1e293b" />
                 </g>
             </svg>
             <div className="absolute top-[60%] flex flex-col items-center pointer-events-none">
                 <span className="text-2xl font-bold font-mono text-white tracking-tighter drop-shadow-md">{Math.round(value)}</span>
                 <div className="flex flex-col items-center -mt-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{label}</span>
                    <span className="text-[9px] text-slate-600 font-mono">{unit}</span>
                 </div>
             </div>
        </div>
    );
};

const TelemetryBar = ({ value, color, label }: { value: number; color: string; label: string }) => (
    <div className="flex flex-col items-center gap-1">
        <div className="w-6 h-32 bg-slate-900 rounded border border-slate-700 relative overflow-hidden">
            <div className="absolute inset-0 flex flex-col justify-between p-px opacity-20">
                {[...Array(10)].map((_, i) => <div key={i} className="w-full h-px bg-slate-400" />)}
            </div>
            <div className={`absolute bottom-0 left-0 right-0 transition-all duration-75 ease-linear ${color}`} style={{ height: `${Math.min(100, Math.max(0, value * 100))}%` }} />
        </div>
        <span className="text-[10px] font-mono text-slate-500 font-bold">{label}</span>
    </div>
);

// New Component: Steering Wheel Status
const SteeringWheel = ({ angle }: { angle: number }) => {
    return (
        <div className="flex flex-col items-center gap-1">
             <div className="w-32 h-32 rounded-full border-4 border-slate-700 bg-slate-800 relative flex items-center justify-center shadow-inner overflow-hidden">
                {/* Rotating Part */}
                <div 
                    className="w-full h-full relative"
                    style={{ transform: `rotate(${angle}deg)` }}
                >
                    {/* Rim Highlight */}
                    <div className="absolute inset-0 rounded-full border-2 border-slate-600 opacity-50"></div>
                    
                    {/* Spokes */}
                    <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-900 -mt-1"></div> {/* Horizontal */}
                    <div className="absolute top-1/2 left-1/2 w-2 h-1/2 bg-slate-900 -ml-1"></div> {/* Bottom Vertical */}
                    
                    {/* Center Marker (Top Center) */}
                    <div className="absolute top-0 left-1/2 w-1 h-4 bg-red-500 -ml-0.5 z-10"></div>
                </div>

                {/* Static Center Hub */}
                <div className="absolute w-8 h-8 bg-slate-900 rounded-full border border-slate-600 z-20 flex items-center justify-center">
                     <div className="w-6 h-6 rounded-full border border-slate-700 bg-slate-800"></div>
                </div>
             </div>
             <div className="flex flex-col items-center -mt-1">
                 <span className="text-[10px] font-mono text-slate-500 font-bold">STEER</span>
                 <span className={`text-[9px] font-mono ${Math.abs(angle) > 360 ? 'text-red-400' : 'text-slate-600'}`}>
                     {Math.round(angle)}°
                 </span>
             </div>
        </div>
    );
};

// ------------------- Main Dashboard -------------------

export const Dashboard: React.FC<DashboardProps> = ({ state, config }) => {
  const visualStateRef = useRef(state);
  const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;
  
  if (!visualStateRef.current) visualStateRef.current = state;

  visualStateRef.current = {
      ...state,
      rpm: lerp(visualStateRef.current.rpm, state.rpm, 0.2),
      speedKmh: lerp(visualStateRef.current.speedKmh, state.speedKmh, 0.2),
      // 平滑显示方向盘角度，避免视觉跳变
      steeringWheelAngle: lerp(visualStateRef.current.steeringWheelAngle, state.steeringWheelAngle, 0.3),
      gear: state.gear,
      engineOn: state.engineOn,
      stalled: state.stalled,
      clutchPosition: state.clutchPosition,
      brakeInput: state.brakeInput,
      throttleInput: state.throttleInput,
      steerAngle: state.steerAngle, // unused for display
  };
  
  const displayState = visualStateRef.current;

  const getGearLabel = (g: number) => {
      if (g === 0) return 'N';
      if (g === -1) return 'R';
      return g.toString();
  };

  const maxDisplayedRPM = Math.ceil((config.redlineRPM + 1000) / 1000) * 1000;
  const stallZoneMax = config.stallRPM + 200;

  const rpmZones: Zone[] = [
      { min: 0, max: stallZoneMax, color: '#f97316', width: 6 },
      { min: config.redlineRPM - 500, max: config.redlineRPM, color: '#eab308', width: 6 },
      { min: config.redlineRPM, max: maxDisplayedRPM, color: '#ef4444', width: 6 }
  ];

  const isRedlining = displayState.rpm > config.redlineRPM;
  const isNearRedline = displayState.rpm > config.redlineRPM - 500;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-6 select-none perspective-[500px]">
        
        {/* Main Cluster */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 pb-8 flex items-end gap-8 shadow-2xl ring-1 ring-white/10 transform-gpu">
            <Gauge value={displayState.rpm} max={maxDisplayedRPM} label="RPM" unit="x1000" zones={rpmZones} labelDivider={1000} majorTicksCount={maxDisplayedRPM / 1000} minorTicksPerMajor={4} />

            <div className="flex flex-col items-center justify-between h-40 pb-2">
                <div className="flex gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${displayState.engineOn ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-700'}`} title="Engine Status" />
                    <div className={`w-2 h-2 rounded-full ${displayState.stalled ? 'bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]' : 'bg-slate-700'}`} title="Stall Warning" />
                </div>
                <div className={`relative flex items-center justify-center w-28 h-28 rounded-2xl border-2 transition-colors duration-100 ${isRedlining ? 'bg-red-900/40 border-red-500 animate-pulse' : 'bg-slate-800 border-slate-700'} ${displayState.gear === 0 ? 'border-green-900/50' : ''}`}>
                    <span className="absolute top-2 text-[10px] font-bold text-slate-500 tracking-widest">GEAR</span>
                    <span className={`text-7xl font-black font-mono tracking-tighter z-10 ${displayState.gear === 0 ? 'text-green-500' : displayState.gear === -1 ? 'text-orange-500' : 'text-blue-100'} ${isNearRedline && displayState.gear > 0 ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'drop-shadow-lg'}`}>{getGearLabel(displayState.gear)}</span>
                </div>
            </div>

            <Gauge value={displayState.speedKmh} max={220} label="SPEED" unit="km/h" majorTicksCount={11} minorTicksPerMajor={1} />
        </div>

        {/* Input Telemetry */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl p-4 flex gap-4 shadow-xl h-fit">
            <SteeringWheel angle={displayState.steeringWheelAngle} />
            <div className="w-px bg-slate-700 mx-1"></div>
            <TelemetryBar value={displayState.clutchPosition} color="bg-yellow-500" label="CLU" />
            <TelemetryBar value={displayState.brakeInput} color="bg-red-500" label="BRK" />
            <TelemetryBar value={displayState.throttleInput} color="bg-green-500" label="THR" />
        </div>

    </div>
  );
};