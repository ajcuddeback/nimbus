import { Component } from '@angular/core';
import {WeatherData} from '../../models/weather-data.interface';
import {DatePipe} from '@angular/common';

@Component({
  selector: 'app-historical',
  imports: [
    DatePipe
  ],
  templateUrl: './historical.component.html',
  styleUrl: './historical.component.scss'
})
export class HistoricalComponent {

  date: Date = new Date();
  today: Date = new Date();

  changeDate(daysToAdd: number): void {
    const next = new Date(this.date);
    next.setDate(next.getDate() + daysToAdd);
    this.date = next;
  }

}
