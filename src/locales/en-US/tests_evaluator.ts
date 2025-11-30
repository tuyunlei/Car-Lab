
export const tests_evaluator = {
  'test.unit_eval_atomic.name': 'Evaluator: Atomic Conditions',
  'test.unit_eval_atomic.desc': 'Verify numeric, boolean, and range comparisons.',
  'test.unit_eval_atomic.s1': 'Numeric Compare (GT, LT)',
  'test.unit_eval_atomic.s2': 'Boolean Compare (EQ)',
  'test.unit_eval_atomic.s3': 'Range Compare (BETWEEN)',

  'test.unit_eval_group.name': 'Evaluator: Logic Groups',
  'test.unit_eval_group.desc': 'Verify AND, OR, NOT recursive evaluation.',
  'test.unit_eval_group.s1': 'Test AND Logic',
  'test.unit_eval_group.s2': 'Test OR Logic',
  'test.unit_eval_group.s3': 'Test NOT Logic',

  'test.unit_eval_nested.name': 'Evaluator: Nested Logic',
  'test.unit_eval_nested.desc': 'Verify complex nested conditions (A AND (B OR C)).',
  'test.unit_eval_nested.s1': 'Test Nested Logic',

  // Assertions
  'assert.eval.gt_true': '{val1} > {val2} Should be True',
  'assert.eval.lt_false': '{val1} < {val2} Should be False',
  'assert.eval.eq_true': '{field} == {val} Should be True',
  'assert.eval.between_true': '{val} in [{min}, {max}] Should be True',
  'assert.eval.and_true': 'AND (T, T) -> True',
  'assert.eval.and_false': 'AND (T, F) -> False',
  'assert.eval.or_true': 'OR (F, T) -> True',
  'assert.eval.not_true': 'NOT (F) -> True',
  'assert.eval.nested_pass': 'Nested Logic Passed',
};
