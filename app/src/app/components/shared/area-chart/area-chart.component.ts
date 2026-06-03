import { Component, Input, OnChanges } from '@angular/core';
import { smoothPath } from '../../../utils/chart-utils';

@Component({
  selector: 'app-area-chart',
  template: `
    <div style="position:relative;width:100%" (mousemove)="onMouseMove($event)" (mouseleave)="hoverIdx = null">
      <svg [attr.viewBox]="'0 0 760 ' + height" width="100%" style="display:block;overflow:visible">
        <defs>
          <linearGradient [id]="gradId" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" [attr.stop-color]="color" stop-opacity="0.26"/>
            <stop offset="92%" [attr.stop-color]="color" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        @for (tick of ticks; track $index) {
          <line [attr.x1]="PAD_L" [attr.x2]="760 - PAD_R" [attr.y1]="tick.y" [attr.y2]="tick.y"
                stroke="var(--line)" stroke-width="1" [attr.stroke-dasharray]="$index === 0 ? '0' : '2 5'"/>
          <text [attr.x]="PAD_L - 10" [attr.y]="tick.y + 3.5" text-anchor="end"
                font-family="var(--mono,monospace)" font-size="10.5" fill="var(--ink-faint)">{{ tick.label }}</text>
        }
        @for (xl of xTicks; track $index) {
          @if (xl.show) {
            <text [attr.x]="xl.x" [attr.y]="height - 9" text-anchor="middle"
                  font-family="var(--mono,monospace)" font-size="10" fill="var(--ink-faint)">{{ xl.label }}</text>
          }
        }
        <path [attr.d]="fillD" [attr.fill]="'url(#' + gradId + ')'"/>
        <path [attr.d]="lineD" fill="none" [attr.stroke]="color" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        @if (hoverIdx != null) {
          <line [attr.x1]="pts[hoverIdx][0]" [attr.x2]="pts[hoverIdx][0]"
                [attr.y1]="PAD_T" [attr.y2]="height - PAD_B"
                stroke="var(--ink-faint)" stroke-width="1" stroke-dasharray="3 3"/>
          <circle [attr.cx]="pts[hoverIdx][0]" [attr.cy]="pts[hoverIdx][1]"
                  r="4.5" fill="var(--card)" [attr.stroke]="color" stroke-width="2.4"/>
        }
      </svg>
      @if (hoverIdx != null) {
        <div style="position:absolute;top:4px;background:var(--ink);color:var(--card);padding:7px 10px;border-radius:10px;font-size:11.5px;pointer-events:none;box-shadow:var(--shadow);white-space:nowrap;font-family:var(--mono,monospace)"
             [style.left]="tooltipLeft">
          <div style="opacity:0.6;font-size:10px">{{ labels[hoverIdx] }}</div>
          <div style="font-weight:500;margin-top:2px">{{ values[hoverIdx].toFixed(decimals) }}{{ unit }}</div>
        </div>
      }
    </div>
  `
})
export class AreaChartComponent implements OnChanges {
  @Input() values: number[] = [];
  @Input() labels: string[] = [];
  @Input() color = 'var(--c-temp)';
  @Input() unit = '';
  @Input() height = 230;
  @Input() yMin?: number;
  @Input() yMax?: number;
  @Input() yTicks = 5;
  @Input() xEvery = 3;
  @Input() decimals = 1;

  readonly PAD_L = 46;
  readonly PAD_R = 18;
  readonly PAD_T = 16;
  readonly PAD_B = 30;
  readonly W = 760;

  gradId = `ar-${Math.random().toString(36).slice(2, 9)}`;
  pts: [number, number][] = [];
  lineD = '';
  fillD = '';
  ticks: { y: number; label: string }[] = [];
  xTicks: { x: number; label: string; show: boolean }[] = [];
  hoverIdx: number | null = null;

  private get dMin(): number {
    const m = Math.min(...this.values);
    return this.yMin != null ? this.yMin : m;
  }
  private get dMax(): number {
    const m = Math.max(...this.values);
    const raw = this.yMax != null ? this.yMax : m;
    return raw === this.dMin ? this.dMin + 1 : raw;
  }

  private xFn(i: number): number {
    return this.PAD_L + (i / Math.max(1, this.values.length - 1)) * (this.W - this.PAD_L - this.PAD_R);
  }
  private yFn(v: number, dMin = this.dMin, dMax = this.dMax): number {
    return this.PAD_T + (1 - (v - dMin) / (dMax - dMin)) * (this.height - this.PAD_T - this.PAD_B);
  }

  ngOnChanges(): void {
    if (!this.values?.length) return;
    const dMin = this.dMin, dMax = this.dMax;
    this.pts = this.values.map((v, i): [number, number] => [this.xFn(i), this.yFn(v, dMin, dMax)]);
    this.lineD = smoothPath(this.pts);
    const last = this.pts[this.pts.length - 1];
    const base = this.yFn(dMin, dMin, dMax);
    this.fillD = `${this.lineD} L ${last[0]},${base} L ${this.pts[0][0]},${base} Z`;
    this.ticks = Array.from({ length: this.yTicks }, (_, i) => {
      const v = dMin + (i / (this.yTicks - 1)) * (dMax - dMin);
      return { y: this.yFn(v, dMin, dMax), label: `${Math.round(v)}${this.unit}` };
    });
    this.xTicks = this.labels.map((label, i) => ({
      x: this.xFn(i),
      label: label.replace(':00', ''),
      show: i % this.xEvery === 0 || i === this.labels.length - 1
    }));
  }

  get tooltipLeft(): string {
    if (this.hoverIdx == null) return '0';
    const pct = (this.pts[this.hoverIdx][0] / this.W) * 100;
    return `clamp(8px,calc(${pct}% - 52px),calc(100% - 116px))`;
  }

  onMouseMove(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * this.W;
    let idx = Math.round(((px - this.PAD_L) / (this.W - this.PAD_L - this.PAD_R)) * (this.values.length - 1));
    this.hoverIdx = Math.max(0, Math.min(this.values.length - 1, idx));
  }
}
