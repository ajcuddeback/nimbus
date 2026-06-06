import { Component, Input, OnChanges, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { ChartService } from '../../../services/chart.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-sparkline',
  imports: [NgxEchartsDirective],
  templateUrl: './sparkline.component.html',
  styleUrl: './sparkline.component.scss'
})
export class SparklineComponent implements OnChanges, OnInit {
  @Input() values: number[] = [];
  @Input() color = 'var(--accent)';
  @Input() width = 96;
  @Input() height = 30;
  @Input() fill = true;
  @Input() fluid = false;

  opts: EChartsOption = {};

  private destroyRef = inject(DestroyRef);
  private chart = inject(ChartService);
  private theme = inject(ThemeService);

  ngOnInit(): void {
    this.theme.themeChange$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.build());
  }

  ngOnChanges(): void { this.build(); }

  private build(): void {
    if (!this.values?.length) return;
    const color   = this.chart.cssToRgb(this.color);
    const lastIdx = this.values.length - 1;

    this.opts = {
      backgroundColor: 'transparent',
      animation: false,
      grid: { top: 2, right: 2, bottom: 2, left: 2 },
      xAxis: { type: 'category', show: false, boundaryGap: false },
      yAxis: { type: 'value', show: false, scale: true },
      series: [{
        type: 'line',
        data: this.values,
        smooth: 0.2,
        symbol: 'circle',
        symbolSize: (_: any, params: any) => params.dataIndex === lastIdx ? 5 : 0,
        itemStyle: { color },
        lineStyle: { color, width: 2 },
        emphasis: { disabled: true },
        ...(this.fill ? {
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: this.chart.withAlpha(color, 0.22) },
                { offset: 1, color: this.chart.withAlpha(color, 0) }
              ]
            } as any
          }
        } : {})
      }]
    };
  }
}
