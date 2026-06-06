import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = false;

  private readonly _themeChange = new Subject<void>();
  readonly themeChange$ = this._themeChange.asObservable();

  constructor() {
    const saved = localStorage.getItem('nimbus-theme');
    if (saved !== null) {
      this.isDark = saved === 'dark';
    } else {
      this.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.apply();

    // Keep in sync when the OS preference changes (only if user hasn't overridden)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (localStorage.getItem('nimbus-theme') === null) {
        this.isDark = e.matches;
        this.apply();
      }
    });
  }

  toggle(): void {
    this.isDark = !this.isDark;
    localStorage.setItem('nimbus-theme', this.isDark ? 'dark' : 'light');
    this.apply();
  }

  private apply(): void {
    if (this.isDark) {
      document.documentElement.setAttribute('data-warmth', 'dark');
    } else {
      document.documentElement.removeAttribute('data-warmth');
    }
    this._themeChange.next();
  }
}
