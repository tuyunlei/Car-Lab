
import { ControlsConfig } from '../config/types';
import { PhysicsState, InputState } from './types';
import { interpolateTable, clamp, exponentialDecay } from '../utils/math';
import { INPUT_CONSTANTS } from './constants';

// Helper: Linearly move current towards target by maxDelta
const moveTowards = (current: number, target: number, maxDelta: number) => {
    if (Math.abs(target - current) <= maxDelta) return target;
    return current + Math.sign(target - current) * maxDelta;
};

const updateVirtualPedal = (
    currentValue: number,
    inc: boolean,
    dec: boolean,
    setFull: boolean | undefined,
    setZero: boolean | undefined,
    dt: number
): number => {
    // 1. Double-Tap Shortcuts (Instant)
    if (setFull) return 1.0;
    if (setZero) return 0.0;

    // 2. Incremental Adjustment
    let delta = 0;
    if (inc) delta += INPUT_CONSTANTS.VIRTUAL_PEDAL_RATE * dt;
    if (dec) delta -= INPUT_CONSTANTS.VIRTUAL_PEDAL_RATE * dt;
    
    return clamp(currentValue + delta, 0, 1);
};

const updateVirtualSteering = (
    currentValue: number,
    left: boolean,
    right: boolean,
    setFullLeft: boolean | undefined,
    setFullRight: boolean | undefined,
    dt: number
): number => {
    if (setFullLeft) return -1.0;
    if (setFullRight) return 1.0;

    let delta = 0;
    if (left) delta -= INPUT_CONSTANTS.VIRTUAL_PEDAL_RATE * dt;
    if (right) delta += INPUT_CONSTANTS.VIRTUAL_PEDAL_RATE * dt;

    return clamp(currentValue + delta, -1, 1);
};

interface VirtualPedalUpdate {
    virtualThrottle: number;
    virtualBrake: number;
    virtualClutch: number;
    virtualSteering: number;
}

const updateVirtualPedals = (
    state: PhysicsState,
    inputs: InputState,
    dt: number
): VirtualPedalUpdate => {
    return {
        virtualThrottle: updateVirtualPedal(
            state.virtualThrottle ?? 0,
            inputs.throttleInc,
            inputs.throttleDec,
            inputs.setVirtualThrottleFull,
            inputs.setVirtualThrottleZero,
            dt
        ),
        virtualBrake: updateVirtualPedal(
            state.virtualBrake ?? 0,
            inputs.brakeInc,
            inputs.brakeDec,
            inputs.setVirtualBrakeFull,
            inputs.setVirtualBrakeZero,
            dt
        ),
        virtualClutch: updateVirtualPedal(
            state.virtualClutch ?? 0,
            inputs.clutchInc,
            inputs.clutchDec,
            inputs.setVirtualClutchFull,
            inputs.setVirtualClutchZero,
            dt
        ),
        virtualSteering: (inputs.left || inputs.right) 
            ? 0 
            : updateVirtualSteering(
                state.virtualSteering ?? 0,
                inputs.steerLeftInc,
                inputs.steerRightInc,
                inputs.setVirtualSteeringLeftFull,
                inputs.setVirtualSteeringRightFull,
                dt
            )
    };
};

interface ResolvedInputs {
    throttleTarget: number;
    brakeTarget: number;
    clutchTarget: number;
    resetVirtualThrottle: boolean;
}

const resolveInputTargets = (
    inputs: InputState,
    virtuals: VirtualPedalUpdate
): ResolvedInputs => {
    // Throttle
    let throttleTarget = 0.0;
    let resetVirtualThrottle = false;

    if (inputs.throttleAnalog !== undefined) {
        throttleTarget = clamp(inputs.throttleAnalog, 0, 1);
    } else if (inputs.throttle) {
        throttleTarget = 1.0; 
        resetVirtualThrottle = true;
    } else {
        throttleTarget = virtuals.virtualThrottle;
    }

    // Brake
    let brakeTarget = 0.0;
    if (inputs.brakeAnalog !== undefined) {
        brakeTarget = clamp(inputs.brakeAnalog, 0, 1);
    } else if (inputs.brake) {
        brakeTarget = 1.0;
    } else {
        brakeTarget = virtuals.virtualBrake;
    }

    // Clutch
    let clutchTarget = 0.0;
    if (inputs.clutchAnalog !== undefined) {
        clutchTarget = clamp(inputs.clutchAnalog, 0, 1);
    } else if (inputs.clutch) {
        clutchTarget = 1.0;
    } else {
        clutchTarget = virtuals.virtualClutch;
    }

    return { throttleTarget, brakeTarget, clutchTarget, resetVirtualThrottle };
};

