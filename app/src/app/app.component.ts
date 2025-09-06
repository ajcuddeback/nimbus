import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {DashboardComponent} from './components/dashboard/dashboard.component';
import * as echarts from 'echarts/core';
import {GaugeChart, LineChart} from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import {provideEchartsCore} from 'ngx-echarts';
import {
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  TooltipComponent,
  VisualMapComponent
} from 'echarts/components';
import {DatePipe} from '@angular/common';
import {ToolbarComponent} from './components/toolbar/toolbar.component';

echarts.use([LineChart, CanvasRenderer, GridComponent, LegendComponent, VisualMapComponent, TooltipComponent, ToolboxComponent, GaugeChart]);

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [
    provideEchartsCore({ echarts}),
    DatePipe
  ]
})
export class AppComponent {
}
