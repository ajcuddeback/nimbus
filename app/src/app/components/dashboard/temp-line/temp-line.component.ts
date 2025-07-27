import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {NgxEchartsDirective} from 'ngx-echarts';
import * as R from 'remeda';
import {tempChartConfigC, tempChartConfigF} from '../chart-configs/temp-chart.config';

@Component({
  selector: 'app-temp-line',
  imports: [
    NgxEchartsDirective
  ],
  templateUrl: './temp-line.component.html',
  styleUrl: './temp-line.component.scss'
})
export class TempLineComponent implements OnChanges {
  @Input() tempData: number[];
  @Input() timestamps: string[];
  @Input() tempFormat: string;

  todaysTempOptionsF: any = R.clone(tempChartConfigF);
  todaysTempOptionsC: any = R.clone(tempChartConfigC);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timestamps'] || changes['tempFormat'] || changes['timestamps']) {
      this.modifyTempChartOptions();
    }
  }

  modifyTempChartOptions(): void {
    this.todaysTempOptionsF = {
      ...this.todaysTempOptionsF,
      xAxis: {
        ...this.todaysTempOptionsF.xAxis,
        data: this.timestamps,
      },
      series: [
        {
          ...this.todaysTempOptionsF.series[0],
          data: this.tempData.map(temp => this.getTempInF(temp)),
        }
      ]
    };

    this.todaysTempOptionsC = {
      ...this.todaysTempOptionsC,
      xAxis: {
        ...this.todaysTempOptionsC.xAxis,
        data: this.timestamps,
      },
      series: [
        {
          ...this.todaysTempOptionsC.series[0],
          data: this.tempData,
        }
      ]
    };
  }

  getTempInF(temp: number): number {
    return parseFloat((temp * (9/5) + 32).toFixed(2));
  }
}