const processHandbrake = (
    state: PhysicsState,
    inputs: InputState,
    config: ControlsConfig,
    dt: number
): { handbrakeInput: number; handbrakePulled: boolean } => {
    if (config.handbrakeMode === 'RATCHET') {
        let handbrakePulled = state.handbrakePulled;
        if (inputs.toggleHandbrake) {
            handbrakePulled = !handbrakePulled;
        }
        const ratchetTarget = handbrakePulled ? 1.0 : 0.0;
        
        const speed = config.handbrakeRatchetSpeed || INPUT_CONSTANTS.DEFAULT_HANDBRAKE_RATCHET_SPEED;
        const handbrakeInput = moveTowards(state.handbrakeInput, ratchetTarget, speed * dt);
        return { handbrakeInput, handbrakePulled };
    } else {
        let handbrakeTarget = 0.0;
        if (inputs.handbrakeAnalog !== undefined) {
            handbrakeTarget = clamp(inputs.handbrakeAnalog, 0, 1);
        } else {
            handbrakeTarget = inputs.handbrake ? 1.0 : 0.0;
        }
        
        const handbrakeTau = config.handbrakeTau ?? config.brakeTau;
        const handbrakeInput = exponentialDecay(state.handbrakeInput, handbrakeTarget, handbrakeTau, dt);
        return { handbrakeInput, handbrakePulled: handbrakeInput > 0.1 };
    }
};

const processSteering = (
    state: PhysicsState,
    inputs: InputState,
    config: ControlsConfig,
    maxSteeringWheelAngle: number,
    currentSpeed: number,
    virtualSteering: number,
    dt: number
): number => {
    const absSpeed = Math.abs(currentSpeed);
    const steeringTable = config.steeringCurve.map(p => ({ x: p.speed, y: p.tau }));
    const currentSteerTau = interpolateTable(steeringTable, absSpeed);

    let steerTarget = 0; 
    
    if (inputs.steeringAnalog !== undefined) {
        steerTarget = clamp(inputs.steeringAnalog, -1, 1);
    } else {
        if (inputs.left) steerTarget -= 1.0; 
        if (inputs.right) steerTarget += 1.0;
        
        if (!inputs.left && !inputs.right) {
            steerTarget = virtualSteering;
        }
    }

    const effectiveTau = steerTarget === 0 ? config.steeringReturnTau : currentSteerTau;
    
    const targetAngle = steerTarget * maxSteeringWheelAngle;
    return exponentialDecay(state.steeringWheelAngle, targetAngle, effectiveTau, dt);
};

export const processInputs = (
    currentState: PhysicsState,
    config: ControlsConfig, 
    maxSteeringWheelAngle: number,
    inputs: InputState,
    dt: number,
    currentSpeed: number 
): PhysicsState => {
    // 1. Update Virtual Pedals
    const virtuals = updateVirtualPedals(currentState, inputs, dt);

    // 2. Resolve Targets
    const targets = resolveInputTargets(inputs, virtuals);

    // 3. Apply Smoothing
    const throttleInput = exponentialDecay(currentState.throttleInput, targets.throttleTarget, config.throttleTau, dt);
    const brakeInput = exponentialDecay(currentState.brakeInput, targets.brakeTarget, config.brakeTau, dt);
    const clutchPosition = exponentialDecay(currentState.clutchPosition, targets.clutchTarget, config.clutchTau, dt);

    // 4. Handbrake
    const handbrake = processHandbrake(currentState, inputs, config, dt);

    // 5. Steering
    const steeringWheelAngle = processSteering(
        currentState, inputs, config, maxSteeringWheelAngle, currentSpeed, virtuals.virtualSteering, dt
    );

    return { 
        ...currentState,
        virtualThrottle: targets.resetVirtualThrottle ? 0 : virtuals.virtualThrottle,
        virtualBrake: virtuals.virtualBrake,
        virtualClutch: virtuals.virtualClutch,
        virtualSteering: virtuals.virtualSteering,
        throttleInput,
        brakeInput,
        clutchPosition,
        handbrakeInput: handbrake.handbrakeInput,
        handbrakePulled: handbrake.handbrakePulled,
        steeringWheelAngle
    };
};
