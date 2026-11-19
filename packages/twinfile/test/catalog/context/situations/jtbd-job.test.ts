import { describe, expect, it } from 'vitest';

import {
  collectJtbdJobIssues,
  formatJtbdStatement,
  JobSchema,
  parseJob,
} from '../../../../src/contract/index.js';

describe('JTBD job contract', () => {
  it('accepts classic context / goal / outcome clauses', () => {
    const job = JobSchema.parse({
      id: 'job:commute-home',
      text: 'Get home for dinner without a car',
      context: 'I am ready to go home from work',
      goal: 'to request a ride',
      outcome: 'I can get home in time for dinner',
    });
    expect(job.context).toBe('I am ready to go home from work');
    expect(collectJtbdJobIssues(job)).toEqual([]);
  });

  it('parseJob rejects desire-language context', () => {
    expect(() =>
      parseJob({
        id: 'job:bad',
        text: 'Bad job',
        context: 'I want to do the thing',
        goal: 'to do the thing',
        outcome: 'I am done with it',
      }),
    ).toThrow();
  });

  it('collapses whitespace in parsed clauses', () => {
    const job = parseJob({
      id: 'job:commute-home',
      text: 'Get home',
      context: 'I am ready   to go home\nfrom work',
      goal: 'to request a ride',
      outcome: 'I can get home in time for dinner',
    });
    expect(job.context).toBe('I am ready to go home from work');
  });

  it('preserves MdVVP visitation tags and goal event ids', () => {
    const job = parseJob({
      id: 'explore-pavilions',
      text: 'Explore pavilions',
      context: 'When I am orienting inside the expo',
      goal: 'discover districts and pavilions',
      outcome: 'I find places worth deeper exploration',
      visitationGoal: 'converge',
      visitationSubGoal: 'explore',
      goalEventIds: ['cve:pavilion-join', 'cve:room-join'],
    });
    expect(job.visitationGoal).toBe('converge');
    expect(job.visitationSubGoal).toBe('explore');
    expect(job.goalEventIds).toEqual(['cve:pavilion-join', 'cve:room-join']);
  });

  it('formats the canonical When / I want to / so I can / without statement', () => {
    expect(
      formatJtbdStatement({
        context: 'I am ready to go home from work',
        goal: 'to request a ride',
        outcome: 'get home in time for dinner',
        without: 'guessing wait times',
      }),
    ).toBe(
      'When I am ready to go home from work, I want to request a ride, so I can get home in time for dinner without guessing wait times.',
    );
  });
});
