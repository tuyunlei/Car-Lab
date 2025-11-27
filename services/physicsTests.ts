
import { CarConfig, PhysicsState } from '../types';
import { updatePhysics } from './physicsEngine';
import { DEFAULT_CAR_CONFIG } from '../constants';

// --- Types ---

export interface TestLogEntry {
  frame: number;
  type: 'info' | 'action' | 'check' | 'pass' | 'fail';
  message: string;
  data?: Record<string, number | boolean | string>;
}

export interface TestResult {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  logs: TestLogEntry[];
  error?: string;
  duration: number;
}

class TestContext {
  public logs: TestLogEntry[] = [];
  public state: PhysicsState;
  public config: CarConfig;
  public frame: number = 0;
  public testId: string;
  private _failed: boolean = false;

  constructor(config: CarConfig, testId: string) {
    this.config = { ...config }; // Clone config
    this.testId = testId;
    this.state = {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      heading: 0,
      angularVelocity: 0,
      steerAngle: 0,
      steeringWheelAngle: 0, // NEW: Init
      rpm: 0,
      gear: 0,
      clutchPosition: 1.0, 
      throttleInput: 0,
      brakeInput: 0,
      engineOn: false,
      stalled: false,
      speedKmh: 0
    };
  }

  log(message: string, data?: Record<string, any>) {
    this.logs.push({ frame: this.frame, type: 'info', message, data });
  }

