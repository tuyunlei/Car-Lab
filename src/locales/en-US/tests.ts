
import { tests_ui } from './tests_ui';
import { tests_physics } from './tests_physics';
import { tests_scenarios } from './tests_scenarios';
import { tests_evaluator } from './tests_evaluator';
import { tests_runtime } from './tests_runtime';

export const tests = {
  ...tests_ui,
  ...tests_physics,
  ...tests_scenarios,
  ...tests_evaluator,
  ...tests_runtime
};
