import { Component, Input, OnChanges, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { ChartService } from '../../../services/chart.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-nimbus-compass',
  imports: [NgxEchartsDirective],
  templateUrl: './nimbus-compass.component.html',
  styleUrl: './nimbus-compass.component.scss'
})
export class NimbusCompassComponent implements OnChanges, OnInit {
  @Input() deg = 0;
  @Input() dirName = '';
  @Input() speed = 0;
  @Input() gust?: number;
  @Input() size = 132;
  @Input() compact = false;
  @Input() showLabels = true;

  opts: EChartsOption = {};

  private destroyRef = inject(DestroyRef);
  private chart = inject(ChartService);
  private theme = inject(ThemeService);

  ngOnInit(): void {
    this.theme.themeChange$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.build());
  }

  ngOnChanges(): void { this.build(); }

  private build(): void {
    const lineColor   = this.chart.cssToRgb('var(--line)');
    const accentColor = this.chart.cssToRgb('var(--accent)');
    const tempColor   = this.chart.cssToRgb('var(--c-temp)');
    const faintColor  = this.chart.cssToRgb('var(--ink-faint)');
    const cardColor   = this.chart.cssToRgb('var(--card)');
    const labelSize   = Math.max(8, Math.round(this.size * 0.08));
    const dotR        = Math.round(this.size * 0.033);

    this.opts = {
      backgroundColor: 'transparent',
      animation: false,
      graphic: [{
        type: 'circle',
        z: 200,
        left: 'center',
        top: 'center',
        shape: { r: dotR },
        style: { fill: cardColor, stroke: accentColor, lineWidth: 2 }
      }],
      series: [{
        type: 'gauge',
        silent: true,
        startAngle: 90,
        endAngle: -270,
        min: 0,
        max: 360,
        splitNumber: 4,
        radius: '82%',
        center: ['50%', '50%'],
        axisLine: {
          lineStyle: { width: 1.5, color: [[1, lineColor]] }
        },
        splitLine: {
          length: Math.round(this.size * 0.07),
          lineStyle: { color: lineColor, width: 1.5 }
        },
        axisTick: {
          splitNumber: 9,
          length: Math.round(this.size * 0.04),
          lineStyle: { color: lineColor, width: 1 }
        },
        axisLabel: {
          show: this.showLabels,
          distance: 14,
          fontSize: labelSize,
          fontFamily: 'monospace',
          color: faintColor,
          formatter: (val: number) => {
            if (val === 0)   return '{n|N}';
            if (val === 90)  return 'E';
            if (val === 180) return 'S';
            if (val === 270) return 'W';
            return '';
          },
          rich: { n: { color: tempColor, fontWeight: 600, fontSize: labelSize } }
        },
        pointer: {
          length: '65%',
          width: Math.max(4, Math.round(this.size * 0.04)),
          itemStyle: { color: accentColor }
        },
        anchor: { show: false },
        progress: { show: false },
        detail:   { show: false },
        data: [{ value: this.deg }]
      }]
    } as EChartsOption;
  }
}
