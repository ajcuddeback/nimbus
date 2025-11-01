import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, map, Observable, of, startWith, tap} from 'rxjs';
import {ApiResponse} from '../models/api.interface';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private httpClient: HttpClient) {}

  get<T>(path: string, params: HttpParams): Observable<ApiResponse<T>> {
    return this.httpClient
      .get<T>(path, {params})
      .pipe(
        map((response) => {
          return {state: 'success', data: response} as const;
        }),
        startWith({state: 'loading'} as const),
        catchError(error => {
          console.error(error);
          return of({state: 'error', message: this.prettifyError(error)} as const);
        })
      );
  }

  prettifyError(err: unknown): string {
    const e = err as { status?: number; message?: string; error?: unknown };
    if (typeof e?.status === 'number') {
      if (e.status === 0) return 'Network error. Check your connection.';
      if (e.status >= 500) return 'Server error. Please try again shortly.';
      if (e.status === 404) return 'No weather found for this location.';
      if (e.status === 401 || e.status === 403) return 'You are not authorized.';
      return `Request failed (${e.status}).`;
    }
    return 'Something went wrong.';
  }

}
