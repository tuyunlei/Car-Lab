
export const courses = {
    'course.foundation.title': 'Foundation',
    'course.foundation.desc': 'Master the core manual skills: Clutch control, throttle blending, and smooth launches.',
    
    // A1
    'course.foundation.a1.title': 'A1: Smooth Launch',
    'course.foundation.a1.desc': 'Objective: Start engine and accelerate to 15km/h smoothly without stalling.',
    'obj.engine_start': 'Start Engine',
    'obj.reach_speed_15': 'Reach & Hold 15 km/h',

    // A2
    'course.foundation.a2.title': 'A2: Precision Stop',
    'course.foundation.a2.desc': 'Objective: Accelerate and then come to a complete stop inside the target zone.',
    'obj.reach_speed_20': 'Reach 20 km/h',
    'obj.stop_in_zone': 'Stop completely in target zone',

    // A3
    'course.foundation.a3.title': 'A3: Low Speed Control',
    'course.foundation.a3.desc': 'Objective: Maintain speed between 3-10 km/h for 8 seconds using clutch control.',
    'obj.maintain_crawl': 'Maintain 3-10 km/h (8s)',

    // A4
    'course.foundation.a4.title': 'A4: Hill Start',
    'course.foundation.a4.desc': 'Objective: Launch on a 15% slope without stalling or significant rollback.',
    'obj.climb_hill': 'Climb speed > 10 km/h',

    // --- Subject 2 ---
    'course.subject2.title': 'Subject 2 (Advanced)',
    'course.subject2.desc': 'Advanced field driving skills, including Reverse Parking and Hill Exams.',

    'lesson.sub2.reverse_park.title': 'B1: Reverse Parking',
    'lesson.sub2.reverse_park.desc': 'Test: Park in reverse without collision. Requires completion of Precision Stop & Low Speed Control.',
    'obj.park_success': 'Reverse & Stop in Spot',

    'lesson.sub2.hill_exam.title': 'B2: Hill Exam',
    'lesson.sub2.hill_exam.desc': 'Strict Mode: Launch on 15% slope. Any rollback (>1km/h) or stall results in immediate failure.',
    'obj.hill_climb_exam': 'Climb with NO Rollback',
    
    // --- Subject 2 Exam ---
    'course.subject2.exam.title': 'Exam Simulation',
    'course.subject2.exam.desc': 'Full exam simulation. Strict scoring. 90 points to pass. Collision is instant fail.',

    'lesson.sub2.reverse_park_exam.title': 'Sim: Reverse Parking',
    'lesson.sub2.reverse_park_exam.desc': 'Exam standard parking. 50s time limit. Collision fails immediately.',
    
    'lesson.sub2.hill_exam_exam.title': 'Sim: Hill Start',
    'lesson.sub2.hill_exam_exam.desc': 'Exam standard hill start. 25s time limit. >0.5m/s rollback fails immediately.',

    'lesson.current_task': 'CURRENT TASK',
    'lesson.status.running': 'RUNNING',
    'lesson.status.success': 'SUCCESS',
    'lesson.status.failed': 'FAILED',
    
    'lesson.fail_reason': 'Failure Reason',
    'lesson.fail.generic': 'Violation (Stall/Collision/Rule)',
    'lesson.fail.condition_violated': 'Critical Error (Collision/Rollback/Stall)',
    'lesson.fail.score_too_low': 'Score below passing grade',

    'lesson.hint.restart': 'Press [R] to Reset or Restart from Menu',
    'lesson.success.msg': 'Congratulations! Objectives met.',
    
    'lesson.action.retry': 'RETRY',
    'lesson.action.menu': 'EXIT',
    'lesson.action.next': 'NEXT',

    'lesson.result.score': 'SCORE',
    'lesson.result.time': 'TIME',
    'lesson.result.stalls': 'STALLS',
    'lesson.result.collisions': 'COLLISIONS',

    'hint.more_gas': 'RPM too low! Give more gas!',
    'hint.release_handbrake': 'Handbrake engaged! Press [Space] to release.',
    'hint.press_clutch_stop': 'Stopping! Press clutch to prevent stall.',
    'hint.too_fast': 'Too fast! Brake or ease off throttle.',
    'hint.rolling_back': 'Rolling back! Use brake or handbrake.',
    'hint.reverse_clutch': 'Reverse too fast! Slip the clutch.',
};
