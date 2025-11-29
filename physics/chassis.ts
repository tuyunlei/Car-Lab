
import { ChassisConfig, FeelConfig } from '../config/types';
import { PhysicsState, StoppingState } from './types';
import { EnvironmentConfig } from '../game/types';
import { smoothstep, clamp, softSaturation, lowpass } from '../utils/math';

const GRAVITY = 9.81;

export interface ChassisForces {
    driveForce: number;      
    effectiveLongitudinalMass: number; 
    brakeTorqueFront: number; 
    brakeTorqueRear: number;  
}

// Sub-function: Load Transfer
const calculateLoadTransfer = (
    mass: number, 
    ax: number, 
    slope: number, 
    config: ChassisConfig
) => {
    const weight = mass * GRAVITY * Math.cos(slope);
    const staticFzFront = (config.cgToRear / config.wheelBase) * weight;
    const staticFzRear = (config.cgToFront / config.wheelBase) * weight;
    
    // Dynamic Transfer: dFz = (ax * m * h) / L
    const dynamicLoad = (ax * mass * config.cgHeight) / config.wheelBase;
    
    return {
        Fz_f: clamp(staticFzFront - dynamicLoad, 100, weight),
        Fz_r: clamp(staticFzRear + dynamicLoad, 100, weight),
        weightLong: -mass * GRAVITY * Math.sin(slope) // Gravity force along longitudinal axis
    };
};

// Sub-function: Tire Model
const calculateTireForces = (
    vx: number, vy: number, r: number, 
    steerAngle: number, 
    Fz_f: number, Fz_r: number, 
    inputs: ChassisForces, 
    config: ChassisConfig,
    stoppingState: StoppingState
) => {
    // Slip Angles
    // Protect against division by zero at low speeds
    const vx_safe = Math.abs(vx) < 0.5 ? 0.5 : Math.abs(vx);
    
    const vy_f = vy + config.cgToFront * r;
    const vy_r = vy - config.cgToRear * r;
    
    const alpha_f = Math.atan2(vy_f, vx_safe) - steerAngle * Math.sign(vx);
    const alpha_r = Math.atan2(vy_r, vx_safe);

    // Forces from Inputs
    // If stopping, scale brakes to avoid vibration
    let brakeScale = 1.0;
    if (stoppingState === StoppingState.STOPPING) {
        brakeScale = Math.min(1.0, Math.abs(vx) * 5);
    }

    const Fx_brake_f = -Math.sign(vx) * inputs.brakeTorqueFront / config.wheelRadius * brakeScale;
    const Fx_brake_r = -Math.sign(vx) * inputs.brakeTorqueRear / config.wheelRadius * brakeScale;
    const Fx_drive_f = inputs.driveForce;

    // Longitudinal & Lateral Combined
    const mu = config.tireFriction;
    
    // Lateral Forces (Simplified Pacejka / Soft Saturation)
    const kappa_f = (config.tireStiffnessFront * alpha_f) / (mu * Fz_f);
    const kappa_r = (config.tireStiffnessRear * alpha_r) / (mu * Fz_r);

    const Fy_f_raw = -softSaturation(kappa_f, 2.0) * (mu * Fz_f);
    const Fy_r_raw = -softSaturation(kappa_r, 2.0) * (mu * Fz_r);

    // Friction Circle Cap
    const applyFrictionCircle = (Fx: number, Fy: number, Fz: number) => {
        const maxForce = Fz * mu;
        const currentMag = Math.hypot(Fx, Fy);
        if (currentMag > maxForce) {
            const scale = maxForce / currentMag;
            return { x: Fx * scale, y: Fy * scale };
        }
        return { x: Fx, y: Fy };
    };

    const front = applyFrictionCircle(Fx_drive_f + Fx_brake_f, Fy_f_raw, Fz_f);
    const rear = applyFrictionCircle(Fx_brake_r, Fy_r_raw, Fz_r);

    return { Fx_f: front.x, Fy_f: front.y, Fx_r: rear.x, Fy_r: rear.y };
};

// Sub-function: Stop State Machine
const updateStopState = (
    currentState: StoppingState, 
    currentTimer: number,
    vx: number, 
    driveForce: number, 
    gravityForce: number, 
    maxBrakeForce: number,
    isBraking: boolean,
    feel: FeelConfig,
    dt: number
) => {
    const netPropulsion = driveForce + gravityForce;
    const holdCondition = maxBrakeForce > Math.abs(netPropulsion);
    const absVx = Math.abs(vx);

    let nextState = currentState;
    let nextTimer = currentTimer;

    if (currentState === StoppingState.MOVING) {
        if (absVx < feel.vStopThreshold && isBraking) {
            nextState = StoppingState.STOPPING;
            nextTimer = 0;
        }
    } else if (currentState === StoppingState.STOPPING) {
        nextTimer += dt;
        if (absVx < feel.vStopThreshold / 2 && nextTimer > feel.minStopTime) {
             nextState = StoppingState.STOPPED;
        } else if (absVx > feel.vStopThreshold * 1.5 || !isBraking) {
             nextState = StoppingState.MOVING;
        }
    } else if (currentState === StoppingState.STOPPED) {
        if (!holdCondition) {
             nextState = StoppingState.MOVING;
        }
    }
    return { nextState, nextTimer };
};

