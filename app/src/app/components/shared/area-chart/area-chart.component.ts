import { Component, Input, OnChanges, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { ChartService } from '../../../services/chart.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-area-chart',
  imports: [NgxEchartsDirective],
  templateUrl: './area-chart.component.html',
  styleUrl: './area-chart.component.scss'
})
export class AreaChartComponent implements OnChanges, OnInit {
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

  opts: EChartsOption = {};
  private ecInstance?: any;

  private destroyRef = inject(DestroyRef);
  private chart = inject(ChartService);
  private theme = inject(ThemeService);

  onChartInit(ec: any): void { this.ecInstance = ec; }

  ngOnInit(): void {
    this.theme.themeChange$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.build());
    fromEvent(window, 'resize').pipe(
      debounceTime(150),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.ecInstance?.resize());
  }

  ngOnChanges(): void { this.build(); }

  private build(): void {
    if (!this.values?.length) return;

    const color    = this.chart.cssToRgb(this.color);
    const inkFaint = this.chart.cssToRgb('var(--ink-faint)');
    const ink      = this.chart.cssToRgb('var(--ink)');
    const card     = this.chart.cssToRgb('var(--card)');
    const line     = this.chart.cssToRgb('var(--line)');
    const dec      = this.decimals;
    const unit     = this.unit;

    this.opts = {
      backgroundColor: 'transparent',
      animation: false,
      grid: { top: 16, right: 18, bottom: 30, left: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: this.labels.map(l => l.replace(':00', '')),
        boundaryGap: false,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          color: inkFaint,
          fontFamily: 'monospace',
          fontSize: 10,
          interval: this.xEvery - 1,
          showMaxLabel: true,
          hideOverlap: true
        }
      },
      yAxis: {
        type: 'value',
        min: this.yMin,
        max: this.yMax,
        scale: this.yMin === undefined,
        splitNumber: this.yTicks - 1,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: inkFaint,
          fontFamily: 'monospace',
          fontSize: 10.5,
          formatter: (v: number) => `${v}${unit}`
        },
        splitLine: {
          lineStyle: { color: line, type: [2, 5] as any, width: 1 }
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: { color: inkFaint, type: [3, 3] as any, width: 1 }
        },
        backgroundColor: ink,
        borderColor: 'transparent',
        borderRadius: 10,
        padding: [7, 10],
        textStyle: { color: card, fontFamily: 'monospace', fontSize: 11.5 },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          return `<span style="opacity:.6;font-size:10px;display:block">${p.name}</span>`
            + `<span style="font-weight:500;margin-top:2px;display:block">${Number(p.value).toFixed(dec)}${unit}</span>`;
        }
      },
      series: [{
        type: 'line',
        data: this.values,
        smooth: 0.2,
        symbol: 'none',
        lineStyle: { color, width: 2.4 },
        emphasis: { disabled: true },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0,    color: this.chart.withAlpha(color, 0.26) },
              { offset: 0.92, color: this.chart.withAlpha(color, 0.02) }
            ]
          } as any
        }
      }]
    };
  }
}
