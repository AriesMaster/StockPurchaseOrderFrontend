import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from '../services/auth.store';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthStore).accessToken();
  // Only attach credentials to relative, same-origin API paths.
  const trusted = /^\/api\/(?![\\/])/.test(request.url)
    && !request.url.includes('\\')
    && !request.url.split(/[?#]/)[0].split('/').some(segment => segment === '..' || segment.includes('%'));
  if (!token || !trusted || /^\/api\/auth\/(login|refresh)(?:[?#]|$)/.test(request.url)) {
    return next(request);
  }
  return next(request.clone({ setHeaders: { Authorization: 'Bearer ' + token } }));
};
