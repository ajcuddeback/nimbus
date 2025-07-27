import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {NgxEchartsDirective} from "ngx-echarts";
import * as R from 'remeda';
import {rainfallChartConfig} from '../chart-configs/rainfall-total-chart.config';

@Component({
  selector: 'app-rainfall-line',
    imports: [
        NgxEchartsDirective
    ],
  templateUrl: './rainfall-line.component.html',
  styleUrl: './rainfall-line.component.scss'
})
export class RainfallLineComponent implements OnChanges {
  @Input() rainfall: number[];
  @Input() timestamps: string[];

  rainfallOptions: any = R.clone(rainfallChartConfig);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timestamps'] || changes['rainfallOptions']) {
      this.modifyHumidityChartConfig();
    }
  }

  modifyHumidityChartConfig(): void {
    this.rainfallOptions = {
      ...this.rainfallOptions,
      xAxis: {
        ...this.rainfallOptions.xAxis,
        data: this.timestamps,
      },
      series: [
        {
          ...this.rainfallOptions.series[0],
          data: this.rainfall,
        }
      ]
    };
  }
}
