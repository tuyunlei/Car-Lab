
import { PhysicsState, InputState, StoppingState } from '../../physics/types';
import { CarConfig } from '../../config/types';
import { EnvironmentConfig, MapObject } from '../types';
import { updatePhysics } from '../../physics/physicsEngine';
import { checkCollisions, CollisionResult } from '../collision';
import { TriggerState } from './InputSystem';
import { createResetState } from '../../physics/factory';

export interface VehicleLogicResult {
    state: PhysicsState;
    message?: string;
    hasChanged: boolean;
}

export class PhysicsSystem {
    
    public update(
        state: PhysicsState, 
        config: CarConfig, 
        inputs: InputState, 
        env: EnvironmentConfig, 
        dt: number
    ): PhysicsState {
        return updatePhysics(state, config, inputs, env, dt);
    }

    public checkCollisions(state: PhysicsState, objects: MapObject[]): CollisionResult {
        return checkCollisions(state, objects);
    }

    /**
     * Handles non-continuous vehicle logic like shifting, engine toggle, reset.
     * Returns a new state object if changes occurred (Pure Function style).
     */
    public handleVehicleLogic(
        state: PhysicsState, 
        triggers: TriggerState, 
        config: CarConfig, 
        startPos: { x: number, y: number },
        startHeading: number
    ): VehicleLogicResult {
        const isC1 = config.drivetrainMode === 'C1_TRAINER';
        
        // Clone state to avoid mutation
        let newState = { ...state };
        let message: string | undefined;
        let hasChanged = false;

        // 1. Engine Toggle
        if (triggers.toggleEngine) {
            hasChanged = true;
            if (!newState.engineOn) {
                if (isC1) {
                    newState.starterActive = !newState.starterActive;
                    newState.stalled = false; 
                } else {
                    newState.engineOn = true;
                    newState.stalled = false;
                    newState.rpm = config.engine.idleRPM;
                    newState.idleIntegral = 0;
                    message = 'msg.engine_on';
                }
            } else {
                newState.engineOn = false;
                newState.starterActive = false;
                message = 'msg.engine_off';
            }
        }
        
        // 2. Reset
        if (triggers.reset) {
            newState = createResetState(startPos, startHeading);
            message = 'msg.reset';
            hasChanged = true;
        }

        // 3. Shifting
        if (triggers.shiftUp) {
            if (newState.clutchPosition > 0.5) {
                const nextGear = newState.gear + 1;
                if (nextGear < config.transmission.gearRatios.length) {
                    newState.gear = nextGear;
                    hasChanged = true;
                }
            } else {
                message = 'msg.clutch_warn';
            }
        }

        if (triggers.shiftDown) {
            if (newState.clutchPosition > 0.5) {
                const prevGear = newState.gear - 1;
                
                // Reverse Block Logic
                let allowShift = true;
                if (isC1 && prevGear === -1) {
                    const fwdSpeed = newState.localVelocity.x;
                    if (fwdSpeed > 2.0) {
                        message = 'msg.reverse_block';
                        allowShift = false;
                    }
                }
                
                if (allowShift && prevGear >= -1) {
                    newState.gear = prevGear;
                    hasChanged = true;
                }
            } else {
                message = 'msg.clutch_warn';
            }
        }

        return { state: newState, message, hasChanged };
    }

    public handleCollisionConsequences(state: PhysicsState): PhysicsState {
        return {
            ...state,
            velocity: { x: -state.velocity.x * 0.5, y: -state.velocity.y * 0.5 },
            localVelocity: { x: 0, y: 0 },
            engineOn: false,
            stalled: true
        };
    }
}
