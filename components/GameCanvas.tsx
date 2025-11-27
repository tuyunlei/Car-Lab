
import React, { useRef, useEffect, useState } from 'react';
import { PhysicsState, CarConfig, LevelData, MapObject, Vector2 } from '../types';
import { updatePhysics } from '../services/physicsEngine';
import { DEFAULT_CAR_CONFIG, KEYS } from '../constants';
import { Dashboard } from './Dashboard';

interface GameCanvasProps {
  level: LevelData;
  mode: 'LEVELS' | 'SANDBOX';
  onCarUpdate?: (config: CarConfig) => void;
  carConfig: CarConfig;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ level, mode, carConfig }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  const physicsStateRef = useRef<PhysicsState>({
    position: { ...level.startPos },
    velocity: { x: 0, y: 0 },
    heading: level.startHeading,
    angularVelocity: 0,
    steerAngle: 0,
    steeringWheelAngle: 0, 
    rpm: 0,
    lastRpm: 0, // NEW: Init
    gear: 0,
    clutchPosition: 0,
    throttleInput: 0,
    brakeInput: 0,
    idleEngineIntegral: 0,
    engineOn: false,
    stalled: false,
    speedKmh: 0
  });

  const inputsRef = useRef({
    throttle: false,
    brake: false,
    left: false,
    right: false,
    clutch: false
  });

  const [dashboardState, setDashboardState] = useState<PhysicsState>(physicsStateRef.current);
  const [message, setMessage] = useState<string>('');

  // Handle Inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling with arrow keys
      if ([KEYS.THROTTLE, KEYS.BRAKE, KEYS.LEFT, KEYS.RIGHT].includes(e.key)) {
          e.preventDefault();
      }

      switch (e.key) {
        case KEYS.THROTTLE: inputsRef.current.throttle = true; break;
        case KEYS.BRAKE: inputsRef.current.brake = true; break;
        case KEYS.LEFT: inputsRef.current.left = true; break;
        case KEYS.RIGHT: inputsRef.current.right = true; break;
        case KEYS.CLUTCH: inputsRef.current.clutch = true; break;
        case KEYS.START_ENGINE:
            if (!physicsStateRef.current.engineOn) {
                physicsStateRef.current.engineOn = true;
                physicsStateRef.current.stalled = false;
                physicsStateRef.current.rpm = 1000;
                physicsStateRef.current.lastRpm = 1000;
                physicsStateRef.current.idleEngineIntegral = 0; // Reset integral on start
                setMessage("引擎启动");
                setTimeout(() => setMessage(''), 2000);
            } else {
                physicsStateRef.current.engineOn = false;
                setMessage("引擎关闭");
                setTimeout(() => setMessage(''), 2000);
            }
            break;
        case KEYS.SHIFT_UP:
            if (physicsStateRef.current.clutchPosition > 0.5) {
                const nextGear = physicsStateRef.current.gear + 1;
                if (nextGear < DEFAULT_CAR_CONFIG.gearRatios.length) {
                     physicsStateRef.current.gear = nextGear;
                }
            } else {
                setMessage("请踩下离合器换挡!");
                setTimeout(() => setMessage(''), 1000);
            }
            break;
        case KEYS.SHIFT_DOWN:
             if (physicsStateRef.current.clutchPosition > 0.5) {
                const prevGear = physicsStateRef.current.gear - 1;
                if (prevGear >= -1) { 
                     physicsStateRef.current.gear = prevGear;
                }
            } else {
                setMessage("请踩下离合器换挡!");
                setTimeout(() => setMessage(''), 1000);
            }
            break;
        case KEYS.RESET:
            resetCar();
            break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case KEYS.THROTTLE: inputsRef.current.throttle = false; break;
        case KEYS.BRAKE: inputsRef.current.brake = false; break;
        case KEYS.LEFT: inputsRef.current.left = false; break;
        case KEYS.RIGHT: inputsRef.current.right = false; break;
        case KEYS.CLUTCH: inputsRef.current.clutch = false; break;
      }
    };

    // Safety: Clear inputs on window blur (alt-tab, clicking outside)
    const handleBlur = () => {
        inputsRef.current = {
            throttle: false,
            brake: false,
            left: false,
            right: false,
            clutch: false
        };
        // Also force physics state inputs to 0 to prevent sticking
        physicsStateRef.current.throttleInput = 0;
        physicsStateRef.current.brakeInput = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Reset Logic
  const resetCar = () => {
      physicsStateRef.current = {
        position: { ...level.startPos },
        velocity: { x: 0, y: 0 },
        heading: level.startHeading,
        angularVelocity: 0,
        steerAngle: 0,
        steeringWheelAngle: 0, 
        rpm: 0,
        lastRpm: 0,
        gear: 0,
        clutchPosition: 0,
        throttleInput: 0,
        brakeInput: 0,
        idleEngineIntegral: 0, // NEW: Reset
        engineOn: false,
        stalled: false,
        speedKmh: 0
      };
      // Reset inputs as well to be safe
      inputsRef.current = { throttle: false, brake: false, left: false, right: false, clutch: false };
      setMessage("重置车辆");
      setTimeout(() => setMessage(''), 2000);
  };

  useEffect(() => {
      resetCar();
  }, [level]);

  // Main Game Loop
  const tick = (time: number) => {
    const dt = 0.016; 
    
    physicsStateRef.current = updatePhysics(physicsStateRef.current, carConfig, inputsRef.current, dt);

    checkCollisions(physicsStateRef.current, level.objects);
    
    render(physicsStateRef.current);
    
    setDashboardState({...physicsStateRef.current});

    requestRef.current = requestAnimationFrame(tick);
  };

  const checkCollisions = (car: PhysicsState, objects: MapObject[]) => {
      const carRadius = 20; 
      
      objects.forEach(obj => {
          if (obj.type === 'wall') {
             const carLeft = car.position.x - carRadius;
             const carRight = car.position.x + carRadius;
             const carTop = car.position.y - carRadius;
             const carBottom = car.position.y + carRadius;
             
             const objLeft = obj.x;
             const objRight = obj.x + obj.width;
             const objTop = obj.y;
             const objBottom = obj.y + obj.height;
             
             if (carRight > objLeft && carLeft < objRight && carBottom > objTop && carTop < objBottom) {
                 car.velocity = { x: -car.velocity.x * 0.5, y: -car.velocity.y * 0.5 };
                 car.engineOn = false;
                 car.stalled = true;
                 setMessage("碰撞! 引擎熄火");
             }
          } else if (obj.type === 'parking-spot' && obj.target) {
              const dx = Math.abs(car.position.x - (obj.x + obj.width/2));
              const dy = Math.abs(car.position.y - (obj.y + obj.height/2));
              if (dx < obj.width/2 - 10 && dy < obj.height/2 - 10 && car.speedKmh < 1 && car.brakeInput > 0.9) {
                  setMessage("任务完成! 完美停车");
              }
          }
      });
  };

  const render = (state: PhysicsState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Camera follow
    ctx.save();
    ctx.translate(canvas.width / 2 - state.position.x, canvas.height / 2 - state.position.y);

    drawGrid(ctx, state.position);
    level.objects.forEach(obj => drawObject(ctx, obj));
    drawCar(ctx, state, carConfig);

    ctx.restore();
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, center: Vector2) => {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const gridSize = 100;
      const startX = Math.floor((center.x - 1000) / gridSize) * gridSize;
      const startY = Math.floor((center.y - 1000) / gridSize) * gridSize;
      
      ctx.beginPath();
      for (let x = startX; x < startX + 2000; x += gridSize) {
          ctx.moveTo(x, startY);
          ctx.lineTo(x, startY + 2000);
      }
      for (let y = startY; y < startY + 2000; y += gridSize) {
          ctx.moveTo(startX, y);
          ctx.lineTo(startX + 2000, y);
      }
      ctx.stroke();
  };

  const drawObject = (ctx: CanvasRenderingContext2D, obj: MapObject) => {
      ctx.save();
      ctx.translate(obj.x + obj.width/2, obj.y + obj.height/2);
      ctx.rotate(obj.rotation);
      
      if (obj.type === 'wall') {
          ctx.fillStyle = '#475569';
          ctx.fillRect(-obj.width/2, -obj.height/2, obj.width, obj.height);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.strokeRect(-obj.width/2, -obj.height/2, obj.width, obj.height);
      } else if (obj.type === 'parking-spot') {
          ctx.strokeStyle = obj.target ? '#4ade80' : '#ffffff';
          ctx.lineWidth = 4;
          ctx.setLineDash([10, 5]);
          ctx.strokeRect(-obj.width/2, -obj.height/2, obj.width, obj.height);
          ctx.fillStyle = obj.target ? 'rgba(74, 222, 128, 0.1)' : 'transparent';
          ctx.fillRect(-obj.width/2, -obj.height/2, obj.width, obj.height);
          ctx.setLineDash([]);
      }
      ctx.restore();
  };

  const drawCar = (ctx: CanvasRenderingContext2D, state: PhysicsState, config: CarConfig) => {
    ctx.save();
    ctx.translate(state.position.x, state.position.y);
    ctx.rotate(state.heading);

    const pxPerMeter = 20; 
    const w = config.width * pxPerMeter;
    const l = config.length * pxPerMeter;
    const wb = config.wheelBase * pxPerMeter;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-l/2 + 4, -w/2 + 4, l, w);

    const wheelW = 8;
    const wheelL = 16;
    ctx.fillStyle = '#000';
    
    ctx.fillRect(-wb/2 - wheelL/2, -w/2 - 2, wheelL, wheelW); 
    ctx.fillRect(-wb/2 - wheelL/2, w/2 + 2 - wheelW, wheelL, wheelW); 

    ctx.save();
    ctx.translate(wb/2, -w/2);
    ctx.rotate(state.steerAngle); 
    ctx.fillRect(-wheelL/2, -2, wheelL, wheelW);
    ctx.restore();

    ctx.save();
    ctx.translate(wb/2, w/2);
    ctx.rotate(state.steerAngle);
    ctx.fillRect(-wheelL/2, 2 - wheelW, wheelL, wheelW);
    ctx.restore();

    ctx.fillStyle = '#3b82f6'; 
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.roundRect(-l/2, -w/2, l, w, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e293b'; 
    ctx.fillRect(0, -w/2 + 4, l/4, w - 8);

    ctx.fillStyle = '#fef08a'; 
    ctx.fillRect(l/2 - 2, -w/2 + 4, 2, 8);
    ctx.fillRect(l/2 - 2, w/2 - 12, 2, 8);

    if (state.brakeInput > 0.1) {
        ctx.fillStyle = '#ef4444'; 
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
    } else {
        ctx.fillStyle = '#7f1d1d'; 
        ctx.shadowBlur = 0;
    }
    ctx.fillRect(-l/2, -w/2 + 4, 2, 8);
    ctx.fillRect(-l/2, w/2 - 12, 2, 8);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [carConfig, level]);

  return (
    <div className="relative w-full h-full bg-[#0f172a] overflow-hidden cursor-crosshair">
      <canvas 
        ref={canvasRef} 
        width={window.innerWidth} 
        height={window.innerHeight}
        className="block"
      />
      
      <div className="absolute top-0 left-0 p-4 pointer-events-none">
         <h1 className="text-2xl font-bold text-slate-200">{level.name}</h1>
         <p className="text-slate-400 max-w-md mt-2 text-sm">{level.description}</p>
         <div className="mt-4 bg-slate-800/80 p-4 rounded border border-slate-700 text-sm font-mono whitespace-pre-line text-slate-300">
             {level.instructions}
         </div>
         {message && (
             <div className="mt-4 p-3 bg-blue-600/90 text-white font-bold rounded animate-bounce">
                 {message}
             </div>
         )}
      </div>

      <div className="absolute top-4 right-4 text-right pointer-events-none opacity-50">
          <div className="text-xs text-slate-500">ENGINEERING DEBUG</div>
          <div className="font-mono text-xs text-slate-400">
              POS: {dashboardState.position.x.toFixed(1)}, {dashboardState.position.y.toFixed(1)} <br/>
              HDG: {(dashboardState.heading * 180 / Math.PI).toFixed(1)}° <br/>
              CLUTCH: {dashboardState.clutchPosition.toFixed(2)} <br/>
              STALLED: {dashboardState.stalled ? 'YES' : 'NO'} <br/>
              STEER: {dashboardState.steeringWheelAngle.toFixed(0)}° / {(dashboardState.steerAngle * 180 / Math.PI).toFixed(1)}° <br/>
              CONFIG: {carConfig.name}
          </div>
      </div>

      <Dashboard state={dashboardState} config={carConfig} />
    </div>
  );
};
