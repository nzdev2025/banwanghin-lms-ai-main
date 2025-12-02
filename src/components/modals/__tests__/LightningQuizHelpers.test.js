import { describe, expect, it } from 'vitest';
import { shouldAutoCompleteSession } from '../lightningQuizHelpers';

describe('shouldAutoCompleteSession', () => {
  it('returns true when on last question, status running, and answer revealed', () => {
    const session = {
      status: 'running',
      revealAnswer: true,
      currentQuestionIndex: 2,
      questions: [{}, {}, {}],
    };
    expect(shouldAutoCompleteSession(session)).toBe(true);
  });

  it('returns false when not at last question or not revealed', () => {
    expect(
      shouldAutoCompleteSession({
        status: 'running',
        revealAnswer: false,
        currentQuestionIndex: 1,
        questions: [{}, {}, {}],
      }),
    ).toBe(false);
    expect(
      shouldAutoCompleteSession({
        status: 'running',
        revealAnswer: true,
        currentQuestionIndex: 0,
        questions: [{}, {}, {}],
      }),
    ).toBe(false);
  });
});
