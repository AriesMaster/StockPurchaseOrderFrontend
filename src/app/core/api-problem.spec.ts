import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { toApiProblem } from './api-problem';

describe('toApiProblem', () => {
  it('preserves a backend problem code and detail', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { code: 'QUANTITY_EXCEEDS_OUTSTANDING', detail: 'Too many units.' },
    });
    expect(toApiProblem(error)).toEqual({
      status: 409, code: 'QUANTITY_EXCEEDS_OUTSTANDING', detail: 'Too many units.',
    });
  });

  it('handles an unreachable server', () => {
    expect(toApiProblem(new HttpErrorResponse({ status: 0 })))
      .toEqual({ status: 0, detail: 'Unable to reach the server.' });
  });

  it('handles unexpected errors without exposing internal details', () => {
    expect(toApiProblem(new Error('internal details')))
      .toEqual({ status: 0, detail: 'An unexpected error occurred.' });
  });
});
