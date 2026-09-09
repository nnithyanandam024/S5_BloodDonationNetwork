import { RequestState } from '../types';

export const VALID_TRANSITIONS: Record<RequestState, RequestState[]> = {
  CREATED: ['MATCHING', 'CANCELLED'],
  MATCHING: ['NOTIFIED', 'CANCELLED', 'EXPIRED'],
  NOTIFIED: ['ACCEPTED', 'DECLINED', 'MATCHING', 'CANCELLED', 'EXPIRED'],
  ACCEPTED: ['EN_ROUTE', 'CANCELLED'],
  EN_ROUTE: ['COMPLETED', 'CANCELLED'],
  DECLINED: ['MATCHING', 'EXPIRED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
};

/**
 * Validates whether a state transition is permitted by the state machine.
 */
export function isValidStateTransition(from: RequestState, to: RequestState): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return !!allowed && allowed.includes(to);
}

/**
 * Transitions request state if valid, throws descriptive error otherwise.
 */
export function validateAndTransition(
  currentState: RequestState,
  targetState: RequestState
): RequestState {
  if (!isValidStateTransition(currentState, targetState)) {
    throw new Error(
      `Invalid request state transition: Cannot transition from '${currentState}' to '${targetState}'.`
    );
  }
  return targetState;
}

export function isTerminalState(state: RequestState): boolean {
  return VALID_TRANSITIONS[state]?.length === 0;
}
