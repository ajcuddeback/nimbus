import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {NgxEchartsDirective} from 'ngx-echarts';
import * as R from 'remeda';
import {humidityChartConfig} from '../chart-configs/humidity-chart.config';

@Component({
  selector: 'app-humidity-line',
  imports: [
    NgxEchartsDirective
  ],
  templateUrl: './humidity-line.component.html',
  styleUrl: './humidity-line.component.scss'
})
export class HumidityLineComponent implements OnChanges{
  @Input() humidity: number[];
  @Input() timestamps: string[];

  humidityOptions: any = R.clone(humidityChartConfig);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timestamps'] || changes['humidity']) {
      this.modifyHumidityChartConfig();
    }
  }

  modifyHumidityChartConfig(): void {
    this.humidityOptions = {
      ...this.humidityOptions,
      xAxis: {
        ...this.humidityOptions.xAxis,
        data: this.timestamps,
      },
      series: [
        {
          ...this.humidityOptions.series[0],
          data: this.humidity,
        }
      ]
    };
  }
}
