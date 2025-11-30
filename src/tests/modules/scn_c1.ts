
import { TestDefinition } from '../types';
import { ScenarioContext } from '../context';
import { CAR_PRESETS } from '../../config/cars';
import { simulateLaunchSequence } from '../helpers';

export const C1_SCENARIOS: TestDefinition[] = [
    {
        id: 'SCN-C1-CREEP-01',
        category: 'SCENARIO',
        name: 'test.scn_c1_creep.name',
        description: 'test.scn_c1_creep.desc',
        steps: [
            'test.scn_c1_creep.s1',
            'test.scn_c1_creep.s2',
            'test.scn_c1_creep.s3'
        ],
        run: (ctx: ScenarioContext) => {
            // Force C1 Config
            ctx.config = CAR_PRESETS.C1_TRAINER;
            
            // 1. Init: Neutral, Idle, Clutch Pressed
            ctx.state.engineOn = true;
            ctx.state.rpm = 800;
            ctx.state.gear = 0;
            ctx.state.clutchPosition = 1.0; 
            ctx.state.brakeInput = 0;
            ctx.state.throttleInput = 0;
            
            ctx.action('Shift 1st & Release Clutch (No Throttle)...', { key: 'action.creeping' });

            // 2. Shift to 1st
            ctx.state.gear = 1;

            // 3. Realistic Release: 1.0s release time, 0% Throttle
            simulateLaunchSequence(ctx, {
                targetThrottle: 0.0,
                clutchReleaseFrames: 60,
                holdFrames: 120 // Allow 2s to settle
            });
            
            const v = ctx.state.localVelocity.x;
            const rpm = ctx.state.rpm;
            
            // C1 Creep target: ~5-8 km/h (1.4 - 2.2 m/s)
            ctx.log(
                `Creep Speed: ${v.toFixed(2)} m/s, RPM: ${rpm.toFixed(0)}`,
                undefined,
                { key: 'log.scn.velocity', params: { v: v.toFixed(2), rpm: rpm.toFixed(0) } }
            );

            // Assert positive direction (forward) and reasonable creep speed
            ctx.assert(v > 0.5, 'Car creeps forward (> 0.5 m/s)', { key: 'assert.c1.creep_speed' });
            ctx.assert(v < 3.0, 'Car does not accelerate uncontrollably', { key: 'assert.scn.rpm_healthy' });
            ctx.assert(rpm > 600, 'Engine maintains idle under load', { key: 'assert.c1.creep_rpm' });
            ctx.assert(!ctx.state.stalled, 'Engine does not stall', { key: 'assert.scn.no_stall' });
        }
    },
    {
        id: 'SCN-C1-STALL-01',
        category: 'SCENARIO',
        name: 'test.scn_c1_stall.name',
        description: 'test.scn_c1_stall.desc',
        steps: [
            'test.scn_c1_stall.s1',
            'test.scn_c1_stall.s2',
            'test.scn_c1_stall.s3'
        ],
        run: (ctx: ScenarioContext) => {
            // Force C1 Config
            ctx.config = CAR_PRESETS.C1_TRAINER;

            ctx.state.engineOn = true;
            ctx.state.rpm = 800;
            ctx.state.gear = 1;
            ctx.state.localVelocity.x = 2.0; // Moving slightly
            ctx.state.clutchPosition = 0.0;
            ctx.state.isClutchLocked = true;
            
            ctx.action('Slamming brakes without clutch...', { key: 'action.brake_stall' });
            
            // Simulate heavy braking without clutch
            // The anti-stall should TRY to help, but fail against the brakes
            // The auto-clutch assist is OFF, so it should stay locked until death
            for(let i=0; i<60; i++) {
                ctx.simulate(1, { brake: true, clutch: false });
                if (ctx.state.stalled) break;
            }
            
            ctx.log(
                `Final RPM: ${ctx.state.rpm.toFixed(0)}, Stalled: ${ctx.state.stalled}`,
                undefined,
                { key: 'log.c1.stall_status', params: { rpm: ctx.state.rpm.toFixed(0), stalled: ctx.state.stalled.toString() } }
            );

            ctx.assert(ctx.state.stalled, 'Engine stalled as expected', { key: 'assert.c1.stalled' });
            ctx.assert(ctx.state.rpm < 300, 'RPM dropped to zero', { key: 'assert.c1.rpm_zero' });
            ctx.assert(!ctx.state.engineOn, 'Engine state is OFF', { key: 'assert.c1.engine_off' });
        }
    }
];
