
import React from 'react';
import { CarConfig } from '../types';
import { CAR_PRESETS } from '../constants';

interface SandboxControlsProps {
    config: CarConfig;
    onUpdate: (newConfig: CarConfig) => void;
}

export const SandboxControls: React.FC<SandboxControlsProps> = ({ config, onUpdate }) => {
    const handleChange = (key: keyof CarConfig, value: number) => {
        onUpdate({ ...config, [key]: value, name: "Custom" });
    };

    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const presetKey = e.target.value;
        if (CAR_PRESETS[presetKey]) {
            onUpdate({ ...CAR_PRESETS[presetKey] });
        }
    };

    return (
        <div className="fixed right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-700 p-6 overflow-y-auto shadow-xl z-30">
            <h2 className="text-xl font-bold mb-4 text-white border-b border-slate-700 pb-2">车辆工程实验室</h2>
            
            {/* Presets */}
            <div className="mb-6">
                <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider block mb-2">车辆预设模版</label>
                <select 
                    className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={handlePresetChange}
                    defaultValue=""
                >
                    <option value="" disabled>-- 选择预设 --</option>
                    {Object.keys(CAR_PRESETS).map(key => (
                        <option key={key} value={key}>{CAR_PRESETS[key].name}</option>
                    ))}
                </select>
                <div className="text-xs text-slate-500 mt-1 italic">当前配置: {config.name}</div>
            </div>

            <div className="space-y-6">
                <ControlGroup label="引擎参数 (Engine Specs)">
                    <Slider label="怠速 (Idle RPM)" value={config.idleRPM} min={500} max={1200} step={50} onChange={(v) => handleChange('idleRPM', v)} />
                    <Slider label="红线 (Redline)" value={config.redlineRPM} min={3000} max={10000} step={100} onChange={(v) => handleChange('redlineRPM', v)} />
                    <Slider label="扭矩系数 (Torque)" value={config.engineForce} min={200} max={1500} step={50} onChange={(v) => handleChange('engineForce', v)} />
                </ControlGroup>

                <ControlGroup label="物理特性 (Dynamics)">
                    <Slider label="飞轮惯量 (Inertia)" value={config.flywheelInertia} min={0.1} max={5.0} step={0.1} onChange={(v) => handleChange('flywheelInertia', v)} />
                    <p className="text-[10px] text-slate-500 mb-2">影响转速上升/下降的速率。数值越大，转速变化越慢（如卡车）；数值越小，响应越灵敏（如赛车）。</p>
                    
                    <Slider label="内部摩擦 (Friction)" value={config.engineFriction} min={0.1} max={2.0} step={0.1} onChange={(v) => handleChange('engineFriction', v)} />
                    <p className="text-[10px] text-slate-500 mb-2">影响空挡松油门时的掉转速快慢。</p>

                    <Slider label="发动机制动 (Eng. Brake)" value={config.engineBrakingCoefficient} min={0.1} max={3.0} step={0.1} onChange={(v) => handleChange('engineBrakingCoefficient', v)} />
                    <p className="text-[10px] text-slate-500 mb-2">影响带档松油门时的减速感。</p>
                </ControlGroup>

                <ControlGroup label="底盘与传动">
                    <Slider label="轴距 (Wheelbase)" value={config.wheelBase} min={2.0} max={5.0} step={0.1} onChange={(v) => handleChange('wheelBase', v)} />
                    <Slider label="转向比 (Steering Ratio)" value={config.steeringRatio} min={10.0} max={30.0} step={0.5} onChange={(v) => handleChange('steeringRatio', v)} />
                    <Slider label="最大方向盘角 (Max Wheel Angle)" value={config.maxSteeringWheelAngle} min={270} max={1080} step={30} onChange={(v) => handleChange('maxSteeringWheelAngle', v)} />
                    <Slider label="车重 (Mass kg)" value={config.mass} min={800} max={5000} step={50} onChange={(v) => handleChange('mass', v)} />
                </ControlGroup>
            </div>
            
            <div className="mt-8 p-3 bg-blue-900/20 border border-blue-800 rounded text-xs text-blue-200">
                提示：调整飞轮惯量和发动机制动系数可以显著改变车辆的“性格”。
            </div>
        </div>
    );
};

const ControlGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-3 pb-4 border-b border-slate-800/50">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{label}</h3>
        {children}
    </div>
);

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }> = ({ label, value, min, max, step, onChange }) => (
    <div>
        <div className="flex justify-between mb-1">
            <label className="text-xs text-slate-400">{label}</label>
            <span className="text-xs font-mono text-blue-400">{value}</span>
        </div>
        <input 
            type="range" 
            min={min} 
            max={max} 
            step={step} 
            value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
        />
    </div>
);
