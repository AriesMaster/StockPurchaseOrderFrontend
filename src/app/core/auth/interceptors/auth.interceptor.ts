import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, of } from 'rxjs';
import { SessionService } from '../services/session.service';
import { inject, Injector } from '@angular/core';
import { AuthStore } from '../services/auth.store';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthStore);
  const injector = inject(Injector);
  const token = auth.accessToken();
  // Only attach credentials to relative, same-origin API paths.
  const trusted = /^\/api\/(?![\\/])/.test(request.url)
    && !request.url.includes('\\')
    && !request.url.split(/[?#]/)[0].split('/').some(segment => segment === '..' || segment.includes('%'));
  if (!token || !trusted || /^\/api\/auth\/(login|refresh|csrf|logout)(?:[?#]|$)/.test(request.url)) {
    return next(request);
  }
  return next(request.clone({ setHeaders: { Authorization: 'Bearer ' + token } })).pipe(
    catchError(error => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !auth.isAuthenticated()) {
        return throwError(() => error);
      }
      const refreshed = auth.accessToken() !== token
        ? of(true)
        : injector.get(SessionService).refresh();
      return refreshed.pipe(switchMap(ok => {
        const renewed = auth.accessToken();
        if (!ok || !renewed) {
          auth.clear();
          void injector.get(Router).navigateByUrl('/login', { replaceUrl: true });
          return throwError(() => error);
        }
        return next(request.clone({ setHeaders: { Authorization: 'Bearer ' + renewed } }));
      }));
    })
  );
};
