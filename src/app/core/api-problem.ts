import { HttpErrorResponse } from '@angular/common/http';

export interface ApiProblem {
  status: number;
  detail: string;
  code?: string;
}

export function toApiProblem(error: unknown): ApiProblem {
  if (!(error instanceof HttpErrorResponse)) {
    return { status: 0, detail: 'An unexpected error occurred.' };
  }
  const body: unknown = error.error;
  const problem = body !== null && typeof body === 'object'
    ? body as Record<string, unknown> : {};
  return {
    status: error.status,
    detail: typeof problem['detail'] === 'string' ? problem['detail']
      : error.status === 0 ? 'Unable to reach the server.' : 'The request could not be completed.',
    ...(typeof problem['code'] === 'string' ? { code: problem['code'] } : {}),
  };
}
