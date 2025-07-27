import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import * as R from 'remeda';
import {humidityChartConfig} from '../chart-configs/humidity-chart.config';
import {windDirectionConfig} from '../chart-configs/wind-direction.config';
import {NgxEchartsDirective} from 'ngx-echarts';

@Component({
  selector: 'app-compass',
  imports: [
    NgxEchartsDirective
  ],
  templateUrl: './compass.component.html',
  styleUrl: './compass.component.scss'
})
export class CompassComponent implements OnChanges {
  @Input() direction: number;

  compassOptions: any = R.clone(windDirectionConfig);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['direction']) {
      this.modifyWindDirectionChartConfig();
    }
  }

  modifyWindDirectionChartConfig(): void {
    this.compassOptions = {
      ...this.compassOptions,
      series: [
        {
          ...this.compassOptions.series[0],
          data: [{value:  (this.direction + 180) % 360}],
        },
        {
          ...this.compassOptions.series[1],
          data: [{value: this.direction}],
        }
      ]
    };

    console.log('Compass Component mounted.', this.compassOptions);
  }
}
