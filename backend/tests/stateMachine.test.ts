import {
  isValidStateTransition,
  validateAndTransition,
  isTerminalState,
} from '../src/services/stateMachine';

describe('Request State Machine', () => {
  test('permits standard happy path transitions', () => {
    expect(isValidStateTransition('CREATED', 'MATCHING')).toBe(true);
    expect(isValidStateTransition('MATCHING', 'NOTIFIED')).toBe(true);
    expect(isValidStateTransition('NOTIFIED', 'ACCEPTED')).toBe(true);
    expect(isValidStateTransition('ACCEPTED', 'EN_ROUTE')).toBe(true);
    expect(isValidStateTransition('EN_ROUTE', 'COMPLETED')).toBe(true);
  });

  test('rejects illegal jump transitions', () => {
    expect(isValidStateTransition('CREATED', 'ACCEPTED')).toBe(false);
    expect(isValidStateTransition('NOTIFIED', 'COMPLETED')).toBe(false);
    expect(isValidStateTransition('COMPLETED', 'MATCHING')).toBe(false);
  });

  test('validateAndTransition throws error on invalid state change', () => {
    expect(() => validateAndTransition('COMPLETED', 'ACCEPTED')).toThrow();
  });

  test('identifies terminal states', () => {
    expect(isTerminalState('COMPLETED')).toBe(true);
    expect(isTerminalState('CANCELLED')).toBe(true);
    expect(isTerminalState('EXPIRED')).toBe(true);
    expect(isTerminalState('NOTIFIED')).toBe(false);
    expect(isTerminalState('ACCEPTED')).toBe(false);
  });
});
