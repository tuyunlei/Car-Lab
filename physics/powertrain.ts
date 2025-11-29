
import { CarConfig } from '../config/types';
import { PhysicsState } from './types';
import { calculateEngineTorque, calculateIdleThrottle } from './modules/engine';
import { calculateBrakeTorques } from './modules/brakes';
import { getTotalRatio, calculateEffectiveInertiaRatio } from './modules/transmission';
import { RAD_TO_RPM, lerp } from '../utils/math';

export interface PowertrainOutput {
    rpm: number; 
    driveForce: number; 
    effectiveLongitudinalMass: number; 
    stalled: boolean; 
    engineOn: boolean;
    idleIntegral: number;
    brakeTorqueFront: number;
    brakeTorqueRear: number;
    isClutchLocked: boolean;
    currentEffectiveMass: number;
}

// Sub-function: Determine clutch capacity based on pedal
const calculateClutchCapacity = (clutchPos: number, maxTorque: number) => {
    const engagement = 1.0 - clutchPos;
    return Math.max(0, engagement * maxTorque);
};

// Sub-function: Solve Engine RPM integration
const integrateEngineRPM = (currentRPM: number, netTorque: number, inertia: number, dt: number) => {
    const alpha = netTorque / inertia;
    const nextRPM = currentRPM + alpha * RAD_TO_RPM * dt;
    return Math.max(0, nextRPM);
};

// Sub-function: Determine Lock State (Hysteresis Logic)
const determineLockState = (
    currentlyLocked: boolean,
    engineTorque: number,
    clutchCapacity: number,
    rpmDiff: number,
    rpm: number,
    idleRPM: number,
    gear: number,
    hysteresis: number
): boolean => {
    if (gear === 0 || clutchCapacity < 5.0) return false;

    if (currentlyLocked) {
        // Unlock Conditions:
        // 1. Torque exceeds capacity + hysteresis
        const torqueOverload = Math.abs(engineTorque) > clutchCapacity * (1.0 + hysteresis);
        // 2. RPM too low (Anti-Stall / Anti-Lug)
        const rpmTooLow = rpm < (idleRPM * 0.6);
        
        if (torqueOverload || rpmTooLow) return false;
        return true;
    } else {
        // Lock Conditions:
        // 1. Torque within capacity
        const torqueOk = Math.abs(engineTorque) < clutchCapacity * (1.0 - hysteresis);
        // 2. RPM sync is close
        const rpmDiffOk = Math.abs(rpmDiff) < 150; 
        // 3. Engine healthy
        const rpmHealthy = rpm > (idleRPM * 0.9);

        if (torqueOk && rpmDiffOk && rpmHealthy) return true;
        return false;
    }
};

export const updatePowertrain = (
    state: PhysicsState,
    config: CarConfig,
    dt: number
): PowertrainOutput => {
    const { throttleInput, clutchPosition, gear, rpm, engineOn, stalled, localVelocity } = state;

    // 1. Idle Control
    let finalThrottle = throttleInput;
    let nextIdleIntegral = state.idleIntegral;
    
    if (engineOn && !stalled) {
        const idleRes = calculateIdleThrottle(rpm, dt, config.engine, { rpm: state.lastRpm, integralError: state.idleIntegral });
        nextIdleIntegral = idleRes.newIntegral;
        finalThrottle = Math.max(throttleInput, idleRes.throttleOffset);
    }

    // 2. Compute Engine Torque Potential
    const engineTorque = calculateEngineTorque(rpm, finalThrottle, engineOn, stalled, config.engine);

    // 3. Driveline Kinematics
    const wheelRadius = config.chassis.wheelRadius;
    const gearRatio = getTotalRatio(gear, config.transmission);
    const wheelRotSpeed = localVelocity.x / wheelRadius; // rad/s
    const transmissionInputRPM = wheelRotSpeed * gearRatio * RAD_TO_RPM;
    const clutchCapacity = calculateClutchCapacity(clutchPosition, config.transmission.clutchMaxTorque);

    // 4. Effective Mass Smoothing
    const targetEffectiveMass = (config.engine.inertia * calculateEffectiveInertiaRatio(gear, config.transmission)) / (wheelRadius * wheelRadius);
    const smoothFactor = config.transmission.effectiveMassSmoothFactor ?? 0.2;
    let nextEffectiveMass = lerp(state.currentEffectiveMass || 0, targetEffectiveMass, smoothFactor);
    if (state.currentEffectiveMass === 0) nextEffectiveMass = targetEffectiveMass;

    // 5. Solve Clutch State
    const rpmDiff = rpm - transmissionInputRPM;
    const isLocked = determineLockState(
        state.isClutchLocked,
        engineTorque,
        clutchCapacity,
        rpmDiff,
        rpm,
        config.engine.idleRPM,
        gear,
        config.transmission.clutchHysteresis
    );

    let nextRPM = rpm;
    let driveForce = 0;
    let effectiveLongitudinalMass = 0;

    if (gear === 0 || clutchCapacity < 0.1) {
        // Disconnected
        nextRPM = integrateEngineRPM(rpm, engineTorque, config.engine.inertia, dt);
        driveForce = 0;
        effectiveLongitudinalMass = 0;
    } else if (isLocked) {
        // Locked
        nextRPM = transmissionInputRPM;
        effectiveLongitudinalMass = nextEffectiveMass;
        // Drive force = Engine Torque * Ratio / Radius
        driveForce = (engineTorque * gearRatio) / wheelRadius;
    } else {
        // Slipping
        const slipSign = Math.sign(rpmDiff);
        const transmittedTorque = clutchCapacity * slipSign;
        
        // Engine side integration
        const netEngineTorque = engineTorque - transmittedTorque;
        nextRPM = integrateEngineRPM(rpm, netEngineTorque, config.engine.inertia, dt);
        
        // Wheel side force
        driveForce = (transmittedTorque * gearRatio) / wheelRadius;
        effectiveLongitudinalMass = 0;
    }
    
    // 6. Stall Check
    let nextStalled = stalled;
    let nextEngineOn = engineOn;
    if (engineOn && !stalled && nextRPM < 300 && isLocked) {
        nextStalled = true;
        nextEngineOn = false;
    }

    // 7. Brakes
    const brakes = calculateBrakeTorques(state.brakeInput, config.brakes);

    return {
        rpm: nextRPM,
        driveForce,
        effectiveLongitudinalMass,
        stalled: nextStalled,
        engineOn: nextEngineOn,
        idleIntegral: nextIdleIntegral,
        brakeTorqueFront: brakes.frontTorque,
        brakeTorqueRear: brakes.rearTorque,
        isClutchLocked: isLocked, // Pass back to state
        currentEffectiveMass: nextEffectiveMass
    };
};
