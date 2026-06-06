import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChartService {
  /** Resolves any CSS expression (including var()) to a computed rgb() string. */
  cssToRgb(expr: string): string {
    const el = document.createElement('div');
    el.style.cssText = `color:${expr};display:none`;
    document.body.appendChild(el);
    const rgb = getComputedStyle(el).color;
    document.body.removeChild(el);
    return rgb;
  }

  /** Injects an alpha channel into an rgb() string returned by cssToRgb(). */
  withAlpha(rgb: string, a: number): string {
    const m = rgb.match(/[\d.]+/g);
    if (!m || m.length < 3) return rgb;
    return `rgba(${m[0]},${m[1]},${m[2]},${a})`;
  }
}
