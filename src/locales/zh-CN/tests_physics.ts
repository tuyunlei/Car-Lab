
export const tests_physics = {
  'test.unit_eng_01.name': '引擎扭矩锚点测试',
  'test.unit_eng_01.desc': '验证扭矩输出是否符合物理标定锚点。',
  'test.unit_eng_01.s1': '检查发动机制动：3000 RPM, 0 油门 -> 目标 [-80, -20] Nm',
  'test.unit_eng_01.s2': '检查动力输出：3000 RPM, 1.0 油门 -> 目标 > 100 Nm',

  'test.unit_gear_01.name': '齿轮比与轮速',
  'test.unit_gear_01.desc': '检查齿轮比计算及RPM换算。',
  'test.unit_gear_01.s1': '获取2档齿轮比',
  'test.unit_gear_01.s2': '计算总传动比 (含终传比)',
  'test.unit_gear_01.s3': '验证RPM到轮速的换算因子',
  
  'test.unit_eng_stall_static.name': '熄火边界 (不变量测试)',
  'test.unit_eng_stall_static.desc': '验证当物理状态不可能维持运转时 (1档+锁死+0车速)，引擎立即熄火。',
  'test.unit_eng_stall_static.s1': '强制 0 车速 + 1 档 + 离合锁死',

  'test.unit_brake_01.name': '刹车偏置与扭矩',
  'test.unit_brake_01.desc': '确保刹车力度分配正确。',
  'test.unit_brake_01.s1': '输入 100% 刹车',
  'test.unit_brake_01.s2': '检查前后轮扭矩是否符合偏置设定',
  'test.unit_brake_01.s3': '验证总刹车扭矩',

  'test.unit_tire_01.name': '轮胎饱和模型',
  'test.unit_tire_01.desc': '验证轮胎受力的软饱和曲线。',
  'test.unit_tire_01.s1': '测试线性区（小滑移率）',
  'test.unit_tire_01.s2': '测试饱和区（大滑移率）',
  'test.unit_tire_01.s3': '确保输出不超过归一化限制 1.0',

  'test.unit_input_01.name': '转向灵敏度曲线',
  'test.unit_input_01.desc': '检查转向响应时间 (tau) 随速度的变化。',
  'test.unit_input_01.s1': '采样 0 m/s 时的 Tau',
  'test.unit_input_01.s2': '采样 50 m/s 时的 Tau',
  'test.unit_input_01.s3': '断言 Tau 随速度增加（高速转向变沉/变慢）',

  'log.powertrain.torque_measure': '扭矩测量 @ {rpm}RPM, {throttle}% 油门: {torque} Nm',
  'assert.powertrain.braking_resistance': '引擎提供制动阻力 (负扭矩)',
  'assert.powertrain.braking_limit': '发动机制动在合理范围内 (>-80Nm)',
  'assert.powertrain.positive_torque': '有效输出正扭矩',
  'log.powertrain.gear_ratio': '挡位 {g} 齿比: {ratio}, 终传比: {final}, 总齿比: {total}',
  'assert.powertrain.ratio_pos': '总齿比为正',
  'assert.powertrain.ratio_math': '总齿比计算正确',
  
  'log.chassis.brake_dist': '前轮扭矩: {f}, 后轮扭矩: {r}, 总计: {total}',
  'assert.chassis.bias_match': '前轮扭矩符合偏置设定',
  'assert.chassis.front_stronger': '前轮制动力大于后轮 (前偏置)',
  'log.chassis.sat_io': '输入 {in} -> 输出 {out}',
  'assert.chassis.linear_slip': '小滑移率区间呈线性',
  'assert.chassis.saturates': '输出饱和 (<= 1.0)',
  'assert.chassis.reach_limit': '达到饱和极限 (> 0.9)',
  'log.chassis.steering_tau': '响应时间 Tau @ {s}m/s: {t}s',
  'assert.chassis.steering_slow': '随速度增加转向变沉/变慢',
};
