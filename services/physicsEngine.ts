

import { CarConfig, PhysicsState, Vector2 } from '../types';

const RAD_TO_RPM = 9.5493; // 60 / (2 * PI)
const DEG_TO_RAD = Math.PI / 180;
const GRAVITY = 9.81; // m/s^2
const ROLLING_RESISTANCE_COEFF = 0.02; 
const AIR_DENSITY = 1.225; 

// Helper: Rotate vector
const rotate = (v: {x: number, y: number}, angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: v.x * cos - v.y * sin,
        y: v.x * sin + v.y * cos
    };
};

export const updatePhysics = (
  state: PhysicsState,
  config: CarConfig,
  inputs: { throttle: boolean; brake: boolean; left: boolean; right: boolean; clutch: boolean },
  dt: number
): PhysicsState => {
  const newState = { ...state };
  
  // ==========================================
  // 1. 输入系统 (Inputs)
  // ==========================================
  
  // A. 离合器
  const clutchTarget = inputs.clutch ? 1.0 : 0.0;
  // RESTORED: 恢复到正常的离合器操作速度 (3.0)，因为新的惯量模型不需要靠慢离合来作弊了
  const clutchSpeed = inputs.clutch ? 8.0 : 3.0; 
  if (newState.clutchPosition < clutchTarget) {
     newState.clutchPosition = Math.min(clutchTarget, newState.clutchPosition + clutchSpeed * dt);
  } else {
     newState.clutchPosition = Math.max(clutchTarget, newState.clutchPosition - clutchSpeed * dt);
  }
  const clutchEngagement = 1.0 - newState.clutchPosition;
  // Quadratic curve for smoother torque/inertia blending
  const effectiveClutch = clutchEngagement * clutchEngagement;

  // B. 转向系统 (Steering Wheel)
  let steerInput = 0;
  if (inputs.left) steerInput -= 1;
  if (inputs.right) steerInput += 1;

  let wheelDelta = 0;
  if (steerInput !== 0) {
      wheelDelta = steerInput * config.steeringSpeed * dt;
  } else {
      // 自动回正
      const alignFactor = Math.min(1.0, Math.abs(newState.speedKmh) / 10.0) + 0.1;
      const returnSpeed = config.steeringReturnSpeed * alignFactor;
      if (newState.steeringWheelAngle > 0) {
          wheelDelta = -Math.min(newState.steeringWheelAngle, returnSpeed * dt);
      } else if (newState.steeringWheelAngle < 0) {
          wheelDelta = Math.min(-newState.steeringWheelAngle, returnSpeed * dt);
      }
  }

  newState.steeringWheelAngle += wheelDelta;
  newState.steeringWheelAngle = Math.max(-config.maxSteeringWheelAngle, Math.min(config.maxSteeringWheelAngle, newState.steeringWheelAngle));

  const targetSteerAngleRad = (newState.steeringWheelAngle / config.steeringRatio) * DEG_TO_RAD;
  newState.steerAngle = targetSteerAngleRad;


  // C. 油门刹车 & 电子节气门控制 (ETC)
  const rawThrottlePedal = inputs.throttle ? 1.0 : 0.0;
  const rawBrake = inputs.brake ? 1.0 : 0.0;
  
  // --- PID + Feedforward 怠速控制 ---
  let ecuIdleThrottle = 0;
  
  if (newState.engineOn && !newState.stalled) {
      const targetRPM = config.idleRPM;
      const error = targetRPM - newState.rpm;
      
      // 1. 基础前馈: 抵消内部摩擦
      const baseFeedforward = 0.15; 
      
      // 2. 离合器负载前馈
      // 由于引入了等效惯量，转速下降变慢，不再需要极端的预判给油
      // 降低前馈系数，让PID自然介入
      let clutchFeedforward = 0;
      if (newState.gear !== 0) {
         clutchFeedforward = clutchEngagement * 0.6; // Slightly increased from 0.4
      }
      
      // 3. PID 控制器
      // 降低 P 值，因为惯性大，系统天然稳定，不需要高频修正
      const kP = 0.01; // Reduced from 0.02
      const kI = 0.15; 
      const kD = 0.002; 
      const rpmRate = (newState.rpm - state.lastRpm) / dt;

      newState.idleEngineIntegral += error * dt;
      const maxIntegral = 0.5;
      newState.idleEngineIntegral = Math.max(-maxIntegral, Math.min(maxIntegral, newState.idleEngineIntegral));

      const pTerm = error * kP;
      const iTerm = newState.idleEngineIntegral * kI;
      const dTerm = -rpmRate * kD; 

      ecuIdleThrottle = baseFeedforward + clutchFeedforward + pTerm + iTerm + dTerm;
      ecuIdleThrottle = Math.max(0, Math.min(0.8, ecuIdleThrottle));
  } else {
      newState.idleEngineIntegral = 0;
  }

  const targetThrottle = Math.max(rawThrottlePedal, ecuIdleThrottle);
  
  // 进气歧管滞后模拟
  const throttleRiseSpeed = 20.0; 
  const throttleFallSpeed = 10.0; 
  const throttleSpeed = targetThrottle > newState.throttleInput ? throttleRiseSpeed : throttleFallSpeed;
  newState.throttleInput += (targetThrottle - newState.throttleInput) * throttleSpeed * dt;
  
  const brakeResponse = rawBrake > newState.brakeInput ? 15.0 : 30.0;
  newState.brakeInput += (rawBrake - newState.brakeInput) * brakeResponse * dt;
  
  if (Math.abs(newState.throttleInput) < 0.001) newState.throttleInput = 0;
  if (Math.abs(newState.brakeInput) < 0.001) newState.brakeInput = 0;

  const effectiveThrottle = Math.pow(newState.throttleInput, 1.2);

  // ==========================================
  // 2. 动力传动系统 (Powertrain - Equivalent Inertia Model)
  // ==========================================
  
  const speedMs = Math.sqrt(newState.velocity.x**2 + newState.velocity.y**2);
  const cosHeading = Math.cos(newState.heading);
  const sinHeading = Math.sin(newState.heading);
  const velocityLongitudinal = newState.velocity.x * cosHeading + newState.velocity.y * sinHeading; 

  // 2.1 传动比
  let gearRatio = 0;
  if (newState.gear !== 0) {
      gearRatio = newState.gear === -1 ? -3.0 : config.gearRatios[newState.gear];
  }
  const totalRatio = gearRatio * config.finalDriveRatio;
  
  // 2.2 转速计算
  const wheelRPM = (velocityLongitudinal * 60) / (2 * Math.PI * config.wheelRadius);
  const transmissionRPM = wheelRPM * totalRatio; 
  
  // 2.3 引擎扭矩
  let netEngineTorque = 0;
  let engineInternalFriction = (newState.rpm / 1000) * 10.0 * config.engineFriction;
  
  if (newState.engineOn && !newState.stalled) {
      let torqueCurve = 0;
      const peakRPM = config.redlineRPM - 500;
      if (newState.rpm < 1000) torqueCurve = 0.6 + (newState.rpm / 1000) * 0.2; 
      else if (newState.rpm < peakRPM) torqueCurve = 0.8 + (newState.rpm - 1000) / (peakRPM - 1000) * 0.2; 
      else torqueCurve = Math.max(0, 1.0 - ((newState.rpm - peakRPM) / 1000)); 

      const combustionTorque = config.engineForce * effectiveThrottle * torqueCurve;
      
      netEngineTorque = combustionTorque - engineInternalFriction;

      if (newState.rpm > config.maxRPM) netEngineTorque = -engineInternalFriction * 5;
      
      if (effectiveThrottle < 0.05) {
           netEngineTorque -= (newState.rpm / 1000) * 15.0 * config.engineBrakingCoefficient;
      }
  } else {
      netEngineTorque = -engineInternalFriction - 50;
      if (newState.stalled) {
          netEngineTorque = -600; 
      }
  }

  // 2.4 离合器与惯量模型
  let propulsionForce = 0;
  let engineResistanceForce = 0;
  
  const clutchMaxTorque = config.engineForce * 2.5 * effectiveClutch;
  const rpmDiff = newState.rpm - transmissionRPM;
  
  // 锁止判定
  const isLocked = newState.gear !== 0 && clutchEngagement > 0.9 && Math.abs(rpmDiff) < 200;

  // --- CORE: 等效惯量计算 (Equivalent Inertia Calculation) ---
  // 当离合器结合时，车身质量通过传动比折算到引擎飞轮上。
  // I_reflected = I_vehicle / Ratio^2
  // I_vehicle = mass * r^2
  let reflectedInertia = 0;
  if (newState.gear !== 0 && Math.abs(totalRatio) > 0.1) {
      const vehicleRotationalInertia = config.mass * Math.pow(config.wheelRadius, 2);
      reflectedInertia = vehicleRotationalInertia / Math.pow(totalRatio, 2);
  }
  
  // 系统的总转动惯量 = 引擎飞轮 + (折算后的车身惯量 * 离合器结合度)
  // 这就是解决"熄火炼丹"的根本：随着离合结合，系统惯量变大，同样的阻力矩导致的转速下降率变小。
  const systemInertia = config.flywheelInertia + (reflectedInertia * effectiveClutch);


  if (newState.gear === 0 || clutchEngagement < 0.01) {
      // 空档/踩死离合：只有飞轮惯量
      const alpha = netEngineTorque / config.flywheelInertia;
      newState.rpm += alpha * RAD_TO_RPM * dt;

  } else if (isLocked) {
      // 锁止状态：物理连接
      const rawForce = (netEngineTorque * totalRatio) / config.wheelRadius;
      
      if (netEngineTorque > 0) {
          propulsionForce = rawForce;
      } else {
          engineResistanceForce = Math.abs(rawForce);
      }

  } else {
      // 打滑状态：使用等效惯量模型进行积分
      const slipSign = Math.sign(rpmDiff); 
      const transmittedTorque = clutchMaxTorque * slipSign;
      
      const loadOnEngine = transmittedTorque;
      
      // CRITICAL: 使用 systemInertia 而不是 config.flywheelInertia
      // 这让引擎在半联动时"感觉"到了车身的重量，从而不会瞬间掉转速
      const alpha = (netEngineTorque - loadOnEngine) / systemInertia;
      newState.rpm += alpha * RAD_TO_RPM * dt;
      
      const torqueAtWheels = transmittedTorque * totalRatio;
      const forceAtWheels = torqueAtWheels / config.wheelRadius;
      
      if (netEngineTorque < 0) {
          engineResistanceForce = Math.abs(forceAtWheels);
      } else {
          propulsionForce = forceAtWheels;
      }
  }

  if (newState.rpm < 0) newState.rpm = 0;


  // ==========================================
  // 3. 车辆动力学
  // ==========================================
  
  const distFront = config.wheelBase * (1.0 - config.frontWeightDistribution);
  const distRear = config.wheelBase * config.frontWeightDistribution; 
  const r = newState.angularVelocity;
  const v_x = velocityLongitudinal;
  const v_y = -newState.velocity.x * sinHeading + newState.velocity.y * cosHeading;

  let F_yf = 0; 
  let F_yr = 0; 
  const minSpeedForDynamics = 2.0;

  if (Math.abs(v_x) > 0.1) {
      const alpha_f = Math.atan2((v_y + distFront * r), Math.abs(v_x)) - newState.steerAngle * Math.sign(v_x);
      const alpha_r = Math.atan2((v_y - distRear * r), Math.abs(v_x));
      
      const F_zf = config.mass * GRAVITY * (distRear / config.wheelBase);
      const F_zr = config.mass * GRAVITY * (distFront / config.wheelBase);

      const tireModel = (stiffness: number, alpha: number, load: number) => {
          const maxForce = load * config.friction;
          const force = -stiffness * alpha;
          if (Math.abs(force) > maxForce) return maxForce * Math.sign(force);
          return force;
      };
      F_yf = tireModel(config.tireStiffnessFront, alpha_f, F_zf);
      F_yr = tireModel(config.tireStiffnessRear, alpha_r, F_zr);
  }

  let totalResistiveForce = 0;
  if (newState.brakeInput > 0.01) {
      totalResistiveForce += config.brakingForce * newState.brakeInput * 25; 
  }
  totalResistiveForce += engineResistanceForce;
  
  const maxStoppingForce = (config.mass * Math.abs(v_x)) / dt;
  const clampedResistiveForce = Math.min(totalResistiveForce, maxStoppingForce);
  
  const F_resist_longitudinal = clampedResistiveForce * Math.sign(v_x);
  
  const F_rr = -ROLLING_RESISTANCE_COEFF * config.mass * GRAVITY * Math.sign(v_x);
  const F_drag = -config.drag * v_x * Math.abs(v_x);
  
  const F_traction = propulsionForce; 
  
  const F_x_total = F_traction - F_resist_longitudinal + F_drag + F_rr;

  const acc_x_dyn = (F_x_total - F_yf * Math.sin(newState.steerAngle)) / config.mass + r * v_y;
  const acc_y_dyn = (F_yf * Math.cos(newState.steerAngle) + F_yr) / config.mass - r * v_x;
  const alpha_dyn = (distFront * F_yf * Math.cos(newState.steerAngle) - distRear * F_yr) / config.momentOfInertia;

  let acc_x_kin = acc_x_dyn;
  let acc_y_kin = 0;
  let alpha_kin = 0;
  
  if (Math.abs(v_x) < minSpeedForDynamics + 1.0) {
      const beta = Math.atan((distRear / config.wheelBase) * Math.tan(newState.steerAngle));
      const targetYawRate = (v_x / config.wheelBase) * Math.cos(beta) * Math.tan(newState.steerAngle);
      const target_v_y = v_x * Math.tan(beta);
      
      acc_y_kin = (target_v_y - v_y) * 10.0; 
      alpha_kin = (targetYawRate - r) * 20.0; 
      
      if (Math.abs(v_x) < 0.1 && Math.abs(F_traction) < 10) {
          acc_y_kin = -v_y * 10;
          alpha_kin = -r * 10;
          acc_x_kin = -v_x * 10;
      }
  }

  let blendFactor = 0;
  if (Math.abs(v_x) > minSpeedForDynamics) {
      blendFactor = Math.min(1.0, (Math.abs(v_x) - minSpeedForDynamics) / 2.0);
  }

  const acc_x = acc_x_dyn; 
  const acc_y = acc_y_kin * (1 - blendFactor) + acc_y_dyn * blendFactor;
  const angular_acc = alpha_kin * (1 - blendFactor) + alpha_dyn * blendFactor;

  const next_v_x = v_x + acc_x * dt;
  const next_v_y = v_y + acc_y * dt;
  const next_r = r + angular_acc * dt;
  
  newState.heading += next_r * dt;
  newState.angularVelocity = next_r;
  
  const nextCosH = Math.cos(newState.heading);
  const nextSinH = Math.sin(newState.heading);
  
  newState.velocity.x = next_v_x * nextCosH - next_v_y * nextSinH;
  newState.velocity.y = next_v_x * nextSinH + next_v_y * nextCosH;
  
  newState.position.x += newState.velocity.x * dt * 10;
  newState.position.y += newState.velocity.y * dt * 10;

  newState.speedKmh = Math.sqrt(newState.velocity.x**2 + newState.velocity.y**2) * 3.6;

  if (isLocked) {
      const forwardSpeed = newState.velocity.x * nextCosH + newState.velocity.y * nextSinH;
      const newWheelRPM = (forwardSpeed * 60) / (2 * Math.PI * config.wheelRadius);
      const newTransRPM = newWheelRPM * totalRatio;
      newState.rpm = Math.abs(newTransRPM);
  }

  if (newState.engineOn && newState.gear !== 0 && clutchEngagement > 0.5) {
      if (newState.rpm < config.stallRPM) {
          newState.stalled = true;
          newState.engineOn = false;
      }
  }

  newState.lastRpm = newState.rpm;

  return newState;
};
