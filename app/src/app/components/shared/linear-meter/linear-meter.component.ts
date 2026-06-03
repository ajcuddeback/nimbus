import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-linear-meter',
  template: `
    <div>
      <div style="position:relative;height:9px;border-radius:99px;background:var(--tile);border:1px solid var(--line)">
        @if (marker) {
          <div style="position:absolute;top:50%;width:4px;height:17px;border-radius:3px;box-shadow:0 0 0 3px var(--card)"
               [style.left.%]="pct" [style.transform]="'translate(-50%,-50%)'" [style.background]="color"></div>
        } @else {
          <div style="position:absolute;inset-block:0;left:0;min-width:9px;border-radius:99px"
               [style.width.%]="pct"
               [style.background]="'linear-gradient(90deg,color-mix(in oklch,' + color + ' 70%,transparent),' + color + ')'"></div>
        }
      </div>
      @if (trackLabels) {
        <div style="display:flex;justify-content:space-between;font-size:9.5px;color:var(--ink-faint);margin-top:6px;letter-spacing:0.04em;text-transform:uppercase;font-family:var(--mono,monospace)">
          <span>{{ trackLabels[0] }}</span><span>{{ trackLabels[1] }}</span>
        </div>
      }
    </div>
  `
})
export class LinearMeterComponent {
  @Input() value = 0;
  @Input() min = 0;
  @Input() max = 100;
  @Input() color = 'var(--accent)';
  @Input() marker = false;
  @Input() trackLabels?: [string, string];

  get pct(): number {
    return Math.max(0, Math.min(100, ((this.value - this.min) / (this.max - this.min)) * 100));
  }
}
