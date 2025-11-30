
export const tests_physics = {
  'test.unit_eng_01.name': 'Engine Torque Anchors',
  'test.unit_eng_01.desc': 'Validate torque output against physical calibration anchors.',
  'test.unit_eng_01.s1': 'Check Engine Braking: 3000 RPM, 0 Throttle -> Target [-80, -20] Nm',
  'test.unit_eng_01.s2': 'Check Power Output: 3000 RPM, 1.0 Throttle -> Target > 100 Nm',

  'test.unit_gear_01.name': 'Gear Ratios & Wheel Speed',
  'test.unit_gear_01.desc': 'Check gear ratio calculations and RPM conversion.',
  'test.unit_gear_01.s1': 'Get Gear Ratio for 2nd gear',
  'test.unit_gear_01.s2': 'Calculate Total Ratio (includes Final Drive)',
  'test.unit_gear_01.s3': 'Verify RPM to WheelSpeed conversion factor',
  
  'test.unit_eng_stall_static.name': 'Stall Boundary (Invariant)',
  'test.unit_eng_stall_static.desc': 'Verify engine stalls instantly when physical state is impossible (1st gear + locked + 0 speed).',
  'test.unit_eng_stall_static.s1': 'Force 0 Speed + 1st Gear + Locked Clutch',

  'test.unit_brake_01.name': 'Brake Bias & Torque',
  'test.unit_brake_01.desc': 'Ensure brake force distribution is correct.',
  'test.unit_brake_01.s1': 'Input 100% braking',
  'test.unit_brake_01.s2': 'Check front vs rear torque against bias config',
  'test.unit_brake_01.s3': 'Verify total braking torque',

  'test.unit_tire_01.name': 'Tire Saturation Model',
  'test.unit_tire_01.desc': 'Verify soft saturation curve for tire forces.',
  'test.unit_tire_01.s1': 'Test linear region (small slip)',
  'test.unit_tire_01.s2': 'Test saturation region (large slip)',
  'test.unit_tire_01.s3': 'Ensure output does not exceed 1.0 (normalized)',

  'test.unit_input_01.name': 'Steering Sensitivity Curve',
  'test.unit_input_01.desc': 'Check steering response time (tau) vs speed.',
  'test.unit_input_01.s1': 'Sample Tau at 0 m/s',
  'test.unit_input_01.s2': 'Sample Tau at 50 m/s',
  'test.unit_input_01.s3': 'Assert Tau increases with speed',

  'log.powertrain.torque_measure': 'Torque @ {rpm}RPM, {throttle}% Thr: {torque} Nm',
  'assert.powertrain.braking_resistance': 'Engine provides braking resistance',
  'assert.powertrain.braking_limit': 'Engine braking is not excessively high (>-80Nm)',
  'assert.powertrain.positive_torque': 'Effective positive torque delivered to flywheel',
  'log.powertrain.gear_ratio': 'Gear {g} Ratio: {ratio}, Final: {final}, Total: {total}',
  'assert.powertrain.ratio_pos': 'Total ratio is positive',
  'assert.powertrain.ratio_math': 'Ratio math correct',
  
  'log.chassis.brake_dist': 'Front: {f}, Rear: {r}, Total: {total}',
  'assert.chassis.bias_match': 'Front torque matches bias',
  'assert.chassis.front_stronger': 'Front bias ensures front brakes are stronger',
  'log.chassis.sat_io': 'Input {in} -> Output {out}',
  'assert.chassis.linear_slip': 'Linear in small slip region',
  'assert.chassis.saturates': 'Saturates at 1.0',
  'assert.chassis.reach_limit': 'Reaches saturation limit (> 0.9)',
  'log.chassis.steering_tau': 'Tau @ {s}m/s: {t}s',
  'assert.chassis.steering_slow': 'Steering becomes slower/heavier at speed',
};
