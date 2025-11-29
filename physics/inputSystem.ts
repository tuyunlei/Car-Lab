
import { ControlsConfig } from '../config/types';
import { PhysicsState, InputState } from './types';
import { interpolateTable } from '../utils/math';

// Helper: First-order lag
const smoothInput = (current: number, target: number, tau: number, dt: number): number => {
    if (tau <= 0.001) return target;
    const alpha = 1.0 - Math.exp(-dt / tau);
    return current + (target - current) * alpha;
};

export const processInputs = (
    currentState: PhysicsState,
    config: ControlsConfig, 
    inputs: InputState,
    dt: number,
    currentSpeed: number 
): PhysicsState => {
    const newState = { ...currentState };

    // 1. Clutch
    const clutchTarget = inputs.clutch ? 1.0 : 0.0;
    newState.clutchPosition = smoothInput(newState.clutchPosition, clutchTarget, config.clutchTau, dt);

    // 2. Throttle & Brake
    const throttleTarget = inputs.throttle ? 1.0 : 0.0;
    newState.throttleInput = smoothInput(newState.throttleInput, throttleTarget, config.throttleTau, dt);

    const brakeTarget = inputs.brake ? 1.0 : 0.0;
    newState.brakeInput = smoothInput(newState.brakeInput, brakeTarget, config.brakeTau, dt);

    // 3. Steering
    const absSpeed = Math.abs(currentSpeed);
    const steeringTable = config.steeringCurve.map(p => ({ x: p.speed, y: p.tau }));
    const currentSteerTau = interpolateTable(steeringTable, absSpeed);

    let steerTarget = 0;
    if (inputs.left) steerTarget -= 1.0; 
    if (inputs.right) steerTarget += 1.0;

    const effectiveTau = steerTarget === 0 ? config.steeringReturnTau : currentSteerTau;
    const MAX_WHEEL_ANGLE = 540; // This should ideally come from config, but inputs drive the "wheel"
    
    const targetAngle = steerTarget * MAX_WHEEL_ANGLE;
    newState.steeringWheelAngle = smoothInput(newState.steeringWheelAngle, targetAngle, effectiveTau, dt);

    return newState;
};
