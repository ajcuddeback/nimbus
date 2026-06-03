import { Component, Input, OnChanges } from '@angular/core';
import { smoothPath } from '../../../utils/chart-utils';

@Component({
  selector: 'app-sparkline',
  template: `
    <svg [attr.width]="fluid ? '100%' : width" [attr.height]="height"
         [attr.viewBox]="'0 0 ' + width + ' ' + height"
         [attr.preserveAspectRatio]="fluid ? 'none' : 'xMidYMid meet'"
         style="display:block;overflow:visible;max-width:100%">
      @if (fill && lineD) {
        <defs>
          <linearGradient [id]="gradId" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" [attr.stop-color]="color" stop-opacity="0.22"/>
            <stop offset="100%" [attr.stop-color]="color" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path [attr.d]="fillD" [attr.fill]="'url(#' + gradId + ')'"/>
      }
      @if (lineD) {
        <path [attr.d]="lineD" fill="none" [attr.stroke]="color" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
        <circle [attr.cx]="lastX" [attr.cy]="lastY" r="2.5" [attr.fill]="color"/>
      }
    </svg>
  `
})
export class SparklineComponent implements OnChanges {
  @Input() values: number[] = [];
  @Input() color = 'var(--accent)';
  @Input() width = 96;
  @Input() height = 30;
  @Input() fill = true;
  @Input() fluid = false;

  gradId = `sp-${Math.random().toString(36).slice(2, 9)}`;
  lineD = '';
  fillD = '';
  lastX = 0;
  lastY = 0;

  ngOnChanges(): void {
    if (!this.values?.length) return;
    const { values, width, height } = this;
    const min = Math.min(...values), max = Math.max(...values);
    const range = max - min || 1;
    const pad = 3;
    const pts: [number, number][] = values.map((v, i) => [
      pad + (i / Math.max(1, values.length - 1)) * (width - pad * 2),
      height - pad - ((v - min) / range) * (height - pad * 2)
    ]);
    this.lineD = smoothPath(pts);
    const last = pts[pts.length - 1];
    const first = pts[0];
    this.lastX = last[0];
    this.lastY = last[1];
    this.fillD = `${this.lineD} L ${last[0]},${height} L ${first[0]},${height} Z`;
  }
}
