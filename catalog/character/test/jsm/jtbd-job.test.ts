import { describe, expect, it } from 'vitest';

import { collectJtbdJobIssues, JobSchema, parseJob } from '../../src/contract/situations/index.js';

describe('JTBD job contract', () => {
  it('accepts classic when / want / so clauses', () => {
    const job = JobSchema.parse({
      id: 'job:commute-home',
      text: 'Get home for dinner without a car',
      when: 'I am ready to go home from work',
      want: 'to request a ride',
      so: 'I can get home in time for dinner',
    });
    expect(job.when).toBe('I am ready to go home from work');
    expect(collectJtbdJobIssues(job)).toEqual([]);
  });

  it('parseJob rejects desire-language when', () => {
    expect(() =>
      parseJob({
        id: 'job:bad',
        text: 'Bad job',
        when: 'I want to do the thing',
        want: 'to do the thing',
        so: 'I am done with it',
      }),
    ).toThrow();
  });

  it('collapses whitespace in parsed clauses', () => {
    const job = parseJob({
      id: 'job:commute-home',
      text: 'Get home',
      when: 'I am ready   to go home\nfrom work',
      want: 'to request a ride',
      so: 'I can get home in time for dinner',
    });
    expect(job.when).toBe('I am ready to go home from work');
  });
});
