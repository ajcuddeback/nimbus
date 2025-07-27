import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {NgxEchartsDirective} from 'ngx-echarts';
import * as R from 'remeda';
import {humidityChartConfig} from '../chart-configs/humidity-chart.config';
import {pressureChartConfig} from '../chart-configs/pressure-chart.config';

@Component({
  selector: 'app-pressure-line',
  imports: [
    NgxEchartsDirective
  ],
  templateUrl: './pressure-line.component.html',
  styleUrl: './pressure-line.component.scss'
})
export class PressureLineComponent implements OnChanges {
  @Input() pressures: number[];
  @Input() timestamps: string[];

  pressureOptions: any = R.clone(pressureChartConfig);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timestamps'] || changes['pressures']) {
      this.modifyHumidityChartConfig();
    }
  }

  modifyHumidityChartConfig(): void {
    this.pressureOptions = {
      ...this.pressureOptions,
      xAxis: {
        ...this.pressureOptions.xAxis,
        data: this.timestamps,
      },
      series: [
        {
          ...this.pressureOptions.series[0],
          data: this.pressures,
        }
      ]
    };
  }
}
