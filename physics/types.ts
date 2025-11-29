
export interface Vector2 {
  x: number;
  y: number;
}

export enum StoppingState {
  MOVING = 'MOVING',
  STOPPING = 'STOPPING', 
  STOPPED = 'STOPPED'    
}

export interface InputState {
    throttle: boolean;
    brake: boolean;
    left: boolean;
    right: boolean;
    clutch: boolean;
}

export interface PhysicsState {
  // Pose (World)
  position: Vector2;
  velocity: Vector2;       
  heading: number;         
  angularVelocity: number; 

  // Pose (Local)
  localVelocity: Vector2;  
  
  // Dynamics History
  lastAx: number;
  lastAy: number;
  stoppingState: StoppingState;
  stopTimer: number;

  // Input State (Processed)
  throttleInput: number;   
  brakeInput: number;      
  clutchPosition: number;  
  steeringWheelAngle: number; 
  steerAngle: number;      

  // Powertrain State
  rpm: number;
  gear: number;            
  engineOn: boolean;
  stalled: boolean;
  isClutchLocked: boolean; 
  
  // Smoothing vars
  currentEffectiveMass: number; 

  // Internal State
  idleIntegral: number;    
  lastRpm: number;

  // Derived (Convenience)
  speedKmh: number;
}
