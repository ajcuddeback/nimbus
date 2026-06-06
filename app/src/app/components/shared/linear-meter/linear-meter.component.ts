import { Component, Input } from '@angular/core';
import { ProgressBar } from 'primeng/progressbar';

@Component({
  selector: 'app-linear-meter',
  imports: [ProgressBar],
  templateUrl: './linear-meter.component.html',
  styleUrl: './linear-meter.component.scss'
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

  get gradientColor(): string {
    return `linear-gradient(90deg,color-mix(in oklch,${this.color} 70%,transparent),${this.color})`;
  }

  readonly trackStyle = {
    '--p-progressbar-height': '9px',
    '--p-progressbar-border-radius': '99px',
    '--p-progressbar-background': 'var(--tile)',
    'border': '1px solid var(--line)',
    'border-radius': '99px',
    'overflow': 'hidden'
  };
}