export const updateChassisDynamics = (
    state: PhysicsState,
    inputs: ChassisForces,
    config: ChassisConfig,
    feel: FeelConfig,
    environment: EnvironmentConfig,
    dt: number
): Partial<PhysicsState> => {
    const { velocity, localVelocity, heading, angularVelocity, steerAngle, lastAx } = state;

    // 1. Env & State Prep
    const slope = environment.slope || 0;
    const ax_filtered = lowpass(lastAx || 0, state.lastAx || 0, 0.1, dt);

    // 2. Load Transfer
    const loads = calculateLoadTransfer(config.mass, ax_filtered, slope, config);

    // 3. Stop State Machine
    const totalBrakeTorque = inputs.brakeTorqueFront + inputs.brakeTorqueRear;
    const { nextState, nextTimer } = updateStopState(
        state.stoppingState || StoppingState.MOVING,
        state.stopTimer || 0,
        localVelocity.x,
        inputs.driveForce,
        loads.weightLong,
        totalBrakeTorque / config.wheelRadius,
        totalBrakeTorque > 10,
        feel,
        dt
    );

    if (nextState === StoppingState.STOPPED) {
        return {
            velocity: { x: 0, y: 0 },
            localVelocity: { x: 0, y: 0 },
            heading: heading,
            angularVelocity: 0,
            speedKmh: 0,
            stoppingState: StoppingState.STOPPED,
            stopTimer: 0,
            lastAx: 0, lastAy: 0
        };
    }

    // 4. Forces
    const forces = calculateTireForces(
        localVelocity.x, localVelocity.y, angularVelocity, 
        steerAngle, 
        loads.Fz_f, loads.Fz_r, 
        inputs, config, nextState
    );

    // 5. Equations of Motion
    const mass_long = config.mass + inputs.effectiveLongitudinalMass;
    const mass_lat = config.mass;
    
    const sinS = Math.sin(steerAngle);
    const cosS = Math.cos(steerAngle);

    const F_aero = -config.dragCoefficient * localVelocity.x * Math.abs(localVelocity.x);
    const F_roll = -config.rollingResistance * config.mass * GRAVITY * Math.sign(localVelocity.x);

    // Sum Forces (Body Frame)
    const Fx_total = forces.Fx_f * cosS + forces.Fx_r - forces.Fy_f * sinS + F_aero + F_roll + loads.weightLong;
    const Fy_total = forces.Fy_f * cosS + forces.Fy_r + forces.Fx_f * sinS;
    const Mz_total = (forces.Fy_f * cosS + forces.Fx_f * sinS) * config.cgToFront - forces.Fy_r * config.cgToRear;

    const ax = Fx_total / mass_long + localVelocity.y * angularVelocity;
    const ay = Fy_total / mass_lat - localVelocity.x * angularVelocity;
    const alpha = Mz_total / config.momentOfInertia;

    // 6. Integration & Low Speed Blend
    const vx_dyn = localVelocity.x + ax * dt;
    const vy_dyn = localVelocity.y + ay * dt;
    const r_dyn = angularVelocity + alpha * dt;

    const blendFactor = smoothstep(feel.lowSpeedBlendStart, feel.lowSpeedBlendEnd, Math.abs(localVelocity.x));
    
    let next_vy = vy_dyn;
    let next_r = r_dyn;

    if (blendFactor < 1.0) {
        // Kinematic Model
        const beta = Math.atan((config.cgToRear / config.wheelBase) * Math.tan(steerAngle));
        const vy_kin = localVelocity.x * Math.tan(beta);
        const r_kin = (localVelocity.x * Math.cos(beta) * Math.tan(steerAngle)) / config.wheelBase;
        
        next_vy = vy_kin * (1 - blendFactor) + vy_dyn * blendFactor;
        next_r = r_kin * (1 - blendFactor) + r_dyn * blendFactor;
    }

    // World Transforms
    const next_heading = heading + next_r * dt;
    const cosH = Math.cos(next_heading);
    const sinH = Math.sin(next_heading);
    
    const world_vx = vx_dyn * cosH - next_vy * sinH;
    const world_vy = vx_dyn * sinH + next_vy * cosH;

    return {
        velocity: { x: world_vx, y: world_vy },
        localVelocity: { x: vx_dyn, y: next_vy },
        heading: next_heading,
        angularVelocity: next_r,
        position: {
            x: state.position.x + world_vx * dt,
            y: state.position.y + world_vy * dt
        },
        speedKmh: vx_dyn * 3.6,
        stoppingState: nextState,
        stopTimer: nextTimer,
        lastAx: ax,
        lastAy: ay
    };
};
