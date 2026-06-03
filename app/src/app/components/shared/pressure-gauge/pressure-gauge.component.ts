import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-pressure-gauge',
  template: `
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
      <svg [attr.width]="size" [attr.height]="size" [attr.viewBox]="'0 0 ' + size + ' ' + size">
        <path [attr.d]="trackPath" fill="none" stroke="var(--line)" stroke-width="7" stroke-linecap="round"/>
        <path [attr.d]="fillPath" fill="none" stroke="var(--c-press)" stroke-width="7" stroke-linecap="round"/>
        <circle [attr.cx]="handleX" [attr.cy]="handleY" r="6" fill="var(--card)" stroke="var(--c-press)" stroke-width="2.5"/>
        <text [attr.x]="c" [attr.y]="c + 2" text-anchor="middle" font-family="var(--display,sans-serif)"
              font-weight="600" font-size="24" fill="var(--ink)">{{ value.toFixed(2) }}</text>
        <text [attr.x]="c" [attr.y]="c + 20" text-anchor="middle" font-family="var(--mono,monospace)"
              font-size="10.5" fill="var(--ink-faint)">{{ label }}</text>
      </svg>
      @if (trend) {
        <div style="font-family:var(--mono,monospace);font-size:11px;color:var(--ink-soft)">{{ trend }}</div>
      }
    </div>
  `
})
export class PressureGaugeComponent implements OnChanges {
  @Input() value = 29.88;
  @Input() min = 29.4;
  @Input() max = 30.4;
  @Input() label = 'inHg';
  @Input() trend?: string;
  @Input() size = 132;

  c = 66; r = 54;
  trackPath = ''; fillPath = '';
  handleX = 0; handleY = 0;

  ngOnChanges(): void {
    this.c = this.size / 2;
    this.r = this.c - 12;
    const start = 135, end = 405;
    const frac = Math.max(0, Math.min(1, (this.value - this.min) / (this.max - this.min)));
    const angle = start + frac * (end - start);
    this.trackPath = this.arc(start, end);
    this.fillPath = this.arc(start, angle);
    [this.handleX, this.handleY] = this.polar(angle);
  }

  private polar(deg: number): [number, number] {
    const a = (deg - 90) * Math.PI / 180;
    return [this.c + Math.cos(a) * this.r, this.c + Math.sin(a) * this.r];
  }

  private arc(a0: number, a1: number): string {
    const [x0, y0] = this.polar(a0);
    const [x1, y1] = this.polar(a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${x0},${y0} A ${this.r},${this.r} 0 ${large} 1 ${x1},${y1}`;
  }
}
