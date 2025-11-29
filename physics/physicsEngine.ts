
import { CarConfig } from '../config/types';
import { PhysicsState, StoppingState, InputState } from './types';
import { EnvironmentConfig } from '../game/types';
import { processInputs } from './inputSystem';
import { updatePowertrain } from './powertrain';
import { updateChassisDynamics } from './chassis';

export const updatePhysics = (
  state: PhysicsState,
  config: CarConfig,
  inputState: InputState, 
  environment: EnvironmentConfig, 
  dt: number
): PhysicsState => {
  // 1. Process Inputs (Pure)
  // Derive desired inputs from raw controller state
  const currentSpeed = state.localVelocity.x;
  let nextState = processInputs(state, config.controls, inputState, dt, currentSpeed);

  // Map Steering Wheel to Road Wheel
  nextState.steerAngle = (nextState.steeringWheelAngle / config.chassis.steeringRatio) * (Math.PI / 180);

  // 2. Powertrain (Pure)
  // Calculate drive forces and engine state
  const ptResult = updatePowertrain(nextState, config, dt);
  
  // Update state with Powertrain results
  nextState.rpm = ptResult.rpm;
  nextState.stalled = ptResult.stalled;
  nextState.engineOn = ptResult.engineOn;
  nextState.idleIntegral = ptResult.idleIntegral;
  nextState.isClutchLocked = ptResult.isClutchLocked;
  nextState.currentEffectiveMass = ptResult.currentEffectiveMass; 

  // 3. Chassis (Pure)
  // Apply forces and integrate motion
  const chassisResult = updateChassisDynamics(
      nextState,
      {
          driveForce: ptResult.driveForce,
          effectiveLongitudinalMass: ptResult.effectiveLongitudinalMass,
          brakeTorqueFront: ptResult.brakeTorqueFront,
          brakeTorqueRear: ptResult.brakeTorqueRear
      },
      config.chassis,
      config.feel,
      environment, 
      dt
  );

  nextState = { ...nextState, ...chassisResult };
  nextState.lastRpm = state.rpm;

  return nextState;
};
