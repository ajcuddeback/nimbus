import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {DashboardComponent} from './components/dashboard/dashboard.component';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import {provideEchartsCore} from 'ngx-echarts';
import {GridComponent, LegendComponent, VisualMapComponent} from 'echarts/components';
import {DatePipe} from '@angular/common';

echarts.use([LineChart, CanvasRenderer, GridComponent, LegendComponent, VisualMapComponent]);

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DashboardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [
    provideEchartsCore({ echarts}),
    DatePipe
  ]
})
export class AppComponent {
  title = 'app';
}
