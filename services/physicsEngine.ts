
import { CarConfig, PhysicsState, Vector2 } from '../types';

const RAD_TO_RPM = 9.5493; // 60 / (2 * PI)
const DEG_TO_RAD = Math.PI / 180;
const GRAVITY = 9.81; // m/s^2
const ROLLING_RESISTANCE_COEFF = 0.025; 
const AIR_DENSITY = 1.225; // kg/m^3

export const updatePhysics = (
  state: PhysicsState,
  config: CarConfig,
  inputs: { throttle: boolean; brake: boolean; left: boolean; right: boolean; clutch: boolean },
  dt: number
): PhysicsState => {
  const newState = { ...state };
  
  // ==========================================
  // 1. 输入处理 (Input Processing)
  // ==========================================
  
  // A. 离合器 (Clutch) - 液压模拟
  const clutchTarget = inputs.clutch ? 1.0 : 0.0;
  // 离合结合（抬脚）较慢，分离（踩脚）较快
  const clutchSpeed = inputs.clutch ? 8.0 : 2.0; 
  if (newState.clutchPosition < clutchTarget) {
     newState.clutchPosition = Math.min(clutchTarget, newState.clutchPosition + clutchSpeed * dt);
  } else {
     newState.clutchPosition = Math.max(clutchTarget, newState.clutchPosition - clutchSpeed * dt);
  }

  // B. 转向系统 (Steering System) - 严谨的方向盘模型
  // 1. 确定目标方向 (-1, 0, 1)
  let steerInput = 0;
  if (inputs.left) steerInput -= 1;
  if (inputs.right) steerInput += 1;

  // 2. 计算方向盘角速度 (Degrees per second)
  let wheelDelta = 0;

  if (steerInput !== 0) {
      // 驾驶员正在转动方向盘
      wheelDelta = steerInput * config.steeringSpeed * dt;
  } else {
      // 自动回正 (Auto-centering / Caster action)
      // 回正速度取决于车速：车速越快，回正力矩越大（简化模型）
      // 即使静止，由于主销内倾，也有微弱回正趋势，但主要靠车速
      const alignFactor = Math.min(1.0, Math.abs(newState.speedKmh) / 10.0) + 0.1;
      const returnSpeed = config.steeringReturnSpeed * alignFactor;
      
      if (newState.steeringWheelAngle > 0) {
          wheelDelta = -Math.min(newState.steeringWheelAngle, returnSpeed * dt);
      } else if (newState.steeringWheelAngle < 0) {
          wheelDelta = Math.min(-newState.steeringWheelAngle, returnSpeed * dt);
      }
  }

  // 3. 应用变化并限制角度
  newState.steeringWheelAngle += wheelDelta;
  newState.steeringWheelAngle = Math.max(-config.maxSteeringWheelAngle, Math.min(config.maxSteeringWheelAngle, newState.steeringWheelAngle));

  // 4. 计算前轮角度 (Ackermann geometry simplified to single wheel)
  // Road Wheel Angle = Steering Wheel Angle / Steering Ratio
  const targetSteerAngleRad = (newState.steeringWheelAngle / config.steeringRatio) * DEG_TO_RAD;
  newState.steerAngle = targetSteerAngleRad;


  // C. 油门/刹车 (Pedals) - 电子延迟
  const rawThrottle = inputs.throttle ? 1.0 : 0.0;
  const rawBrake = inputs.brake ? 1.0 : 0.0;
  
  const throttleResponse = (rawThrottle > newState.throttleInput ? 10.0 : 5.0) / (config.flywheelInertia * 2); 
  const brakeResponse = rawBrake > newState.brakeInput ? 15.0 : 30.0;

  newState.throttleInput += (rawThrottle - newState.throttleInput) * throttleResponse * dt;
  newState.brakeInput += (rawBrake - newState.brakeInput) * brakeResponse * dt;

  if (Math.abs(newState.throttleInput) < 0.01) newState.throttleInput = 0;
  if (Math.abs(newState.brakeInput) < 0.01) newState.brakeInput = 0;

  const effectiveThrottle = Math.pow(newState.throttleInput, 1.4);

  // 基础物理量
  const speedMs = Math.sqrt(newState.velocity.x**2 + newState.velocity.y**2);
  const forwardDot = Math.cos(newState.heading) * newState.velocity.x + Math.sin(newState.heading) * newState.velocity.y;
  const clutchEngagement = 1.0 - newState.clutchPosition;

  let driveForce = 0;
  let engineBrakingForce = 0;

  // ==========================================
  // 2. 动力系统 (Engine & Transmission)
  // ==========================================
  
  let combustionTorque = 0;
  let idleAssistTorque = 0;
  let frictionTorque = 0;
  let pumpingTorque = 0;

  if (newState.engineOn && !newState.stalled) {
      let torqueCurve = 0;
      const peakRPM = config.redlineRPM - 500;
      
      if (newState.rpm < 1000) torqueCurve = 0.6 + (newState.rpm / 1000) * 0.2; 
      else if (newState.rpm < peakRPM) torqueCurve = 0.8 + (newState.rpm - 1000) / (peakRPM - 1000) * 0.2; 
      else torqueCurve = Math.max(0, 1.0 - ((newState.rpm - peakRPM) / 1000)); 

      combustionTorque = config.engineForce * effectiveThrottle * torqueCurve;
      
      // Idle Control
      const targetIdle = config.idleRPM; 
      let feedForward = 0;
      if (newState.gear !== 0 && clutchEngagement > 0.05) {
          const baseLoadEstimate = 40.0; 
          feedForward = baseLoadEstimate * clutchEngagement;
          const fadeStart = targetIdle;
          const fadeEnd = targetIdle + 400;
          if (newState.rpm > fadeStart) {
              const fade = Math.max(0, 1.0 - (newState.rpm - fadeStart) / (fadeEnd - fadeStart));
              feedForward *= fade;
          }
      }

      let feedbackTorque = 0;
      if (newState.rpm < targetIdle) {
          const rpmError = targetIdle - newState.rpm;
          const range = Math.max(100, config.idleRPM - config.stallRPM);
          const severity = rpmError / range;
          const baseKP = 2.0;
          const rescueKP = Math.pow(Math.max(0, severity), 2) * 20.0;
          feedbackTorque = rpmError * (baseKP + rescueKP);
      }

      idleAssistTorque = feedForward + feedbackTorque;
      idleAssistTorque = Math.min(idleAssistTorque, config.engineForce);
  }

  frictionTorque = (newState.rpm / 1000) * 10.0 * config.engineFriction;

  if (effectiveThrottle < 0.05 || !newState.engineOn) {
      pumpingTorque = (newState.rpm / 1000) * 15.0 * config.engineBrakingCoefficient;
  }
  
  if (!newState.engineOn) {
      frictionTorque += 5.0; 
  }

  let netEngineTorque = combustionTorque + idleAssistTorque - frictionTorque - pumpingTorque;

  if (newState.engineOn && newState.rpm > config.maxRPM) {
      netEngineTorque = -frictionTorque * 2; 
  }

  const wheelRPM = (speedMs * 60) / (2 * Math.PI * config.wheelRadius);
  let gearRatio = 0;
  if (newState.gear !== 0) {
      gearRatio = newState.gear === -1 ? -3.0 : config.gearRatios[newState.gear];
  }
  const totalRatio = gearRatio * config.finalDriveRatio;
  const transmissionRPM = Math.abs(wheelRPM * totalRatio); 
  
  let loadTorque = 0;
  
  if (newState.gear !== 0 && clutchEngagement > 0.01) {
      const maxClutchTorque = 1500 * clutchEngagement;
      const rpmDiff = newState.rpm - transmissionRPM;
      let transferTorque = rpmDiff * 2.0; 
      
      if (Math.abs(transferTorque) > maxClutchTorque) {
          transferTorque = maxClutchTorque * Math.sign(rpmDiff);
      }
      
      loadTorque = transferTorque;
      const wheelTorque = transferTorque * Math.abs(totalRatio); 
      
      if (transferTorque > 0) {
           driveForce = (wheelTorque / config.wheelRadius) * Math.sign(totalRatio);
      } else {
           engineBrakingForce = Math.abs(wheelTorque) / config.wheelRadius;
           engineBrakingForce *= Math.sign(forwardDot);
      }
  }

  const totalNetTorque = netEngineTorque - loadTorque;
  const alpha = totalNetTorque / config.flywheelInertia; 
  const rpmChange = alpha * RAD_TO_RPM * dt; 

  newState.rpm += rpmChange;

  if (newState.engineOn && newState.rpm < config.stallRPM && newState.gear !== 0 && clutchEngagement > 0.5) {
     newState.stalled = true;
     newState.engineOn = false;
     newState.rpm = 0; 
  }
  
  if (newState.rpm < 0) newState.rpm = 0;
  
  // ==========================================
  // 3. 车辆动力学 (Vehicle Dynamics)
  // ==========================================
  
  let tractionForce = driveForce - engineBrakingForce;
    
  let brakingForce = 0;
  if (newState.brakeInput > 0.01) {
      brakingForce = config.brakingForce * newState.brakeInput * 25; 
      const velDir = speedMs > 0.05 ? Math.sign(forwardDot) : 0;
      tractionForce -= velDir * brakingForce; 
  }
  
  const dragForce = -config.drag * speedMs * speedMs * Math.sign(forwardDot);
  
  let rollingResistance = 0;
  if (speedMs > 0.1) {
      const normalForce = config.mass * GRAVITY;
      const rollingResistVal = normalForce * ROLLING_RESISTANCE_COEFF;
      rollingResistance = -rollingResistVal * Math.sign(forwardDot);
  }
  
  const totalLongitudinalForce = tractionForce + dragForce + rollingResistance;
  
  const sinAngle = Math.sin(newState.heading);
  const cosAngle = Math.cos(newState.heading);
  
  const acceleration = {
      x: cosAngle * totalLongitudinalForce / config.mass,
      y: sinAngle * totalLongitudinalForce / config.mass
  };
  
  // --- 侧向动力学与惯性 (Lateral Dynamics with Inertia) ---
  
  if (speedMs > 0.1) {
      // 1. 几何角速度 (Kinematic Bicycle Model target)
      let targetAngularVelocity = 0;
      if (Math.abs(newState.steerAngle) > 0.001) {
          const turnRadius = config.wheelBase / Math.sin(newState.steerAngle);
          targetAngularVelocity = speedMs / turnRadius;
      }

      // 2. 角速度平滑 (Yaw Inertia Simulation)
      // 车身是有转动惯量的，不能瞬间达到几何角速度
      // 速度越快，惯性表现越明显（对转向输入的响应越迟钝）
      const yawInertiaFactor = 10.0; // 调节此值改变车身灵活性
      const angularAcc = (targetAngularVelocity - newState.angularVelocity) * yawInertiaFactor;
      newState.angularVelocity += angularAcc * dt;

      // 3. 侧向滑移计算 (Lateral Slip)
      const rightVec = { x: -Math.sin(newState.heading), y: Math.cos(newState.heading) };
      const lateralVelocity = newState.velocity.x * rightVec.x + newState.velocity.y * rightVec.y;
      
      // 侧向阻尼系数 (Lateral Damping) - 模拟轮胎抓地力
      // 简化的轮胎模型：侧向力与侧向速度成正比（线性区）
      const lateralDamping = config.friction * 40.0; 
      
      newState.velocity.x += rightVec.x * -lateralVelocity * lateralDamping * dt;
      newState.velocity.y += rightVec.y * -lateralVelocity * lateralDamping * dt;
  } else {
      newState.angularVelocity = 0;
  }

  newState.velocity.x += acceleration.x * dt;
  newState.velocity.y += acceleration.y * dt;
  
  const isDriving = driveForce > 10;
  const stoppingForce = Math.abs(rollingResistance) + Math.abs(brakingForce) + Math.abs(engineBrakingForce);
  
  if (!isDriving && speedMs < 0.2 && stoppingForce > 0) {
      const deceleration = stoppingForce / config.mass;
      const speedDrop = deceleration * dt;
      
      if (speedDrop > speedMs) {
          newState.velocity = {x: 0, y: 0};
          newState.angularVelocity = 0;
      }
  }

  newState.position.x += newState.velocity.x * dt * 10; 
  newState.position.y += newState.velocity.y * dt * 10;
  newState.heading += newState.angularVelocity * dt;
  
  newState.speedKmh = Math.sqrt(newState.velocity.x**2 + newState.velocity.y**2) * 3.6;
  
  return newState;
};