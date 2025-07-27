import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {NgxEchartsDirective} from "ngx-echarts";
import * as R from 'remeda';
import {windSpeedChartConfig} from '../chart-configs/wind-speed-chart.config';

@Component({
  selector: 'app-wind-line',
    imports: [
        NgxEchartsDirective
    ],
  templateUrl: './wind-line.component.html',
  styleUrl: './wind-line.component.scss'
})
export class WindLineComponent implements OnChanges {
  @Input() windSpeeds: number[];
  @Input() timestamps: string[];

  windSpeedOptions: any = R.clone(windSpeedChartConfig);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timestamps'] || changes['timestamps']) {
      this.modifyWindSpeedChartConfig();
    }
  }

  modifyWindSpeedChartConfig(): void {
    this.windSpeedOptions = {
      ...this.windSpeedOptions,
      xAxis: {
        ...this.windSpeedOptions.xAxis,
        data: this.timestamps,
      },
      series: [
        {
          ...this.windSpeedOptions.series[0],
          data: this.windSpeeds,
        }
      ]
    };
  }

}
