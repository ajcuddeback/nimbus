import { Component, Input, OnChanges, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { ChartService } from '../../../services/chart.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-pressure-gauge',
  imports: [NgxEchartsDirective],
  templateUrl: './pressure-gauge.component.html',
  styleUrl: './pressure-gauge.component.scss'
})
export class PressureGaugeComponent implements OnChanges, OnInit {
  @Input() value = 29.88;
  @Input() min = 29.4;
  @Input() max = 30.4;
  @Input() label = 'inHg';
  @Input() trend?: string;
  @Input() size = 132;

  opts: EChartsOption = {};

  private destroyRef = inject(DestroyRef);
  private chart = inject(ChartService);
  private theme = inject(ThemeService);

  ngOnInit(): void {
    this.theme.themeChange$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.build());
  }

  ngOnChanges(): void { this.build(); }

  private build(): void {
    const pressColor  = this.chart.cssToRgb('var(--c-press)');
    const lineColor   = this.chart.cssToRgb('var(--line)');
    const inkColor    = this.chart.cssToRgb('var(--ink)');
    const faintColor  = this.chart.cssToRgb('var(--ink-faint)');
    const valFontSize = Math.round(this.size * 0.18);
    const lblFontSize = Math.round(this.size * 0.08);

    this.opts = {
      backgroundColor: 'transparent',
      animation: false,
      series: [{
        type: 'gauge',
        silent: true,
        startAngle: 225,
        endAngle: -45,
        min: this.min,
        max: this.max,
        radius: '85%',
        center: ['50%', '50%'],
        axisLine: {
          lineStyle: { width: 7, color: [[1, lineColor]] }
        },
        progress: {
          show: true,
          width: 7,
          roundCap: true,
          itemStyle: { color: pressColor }
        },
        pointer:   { show: false },
        axisTick:  { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          show: true,
          valueAnimation: false,
          formatter: (val: number) => val.toFixed(2),
          fontSize: valFontSize,
          fontWeight: 600,
          fontFamily: 'var(--display,sans-serif)',
          color: inkColor,
          offsetCenter: [0, '-5%']
        },
        title: {
          show: true,
          offsetCenter: [0, '26%'],
          fontSize: lblFontSize,
          fontFamily: 'var(--mono,monospace)',
          color: faintColor
        },
        data: [{ value: this.value, name: this.label }]
      }]
    } as EChartsOption;
  }
}
