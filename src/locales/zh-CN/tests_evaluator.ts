
export const tests_evaluator = {
  'test.unit_eval_atomic.name': '条件求值器：原子条件',
  'test.unit_eval_atomic.desc': '验证 ConditionEvaluator 对数值、布尔值及区间的比较逻辑。',
  'test.unit_eval_atomic.s1': '测试数值比较 (GT, LT)',
  'test.unit_eval_atomic.s2': '测试布尔比较 (EQ)',
  'test.unit_eval_atomic.s3': '测试区间比较 (BETWEEN)',

  'test.unit_eval_group.name': '条件求值器：逻辑组合',
  'test.unit_eval_group.desc': '验证 AND, OR, NOT 逻辑门的递归求值。',
  'test.unit_eval_group.s1': '测试 AND 逻辑',
  'test.unit_eval_group.s2': '测试 OR 逻辑',
  'test.unit_eval_group.s3': '测试 NOT 逻辑',

  'test.unit_eval_nested.name': '条件求值器：嵌套逻辑',
  'test.unit_eval_nested.desc': '验证复杂嵌套条件 (A AND (B OR C)) 的正确性。',
  'test.unit_eval_nested.s1': '测试嵌套逻辑求值',

  // Assertions
  'assert.eval.gt_true': '{val1} > {val2} 应为真',
  'assert.eval.lt_false': '{val1} < {val2} 应为假',
  'assert.eval.eq_true': '{field} == {val} 应为真',
  'assert.eval.between_true': '{val} 在 [{min}, {max}] 之间应为真',
  'assert.eval.and_true': 'AND (真, 真) -> 真',
  'assert.eval.and_false': 'AND (真, 假) -> 假',
  'assert.eval.or_true': 'OR (假, 真) -> 真',
  'assert.eval.not_true': 'NOT (假) -> 真',
  'assert.eval.nested_pass': '嵌套逻辑校验通过',
};