  // 记录具体动作，包含参数快照
  action(actionName: string, durationStr?: string, params?: Record<string, any> | string) {
    let msg = actionName;
    if (durationStr) msg += ` (${durationStr})`;
    
    let contextStr = '';
    if (typeof params === 'string') {
        contextStr = params;
    } else if (params) {
        contextStr = JSON.stringify(params) 
          .replace(/"/g, '')
          .replace(/:/g, ': ')
          .replace(/,/g, ', ');
    } else {
        contextStr = `[G:${this.state.gear}, RPM:${Math.round(this.state.rpm)}]`;
    }

    this.logs.push({ 
      frame: this.frame, 
      type: 'action', 
      message: `${msg} ${contextStr}` 
    });
  }

  simulate(frames: number, inputs: { throttle: boolean; brake: boolean; left: boolean; right: boolean; clutch: boolean }, description?: string, context?: string) {
    if (description) {
        this.action(description, undefined, context);
    }
    
    for (let i = 0; i < frames; i++) {
      this.state = updatePhysics(this.state, this.config, inputs, 0.016);
      this.frame++;
    }
  }

  assert(condition: boolean, message: string) {
    if (condition) {
      this.logs.push({ frame: this.frame, type: 'pass', message: `PASS: ${message}` });
    } else {
      this._failed = true;
      const failMsg = `FAIL: ${message}`;
      this.logs.push({ frame: this.frame, type: 'fail', message: failMsg });
      throw new Error(message);
    }
  }

  expectRPM(min: number, max: number) {
    const val = Math.round(this.state.rpm);
    this.assert(val >= min && val <= max, `RPM ${val} should be between ${min}-${max}`);
  }
}

// --- Test Definitions ---

type TestDefinition = {
  id: string;
  name: string;
  description: string;
  run: (ctx: TestContext) => void;
};

const TESTS: TestDefinition[] = [
  // ==========================================
  // ENG: Engine Subsystem
  // ==========================================
  {
    id: 'ENG-01',
    name: '冷启动与怠速稳定 (Idle Stability)',
    description: '验证引擎点火逻辑，以及PID控制器能否将转速稳定在目标怠速区间。',
    run: (ctx) => {
      const targetIdle = ctx.config.idleRPM;
      
      // 1. Ignition
      ctx.state.engineOn = true;
      ctx.state.rpm = 200; // Starter motor speed
      ctx.simulate(60, { throttle: false, brake: false, left: false, right: false, clutch: true }, 
        '点火启动 (1.0s)', '[油门:0, 离合:分离]');
      
      ctx.assert(ctx.state.rpm > 500, 'Engine should start and exceed cranking RPM');

      // 2. Stabilization
      ctx.simulate(120, { throttle: false, brake: false, left: false, right: false, clutch: true }, 
        '怠速稳定 (2.0s)', '[PID控制介入]');

      ctx.assert(!ctx.state.stalled, 'Engine should not stall');
      ctx.expectRPM(targetIdle - 50, targetIdle + 50);
    }
  },
  {
    id: 'ENG-02',
    name: '空档油门响应 (Throttle Response)',
    description: '测试空档状态下的转速攀升（飞轮惯量）与回落特性。',
    run: (ctx) => {
      ctx.state.engineOn = true;
      ctx.state.rpm = ctx.config.idleRPM;
      ctx.state.clutchPosition = 1.0; 

      const startRPM = ctx.state.rpm;
      
      // 1. Blip
      ctx.simulate(45, { throttle: true, brake: false, left: false, right: false, clutch: true }, 
        '地板油轰油 (0.75s)', '[油门:100%, 档位:N]');
      
      const peakRPM = ctx.state.rpm;
      const rise = peakRPM - startRPM;
      ctx.log(`RPM Delta: +${Math.round(rise)}`);
      
      ctx.assert(rise > 1500, 'RPM should rise significantly (check inertia)');
      
      // 2. Drop
      ctx.simulate(60, { throttle: false, brake: false, left: false, right: false, clutch: true }, 
        '松油回落 (1.0s)', '[油门:0%, 内部摩擦检查]');
      
      ctx.assert(ctx.state.rpm < peakRPM, 'RPM should drop when throttle released');
      ctx.assert(ctx.state.rpm > startRPM - 100, 'RPM should not undershoot idle too much');
    }
  },
  {
    id: 'ENG-03',
    name: '红线断油保护 (Rev Limiter)',
    description: '验证当转速超过红线时，引擎是否会执行断油操作以保护发动机。',
    run: (ctx) => {
      ctx.state.engineOn = true;
      ctx.state.rpm = ctx.config.redlineRPM - 200;
      ctx.state.clutchPosition = 1.0;

      ctx.simulate(90, { throttle: true, brake: false, left: false, right: false, clutch: true }, 
        '持续地板油 (1.5s)', '[试图冲破红线]');

      ctx.log(`Peak RPM: ${Math.round(ctx.state.rpm)} / Limit: ${ctx.config.maxRPM}`);
      
      ctx.assert(ctx.state.rpm <= ctx.config.maxRPM + 150, 'RPM should be capped at Max RPM');
      ctx.assert(ctx.state.rpm >= ctx.config.redlineRPM, 'RPM should reach redline');
    }
  },

  // ==========================================
  // TRN: Transmission & Clutch
  // ==========================================
  {
    id: 'TRN-01',
    name: '强制熄火判定 (Stall Logic)',
    description: '验证当带档停车且不踩离合时，引擎应被车轮强制抱死熄火。',
    run: (ctx) => {
      ctx.state.engineOn = true;
      ctx.state.rpm = ctx.config.idleRPM;
      ctx.state.gear = 1;
      ctx.state.velocity = { x: 0, y: 0 };
      ctx.state.clutchPosition = 0.0; 
      
      ctx.simulate(30, { throttle: false, brake: true, left: false, right: false, clutch: false }, 
        '带档刹停 (0.5s)', '[档位:1, 离合:结合, 刹车:100%]');

      ctx.log(`Final State: Stalled=${ctx.state.stalled}, RPM=${Math.round(ctx.state.rpm)}`);

      ctx.assert(ctx.state.stalled === true, 'Car should be stalled');
      ctx.assert(ctx.state.rpm < 5, `RPM should be ~0 after stall (Got ${ctx.state.rpm.toFixed(2)})`);
    }
  },
  {
    id: 'TRN-02',
    name: '1档起步扭矩 (Launch Torque)',
    description: '验证离合器结合点能否有效传递引擎扭矩驱动车辆。',
    run: (ctx) => {
      ctx.state.engineOn = true;
      ctx.state.rpm = 2500;
      ctx.state.gear = 1;
      ctx.state.clutchPosition = 1.0;

      ctx.simulate(90, { throttle: true, brake: false, left: false, right: false, clutch: false }, 
        '弹射起步 (1.5s)', '[离合:释放中, 油门:100%]');

      const speed = ctx.state.speedKmh;
      ctx.log(`Launch Speed: ${speed.toFixed(1)} km/h`);

      ctx.assert(speed > 15, 'Car should accelerate significantly');
      ctx.assert(!ctx.state.stalled, 'Engine should not stall with enough gas');
    }
  },
  {
    id: 'TRN-03',
    name: '怠速抗熄火 (Anti-Stall / Crawl)',
    description: '验证1档不踩油门慢抬离合时，ECU的怠速救车（提扭矩）能力。',
    run: (ctx) => {
      ctx.state.engineOn = true;
      ctx.state.rpm = ctx.config.idleRPM;
      ctx.state.gear = 1;
      ctx.state.clutchPosition = 1.0;

      ctx.simulate(90, { throttle: false, brake: false, left: false, right: false, clutch: false }, 
        '慢抬离合 (1.5s)', '[油门:0%, 离合:正在结合]');
      
      ctx.log(`Mid State: RPM=${Math.round(ctx.state.rpm)}, Speed=${ctx.state.speedKmh.toFixed(1)}`);
      
      ctx.simulate(60, { throttle: false, brake: false, left: false, right: false, clutch: false }, 
        '怠速蠕行稳定 (1.0s)', '[离合:完全结合]');

      ctx.assert(!ctx.state.stalled, 'Engine should perform idle crawl without stalling');
      ctx.assert(ctx.state.speedKmh > 3, 'Car should be creeping forward');
    }
  },

  // ==========================================
  // DYN: Vehicle Dynamics
  // ==========================================
  {
    id: 'DYN-01',
    name: '滑行阻力对比 (Engine Braking)',
    description: '对比空档滑行与带档滑行的减速度，验证发动机制动效果。',
    run: (ctx) => {
      const initSpeed = 80 / 3.6; 

      // Scenario A: Neutral Coasting
      const ctxA = new TestContext(ctx.config, 'DYN-01-N');
      ctxA.state.engineOn = true;
      ctxA.state.velocity = { x: initSpeed, y: 0 };
      ctxA.state.gear = 0; 
      ctxA.simulate(60, { throttle: false, brake: false, left: false, right: false, clutch: true }, 
        '测试A: 空档滑行 (1s)', '[档位:N]');
      const distA = initSpeed - ctxA.state.velocity.x;

      // Scenario B: In-Gear Coasting (3rd Gear)
      const ctxB = new TestContext(ctx.config, 'DYN-01-G');
      ctxB.state.engineOn = true;
      ctxB.state.velocity = { x: initSpeed, y: 0 };
      ctxB.state.rpm = 4000; 
      ctxB.state.gear = 2; 
      ctxB.state.clutchPosition = 0; 
      ctxB.simulate(60, { throttle: false, brake: false, left: false, right: false, clutch: false }, 
        '测试B: 带档滑行 (1s)', '[档位:2, 高转速]');
      const distB = initSpeed - ctxB.state.velocity.x;

      ctx.log(`Deceleration Delta: Neutral=${distA.toFixed(3)}, In-Gear=${distB.toFixed(3)}`);

      ctx.assert(distB > distA * 1.5, 'Engine braking should provide significantly more drag than neutral rolling');
    }
  },
  {
    id: 'DYN-02',
    name: '制动性能测试 (Braking Dist)',
    description: '测试 60km/h -> 0 的紧急制动时间，验证刹车力度。',
    run: (ctx) => {
      ctx.state.engineOn = true;
      ctx.state.velocity = { x: 60 / 3.6, y: 0 }; // 60 km/h
      
      let stopped = false;
      let time = 0;

      ctx.action('全力刹车', '直到停止', '[刹车:100%, 离合:分离]');

      for(let i=0; i<300; i++) { 
        ctx.state = updatePhysics(ctx.state, ctx.config, { throttle: false, brake: true, left: false, right: false, clutch: true }, 0.016);
        time += 0.016;
        if(ctx.state.speedKmh < 0.5) {
          stopped = true;
          break;
        }
      }

      ctx.log(`Stop Time: ${time.toFixed(2)}s`);
      
      ctx.assert(stopped, 'Car failed to stop in 5s');
      ctx.assert(time < 3.5, 'Braking took too long (>3.5s)');
      ctx.assert(time > 1.0, 'Braking too abrupt (<1.0s), check physics');
    }
  },
  // NEW TEST for Steering
  {
    id: 'DYN-03',
    name: '转向线性度 (Steering Smoothness)',
    description: '验证按键转向时方向盘角度的积分过程，而非瞬移。',
    run: (ctx) => {
      ctx.state.engineOn = true;
      ctx.state.steeringWheelAngle = 0;
      
      // 1. Check instant change (Should NOT happen)
      ctx.simulate(1, { throttle: false, brake: false, left: false, right: true, clutch: false }, 
        '按下右转 (16ms)', '[方向盘:0° -> ?]');
        
      const angleAfter1Frame = ctx.state.steeringWheelAngle;
      ctx.log(`Angle after 16ms: ${angleAfter1Frame.toFixed(2)}°`);
      
      // Max possible change in 16ms with speed 400deg/s is ~6.4deg
      ctx.assert(angleAfter1Frame > 0, 'Steering wheel should move');
      ctx.assert(angleAfter1Frame < 20, 'Steering wheel moved too fast (should be gradual)');

      // 2. Check continuous movement
      ctx.simulate(30, { throttle: false, brake: false, left: false, right: true, clutch: false }, 
        '持续按住 (0.5s)', '[方向盘积分]');
      
      const angleAfterHalfSec = ctx.state.steeringWheelAngle;
      ctx.log(`Angle after 0.5s: ${angleAfterHalfSec.toFixed(2)}°`);
      
      ctx.assert(angleAfterHalfSec > angleAfter1Frame * 10, 'Steering wheel should continue rotating');
      
      // 3. Check limit
      ctx.simulate(120, { throttle: false, brake: false, left: false, right: true, clutch: false }, 
        '打死方向 (2.0s)', '[检查机械限位]');
      
      ctx.assert(ctx.state.steeringWheelAngle <= ctx.config.maxSteeringWheelAngle, 'Should hit max limit');
    }
  }
];

export const runAllTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  for (const test of TESTS) {
    const ctx = new TestContext(DEFAULT_CAR_CONFIG, test.id);
    const start = performance.now();
    let passed = false;
    let errorMsg = undefined;

    try {
      test.run(ctx);
      passed = true;
    } catch (e: any) {
      passed = false;
      errorMsg = e.message;
      const lastLog = ctx.logs[ctx.logs.length - 1];
      if (!lastLog || lastLog.type !== 'fail') {
          ctx.logs.push({ frame: ctx.frame, type: 'fail', message: `Unexpected Error: ${e.message}` });
      }
      console.error(
        `[PhysicsTest:${test.id}] FAIL: ${errorMsg} | State: ${JSON.stringify({
           frame: ctx.frame,
           rpm: Math.round(ctx.state.rpm),
           speed: ctx.state.speedKmh.toFixed(2),
           gear: ctx.state.gear,
           clutch: ctx.state.clutchPosition.toFixed(2),
           stalled: ctx.state.stalled,
           steer: ctx.state.steeringWheelAngle.toFixed(1)
        })}`
      );
    }

    results.push({
      id: test.id,
      name: test.name,
      description: test.description,
      passed,
      logs: ctx.logs,
      error: errorMsg,
      duration: performance.now() - start
    });
    
    await new Promise(r => setTimeout(r, 2));
  }

  return results;
};